"use client";

/**
 * ─── Audio Manager Hook ────────────────────────────────────────────────────────
 *
 * Struktur file audio yang diharapkan di /public/sounds/:
 *   - bg-music.mp3       → Background music (loop)
 *   - engine-idle.mp3    → Suara mesin idle (loop)
 *   - engine-rev.mp3     → Suara mesin saat akselerasi (loop)
 *   - crash.mp3          → Efek suara tabrakan (one-shot)
 *   - lap-complete.mp3   → Suara saat menyelesaikan lap (one-shot)
 *   - countdown.mp3      → Suara countdown (one-shot)
 *
 * Cara penggunaan:
 *   const audio = useAudioManager();
 *   audio.playBgMusic();
 *   audio.setEngineSpeed(0.8); // 0 = idle, 1 = full rev
 *   audio.playCrash();
 *   audio.stopAll();
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { useRef, useCallback, useEffect } from "react";

interface AudioNodes {
  bgMusic: HTMLAudioElement | null;
  engineIdle: HTMLAudioElement | null;
  engineRev: HTMLAudioElement | null;
}

export function useAudioManager() {
  const nodes = useRef<AudioNodes>({
    bgMusic: null,
    engineIdle: null,
    engineRev: null,
  });
  const initialized = useRef(false);
  const muted = useRef(false);

  // ── Initialize audio elements ──────────────────────────────────────────────
  const init = useCallback(() => {
    if (initialized.current || typeof window === "undefined") return;
    initialized.current = true;

    const createAudio = (src: string, loop: boolean, volume: number): HTMLAudioElement => {
      const el = new Audio(src);
      el.loop = loop;
      el.volume = volume;
      el.preload = "auto";
      return el;
    };

    nodes.current.bgMusic = createAudio("/sounds/bg-music.mp3", true, 0.35);
    nodes.current.engineIdle = createAudio("/sounds/engine-idle.mp3", true, 0.5);
    nodes.current.engineRev = createAudio("/sounds/engine-rev.mp3", true, 0);
  }, []);

  useEffect(() => {
    // Auto-init on mount
    init();
    return () => {
      stopAll();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Background Music ───────────────────────────────────────────────────────
  const playBgMusic = useCallback(() => {
    init();
    nodes.current.bgMusic?.play().catch(() => {
      // Autoplay blocked — will play on first user interaction
    });
  }, [init]);

  const stopBgMusic = useCallback(() => {
    if (nodes.current.bgMusic) {
      nodes.current.bgMusic.pause();
      nodes.current.bgMusic.currentTime = 0;
    }
  }, []);

  // ── Engine Sound ───────────────────────────────────────────────────────────
  const startEngine = useCallback(() => {
    init();
    nodes.current.engineIdle?.play().catch(() => {});
    nodes.current.engineRev?.play().catch(() => {});
  }, [init]);

  const stopEngine = useCallback(() => {
    nodes.current.engineIdle?.pause();
    nodes.current.engineRev?.pause();
  }, []);

  /**
   * setEngineSpeed — Blend between idle and rev sounds
   * @param speed 0.0 (idle) to 1.0 (full throttle)
   */
  const setEngineSpeed = useCallback((speed: number) => {
    const s = Math.max(0, Math.min(1, speed));
    if (nodes.current.engineIdle) nodes.current.engineIdle.volume = (1 - s) * 0.5;
    if (nodes.current.engineRev) nodes.current.engineRev.volume = s * 0.7;
    // Pitch shift via playbackRate (0.8 idle → 1.6 full rev)
    if (nodes.current.engineIdle) nodes.current.engineIdle.playbackRate = 0.8 + s * 0.4;
    if (nodes.current.engineRev) nodes.current.engineRev.playbackRate = 0.9 + s * 0.7;
  }, []);

  // ── One-shot SFX ───────────────────────────────────────────────────────────
  const playSFX = useCallback((src: string, volume = 0.8) => {
    if (muted.current) return;
    const sfx = new Audio(src);
    sfx.volume = volume;
    sfx.play().catch(() => {});
    sfx.onended = () => sfx.remove();
  }, []);

  const playCrash = useCallback(() => playSFX("/sounds/crash.mp3", 0.9), [playSFX]);
  const playLapComplete = useCallback(() => playSFX("/sounds/lap-complete.mp3", 0.8), [playSFX]);
  const playCountdown = useCallback(() => playSFX("/sounds/countdown.mp3", 0.7), [playSFX]);

  // ── Global controls ────────────────────────────────────────────────────────
  const stopAll = useCallback(() => {
    stopBgMusic();
    stopEngine();
  }, [stopBgMusic, stopEngine]);

  const toggleMute = useCallback(() => {
    muted.current = !muted.current;
    const vol = muted.current ? 0 : 1;
    if (nodes.current.bgMusic) nodes.current.bgMusic.volume = muted.current ? 0 : 0.35;
    if (nodes.current.engineIdle) nodes.current.engineIdle.volume = muted.current ? 0 : 0.5;
    if (nodes.current.engineRev) nodes.current.engineRev.volume = muted.current ? 0 : 0;
    return muted.current;
  }, []);

  return {
    playBgMusic,
    stopBgMusic,
    startEngine,
    stopEngine,
    setEngineSpeed,
    playCrash,
    playLapComplete,
    playCountdown,
    stopAll,
    toggleMute,
    isMuted: () => muted.current,
  };
}
