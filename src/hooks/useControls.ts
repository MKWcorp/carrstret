"use client";

import { useEffect, useRef, useCallback } from "react";
import type { ControlsState } from "@/types/game";

const DEFAULT_CONTROLS: ControlsState = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  brake: false,
  reset: false,
};

export function useControls() {
  const controls = useRef<ControlsState>({ ...DEFAULT_CONTROLS });

  // ─── Keyboard ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case "ArrowUp":
        case "KeyW":
          controls.current.forward = true;
          break;
        case "ArrowDown":
        case "KeyS":
          controls.current.backward = true;
          break;
        case "ArrowLeft":
        case "KeyA":
          controls.current.left = true;
          break;
        case "ArrowRight":
        case "KeyD":
          controls.current.right = true;
          break;
        case "Space":
          e.preventDefault();
          controls.current.brake = true;
          break;
        case "KeyR":
          controls.current.reset = true;
          break;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case "ArrowUp":
        case "KeyW":
          controls.current.forward = false;
          break;
        case "ArrowDown":
        case "KeyS":
          controls.current.backward = false;
          break;
        case "ArrowLeft":
        case "KeyA":
          controls.current.left = false;
          break;
        case "ArrowRight":
        case "KeyD":
          controls.current.right = false;
          break;
        case "Space":
          controls.current.brake = false;
          break;
        case "KeyR":
          controls.current.reset = false;
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // ─── Touch helpers (called from virtual buttons) ─────────────────────────
  const setControl = useCallback((key: keyof ControlsState, value: boolean) => {
    controls.current[key] = value;
  }, []);

  return { controls, setControl };
}
