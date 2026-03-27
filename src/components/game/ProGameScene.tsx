"use client";
/**
 * ─── ProGameScene v2 ───────────────────────────────────────────────────────────
 *
 * Canvas utama + semua overlay:
 *  - 3D Canvas (Three.js + Rapier)
 *  - ProHUD (overlay HTML/CSS)
 *  - VirtualControls (mobile D-pad, hanya muncul di layar kecil)
 *  - ProAudioController (invisible, audio management)
 *
 * Tidak ada tombol duplikat — semua UI dikelola di ProHUD.
 * ──────────────────────────────────────────────────────────────────────────────
 */
import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { AdaptiveDpr, AdaptiveEvents } from "@react-three/drei";
import type { ControlsState, CarConfig } from "@/types/game";
import Environment from "./Environment";
import ProTrack from "./ProTrack";
import ArcadeCar from "./ArcadeCar";
import PostProcessing from "./PostProcessing";
import ProHUD from "@/components/ui/ProHUD";
import VirtualControls from "@/components/ui/VirtualControls";
import ProAudioController from "@/components/audio/ProAudioController";

interface Props {
  controls: React.MutableRefObject<ControlsState>;
  carConfig: CarConfig;
}

export default function ProGameScene({ controls, carConfig }: Props) {
  return (
    <div className="relative w-full h-full">

      {/* ── 3D Canvas ── */}
      <Canvas
        shadows="soft"
        camera={{
          position: [0, 6, 14],
          fov: 60,
          near: 0.1,
          far: 700,
        }}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          alpha: false,
        }}
        dpr={[1, 1.5]}
        style={{ width: "100%", height: "100%" }}
      >
        <AdaptiveDpr pixelated />
        <AdaptiveEvents />

        <Suspense fallback={null}>
          <Environment />

          <Physics gravity={[0, -9.81, 0]} timeStep={1 / 60}>
            <ProTrack />
            <ArcadeCar controls={controls} carConfig={carConfig} />
          </Physics>

          <PostProcessing maxSpeed={carConfig.maxSpeed} />
        </Suspense>
      </Canvas>

      {/* ── HUD overlay (z-10) ── */}
      <ProHUD />

      {/* ── Virtual D-pad (mobile only, z-20, sm:hidden) ── */}
      <VirtualControls controls={controls} />

      {/* ── Audio controller (invisible) ── */}
      <ProAudioController carConfig={carConfig} />
    </div>
  );
}
