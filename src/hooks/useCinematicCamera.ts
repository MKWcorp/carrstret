"use client";
/**
 * ─── useCinematicCamera v2 ─────────────────────────────────────────────────────
 *
 * PERUBAHAN:
 *  - Camera roll (miring saat belok) DIHAPUS SEPENUHNYA
 *  - Kamera selalu tegak lurus (up vector = Y)
 *  - Posisi kamera di-lerp smooth di belakang mobil
 *  - Look-at sedikit di depan mobil
 *  - Dynamic FOV tetap ada (speed sensation)
 *  - Kamera TIDAK mengikuti rotasi mobil secara langsung
 *    → hanya mengikuti posisi, bukan orientasi
 *    → ini mencegah miring saat belok
 * ──────────────────────────────────────────────────────────────────────────────
 */
import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { RapierRigidBody } from "@react-three/rapier";

interface CameraConfig {
  baseFov?: number;
  maxFovBoost?: number;
  maxSpeed?: number;
  distanceBehind?: number;
  heightBase?: number;
  heightReduction?: number;
  positionLerpSpeed?: number;
  lookAtLerpSpeed?: number;
  fovLerpSpeed?: number;
}

const DEFAULT_CONFIG: Required<CameraConfig> = {
  baseFov: 60,
  maxFovBoost: 18,
  maxSpeed: 40,
  distanceBehind: 12,
  heightBase: 5,
  heightReduction: 1.2,
  positionLerpSpeed: 6,
  lookAtLerpSpeed: 9,
  fovLerpSpeed: 3,
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

  // Yaw kamera terpisah dari yaw mobil — hanya mengikuti arah hadap mobil
  // secara smooth, BUKAN langsung copy rotasi mobil
  const camYaw = useRef(0);

  useFrame((_, delta) => {
    if (!bodyRef.current) return;
    const dt = Math.min(delta, 0.05);

    const pos = bodyRef.current.translation();
    const rot = bodyRef.current.rotation();
    const carPos = new THREE.Vector3(pos.x, pos.y, pos.z);

    // ── Ambil yaw mobil dari quaternion (hanya sumbu Y) ──────────────────
    // Ini lebih stabil dari applyQuaternion karena kita hanya ambil yaw
    const carYaw = Math.atan2(
      2 * (rot.w * rot.y + rot.x * rot.z),
      1 - 2 * (rot.y * rot.y + rot.z * rot.z)
    );

    // ── Smooth camera yaw — ikuti yaw mobil perlahan ─────────────────────
    // Ini mencegah kamera "snap" saat belok tajam
    let yawDiff = carYaw - camYaw.current;
    // Normalize ke -π .. π
    while (yawDiff >  Math.PI) yawDiff -= Math.PI * 2;
    while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
    camYaw.current += yawDiff * Math.min(cfg.positionLerpSpeed * 0.8 * dt, 1);

    // ── Speed normalised ─────────────────────────────────────────────────
    const speedNorm = Math.min(Math.abs(velocityRef.current) / cfg.maxSpeed, 1);

    // ── Target camera position — di belakang mobil berdasarkan camYaw ────
    // Gunakan camYaw (bukan carYaw) agar smooth
    const dist   = cfg.distanceBehind;
    const height = cfg.heightBase - speedNorm * cfg.heightReduction;

    const targetCamPos = new THREE.Vector3(
      carPos.x + Math.sin(camYaw.current) * dist,
      carPos.y + height,
      carPos.z + Math.cos(camYaw.current) * dist
    );

    // ── Lerp posisi kamera ────────────────────────────────────────────────
    const alpha = Math.min(cfg.positionLerpSpeed * dt, 1);
    camPos.current.lerp(targetCamPos, alpha);
    camera.position.copy(camPos.current);

    // ── Look-at: sedikit di depan mobil ──────────────────────────────────
    const lookAhead = 4 + speedNorm * 5;
    const targetLook = new THREE.Vector3(
      carPos.x - Math.sin(camYaw.current) * lookAhead,
      carPos.y + 0.8,
      carPos.z - Math.cos(camYaw.current) * lookAhead
    );
    const alphaLook = Math.min(cfg.lookAtLerpSpeed * dt, 1);
    camLook.current.lerp(targetLook, alphaLook);

    // ── lookAt dengan up vector tetap (0,1,0) — TIDAK MIRING ─────────────
    camera.up.set(0, 1, 0);
    camera.lookAt(camLook.current);

    // ── Dynamic FOV ───────────────────────────────────────────────────────
    const targetFov = cfg.baseFov + speedNorm * cfg.maxFovBoost;
    currentFov.current += (targetFov - currentFov.current) * Math.min(cfg.fovLerpSpeed * dt, 1);
    (camera as THREE.PerspectiveCamera).fov = currentFov.current;
    (camera as THREE.PerspectiveCamera).updateProjectionMatrix();

    // ── TIDAK ADA camera.rotation.z — kamera selalu tegak ────────────────
  });
}
