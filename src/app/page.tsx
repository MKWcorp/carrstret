"use client";

import dynamic from "next/dynamic";

const GameWrapper = dynamic(
  () => import("@/components/game/GameWrapper"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div
            className="w-16 h-16 border-4 rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: "#00ff88", borderTopColor: "transparent" }}
          />
          <p className="text-white text-sm uppercase tracking-widest">
            Memuat Carrstret...
          </p>
        </div>
      </div>
    ),
  }
);

export default function Home() {
  return <GameWrapper />;
}
