"use client";

import { useRef, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { Stars } from "@react-three/drei";
import { RapierRigidBody } from "@react-three/rapier";
import type { ControlsState, CarConfig } from "@/types/game";
import Track from "./Track";
import PlayerCarConnected from "./PlayerCarConnected";

interface Props {
  controls: React.MutableRefObject<ControlsState>;
  carConfig: CarConfig;
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[50, 80, 50]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={200}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
      />
      <pointLight position={[0, 20, 0]} intensity={0.3} color="#4466ff" />
    </>
  );
}

export default function GameScene({ controls, carConfig }: Props) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 8, 15], fov: 60, near: 0.1, far: 500 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      style={{ width: "100%", height: "100%" }}
    >
      <color attach="background" args={["#050510"]} />
      <fog attach="fog" args={["#050510", 80, 200]} />
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade />

      <Lights />

      <Suspense fallback={null}>
        <Physics gravity={[0, -20, 0]}>
          <Track />
          <PlayerCarConnected controls={controls} carConfig={carConfig} />
        </Physics>
      </Suspense>
    </Canvas>
  );
}
