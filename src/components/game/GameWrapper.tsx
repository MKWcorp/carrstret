"use client";

import dynamic from "next/dynamic";
import { useGameStore } from "@/store/useGameStore";
import { useControls } from "@/hooks/useControls";
import MainMenu from "@/components/ui/MainMenu";
import CarSelect from "@/components/ui/CarSelect";
import PauseMenu from "@/components/ui/PauseMenu";
import GameOver from "@/components/ui/GameOver";

// Dynamic import — no SSR (Three.js / WebGL)
const ProGameScene = dynamic(() => import("./ProGameScene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#03030f]">
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-14 h-14 rounded-full border-4 border-cyan-400/20 border-t-cyan-400"
          style={{ animation: "spin 0.8s linear infinite" }}
        />
        <p
          className="text-sm uppercase tracking-[0.3em]"
          style={{ color: "rgba(0,255,136,0.6)" }}
        >
          Loading Track...
        </p>
      </div>
    </div>
  ),
});

export default function GameWrapper() {
  const screen      = useGameStore((s) => s.screen);
  const selectedCar = useGameStore((s) => s.selectedCar);
  const setScreen   = useGameStore((s) => s.setScreen);

  const { controls, setControl } = useControls();

  const isPlaying = screen === "playing" || screen === "paused";

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">

      {/* ── Menu screens ── */}
      {screen === "menu"       && <MainMenu />}
      {screen === "car-select" && <CarSelect />}

      {/* ── 3D Game Canvas ── */}
      {(isPlaying || screen === "gameover") && selectedCar && (
        <div className="absolute inset-0">
          <ProGameScene controls={controls} carConfig={selectedCar} />

          {/* Pause overlay */}
          {screen === "paused" && <PauseMenu />}

          {/* Game over overlay */}
          {screen === "gameover" && <GameOver />}
        </div>
      )}

      {/* ── Pause toggle (keyboard ESC handled in useControls) ── */}
      {isPlaying && (
        <button
          className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 rounded-full text-xs text-white/40 hover:text-white/70 border border-white/10 hover:border-white/20 bg-black/30 backdrop-blur-sm transition-all hidden sm:flex items-center gap-1.5"
          onClick={() => setScreen(screen === "paused" ? "playing" : "paused")}
        >
          {screen === "paused" ? "▶ Resume" : "⏸ Pause"}
        </button>
      )}
    </div>
  );
}
