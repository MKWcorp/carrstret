"use client";
/**
 * ─── ArcadeCar v5 ──────────────────────────────────────────────────────────────
 *
 * PENDEKATAN BARU: Pure Kinematic tanpa raycast
 *
 * Masalah raycast:
 *  - castRay di Rapier kinematic body tidak reliable di semua frame
 *  - Bisa mendeteksi collider mobil sendiri sebagai ground
 *  - Hasilnya tidak konsisten → mobil terbang atau tembus
 *
 * Solusi: Y position di-clamp ke TRACK_Y secara hardcode
 *  - Track surface selalu di Y = TRACK_H/2 = 0.2
 *  - Mobil selalu duduk di Y = TRACK_Y + CAR_SEAT_HEIGHT
 *  - Tidak ada raycast, tidak ada gravity, tidak ada velY
 *  - 100% reliable, tidak bisa terbang, tidak bisa tembus
 *  - Arcade feel tetap ada karena movement XZ tetap physics-based
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

// ─── Constants ────────────────────────────────────────────────────────────────
// Track: TRACK_H = 0.4, surface top = TRACK_H/2 = 0.2
// Car collider half height = 0.45
// Car Y = track surface + car half height = 0.2 + 0.45 = 0.65
const TRACK_Y      = 0.2;   // top surface of track
const CAR_SEAT_H   = 0.45;  // half height of car collider
const CAR_Y        = TRACK_Y + CAR_SEAT_H; // = 0.65 — mobil selalu di sini

const SPAWN_POS: [number, number, number] = [0, CAR_Y, -30];
const DRIFT_FACTOR = 0.12;

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

  // Arcade state
  const velocity  = useRef(0);
  const yaw       = useRef(0);
  const steer     = useRef(0);
  const lapTimer  = useRef(0);
  const lastCP    = useRef(-1);
  const cpPassed  = useRef(0);
  const startCD   = useRef(3.5);

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

  // ── Reset ─────────────────────────────────────────────────────────────────
  const resetCar = () => {
    if (!bodyRef.current) return;
    velocity.current = 0;
    steer.current    = 0;
    yaw.current      = 0;
    cpPassed.current = 0;
    lastCP.current   = -1;
    startCD.current  = 3.5;
    bodyRef.current.setNextKinematicTranslation({
      x: SPAWN_POS[0],
      y: CAR_Y,
      z: SPAWN_POS[2],
    });
    bodyRef.current.setNextKinematicRotation({ x: 0, y: 0, z: 0, w: 1 });
  };

  useEffect(() => {
    toggleEngine(true);
    return () => toggleEngine(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Main physics frame ─────────────────────────────────────────────────────
  useFrame((_, delta) => {
    if (!bodyRef.current) return;
    const dt   = Math.min(delta, 0.05);
    const ctrl = controls.current;
    const { accelForce, maxSpeed, turnSpeed } = carConfig;

    // ── Reset ──────────────────────────────────────────────────────────────
    if (ctrl.reset) { resetCar(); return; }

    // ── Countdown ─────────────────────────────────────────────────────────
    if (startCD.current > 0) {
      startCD.current = Math.max(0, startCD.current - dt);
      // Tetap clamp Y selama countdown
      const pos = bodyRef.current.translation();
      bodyRef.current.setNextKinematicTranslation({
        x: pos.x, y: CAR_Y, z: pos.z,
      });
      return;
    }

    // ── Get current position ───────────────────────────────────────────────
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

    // ── Speed-sensitive steering ───────────────────────────────────────────
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

    // ── Movement vectors ───────────────────────────────────────────────────
    const fwd   = new THREE.Vector3(Math.sin(yaw.current), 0, Math.cos(yaw.current));
    const right = new THREE.Vector3(Math.cos(yaw.current), 0, -Math.sin(yaw.current));
    const slide = steer.current * Math.abs(velocity.current) * DRIFT_FACTOR;

    const newX = pos.x + fwd.x * velocity.current * dt + right.x * slide * dt;
    const newZ = pos.z + fwd.z * velocity.current * dt + right.z * slide * dt;

    // ── Apply position — Y SELALU = CAR_Y (tidak bisa terbang/tembus) ──────
    bodyRef.current.setNextKinematicTranslation({ x: newX, y: CAR_Y, z: newZ });

    // ── Apply rotation ─────────────────────────────────────────────────────
    const hy = yaw.current / 2;
    bodyRef.current.setNextKinematicRotation({
      x: 0, y: Math.sin(hy), z: 0, w: Math.cos(hy),
    });

    // ── Wheel visuals ──────────────────────────────────────────────────────
    const spin  = velocity.current * dt * 3.5;
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

    // ── Lap timer ──────────────────────────────────────────────────────────
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
