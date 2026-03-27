"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";

interface Props {
  target: React.MutableRefObject<RapierRigidBody | null>;
}

const CAM_OFFSET = new THREE.Vector3(0, 5, 12);
const CAM_LOOK_OFFSET = new THREE.Vector3(0, 0.5, 0);
const LERP_SPEED = 8;

export default function CameraFollow({ target }: Props) {
  const { camera } = useThree();
  const camPos = useRef(new THREE.Vector3(0, 5, 12));
  const lookAt = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((_, delta) => {
    if (!target.current) return;
    const pos = target.current.translation();
    const rot = target.current.rotation();

    const carPos = new THREE.Vector3(pos.x, pos.y, pos.z);
    const carQuat = new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w);

    // Camera position behind car
    const offset = CAM_OFFSET.clone().applyQuaternion(carQuat);
    const targetCamPos = carPos.clone().add(offset);

    camPos.current.lerp(targetCamPos, Math.min(LERP_SPEED * delta, 1));
    camera.position.copy(camPos.current);

    // Look at car
    const targetLook = carPos.clone().add(CAM_LOOK_OFFSET);
    lookAt.current.lerp(targetLook, Math.min(LERP_SPEED * delta, 1));
    camera.lookAt(lookAt.current);
  });

  return null;
}
