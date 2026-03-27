"use client";

import { useState } from "react";
import { useGameStore } from "@/hooks/useGameStore";
import { CAR_CONFIGS } from "@/lib/cars";
import type { CarConfig } from "@/types/game";

export default function CarSelect() {
  const { selectedCar, selectCar, setScreen } = useGameStore();
  const [hovered, setHovered] = useState<string | null>(null);

  const handleSelect = (car: CarConfig) => {
    selectCar(car);
  };

  const handlePlay = () => {
    setScreen("playing");
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full min-h-screen bg-black overflow-hidden px-4 py-8 select-none">
      {/* Background */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "radial-gradient(circle at 50% 50%, #00ff88 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => setScreen("menu")}
            className="absolute left-0 top-0 text-gray-400 hover:text-white text-sm flex items-center gap-1 transition-colors"
          >
            ← Kembali
          </button>
          <h2
            className="text-3xl sm:text-4xl font-black uppercase tracking-widest"
            style={{ color: "#00ff88", textShadow: "0 0 20px #00ff8866" }}
          >
            PILIH MOBIL
          </h2>
          <p className="text-gray-500 text-sm mt-1">Pilih kendaraan terbaikmu</p>
        </div>

        {/* Car Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {CAR_CONFIGS.map((car) => {
            const isSelected = selectedCar?.id === car.id;
            const isHovered = hovered === car.id;

            return (
              <button
                key={car.id}
                onClick={() => handleSelect(car)}
                onMouseEnter={() => setHovered(car.id)}
                onMouseLeave={() => setHovered(null)}
                className="relative flex flex-col items-center gap-4 p-6 rounded-xl border-2 transition-all duration-200 active:scale-95"
                style={{
                  borderColor: isSelected ? car.color : isHovered ? `${car.color}66` : "#333",
                  background: isSelected
                    ? `${car.color}15`
                    : isHovered
                    ? "#111"
                    : "#0a0a0a",
                  boxShadow: isSelected ? `0 0 30px ${car.color}44` : "none",
                }}
              >
                {/* Selected badge */}
                {isSelected && (
                  <div
                    className="absolute top-3 right-3 text-xs font-bold px-2 py-1 rounded-full"
                    style={{ background: car.color, color: "#000" }}
                  >
                    ✓ DIPILIH
                  </div>
                )}

                {/* Car 3D Preview (Box placeholder) */}
                <div className="relative w-32 h-20 sm:w-40 sm:h-24">
                  {/* Car body */}
                  <div
                    className="absolute inset-x-4 inset-y-4 rounded-md"
                    style={{
                      background: `linear-gradient(135deg, ${car.color}, ${car.color}88)`,
                      boxShadow: isSelected ? `0 0 20px ${car.color}88` : "none",
                      transform: "perspective(200px) rotateX(15deg) rotateY(-20deg)",
                    }}
                  />
                  {/* Car roof */}
                  <div
                    className="absolute inset-x-8 top-2 bottom-6 rounded-t-lg"
                    style={{
                      background: `${car.color}cc`,
                      transform: "perspective(200px) rotateX(15deg) rotateY(-20deg)",
                    }}
                  />
                  {/* Wheels */}
                  {[
                    { left: "4px", bottom: "2px" },
                    { right: "4px", bottom: "2px" },
                  ].map((pos, i) => (
                    <div
                      key={i}
                      className="absolute w-5 h-5 rounded-full bg-gray-800 border-2 border-gray-600"
                      style={pos}
                    />
                  ))}
                </div>

                {/* Car Info */}
                <div className="text-center">
                  <h3
                    className="font-bold text-lg uppercase tracking-wide"
                    style={{ color: isSelected ? car.color : "#fff" }}
                  >
                    {car.name}
                  </h3>
                  <p className="text-gray-500 text-xs mt-1">{car.description}</p>
                </div>

                {/* Stats */}
                <div className="w-full space-y-2">
                  {[
                    { label: "Kecepatan", value: (car.maxSpeed / 40) * 100 },
                    { label: "Akselerasi", value: (car.accelForce / 18) * 100 },
                    { label: "Handling", value: (car.turnSpeed / 0.8) * 100 },
                  ].map((stat) => (
                    <div key={stat.label} className="flex items-center gap-2">
                      <span className="text-gray-500 text-xs w-20 text-left">{stat.label}</span>
                      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${stat.value}%`,
                            background: isSelected ? car.color : "#555",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Play Button */}
        <div className="flex justify-center">
          <button
            onClick={handlePlay}
            className="py-4 px-16 text-black font-black text-xl uppercase tracking-widest rounded-xl transition-all duration-200 active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${selectedCar?.color ?? "#00ff88"}, ${selectedCar?.color ?? "#00ff88"}88)`,
              boxShadow: `0 0 30px ${selectedCar?.color ?? "#00ff88"}66`,
            }}
          >
            BALAPAN SEKARANG →
          </button>
        </div>
      </div>
    </div>
  );
}
