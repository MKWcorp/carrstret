"use client";

import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { RigidBody, RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import type { ControlsState, CarConfig } from "@/types/game";
import { gameStore } from "@/store/gameStore";

interface Props {
  controls: React.MutableRefObject<ControlsState>;
  carConfig: CarConfig;
}

const SPAWN_POS: [number, number, number] = [0, 1, -28];

export default function PlayerCarConnected({ controls, carConfig }: Props) {
  const bodyRef = useRef<RapierRigidBody>(null);
  const wheelRefs = useRef<THREE.Mesh[]>([]);
  const { camera } = useThree();

  // Arcade state
  const velocity = useRef(0);
  const steerAngle = useRef(0);
  const yaw = useRef(0);
  const lapTimer = useRef(0);
  const lastCheckpoint = useRef(-1);
  const checkpointsPassed = useRef(0);
  const startLineCooldown = useRef(3);

  // Camera smooth state
  const camPos = useRef(new THREE.Vector3(0, 6, 14));
  const camLook = useRef(new THREE.Vector3(0, 0, 0));

  const resetCar = () => {
    if (!bodyRef.current) return;
    bodyRef.current.setTranslation({ x: SPAWN_POS[0], y: SPAWN_POS[1], z: SPAWN_POS[2] }, true);
    bodyRef.current.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
    bodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
    bodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
    velocity.current = 0;
    steerAngle.current = 0;
    yaw.current = 0;
    checkpointsPassed.current = 0;
    lastCheckpoint.current = -1;
    startLineCooldown.current = 3;
  };

  useEffect(() => {
    gameStore.toggleEngine(true);
    return () => gameStore.toggleEngine(false);
  }, []);

  useFrame((_, delta) => {
    if (!bodyRef.current) return;
    const dt = Math.min(delta, 0.05);
    const ctrl = controls.current;

    if (ctrl.reset) { resetCar(); return; }

    const { accelForce, maxSpeed, turnSpeed } = carConfig;

    // ── Acceleration / Braking ────────────────────────────────────────────
    if (ctrl.forward) {
      velocity.current = Math.min(velocity.current + accelForce * dt, maxSpeed);
    } else if (ctrl.backward) {
      velocity.current = Math.max(velocity.current - accelForce * 0.6 * dt, -maxSpeed * 0.35);
    } else if (ctrl.brake) {
      velocity.current *= Math.pow(0.02, dt);
    } else {
      velocity.current *= Math.pow(0.55, dt);
    }

    // ── Steering ──────────────────────────────────────────────────────────
    const speedFactor = Math.abs(velocity.current) / maxSpeed;
    const dir = velocity.current >= 0 ? 1 : -1;
    if (ctrl.left) steerAngle.current += turnSpeed * speedFactor * dir * dt * 2.2;
    if (ctrl.right) steerAngle.current -= turnSpeed * speedFactor * dir * dt * 2.2;
    steerAngle.current *= Math.pow(0.65, dt * 10);
    yaw.current += steerAngle.current * dt * 2;

    // ── Move ──────────────────────────────────────────────────────────────
    const fwd = new THREE.Vector3(Math.sin(yaw.current), 0, Math.cos(yaw.current));
    const pos = bodyRef.current.translation();
    bodyRef.current.setTranslation(
      { x: pos.x + fwd.x * velocity.current * dt, y: pos.y, z: pos.z + fwd.z * velocity.current * dt },
      true
    );
    const halfYaw = yaw.current / 2;
    bodyRef.current.setRotation({ x: 0, y: Math.sin(halfYaw), z: 0, w: Math.cos(halfYaw) }, true);
    bodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
    bodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);

    // ── Wheel spin ────────────────────────────────────────────────────────
    wheelRefs.current.forEach((w) => { if (w) w.rotation.x += velocity.current * dt * 2; });

    // ── Speed HUD ─────────────────────────────────────────────────────────
    gameStore.setSpeed(Math.abs(velocity.current) * 3.6);

    // ── Lap timer ─────────────────────────────────────────────────────────
    lapTimer.current += dt;
    gameStore.setLapTime(lapTimer.current);

    // ── Checkpoints ───────────────────────────────────────────────────────
    const np = bodyRef.current.translation();
    startLineCooldown.current = Math.max(0, startLineCooldown.current - dt);

    if (np.x > 22 && Math.abs(np.z) < 12 && lastCheckpoint.current !== 0) {
      lastCheckpoint.current = 0; checkpointsPassed.current++;
    }
    if (Math.abs(np.x) < 12 && np.z > 22 && lastCheckpoint.current !== 1) {
      lastCheckpoint.current = 1; checkpointsPassed.current++;
    }
    if (np.x < -22 && Math.abs(np.z) < 12 && lastCheckpoint.current !== 2) {
      lastCheckpoint.current = 2; checkpointsPassed.current++;
    }

    // ── Start/Finish line ─────────────────────────────────────────────────
    if (
      startLineCooldown.current === 0 &&
      Math.abs(np.x) < 10 &&
      np.z < -26 &&
      np.z > -32 &&
      checkpointsPassed.current >= 2
    ) {
      gameStore.completeLap();
      lapTimer.current = 0;
      checkpointsPassed.current = 0;
      lastCheckpoint.current = -1;
      startLineCooldown.current = 4;
    }

    // ── Camera follow ─────────────────────────────────────────────────────
    const carPos = new THREE.Vector3(np.x, np.y, np.z);
    const carQuat = new THREE.Quaternion(0, Math.sin(halfYaw), 0, Math.cos(halfYaw));
    const offset = new THREE.Vector3(0, 5, 11).applyQuaternion(carQuat);
    const targetCamPos = carPos.clone().add(offset);
    camPos.current.lerp(targetCamPos, Math.min(6 * dt, 1));
    camera.position.copy(camPos.current);

    const targetLook = carPos.clone().add(new THREE.Vector3(0, 0.5, 0));
    camLook.current.lerp(targetLook, Math.min(8 * dt, 1));
    camera.lookAt(camLook.current);
  });

  const c = carConfig.color;

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
      <group>
        {/* Body */}
        <mesh castShadow position={[0, 0.25, 0]}>
          <boxGeometry args={[1.8, 0.5, 3.8]} />
          <meshStandardMaterial color={c} metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Cabin */}
        <mesh castShadow position={[0, 0.65, 0.2]}>
          <boxGeometry args={[1.4, 0.4, 2.0]} />
          <meshStandardMaterial color={c} metalness={0.4} roughness={0.4} />
        </mesh>
        {/* Windshield */}
        <mesh position={[0, 0.65, -0.82]}>
          <boxGeometry args={[1.35, 0.38, 0.05]} />
          <meshStandardMaterial color="#88ccff" transparent opacity={0.45} />
        </mesh>
        {/* Headlights */}
        {([-0.6, 0.6] as number[]).map((x, i) => (
          <mesh key={`hl-${i}`} position={[x, 0.25, -1.95]}>
            <boxGeometry args={[0.4, 0.2, 0.05]} />
            <meshStandardMaterial color="#ffffaa" emissive="#ffff44" emissiveIntensity={1.5} />
          </mesh>
        ))}
        {/* Taillights */}
        {([-0.6, 0.6] as number[]).map((x, i) => (
          <mesh key={`tl-${i}`} position={[x, 0.25, 1.95]}>
            <boxGeometry args={[0.4, 0.2, 0.05]} />
            <meshStandardMaterial color="#ff2200" emissive="#ff0000" emissiveIntensity={1} />
          </mesh>
        ))}
        {/* Wheels */}
        {([[-0.95, 0, -1.2], [0.95, 0, -1.2], [-0.95, 0, 1.2], [0.95, 0, 1.2]] as [number, number, number][]).map(
          (pos, i) => (
            <group key={`w-${i}`}>
              <mesh
                ref={(el) => { if (el) wheelRefs.current[i] = el; }}
                position={pos}
                rotation={[0, 0, Math.PI / 2]}
                castShadow
              >
                <cylinderGeometry args={[0.35, 0.35, 0.25, 16]} />
                <meshStandardMaterial color="#111" roughness={0.9} />
              </mesh>
              <mesh position={pos} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.2, 0.2, 0.27, 8]} />
                <meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
              </mesh>
            </group>
          )
        )}
      </group>
    </RigidBody>
  );
}
