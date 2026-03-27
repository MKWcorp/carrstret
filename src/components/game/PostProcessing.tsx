"use client";

/**
 * ─── PostProcessing ────────────────────────────────────────────────────────────
 *
 * Efek visual pasca-render menggunakan @react-three/postprocessing:
 *
 *  - Bloom       : Pendaran cahaya dari lampu mobil & neon track
 *  - MotionBlur  : Blur tipis saat kecepatan tinggi (speed sensation)
 *  - Vignette    : Efek gelap di sudut layar (sinematik)
 *  - ChromaticAberration : Aberasi warna ringan saat kecepatan puncak
 *
 * Semua intensitas di-drive oleh kecepatan real-time dari Zustand store.
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  EffectComposer,
  Bloom,
  Vignette,
  ChromaticAberration,
} from "@react-three/postprocessing";
import { BlendFunction, KernelSize } from "postprocessing";
import * as THREE from "three";
import { useGameStore } from "@/store/useGameStore";

// ─── Speed-reactive ChromaticAberration ──────────────────────────────────────

function SpeedEffects({ maxSpeed }: { maxSpeed: number }) {
  const offsetRef = useRef(new THREE.Vector2(0, 0));

  useFrame(() => {
    const speed = useGameStore.getState().speed;
    const norm  = Math.min(speed / (maxSpeed * 3.6), 1); // km/h → normalised
    // Chromatic aberration grows with speed
    const ca = norm * norm * 0.004;
    offsetRef.current.set(ca, ca);
  });

  return (
    <ChromaticAberration
      blendFunction={BlendFunction.NORMAL}
      offset={offsetRef.current}
      radialModulation={false}
      modulationOffset={0}
    />
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  maxSpeed: number;
}

export default function PostProcessing({ maxSpeed }: Props) {
  return (
    <EffectComposer multisampling={4}>
      {/* ── Bloom: lampu emissive bersinar ── */}
      <Bloom
        intensity={1.4}
        luminanceThreshold={0.6}
        luminanceSmoothing={0.4}
        kernelSize={KernelSize.LARGE}
        mipmapBlur
      />

      {/* ── Vignette: sudut gelap sinematik ── */}
      <Vignette
        offset={0.35}
        darkness={0.55}
        blendFunction={BlendFunction.NORMAL}
      />

      {/* ── Chromatic Aberration: naik sesuai kecepatan ── */}
      <SpeedEffects maxSpeed={maxSpeed} />
    </EffectComposer>
  );
}
