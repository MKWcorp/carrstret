"use client";

import { useGameStore } from "@/hooks/useGameStore";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${m}:${String(s).padStart(2, "0")}.${String(ms).padStart(2, "0")}`;
}

export default function HUD() {
  const { speed, lapTime, bestLapTime, currentLap, totalLaps, selectedCar, setScreen } =
    useGameStore();

  const speedPercent = Math.min((speed / (selectedCar?.maxSpeed ?? 40)) * 100, 100);

  return (
    <div className="absolute inset-0 pointer-events-none z-20 select-none">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex justify-between items-start p-3 sm:p-4">
        {/* Lap counter */}
        <div
          className="px-3 py-2 rounded-lg text-center"
          style={{ background: "rgba(0,0,0,0.7)", border: "1px solid #333" }}
        >
          <div className="text-gray-400 text-xs uppercase tracking-wider">Lap</div>
          <div className="text-white font-black text-lg leading-none">
            {currentLap}/{totalLaps}
          </div>
        </div>

        {/* Lap time */}
        <div
          className="px-3 py-2 rounded-lg text-center"
          style={{ background: "rgba(0,0,0,0.7)", border: "1px solid #333" }}
        >
          <div className="text-gray-400 text-xs uppercase tracking-wider">Waktu</div>
          <div className="text-white font-mono font-bold text-base leading-none">
            {formatTime(lapTime)}
          </div>
          {bestLapTime !== null && (
            <div className="text-yellow-400 font-mono text-xs mt-0.5">
              Best: {formatTime(bestLapTime)}
            </div>
          )}
        </div>

        {/* Pause button */}
        <button
          className="pointer-events-auto px-3 py-2 rounded-lg text-white text-sm font-bold transition-colors hover:bg-gray-700"
          style={{ background: "rgba(0,0,0,0.7)", border: "1px solid #333" }}
          onClick={() => setScreen("paused")}
        >
          ⏸
        </button>
      </div>

      {/* Speedometer — bottom right */}
      <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 flex flex-col items-center gap-1">
        <div
          className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center"
          style={{
            background: "rgba(0,0,0,0.8)",
            border: "2px solid #333",
            boxShadow: "0 0 20px rgba(0,0,0,0.5)",
          }}
        >
          {/* Arc progress */}
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="#222" strokeWidth="6" />
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke={selectedCar?.color ?? "#00ff88"}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 34}`}
              strokeDashoffset={`${2 * Math.PI * 34 * (1 - speedPercent / 100)}`}
              style={{ transition: "stroke-dashoffset 0.1s ease" }}
            />
          </svg>
          <div className="text-center z-10">
            <div
              className="font-black text-lg sm:text-xl leading-none"
              style={{ color: selectedCar?.color ?? "#00ff88" }}
            >
              {speed}
            </div>
            <div className="text-gray-500 text-xs">km/h</div>
          </div>
        </div>
        <div className="text-gray-500 text-xs uppercase tracking-wider">
          {selectedCar?.name ?? ""}
        </div>
      </div>
    </div>
  );
}
