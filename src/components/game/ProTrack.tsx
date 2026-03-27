"use client";
/**
 * ─── CityTrack ─────────────────────────────────────────────────────────────────
 *
 * Lintasan balapan bergaya KOTA MALAM:
 *
 *  Layout: Sirkuit persegi besar (city block circuit)
 *
 *         [NORTH STRAIGHT]
 *    NW corner          NE corner
 *  [WEST  ]              [EAST  ]
 *  [STRAIGHT]            [STRAIGHT]
 *    SW corner          SE corner
 *         [SOUTH STRAIGHT / START]
 *
 *  Fitur:
 *  - Aspal kota gelap dengan marka jalan
 *  - Gedung-gedung pencakar langit di luar circuit
 *  - Lampu jalan neon (kuning/biru)
 *  - Barrier beton + pagar pembatas
 *  - Langit malam dengan bintang
 *  - Semua collider RigidBody type="fixed"
 * ──────────────────────────────────────────────────────────────────────────────
 */
import React, { useMemo } from "react";
import { RigidBody } from "@react-three/rapier";
import * as THREE from "three";

// ─── Track dimensions ─────────────────────────────────────────────────────────
const TRACK_W   = 14;   // lebar jalan
const TRACK_H   = 0.4;  // tebal aspal
const STRAIGHT  = 60;   // panjang straight
const CORNER_R  = 14;   // radius corner (approx box)
const WALL_H    = 1.8;  // tinggi barrier
const WALL_T    = 0.5;  // tebal barrier

// ─── Road segment ─────────────────────────────────────────────────────────────
function Road({
  position,
  size,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number];
  size: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh position={position} rotation={rotation} receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color="#1c1c1c" roughness={0.92} metalness={0.05} />
      </mesh>
    </RigidBody>
  );
}

// ─── Concrete barrier ─────────────────────────────────────────────────────────
function Barrier({
  position,
  size,
  rotation = [0, 0, 0],
  color = "#2a2a2a",
}: {
  position: [number, number, number];
  size: [number, number, number];
  rotation?: [number, number, number];
  color?: string;
}) {
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh position={position} rotation={rotation} castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} roughness={0.8} metalness={0.1} />
      </mesh>
    </RigidBody>
  );
}

// ─── Building ─────────────────────────────────────────────────────────────────
function Building({
  position,
  width,
  depth,
  height,
  color,
  emissive,
  windowColor = "#ffcc44",
}: {
  position: [number, number, number];
  width: number;
  depth: number;
  height: number;
  color: string;
  emissive?: string;
  windowColor?: string;
}) {
  return (
    <group position={position}>
      {/* Main body — NO collider, purely decorative */}
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color={color}
          roughness={0.6}
          metalness={0.3}
          emissive={emissive ?? color}
          emissiveIntensity={0.04}
        />
      </mesh>
      {/* Rooftop glow */}
      <mesh position={[0, height + 0.1, 0]}>
        <boxGeometry args={[width * 0.6, 0.15, depth * 0.6]} />
        <meshStandardMaterial
          color={windowColor}
          emissive={windowColor}
          emissiveIntensity={1.2}
        />
      </mesh>
      {/* Window grid (emissive plane) */}
      <mesh position={[0, height * 0.5, depth / 2 + 0.05]}>
        <planeGeometry args={[width * 0.85, height * 0.75]} />
        <meshStandardMaterial
          color="#000"
          emissive={windowColor}
          emissiveIntensity={0.18}
          transparent
          opacity={0.7}
        />
      </mesh>
    </group>
  );
}

// ─── Street lamp ──────────────────────────────────────────────────────────────
function StreetLamp({
  position,
  color = "#ffdd88",
}: {
  position: [number, number, number];
  color?: string;
}) {
  return (
    <group position={position}>
      {/* Pole */}
      <mesh position={[0, 3, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 6, 6]} />
        <meshStandardMaterial color="#555" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Arm */}
      <mesh position={[0.6, 5.8, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, 1.2, 6]} />
        <meshStandardMaterial color="#555" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Light head */}
      <mesh position={[1.2, 5.8, 0]}>
        <boxGeometry args={[0.3, 0.15, 0.3]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={3}
        />
      </mesh>
      {/* Point light */}
      <pointLight
        position={[1.2, 5.5, 0]}
        color={color}
        intensity={30}
        distance={18}
        decay={2}
        castShadow={false}
      />
    </group>
  );
}

// ─── Road markings (decorative, no collider) ──────────────────────────────────
function RoadMarkings() {
  // Dashed center lines along straights
  const dashes: React.ReactElement[] = [];

  // South straight (Z axis, x≈0)
  for (let i = -4; i <= 4; i++) {
    dashes.push(
      <mesh key={`s${i}`} position={[0, 0.22, -30 + i * 7]} receiveShadow>
        <boxGeometry args={[0.3, 0.02, 3.5]} />
        <meshStandardMaterial color="#ffffff" roughness={1} />
      </mesh>
    );
  }
  // North straight
  for (let i = -4; i <= 4; i++) {
    dashes.push(
      <mesh key={`n${i}`} position={[0, 0.22, 30 + i * 7]} receiveShadow>
        <boxGeometry args={[0.3, 0.02, 3.5]} />
        <meshStandardMaterial color="#ffffff" roughness={1} />
      </mesh>
    );
  }
  // East straight (X axis, z≈0)
  for (let i = -4; i <= 4; i++) {
    dashes.push(
      <mesh key={`e${i}`} position={[30 + i * 7, 0.22, 0]} receiveShadow>
        <boxGeometry args={[3.5, 0.02, 0.3]} />
        <meshStandardMaterial color="#ffffff" roughness={1} />
      </mesh>
    );
  }
  // West straight
  for (let i = -4; i <= 4; i++) {
    dashes.push(
      <mesh key={`w${i}`} position={[-30 + i * 7, 0.22, 0]} receiveShadow>
        <boxGeometry args={[3.5, 0.02, 0.3]} />
        <meshStandardMaterial color="#ffffff" roughness={1} />
      </mesh>
    );
  }

  // Start/finish line
  dashes.push(
    <mesh key="finish" position={[0, 0.22, -32]} receiveShadow>
      <boxGeometry args={[TRACK_W, 0.02, 1.2]} />
      <meshStandardMaterial color="#ffffff" roughness={1} />
    </mesh>
  );

  return <group>{dashes}</group>;
}

// ─── Main CityTrack ───────────────────────────────────────────────────────────
export default function CityTrack() {
  // ── Ground plane (city floor) ─────────────────────────────────────────────
  // ── Road segments ─────────────────────────────────────────────────────────
  // Layout: square circuit, center at (0,0)
  // Straights at ±44 on each axis, corners connecting them

  const halfS  = STRAIGHT / 2;   // 30
  const offset = halfS + CORNER_R; // 44 — center of corner

  return (
    <group>
      {/* ── Ground / City floor ── */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, -0.5, 0]} receiveShadow>
          <boxGeometry args={[300, 1, 300]} />
          <meshStandardMaterial color="#111114" roughness={0.95} metalness={0.0} />
        </mesh>
      </RigidBody>

      {/* ══ ROAD SEGMENTS ══════════════════════════════════════════════════ */}

      {/* South straight (start/finish) — Z: -44 to -44+60 = -44 to +16 */}
      <Road position={[0, TRACK_H / 2, -halfS - CORNER_R / 2]} size={[TRACK_W, TRACK_H, STRAIGHT + CORNER_R]} />

      {/* North straight */}
      <Road position={[0, TRACK_H / 2, halfS + CORNER_R / 2]} size={[TRACK_W, TRACK_H, STRAIGHT + CORNER_R]} />

      {/* East straight */}
      <Road position={[halfS + CORNER_R / 2, TRACK_H / 2, 0]} size={[STRAIGHT + CORNER_R, TRACK_H, TRACK_W]} />

      {/* West straight */}
      <Road position={[-halfS - CORNER_R / 2, TRACK_H / 2, 0]} size={[STRAIGHT + CORNER_R, TRACK_H, TRACK_W]} />

      {/* Corners (square boxes) */}
      <Road position={[ offset,  TRACK_H / 2,  offset]} size={[CORNER_R * 2, TRACK_H, CORNER_R * 2]} />
      <Road position={[-offset,  TRACK_H / 2,  offset]} size={[CORNER_R * 2, TRACK_H, CORNER_R * 2]} />
      <Road position={[ offset,  TRACK_H / 2, -offset]} size={[CORNER_R * 2, TRACK_H, CORNER_R * 2]} />
      <Road position={[-offset,  TRACK_H / 2, -offset]} size={[CORNER_R * 2, TRACK_H, CORNER_R * 2]} />

      {/* ══ BARRIERS (inner & outer) ════════════════════════════════════════ */}

      {/* --- Outer barriers --- */}
      {/* South outer */}
      <Barrier position={[0, WALL_H / 2 + TRACK_H, -offset - TRACK_W / 2 - WALL_T / 2]}
               size={[TRACK_W + CORNER_R * 4, WALL_H, WALL_T]} color="#333" />
      {/* North outer */}
      <Barrier position={[0, WALL_H / 2 + TRACK_H, offset + TRACK_W / 2 + WALL_T / 2]}
               size={[TRACK_W + CORNER_R * 4, WALL_H, WALL_T]} color="#333" />
      {/* East outer */}
      <Barrier position={[offset + TRACK_W / 2 + WALL_T / 2, WALL_H / 2 + TRACK_H, 0]}
               size={[WALL_T, WALL_H, TRACK_W + CORNER_R * 4]} color="#333" />
      {/* West outer */}
      <Barrier position={[-offset - TRACK_W / 2 - WALL_T / 2, WALL_H / 2 + TRACK_H, 0]}
               size={[WALL_T, WALL_H, TRACK_W + CORNER_R * 4]} color="#333" />

      {/* --- Inner barriers (city block center) --- */}
      {/* South inner */}
      <Barrier position={[0, WALL_H / 2 + TRACK_H, -halfS + TRACK_W / 2 + WALL_T / 2]}
               size={[TRACK_W * 2, WALL_H, WALL_T]} color="#2a2a2a" />
      {/* North inner */}
      <Barrier position={[0, WALL_H / 2 + TRACK_H, halfS - TRACK_W / 2 - WALL_T / 2]}
               size={[TRACK_W * 2, WALL_H, WALL_T]} color="#2a2a2a" />
      {/* East inner */}
      <Barrier position={[halfS - TRACK_W / 2 - WALL_T / 2, WALL_H / 2 + TRACK_H, 0]}
               size={[WALL_T, WALL_H, TRACK_W * 2]} color="#2a2a2a" />
      {/* West inner */}
      <Barrier position={[-halfS + TRACK_W / 2 + WALL_T / 2, WALL_H / 2 + TRACK_H, 0]}
               size={[WALL_T, WALL_H, TRACK_W * 2]} color="#2a2a2a" />

      {/* ══ ROAD MARKINGS ══════════════════════════════════════════════════ */}
      <RoadMarkings />

      {/* ══ STREET LAMPS ═══════════════════════════════════════════════════ */}
      {/* South straight lamps */}
      {[-20, -10, 0, 10, 20].map((z) => (
        <StreetLamp key={`sl${z}`} position={[TRACK_W / 2 + 1.5, 0, z - 30]} color="#ffdd88" />
      ))}
      {/* North straight lamps */}
      {[-20, -10, 0, 10, 20].map((z) => (
        <StreetLamp key={`nl${z}`} position={[-TRACK_W / 2 - 1.5, 0, z + 30]} color="#88ccff" />
      ))}
      {/* East straight lamps */}
      {[-20, -10, 0, 10, 20].map((x) => (
        <StreetLamp key={`el${x}`} position={[x + 30, 0, TRACK_W / 2 + 1.5]} color="#ffdd88" />
      ))}
      {/* West straight lamps */}
      {[-20, -10, 0, 10, 20].map((x) => (
        <StreetLamp key={`wl${x}`} position={[x - 30, 0, -TRACK_W / 2 - 1.5]} color="#88ccff" />
      ))}

      {/* ══ BUILDINGS ══════════════════════════════════════════════════════ */}

      {/* --- Inner city block (center island) --- */}
      <Building position={[-8, 0, -8]}  width={10} depth={10} height={35} color="#1a1a2e" windowColor="#4488ff" />
      <Building position={[8,  0, -8]}  width={8}  depth={8}  height={28} color="#16213e" windowColor="#ffaa33" />
      <Building position={[-8, 0, 8]}   width={9}  depth={9}  height={42} color="#0f3460" windowColor="#44ffcc" />
      <Building position={[8,  0, 8]}   width={11} depth={7}  height={22} color="#1a1a2e" windowColor="#ff4488" />
      <Building position={[0,  0, 0]}   width={6}  depth={6}  height={55} color="#0d0d1a" windowColor="#88aaff" emissive="#0d0d2a" />

      {/* --- Outer buildings (around the circuit) --- */}
      {/* South side */}
      <Building position={[-25, 0, -70]} width={18} depth={14} height={40} color="#1a1a2e" windowColor="#ffcc44" />
      <Building position={[0,   0, -72]} width={14} depth={10} height={60} color="#0f3460" windowColor="#44aaff" />
      <Building position={[25,  0, -70]} width={16} depth={12} height={35} color="#16213e" windowColor="#ff6644" />
      <Building position={[-45, 0, -65]} width={12} depth={10} height={25} color="#1a1a2e" windowColor="#88ff44" />
      <Building position={[45,  0, -65]} width={10} depth={12} height={30} color="#0d0d1a" windowColor="#ff44aa" />

      {/* North side */}
      <Building position={[-25, 0, 70]}  width={18} depth={14} height={45} color="#16213e" windowColor="#44ffcc" />
      <Building position={[0,   0, 72]}  width={14} depth={10} height={55} color="#1a1a2e" windowColor="#ffaa33" />
      <Building position={[25,  0, 70]}  width={16} depth={12} height={38} color="#0f3460" windowColor="#4488ff" />
      <Building position={[-45, 0, 65]}  width={12} depth={10} height={28} color="#0d0d1a" windowColor="#ff4488" />
      <Building position={[45,  0, 65]}  width={10} depth={12} height={32} color="#1a1a2e" windowColor="#88aaff" />

      {/* East side */}
      <Building position={[70, 0, -25]}  width={14} depth={18} height={42} color="#0f3460" windowColor="#ffcc44" />
      <Building position={[72, 0, 0]}    width={10} depth={14} height={58} color="#1a1a2e" windowColor="#44aaff" />
      <Building position={[70, 0, 25]}   width={12} depth={16} height={36} color="#16213e" windowColor="#ff6644" />
      <Building position={[65, 0, -45]}  width={10} depth={12} height={22} color="#0d0d1a" windowColor="#88ff44" />
      <Building position={[65, 0, 45]}   width={12} depth={10} height={28} color="#1a1a2e" windowColor="#ff44aa" />

      {/* West side */}
      <Building position={[-70, 0, -25]} width={14} depth={18} height={38} color="#16213e" windowColor="#44ffcc" />
      <Building position={[-72, 0, 0]}   width={10} depth={14} height={50} color="#0f3460" windowColor="#ffaa33" />
      <Building position={[-70, 0, 25]}  width={12} depth={16} height={44} color="#1a1a2e" windowColor="#4488ff" />
      <Building position={[-65, 0, -45]} width={10} depth={12} height={26} color="#0d0d1a" windowColor="#ff4488" />
      <Building position={[-65, 0, 45]}  width={12} depth={10} height={30} color="#16213e" windowColor="#88aaff" />

      {/* Corner buildings */}
      <Building position={[65,  0, -65]} width={20} depth={20} height={70} color="#0d0d1a" windowColor="#4488ff" emissive="#0d0d2a" />
      <Building position={[-65, 0, -65]} width={20} depth={20} height={65} color="#1a1a2e" windowColor="#ffcc44" />
      <Building position={[65,  0, 65]}  width={20} depth={20} height={75} color="#0f3460" windowColor="#44ffcc" emissive="#0a1a2a" />
      <Building position={[-65, 0, 65]}  width={20} depth={20} height={68} color="#16213e" windowColor="#ff4488" />

      {/* ══ NEON ACCENT STRIPS on barriers ════════════════════════════════ */}
      {/* South outer neon */}
      <mesh position={[0, TRACK_H + WALL_H + 0.1, -offset - TRACK_W / 2 - WALL_T / 2]}>
        <boxGeometry args={[TRACK_W + CORNER_R * 2, 0.12, 0.12]} />
        <meshStandardMaterial color="#00ccff" emissive="#00ccff" emissiveIntensity={4} />
      </mesh>
      {/* North outer neon */}
      <mesh position={[0, TRACK_H + WALL_H + 0.1, offset + TRACK_W / 2 + WALL_T / 2]}>
        <boxGeometry args={[TRACK_W + CORNER_R * 2, 0.12, 0.12]} />
        <meshStandardMaterial color="#ff4400" emissive="#ff4400" emissiveIntensity={4} />
      </mesh>
      {/* East outer neon */}
      <mesh position={[offset + TRACK_W / 2 + WALL_T / 2, TRACK_H + WALL_H + 0.1, 0]}>
        <boxGeometry args={[0.12, 0.12, TRACK_W + CORNER_R * 2]} />
        <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={4} />
      </mesh>
      {/* West outer neon */}
      <mesh position={[-offset - TRACK_W / 2 - WALL_T / 2, TRACK_H + WALL_H + 0.1, 0]}>
        <boxGeometry args={[0.12, 0.12, TRACK_W + CORNER_R * 2]} />
        <meshStandardMaterial color="#ff00aa" emissive="#ff00aa" emissiveIntensity={4} />
      </mesh>

      {/* ══ AMBIENT CITY LIGHTS ════════════════════════════════════════════ */}
      <pointLight position={[0, 8, 0]}    color="#4488ff" intensity={15} distance={60} decay={2} />
      <pointLight position={[44, 8, 44]}  color="#ff4488" intensity={12} distance={50} decay={2} />
      <pointLight position={[-44, 8, 44]} color="#44ffcc" intensity={12} distance={50} decay={2} />
      <pointLight position={[44, 8, -44]} color="#ffcc44" intensity={12} distance={50} decay={2} />
      <pointLight position={[-44, 8, -44]} color="#88aaff" intensity={12} distance={50} decay={2} />
    </group>
  );
}
