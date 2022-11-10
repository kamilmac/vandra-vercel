import * as assert from 'assert';
import * as THREE from 'three';

import { getElementColor, getElementOpacity } from '@tools/helpers';

export function getElementColorVec4(elementId: string): THREE.Vector4 {
  const css_color_string: string = getElementColor(elementId);
  if (css_color_string.startsWith('rgba')) {
    // TODO(Emil): use the color-string package: https://www.npmjs.com/package/color-string
    const arguments_string = css_color_string.slice(5, css_color_string.length - 1);
    const { 0: r, 1: g, 2: b, 3: alpha } = arguments_string.split(',').map(v => Number(v));
    return new THREE.Vector4(r / 255, g / 255, b / 255, alpha);
  }
  const color = getElementThreeColor(elementId);
  const opacity = getElementOpacity(elementId);
  return new THREE.Vector4(color.r, color.g, color.b, opacity);
}

export function getElementThreeColor(elementId: string, ignoreAlpha?: boolean): THREE.Color {
  const css_color_string: string = getElementColor(elementId);
  if (css_color_string.startsWith('rgba')) {
    const arguments_string = css_color_string.slice(5, css_color_string.length - 1);
    const { 0: r, 1: g, 2: b, 3: alpha } = arguments_string.split(',').map(v => Number(v));
    if (ignoreAlpha) {
      return new THREE.Color(r / 255, g / 255, b / 255);
    }
    return new THREE.Color().lerp(new THREE.Color(r / 255, g / 255, b / 255), alpha);
  }
  return new THREE.Color(css_color_string);
}

export function findAllByName(root: THREE.Object3D, name: string): THREE.Object3D[] {
  const objects = [];
  root.traverse((child) => {
    if (child.name === name) {
      objects.push(child);
    }
  });
  return objects;
}

export function parseMatrix(value: number[][]): THREE.Matrix4 {
  const m = new THREE.Matrix4();
  m.set(
    value[0][0], value[0][1], value[0][2], value[0][3],
    value[1][0], value[1][1], value[1][2], value[1][3],
    value[2][0], value[2][1], value[2][2], value[2][3],
    value[3][0], value[3][1], value[3][2], value[3][3]);
  return m;
}

export function parseVector3(numbers: [number, number, number]): THREE.Vector3 {
  assert.equal(numbers.length, 3);
  return new THREE.Vector3(numbers[0], numbers[1], numbers[2]);
}

export function computeNormalsIfMissing(mesh: THREE.Mesh): void {
  if (mesh.geometry?.getAttribute('normal') === undefined) {
    mesh.geometry.computeVertexNormals();
  }
}

export function moveObjectTo(object: THREE.Object3D, v: THREE.Vector3): void {
  object.position.copy(v);
}

export function addWireFrame(mesh: THREE.Mesh, color: THREE.Color): THREE.Object3D {
  const o = new THREE.Object3D();
  o.add(mesh);
  // wireframe
  const geometry = new THREE.WireframeGeometry(mesh.geometry);
  const material = new THREE.LineBasicMaterial({ color, linewidth: 1 });
  const wireframe = new THREE.LineSegments(geometry, material);
  wireframe.name = 'wireframe';
  moveObjectTo(wireframe, mesh.position);
  o.add(wireframe);
  return o;
}

export const toCanvasPosition = (
  obj: THREE.Object3D,
  camera: THREE.Camera,
  canvas: HTMLCanvasElement,
) => {
  obj.updateMatrixWorld();
  const { x, y } = new THREE.Vector3().setFromMatrixPosition(obj.matrixWorld).project(camera);
  return {
    x: ((x || 0) + 1) * 0.5 * canvas.clientWidth,
    y: (1 - (y || 0)) * 0.5 * canvas.clientHeight,
  };
};
export function getBufferGeometryVertex(geometry: THREE.BufferGeometry, index: number): THREE.Vector3 {
  const vertices = geometry.getAttribute('position');
  assert.equal(vertices.itemSize, 3);
  return new THREE.Vector3(
    vertices.getX(index),
    vertices.getY(index),
    vertices.getZ(index),
  );
}

export function disposeObject(object: THREE.Object3D | THREE.Group): void {
  if (object.children.length) {
    object.children.forEach((child) => {
      disposeObject(child);
    });
  } else {
    (object as THREE.Mesh).geometry?.dispose();
    (object as any).material?.dispose();
  }
}

export function getTimeInSeconds(): number {
  return performance.now() / 1000.0;
}

export function clearObjectRoots(root: Record<'left' | 'right', THREE.Group>) {
  ['left', 'right'].forEach((footSide) => {
    while (root[footSide].children.length) {
      root[footSide].remove(root[footSide].children[0]);
    }
  });
}

export function clamp(num: number, min: number, max: number): number {
  if (num <= min) { return min; }
  if (max <= num) { return max; }
  return num;
}
