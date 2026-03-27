"use client";

/**
 * ─── ProGameScene ──────────────────────────────────────────────────────────────
 *
 * Canvas utama yang mengintegrasikan semua sistem baru:
 *  - Environment (lighting sinematik + stars)
 *  - ProTrack (lintasan 3D dengan tanjakan & belokan)
 *  - ArcadeCar (fisika arcade + kamera sinematik + GLTF-ready)
 *  - PostProcessing (Bloom + Vignette + ChromaticAberration)
 *  - ProHUD (overlay HTML/CSS di atas canvas)
 *  - VirtualControls (D-pad untuk mobile)
 *  - AudioController (engine pitch + music)
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { Suspense, useEffect, useRef } from "react";
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

// ─── Loading fallback ─────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#03030f] z-10">
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-12 h-12 rounded-full border-4 border-cyan-400/30 border-t-cyan-400"
          style={{ animation: "spin 0.8s linear infinite" }}
        />
        <span className="text-cyan-400/70 text-sm tracking-widest uppercase">
          Loading Track...
        </span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProGameScene({ controls, carConfig }: Props) {
  return (
    <div className="relative w-full h-full">
      {/* ── 3D Canvas ── */}
      <Canvas
        shadows="soft"
        camera={{
          position: [0, 6, 14],
          fov: 58,
          near: 0.1,
          far: 600,
        }}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          alpha: false,
        }}
        dpr={[1, 2]}
        style={{ width: "100%", height: "100%" }}
      >
        {/* Performance adaptors */}
        <AdaptiveDpr pixelated />
        <AdaptiveEvents />

        <Suspense fallback={null}>
          {/* Environment: sky, fog, lights */}
          <Environment />

          {/* Physics world */}
          <Physics
            gravity={[0, -22, 0]}
            timeStep="vary"
          >
            <ProTrack />
            <ArcadeCar controls={controls} carConfig={carConfig} />
          </Physics>

          {/* Post-processing effects */}
          <PostProcessing maxSpeed={carConfig.maxSpeed} />
        </Suspense>
      </Canvas>

      {/* ── HTML Overlay: HUD ── */}
      <ProHUD />

      {/* ── HTML Overlay: Virtual Controls (mobile) ── */}
      <VirtualControls controls={controls} />

      {/* ── Audio Controller ── */}
      <ProAudioController carConfig={carConfig} />
    </div>
  );
}
