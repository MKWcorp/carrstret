"use client";

import { useState } from "react";
import { useAudioManager } from "@/hooks/useAudioManager";

export default function MuteButton() {
  const audio = useAudioManager();
  const [isMuted, setIsMuted] = useState(false);

  const handleToggle = () => {
    const muted = audio.toggleMute();
    setIsMuted(muted);
  };

  return (
    <button
      onClick={handleToggle}
      className="pointer-events-auto fixed top-4 right-16 z-50 w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all hover:scale-110 active:scale-90"
      style={{
        background: "rgba(0,0,0,0.6)",
        border: "1px solid #333",
      }}
      title={isMuted ? "Aktifkan Suara" : "Matikan Suara"}
    >
      {isMuted ? "🔇" : "🔊"}
    </button>
  );
}
