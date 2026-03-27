"use client";
import { useGameStore } from "@/store/useGameStore";

export default function PauseMenu() {
  const setScreen = useGameStore((s) => s.setScreen);
  const resetGame = useGameStore((s) => s.resetGame);

  return (
    <div
      className="absolute inset-0 flex items-center justify-center select-none"
      style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="flex flex-col items-center gap-4 p-8 rounded-2xl w-full max-w-[280px]"
        style={{ background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        <div className="text-4xl select-none">⏸</div>
        <h2 className="text-2xl font-black text-white uppercase tracking-widest">Pause</h2>

        <div className="w-full flex flex-col gap-2 mt-2">
          <button
            onClick={() => setScreen("playing")}
            className="w-full py-3 rounded-xl font-bold text-black uppercase tracking-wider transition-all active:scale-95 text-sm"
            style={{ background: "linear-gradient(135deg, #00ff88, #00cc66)" }}
          >
            ▶ Lanjutkan
          </button>

          <button
            onClick={() => setScreen("car-select")}
            className="w-full py-3 rounded-xl font-semibold text-white uppercase tracking-wider border border-white/10 bg-white/5 hover:bg-white/10 transition-all active:scale-95 text-sm"
          >
            🚗 Ganti Mobil
          </button>

          <button
            onClick={() => { resetGame(); setScreen("menu"); }}
            className="w-full py-3 rounded-xl font-semibold text-red-400 uppercase tracking-wider border border-red-900/50 bg-transparent hover:bg-red-900/20 transition-all active:scale-95 text-sm"
          >
            ✕ Menu Utama
          </button>
        </div>
      </div>
    </div>
  );
}
