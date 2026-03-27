// ─── Game State Types ─────────────────────────────────────────────────────────

export type GameScreen = "menu" | "car-select" | "playing" | "paused" | "gameover";

export interface CarConfig {
  id: string;
  name: string;
  color: string;
  accelForce: number;
  maxSpeed: number;
  turnSpeed: number;
  brakeForce: number;
  description: string;
}

export interface GameState {
  screen: GameScreen;
  selectedCar: CarConfig | null;
  lapTime: number;
  bestLapTime: number | null;
  currentLap: number;
  totalLaps: number;
  speed: number;
  isEngineOn: boolean;
}

// ─── Controls Types ───────────────────────────────────────────────────────────

export interface ControlsState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  brake: boolean;
  reset: boolean;
}

// ─── Audio Types ──────────────────────────────────────────────────────────────

export interface AudioConfig {
  bgMusic: string;
  engineIdle: string;
  engineRev: string;
  crash: string;
  countdown: string;
  lapComplete: string;
}
