"use client";

import { useGameStore } from "@/hooks/useGameStore";

export default function MainMenu() {
  const { setScreen } = useGameStore();

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

      {/* Glow overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-4 text-center">
        {/* Logo */}
        <div className="mb-4">
          <h1
            className="text-5xl sm:text-7xl font-black tracking-widest uppercase"
            style={{
              color: "#00ff88",
              textShadow: "0 0 30px #00ff88, 0 0 60px #00ff8844",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            CARR
          </h1>
          <h1
            className="text-5xl sm:text-7xl font-black tracking-widest uppercase -mt-3"
            style={{
              color: "#ffffff",
              textShadow: "0 0 20px #ffffff44",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            STRET
          </h1>
          <p className="text-gray-400 text-sm sm:text-base mt-2 tracking-widest uppercase">
            Arcade Racing 3D
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button
            onClick={() => setScreen("car-select")}
            className="w-full py-4 px-8 text-black font-bold text-lg uppercase tracking-widest rounded-lg transition-all duration-200 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #00ff88, #00cc66)",
              boxShadow: "0 0 20px #00ff8866",
            }}
          >
            ▶ MULAI BALAPAN
          </button>

          <button
            onClick={() => setScreen("car-select")}
            className="w-full py-3 px-8 text-white font-semibold text-base uppercase tracking-wider rounded-lg border border-gray-600 bg-gray-900/80 hover:bg-gray-800 transition-all duration-200 active:scale-95"
          >
            🚗 PILIH MOBIL
          </button>
        </div>

        {/* Controls hint */}
        <div className="mt-6 text-gray-500 text-xs sm:text-sm space-y-1">
          <p className="text-gray-400 font-semibold uppercase tracking-wider mb-2">Kontrol</p>
          <div className="flex gap-6 justify-center flex-wrap">
            <span>⬆ Maju</span>
            <span>⬇ Mundur</span>
            <span>⬅ ➡ Belok</span>
            <span>SPACE Rem</span>
            <span>R Reset</span>
          </div>
          <p className="text-gray-600 mt-2">📱 HP: Gunakan tombol virtual di layar</p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes gridMove {
          0% { background-position: 0 0; }
          100% { background-position: 0 60px; }
        }
      `}</style>
    </div>
  );
}
