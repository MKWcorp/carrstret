"use client";

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { GameScreen, CarConfig } from "@/types/game";
import { CAR_CONFIGS } from "@/lib/cars";

// ─── State Shape ──────────────────────────────────────────────────────────────

interface GameStore {
  // ── Screen ──────────────────────────────────────────────────────────────────
  screen: GameScreen;
  setScreen: (s: GameScreen) => void;

  // ── Car ─────────────────────────────────────────────────────────────────────
  selectedCar: CarConfig;
  selectCar: (car: CarConfig) => void;

  // ── Telemetry (updated every frame from physics) ─────────────────────────
  speed: number;          // km/h
  driftAngle: number;     // radians — lateral slip angle
  isEngineOn: boolean;
  setTelemetry: (speed: number, driftAngle: number) => void;
  toggleEngine: (on: boolean) => void;

  // ── Lap ──────────────────────────────────────────────────────────────────
  lapTime: number;
  bestLapTime: number | null;
  currentLap: number;
  totalLaps: number;
  setLapTime: (t: number) => void;
  completeLap: () => void;

  // ── Reset ────────────────────────────────────────────────────────────────
  resetGame: () => void;
}

// ─── Initial values ───────────────────────────────────────────────────────────

const INITIAL: Omit<
  GameStore,
  | "setScreen" | "selectCar" | "setTelemetry" | "toggleEngine"
  | "setLapTime" | "completeLap" | "resetGame"
> = {
  screen: "menu",
  selectedCar: CAR_CONFIGS[0],
  speed: 0,
  driftAngle: 0,
  isEngineOn: false,
  lapTime: 0,
  bestLapTime: null,
  currentLap: 1,
  totalLaps: 3,
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set, get) => ({
    ...INITIAL,

    setScreen: (screen) => set({ screen }),
    selectCar: (selectedCar) => set({ selectedCar }),

    setTelemetry: (speed, driftAngle) => set({ speed, driftAngle }),
    toggleEngine: (isEngineOn) => set({ isEngineOn }),

    setLapTime: (lapTime) => set({ lapTime }),

    completeLap: () => {
      const { lapTime, bestLapTime, currentLap, totalLaps } = get();
      const newBest =
        bestLapTime === null || lapTime < bestLapTime ? lapTime : bestLapTime;
      if (currentLap >= totalLaps) {
        set({ bestLapTime: newBest, screen: "gameover" });
      } else {
        set({ bestLapTime: newBest, currentLap: currentLap + 1, lapTime: 0 });
      }
    },

    resetGame: () => set({ ...INITIAL }),
  }))
);

// ─── Convenience selector helpers (use in components) ────────────────────────
export const selectScreen = (s: GameStore) => s.screen;
export const selectSpeed  = (s: GameStore) => s.speed;
export const selectCar    = (s: GameStore) => s.selectedCar;
