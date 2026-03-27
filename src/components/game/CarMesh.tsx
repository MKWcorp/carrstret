"use client";

/**
 * ─── CarMesh ───────────────────────────────────────────────────────────────────
 *
 * Visual mobil yang GLTF-ready.
 *
 * Untuk mengganti ke model 3D nyata:
 *   1. Taruh file .glb di /public/models/cars/{id}.glb
 *   2. Uncomment blok "GLTF Model" di bawah
 *   3. Comment blok "Placeholder Mesh"
 *
 * Struktur roda menggunakan ref group agar ArcadeCar bisa
 * memutar dan menyetir roda secara independen.
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { useRef } from "react";
import * as THREE from "three";
// import { useGLTF } from "@react-three/drei";  // ← uncomment untuk GLTF

interface WheelProps {
  position: [number, number, number];
  groupRef: React.RefObject<THREE.Group | null>;
  color: string;
}

function Wheel({ position, groupRef, color }: WheelProps) {
  return (
    <group ref={groupRef} position={position}>
      {/* Tire */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.36, 0.36, 0.26, 20]} />
        <meshStandardMaterial color="#111111" roughness={0.95} />
      </mesh>
      {/* Rim */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.22, 0.22, 0.28, 10]} />
        <meshStandardMaterial color="#cccccc" metalness={0.9} roughness={0.15} />
      </mesh>
      {/* Brake disc */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.16, 0.16, 0.29, 8]} />
        <meshStandardMaterial color="#444444" metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Lug bolts */}
      {[0, 1, 2, 3, 4].map((i) => {
        const angle = (i / 5) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[0.145, Math.sin(angle) * 0.145, Math.cos(angle) * 0.145]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.025, 0.025, 0.3, 6]} />
            <meshStandardMaterial color="#888888" metalness={0.8} />
          </mesh>
        );
      })}
    </group>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface CarMeshProps {
  color: string;
  wheelFLRef: React.RefObject<THREE.Group | null>;
  wheelFRRef: React.RefObject<THREE.Group | null>;
  wheelRLRef: React.RefObject<THREE.Group | null>;
  wheelRRRef: React.RefObject<THREE.Group | null>;
  /** Path ke model GLTF (opsional, untuk masa depan) */
  modelUrl?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CarMesh({
  color,
  wheelFLRef,
  wheelFRRef,
  wheelRLRef,
  wheelRRRef,
  modelUrl,
}: CarMeshProps) {

  // ══════════════════════════════════════════════════════════════════════════
  // GLTF Model (uncomment saat model .glb sudah tersedia)
  // ══════════════════════════════════════════════════════════════════════════
  // if (modelUrl) {
  //   return <GLTFCarModel url={modelUrl} color={color} />;
  // }

  // ══════════════════════════════════════════════════════════════════════════
  // Placeholder Mesh — Stylized Arcade Car
  // ══════════════════════════════════════════════════════════════════════════

  const c = color;
  const darkC = new THREE.Color(c).multiplyScalar(0.6).getStyle();

  return (
    <group>
      {/* ── Chassis / Underbody ── */}
      <mesh castShadow receiveShadow position={[0, 0.12, 0]}>
        <boxGeometry args={[1.85, 0.22, 4.0]} />
        <meshStandardMaterial color={darkC} metalness={0.5} roughness={0.5} />
      </mesh>

      {/* ── Main Body ── */}
      <mesh castShadow receiveShadow position={[0, 0.38, -0.1]}>
        <boxGeometry args={[1.82, 0.42, 3.7]} />
        <meshStandardMaterial color={c} metalness={0.55} roughness={0.28} />
      </mesh>

      {/* ── Body side skirts ── */}
      {([-0.94, 0.94] as number[]).map((x, i) => (
        <mesh key={`skirt-${i}`} castShadow position={[x, 0.2, 0]}>
          <boxGeometry args={[0.06, 0.18, 3.6]} />
          <meshStandardMaterial color={darkC} metalness={0.6} roughness={0.3} />
        </mesh>
      ))}

      {/* ── Cabin / Roof ── */}
      <mesh castShadow position={[0, 0.75, 0.25]}>
        <boxGeometry args={[1.5, 0.45, 2.1]} />
        <meshStandardMaterial color={c} metalness={0.45} roughness={0.35} />
      </mesh>

      {/* ── Roof spoiler ── */}
      <mesh castShadow position={[0, 0.98, 1.15]}>
        <boxGeometry args={[1.3, 0.06, 0.5]} />
        <meshStandardMaterial color={darkC} metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Spoiler pillars */}
      {([-0.55, 0.55] as number[]).map((x, i) => (
        <mesh key={`sp-${i}`} position={[x, 0.88, 1.15]}>
          <boxGeometry args={[0.06, 0.2, 0.08]} />
          <meshStandardMaterial color={darkC} metalness={0.7} />
        </mesh>
      ))}

      {/* ── Windshield (front) ── */}
      <mesh position={[0, 0.72, -0.88]} rotation={[0.35, 0, 0]}>
        <boxGeometry args={[1.42, 0.42, 0.06]} />
        <meshStandardMaterial
          color="#99ccff"
          transparent
          opacity={0.35}
          metalness={0.1}
          roughness={0.05}
        />
      </mesh>

      {/* ── Rear window ── */}
      <mesh position={[0, 0.72, 1.38]} rotation={[-0.35, 0, 0]}>
        <boxGeometry args={[1.42, 0.38, 0.06]} />
        <meshStandardMaterial color="#99ccff" transparent opacity={0.3} />
      </mesh>

      {/* ── Side windows ── */}
      {([-0.76, 0.76] as number[]).map((x, i) => (
        <mesh key={`win-${i}`} position={[x, 0.76, 0.25]}>
          <boxGeometry args={[0.06, 0.32, 1.6]} />
          <meshStandardMaterial color="#aaddff" transparent opacity={0.28} />
        </mesh>
      ))}

      {/* ── Front bumper ── */}
      <mesh castShadow position={[0, 0.22, -2.08]}>
        <boxGeometry args={[1.7, 0.28, 0.18]} />
        <meshStandardMaterial color={darkC} metalness={0.6} roughness={0.3} />
      </mesh>

      {/* ── Rear bumper ── */}
      <mesh castShadow position={[0, 0.22, 2.08]}>
        <boxGeometry args={[1.7, 0.28, 0.18]} />
        <meshStandardMaterial color={darkC} metalness={0.6} roughness={0.3} />
      </mesh>

      {/* ── Headlights (emissive) ── */}
      {([-0.62, 0.62] as number[]).map((x, i) => (
        <group key={`hl-${i}`}>
          <mesh position={[x, 0.35, -2.0]}>
            <boxGeometry args={[0.38, 0.18, 0.06]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#ffffff"
              emissiveIntensity={2.5}
            />
          </mesh>
          {/* DRL strip */}
          <mesh position={[x, 0.26, -2.0]}>
            <boxGeometry args={[0.38, 0.05, 0.06]} />
            <meshStandardMaterial
              color="#aaddff"
              emissive="#aaddff"
              emissiveIntensity={3}
            />
          </mesh>
        </group>
      ))}

      {/* ── Taillights (emissive red) ── */}
      {([-0.62, 0.62] as number[]).map((x, i) => (
        <mesh key={`tl-${i}`} position={[x, 0.35, 2.0]}>
          <boxGeometry args={[0.38, 0.18, 0.06]} />
          <meshStandardMaterial
            color="#ff1100"
            emissive="#ff0000"
            emissiveIntensity={2}
          />
        </mesh>
      ))}

      {/* ── Exhaust pipes ── */}
      {([-0.35, 0.35] as number[]).map((x, i) => (
        <mesh key={`ex-${i}`} position={[x, 0.14, 2.06]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.055, 0.055, 0.12, 8]} />
          <meshStandardMaterial color="#555" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}

      {/* ── Hood scoop ── */}
      <mesh position={[0, 0.62, -0.6]}>
        <boxGeometry args={[0.5, 0.08, 0.7]} />
        <meshStandardMaterial color={darkC} metalness={0.5} roughness={0.4} />
      </mesh>

      {/* ── Wheels ── */}
      <Wheel position={[-0.98, 0, -1.25]} groupRef={wheelFLRef} color={c} />
      <Wheel position={[ 0.98, 0, -1.25]} groupRef={wheelFRRef} color={c} />
      <Wheel position={[-0.98, 0,  1.25]} groupRef={wheelRLRef} color={c} />
      <Wheel position={[ 0.98, 0,  1.25]} groupRef={wheelRRRef} color={c} />
    </group>
  );
}
