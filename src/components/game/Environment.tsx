"use client";
/**
 * ─── DayEnvironment ────────────────────────────────────────────────────────────
 * Langit biru cerah siang hari — nuansa kota modern.
 * Menggunakan Sky shader dari @react-three/drei untuk langit atmosfer realistis.
 * ──────────────────────────────────────────────────────────────────────────────
 */
import { Sky } from "@react-three/drei";

export default function Environment() {
  return (
    <>
      {/* ── Langit biru cerah dengan shader atmosfer ── */}
      <Sky
        distance={450000}
        sunPosition={[100, 80, -50]}
        inclination={0.49}
        azimuth={0.25}
        turbidity={3}
        rayleigh={1.0}
        mieCoefficient={0.003}
        mieDirectionalG={0.9}
      />

      {/* ── Fog tipis biru untuk kedalaman visual ── */}
      <fog attach="fog" args={["#c9e8ff", 180, 450]} />

      {/* ── Ambient: cahaya siang merata ── */}
      <ambientLight intensity={1.4} color="#ffffff" />

      {/* ── Matahari utama dari kanan atas ── */}
      <directionalLight
        position={[80, 120, -60]}
        intensity={3.5}
        color="#fff8e7"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={350}
        shadow-camera-left={-150}
        shadow-camera-right={150}
        shadow-camera-top={150}
        shadow-camera-bottom={-150}
        shadow-bias={-0.001}
      />

      {/* ── Fill: pantulan langit biru dari kiri ── */}
      <directionalLight
        position={[-50, 60, 40]}
        intensity={0.9}
        color="#a8d4f5"
      />

      {/* ── Hemisphere: langit biru atas, aspal abu bawah ── */}
      <hemisphereLight args={["#87ceeb", "#888888", 0.7]} />
    </>
  );
}
