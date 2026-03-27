"use client";

import dynamic from "next/dynamic";
import { useGameStore } from "@/hooks/useGameStore";
import { useControls } from "@/hooks/useControls";
import MainMenu from "@/components/ui/MainMenu";
import CarSelect from "@/components/ui/CarSelect";
import HUD from "@/components/ui/HUD";
import PauseMenu from "@/components/ui/PauseMenu";
import GameOver from "@/components/ui/GameOver";
import VirtualControls from "@/components/ui/VirtualControls";
import AudioController from "@/components/audio/AudioController";
import MuteButton from "@/components/ui/MuteButton";

// Dynamic import for 3D scene (no SSR)
const GameScene = dynamic(() => import("./GameScene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <div className="text-center">
        <div
          className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
          style={{ borderColor: "#00ff88", borderTopColor: "transparent" }}
        />
        <p className="text-white text-sm uppercase tracking-widest">Loading Track...</p>
      </div>
    </div>
  ),
});

export default function GameWrapper() {
  const { screen, selectedCar } = useGameStore();
  const { controls, setControl } = useControls();

  const isPlaying = screen === "playing" || screen === "paused";

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Audio controller — always mounted */}
      <AudioController />
      <MuteButton />

      {/* ── Menu screens ── */}
      {screen === "menu" && <MainMenu />}
      {screen === "car-select" && <CarSelect />}

      {/* ── 3D Game Canvas — keep mounted when playing or paused ── */}
      {isPlaying && selectedCar && (
        <div className="absolute inset-0">
          <GameScene controls={controls} carConfig={selectedCar} />
          <HUD />
          <VirtualControls setControl={setControl} />
          {screen === "paused" && <PauseMenu />}
        </div>
      )}

      {/* ── Game Over ── */}
      {screen === "gameover" && selectedCar && (
        <div className="absolute inset-0">
          <GameScene controls={controls} carConfig={selectedCar} />
          <GameOver />
        </div>
      )}
    </div>
  );
}
