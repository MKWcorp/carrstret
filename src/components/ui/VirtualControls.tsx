"use client";

import type { ControlsState } from "@/types/game";

interface Props {
  /** Ref ke ControlsState — diisi langsung tanpa re-render */
  controls: React.MutableRefObject<ControlsState>;
  /** Opsional: callback lama (backward compat) */
  setControl?: (key: keyof ControlsState, value: boolean) => void;
}

interface VBtn {
  label: string;
  key: keyof ControlsState;
  className: string;
}

const BUTTONS: VBtn[] = [
  { label: "▲", key: "forward",  className: "col-start-2 row-start-1" },
  { label: "◀", key: "left",     className: "col-start-1 row-start-2" },
  { label: "▼", key: "backward", className: "col-start-2 row-start-2" },
  { label: "▶", key: "right",    className: "col-start-3 row-start-2" },
];

function set(
  controls: React.MutableRefObject<ControlsState>,
  setControl: ((k: keyof ControlsState, v: boolean) => void) | undefined,
  key: keyof ControlsState,
  value: boolean
) {
  controls.current[key] = value;
  setControl?.(key, value);
}

export default function VirtualControls({ controls, setControl }: Props) {
  return (
    <div className="absolute bottom-4 left-0 right-0 flex justify-between items-end px-4 z-20 pointer-events-none select-none sm:hidden">
      {/* D-Pad */}
      <div className="grid grid-cols-3 grid-rows-2 gap-1 pointer-events-auto">
        {BUTTONS.map((btn) => (
          <button
            key={btn.key}
            className={`${btn.className} w-14 h-14 rounded-2xl text-white text-xl font-bold flex items-center justify-center active:scale-90 transition-transform`}
            style={{
              background: "rgba(255,255,255,0.13)",
              border: "1px solid rgba(255,255,255,0.22)",
              backdropFilter: "blur(6px)",
              WebkitTapHighlightColor: "transparent",
              boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
            }}
            onTouchStart={(e) => { e.preventDefault(); set(controls, setControl, btn.key, true); }}
            onTouchEnd={(e)   => { e.preventDefault(); set(controls, setControl, btn.key, false); }}
            onMouseDown={() => set(controls, setControl, btn.key, true)}
            onMouseUp={()   => set(controls, setControl, btn.key, false)}
            onMouseLeave={() => set(controls, setControl, btn.key, false)}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Right side: Brake + Reset */}
      <div className="flex flex-col gap-2 pointer-events-auto">
        <button
          className="w-16 h-16 rounded-2xl text-white text-sm font-bold flex items-center justify-center active:scale-90 transition-transform"
          style={{
            background: "rgba(255,59,48,0.45)",
            border: "1px solid rgba(255,59,48,0.6)",
            backdropFilter: "blur(6px)",
            WebkitTapHighlightColor: "transparent",
            boxShadow: "0 0 16px rgba(255,59,48,0.3)",
          }}
          onTouchStart={(e) => { e.preventDefault(); set(controls, setControl, "brake", true); }}
          onTouchEnd={(e)   => { e.preventDefault(); set(controls, setControl, "brake", false); }}
          onMouseDown={() => set(controls, setControl, "brake", true)}
          onMouseUp={()   => set(controls, setControl, "brake", false)}
          onMouseLeave={() => set(controls, setControl, "brake", false)}
        >
          BRAKE
        </button>
        <button
          className="w-16 h-10 rounded-2xl text-white text-xs font-bold flex items-center justify-center active:scale-90 transition-transform"
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            backdropFilter: "blur(6px)",
            WebkitTapHighlightColor: "transparent",
          }}
          onTouchStart={(e) => { e.preventDefault(); set(controls, setControl, "reset", true); }}
          onTouchEnd={(e)   => { e.preventDefault(); set(controls, setControl, "reset", false); }}
          onMouseDown={() => set(controls, setControl, "reset", true)}
          onMouseUp={()   => set(controls, setControl, "reset", false)}
          onMouseLeave={() => set(controls, setControl, "reset", false)}
        >
          RESET
        </button>
      </div>
    </div>
  );
}
