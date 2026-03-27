"use client";
/**
 * ─── CityEnvironment ───────────────────────────────────────────────────────────
 * Langit malam kota dengan bintang, fog, dan ambient lighting
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
      distance={60}
      decay={2}
    />
  );
}

export default function Environment() {
  return (
    <>
      {/* ── Sky ── */}
      <color attach="background" args={["#03030f"]} />
      <fog attach="fog" args={["#03030f", 100, 280]} />

      {/* ── Stars ── */}
      <Stars
        radius={200}
        depth={80}
        count={5000}
        factor={4}
        saturation={0.2}
        fade
        speed={0.3}
      />

      {/* ── Ambient: deep night city glow ── */}
      <ambientLight intensity={0.35} color="#1a1a3a" />

      {/* ── Main directional (moonlight) ── */}
      <directionalLight
        position={[50, 100, 50]}
        intensity={1.0}
        color="#aabbdd"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={300}
        shadow-camera-left={-130}
        shadow-camera-right={130}
        shadow-camera-top={130}
        shadow-camera-bottom={-130}
        shadow-bias={-0.001}
      />

      {/* ── Fill light ── */}
      <directionalLight
        position={[-40, 30, -40]}
        intensity={0.25}
        color="#3344aa"
      />

      {/* ── Hemisphere: warm city glow from ground ── */}
      <hemisphereLight args={["#ff8833", "#0a0a1a", 0.3]} />

      {/* ── Neon city pulsing lights ── */}
      <PulsingLight position={[0, 10, -44]}   color="#00ccff" baseIntensity={5} pulseSpeed={1.2} pulseAmount={1.5} />
      <PulsingLight position={[44, 10, 0]}    color="#00ff88" baseIntensity={5} pulseSpeed={0.9} pulseAmount={1.2} />
      <PulsingLight position={[0, 10, 44]}    color="#ff4400" baseIntensity={5} pulseSpeed={1.5} pulseAmount={1.8} />
      <PulsingLight position={[-44, 10, 0]}   color="#ff00aa" baseIntensity={5} pulseSpeed={1.1} pulseAmount={1.3} />

      {/* ── Corner accent lights ── */}
      <pointLight position={[44, 6, 44]}  color="#4488ff" intensity={12} distance={50} decay={2} />
      <pointLight position={[-44, 6, 44]} color="#44ffcc" intensity={12} distance={50} decay={2} />
      <pointLight position={[44, 6, -44]} color="#ffcc44" intensity={12} distance={50} decay={2} />
      <pointLight position={[-44, 6, -44]} color="#ff4488" intensity={12} distance={50} decay={2} />
    </>
  );
}
