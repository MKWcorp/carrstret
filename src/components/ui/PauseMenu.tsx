"use client";

import { useGameStore } from "@/store/useGameStore";

export default function PauseMenu() {
  const setScreen  = useGameStore((s) => s.setScreen);
  const resetGame  = useGameStore((s) => s.resetGame);

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center select-none"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)" }}>
      <div className="flex flex-col items-center gap-5 p-8 rounded-2xl w-full max-w-xs"
        style={{ background: "#111", border: "1px solid #333" }}>
        <h2 className="text-3xl font-black text-white uppercase tracking-widest">PAUSE</h2>

        <button
          onClick={() => setScreen("playing")}
          className="w-full py-3 rounded-lg font-bold text-black uppercase tracking-wider transition-all active:scale-95"
          style={{ background: "linear-gradient(135deg, #00ff88, #00cc66)" }}
        >
          ▶ Lanjutkan
        </button>

        <button
          onClick={() => setScreen("car-select")}
          className="w-full py-3 rounded-lg font-semibold text-white uppercase tracking-wider border border-gray-600 bg-gray-900 hover:bg-gray-800 transition-all active:scale-95"
        >
          🚗 Ganti Mobil
        </button>

        <button
          onClick={() => { resetGame(); setScreen("menu"); }}
          className="w-full py-3 rounded-lg font-semibold text-red-400 uppercase tracking-wider border border-red-900 bg-transparent hover:bg-red-900/20 transition-all active:scale-95"
        >
          ✕ Menu Utama
        </button>
      </div>
    </div>
  );
}
