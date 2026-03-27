"use client";

/**
 * ─── ProAudioController ────────────────────────────────────────────────────────
 *
 * Komponen invisible yang menjembatani Zustand game state dengan audio store.
 *
 * Tugas:
 *  - Subscribe ke speed dari useGameStore
 *  - Setiap frame update engine pitch via useAudioStore.updateEnginePitch()
 *  - Start/stop engine sound sesuai game screen
 *  - Play lap complete sound saat lap selesai
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useRef } from "react";
import { useGameStore } from "@/store/useGameStore";
import { useAudioStore } from "@/store/useAudioStore";
import type { CarConfig } from "@/types/game";

interface Props {
  carConfig: CarConfig;
}

export default function ProAudioController({ carConfig }: Props) {
  const maxSpeedKmh = carConfig.maxSpeed * 3.6;
  const prevLap     = useRef(1);
  const rafRef      = useRef<number>(0);

  const { startEngine, stopEngine, updateEnginePitch, playBgMusic, playLapComplete } =
    useAudioStore.getState();

  // ── Start engine & music when component mounts ────────────────────────────
  useEffect(() => {
    startEngine();
    playBgMusic();

    return () => {
      stopEngine();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Update engine pitch every animation frame ─────────────────────────────
  useEffect(() => {
    let running = true;

    function tick() {
      if (!running) return;
      const speed = useGameStore.getState().speed;
      updateEnginePitch(speed, maxSpeedKmh);
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxSpeedKmh]);

  // ── Detect lap completion ─────────────────────────────────────────────────
  useEffect(() => {
    const unsub = useGameStore.subscribe(
      (state) => state.currentLap,
      (currentLap) => {
        if (currentLap > prevLap.current) {
          playLapComplete();
          prevLap.current = currentLap;
        }
      }
    );
    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null; // invisible component
}
