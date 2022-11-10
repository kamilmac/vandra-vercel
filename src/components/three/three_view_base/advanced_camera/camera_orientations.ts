import * as THREE from 'three';

export class CameraOrientation {
  up: THREE.Vector3;
  target: THREE.Vector3;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  zoom: number;

  // theta is like longitude (rotation around Z)
  constructor(radius: number, phi: number, theta: number) {
    const legacyRadius = 0.4426;
    this.up = new THREE.Vector3(0, 0, 1);
    this.target = new THREE.Vector3(0, 0, 0);
    this.position = new THREE.Vector3(0, 0, 0);
    this.rotation = new THREE.Euler(0, 0, 0);
    this.position.setFromSpherical(new THREE.Spherical(legacyRadius, phi, theta).makeSafe() as any);
    this.rotation.x = phi;
    this.rotation.y = 0;
    this.rotation.z = theta;
    this.zoom = legacyRadius / radius;
    const quat = new THREE.Quaternion().setFromUnitVectors(this.up, new THREE.Vector3(0, 1, 0));
    const quatInverse = quat.clone().invert();
    this.position.applyQuaternion(quatInverse);
  }
}

// TODO(Emil): name these cam_pre_initial, cam_initial etc etc.
export const CameraOrientations = {
  //                                     radius, phi (up/down),   theta (left/right)
  //                                     in      0.0: top         0.0: back
  //                                     meters  0.5: front/side  0.5: right
  //                                                              1.0: front
  front_right:     new CameraOrientation(0.40, 0.4 * Math.PI, 0.8 * Math.PI),
  front_left:      new CameraOrientation(0.40, 0.4 * Math.PI, -0.8 * Math.PI),
  front_view:      new CameraOrientation(0.40, 0.37 * Math.PI, 1.0 * Math.PI),
  high_front_view: new CameraOrientation(0.40, 0.15 * Math.PI, 1.0 * Math.PI),
  initial:         new CameraOrientation(0.4426, 0.3 * Math.PI, 0.723 * Math.PI),
  inside_view:     new CameraOrientation(0.30, 0.37 * Math.PI, 0.71 * Math.PI),
  pre_initial:     new CameraOrientation(0.36, 0.5 * Math.PI, -0.2 * Math.PI),
  rear_side_view:  new CameraOrientation(0.40, 0.37 * Math.PI, 0.25 * Math.PI),
  rear_view:       new CameraOrientation(0.40, 0.37 * Math.PI, 0.0 * Math.PI),
  side_view:       new CameraOrientation(0.48, 0.5 * Math.PI, 0.5 * Math.PI),
  top_side_view:   new CameraOrientation(0.432, 0.0 * Math.PI, 0.5 * Math.PI),
  top_view:        new CameraOrientation(0.432, 0.0 * Math.PI, 0.0 * Math.PI),
  visir:           new CameraOrientation(0.67, 0.28 * Math.PI, 0.73 * Math.PI),
  toe_left:        new CameraOrientation(0.42, 0.48 * Math.PI, -0.92 * Math.PI),
  ball_left:       new CameraOrientation(0.38, 0.5 * Math.PI, -0.7 * Math.PI),
  instep_left:     new CameraOrientation(0.42, 0.3 * Math.PI, -0.5 * Math.PI),
  heel_left:       new CameraOrientation(0.37, 0.5 * Math.PI, -0.1 * Math.PI),
  initial_beta:    new CameraOrientation(0.62, 0.3 * Math.PI, 0.723 * Math.PI),
  initial_splash:  new CameraOrientation(1.00, 0.1 * Math.PI, 1.12 * Math.PI),
};
