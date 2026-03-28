"use client";
/**
 * ─── CityTrack v4 — DAYTIME CITY ──────────────────────────────────────────────
 *
 * Nuansa kota siang hari modern:
 *  - Aspal abu-abu dengan marka jalan kuning & putih
 *  - Trotoar / sidewalk di pinggir jalan
 *  - Gedung-gedung kota yang detail: kaca, beton, variasi tinggi
 *  - Pohon-pohon di trotoar
 *  - Lampu jalan (tiang)
 *  - Garis start/finish merah-putih
 *  - Barrier Jersey (beton putih)
 *
 * COLLISION: manual AABB di ArcadeCar (bukan Rapier)
 *  Outer: ±51, Inner: ±37
 * ──────────────────────────────────────────────────────────────────────────────
 */
import { useMemo } from "react";
import { RigidBody } from "@react-three/rapier";
import * as THREE from "three";

export const TRACK_H   = 0.4;
export const HALF_CIRC = 51;
export const INNER     = 37;
const TRACK_W          = 14;

// ─── Ground + Road surface ────────────────────────────────────────────────────
function GroundAndRoad() {
  // Road shape: outer square minus inner square = circuit ring
  const roadGeo = useMemo(() => {
    const outer = HALF_CIRC;
    const inner = INNER;
    const shape = new THREE.Shape();
    shape.moveTo(-outer, -outer);
    shape.lineTo( outer, -outer);
    shape.lineTo( outer,  outer);
    shape.lineTo(-outer,  outer);
    shape.closePath();
    const hole = new THREE.Path();
    hole.moveTo(-inner, -inner);
    hole.lineTo(-inner,  inner);
    hole.lineTo( inner,  inner);
    hole.lineTo( inner, -inner);
    hole.closePath();
    shape.holes.push(hole);
    return new THREE.ExtrudeGeometry(shape, { depth: TRACK_H, bevelEnabled: false });
  }, []);

  // Sidewalk: slightly raised, just outside the barriers
  const sidewalkGeo = useMemo(() => {
    const outer = HALF_CIRC + 3;
    const inner = HALF_CIRC;
    const shape = new THREE.Shape();
    shape.moveTo(-outer, -outer);
    shape.lineTo( outer, -outer);
    shape.lineTo( outer,  outer);
    shape.lineTo(-outer,  outer);
    shape.closePath();
    const hole = new THREE.Path();
    hole.moveTo(-inner, -inner);
    hole.lineTo(-inner,  inner);
    hole.lineTo( inner,  inner);
    hole.lineTo( inner, -inner);
    hole.closePath();
    shape.holes.push(hole);
    return new THREE.ExtrudeGeometry(shape, { depth: TRACK_H + 0.15, bevelEnabled: false });
  }, []);

  return (
    <>
      {/* Ground plane */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, -2, 0]} receiveShadow>
          <boxGeometry args={[500, 4, 500]} />
          <meshStandardMaterial color="#5a7a4a" roughness={1} />
        </mesh>
      </RigidBody>

      {/* Road aspal */}
      <mesh
        geometry={roadGeo}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
      >
        <meshStandardMaterial color="#3a3a3a" roughness={0.9} metalness={0.05} />
      </mesh>

      {/* Sidewalk */}
      <mesh
        geometry={sidewalkGeo}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
      >
        <meshStandardMaterial color="#c8c0b0" roughness={0.95} />
      </mesh>

      {/* City block interior (taman/plaza) */}
      <mesh position={[0, 0.01, 0]} receiveShadow>
        <boxGeometry args={[(INNER - 1) * 2, 0.05, (INNER - 1) * 2]} />
        <meshStandardMaterial color="#4a6a3a" roughness={1} />
      </mesh>
    </>
  );
}

// ─── Road markings ────────────────────────────────────────────────────────────
function RoadMarkings() {
  const Y = TRACK_H + 0.01;
  const items = useMemo(() => {
    const arr: { pos: [number,number,number]; rot: number; w: number; l: number; col: string }[] = [];
    // Center dashes — yellow, along straights
    for (let z = -50; z < -38; z += 7)
      arr.push({ pos: [0, Y, z], rot: 0, w: 0.25, l: 3.5, col: "#ffdd00" });
    for (let z = 39; z < 50; z += 7)
      arr.push({ pos: [0, Y, z], rot: 0, w: 0.25, l: 3.5, col: "#ffdd00" });
    for (let x = 39; x < 50; x += 7)
      arr.push({ pos: [x, Y, 0], rot: Math.PI/2, w: 0.25, l: 3.5, col: "#ffdd00" });
    for (let x = -50; x < -38; x += 7)
      arr.push({ pos: [x, Y, 0], rot: Math.PI/2, w: 0.25, l: 3.5, col: "#ffdd00" });
    return arr;
  }, []);

  return (
    <group>
      {items.map((m, i) => (
        <mesh key={i} position={m.pos} rotation={[0, m.rot, 0]}>
          <boxGeometry args={[m.w, 0.02, m.l]} />
          <meshStandardMaterial color={m.col} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Jersey barrier (beton putih) ─────────────────────────────────────────────
function JerseyBarrier({
  position, size, rotation = [0,0,0],
}: {
  position: [number,number,number];
  size: [number,number,number];
  rotation?: [number,number,number];
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color="#e8e0d0" roughness={0.8} metalness={0.05} />
    </mesh>
  );
}

// ─── Building dengan detail ───────────────────────────────────────────────────
function Building({
  position, w, d, h, color, roofColor, glassColor, hasAntenna = false,
}: {
  position: [number,number,number];
  w: number; d: number; h: number;
  color: string; roofColor: string; glassColor: string;
  hasAntenna?: boolean;
}) {
  return (
    <group position={position}>
      {/* Main body */}
      <mesh position={[0, h/2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} roughness={0.7} metalness={0.1} />
      </mesh>
      {/* Glass facade strip */}
      <mesh position={[0, h * 0.5, d/2 + 0.05]}>
        <boxGeometry args={[w * 0.7, h * 0.6, 0.1]} />
        <meshStandardMaterial
          color={glassColor}
          roughness={0.1}
          metalness={0.8}
          transparent
          opacity={0.7}
        />
      </mesh>
      {/* Roof */}
      <mesh position={[0, h + 0.3, 0]} castShadow>
        <boxGeometry args={[w + 0.4, 0.6, d + 0.4]} />
        <meshStandardMaterial color={roofColor} roughness={0.9} />
      </mesh>
      {/* Antenna */}
      {hasAntenna && (
        <mesh position={[0, h + 0.6 + 4, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 8, 6]} />
          <meshStandardMaterial color="#888888" metalness={0.8} roughness={0.3} />
        </mesh>
      )}
    </group>
  );
}

// ─── Street lamp ──────────────────────────────────────────────────────────────
function StreetLamp({ position }: { position: [number,number,number] }) {
  return (
    <group position={position}>
      {/* Tiang */}
      <mesh position={[0, 3.5, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 7, 8]} />
        <meshStandardMaterial color="#555555" metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Arm */}
      <mesh position={[0.8, 7, 0]} rotation={[0, 0, -0.2]}>
        <cylinderGeometry args={[0.05, 0.05, 1.8, 6]} />
        <meshStandardMaterial color="#555555" metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Lamp head */}
      <mesh position={[1.5, 6.8, 0]}>
        <boxGeometry args={[0.5, 0.2, 0.3]} />
        <meshStandardMaterial color="#ffeeaa" emissive="#ffeeaa" emissiveIntensity={1.5} />
      </mesh>
    </group>
  );
}

// ─── Tree ─────────────────────────────────────────────────────────────────────
function Tree({ position }: { position: [number,number,number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 2.4, 6]} />
        <meshStandardMaterial color="#5a3a1a" roughness={1} />
      </mesh>
      <mesh position={[0, 3.5, 0]} castShadow>
        <sphereGeometry args={[1.6, 8, 6]} />
        <meshStandardMaterial color="#2d7a2d" roughness={1} />
      </mesh>
      <mesh position={[0, 4.8, 0]} castShadow>
        <sphereGeometry args={[1.1, 8, 6]} />
        <meshStandardMaterial color="#3a8a3a" roughness={1} />
      </mesh>
    </group>
  );
}

// ─── Main CityTrack ───────────────────────────────────────────────────────────
export default function CityTrack() {
  const wallH   = 1.2;
  const barrierY = TRACK_H + wallH / 2;

  return (
    <group>

      {/* ══ GROUND + ROAD ════════════════════════════════════════════════ */}
      <GroundAndRoad />
      <RoadMarkings />

      {/* ══ INVISIBLE WALL COLLIDERS ═════════════════════════════════════ */}
      {/* Outer */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, wallH/2, -HALF_CIRC]} visible={false}>
          <boxGeometry args={[TRACK_W*2+6, wallH, 0.5]} />
          <meshBasicMaterial />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, wallH/2, HALF_CIRC]} visible={false}>
          <boxGeometry args={[TRACK_W*2+6, wallH, 0.5]} />
          <meshBasicMaterial />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[HALF_CIRC, wallH/2, 0]} visible={false}>
          <boxGeometry args={[0.5, wallH, TRACK_W*2+6]} />
          <meshBasicMaterial />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[-HALF_CIRC, wallH/2, 0]} visible={false}>
          <boxGeometry args={[0.5, wallH, TRACK_W*2+6]} />
          <meshBasicMaterial />
        </mesh>
      </RigidBody>
      {/* Inner */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, wallH/2, -INNER]} visible={false}>
          <boxGeometry args={[TRACK_W*2+6, wallH, 0.5]} />
          <meshBasicMaterial />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, wallH/2, INNER]} visible={false}>
          <boxGeometry args={[TRACK_W*2+6, wallH, 0.5]} />
          <meshBasicMaterial />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[INNER, wallH/2, 0]} visible={false}>
          <boxGeometry args={[0.5, wallH, TRACK_W*2+6]} />
          <meshBasicMaterial />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[-INNER, wallH/2, 0]} visible={false}>
          <boxGeometry args={[0.5, wallH, TRACK_W*2+6]} />
          <meshBasicMaterial />
        </mesh>
      </RigidBody>

      {/* ══ JERSEY BARRIERS (visual) ══════════════════════════════════════ */}
      {/* Outer barriers */}
      <JerseyBarrier position={[0, barrierY, -HALF_CIRC]}    size={[TRACK_W*2+6, wallH, 0.6]} />
      <JerseyBarrier position={[0, barrierY,  HALF_CIRC]}    size={[TRACK_W*2+6, wallH, 0.6]} />
      <JerseyBarrier position={[ HALF_CIRC, barrierY, 0]}    size={[0.6, wallH, TRACK_W*2+6]} />
      <JerseyBarrier position={[-HALF_CIRC, barrierY, 0]}    size={[0.6, wallH, TRACK_W*2+6]} />
      {/* Inner barriers */}
      <JerseyBarrier position={[0, barrierY, -INNER]}        size={[TRACK_W*2+6, wallH, 0.6]} />
      <JerseyBarrier position={[0, barrierY,  INNER]}        size={[TRACK_W*2+6, wallH, 0.6]} />
      <JerseyBarrier position={[ INNER, barrierY, 0]}        size={[0.6, wallH, TRACK_W*2+6]} />
      <JerseyBarrier position={[-INNER, barrierY, 0]}        size={[0.6, wallH, TRACK_W*2+6]} />

      {/* ══ START / FINISH LINE ═══════════════════════════════════════════ */}
      <mesh position={[0, TRACK_H+0.01, -32]}>
        <boxGeometry args={[TRACK_W, 0.02, 2]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {[-5.5,-3.5,-1.5,0.5,2.5,4.5].map((x,i) => (
        <mesh key={i} position={[x+0.5, TRACK_H+0.015, -32]}>
          <boxGeometry args={[1.8, 0.02, 2]} />
          <meshStandardMaterial color={i%2===0 ? "#cc0000" : "#ffffff"} />
        </mesh>
      ))}
      {/* START text indicator */}
      <mesh position={[0, TRACK_H+0.02, -34]}>
        <boxGeometry args={[6, 0.02, 0.4]} />
        <meshStandardMaterial color="#cc0000" emissive="#cc0000" emissiveIntensity={0.5} />
      </mesh>

      {/* ══ STREET LAMPS ══════════════════════════════════════════════════ */}
      {/* South straight */}
      <StreetLamp position={[-8, TRACK_H, -45]} />
      <StreetLamp position={[ 8, TRACK_H, -45]} />
      <StreetLamp position={[-8, TRACK_H, -38]} />
      <StreetLamp position={[ 8, TRACK_H, -38]} />
      {/* North straight */}
      <StreetLamp position={[-8, TRACK_H, 42]} />
      <StreetLamp position={[ 8, TRACK_H, 42]} />
      {/* East straight */}
      <StreetLamp position={[42, TRACK_H, -8]} />
      <StreetLamp position={[42, TRACK_H,  8]} />
      {/* West straight */}
      <StreetLamp position={[-42, TRACK_H, -8]} />
      <StreetLamp position={[-42, TRACK_H,  8]} />

      {/* ══ TREES (di trotoar) ════════════════════════════════════════════ */}
      {/* South */}
      <Tree position={[-5, TRACK_H+0.15, -53]} />
      <Tree position={[ 5, TRACK_H+0.15, -53]} />
      <Tree position={[-5, TRACK_H+0.15,  53]} />
      <Tree position={[ 5, TRACK_H+0.15,  53]} />
      {/* East/West */}
      <Tree position={[53, TRACK_H+0.15, -5]} />
      <Tree position={[53, TRACK_H+0.15,  5]} />
      <Tree position={[-53, TRACK_H+0.15, -5]} />
      <Tree position={[-53, TRACK_H+0.15,  5]} />
      {/* Inner plaza trees */}
      <Tree position={[ 20, 0,  20]} />
      <Tree position={[-20, 0,  20]} />
      <Tree position={[ 20, 0, -20]} />
      <Tree position={[-20, 0, -20]} />
      <Tree position={[  0, 0,  28]} />
      <Tree position={[  0, 0, -28]} />
      <Tree position={[ 28, 0,   0]} />
      <Tree position={[-28, 0,   0]} />

      {/* ══ BUILDINGS ════════════════════════════════════════════════════ */}

      {/* Corner towers — pencakar langit */}
      <Building position={[ 72, 0,  72]} w={24} d={24} h={90}
        color="#c8d4e0" roofColor="#8899aa" glassColor="#4488cc" hasAntenna />
      <Building position={[-72, 0,  72]} w={22} d={22} h={78}
        color="#d4c8c0" roofColor="#aa9988" glassColor="#88aacc" hasAntenna />
      <Building position={[ 72, 0, -72]} w={20} d={20} h={72}
        color="#c0c8d0" roofColor="#889aaa" glassColor="#44aacc" hasAntenna />
      <Building position={[-72, 0, -72]} w={26} d={26} h={85}
        color="#d0d4c8" roofColor="#aaa888" glassColor="#66aacc" hasAntenna />

      {/* Side buildings — medium */}
      <Building position={[  0, 0,  82]} w={32} d={16} h={55}
        color="#d8d0c8" roofColor="#aa9988" glassColor="#5599cc" />
      <Building position={[  0, 0, -82]} w={28} d={16} h={48}
        color="#c8d0d8" roofColor="#8899aa" glassColor="#4488cc" />
      <Building position={[ 82, 0,   0]} w={16} d={32} h={62}
        color="#d0c8d8" roofColor="#9988aa" glassColor="#6644cc" />
      <Building position={[-82, 0,   0]} w={16} d={28} h={58}
        color="#c8d8d0" roofColor="#88aa99" glassColor="#44cc88" />

      {/* Secondary buildings */}
      <Building position={[ 72, 0,  20]} w={14} d={14} h={38}
        color="#e0d8d0" roofColor="#bba898" glassColor="#88bbcc" />
      <Building position={[ 72, 0, -20]} w={12} d={14} h={32}
        color="#d8e0d8" roofColor="#a8b8a8" glassColor="#44cc88" />
      <Building position={[-72, 0,  20]} w={14} d={12} h={42}
        color="#d8d0e0" roofColor="#a898b8" glassColor="#8844cc" />
      <Building position={[-72, 0, -20]} w={12} d={14} h={36}
        color="#e0d0d8" roofColor="#b8a8b0" glassColor="#cc4488" />
      <Building position={[ 20, 0,  72]} w={14} d={14} h={44}
        color="#d8e0e0" roofColor="#a8b8b8" glassColor="#44cccc" />
      <Building position={[-20, 0,  72]} w={12} d={14} h={38}
        color="#e0e0d8" roofColor="#b8b8a8" glassColor="#cccc44" />
      <Building position={[ 20, 0, -72]} w={14} d={12} h={40}
        color="#e0d8e0" roofColor="#b8a8b8" glassColor="#cc44cc" />
      <Building position={[-20, 0, -72]} w={12} d={14} h={34}
        color="#d8e0d8" roofColor="#a8b8a8" glassColor="#44cc44" />

      {/* Inner plaza centerpiece */}
      <mesh position={[0, 4, 0]} castShadow>
        <cylinderGeometry args={[2, 2.5, 8, 12]} />
        <meshStandardMaterial color="#c8c0b0" roughness={0.7} metalness={0.2} />
      </mesh>
      <mesh position={[0, 8.5, 0]}>
        <sphereGeometry args={[2, 12, 8]} />
        <meshStandardMaterial color="#88aacc" roughness={0.1} metalness={0.9} transparent opacity={0.8} />
      </mesh>

      {/* ══ AMBIENT CITY LIGHTS (siang, subtle) ══════════════════════════ */}
      <pointLight position={[0, 15, 0]}    color="#fff8e7" intensity={8}  distance={100} decay={2} />
      <pointLight position={[51, 12, 51]}  color="#fff0d0" intensity={6}  distance={70}  decay={2} />
      <pointLight position={[-51,12,-51]}  color="#d0f0ff" intensity={6}  distance={70}  decay={2} />

    </group>
  );
}
