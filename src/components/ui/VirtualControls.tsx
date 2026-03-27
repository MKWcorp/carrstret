"use client";
/**
 * ─── VirtualControls v2 ────────────────────────────────────────────────────────
 *
 * Tombol virtual untuk mobile — HANYA muncul di layar < sm (640px).
 *
 * Layout (tidak overlap dengan HUD):
 *
 *   [HUD: top-left car badge]  [HUD: top-center lap]  [HUD: top-right pause/mute]
 *
 *   ┌─────────────────────────────────────────────────────────────────────────┐
 *   │                                                                         │
 *   │                         (game canvas)                                   │
 *   │                                                                         │
 *   │  [D-PAD]                                         [BRAKE]  [RESET]       │
 *   │  bottom-left                                     bottom-right           │
 *   └─────────────────────────────────────────────────────────────────────────┘
 *
 * D-pad: bottom-left, tidak overlap dengan speedometer (bottom-right)
 * Brake + Reset: kanan bawah, di atas speedometer (z-index lebih tinggi)
 * Speedometer: bottom-right corner (dari ProHUD)
 *
 * Catatan: Speedometer lebar ~150px, jadi tombol kanan ada di right-[165px]
 * ──────────────────────────────────────────────────────────────────────────────
 */
import type { ControlsState } from "@/types/game";

interface Props {
  controls: React.MutableRefObject<ControlsState>;
  setControl?: (key: keyof ControlsState, value: boolean) => void;
}

function set(
  controls: React.MutableRefObject<ControlsState>,
  setControl: ((k: keyof ControlsState, v: boolean) => void) | undefined,
  key: keyof ControlsState,
  value: boolean
) {
  controls.current[key] = value;
  setControl?.(key, value);
}

// ─── Shared button style ──────────────────────────────────────────────────────
const btnBase: React.CSSProperties = {
  WebkitTapHighlightColor: "transparent",
  userSelect: "none",
  touchAction: "none",
};

export default function VirtualControls({ controls, setControl }: Props) {
  return (
    // Only visible on mobile (< sm = 640px)
    <div className="absolute inset-0 pointer-events-none select-none sm:hidden z-20">

      {/* ── D-PAD: bottom-left ─────────────────────────────────────────── */}
      <div className="absolute bottom-5 left-4 pointer-events-auto">
        <div className="grid grid-cols-3 grid-rows-3 gap-1 w-[132px] h-[132px]">
          {/* UP */}
          <button
            className="col-start-2 row-start-1 flex items-center justify-center rounded-xl text-white text-xl font-bold active:scale-90 transition-transform"
            style={{ ...btnBase, background: "rgba(255,255,255,0.13)", border: "1px solid rgba(255,255,255,0.2)" }}
            onTouchStart={(e) => { e.preventDefault(); set(controls, setControl, "forward", true); }}
            onTouchEnd={(e)   => { e.preventDefault(); set(controls, setControl, "forward", false); }}
          >▲</button>

          {/* LEFT */}
          <button
            className="col-start-1 row-start-2 flex items-center justify-center rounded-xl text-white text-xl font-bold active:scale-90 transition-transform"
            style={{ ...btnBase, background: "rgba(255,255,255,0.13)", border: "1px solid rgba(255,255,255,0.2)" }}
            onTouchStart={(e) => { e.preventDefault(); set(controls, setControl, "left", true); }}
            onTouchEnd={(e)   => { e.preventDefault(); set(controls, setControl, "left", false); }}
          >◀</button>

          {/* CENTER (empty) */}
          <div className="col-start-2 row-start-2" />

          {/* RIGHT */}
          <button
            className="col-start-3 row-start-2 flex items-center justify-center rounded-xl text-white text-xl font-bold active:scale-90 transition-transform"
            style={{ ...btnBase, background: "rgba(255,255,255,0.13)", border: "1px solid rgba(255,255,255,0.2)" }}
            onTouchStart={(e) => { e.preventDefault(); set(controls, setControl, "right", true); }}
            onTouchEnd={(e)   => { e.preventDefault(); set(controls, setControl, "right", false); }}
          >▶</button>

          {/* DOWN */}
          <button
            className="col-start-2 row-start-3 flex items-center justify-center rounded-xl text-white text-xl font-bold active:scale-90 transition-transform"
            style={{ ...btnBase, background: "rgba(255,255,255,0.13)", border: "1px solid rgba(255,255,255,0.2)" }}
            onTouchStart={(e) => { e.preventDefault(); set(controls, setControl, "backward", true); }}
            onTouchEnd={(e)   => { e.preventDefault(); set(controls, setControl, "backward", false); }}
          >▼</button>
        </div>
      </div>

      {/* ── ACTION BUTTONS: bottom-right, di kiri speedometer ─────────── */}
      {/* Speedometer lebar ~158px → right-[165px] agar tidak overlap */}
      <div className="absolute bottom-5 right-[165px] pointer-events-auto flex flex-col gap-2 items-end">
        {/* BRAKE */}
        <button
          className="w-[68px] h-[68px] rounded-2xl text-white text-sm font-black flex items-center justify-center active:scale-90 transition-transform"
          style={{
            ...btnBase,
            background: "rgba(255,59,48,0.5)",
            border: "1.5px solid rgba(255,59,48,0.7)",
            boxShadow: "0 0 14px rgba(255,59,48,0.3)",
          }}
          onTouchStart={(e) => { e.preventDefault(); set(controls, setControl, "brake", true); }}
          onTouchEnd={(e)   => { e.preventDefault(); set(controls, setControl, "brake", false); }}
        >
          BRAKE
        </button>

        {/* RESET */}
        <button
          className="w-[68px] h-[36px] rounded-xl text-white/70 text-xs font-bold flex items-center justify-center active:scale-90 transition-transform"
          style={{
            ...btnBase,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.18)",
          }}
          onTouchStart={(e) => { e.preventDefault(); set(controls, setControl, "reset", true); }}
          onTouchEnd={(e)   => { e.preventDefault(); set(controls, setControl, "reset", false); }}
        >
          ↺ RESET
        </button>
      </div>
    </div>
  );
}
