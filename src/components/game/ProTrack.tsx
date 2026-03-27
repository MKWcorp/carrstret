"use client";

/**
 * ─── ProTrack ──────────────────────────────────────────────────────────────────
 *
 * Lintasan balapan 3D profesional dengan:
 *  - Tanjakan dan turunan (elevated sections)
 *  - Belokan berkontur (banked corners)
 *  - Permukaan aspal dengan detail marking
 *  - Dinding pembatas (armco barriers)
 *  - Lampu neon di pinggir track
 *  - Semua mesh sebagai RigidBody type="fixed"
 *
 * Layout: Figure-8 / Oval dengan satu elevated section
 *
 *   [START]
 *     ↑
 *  ┌──┴──┐
 *  │     │  ← elevated (tanjakan)
 *  └──┬──┘
 *     ↓ (turunan)
 *  ┌──┴──────────┐
 *  │  long curve  │
 *  └─────────────┘
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { useMemo } from "react";
import { RigidBody } from "@react-three/rapier";
import * as THREE from "three";

// ─── Helper: single track segment ────────────────────────────────────────────

interface SegmentProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  size: [number, number, number];
  color?: string;
  receiveShadow?: boolean;
  castShadow?: boolean;
  metalness?: number;
  roughness?: number;
}

function Segment({
  position,
  rotation = [0, 0, 0],
  size,
  color = "#1a1a2e",
  metalness = 0.1,
  roughness = 0.85,
}: SegmentProps) {
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh position={position} rotation={rotation} receiveShadow castShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
      </mesh>
    </RigidBody>
  );
}

// ─── Helper: wall / barrier ───────────────────────────────────────────────────

function Barrier({
  position,
  rotation = [0, 0, 0],
  size,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  size: [number, number, number];
}) {
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh position={position} rotation={rotation} castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color="#cc2200" metalness={0.3} roughness={0.6} />
      </mesh>
      {/* White stripe */}
      <mesh position={[position[0], position[1] + size[1] * 0.3, position[2]]} rotation={rotation}>
        <boxGeometry args={[size[0] + 0.01, size[1] * 0.15, size[2] + 0.01]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </RigidBody>
  );
}

// ─── Helper: neon light strip ─────────────────────────────────────────────────

function NeonStrip({
  position,
  rotation = [0, 0, 0],
  length,
  color,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  length: number;
  color: string;
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={[length, 0.08, 0.08]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={3}
        toneMapped={false}
      />
    </mesh>
  );
}

// ─── Helper: banked corner (tilted surface) ───────────────────────────────────

function BankedCorner({
  cx, cz, radius, bankAngle, yaw, width, color,
}: {
  cx: number; cz: number; radius: number;
  bankAngle: number; yaw: number;
  width: number; color: string;
}) {
  // Approximate corner with 8 segments
  const segments = 8;
  const arc = Math.PI / 2;
  const segLen = (radius * arc) / segments;

  return (
    <>
      {Array.from({ length: segments }).map((_, i) => {
        const angle = yaw + (i / segments) * arc + arc / segments / 2;
        const px = cx + Math.cos(angle) * radius;
        const pz = cz + Math.sin(angle) * radius;
        const ry = -(angle + Math.PI / 2);
        return (
          <RigidBody key={i} type="fixed" colliders="cuboid">
            <mesh
              position={[px, 0.05, pz]}
              rotation={[bankAngle, ry, 0]}
              receiveShadow
              castShadow
            >
              <boxGeometry args={[segLen + 0.1, 0.12, width]} />
              <meshStandardMaterial color={color} roughness={0.8} metalness={0.1} />
            </mesh>
          </RigidBody>
        );
      })}
    </>
  );
}

// ─── Track markings (dashes) ──────────────────────────────────────────────────

function TrackMarkings() {
  const dashes = useMemo(() => {
    const result: { pos: [number, number, number]; rot: [number, number, number] }[] = [];
    // Top straight
    for (let x = -32; x <= 32; x += 8) {
      result.push({ pos: [x, 0.07, -22], rot: [-Math.PI / 2, 0, 0] });
    }
    // Bottom straight
    for (let x = -32; x <= 32; x += 8) {
      result.push({ pos: [x, 0.07, 22], rot: [-Math.PI / 2, 0, 0] });
    }
    // Left straight
    for (let z = -22; z <= 22; z += 8) {
      result.push({ pos: [-22, 0.07, z], rot: [-Math.PI / 2, 0, Math.PI / 2] });
    }
    // Right straight
    for (let z = -22; z <= 22; z += 8) {
      result.push({ pos: [22, 0.07, z], rot: [-Math.PI / 2, 0, Math.PI / 2] });
    }
    return result;
  }, []);

  return (
    <>
      {dashes.map((d, i) => (
        <mesh key={i} position={d.pos} rotation={d.rot}>
          <planeGeometry args={[4.5, 0.55]} />
          <meshStandardMaterial color="#ffffff" opacity={0.45} transparent />
        </mesh>
      ))}
    </>
  );
}

// ─── Main Track ───────────────────────────────────────────────────────────────

const TRACK_COLOR  = "#1c1c2e";
const GRASS_COLOR  = "#0a1f0a";
const ELEV_COLOR   = "#222238";
const WALL_H       = 1.2;
const TRACK_W      = 20;
const TRACK_T      = 0.14; // thickness

export default function ProTrack() {
  return (
    <group>
      {/* ══════════════════════════════════════════════════════════════════
          GROUND
      ══════════════════════════════════════════════════════════════════ */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, -0.6, 0]} receiveShadow>
          <boxGeometry args={[300, 1, 300]} />
          <meshStandardMaterial color={GRASS_COLOR} roughness={1} />
        </mesh>
      </RigidBody>

      {/* ══════════════════════════════════════════════════════════════════
          TRACK SURFACE — Oval + Elevated Section
      ══════════════════════════════════════════════════════════════════ */}

      {/* Straight: Top (z = -22, flat) */}
      <Segment position={[0, 0, -22]} size={[80, TRACK_T, TRACK_W]} color={TRACK_COLOR} />

      {/* Straight: Bottom (z = +22, flat) */}
      <Segment position={[0, 0, 22]} size={[80, TRACK_T, TRACK_W]} color={TRACK_COLOR} />

      {/* Straight: Left (x = -22, flat) */}
      <Segment position={[-22, 0, 0]} size={[TRACK_W, TRACK_T, 80]} color={TRACK_COLOR} />

      {/* Straight: Right (x = +22) — ELEVATED section */}
      {/* Ramp up (tanjakan) */}
      <Segment
        position={[22, 1.5, -15]}
        rotation={[0.12, 0, 0]}
        size={[TRACK_W, TRACK_T, 18]}
        color={ELEV_COLOR}
      />
      {/* Elevated flat */}
      <Segment position={[22, 2.8, 0]} size={[TRACK_W, TRACK_T, 18]} color={ELEV_COLOR} />
      {/* Ramp down (turunan) */}
      <Segment
        position={[22, 1.5, 15]}
        rotation={[-0.12, 0, 0]}
        size={[TRACK_W, TRACK_T, 18]}
        color={ELEV_COLOR}
      />

      {/* Corners (flat) */}
      <Segment position={[-22, 0, -22]} size={[TRACK_W, TRACK_T, TRACK_W]} color={TRACK_COLOR} />
      <Segment position={[ 22, 0, -22]} size={[TRACK_W, TRACK_T, TRACK_W]} color={TRACK_COLOR} />
      <Segment position={[-22, 0,  22]} size={[TRACK_W, TRACK_T, TRACK_W]} color={TRACK_COLOR} />
      <Segment position={[ 22, 0,  22]} size={[TRACK_W, TRACK_T, TRACK_W]} color={TRACK_COLOR} />

      {/* ══════════════════════════════════════════════════════════════════
          BANKED CORNERS (tilted surface)
      ══════════════════════════════════════════════════════════════════ */}
      <BankedCorner cx={-32} cz={-32} radius={10} bankAngle={0.1}  yaw={Math.PI}        width={TRACK_W} color={TRACK_COLOR} />
      <BankedCorner cx={ 32} cz={-32} radius={10} bankAngle={0.1}  yaw={Math.PI * 1.5}  width={TRACK_W} color={TRACK_COLOR} />
      <BankedCorner cx={-32} cz={ 32} radius={10} bankAngle={0.1}  yaw={Math.PI * 0.5}  width={TRACK_W} color={TRACK_COLOR} />
      <BankedCorner cx={ 32} cz={ 32} radius={10} bankAngle={0.1}  yaw={0}              width={TRACK_W} color={TRACK_COLOR} />

      {/* ══════════════════════════════════════════════════════════════════
          OUTER WALLS / BARRIERS
      ══════════════════════════════════════════════════════════════════ */}
      {/* Top outer */}
      <Barrier position={[0, WALL_H / 2, -33]} size={[84, WALL_H, 0.5]} />
      {/* Bottom outer */}
      <Barrier position={[0, WALL_H / 2,  33]} size={[84, WALL_H, 0.5]} />
      {/* Left outer */}
      <Barrier position={[-33, WALL_H / 2, 0]} size={[0.5, WALL_H, 84]} />
      {/* Right outer */}
      <Barrier position={[ 33, WALL_H / 2, 0]} size={[0.5, WALL_H, 84]} />

      {/* ── Elevated section side walls ── */}
      <Barrier position={[12, 2.8 + WALL_H / 2, 0]} size={[0.5, WALL_H, 20]} />
      <Barrier position={[32, 2.8 + WALL_H / 2, 0]} size={[0.5, WALL_H, 20]} />

      {/* ══════════════════════════════════════════════════════════════════
          INNER ISLAND WALLS
      ══════════════════════════════════════════════════════════════════ */}
      <Barrier position={[0, WALL_H / 2, -11]} size={[40, WALL_H, 0.5]} />
      <Barrier position={[0, WALL_H / 2,  11]} size={[40, WALL_H, 0.5]} />
      <Barrier position={[-11, WALL_H / 2, 0]} size={[0.5, WALL_H, 24]} />
      <Barrier position={[ 11, WALL_H / 2, 0]} size={[0.5, WALL_H, 24]} />

      {/* ══════════════════════════════════════════════════════════════════
          TRACK MARKINGS
      ══════════════════════════════════════════════════════════════════ */}
      <TrackMarkings />

      {/* Start / Finish line */}
      <mesh position={[0, 0.08, -30]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[TRACK_W, 1.2]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* Checkered pattern overlay */}
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh key={`chk-${i}`} position={[-9 + i * 2, 0.09, -30]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1, 1.2]} />
          <meshStandardMaterial color={i % 2 === 0 ? "#000" : "#fff"} />
        </mesh>
      ))}

      {/* ══════════════════════════════════════════════════════════════════
          NEON LIGHT STRIPS (decorative, emissive)
      ══════════════════════════════════════════════════════════════════ */}
      {/* Top straight */}
      <NeonStrip position={[0, 0.1, -32.3]} length={80} color="#00ff88" />
      <NeonStrip position={[0, 0.1, -11.7]} length={80} color="#00ff88" />
      {/* Bottom straight */}
      <NeonStrip position={[0, 0.1, 32.3]} length={80} color="#0088ff" />
      <NeonStrip position={[0, 0.1, 11.7]} length={80} color="#0088ff" />
      {/* Left straight */}
      <NeonStrip position={[-32.3, 0.1, 0]} rotation={[0, Math.PI / 2, 0]} length={80} color="#ff4400" />
      {/* Right elevated section */}
      <NeonStrip position={[12.3, 2.9, 0]} rotation={[0, Math.PI / 2, 0]} length={22} color="#aa00ff" />
      <NeonStrip position={[32.3, 2.9, 0]} rotation={[0, Math.PI / 2, 0]} length={22} color="#aa00ff" />

      {/* ══════════════════════════════════════════════════════════════════
          DECORATIVE: Tire stacks at corners
      ══════════════════════════════════════════════════════════════════ */}
      {[
        [-32, -32], [32, -32], [-32, 32], [32, 32],
        [-11, -11], [11, -11], [-11, 11], [11, 11],
      ].map(([x, z], i) => (
        <group key={`tire-${i}`} position={[x, 0.3, z]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.4, 0.4, 0.6, 12]} />
            <meshStandardMaterial color="#111" roughness={0.95} />
          </mesh>
          <mesh position={[0, 0.65, 0]} castShadow>
            <cylinderGeometry args={[0.4, 0.4, 0.6, 12]} />
            <meshStandardMaterial color="#111" roughness={0.95} />
          </mesh>
        </group>
      ))}

      {/* ══════════════════════════════════════════════════════════════════
          LAMP POSTS
      ══════════════════════════════════════════════════════════════════ */}
      {[
        [-35, -20], [35, -20], [-35, 0], [35, 0], [-35, 20], [35, 20],
        [-20, -35], [0, -35], [20, -35], [-20, 35], [0, 35], [20, 35],
      ].map(([x, z], i) => (
        <group key={`lamp-${i}`} position={[x, 0, z]}>
          {/* Pole */}
          <mesh castShadow>
            <cylinderGeometry args={[0.12, 0.15, 8, 8]} />
            <meshStandardMaterial color="#334" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Light head */}
          <mesh position={[0, 4.2, 0]}>
            <boxGeometry args={[0.8, 0.3, 0.8]} />
            <meshStandardMaterial
              color="#ffffcc"
              emissive="#ffffcc"
              emissiveIntensity={2}
              toneMapped={false}
            />
          </mesh>
          {/* Actual light */}
          <pointLight
            position={[0, 4.5, 0]}
            intensity={8}
            distance={25}
            decay={2}
            color="#fff8e0"
            castShadow={false}
          />
        </group>
      ))}
    </group>
  );
}
