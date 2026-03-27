"use client";

/**
 * ─── ArcadeCar ─────────────────────────────────────────────────────────────────
 *
 * Komponen mobil dengan fisika arcade profesional:
 *
 *  1. Center of Mass diturunkan drastis → mobil tidak mudah terbalik
 *  2. Arcade Steering dengan lateral impulse → efek sliding/drift terkontrol
 *  3. Speed-sensitive steering → belok lebih presisi di kecepatan tinggi
 *  4. Wheel visual: rotasi + steer angle depan
 *  5. Struktur GLTF-ready: ganti CarMesh dengan model .glb kapan saja
 *  6. Terintegrasi dengan useCinematicCamera
 *  7. Telemetry dikirim ke Zustand store setiap frame
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, RapierRigidBody, useRapier } from "@react-three/rapier";
import * as THREE from "three";
import type { ControlsState, CarConfig } from "@/types/game";
import { useGameStore } from "@/store/useGameStore";
import { useCinematicCamera } from "@/hooks/useCinematicCamera";
import CarMesh from "./CarMesh";

// ─── Constants ────────────────────────────────────────────────────────────────

const SPAWN_POS: [number, number, number] = [0, 1.2, -28];
const GRAVITY_SCALE = 2.5;   // extra downforce
const DRIFT_LATERAL_FACTOR = 0.18; // how much lateral impulse on steer

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  controls: React.MutableRefObject<ControlsState>;
  carConfig: CarConfig;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ArcadeCar({ controls, carConfig }: Props) {
  const bodyRef    = useRef<RapierRigidBody>(null);
  const wheelFLRef = useRef<THREE.Group>(null);
  const wheelFRRef = useRef<THREE.Group>(null);
  const wheelRLRef = useRef<THREE.Group>(null);
  const wheelRRRef = useRef<THREE.Group>(null);

  // Arcade state (refs = no re-render)
  const velocity    = useRef(0);   // m/s forward
  const yaw         = useRef(0);   // world yaw radians
  const steer       = useRef(0);   // current steer angle (for camera)
  const lapTimer    = useRef(0);
  const lastCP      = useRef(-1);
  const cpPassed    = useRef(0);
  const startCD     = useRef(3);

  const { setTelemetry, toggleEngine, setLapTime, completeLap } = useGameStore.getState();

  // ── Cinematic camera ──────────────────────────────────────────────────────
  useCinematicCamera(bodyRef, steer, velocity, {
    baseFov: 58,
    maxFovBoost: 22,
    maxSpeed: carConfig.maxSpeed,
    distanceBehind: 10,
    heightBase: 4.2,
    heightReduction: 1.2,
    positionLerpSpeed: 6,
    lookAtLerpSpeed: 9,
    fovLerpSpeed: 3.5,
    maxRoll: 0.045,
  });

  // ── Init ──────────────────────────────────────────────────────────────────
  const resetCar = () => {
    if (!bodyRef.current) return;
    bodyRef.current.setTranslation({ x: SPAWN_POS[0], y: SPAWN_POS[1], z: SPAWN_POS[2] }, true);
    bodyRef.current.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
    bodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
    bodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
    velocity.current = 0;
    steer.current    = 0;
    yaw.current      = 0;
    cpPassed.current = 0;
    lastCP.current   = -1;
    startCD.current  = 3;
  };

  useEffect(() => {
    toggleEngine(true);
    return () => toggleEngine(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Physics frame ─────────────────────────────────────────────────────────
  useFrame((_, delta) => {
    if (!bodyRef.current) return;
    const dt  = Math.min(delta, 0.05);
    const ctrl = controls.current;
    const { accelForce, maxSpeed, turnSpeed, brakeForce } = carConfig;

    // ── Reset ──────────────────────────────────────────────────────────────
    if (ctrl.reset) { resetCar(); return; }

    // ── Acceleration / Braking ─────────────────────────────────────────────
    if (ctrl.forward) {
      velocity.current = Math.min(velocity.current + accelForce * dt, maxSpeed);
    } else if (ctrl.backward) {
      velocity.current = Math.max(velocity.current - accelForce * 0.55 * dt, -maxSpeed * 0.3);
    } else if (ctrl.brake) {
      // Hard brake
      velocity.current *= Math.pow(0.04, dt);
    } else {
      // Engine drag
      velocity.current *= Math.pow(0.5, dt);
    }

    // ── Speed-sensitive steering ───────────────────────────────────────────
    // At low speed: wide turn radius. At high speed: tighter, more responsive.
    const speedNorm = Math.abs(velocity.current) / maxSpeed;
    const steerSensitivity = turnSpeed * (0.4 + 0.6 * speedNorm);
    const dirSign = velocity.current >= 0 ? 1 : -1;

    if (ctrl.left)  steer.current += steerSensitivity * dirSign * dt * 2.8;
    if (ctrl.right) steer.current -= steerSensitivity * dirSign * dt * 2.8;
    // Auto-center steering
    steer.current *= Math.pow(0.55, dt * 10);

    // ── Yaw update ─────────────────────────────────────────────────────────
    yaw.current += steer.current * dt * 2.2;

    // ── Forward movement ───────────────────────────────────────────────────
    const fwd = new THREE.Vector3(Math.sin(yaw.current), 0, Math.cos(yaw.current));
    const pos = bodyRef.current.translation();
    const newPos = {
      x: pos.x + fwd.x * velocity.current * dt,
      y: pos.y,
      z: pos.z + fwd.z * velocity.current * dt,
    };

    // ── Arcade Lateral Impulse (drift feel) ────────────────────────────────
    // When steering hard at speed, push car slightly sideways → controlled slide
    if ((ctrl.left || ctrl.right) && speedNorm > 0.25) {
      const lateralDir = new THREE.Vector3(
        Math.cos(yaw.current),
        0,
        -Math.sin(yaw.current)
      );
      const lateralSign = ctrl.left ? -1 : 1;
      const impulseStrength = DRIFT_LATERAL_FACTOR * speedNorm * lateralSign;
      newPos.x += lateralDir.x * impulseStrength * dt * 60;
      newPos.z += lateralDir.z * impulseStrength * dt * 60;
    }

    // ── Apply to RigidBody ─────────────────────────────────────────────────
    bodyRef.current.setTranslation(newPos, true);
    const halfYaw = yaw.current / 2;
    bodyRef.current.setRotation(
      { x: 0, y: Math.sin(halfYaw), z: 0, w: Math.cos(halfYaw) },
      true
    );
    bodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
    bodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);

    // ── Wheel visuals ──────────────────────────────────────────────────────
    const wheelSpin = velocity.current * dt * 3;
    const steerVisual = steer.current * 8; // exaggerate for visual feedback

    // Front wheels: spin + steer
    if (wheelFLRef.current) {
      wheelFLRef.current.children[0].rotation.x += wheelSpin;
      wheelFLRef.current.rotation.y = steerVisual;
    }
    if (wheelFRRef.current) {
      wheelFRRef.current.children[0].rotation.x += wheelSpin;
      wheelFRRef.current.rotation.y = steerVisual;
    }
    // Rear wheels: spin only
    if (wheelRLRef.current) wheelRLRef.current.children[0].rotation.x += wheelSpin;
    if (wheelRRRef.current) wheelRRRef.current.children[0].rotation.x += wheelSpin;

    // ── Telemetry → Zustand ────────────────────────────────────────────────
    const kmh = Math.abs(velocity.current) * 3.6;
    setTelemetry(kmh, steer.current);

    // ── Lap timer ──────────────────────────────────────────────────────────
    lapTimer.current += dt;
    setLapTime(lapTimer.current);

    // ── Checkpoint detection ───────────────────────────────────────────────
    const np = bodyRef.current.translation();
    startCD.current = Math.max(0, startCD.current - dt);

    if (np.x > 22 && Math.abs(np.z) < 12 && lastCP.current !== 0) {
      lastCP.current = 0; cpPassed.current++;
    }
    if (Math.abs(np.x) < 12 && np.z > 22 && lastCP.current !== 1) {
      lastCP.current = 1; cpPassed.current++;
    }
    if (np.x < -22 && Math.abs(np.z) < 12 && lastCP.current !== 2) {
      lastCP.current = 2; cpPassed.current++;
    }

    // ── Finish line ────────────────────────────────────────────────────────
    if (
      startCD.current === 0 &&
      Math.abs(np.x) < 10 &&
      np.z < -26 && np.z > -32 &&
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
      position={SPAWN_POS}
      colliders="cuboid"
      mass={1200}
      gravityScale={GRAVITY_SCALE}
      linearDamping={0.6}
      angularDamping={0.99}
      lockRotations
    >
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
