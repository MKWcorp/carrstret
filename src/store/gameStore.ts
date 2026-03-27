"use client";

import { create } from "zustand";
import type { GameScreen, CarConfig, GameState } from "@/types/game";
import { CAR_CONFIGS } from "@/lib/cars";

interface GameStore extends GameState {
  // Actions
  setScreen: (screen: GameScreen) => void;
  selectCar: (car: CarConfig) => void;
  setSpeed: (speed: number) => void;
  setLapTime: (time: number) => void;
  completeLap: () => void;
  resetGame: () => void;
  toggleEngine: (on: boolean) => void;
}

const initialState: GameState = {
  screen: "menu",
  selectedCar: CAR_CONFIGS[0],
  lapTime: 0,
  bestLapTime: null,
  currentLap: 1,
  totalLaps: 3,
  speed: 0,
  isEngineOn: false,
};

// Simple store without zustand — using module-level state + React hooks
let _state: GameState = { ...initialState };
const _listeners: Set<() => void> = new Set();

function notify() {
  _listeners.forEach((fn) => fn());
}

export const gameStore = {
  getState: () => _state,
  subscribe: (fn: () => void): (() => void) => {
    _listeners.add(fn);
    return () => { _listeners.delete(fn); };
  },
  setScreen: (screen: GameScreen) => {
    _state = { ..._state, screen };
    notify();
  },
  selectCar: (car: CarConfig) => {
    _state = { ..._state, selectedCar: car };
    notify();
  },
  setSpeed: (speed: number) => {
    _state = { ..._state, speed: Math.round(speed) };
    notify();
  },
  setLapTime: (lapTime: number) => {
    _state = { ..._state, lapTime };
    notify();
  },
  completeLap: () => {
    const best =
      _state.bestLapTime === null || _state.lapTime < _state.bestLapTime
        ? _state.lapTime
        : _state.bestLapTime;
    const nextLap = _state.currentLap + 1;
    if (nextLap > _state.totalLaps) {
      _state = { ..._state, bestLapTime: best, screen: "gameover" };
    } else {
      _state = { ..._state, bestLapTime: best, currentLap: nextLap, lapTime: 0 };
    }
    notify();
  },
  resetGame: () => {
    _state = { ...initialState };
    notify();
  },
  toggleEngine: (on: boolean) => {
    _state = { ..._state, isEngineOn: on };
    notify();
  },
};
