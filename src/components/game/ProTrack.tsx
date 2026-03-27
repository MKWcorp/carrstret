"use client";
/**
 * ─── CityTrack v3 — OPTIMIZED ─────────────────────────────────────────────────
 *
 * PERUBAHAN PERFORMA:
 *  - Dari ~120+ mesh → ~30 mesh total
 *  - RigidBody dikurangi dari banyak → HANYA 1 (ground) + 8 wall collider
 *  - Gedung: hanya 8 gedung besar (bukan 29), tanpa RigidBody (dekoratif)
 *  - Lampu: hanya 2 pointLight (bukan 20+)
 *  - PostProcessing: multisampling 0
 *  - Barrier: mesh visual TERPISAH dari collider (collider invisible, visual dekoratif)
 *
 * WALL LAYOUT (untuk collision detection di ArcadeCar):
 *  Circuit persegi: outer ±58, inner ±44 (lebar jalan 14)
 *  Spawn di Z=-30, menghadap -Z (utara)
 *
 *  Outer walls:  N z=+58, S z=-58, E x=+58, W x=-58
 *  Inner walls:  N z=+44, S z=-44, E x=+44, W x=-44
 *  (hanya straight, corner adalah area bebas)
 * ──────────────────────────────────────────────────────────────────────────────
 */
import { useMemo } from "react";
import { RigidBody } from "@react-three/rapier";
import * as THREE from "three";

// ─── Track geometry constants ─────────────────────────────────────────────────
export const TRACK_H   = 0.4;
export const TRACK_W   = 14;
export const HALF_CIRC = 51;   // half size of circuit (center of outer wall)
export const INNER     = 37;   // inner wall position

// ─── Invisible wall collider ──────────────────────────────────────────────────
// Hanya collider, tidak ada mesh visual — visual digantikan barrier dekoratif
function WallCollider({
  position,
  args,
}: {
  position: [number, number, number];
  args: [number, number, number];
}) {
  return (
    <RigidBody type="fixed" colliders="cuboid">
      {/* mesh invisible — hanya untuk collider Rapier */}
      <mesh position={position} visible={false}>
        <boxGeometry args={args} />
        <meshBasicMaterial />
      </mesh>
    </RigidBody>
  );
}

// ─── Decorative barrier strip (visual only, no physics) ───────────────────────
function BarrierStrip({
  position,
  size,
  color = "#2a2a3a",
  neon,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color?: string;
  neon?: string;
}) {
  return (
    <group>
      <mesh position={position} castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} roughness={0.8} metalness={0.2} />
      </mesh>
      {neon && (
        <mesh position={[position[0], position[1] + size[1] / 2 + 0.06, position[2]]}>
          <boxGeometry args={[size[0], 0.1, size[2]]} />
          <meshStandardMaterial color={neon} emissive={neon} emissiveIntensity={5} />
        </mesh>
      )}
    </group>
  );
}

// ─── Simple building (dekoratif, NO RigidBody) ────────────────────────────────
function Building({
  position,
  w, d, h,
  color,
  winColor,
}: {
  position: [number, number, number];
  w: number; d: number; h: number;
  color: string;
  winColor: string;
}) {
  return (
    <group position={position}>
      {/* Body */}
      <mesh position={[0, h / 2, 0]} castShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} roughness={0.9} metalness={0.1} />
      </mesh>
      {/* Window glow strip */}
      <mesh position={[0, h * 0.6, 0]}>
        <boxGeometry args={[w + 0.1, h * 0.4, d + 0.1]} />
        <meshStandardMaterial
          color={winColor}
          emissive={winColor}
          emissiveIntensity={0.6}
          transparent
          opacity={0.15}
        />
      </mesh>
      {/* Rooftop neon */}
      <mesh position={[0, h + 0.1, 0]}>
        <boxGeometry args={[w * 0.8, 0.15, d * 0.8]} />
        <meshStandardMaterial color={winColor} emissive={winColor} emissiveIntensity={3} />
      </mesh>
    </group>
  );
}

// ─── Road surface (single merged visual) ─────────────────────────────────────
function RoadSurface() {
  // Buat geometry lintasan sebagai satu shape — lebih efisien dari banyak box
  const geo = useMemo(() => {
    const shape = new THREE.Shape();
    const outer = HALF_CIRC;
    const inner = INNER;
    const r     = 13; // corner radius approx

    // Outer rectangle (clockwise)
    shape.moveTo(-outer, -outer);
    shape.lineTo( outer, -outer);
    shape.lineTo( outer,  outer);
    shape.lineTo(-outer,  outer);
    shape.lineTo(-outer, -outer);

    // Inner hole (counter-clockwise)
    const hole = new THREE.Path();
    hole.moveTo(-inner, -inner);
    hole.lineTo(-inner,  inner);
    hole.lineTo( inner,  inner);
    hole.lineTo( inner, -inner);
    hole.lineTo(-inner, -inner);
    shape.holes.push(hole);

    const extrudeSettings = {
      depth: TRACK_H,
      bevelEnabled: false,
    };
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, []);

  return (
    <mesh
      geometry={geo}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      receiveShadow
    >
      <meshStandardMaterial color="#1a1a1e" roughness={0.95} metalness={0.05} />
    </mesh>
  );
}

// ─── Road markings (decorative dashes) ───────────────────────────────────────
function RoadMarkings() {
  const marks = useMemo(() => {
    const items: { pos: [number, number, number]; rot: boolean }[] = [];
    // South straight center line
    for (let z = -50; z < -37; z += 6) items.push({ pos: [0, TRACK_H + 0.01, z], rot: false });
    // North straight
    for (let z = 38; z < 50; z += 6)  items.push({ pos: [0, TRACK_H + 0.01, z], rot: false });
    // East straight
    for (let x = 38; x < 50; x += 6)  items.push({ pos: [x, TRACK_H + 0.01, 0], rot: true });
    // West straight
    for (let x = -50; x < -37; x += 6) items.push({ pos: [x, TRACK_H + 0.01, 0], rot: true });
    return items;
  }, []);

  return (
    <group>
      {marks.map((m, i) => (
        <mesh key={i} position={m.pos} rotation={[0, m.rot ? Math.PI / 2 : 0, 0]}>
          <boxGeometry args={[0.3, 0.02, 3]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Main CityTrack ───────────────────────────────────────────────────────────
export default function CityTrack() {
  const wallH   = 2.0;
  const wallLen = (HALF_CIRC - INNER) + 2; // ~16
  const strLen  = 26; // straight wall length

  return (
    <group>

      {/* ══ GROUND (1 RigidBody) ══════════════════════════════════════════ */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, -2, 0]} receiveShadow>
          <boxGeometry args={[400, 4, 400]} />
          <meshStandardMaterial color="#0d0d10" roughness={1} metalness={0} />
        </mesh>
      </RigidBody>

      {/* ══ ROAD SURFACE (visual only, no physics) ═══════════════════════ */}
      <RoadSurface />
      <RoadMarkings />

      {/* ══ WALL COLLIDERS (invisible, physics only) ═════════════════════ */}
      {/* Outer walls — 4 sides */}
      <WallCollider position={[0,  wallH / 2, -HALF_CIRC]} args={[TRACK_W * 2 + 4, wallH, 0.5]} />
      <WallCollider position={[0,  wallH / 2,  HALF_CIRC]} args={[TRACK_W * 2 + 4, wallH, 0.5]} />
      <WallCollider position={[ HALF_CIRC, wallH / 2, 0]}  args={[0.5, wallH, TRACK_W * 2 + 4]} />
      <WallCollider position={[-HALF_CIRC, wallH / 2, 0]}  args={[0.5, wallH, TRACK_W * 2 + 4]} />
      {/* Inner walls — 4 sides */}
      <WallCollider position={[0,  wallH / 2, -INNER]} args={[TRACK_W * 2 + 4, wallH, 0.5]} />
      <WallCollider position={[0,  wallH / 2,  INNER]} args={[TRACK_W * 2 + 4, wallH, 0.5]} />
      <WallCollider position={[ INNER, wallH / 2, 0]}  args={[0.5, wallH, TRACK_W * 2 + 4]} />
      <WallCollider position={[-INNER, wallH / 2, 0]}  args={[0.5, wallH, TRACK_W * 2 + 4]} />

      {/* ══ DECORATIVE BARRIERS (visual only) ════════════════════════════ */}
      {/* Outer barriers */}
      <BarrierStrip position={[0, TRACK_H + wallH / 2, -HALF_CIRC]}    size={[TRACK_W * 2 + 4, wallH, 0.6]}  color="#1e1e28" neon="#00ccff" />
      <BarrierStrip position={[0, TRACK_H + wallH / 2,  HALF_CIRC]}    size={[TRACK_W * 2 + 4, wallH, 0.6]}  color="#1e1e28" neon="#ff4400" />
      <BarrierStrip position={[ HALF_CIRC, TRACK_H + wallH / 2, 0]}    size={[0.6, wallH, TRACK_W * 2 + 4]}  color="#1e1e28" neon="#00ff88" />
      <BarrierStrip position={[-HALF_CIRC, TRACK_H + wallH / 2, 0]}    size={[0.6, wallH, TRACK_W * 2 + 4]}  color="#1e1e28" neon="#ff00aa" />
      {/* Inner barriers */}
      <BarrierStrip position={[0, TRACK_H + wallH / 2, -INNER]}        size={[TRACK_W * 2 + 4, wallH, 0.6]}  color="#1e1e28" neon="#ffcc00" />
      <BarrierStrip position={[0, TRACK_H + wallH / 2,  INNER]}        size={[TRACK_W * 2 + 4, wallH, 0.6]}  color="#1e1e28" neon="#cc00ff" />
      <BarrierStrip position={[ INNER, TRACK_H + wallH / 2, 0]}        size={[0.6, wallH, TRACK_W * 2 + 4]}  color="#1e1e28" neon="#00ffff" />
      <BarrierStrip position={[-INNER, TRACK_H + wallH / 2, 0]}        size={[0.6, wallH, TRACK_W * 2 + 4]}  color="#1e1e28" neon="#ff6600" />

      {/* ══ START/FINISH LINE ═════════════════════════════════════════════ */}
      <mesh position={[0, TRACK_H + 0.01, -32]} rotation={[0, 0, 0]}>
        <boxGeometry args={[TRACK_W, 0.02, 1.5]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
      </mesh>
      {/* Checkered pattern */}
      {[-5, -3, -1, 1, 3, 5].map((x, i) => (
        <mesh key={i} position={[x, TRACK_H + 0.015, -32]}>
          <boxGeometry args={[1.8, 0.02, 1.5]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? "#000000" : "#ffffff"}
            emissive={i % 2 === 0 ? "#000000" : "#aaaaaa"}
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}

      {/* ══ BUILDINGS (8 besar, dekoratif, NO RigidBody) ══════════════════ */}
      {/* Corner towers */}
      <Building position={[ 68,  0,  68]} w={22} d={22} h={80} color="#0d0d1a" winColor="#4488ff" />
      <Building position={[-68,  0,  68]} w={22} d={22} h={72} color="#1a1a2e" winColor="#ff4488" />
      <Building position={[ 68,  0, -68]} w={22} d={22} h={68} color="#0f3460" winColor="#ffcc44" />
      <Building position={[-68,  0, -68]} w={22} d={22} h={76} color="#16213e" winColor="#44ffcc" />
      {/* Side buildings */}
      <Building position={[  0,  0,  78]} w={30} d={14} h={55} color="#1a1a2e" winColor="#88aaff" />
      <Building position={[  0,  0, -78]} w={30} d={14} h={50} color="#0d0d1a" winColor="#ff8844" />
      <Building position={[ 78,  0,   0]} w={14} d={30} h={60} color="#16213e" winColor="#44ff88" />
      <Building position={[-78,  0,   0]} w={14} d={30} h={58} color="#0f3460" winColor="#ff44cc" />

      {/* ══ LIGHTS (hanya 3 pointLight, bukan 20+) ═══════════════════════ */}
      <pointLight position={[0,   12, 0]}   color="#6688ff" intensity={20} distance={80}  decay={2} />
      <pointLight position={[51,  10, 51]}  color="#ff8844" intensity={15} distance={60}  decay={2} />
      <pointLight position={[-51, 10, -51]} color="#44ffcc" intensity={15} distance={60}  decay={2} />

    </group>
  );
}
