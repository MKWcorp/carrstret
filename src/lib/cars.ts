import type { CarConfig } from "@/types/game";

export const CAR_CONFIGS: CarConfig[] = [
  {
    id: "speedster",
    name: "Speedster X",
    color: "#FF3B30",
    accelForce: 18,
    maxSpeed: 40,
    turnSpeed: 0.8,
    brakeForce: 25,
    description: "Kecepatan tinggi, handling ringan",
  },
  {
    id: "bruiser",
    name: "Bruiser GT",
    color: "#007AFF",
    accelForce: 14,
    maxSpeed: 32,
    turnSpeed: 0.6,
    brakeForce: 30,
    description: "Berat & kuat, tapi stabil di tikungan",
  },
  {
    id: "phantom",
    name: "Phantom R",
    color: "#34C759",
    accelForce: 16,
    maxSpeed: 36,
    turnSpeed: 0.75,
    brakeForce: 22,
    description: "Seimbang sempurna untuk semua medan",
  },
];
