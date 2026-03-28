"use client";
/**
 * ─── ArcadeCar v6 ──────────────────────────────────────────────────────────────
 *
 * FIX TEMBUS TEMBOK:
 *  kinematicPosition body di Rapier TIDAK punya collision response otomatis.
 *  Solusi: deteksi dinding secara manual dengan AABB check setiap frame.
 *
 * CIRCUIT LAYOUT (dari ProTrack):
 *  Outer walls: ±HALF_CIRC (±51)
 *  Inner walls: ±INNER (±37)
 *  Track width: 14 (jalan ada di antara inner dan outer)
 *  Corner: area di mana inner dan outer tidak bertemu (bebas belok)
 *
 *  Mobil dianggap berada di "straight" jika:
 *    - South straight: z < -INNER && |x| < HALF_CIRC - 2
 *    - North straight: z > INNER  && |x| < HALF_CIRC - 2
 *    - East straight:  x > INNER  && |z| < HALF_CIRC - 2
 *    - West straight:  x < -INNER && |z| < HALF_CIRC - 2
 *
 *  Di area corner (|x| > INNER && |z| > INNER), tidak ada inner wall.
 *
 * COLLISION RESPONSE:
 *  Saat mobil menyentuh wall, posisinya di-clamp dan velocity di-reflect/dampen.
 * ──────────────────────────────────────────────────────────────────────────────
 */
import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import {
  RigidBody,
  RapierRigidBody,
  CuboidCollider,
} from "@react-three/rapier";
import * as THREE from "three";
import type { ControlsState, CarConfig } from "@/types/game";
import { useGameStore } from "@/store/useGameStore";
import { useCinematicCamera } from "@/hooks/useCinematicCamera";
import CarMesh from "./CarMesh";

// ─── Circuit constants (harus sama dengan ProTrack) ───────────────────────────
const TRACK_Y    = 0.2;   // top surface of track (TRACK_H/2)
const CAR_SEAT_H = 0.45;  // half height of car collider
const CAR_Y      = TRACK_Y + CAR_SEAT_H; // = 0.65

const OUTER      = 51;    // outer wall position (HALF_CIRC)
const INNER      = 37;    // inner wall position
const CAR_HALF_W = 1.0;   // half width of car (collision margin)
const CAR_HALF_L = 2.2;   // half length of car (collision margin)

const SPAWN_POS: [number, number, number] = [0, CAR_Y, -30];
const DRIFT_FACTOR = 0.12;
const WALL_BOUNCE  = 0.3;  // velocity retained after wall hit

// ─── Wall collision check ─────────────────────────────────────────────────────
// Returns corrected {x, z} and whether a collision happened
function resolveWallCollision(
  x: number,
  z: number,
  vx: number,   // velocity X component
  vz: number,   // velocity Z component
  speed: number,
): {
  nx: number; nz: number;
  nvx: number; nvz: number;
  hit: boolean;
} {
  let nx = x, nz = z, nvx = vx, nvz = vz;
  let hit = false;

  const inCorner = Math.abs(x) > INNER && Math.abs(z) > INNER;

  // ── Outer wall clamp ──────────────────────────────────────────────────────
  if (nx + CAR_HALF_W > OUTER) {
    nx = OUTER - CAR_HALF_W;
    nvx = -Math.abs(nvx) * WALL_BOUNCE;
    hit = true;
  }
  if (nx - CAR_HALF_W < -OUTER) {
    nx = -OUTER + CAR_HALF_W;
    nvx = Math.abs(nvx) * WALL_BOUNCE;
    hit = true;
  }
  if (nz + CAR_HALF_L > OUTER) {
    nz = OUTER - CAR_HALF_L;
    nvz = -Math.abs(nvz) * WALL_BOUNCE;
    hit = true;
  }
  if (nz - CAR_HALF_L < -OUTER) {
    nz = -OUTER + CAR_HALF_L;
    nvz = Math.abs(nvz) * WALL_BOUNCE;
    hit = true;
  }

  // ── Inner wall clamp (hanya di straight, bukan corner) ───────────────────
  if (!inCorner) {
    // East inner wall (x > INNER, z di dalam range)
    if (Math.abs(z) < INNER + 2 && nx - CAR_HALF_W < -INNER && nx > -(INNER + 2)) {
      // West inner
      nx = -INNER + CAR_HALF_W;
      nvx = Math.abs(nvx) * WALL_BOUNCE;
      hit = true;
    }
    if (Math.abs(z) < INNER + 2 && nx + CAR_HALF_W > INNER && nx < INNER + 2) {
      // East inner
      nx = INNER - CAR_HALF_W;
      nvx = -Math.abs(nvx) * WALL_BOUNCE;
      hit = true;
    }
    if (Math.abs(x) < INNER + 2 && nz - CAR_HALF_L < -INNER && nz > -(INNER + 2)) {
      // South inner
      nz = -INNER + CAR_HALF_L;
      nvz = Math.abs(nvz) * WALL_BOUNCE;
      hit = true;
    }
    if (Math.abs(x) < INNER + 2 && nz + CAR_HALF_L > INNER && nz < INNER + 2) {
      // North inner
      nz = INNER - CAR_HALF_L;
      nvz = -Math.abs(nvz) * WALL_BOUNCE;
      hit = true;
    }
  }

  return { nx, nz, nvx, nvz, hit };
}

// ─── Component ────────────────────────────────────────────────────────────────
interface Props {
  controls: React.MutableRefObject<ControlsState>;
  carConfig: CarConfig;
}

export default function ArcadeCar({ controls, carConfig }: Props) {
  const bodyRef    = useRef<RapierRigidBody>(null);
  const wheelFLRef = useRef<THREE.Group>(null);
  const wheelFRRef = useRef<THREE.Group>(null);
  const wheelRLRef = useRef<THREE.Group>(null);
  const wheelRRRef = useRef<THREE.Group>(null);

  const velocity  = useRef(0);
  const yaw       = useRef(0);
  const steer     = useRef(0);
  const lapTimer  = useRef(0);
  const lastCP    = useRef(-1);
  const cpPassed  = useRef(0);
  const startCD   = useRef(3.5);

  const { setTelemetry, toggleEngine, setLapTime, completeLap } =
    useGameStore.getState();

  useCinematicCamera(bodyRef, steer, velocity, {
    baseFov: 60,
    maxFovBoost: 20,
    maxSpeed: carConfig.maxSpeed,
    distanceBehind: 11,
    heightBase: 4.5,
    heightReduction: 1.0,
    positionLerpSpeed: 7,
    lookAtLerpSpeed: 10,
    fovLerpSpeed: 4,
  });

  const resetCar = () => {
    if (!bodyRef.current) return;
    velocity.current = 0;
    steer.current    = 0;
    yaw.current      = 0;
    cpPassed.current = 0;
    lastCP.current   = -1;
    startCD.current  = 3.5;
    bodyRef.current.setNextKinematicTranslation({
      x: SPAWN_POS[0], y: CAR_Y, z: SPAWN_POS[2],
    });
    bodyRef.current.setNextKinematicRotation({ x: 0, y: 0, z: 0, w: 1 });
  };

  useEffect(() => {
    toggleEngine(true);
    return () => toggleEngine(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((_, delta) => {
    if (!bodyRef.current) return;
    const dt   = Math.min(delta, 0.05);
    const ctrl = controls.current;
    const { accelForce, maxSpeed, turnSpeed } = carConfig;

    if (ctrl.reset) { resetCar(); return; }

    if (startCD.current > 0) {
      startCD.current = Math.max(0, startCD.current - dt);
      const pos = bodyRef.current.translation();
      bodyRef.current.setNextKinematicTranslation({ x: pos.x, y: CAR_Y, z: pos.z });
      return;
    }

    const pos = bodyRef.current.translation();

    // ── Acceleration ───────────────────────────────────────────────────────
    if (ctrl.forward) {
      velocity.current = Math.min(velocity.current + accelForce * dt, maxSpeed);
    } else if (ctrl.backward) {
      velocity.current = Math.max(velocity.current - accelForce * 0.6 * dt, -maxSpeed * 0.35);
    } else if (ctrl.brake) {
      velocity.current *= Math.pow(0.04, dt);
    } else {
      velocity.current *= Math.pow(0.55, dt);
    }

    // ── Steering ───────────────────────────────────────────────────────────
    const speedNorm = Math.abs(velocity.current) / maxSpeed;
    const steerSens = turnSpeed * (0.4 + 0.6 * speedNorm);
    const maxSteer  = 0.032 * (1.0 - speedNorm * 0.35);

    if (ctrl.left)       steer.current = Math.max(steer.current - steerSens * dt, -maxSteer);
    else if (ctrl.right) steer.current = Math.min(steer.current + steerSens * dt,  maxSteer);
    else                 steer.current *= Math.pow(0.08, dt);

    // ── Yaw ────────────────────────────────────────────────────────────────
    if (Math.abs(velocity.current) > 0.1) {
      const dir = velocity.current > 0 ? 1 : -1;
      yaw.current += steer.current * dir * Math.abs(velocity.current) * 2.2;
    }

    // ── Movement ───────────────────────────────────────────────────────────
    const fwd   = new THREE.Vector3(Math.sin(yaw.current), 0, Math.cos(yaw.current));
    const right = new THREE.Vector3(Math.cos(yaw.current), 0, -Math.sin(yaw.current));
    const slide = steer.current * Math.abs(velocity.current) * DRIFT_FACTOR;

    let newX = pos.x + fwd.x * velocity.current * dt + right.x * slide * dt;
    let newZ = pos.z + fwd.z * velocity.current * dt + right.z * slide * dt;

    // ── Wall collision (manual AABB) ───────────────────────────────────────
    const vx = fwd.x * velocity.current + right.x * slide;
    const vz = fwd.z * velocity.current + right.z * slide;

    const { nx, nz, nvx, nvz, hit } = resolveWallCollision(
      newX, newZ, vx, vz, velocity.current
    );

    if (hit) {
      newX = nx;
      newZ = nz;
      // Dampen speed on wall hit
      velocity.current *= WALL_BOUNCE;
    }

    // ── Apply position (Y selalu = CAR_Y) ─────────────────────────────────
    bodyRef.current.setNextKinematicTranslation({ x: newX, y: CAR_Y, z: newZ });

    // ── Apply rotation ─────────────────────────────────────────────────────
    const hy = yaw.current / 2;
    bodyRef.current.setNextKinematicRotation({
      x: 0, y: Math.sin(hy), z: 0, w: Math.cos(hy),
    });

    // ── Wheel visuals ──────────────────────────────────────────────────────
    const spin   = velocity.current * dt * 3.5;
    const steerV = steer.current * 10;
    if (wheelFLRef.current) {
      wheelFLRef.current.children[0].rotation.x += spin;
      wheelFLRef.current.rotation.y = steerV;
    }
    if (wheelFRRef.current) {
      wheelFRRef.current.children[0].rotation.x += spin;
      wheelFRRef.current.rotation.y = steerV;
    }
    if (wheelRLRef.current) wheelRLRef.current.children[0].rotation.x += spin;
    if (wheelRRRef.current) wheelRRRef.current.children[0].rotation.x += spin;

    // ── Telemetry ──────────────────────────────────────────────────────────
    setTelemetry(Math.abs(velocity.current) * 3.6, steer.current);
    lapTimer.current += dt;
    setLapTime(lapTimer.current);

    // ── Checkpoints ────────────────────────────────────────────────────────
    if (newX > 38 && Math.abs(newZ) < 20 && lastCP.current !== 0) {
      lastCP.current = 0; cpPassed.current++;
    }
    if (Math.abs(newX) < 20 && newZ > 38 && lastCP.current !== 1) {
      lastCP.current = 1; cpPassed.current++;
    }
    if (newX < -38 && Math.abs(newZ) < 20 && lastCP.current !== 2) {
      lastCP.current = 2; cpPassed.current++;
    }

    // ── Finish line ────────────────────────────────────────────────────────
    if (
      Math.abs(newX) < 14 &&
      newZ < -28 && newZ > -38 &&
      cpPassed.current >= 2
    ) {
      completeLap();
      lapTimer.current = 0;
      cpPassed.current = 0;
      lastCP.current   = -1;
      startCD.current  = 4;
    }
  });

  return (
    <RigidBody
      ref={bodyRef}
      type="kinematicPosition"
      position={SPAWN_POS}
      colliders={false}
    >
      <CuboidCollider args={[0.95, 0.45, 2.1]} position={[0, 0, 0]} />
      <CarMesh
        color={carConfig.color}
        wheelFLRef={wheelFLRef}
        wheelFRRef={wheelFRRef}
        wheelRLRef={wheelRLRef}
        wheelRRRef={wheelRRRef}
      />
    </RigidBody>
  );
}
