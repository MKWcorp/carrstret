"use client";
/**
 * ─── ArcadeCar v4 ──────────────────────────────────────────────────────────────
 *
 * FIX SPAWN TEMBUS TRACK:
 *
 *  Masalah sebelumnya:
 *  1. Spawn Y=2.5 terlalu tinggi → jatuh bebas sebelum physics ready
 *  2. Raycast max distance 2.5m → tidak menjangkau track dari ketinggian spawn
 *  3. Physics world butuh beberapa frame sebelum collider aktif
 *
 *  Solusi:
 *  1. Spawn Y = TRACK_SURFACE_Y + CAR_HALF_HEIGHT + margin kecil (0.1)
 *     Track surface = TRACK_H/2 = 0.2, car half height = 0.45
 *     → Spawn Y = 0.2 + 0.45 + 0.1 = 0.75 (tepat di atas track)
 *  2. Raycast max distance = 8m (cukup untuk semua kondisi)
 *  3. Frame counter: skip physics 5 frame pertama, langsung set posisi
 *  4. Gunakan setNextKinematicTranslation BUKAN setTranslation
 *  5. Ground snap agresif di frame-frame awal
 * ──────────────────────────────────────────────────────────────────────────────
 */
import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import {
  RigidBody,
  RapierRigidBody,
  useRapier,
  CuboidCollider,
} from "@react-three/rapier";
import * as THREE from "three";
import type { ControlsState, CarConfig } from "@/types/game";
import { useGameStore } from "@/store/useGameStore";
import { useCinematicCamera } from "@/hooks/useCinematicCamera";
import CarMesh from "./CarMesh";

// ─── Constants ────────────────────────────────────────────────────────────────
// Track surface Y = TRACK_H / 2 = 0.4 / 2 = 0.2
// Car collider half height = 0.45
// Car sits at: 0.2 + 0.45 + 0.05 (small margin) = 0.70
const TRACK_SURFACE_Y = 0.2;
const CAR_HALF_H      = 0.45;
const SPAWN_Y         = TRACK_SURFACE_Y + CAR_HALF_H + 0.05; // = 0.70
const SPAWN_POS: [number, number, number] = [0, SPAWN_Y, -30];

const GRAVITY         = 30;    // m/s² manual gravity (lebih kuat)
const DRIFT_FACTOR    = 0.12;  // lateral sliding
const RAY_MAX_DIST    = 8.0;   // raycast max distance (lebih panjang)
const GROUND_OFFSET   = CAR_HALF_H + 0.05; // jarak center ke ground

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

  // Arcade state (refs = no re-render)
  const velocity    = useRef(0);
  const velY        = useRef(0);
  const yaw         = useRef(0);
  const steer       = useRef(0);
  const lapTimer    = useRef(0);
  const lastCP      = useRef(-1);
  const cpPassed    = useRef(0);
  const startCD     = useRef(3.5);
  const frameCount  = useRef(0);   // frame counter untuk init delay

  const { rapier, world } = useRapier();

  const { setTelemetry, toggleEngine, setLapTime, completeLap } =
    useGameStore.getState();

  // ── Cinematic camera ──────────────────────────────────────────────────────
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
    maxRoll: 0.04,
  });

  // ── Reset car ke spawn ─────────────────────────────────────────────────────
  const resetCar = () => {
    if (!bodyRef.current) return;
    velocity.current  = 0;
    velY.current      = 0;
    steer.current     = 0;
    yaw.current       = 0;
    cpPassed.current  = 0;
    lastCP.current    = -1;
    startCD.current   = 3.5;
    frameCount.current = 0;
    bodyRef.current.setNextKinematicTranslation({
      x: SPAWN_POS[0],
      y: SPAWN_POS[1],
      z: SPAWN_POS[2],
    });
    bodyRef.current.setNextKinematicRotation({ x: 0, y: 0, z: 0, w: 1 });
  };

  useEffect(() => {
    toggleEngine(true);
    return () => toggleEngine(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Physics frame ─────────────────────────────────────────────────────────
  useFrame((_, delta) => {
    if (!bodyRef.current) return;
    const dt = Math.min(delta, 0.05);

    frameCount.current++;

    // ── INIT PHASE: 10 frame pertama — paksa posisi tepat di atas track ──
    // Physics world butuh beberapa frame untuk collider aktif
    if (frameCount.current <= 10) {
      bodyRef.current.setNextKinematicTranslation({
        x: SPAWN_POS[0],
        y: SPAWN_POS[1],
        z: SPAWN_POS[2],
      });
      bodyRef.current.setNextKinematicRotation({ x: 0, y: 0, z: 0, w: 1 });
      return;
    }

    const ctrl = controls.current;
    const { accelForce, maxSpeed, turnSpeed } = carConfig;

    // ── Reset ──────────────────────────────────────────────────────────────
    if (ctrl.reset) {
      resetCar();
      return;
    }

    // ── Current position ───────────────────────────────────────────────────
    const pos = bodyRef.current.translation();

    // ── Ground detection via raycast ──────────────────────────────────────
    // Ray origin sedikit di atas center mobil
    const rayOrigin = { x: pos.x, y: pos.y + 0.5, z: pos.z };
    const rayDir    = { x: 0, y: -1, z: 0 };
    const ray       = new rapier.Ray(rayOrigin, rayDir);
    const hit       = world.castRay(ray, RAY_MAX_DIST, true);

    let newY = pos.y;
    let onGround = false;

    if (hit) {
      // groundY = origin Y - timeOfImpact
      const groundY = pos.y + 0.5 - hit.timeOfImpact;
      const targetY = groundY + GROUND_OFFSET;
      onGround = true;
      velY.current = 0;

      // Snap agresif di awal, smooth setelahnya
      const snapSpeed = frameCount.current < 30 ? 1.0 : Math.min(dt * 20, 1);
      newY = THREE.MathUtils.lerp(pos.y, targetY, snapSpeed);
    } else {
      // Udara — gravity
      velY.current -= GRAVITY * dt;
      newY = pos.y + velY.current * dt;

      // Safety net
      if (newY < -15) {
        resetCar();
        return;
      }
    }

    // ── Countdown ─────────────────────────────────────────────────────────
    if (startCD.current > 0) {
      startCD.current = Math.max(0, startCD.current - dt);
      bodyRef.current.setNextKinematicTranslation({ x: pos.x, y: newY, z: pos.z });
      return;
    }

    // ── Forward direction ──────────────────────────────────────────────────
    const fwd = new THREE.Vector3(
      Math.sin(yaw.current),
      0,
      Math.cos(yaw.current)
    );

    // ── Acceleration / Braking ─────────────────────────────────────────────
    if (ctrl.forward) {
      velocity.current = Math.min(velocity.current + accelForce * dt, maxSpeed);
    } else if (ctrl.backward) {
      velocity.current = Math.max(velocity.current - accelForce * 0.6 * dt, -maxSpeed * 0.35);
    } else if (ctrl.brake) {
      velocity.current *= Math.pow(0.05, dt);
    } else {
      velocity.current *= Math.pow(0.55, dt);
    }

    // ── Speed-sensitive steering ───────────────────────────────────────────
    const speedNorm = Math.abs(velocity.current) / maxSpeed;
    const steerSens = turnSpeed * (0.4 + 0.6 * speedNorm);
    const maxSteer  = 0.032 * (1.0 - speedNorm * 0.35);

    if (ctrl.left)       steer.current = Math.max(steer.current - steerSens * dt, -maxSteer);
    else if (ctrl.right) steer.current = Math.min(steer.current + steerSens * dt,  maxSteer);
    else                 steer.current *= Math.pow(0.08, dt);

    // ── Yaw update ─────────────────────────────────────────────────────────
    if (Math.abs(velocity.current) > 0.1) {
      const dir = velocity.current > 0 ? 1 : -1;
      yaw.current += steer.current * dir * Math.abs(velocity.current) * 2.2;
    }

    // ── Lateral drift ──────────────────────────────────────────────────────
    const right = new THREE.Vector3(
      Math.cos(yaw.current),
      0,
      -Math.sin(yaw.current)
    );
    const lateralSlide = steer.current * Math.abs(velocity.current) * DRIFT_FACTOR;

    const moveX = fwd.x * velocity.current * dt + right.x * lateralSlide * dt;
    const moveZ = fwd.z * velocity.current * dt + right.z * lateralSlide * dt;

    // ── Apply kinematic position ───────────────────────────────────────────
    bodyRef.current.setNextKinematicTranslation({
      x: pos.x + moveX,
      y: newY,
      z: pos.z + moveZ,
    });

    // ── Apply rotation ─────────────────────────────────────────────────────
    const halfYaw = yaw.current / 2;
    bodyRef.current.setNextKinematicRotation({
      x: 0,
      y: Math.sin(halfYaw),
      z: 0,
      w: Math.cos(halfYaw),
    });

    // ── Wheel visuals ──────────────────────────────────────────────────────
    const wheelSpin   = velocity.current * dt * 3.5;
    const steerVisual = steer.current * 10;

    if (wheelFLRef.current) {
      wheelFLRef.current.children[0].rotation.x += wheelSpin;
      wheelFLRef.current.rotation.y = steerVisual;
    }
    if (wheelFRRef.current) {
      wheelFRRef.current.children[0].rotation.x += wheelSpin;
      wheelFRRef.current.rotation.y = steerVisual;
    }
    if (wheelRLRef.current) wheelRLRef.current.children[0].rotation.x += wheelSpin;
    if (wheelRRRef.current) wheelRRRef.current.children[0].rotation.x += wheelSpin;

    // ── Telemetry ──────────────────────────────────────────────────────────
    const kmh = Math.abs(velocity.current) * 3.6;
    setTelemetry(kmh, steer.current);

    // ── Lap timer ──────────────────────────────────────────────────────────
    lapTimer.current += dt;
    setLapTime(lapTimer.current);

    // ── Checkpoint detection ───────────────────────────────────────────────
    const np = bodyRef.current.translation();

    if (np.x > 38 && Math.abs(np.z) < 20 && lastCP.current !== 0) {
      lastCP.current = 0; cpPassed.current++;
    }
    if (Math.abs(np.x) < 20 && np.z > 38 && lastCP.current !== 1) {
      lastCP.current = 1; cpPassed.current++;
    }
    if (np.x < -38 && Math.abs(np.z) < 20 && lastCP.current !== 2) {
      lastCP.current = 2; cpPassed.current++;
    }

    // ── Finish line ────────────────────────────────────────────────────────
    if (
      startCD.current === 0 &&
      Math.abs(np.x) < 14 &&
      np.z < -28 && np.z > -38 &&
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
      {/* Hitbox: lebar 1.9m, tinggi 0.9m, panjang 4.2m */}
      {/* Center di Y=0.45 dari pivot (pivot ada di bawah mobil) */}
      <CuboidCollider args={[0.95, 0.45, 2.1]} position={[0, 0.45, 0]} />

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
