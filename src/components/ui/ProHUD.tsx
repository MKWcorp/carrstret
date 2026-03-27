"use client";
/**
 * ─── ProHUD v2 ─────────────────────────────────────────────────────────────────
 *
 * Layout bersih — tidak ada tombol yang overlap:
 *
 *  TOP-LEFT:    Car badge + nama mobil
 *  TOP-CENTER:  Lap counter + timer
 *  TOP-RIGHT:   Pause button + Mute button (stacked vertikal, tidak overlap)
 *  BOT-RIGHT:   Speedometer analog + Gear
 *  BOT-LEFT:    (kosong — ruang untuk virtual D-pad di mobile)
 *
 * Virtual controls (D-pad) dirender oleh VirtualControls.tsx secara terpisah
 * dan hanya muncul di layar kecil (sm:hidden).
 * ──────────────────────────────────────────────────────────────────────────────
 */
import { useEffect, useRef } from "react";
import { useGameStore } from "@/store/useGameStore";
import { useAudioStore } from "@/store/useAudioStore";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(seconds: number): string {
  const m  = Math.floor(seconds / 60);
  const s  = Math.floor(seconds % 60);
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
function SpeedometerCanvas({ speed, maxSpeed }: { speed: number; maxSpeed: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W  = canvas.width;
    const H  = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const R  = W * 0.42;

    ctx.clearRect(0, 0, W, H);

    // BG circle
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.78)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const startAngle = (210 * Math.PI) / 180;
    const arcSpan    = (300 * Math.PI) / 180;
    const norm       = Math.min(speed / maxSpeed, 1);
    const arcEnd     = startAngle + norm * arcSpan;

    // BG arc
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.8, startAngle, startAngle + arcSpan);
    ctx.strokeStyle = "rgba(255,255,255,0.07)";
    ctx.lineWidth   = R * 0.13;
    ctx.stroke();

    // Speed arc
    const arcColor = norm < 0.6
      ? `hsl(${120 - norm * 120}, 100%, 55%)`
      : `hsl(${60 - (norm - 0.6) * 150}, 100%, 55%)`;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.8, startAngle, arcEnd);
    ctx.strokeStyle = arcColor;
    ctx.lineWidth   = R * 0.13;
    ctx.lineCap     = "round";
    ctx.stroke();

    // Tick marks
    for (let i = 0; i <= 10; i++) {
      const angle = startAngle + (i / 10) * arcSpan;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * R * 0.63, cy + Math.sin(angle) * R * 0.63);
      ctx.lineTo(cx + Math.cos(angle) * R * 0.75, cy + Math.sin(angle) * R * 0.75);
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth   = i % 2 === 0 ? 2 : 1;
      ctx.stroke();
    }

    // Needle
    const needleAngle = startAngle + norm * arcSpan;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(needleAngle);
    ctx.beginPath();
    ctx.moveTo(-3, 0);
    ctx.lineTo(R * 0.7, 0);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth   = 2.5;
    ctx.lineCap     = "round";
    ctx.stroke();
    ctx.restore();

    // Center dot
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.09, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();

    // Digital speed
    ctx.font         = `bold ${R * 0.36}px 'Courier New', monospace`;
    ctx.fillStyle    = "#fff";
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(Math.round(speed).toString(), cx, cy + R * 0.26);

    ctx.font      = `${R * 0.15}px sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText("km/h", cx, cy + R * 0.5);
  }, [speed, maxSpeed]);

  return (
    <canvas
      ref={canvasRef}
      width={150}
      height={150}
      className="drop-shadow-[0_0_10px_rgba(0,200,255,0.4)]"
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
  const screen      = useGameStore((s) => s.screen);
  const setScreen   = useGameStore((s) => s.setScreen);
  const isMuted     = useAudioStore((s) => s.isMuted);
  const toggleMute  = useAudioStore((s) => s.toggleMute);

  const maxSpeedKmh = selectedCar.maxSpeed * 3.6;
  const gear        = getGear(speed);

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10">

      {/* ══ TOP-LEFT: Car badge ══════════════════════════════════════════════ */}
      <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/55 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
        <div
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{
            backgroundColor: selectedCar.color,
            boxShadow: `0 0 6px ${selectedCar.color}`,
          }}
        />
        <span className="text-white/80 text-xs font-semibold tracking-wide leading-none">
          {selectedCar.name}
        </span>
      </div>

      {/* ══ TOP-CENTER: Lap + Timer ══════════════════════════════════════════ */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
        {/* Lap counter */}
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/10">
          <span className="text-white/40 text-[10px] uppercase tracking-widest">Lap</span>
          <span className="text-white font-bold text-lg font-mono leading-none">
            {currentLap}
            <span className="text-white/35 text-sm"> / {totalLaps}</span>
          </span>
        </div>
        {/* Timers */}
        <div className="flex items-center gap-3 bg-black/45 backdrop-blur-sm px-3 py-1 rounded-full border border-white/8">
          <div className="flex flex-col items-center">
            <span className="text-white/35 text-[8px] uppercase tracking-widest">Current</span>
            <span className="text-white font-mono text-xs font-semibold">{formatTime(lapTime)}</span>
          </div>
          {bestLapTime !== null && (
            <>
              <div className="w-px h-5 bg-white/12" />
              <div className="flex flex-col items-center">
                <span className="text-yellow-400/60 text-[8px] uppercase tracking-widest">Best</span>
                <span className="text-yellow-300 font-mono text-xs font-semibold">{formatTime(bestLapTime)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ══ TOP-RIGHT: Pause + Mute (stacked, pointer-events-auto) ══════════ */}
      <div className="absolute top-3 right-3 flex flex-col gap-1.5 pointer-events-auto">
        {/* Pause button — desktop only */}
        <button
          className="hidden sm:flex w-9 h-9 rounded-full bg-black/55 backdrop-blur-sm border border-white/12 items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors text-sm"
          onClick={() => setScreen(screen === "paused" ? "playing" : "paused")}
          aria-label="Pause"
          title="Pause (ESC)"
        >
          ⏸
        </button>
        {/* Mute button */}
        <button
          className="w-9 h-9 rounded-full bg-black/55 backdrop-blur-sm border border-white/12 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors text-sm"
          onClick={toggleMute}
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? "🔇" : "🔊"}
        </button>
      </div>

      {/* ══ BOTTOM-RIGHT: Speedometer + Gear ════════════════════════════════ */}
      <div className="absolute bottom-4 right-3 flex flex-col items-center gap-1">
        <SpeedometerCanvas speed={speed} maxSpeed={maxSpeedKmh} />
        <div className="flex items-center gap-1.5">
          <span className="text-white/35 text-[9px] uppercase tracking-widest">Gear</span>
          <span className="text-white font-bold text-xl font-mono leading-none">{gear}</span>
        </div>
      </div>

      {/* ══ Speed flash at max speed ════════════════════════════════════════ */}
      {speed > maxSpeedKmh * 0.93 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 55%, rgba(255,60,0,0.1) 100%)",
            animation: "pulse 0.35s ease-in-out infinite alternate",
          }}
        />
      )}
    </div>
  );
}
