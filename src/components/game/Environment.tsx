"use client";

/**
 * ─── Environment ───────────────────────────────────────────────────────────────
 *
 * Sistem pencahayaan sinematik untuk nuansa balapan malam arcade:
 *
 *  - Directional light utama (moonlight / stadium)
 *  - Ambient light biru gelap (night sky)
 *  - Point lights berwarna di sekitar track (neon arcade feel)
 *  - Stars background
 *  - Fog volumetrik
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";

function PulsingLight({
  position,
  color,
  baseIntensity,
  pulseSpeed,
  pulseAmount,
}: {
  position: [number, number, number];
  color: string;
  baseIntensity: number;
  pulseSpeed: number;
  pulseAmount: number;
}) {
  const lightRef = useRef<THREE.PointLight>(null);
  const t = useRef(Math.random() * Math.PI * 2);

  useFrame((_, delta) => {
    if (!lightRef.current) return;
    t.current += delta * pulseSpeed;
    lightRef.current.intensity =
      baseIntensity + Math.sin(t.current) * pulseAmount;
  });

  return (
    <pointLight
      ref={lightRef}
      position={position}
      color={color}
      intensity={baseIntensity}
      distance={40}
      decay={2}
    />
  );
}

export default function Environment() {
  return (
    <>
      {/* ── Sky ── */}
      <color attach="background" args={["#03030f"]} />
      <fog attach="fog" args={["#03030f", 90, 220]} />
      <Stars
        radius={120}
        depth={60}
        count={4000}
        factor={4}
        saturation={0.3}
        fade
        speed={0.5}
      />

      {/* ── Ambient: deep night blue ── */}
      <ambientLight intensity={0.25} color="#1a1a3a" />

      {/* ── Main directional (stadium / moon) ── */}
      <directionalLight
        position={[40, 90, 40]}
        intensity={1.4}
        color="#e8eeff"
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-far={250}
        shadow-camera-left={-90}
        shadow-camera-right={90}
        shadow-camera-top={90}
        shadow-camera-bottom={-90}
        shadow-bias={-0.0005}
      />

      {/* ── Fill light (opposite side) ── */}
      <directionalLight
        position={[-30, 40, -30]}
        intensity={0.3}
        color="#3344aa"
      />

      {/* ── Neon track lights (pulsing) ── */}
      <PulsingLight
        position={[0, 8, -30]}
        color="#00ff88"
        baseIntensity={3}
        pulseSpeed={1.2}
        pulseAmount={0.8}
      />
      <PulsingLight
        position={[30, 8, 0]}
        color="#0088ff"
        baseIntensity={3}
        pulseSpeed={0.9}
        pulseAmount={0.7}
      />
      <PulsingLight
        position={[0, 8, 30]}
        color="#ff4400"
        baseIntensity={3}
        pulseSpeed={1.5}
        pulseAmount={0.9}
      />
      <PulsingLight
        position={[-30, 8, 0]}
        color="#aa00ff"
        baseIntensity={3}
        pulseSpeed={1.1}
        pulseAmount={0.6}
      />

      {/* ── Ground bounce light ── */}
      <pointLight
        position={[0, 2, 0]}
        intensity={0.8}
        color="#001133"
        distance={80}
        decay={2}
      />
    </>
  );
}
