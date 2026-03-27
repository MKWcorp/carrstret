"use client";

import type { ControlsState } from "@/types/game";

interface Props {
  setControl: (key: keyof ControlsState, value: boolean) => void;
}

interface VBtn {
  label: string;
  key: keyof ControlsState;
  className: string;
}

const BUTTONS: VBtn[] = [
  { label: "⬆", key: "forward", className: "col-start-2 row-start-1" },
  { label: "⬅", key: "left", className: "col-start-1 row-start-2" },
  { label: "⬇", key: "backward", className: "col-start-2 row-start-2" },
  { label: "➡", key: "right", className: "col-start-3 row-start-2" },
];

export default function VirtualControls({ setControl }: Props) {
  return (
    <div className="absolute bottom-4 left-0 right-0 flex justify-between items-end px-4 z-20 pointer-events-none select-none sm:hidden">
      {/* D-Pad */}
      <div className="grid grid-cols-3 grid-rows-2 gap-1 pointer-events-auto">
        {BUTTONS.map((btn) => (
          <button
            key={btn.key}
            className={`${btn.className} w-14 h-14 rounded-xl text-white text-2xl font-bold flex items-center justify-center active:scale-90 transition-transform`}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.2)",
              backdropFilter: "blur(4px)",
              WebkitTapHighlightColor: "transparent",
            }}
            onTouchStart={(e) => { e.preventDefault(); setControl(btn.key, true); }}
            onTouchEnd={(e) => { e.preventDefault(); setControl(btn.key, false); }}
            onMouseDown={() => setControl(btn.key, true)}
            onMouseUp={() => setControl(btn.key, false)}
            onMouseLeave={() => setControl(btn.key, false)}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Right side: Brake + Reset */}
      <div className="flex flex-col gap-2 pointer-events-auto">
        <button
          className="w-16 h-16 rounded-xl text-white text-sm font-bold flex items-center justify-center active:scale-90 transition-transform"
          style={{
            background: "rgba(255,59,48,0.4)",
            border: "1px solid rgba(255,59,48,0.5)",
            backdropFilter: "blur(4px)",
            WebkitTapHighlightColor: "transparent",
          }}
          onTouchStart={(e) => { e.preventDefault(); setControl("brake", true); }}
          onTouchEnd={(e) => { e.preventDefault(); setControl("brake", false); }}
          onMouseDown={() => setControl("brake", true)}
          onMouseUp={() => setControl("brake", false)}
          onMouseLeave={() => setControl("brake", false)}
        >
          BRAKE
        </button>
        <button
          className="w-16 h-10 rounded-xl text-white text-xs font-bold flex items-center justify-center active:scale-90 transition-transform"
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            backdropFilter: "blur(4px)",
            WebkitTapHighlightColor: "transparent",
          }}
          onTouchStart={(e) => { e.preventDefault(); setControl("reset", true); }}
          onTouchEnd={(e) => { e.preventDefault(); setControl("reset", false); }}
          onMouseDown={() => setControl("reset", true)}
          onMouseUp={() => setControl("reset", false)}
          onMouseLeave={() => setControl("reset", false)}
        >
          RESET
        </button>
      </div>
    </div>
  );
}
