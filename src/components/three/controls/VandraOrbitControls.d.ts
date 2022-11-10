import { Camera, MOUSE, Spherical, TOUCH, Vector3 } from 'THREE';

declare class VandraOrbitControls {
  constructor(object: Camera, domElement?: HTMLElement);

  object: Camera;
  domElement: HTMLElement;

  enabled: boolean;
  target: Vector3;

  minDistance: number;
  maxDistance: number;

  minZoom: number;
  maxZoom: number;

  minPolarAngle: number;
  maxPolarAngle: number;

  minAzimuthAngle: number;
  maxAzimuthAngle: number;

  enableDamping: boolean;
  dampingFactor: number;

  enableZoom: boolean;
  zoomSpeed: number;

  enableRotate: boolean;
  rotateSpeed: number;

  enablePan: boolean;
  panSpeed: number;
  screenSpacePanning: boolean;
  keyPanSpeed: number;

  autoRotate: boolean;
  autoRotateSpeed: number;

  enableKeys: boolean;
  keys: { LEFT: number; UP: number; RIGHT: number; BOTTOM: number };
  mouseButtons: { LEFT: MOUSE; MIDDLE: MOUSE; RIGHT: MOUSE; ORBIT: MOUSE; ZOOM: MOUSE };
  touches: { ONE: TOUCH; TWO: TOUCH };

  animationRotationSpeed: number; // Radians per second
  animationRadiusSpeed: number; // Meters per second
  animationTargetSpeed: number; // Meters per second
  animationZoomSpeed: number; // Zoom multiplier or divisor per second

  animate: boolean;

  update(): boolean;
  dispose(): void;

  getPolarAngle(): number;
  getAzimuthalAngle(): number;
  getAutoRotationAngle(): number;
  getZoomScale(): number;

  // EventDispatcher mixins
  addEventListener(type: string, listener: (event: any) => void): void;
  hasEventListener(type: string, listener: (event: any) => void): boolean;
  removeEventListener(type: string, listener: (event: any) => void): void;
  dispatchEvent(event: { type: string; target: any }): void;

  sphericalFromPosition(position: Vector3): Spherical;
  positionFromSpherical(spherical: Spherical): Vector3;

  updateAnimationInternals(duration_factor: number): void;

  animateToPose(relative_position: Vector3, target: Vector3, zoom: number, duration_factor: number): void;
  jumpToPose(relative_position: Vector3, target: Vector3, zoom: number): void;

  updateTarget(target: Vector3): void;

  rotateLeft(angle: number): void;
  rotateUp(angle: number): void;

  dollyIn(dollyScale: number): void;
  dollyOut(dollyScale: number): void;

  handleMouseDownRotate(event: MouseEvent): void;
  handleMouseDownDolly(event: MouseEvent): void;
  handleMouseMoveDolly(event: MouseEvent): void;
  handleMouseUp(event: MouseEvent): void;
  handleMouseWheel(event: MouseEvent): void;
  handleTouchStartRotate(event: MouseEvent): void;
  handleTouchStartDolly(event: MouseEvent): void;
  handleTouchMoveRotate(event: MouseEvent): void;
  handleTouchMoveDolly(event: MouseEvent): void;
  onMouseDown(event: MouseEvent): void;
  onMouseMove(event: MouseEvent): void;
  onMouseUp(event: MouseEvent): void;
  onMouseWheel(event: MouseEvent): void;
  onTouchStart(event: MouseEvent): void;
  onTouchMove(event: MouseEvent): void;
  onTouchEnd(event: MouseEvent): void;
}
