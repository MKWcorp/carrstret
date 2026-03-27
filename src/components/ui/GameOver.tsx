"use client";

import { useGameStore } from "@/hooks/useGameStore";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${m}:${String(s).padStart(2, "0")}.${String(ms).padStart(2, "0")}`;
}

export default function GameOver() {
  const { bestLapTime, selectedCar, resetGame, setScreen } = useGameStore();

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center select-none"
      style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(6px)" }}>
      <div className="flex flex-col items-center gap-6 p-8 rounded-2xl w-full max-w-sm text-center"
        style={{ background: "#0a0a0a", border: `2px solid ${selectedCar?.color ?? "#00ff88"}` }}>

        <div className="text-6xl">🏁</div>
        <h2 className="text-4xl font-black text-white uppercase tracking-widest">SELESAI!</h2>

        {bestLapTime !== null && (
          <div className="space-y-1">
            <p className="text-gray-400 text-sm uppercase tracking-wider">Best Lap Time</p>
            <p className="font-mono font-black text-3xl"
              style={{ color: selectedCar?.color ?? "#00ff88" }}>
              {formatTime(bestLapTime)}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3 w-full mt-2">
          <button
            onClick={() => { resetGame(); setScreen("playing"); }}
            className="w-full py-3 rounded-lg font-bold text-black uppercase tracking-wider transition-all active:scale-95"
            style={{ background: `linear-gradient(135deg, ${selectedCar?.color ?? "#00ff88"}, ${selectedCar?.color ?? "#00ff88"}88)` }}
          >
            🔄 Main Lagi
          </button>
          <button
            onClick={() => { resetGame(); setScreen("menu"); }}
            className="w-full py-3 rounded-lg font-semibold text-white uppercase tracking-wider border border-gray-600 bg-gray-900 hover:bg-gray-800 transition-all active:scale-95"
          >
            ← Menu Utama
          </button>
        </div>
      </div>
    </div>
  );
}
