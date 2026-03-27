"use client";

/**
 * ─── ProHUD ────────────────────────────────────────────────────────────────────
 *
 * Heads-Up Display profesional yang di-overlay di atas Canvas.
 *
 * Komponen:
 *  - Speedometer analog (jarum berputar) + digital readout
 *  - Lap counter (LAP 1/3)
 *  - Lap timer + best time
 *  - Gear indicator (simulasi)
 *  - Nitro bar (placeholder — siap dihubungkan ke sistem nitro)
 *  - Mute button
 *
 * Data di-subscribe langsung dari Zustand store (update setiap frame).
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useRef, useState } from "react";
import { useGameStore } from "@/store/useGameStore";
import { useAudioStore } from "@/store/useAudioStore";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${m}:${String(s).padStart(2, "0")}.${String(ms).padStart(2, "0")}`;
}

function getGear(speedKmh: number): string {
  if (speedKmh < 15)  return "1";
  if (speedKmh < 40)  return "2";
  if (speedKmh < 75)  return "3";
  if (speedKmh < 115) return "4";
  if (speedKmh < 155) return "5";
  return "6";
}

// ─── Speedometer Canvas ───────────────────────────────────────────────────────

function SpeedometerCanvas({
  speed,
  maxSpeed,
}: {
  speed: number;
  maxSpeed: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const R  = W * 0.42;

    ctx.clearRect(0, 0, W, H);

    // ── Background circle ──────────────────────────────────────────────────
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fill();

    // ── Outer ring ─────────────────────────────────────────────────────────
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // ── Arc range: 210° to 330° (clockwise from bottom-left to bottom-right)
    const startAngle = (210 * Math.PI) / 180;
    const endAngle   = (330 * Math.PI) / 180; // wraps through 0

    // ── Background arc (grey) ──────────────────────────────────────────────
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.82, startAngle, endAngle);
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = R * 0.12;
    ctx.stroke();

    // ── Speed arc (coloured) ───────────────────────────────────────────────
    const norm     = Math.min(speed / maxSpeed, 1);
    const arcSpan  = (300 * Math.PI) / 180; // total 300 degrees
    const arcEnd   = startAngle + norm * arcSpan;
    const arcColor = norm < 0.6
      ? `hsl(${120 - norm * 120}, 100%, 55%)`   // green → yellow
      : `hsl(${60  - (norm - 0.6) * 150}, 100%, 55%)`; // yellow → red

    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.82, startAngle, arcEnd);
    ctx.strokeStyle = arcColor;
    ctx.lineWidth = R * 0.12;
    ctx.lineCap = "round";
    ctx.stroke();

    // ── Tick marks ─────────────────────────────────────────────────────────
    const ticks = 10;
    for (let i = 0; i <= ticks; i++) {
      const angle = startAngle + (i / ticks) * arcSpan;
      const inner = R * 0.65;
      const outer = R * 0.78;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
      ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = i % 2 === 0 ? 2 : 1;
      ctx.stroke();
    }

    // ── Needle ─────────────────────────────────────────────────────────────
    const needleAngle = startAngle + norm * arcSpan;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(needleAngle);
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.lineTo(R * 0.72, 0);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.restore();

    // ── Center dot ─────────────────────────────────────────────────────────
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.1, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    // ── Digital speed ──────────────────────────────────────────────────────
    ctx.font = `bold ${R * 0.38}px 'Courier New', monospace`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(Math.round(speed).toString(), cx, cy + R * 0.28);

    ctx.font = `${R * 0.16}px sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillText("km/h", cx, cy + R * 0.52);
  }, [speed, maxSpeed]);

  return (
    <canvas
      ref={canvasRef}
      width={160}
      height={160}
      className="drop-shadow-[0_0_12px_rgba(0,200,255,0.5)]"
    />
  );
}

// ─── Main HUD ─────────────────────────────────────────────────────────────────

export default function ProHUD() {
  const speed       = useGameStore((s) => s.speed);
  const lapTime     = useGameStore((s) => s.lapTime);
  const bestLapTime = useGameStore((s) => s.bestLapTime);
  const currentLap  = useGameStore((s) => s.currentLap);
  const totalLaps   = useGameStore((s) => s.totalLaps);
  const selectedCar = useGameStore((s) => s.selectedCar);
  const isMuted     = useAudioStore((s) => s.isMuted);
  const toggleMute  = useAudioStore((s) => s.toggleMute);

  const maxSpeedKmh = selectedCar.maxSpeed * 3.6;
  const gear        = getGear(speed);

  // Nitro bar (placeholder — 0 to 100)
  const [nitro] = useState(75);

  return (
    <div className="absolute inset-0 pointer-events-none select-none">

      {/* ── Bottom-right: Speedometer ── */}
      <div className="absolute bottom-4 right-4 flex flex-col items-center gap-1 pointer-events-none">
        <SpeedometerCanvas speed={speed} maxSpeed={maxSpeedKmh} />
        {/* Gear indicator */}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-white/40 text-xs uppercase tracking-widest">Gear</span>
          <span className="text-white font-bold text-2xl font-mono leading-none">{gear}</span>
        </div>
      </div>

      {/* ── Bottom-left: Nitro bar ── */}
      <div className="absolute bottom-6 left-4 flex flex-col gap-1 w-28">
        <span className="text-xs text-cyan-400 tracking-widest uppercase font-bold">Nitro</span>
        <div className="h-3 rounded-full bg-white/10 overflow-hidden border border-white/10">
          <div
            className="h-full rounded-full transition-all duration-100"
            style={{
              width: `${nitro}%`,
              background: "linear-gradient(90deg, #00f0ff, #0088ff)",
              boxShadow: "0 0 8px #00f0ff",
            }}
          />
        </div>
        <span className="text-white/50 text-xs text-right">{nitro}%</span>
      </div>

      {/* ── Top-center: Lap info ── */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5">
        {/* Lap counter */}
        <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm px-5 py-1.5 rounded-full border border-white/10">
          <span className="text-white/50 text-xs uppercase tracking-widest">Lap</span>
          <span className="text-white font-bold text-xl font-mono">
            {currentLap}
            <span className="text-white/40 text-sm"> / {totalLaps}</span>
          </span>
        </div>

        {/* Lap timer */}
        <div className="flex items-center gap-3 bg-black/40 backdrop-blur-sm px-4 py-1 rounded-full border border-white/8">
          <div className="flex flex-col items-center">
            <span className="text-white/40 text-[9px] uppercase tracking-widest">Current</span>
            <span className="text-white font-mono text-sm font-semibold">
              {formatTime(lapTime)}
            </span>
          </div>
          {bestLapTime !== null && (
            <>
              <div className="w-px h-6 bg-white/15" />
              <div className="flex flex-col items-center">
                <span className="text-yellow-400/70 text-[9px] uppercase tracking-widest">Best</span>
                <span className="text-yellow-300 font-mono text-sm font-semibold">
                  {formatTime(bestLapTime)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Top-right: Mute button ── */}
      <button
        className="absolute top-4 right-4 pointer-events-auto w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/15 flex items-center justify-center text-lg hover:bg-white/10 transition-colors"
        onClick={toggleMute}
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? "🔇" : "🔊"}
      </button>

      {/* ── Top-left: Car name ── */}
      <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: selectedCar.color, boxShadow: `0 0 6px ${selectedCar.color}` }}
        />
        <span className="text-white/80 text-xs font-semibold tracking-wide">
          {selectedCar.name}
        </span>
      </div>

      {/* ── Speed warning flash (at max speed) ── */}
      {speed > maxSpeedKmh * 0.92 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 60%, rgba(255,50,0,0.12) 100%)",
            animation: "pulse 0.4s ease-in-out infinite alternate",
          }}
        />
      )}
    </div>
  );
}
