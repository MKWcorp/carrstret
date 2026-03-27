"use client";

import { useEffect, useRef } from "react";
import { useAudioManager } from "@/hooks/useAudioManager";
import { useGameStore } from "@/hooks/useGameStore";

export default function AudioController() {
  const audio = useAudioManager();
  const { screen, speed, isEngineOn, selectedCar } = useGameStore();
  const prevScreen = useRef(screen);

  // ── Screen transitions ─────────────────────────────────────────────────────
  useEffect(() => {
    if (screen === "menu" || screen === "car-select") {
      audio.playBgMusic();
      audio.stopEngine();
    } else if (screen === "playing") {
      audio.playBgMusic();
      audio.startEngine();
      if (prevScreen.current !== "playing") {
        audio.playCountdown();
      }
    } else if (screen === "paused") {
      audio.stopEngine();
    } else if (screen === "gameover") {
      audio.playLapComplete();
      audio.stopEngine();
    }
    prevScreen.current = screen;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  // ── Engine speed blend ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isEngineOn || !selectedCar) return;
    const normalized = Math.abs(speed / 3.6) / selectedCar.maxSpeed;
    audio.setEngineSpeed(normalized);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speed, isEngineOn]);

  return null; // This component has no visual output
}
