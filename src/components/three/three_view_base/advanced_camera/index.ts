// ----------------------------------------------------------------------------

//     .d8888b.
//    d88P  Y88b
//    888    888
//    888         8888b.  88888b.d88b.   .d88b.  888d888 8888b.
//    888            "88b 888 "888 "88b d8P  Y8b 888P"      "88b
//    888    888 .d888888 888  888  888 88888888 888    .d888888
//    Y88b  d88P 888  888 888  888  888 Y8b.     888    888  888
//     "Y8888P"  "Y888888 888  888  888  "Y8888  888    "Y888888

import * as THREE from 'three';

import { CameraOrientation, CameraOrientations } from './camera_orientations';

const DEG2RAD = Math.PI / 180.0;

class AdvancedCamera extends THREE.PerspectiveCamera {
  // Increase orthographic lerp to use orthographic camera projection
  // instead of perspective projection. 0.0 = perspective. 1.0 = orthographic.
  orthographicLerp: number = 0.0;
  target: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  constructor(fov: number, aspect: number, near: number, far: number) {
    super(fov, aspect, near, far);
    this.updateProjectionMatrix();
  }

  updateProjectionMatrix(): void {
    if (this.target === undefined) {
      // Workaround for constructor of superclass calling updateProjectionMatrix
      // before members are properly initialized.
      return;
    }
    const getPerspectiveViewBounds = (plane_distance) => {
      let top = plane_distance * Math.tan(DEG2RAD * 0.5 * this.fov) / this.zoom;
      let height = 2 * top;
      let width = this.aspect * height;
      let left = - 0.5 * width;
      const view = this.view;
      // TODO(Rasmus): Treat fov as diagonal fov (or minimal fov) instead of vertical fov.

      if (view !== null) {
        const fullWidth = view.fullWidth;
        const fullHeight = view.fullHeight;

        left += view.offsetX * width / fullWidth;
        top -= view.offsetY * height / fullHeight;
        width *= view.width / fullWidth;
        height *= view.height / fullHeight;
      }

      const skew = this.filmOffset;
      if (skew !== 0) {
        left += this.near * skew / this.getFilmWidth();
      }
      const right = left + width;
      const bottom = top - height;
      return { left, right, top, bottom };
    };

    const perspectiveBounds = getPerspectiveViewBounds(this.near);
    const perspectiveMatrix = new THREE.Matrix4().makePerspective(
      perspectiveBounds.left, perspectiveBounds.right,
      perspectiveBounds.top, perspectiveBounds.bottom,
      this.near, this.far);
    const distance_to_target = this.position.clone().sub(this.target).length();
    const orthographicBounds = getPerspectiveViewBounds(distance_to_target);
    const orthographicMatrix = new THREE.Matrix4().makeOrthographic(
      orthographicBounds.left, orthographicBounds.right,
      orthographicBounds.top, orthographicBounds.bottom,
      this.near, this.far);

    const a = 1.0 - this.orthographicLerp;
    const b = this.orthographicLerp;

    this.projectionMatrix = new THREE.Matrix4();
    for (let i = 0; i < 16; i += 1) {
      this.projectionMatrix.elements[i] =
        a * perspectiveMatrix.elements[i] +
        b * orthographicMatrix.elements[i];
    }
  }

  setAspect(aspect: number) {
    this.aspect = aspect;
    this.updateProjectionMatrix();
    return this;
  }

  setOrientation(orientation: CameraOrientation): void {
    this.position.copy(orientation.position);
    this.rotation.copy(orientation.rotation);
    this.target.copy(orientation.target);
    if (orientation.up) {
      this.up.copy(orientation.up);
    }
    this.updateProjectionMatrix();
    this.updateMatrix();
  }

  getRay(coords: { x: number; y: number }): THREE.Ray {
    const point_near = this.unprojectVector3(new THREE.Vector3(coords.x, coords.y, -1.0));
    const point_far  = this.unprojectVector3(new THREE.Vector3(coords.x, coords.y, 1.0));
    const direction  = point_far.clone().sub(point_near).normalize();
    return new THREE.Ray(point_near, direction);
  }

  unprojectVector3(vector: THREE.Vector3): THREE.Vector3 {
    this.updateProjectionMatrix();
    return vector.applyMatrix4(this.projectionMatrix.invert()).applyMatrix4(this.matrixWorld);
  }
}

export {
  AdvancedCamera,
  CameraOrientation,
  CameraOrientations,
};
