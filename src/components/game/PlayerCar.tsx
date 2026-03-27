"use client";

import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import type { ControlsState, CarConfig } from "@/types/game";
import { gameStore } from "@/store/gameStore";

interface Props {
  controls: React.MutableRefObject<ControlsState>;
  carConfig: CarConfig;
  onReset?: () => void;
}

const SPAWN_POS: [number, number, number] = [0, 1, -28];
const SPAWN_ROT = 0;

export default function PlayerCar({ controls, carConfig, onReset }: Props) {
  const bodyRef = useRef<RapierRigidBody>(null);
  const meshRef = useRef<THREE.Group>(null);
  const wheelRefs = useRef<THREE.Mesh[]>([]);

  // Arcade state
  const velocity = useRef(0);
  const steerAngle = useRef(0);
  const yaw = useRef(SPAWN_ROT);
  const lapTimer = useRef(0);
  const lastCheckpoint = useRef(-1);
  const checkpointsPassed = useRef(0);
  const startLineCooldown = useRef(0);

  // Reset position
  const resetCar = () => {
    if (!bodyRef.current) return;
    bodyRef.current.setTranslation({ x: SPAWN_POS[0], y: SPAWN_POS[1], z: SPAWN_POS[2] }, true);
    bodyRef.current.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
    bodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
    bodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
    velocity.current = 0;
    steerAngle.current = 0;
    yaw.current = SPAWN_ROT;
    checkpointsPassed.current = 0;
    lastCheckpoint.current = -1;
  };

  useEffect(() => {
    if (onReset) onReset();
    resetCar();
    gameStore.toggleEngine(true);
    return () => { gameStore.toggleEngine(false); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((_, delta) => {
    if (!bodyRef.current) return;
    const dt = Math.min(delta, 0.05);
    const ctrl = controls.current;

    // ── Reset ──────────────────────────────────────────────────────────────
    if (ctrl.reset) { resetCar(); return; }

    // ── Arcade physics ─────────────────────────────────────────────────────
    const { accelForce, maxSpeed, turnSpeed, brakeForce } = carConfig;

    if (ctrl.forward) {
      velocity.current = Math.min(velocity.current + accelForce * dt, maxSpeed);
    } else if (ctrl.backward) {
      velocity.current = Math.max(velocity.current - accelForce * 0.7 * dt, -maxSpeed * 0.4);
    } else if (ctrl.brake) {
      velocity.current *= Math.pow(0.05, dt);
    } else {
      // Natural deceleration
      velocity.current *= Math.pow(0.6, dt);
    }

    // Steering — only when moving
    const speedFactor = Math.abs(velocity.current) / maxSpeed;
    const effectiveTurn = turnSpeed * speedFactor * (velocity.current < 0 ? -1 : 1);

    if (ctrl.left) steerAngle.current += effectiveTurn * dt * 2.5;
    if (ctrl.right) steerAngle.current -= effectiveTurn * dt * 2.5;
    // Steer return to center
    steerAngle.current *= Math.pow(0.7, dt * 10);

    yaw.current += steerAngle.current * dt * 2;

    // Direction vector
    const dir = new THREE.Vector3(
      Math.sin(yaw.current),
      0,
      Math.cos(yaw.current)
    );

    // Apply to rigid body
    const pos = bodyRef.current.translation();
    const newPos = {
      x: pos.x + dir.x * velocity.current * dt,
      y: pos.y,
      z: pos.z + dir.z * velocity.current * dt,
    };
    bodyRef.current.setTranslation(newPos, true);
    bodyRef.current.setRotation(
      { x: 0, y: Math.sin(yaw.current / 2), z: 0, w: Math.cos(yaw.current / 2) },
      true
    );
    bodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
    bodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);

    // ── Wheel rotation ──────────────────────────────────────────────────────
    wheelRefs.current.forEach((w) => {
      if (w) w.rotation.x += velocity.current * dt * 2;
    });

    // ── Speed to store ──────────────────────────────────────────────────────
    const kmh = Math.abs(velocity.current) * 3.6;
    gameStore.setSpeed(kmh);

    // ── Lap timer ───────────────────────────────────────────────────────────
    lapTimer.current += dt;
    gameStore.setLapTime(lapTimer.current);

    // ── Start/Finish line detection ─────────────────────────────────────────
    startLineCooldown.current = Math.max(0, startLineCooldown.current - dt);
    if (
      startLineCooldown.current === 0 &&
      Math.abs(newPos.x) < 10 &&
      newPos.z < -27 &&
      newPos.z > -31
    ) {
      if (checkpointsPassed.current >= 2) {
        gameStore.completeLap();
        lapTimer.current = 0;
        checkpointsPassed.current = 0;
        startLineCooldown.current = 3;
      }
    }

    // Checkpoint: right side
    if (newPos.x > 25 && Math.abs(newPos.z) < 10 && lastCheckpoint.current !== 0) {
      lastCheckpoint.current = 0;
      checkpointsPassed.current = Math.min(checkpointsPassed.current + 1, 3);
    }
    // Checkpoint: bottom
    if (Math.abs(newPos.x) < 10 && newPos.z > 25 && lastCheckpoint.current !== 1) {
      lastCheckpoint.current = 1;
      checkpointsPassed.current = Math.min(checkpointsPassed.current + 1, 3);
    }
    // Checkpoint: left side
    if (newPos.x < -25 && Math.abs(newPos.z) < 10 && lastCheckpoint.current !== 2) {
      lastCheckpoint.current = 2;
      checkpointsPassed.current = Math.min(checkpointsPassed.current + 1, 3);
    }
  });

  const carColor = carConfig.color;

  return (
    <RigidBody
      ref={bodyRef}
      position={SPAWN_POS}
      colliders="cuboid"
      mass={1}
      linearDamping={0.5}
      angularDamping={0.9}
      lockRotations
    >
      <group ref={meshRef}>
        {/* Car body */}
        <mesh castShadow position={[0, 0.25, 0]}>
          <boxGeometry args={[1.8, 0.5, 3.8]} />
          <meshStandardMaterial color={carColor} metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Roof / cabin */}
        <mesh castShadow position={[0, 0.65, 0.2]}>
          <boxGeometry args={[1.4, 0.4, 2.0]} />
          <meshStandardMaterial color={carColor} metalness={0.4} roughness={0.4} />
        </mesh>
        {/* Windshield */}
        <mesh position={[0, 0.65, -0.8]}>
          <boxGeometry args={[1.35, 0.38, 0.05]} />
          <meshStandardMaterial color="#88ccff" transparent opacity={0.5} metalness={0.2} />
        </mesh>
        {/* Headlights */}
        {[-0.6, 0.6].map((x, i) => (
          <mesh key={i} position={[x, 0.25, -1.95]}>
            <boxGeometry args={[0.4, 0.2, 0.05]} />
            <meshStandardMaterial color="#ffffaa" emissive="#ffff44" emissiveIntensity={1} />
          </mesh>
        ))}
        {/* Taillights */}
        {[-0.6, 0.6].map((x, i) => (
          <mesh key={i} position={[x, 0.25, 1.95]}>
            <boxGeometry args={[0.4, 0.2, 0.05]} />
            <meshStandardMaterial color="#ff2200" emissive="#ff0000" emissiveIntensity={0.8} />
          </mesh>
        ))}
        {/* Wheels */}
        {[
          [-0.95, 0, -1.2],
          [0.95, 0, -1.2],
          [-0.95, 0, 1.2],
          [0.95, 0, 1.2],
        ].map((pos, i) => (
          <mesh
            key={i}
            ref={(el) => { if (el) wheelRefs.current[i] = el; }}
            position={pos as [number, number, number]}
            rotation={[0, 0, Math.PI / 2]}
            castShadow
          >
            <cylinderGeometry args={[0.35, 0.35, 0.25, 16]} />
            <meshStandardMaterial color="#111111" roughness={0.9} />
          </mesh>
        ))}
        {/* Wheel rims */}
        {[
          [-0.95, 0, -1.2],
          [0.95, 0, -1.2],
          [-0.95, 0, 1.2],
          [0.95, 0, 1.2],
        ].map((pos, i) => (
          <mesh
            key={`rim-${i}`}
            position={pos as [number, number, number]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.2, 0.2, 0.26, 8]} />
            <meshStandardMaterial color="#888888" metalness={0.8} roughness={0.2} />
          </mesh>
        ))}
      </group>
    </RigidBody>
  );
}
