"use client";
/**
 * ─── GameWrapper ───────────────────────────────────────────────────────────────
 *
 * Orkestrator utama game — mengelola screen transitions.
 *
 * UI hierarchy (tidak ada overlap):
 *  - Menu screens: MainMenu, CarSelect (full screen, z-index tinggi)
 *  - Game screen: ProGameScene (canvas) + ProHUD overlay + VirtualControls
 *  - Overlay screens: PauseMenu, GameOver (di atas canvas, z-index tinggi)
 *
 * TIDAK ada tombol duplikat di sini — semua tombol ada di ProHUD.
 * ──────────────────────────────────────────────────────────────────────────────
 */
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
        <p className="text-sm uppercase tracking-[0.3em]" style={{ color: "rgba(0,255,136,0.6)" }}>
          Loading City Track...
        </p>
      </div>
    </div>
  ),
});

export default function GameWrapper() {
  const screen      = useGameStore((s) => s.screen);
  const selectedCar = useGameStore((s) => s.selectedCar);
  const { controls, setControl } = useControls();

  const isPlaying = screen === "playing" || screen === "paused";

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">

      {/* ── Menu screens (full screen, above canvas) ── */}
      {screen === "menu"       && <MainMenu />}
      {screen === "car-select" && <CarSelect />}

      {/* ── 3D Game Canvas + HUD + Controls ── */}
      {(isPlaying || screen === "gameover") && selectedCar && (
        <div className="absolute inset-0">
          {/* Canvas + HUD + VirtualControls all inside ProGameScene */}
          <ProGameScene controls={controls} carConfig={selectedCar} />

          {/* Pause overlay (z-40 to be above HUD z-10) */}
          {screen === "paused" && (
            <div className="absolute inset-0 z-40">
              <PauseMenu />
            </div>
          )}

          {/* Game over overlay */}
          {screen === "gameover" && (
            <div className="absolute inset-0 z-40">
              <GameOver />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
