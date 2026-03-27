"use client";

import { RigidBody } from "@react-three/rapier";
import * as THREE from "three";

// Checkpoint positions for lap detection
export const CHECKPOINTS = [
  new THREE.Vector3(0, 0.5, -40),
  new THREE.Vector3(40, 0.5, 0),
  new THREE.Vector3(0, 0.5, 40),
  new THREE.Vector3(-40, 0.5, 0),
];

function TrackSegment({
  position,
  rotation,
  size,
  color = "#1a1a2e",
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  size: [number, number, number];
  color?: string;
}) {
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh position={position} rotation={rotation ?? [0, 0, 0]} receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} roughness={0.8} metalness={0.1} />
      </mesh>
    </RigidBody>
  );
}

function TrackMarkings() {
  // Center line dashes on straight sections
  const dashes: [number, number, number][] = [];
  for (let i = -35; i <= 35; i += 8) {
    dashes.push([i, 0.02, -20]);
    dashes.push([i, 0.02, 20]);
    dashes.push([-20, 0.02, i]);
    dashes.push([20, 0.02, i]);
  }

  return (
    <>
      {dashes.map((pos, i) => (
        <mesh key={i} position={pos} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[4, 0.5]} />
          <meshStandardMaterial color="#ffffff" opacity={0.4} transparent />
        </mesh>
      ))}
    </>
  );
}

export default function Track() {
  const trackColor = "#1a1a2e";
  const wallColor = "#0d0d1a";
  const grassColor = "#0a2a0a";

  return (
    <group>
      {/* ── Ground / Grass ── */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, -0.5, 0]} receiveShadow>
          <boxGeometry args={[200, 1, 200]} />
          <meshStandardMaterial color={grassColor} roughness={1} />
        </mesh>
      </RigidBody>

      {/* ── Track Surface: Oval Loop ── */}
      {/* Straight top */}
      <TrackSegment position={[0, 0.01, -20]} size={[80, 0.1, 20]} color={trackColor} />
      {/* Straight bottom */}
      <TrackSegment position={[0, 0.01, 20]} size={[80, 0.1, 20]} color={trackColor} />
      {/* Straight left */}
      <TrackSegment position={[-20, 0.01, 0]} size={[20, 0.1, 80]} color={trackColor} />
      {/* Straight right */}
      <TrackSegment position={[20, 0.01, 0]} size={[20, 0.1, 80]} color={trackColor} />
      {/* Corner TL */}
      <TrackSegment position={[-20, 0.01, -20]} size={[20, 0.1, 20]} color={trackColor} />
      {/* Corner TR */}
      <TrackSegment position={[20, 0.01, -20]} size={[20, 0.1, 20]} color={trackColor} />
      {/* Corner BL */}
      <TrackSegment position={[-20, 0.01, 20]} size={[20, 0.1, 20]} color={trackColor} />
      {/* Corner BR */}
      <TrackSegment position={[20, 0.01, 20]} size={[20, 0.1, 20]} color={trackColor} />

      {/* ── Outer Walls ── */}
      <TrackSegment position={[0, 1, -32]} size={[84, 2, 2]} color={wallColor} />
      <TrackSegment position={[0, 1, 32]} size={[84, 2, 2]} color={wallColor} />
      <TrackSegment position={[-32, 1, 0]} size={[2, 2, 64]} color={wallColor} />
      <TrackSegment position={[32, 1, 0]} size={[2, 2, 64]} color={wallColor} />

      {/* ── Inner Walls (island) ── */}
      <TrackSegment position={[0, 1, -8]} size={[36, 2, 2]} color={wallColor} />
      <TrackSegment position={[0, 1, 8]} size={[36, 2, 2]} color={wallColor} />
      <TrackSegment position={[-8, 1, 0]} size={[2, 2, 20]} color={wallColor} />
      <TrackSegment position={[8, 1, 0]} size={[2, 2, 20]} color={wallColor} />

      {/* ── Track Markings ── */}
      <TrackMarkings />

      {/* ── Start/Finish Line ── */}
      <mesh position={[0, 0.02, -29]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 1]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* ── Ambient decorations: barrier cones ── */}
      {[-38, -20, 0, 20, 38].map((x) =>
        [-38, 38].map((z) => (
          <mesh key={`cone-${x}-${z}`} position={[x, 0.3, z]}>
            <coneGeometry args={[0.3, 0.6, 8]} />
            <meshStandardMaterial color={x % 4 === 0 ? "#ff6b00" : "#ff0000"} />
          </mesh>
        ))
      )}
    </group>
  );
}
