"use client";

import { useState, useEffect, useCallback } from "react";
import { gameStore } from "@/store/gameStore";
import type { GameState } from "@/types/game";

export function useGameStore(): GameState & typeof gameStore {
  const [state, setState] = useState<GameState>(gameStore.getState());

  useEffect(() => {
    const unsub = gameStore.subscribe(() => {
      setState({ ...gameStore.getState() });
    });
    return unsub;
  }, []);

  return { ...state, ...gameStore };
}
