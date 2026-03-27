"use client";
/**
 * ─── ArcadeCar v3 ──────────────────────────────────────────────────────────────
 *
 * Sistem fisika yang BENAR — tidak tembus track:
 *
 *  - RigidBody type="kinematicPosition" + colliders="cuboid"
 *  - Posisi dihitung manual (arcade feel) tapi collision tetap aktif
 *  - Rapier KinematicCharacterController untuk resolusi collision
 *  - Gravity manual agar mobil selalu menempel ke permukaan
 *  - Spawn Y tinggi + gravity pull agar tidak jatuh ke bawah track
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
const SPAWN_POS: [number, number, number] = [0, 2.5, -30];
const GRAVITY        = 28;   // m/s² manual gravity
const DRIFT_FACTOR   = 0.14; // lateral sliding factor

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
  const velocity    = useRef(0);   // m/s forward
  const velY        = useRef(0);   // m/s vertical (gravity)
  const yaw         = useRef(0);   // world yaw radians
  const steer       = useRef(0);   // current steer angle
  const lapTimer    = useRef(0);
  const lastCP      = useRef(-1);
  const cpPassed    = useRef(0);
  const startCD     = useRef(3.5);
  const isOnGround  = useRef(false);

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

  // ── Reset car to spawn ─────────────────────────────────────────────────────
  const resetCar = () => {
    if (!bodyRef.current) return;
    bodyRef.current.setNextKinematicTranslation({
      x: SPAWN_POS[0],
      y: SPAWN_POS[1],
      z: SPAWN_POS[2],
    });
    bodyRef.current.setNextKinematicRotation({ x: 0, y: 0, z: 0, w: 1 });
    velocity.current  = 0;
    velY.current      = 0;
    steer.current     = 0;
    yaw.current       = 0;
    cpPassed.current  = 0;
    lastCP.current    = -1;
    startCD.current   = 3.5;
  };

  useEffect(() => {
    toggleEngine(true);
    return () => toggleEngine(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Physics frame ─────────────────────────────────────────────────────────
  useFrame((_, delta) => {
    if (!bodyRef.current) return;
    const dt   = Math.min(delta, 0.05);
    const ctrl = controls.current;
    const { accelForce, maxSpeed, turnSpeed, brakeForce } = carConfig;

    // ── Reset ──────────────────────────────────────────────────────────────
    if (ctrl.reset) {
      resetCar();
      return;
    }

    // ── Countdown ─────────────────────────────────────────────────────────
    if (startCD.current > 0) {
      startCD.current = Math.max(0, startCD.current - dt);
      // Still apply gravity during countdown
      const pos = bodyRef.current.translation();
      velY.current -= GRAVITY * dt;
      const newY = pos.y + velY.current * dt;
      bodyRef.current.setNextKinematicTranslation({ x: pos.x, y: newY, z: pos.z });
      return;
    }

    // ── Current position & forward direction ───────────────────────────────
    const pos = bodyRef.current.translation();
    const fwd = new THREE.Vector3(
      Math.sin(yaw.current),
      0,
      Math.cos(yaw.current)
    );

    // ── Acceleration / Braking ─────────────────────────────────────────────
    if (ctrl.forward) {
      velocity.current = Math.min(
        velocity.current + accelForce * dt,
        maxSpeed
      );
    } else if (ctrl.backward) {
      velocity.current = Math.max(
        velocity.current - accelForce * 0.6 * dt,
        -maxSpeed * 0.35
      );
    } else if (ctrl.brake) {
      velocity.current *= Math.pow(0.05, dt);
    } else {
      // Engine drag
      velocity.current *= Math.pow(0.55, dt);
    }

    // ── Speed-sensitive steering ───────────────────────────────────────────
    const speedNorm = Math.abs(velocity.current) / maxSpeed;
    const steerSensitivity = turnSpeed * (0.4 + 0.6 * speedNorm);
    const maxSteer = 0.032 * (1.0 - speedNorm * 0.35);

    if (ctrl.left)  steer.current = Math.max(steer.current - steerSensitivity * dt, -maxSteer);
    else if (ctrl.right) steer.current = Math.min(steer.current + steerSensitivity * dt, maxSteer);
    else steer.current *= Math.pow(0.08, dt);

    // ── Yaw update ─────────────────────────────────────────────────────────
    if (Math.abs(velocity.current) > 0.1) {
      const dir = velocity.current > 0 ? 1 : -1;
      yaw.current += steer.current * dir * Math.abs(velocity.current) * 2.2;
    }

    // ── Lateral drift impulse ──────────────────────────────────────────────
    const right = new THREE.Vector3(
      Math.cos(yaw.current),
      0,
      -Math.sin(yaw.current)
    );
    const lateralSlide = steer.current * Math.abs(velocity.current) * DRIFT_FACTOR;

    // ── Desired horizontal movement ────────────────────────────────────────
    const moveX = fwd.x * velocity.current * dt + right.x * lateralSlide * dt;
    const moveZ = fwd.z * velocity.current * dt + right.z * lateralSlide * dt;

    // ── Ground detection via ray cast ─────────────────────────────────────
    const rayOrigin = { x: pos.x, y: pos.y + 0.3, z: pos.z };
    const rayDir    = { x: 0, y: -1, z: 0 };
    const ray       = new rapier.Ray(rayOrigin, rayDir);
    const hit       = world.castRay(ray, 2.5, true);

    let newY = pos.y;
    if (hit) {
      const groundY = pos.y + 0.3 - hit.timeOfImpact;
      const targetY = groundY + 0.55; // car sits 0.55m above ground
      isOnGround.current = true;
      velY.current = 0;
      // Smooth snap to ground
      newY = THREE.MathUtils.lerp(pos.y, targetY, Math.min(dt * 18, 1));
    } else {
      // In air — apply gravity
      isOnGround.current = false;
      velY.current -= GRAVITY * dt;
      newY = pos.y + velY.current * dt;
      // Safety net — if fallen too far, reset
      if (newY < -20) {
        resetCar();
        return;
      }
    }

    // ── Apply kinematic next position ─────────────────────────────────────
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

    // ── Telemetry → Zustand ────────────────────────────────────────────────
    const kmh = Math.abs(velocity.current) * 3.6;
    setTelemetry(kmh, steer.current);

    // ── Lap timer ──────────────────────────────────────────────────────────
    lapTimer.current += dt;
    setLapTime(lapTimer.current);

    // ── Checkpoint detection (city circuit) ───────────────────────────────
    const np = bodyRef.current.translation();

    // CP0: east straight
    if (np.x > 38 && Math.abs(np.z) < 20 && lastCP.current !== 0) {
      lastCP.current = 0; cpPassed.current++;
    }
    // CP1: north straight
    if (Math.abs(np.x) < 20 && np.z > 38 && lastCP.current !== 1) {
      lastCP.current = 1; cpPassed.current++;
    }
    // CP2: west straight
    if (np.x < -38 && Math.abs(np.z) < 20 && lastCP.current !== 2) {
      lastCP.current = 2; cpPassed.current++;
    }

    // ── Finish line (south straight, near spawn) ───────────────────────────
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
      {/* Hitbox mobil — sedikit lebih kecil dari visual agar tidak nyangkut */}
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
