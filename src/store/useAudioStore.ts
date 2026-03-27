"use client";

/**
 * ─── useAudioStore ─────────────────────────────────────────────────────────────
 *
 * Zustand store untuk Audio Manager game.
 *
 * Fitur:
 *  - Mute/unmute global
 *  - Volume master
 *  - Fungsi play: bgMusic, engineIdle, engineRev, crash, lapComplete, countdown
 *  - Engine pitch naik sesuai kecepatan (playbackRate)
 *  - Semua audio lazy-loaded (buat instance saat pertama kali dipanggil)
 *
 * Cara pakai:
 *   const { playEngine, stopEngine, playCrash } = useAudioStore.getState();
 *
 * Cara pasang file audio:
 *   Taruh file .mp3 di /public/sounds/ dengan nama sesuai AUDIO_FILES di bawah.
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { create } from "zustand";

// ─── File mapping ─────────────────────────────────────────────────────────────

const AUDIO_FILES = {
  bgMusic:      "/sounds/bg-music.mp3",
  engineIdle:   "/sounds/engine-idle.mp3",
  engineRev:    "/sounds/engine-rev.mp3",
  crash:        "/sounds/crash.mp3",
  lapComplete:  "/sounds/lap-complete.mp3",
  countdown:    "/sounds/countdown.mp3",
} as const;

type AudioKey = keyof typeof AUDIO_FILES;

// ─── Audio instance pool ──────────────────────────────────────────────────────

const audioPool: Partial<Record<AudioKey, HTMLAudioElement>> = {};

function getAudio(key: AudioKey): HTMLAudioElement {
  if (!audioPool[key]) {
    const el = new Audio(AUDIO_FILES[key]);
    el.preload = "auto";
    audioPool[key] = el;
  }
  return audioPool[key]!;
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface AudioStore {
  isMuted: boolean;
  masterVolume: number;
  isEngineRunning: boolean;

  toggleMute: () => void;
  setMasterVolume: (v: number) => void;

  // ── Music ──────────────────────────────────────────────────────────────────
  playBgMusic: () => void;
  stopBgMusic: () => void;

  // ── Engine ─────────────────────────────────────────────────────────────────
  /** Mulai engine sound. Panggil saat game start. */
  startEngine: () => void;
  /** Stop engine sound. Panggil saat game over / pause. */
  stopEngine: () => void;
  /**
   * Update engine pitch setiap frame berdasarkan kecepatan.
   * @param speedKmh - kecepatan dalam km/h
   * @param maxSpeedKmh - kecepatan maksimum mobil dalam km/h
   */
  updateEnginePitch: (speedKmh: number, maxSpeedKmh: number) => void;

  // ── SFX ────────────────────────────────────────────────────────────────────
  playCrash: () => void;
  playLapComplete: () => void;
  playCountdown: () => void;
}

export const useAudioStore = create<AudioStore>()((set, get) => ({
  isMuted: false,
  masterVolume: 0.8,
  isEngineRunning: false,

  toggleMute: () => {
    const muted = !get().isMuted;
    set({ isMuted: muted });
    // Apply to all active audio
    Object.values(audioPool).forEach((el) => {
      if (el) el.muted = muted;
    });
  },

  setMasterVolume: (v) => {
    set({ masterVolume: v });
    Object.values(audioPool).forEach((el) => {
      if (el) el.volume = v;
    });
  },

  // ── Music ──────────────────────────────────────────────────────────────────

  playBgMusic: () => {
    const { isMuted, masterVolume } = get();
    const audio = getAudio("bgMusic");
    audio.loop   = true;
    audio.volume = masterVolume * 0.55;
    audio.muted  = isMuted;
    audio.currentTime = 0;
    audio.play().catch(() => {/* autoplay blocked — user must interact first */});
  },

  stopBgMusic: () => {
    const audio = audioPool["bgMusic"];
    if (audio) { audio.pause(); audio.currentTime = 0; }
  },

  // ── Engine ─────────────────────────────────────────────────────────────────

  startEngine: () => {
    const { isMuted, masterVolume } = get();
    set({ isEngineRunning: true });

    const idle = getAudio("engineIdle");
    idle.loop   = true;
    idle.volume = masterVolume * 0.45;
    idle.muted  = isMuted;
    idle.playbackRate = 1.0;
    idle.play().catch(() => {});

    const rev = getAudio("engineRev");
    rev.loop   = true;
    rev.volume = 0; // starts silent, fades in with speed
    rev.muted  = isMuted;
    rev.playbackRate = 1.0;
    rev.play().catch(() => {});
  },

  stopEngine: () => {
    set({ isEngineRunning: false });
    const idle = audioPool["engineIdle"];
    const rev  = audioPool["engineRev"];
    if (idle) { idle.pause(); idle.currentTime = 0; }
    if (rev)  { rev.pause();  rev.currentTime  = 0; }
  },

  updateEnginePitch: (speedKmh, maxSpeedKmh) => {
    const { isEngineRunning, masterVolume, isMuted } = get();
    if (!isEngineRunning || isMuted) return;

    const norm = Math.min(speedKmh / maxSpeedKmh, 1); // 0 → 1

    // Idle: pitch 0.8 → 1.4, volume fades out as speed increases
    const idle = audioPool["engineIdle"];
    if (idle) {
      idle.playbackRate = 0.8 + norm * 0.6;
      idle.volume = masterVolume * 0.45 * (1 - norm * 0.7);
    }

    // Rev: pitch 0.9 → 2.0, volume fades in as speed increases
    const rev = audioPool["engineRev"];
    if (rev) {
      rev.playbackRate = 0.9 + norm * 1.1;
      rev.volume = masterVolume * 0.65 * norm;
    }
  },

  // ── SFX ────────────────────────────────────────────────────────────────────

  playCrash: () => {
    const { isMuted, masterVolume } = get();
    const audio = getAudio("crash");
    audio.volume = masterVolume * 0.9;
    audio.muted  = isMuted;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  },

  playLapComplete: () => {
    const { isMuted, masterVolume } = get();
    const audio = getAudio("lapComplete");
    audio.volume = masterVolume * 0.8;
    audio.muted  = isMuted;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  },

  playCountdown: () => {
    const { isMuted, masterVolume } = get();
    const audio = getAudio("countdown");
    audio.volume = masterVolume * 0.9;
    audio.muted  = isMuted;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  },
}));
