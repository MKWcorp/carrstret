"use client";
import { useGameStore } from "@/store/useGameStore";

function formatTime(seconds: number): string {
  const m  = Math.floor(seconds / 60);
  const s  = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${m}:${String(s).padStart(2, "0")}.${String(ms).padStart(2, "0")}`;
}

export default function GameOver() {
  const bestLapTime = useGameStore((s) => s.bestLapTime);
  const selectedCar = useGameStore((s) => s.selectedCar);
  const resetGame   = useGameStore((s) => s.resetGame);
  const setScreen   = useGameStore((s) => s.setScreen);

  return (
    <div
      className="absolute inset-0 flex items-center justify-center select-none"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="flex flex-col items-center gap-5 p-8 rounded-2xl w-full max-w-[300px] text-center"
        style={{
          background: "#0a0a0a",
          border: `1.5px solid ${selectedCar.color}`,
          boxShadow: `0 0 30px ${selectedCar.color}33`,
        }}
      >
        <div className="text-5xl">🏁</div>
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-widest">Selesai!</h2>
          <p className="text-white/30 text-xs mt-1 tracking-wider">Race Complete</p>
        </div>

        {bestLapTime !== null && (
          <div
            className="w-full py-3 px-4 rounded-xl"
            style={{ background: `${selectedCar.color}15`, border: `1px solid ${selectedCar.color}44` }}
          >
            <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Best Lap Time</p>
            <p
              className="font-mono font-black text-2xl"
              style={{ color: selectedCar.color }}
            >
              {formatTime(bestLapTime)}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2 w-full">
          <button
            onClick={() => { resetGame(); setScreen("playing"); }}
            className="w-full py-3 rounded-xl font-bold text-black uppercase tracking-wider transition-all active:scale-95 text-sm"
            style={{
              background: `linear-gradient(135deg, ${selectedCar.color}, ${selectedCar.color}99)`,
            }}
          >
            🔄 Main Lagi
          </button>
          <button
            onClick={() => setScreen("car-select")}
            className="w-full py-3 rounded-xl font-semibold text-white uppercase tracking-wider border border-white/10 bg-white/5 hover:bg-white/10 transition-all active:scale-95 text-sm"
          >
            🚗 Ganti Mobil
          </button>
          <button
            onClick={() => { resetGame(); setScreen("menu"); }}
            className="w-full py-3 rounded-xl font-semibold text-white/50 uppercase tracking-wider bg-transparent hover:bg-white/5 transition-all active:scale-95 text-sm"
          >
            ← Menu Utama
          </button>
        </div>
      </div>
    </div>
  );
}
