import * as THREE from 'three';

import { Style } from '../styles';

function createDirectionalLight(color: string | number, intensity: number, x: number, y: number, z: number) {
  const directionalLight = new THREE.DirectionalLight(color, intensity);
  directionalLight.position.set(x, y, z);
  return directionalLight;
}

export function addLights(scene: THREE.Scene, style: Style) {
  scene.add(new THREE.AmbientLight(style.lights.ambient));

  // spotlights
  const z: number          = style.lights.directional.z;
  const intensity: number          = style.lights.directional.intensity;
  const color: string | number = style.lights.directional.color;

  scene.add(createDirectionalLight(color, intensity, -0.3, -0.3, z));
  scene.add(createDirectionalLight(color, intensity, 0.3, -0.3, z));
  scene.add(createDirectionalLight(color, intensity, -0.3, 0.3, z));
  scene.add(createDirectionalLight(color, intensity, 0.3, 0.3, z));
}
