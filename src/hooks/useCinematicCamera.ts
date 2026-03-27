"use client";

/**
 * ─── useCinematicCamera ────────────────────────────────────────────────────────
 *
 * Smooth chase camera dengan Dynamic FOV ala Asphalt 8.
 *
 * Fitur:
 *  - Posisi kamera di-lerp agar gerakan terasa smooth & sinematik
 *  - Look-at juga di-lerp agar tidak "snapping"
 *  - FOV naik secara proporsional terhadap kecepatan (speed sensation)
 *  - Sedikit camera roll saat belok (cinematic tilt)
 *  - Camera height turun sedikit saat kecepatan tinggi (low rider feel)
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { RapierRigidBody } from "@react-three/rapier";

interface CameraConfig {
  /** Base FOV saat diam */
  baseFov?: number;
  /** FOV tambahan maksimum saat kecepatan penuh */
  maxFovBoost?: number;
  /** Kecepatan maksimum mobil (m/s) untuk normalisasi FOV */
  maxSpeed?: number;
  /** Jarak kamera dari mobil (belakang) */
  distanceBehind?: number;
  /** Tinggi kamera saat diam */
  heightBase?: number;
  /** Tinggi kamera dikurangi saat kecepatan penuh */
  heightReduction?: number;
  /** Kecepatan lerp posisi kamera (lebih tinggi = lebih responsif) */
  positionLerpSpeed?: number;
  /** Kecepatan lerp look-at */
  lookAtLerpSpeed?: number;
  /** Kecepatan lerp FOV */
  fovLerpSpeed?: number;
  /** Maksimum roll (radian) saat belok */
  maxRoll?: number;
}

const DEFAULT_CONFIG: Required<CameraConfig> = {
  baseFov: 60,
  maxFovBoost: 20,
  maxSpeed: 40,
  distanceBehind: 10,
  heightBase: 4.5,
  heightReduction: 1.5,
  positionLerpSpeed: 7,
  lookAtLerpSpeed: 10,
  fovLerpSpeed: 4,
  maxRoll: 0.04,
};

export function useCinematicCamera(
  bodyRef: React.MutableRefObject<RapierRigidBody | null>,
  steerRef: React.MutableRefObject<number>,
  velocityRef: React.MutableRefObject<number>,
  config: CameraConfig = {}
) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const { camera } = useThree();

  const camPos    = useRef(new THREE.Vector3(0, cfg.heightBase, cfg.distanceBehind));
  const camLook   = useRef(new THREE.Vector3(0, 0, 0));
  const currentFov = useRef(cfg.baseFov);

  useFrame((_, delta) => {
    if (!bodyRef.current) return;
    const dt = Math.min(delta, 0.05);

    const pos  = bodyRef.current.translation();
    const rot  = bodyRef.current.rotation();
    const carPos = new THREE.Vector3(pos.x, pos.y, pos.z);
    const carQuat = new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w);

    // ── Speed normalised 0→1 ────────────────────────────────────────────────
    const speedNorm = Math.min(Math.abs(velocityRef.current) / cfg.maxSpeed, 1);

    // ── Target camera height (lower at speed) ──────────────────────────────
    const targetHeight = cfg.heightBase - speedNorm * cfg.heightReduction;

    // ── Camera offset in car-local space ───────────────────────────────────
    const localOffset = new THREE.Vector3(0, targetHeight, cfg.distanceBehind);
    const worldOffset = localOffset.applyQuaternion(carQuat);
    const targetCamPos = carPos.clone().add(worldOffset);

    // ── Smooth position ─────────────────────────────────────────────────────
    const alpha = Math.min(cfg.positionLerpSpeed * dt, 1);
    camPos.current.lerp(targetCamPos, alpha);
    camera.position.copy(camPos.current);

    // ── Look-at: slightly ahead of car ─────────────────────────────────────
    const lookAheadDist = 3 + speedNorm * 4; // further ahead at speed
    const fwdLocal = new THREE.Vector3(0, 0, -lookAheadDist).applyQuaternion(carQuat);
    const targetLook = carPos.clone().add(fwdLocal).add(new THREE.Vector3(0, 0.6, 0));
    const alphaLook = Math.min(cfg.lookAtLerpSpeed * dt, 1);
    camLook.current.lerp(targetLook, alphaLook);
    camera.lookAt(camLook.current);

    // ── Dynamic FOV ─────────────────────────────────────────────────────────
    const targetFov = cfg.baseFov + speedNorm * cfg.maxFovBoost;
    currentFov.current += (targetFov - currentFov.current) * Math.min(cfg.fovLerpSpeed * dt, 1);
    (camera as THREE.PerspectiveCamera).fov = currentFov.current;
    (camera as THREE.PerspectiveCamera).updateProjectionMatrix();

    // ── Cinematic roll (tilt into corners) ─────────────────────────────────
    const rollTarget = -steerRef.current * cfg.maxRoll * speedNorm;
    camera.rotation.z += (rollTarget - camera.rotation.z) * Math.min(6 * dt, 1);
  });
}
