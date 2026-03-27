"use client";
/**
 * ─── PostProcessing v2 — OPTIMIZED ────────────────────────────────────────────
 * multisampling=0 (dari 4) → jauh lebih ringan di GPU
 * ChromaticAberration dihapus → tidak ada useFrame overhead
 * Bloom kernel MEDIUM (dari LARGE)
 * ──────────────────────────────────────────────────────────────────────────────
 */
import {
  EffectComposer,
  Bloom,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction, KernelSize } from "postprocessing";

export default function PostProcessing({ maxSpeed: _ }: { maxSpeed: number }) {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={1.2}
        luminanceThreshold={0.65}
        luminanceSmoothing={0.3}
        kernelSize={KernelSize.MEDIUM}
        mipmapBlur
      />
      <Vignette
        offset={0.4}
        darkness={0.5}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
}
