"use client";

import { useGameStore } from "@/store/useGameStore";

export default function MainMenu() {
  const setScreen = useGameStore((s) => s.setScreen);

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full min-h-screen bg-black overflow-hidden select-none">
      {/* Animated background grid */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(#00ff88 1px, transparent 1px), linear-gradient(90deg, #00ff88 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          animation: "gridMove 3s linear infinite",
        }}
      />

      {/* Radial glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,255,136,0.08) 0%, transparent 70%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-6 text-center">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <h1
            className="text-6xl sm:text-8xl font-black tracking-tighter text-white"
            style={{
              textShadow: "0 0 40px rgba(0,255,136,0.6), 0 0 80px rgba(0,255,136,0.3)",
              fontFamily: "'Arial Black', sans-serif",
            }}
          >
            CARRSTRET
          </h1>
          <p className="text-green-400/60 text-sm tracking-[0.4em] uppercase font-medium">
            Arcade Racing 3D
          </p>
        </div>

        {/* Decorative car silhouette */}
        <div className="text-8xl opacity-30 select-none" aria-hidden>🏎️</div>

        {/* Play button */}
        <button
          onClick={() => setScreen("car-select")}
          className="group relative px-12 py-4 text-black font-black text-xl tracking-widest uppercase rounded-full overflow-hidden transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            background: "linear-gradient(135deg, #00ff88, #00cc66)",
            boxShadow: "0 0 30px rgba(0,255,136,0.5), 0 4px 20px rgba(0,0,0,0.4)",
          }}
        >
          <span className="relative z-10">PLAY NOW</span>
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: "linear-gradient(135deg, #00ffaa, #00ee77)" }}
          />
        </button>

        {/* Controls hint */}
        <div className="flex flex-col items-center gap-3 mt-2">
          <p className="text-white/30 text-xs uppercase tracking-widest">Controls</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { key: "W / ↑", label: "Gas" },
              { key: "S / ↓", label: "Reverse" },
              { key: "A / ←", label: "Left" },
              { key: "D / →", label: "Right" },
              { key: "SPACE", label: "Brake" },
              { key: "R", label: "Reset" },
            ].map((c) => (
              <div
                key={c.key}
                className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1"
              >
                <kbd className="text-green-400 text-xs font-mono font-bold">{c.key}</kbd>
                <span className="text-white/40 text-xs">{c.label}</span>
              </div>
            ))}
          </div>
          <p className="text-white/20 text-xs mt-1">📱 Mobile: Virtual D-pad tersedia</p>
        </div>
      </div>
    </div>
  );
}
