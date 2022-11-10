import * as assert from 'assert';
import * as THREE from 'three';

import { FitZone, FitZoneClassifications } from '@data/shoes';
import { measurementTypeFromId } from '@data/sizes';
import { Style } from '@components/three/styles';
import * as three_tools from '@components/three/three_tools';
import { MeshView, UserInterface } from '@components/three/three_view_base';
import { CameraOrientations } from '@components/three/three_view_base/advanced_camera';
import {
  clearFitZoneUniformsOfFootMaterials,
  fitZoneInfoPointsLookAt,
  getFitZoneAnchorPointsCanvasPositions,
  visualizeFitZones,
} from '@components/three/three_view_base/fit_zones_visualization';
import {
  createAxisRuler,
  createMeasurementInfoPoints,
  createPlaneRectangle,
  getFitZoneFromMeasurementType,
  getMeasurementAnchorPointsCanvasPositions,
  measurementInfoPointsLookAt,
  updateMeasurementFitZoneUniformsOfFootMaterials,
} from '@components/three/three_view_base/measurement_visualization';
import { DeviceSpecs } from '@tools/device_specs';

type ColorMode = 'default' | 'arch_type' | 'fit_zones';

class FeetScanMeshView extends MeshView {
  colorMode: ColorMode = 'default';
  fitZonesStartTime?: number = null;
  annotationModeEnabled: boolean = false;
  handleNewFootAnnotation: (screen_x: number, screen_y: number, data: FootAnnotationData) => void;
  handleExistingFootAnnotation: (screen_x: number, screen_y: number, id: number) => void;
  handleCloseFootAnnotation: () => void;

  // Root for annotations:
  footAnnotationRoots = {
    left:  new THREE.Group(),
    right: new THREE.Group(),
  };

  // Root for descriptions/rulers:
  footDescriptionRoots = {
    left:  new THREE.Group(),
    right: new THREE.Group(),
  };

  // Root for anchor points of fit zone descriptions:
  fitZonesDescriptionRoots = {
    left:  new THREE.Group(),
    right: new THREE.Group(),
  };
  // Root for anchor points of measurement fit facts descriptions:
  measurementNotesRoots = {
    left:  new THREE.Group(),
    right: new THREE.Group(),
  };

  constructor(style: Style) {
    super(style);
    this.footRoots['left'].add(this.footAnnotationRoots['left']);
    this.footRoots['right'].add(this.footAnnotationRoots['right']);

    this.footRoots['left'].add(this.footDescriptionRoots['left']);
    this.footRoots['right'].add(this.footDescriptionRoots['right']);

    this.footRoots['left'].add(this.fitZonesDescriptionRoots['left']);
    this.footRoots['right'].add(this.fitZonesDescriptionRoots['right']);

    this.footRoots['left'].add(this.measurementNotesRoots['left']);
    this.footRoots['right'].add(this.measurementNotesRoots['right']);
  }

  /**
   * ===========================================
   * MEASUREMENT VISUALIZATION
   * -------------------------------------------
   */

  showDescription(
    foot_side: FootSide,
    measurement_id: MeasurementId,
    descriptions: MeasurementDescriptions) {
    assert(measurement_id);
    const measurement_key = `${foot_side}_${measurement_id}`;
    assert(measurement_key in descriptions, Object.keys(descriptions).toString());
    const description = descriptions[measurement_key];
    assert(description);

    const bounds_in_foot = new THREE.Box3();
    three_tools.findAllByName(this.footRoots[foot_side], 'foot').forEach((mesh, index) => {
      const geometry = (mesh as THREE.Mesh).geometry;
      geometry.computeBoundingBox();
      bounds_in_foot.union(geometry.boundingBox);
    });

    const measurement_type = measurementTypeFromId(measurement_id);
    const uniforms = this.detailedFootMaterials[foot_side].uniforms;
    switch (measurement_type) {
      case 'length':
      case 'width':
      case 'arch_height':
      case 'half_width':
      case 'heel_width':
      case 'height':
        const o = createAxisRuler(foot_side, measurement_type, description, bounds_in_foot,
          this.solidMaterial, this.dashedMaterial);
        o.name = 'ruler';
        this.footDescriptionRoots[foot_side].add(o);
        const stoplines = o.getObjectByName('stoplines') as THREE.LineSegments;
        const stoplines_vertices = stoplines.geometry.getAttribute('position');
        assert.equal(stoplines_vertices.count, 4);
        uniforms.u_stopline1_p1.value = three_tools.getBufferGeometryVertex(stoplines.geometry, 0);
        uniforms.u_stopline1_p2.value = three_tools.getBufferGeometryVertex(stoplines.geometry, 1);
        uniforms.u_stopline2_p1.value = three_tools.getBufferGeometryVertex(stoplines.geometry, 2);
        uniforms.u_stopline2_p2.value = three_tools.getBufferGeometryVertex(stoplines.geometry, 3);
        break;
      case 'ankle_wrap':
      case 'ball_girth':
      case 'instep_girth':
      case 'short_heel_girth':
      case 'waist_girth':
        if ('plane' in description) {
          const plane = new THREE.Vector4().fromArray(description.plane);
          uniforms.u_girth_plane.value = plane;
          if ('cross_section_bounds' in description) {
            const p = createPlaneRectangle(foot_side, measurement_type, description,
              bounds_in_foot, this.dashedMaterial);
            p.name = 'plane';
            this.footDescriptionRoots[foot_side].add(p);
          }
        }
        break;
      default:
        console.warn(`showDescription is not implemented for "${measurement_type}"`);
        const _exhaustiveCheck: never = measurement_type; // eslint-disable-line no-underscore-dangle,  @typescript-eslint/naming-convention, max-len
    }
    this.invalidate();
  }

  // Show measurement notes
  showDescriptionNotes(
    foot_side: FootSide,
    measurement_id: MeasurementId,
    descriptions: MeasurementDescriptions,
    orbitControlsOnChangeListener: (
      data: { [K in 'left' | 'right']: { [K in string]: { x: number; y: number } } }) => void,
  ) {
    // Create measurement description card info anchor point
    const measurementType = measurementTypeFromId(measurement_id);
    const measurement_key = `${foot_side}_${measurement_id}`;
    assert(measurement_key in descriptions, Object.keys(descriptions).toString());
    const description = descriptions[measurement_key];
    const infoPoints = createMeasurementInfoPoints(
      measurementType,
      description,
    );
    this.measurementNotesRoots[foot_side].add(infoPoints);
    updateMeasurementFitZoneUniformsOfFootMaterials(
      this.detailedFootMaterials,
      measurementType,
      descriptions);
    this.fitZonesStartTime = three_tools.getTimeInSeconds();
    this.updateMaterials();

    const updateMeasurementInfoPointsCanvasPositions = () =>
      orbitControlsOnChangeListener(
        getMeasurementAnchorPointsCanvasPositions(
          this.measurementNotesRoots, this.camera, this.container as HTMLCanvasElement),
      );
    if (this.controlsListeners['measurement_info_positions_listener']) {
      this.controls?.removeEventListener(
        'change',
        this.controlsListeners['measurement_info_positions_listener'],
      );
    }
    this.controlsListeners['measurement_info_positions_listener'] = updateMeasurementInfoPointsCanvasPositions;
    this.controls?.addEventListener(
      'change',
      this.controlsListeners['measurement_info_positions_listener'],
    );
    updateMeasurementInfoPointsCanvasPositions();
  }

  removeDescriptions() {
    this.footDescriptionRoots['left'].children = [];
    this.footDescriptionRoots['right'].children = [];

    const dummy_plane = new THREE.Vector4(0, 0, 1, 1);
    const dummy_point = new THREE.Vector3(0, 0, -1);

    for (const foot of ['left', 'right']) {
      const uniforms = this.detailedFootMaterials[foot].uniforms;

      // Remove measurement stoplines,
      uniforms.u_stopline1_p1.value = dummy_point;
      uniforms.u_stopline1_p2.value = dummy_point;
      uniforms.u_stopline2_p1.value = dummy_point;
      uniforms.u_stopline2_p2.value = dummy_point;

      // Set girth plane to a dummy plane far away from the foot.
      uniforms.u_girth_plane.value = dummy_plane;
    }

    // remove measurement highlight markers and materials
    this.measurementNotesRoots['left'].children = [];
    this.measurementNotesRoots['right'].children = [];
    clearFitZoneUniformsOfFootMaterials(this.detailedFootMaterials);
    this.fitZonesStartTime = 0;
    this.updateMaterials();
    this.controls?.removeEventListener(
      'change',
      this.controlsListeners['measurement_info_positions_listener'],
    );
    this.controlsListeners['measurement_info_positions_listener'] = null;

    this.invalidate();
  }

  /**
   * ===========================================
   * FEET ANNOTATIONS
   * -------------------------------------------
   */
  initFootAnnotation(
    onNew: (screen_x: number, screen_y: number, data: FootAnnotationData) => void,
    onExisting: (screen_x: number, screen_y: number, id: number) => void,
    onClose: () => void) {
    this.handleNewFootAnnotation = onNew;
    this.handleExistingFootAnnotation = onExisting;
    this.handleCloseFootAnnotation = onClose;

    this.container.addEventListener('mousedown', this.onMouseDown);
    this.annotationModeEnabled = true;
  }

  addFootAnnotation(
    object: THREE.Object3D,
    intersectionPoint: THREE.Vector3,
    screenCoordinate: THREE.Vector2,
  ) {
    this.handleNewFootAnnotation(
      screenCoordinate.x, screenCoordinate.y,
      {
        text:          '',
        foot_side:     object.userData.foot,
        point_in_foot: object.worldToLocal(intersectionPoint).toArray(),
      },
    );
  }

  updateFootAnnotations(foot_annotations: FootAnnotationData[]) {
    // Remove all current annotations
    this.footAnnotationRoots['left'].children = [];
    this.footAnnotationRoots['right'].children = [];

    // Add all annotations as new objects
    foot_annotations.forEach((data, index) => {
      const sprite = new THREE.TextureLoader().load('/build/images/foot_annotation_dot.png');
      const geometry = new THREE.BufferGeometry();
      const vertices = new Float32Array(data.point_in_foot);
      geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      geometry.boundingBox = null;
      geometry.computeBoundingSphere();
      geometry.boundingSphere.radius = 0.01;

      const material = new THREE.PointsMaterial({
        size:            60,
        sizeAttenuation: false,
        map:             sprite,
        alphaTest:       0.5,
        transparent:     true,
        depthTest:       false,
      });

      material.color.setHSL(1.0, 0.3, 0.7);
      const annotation = new THREE.Points(geometry, material);
      annotation.name = 'annotation';
      annotation.userData.annotation_id = index;
      this.footAnnotationRoots[data.foot_side].add(annotation);
    });

    this.invalidate();
  }

  checkAnnotationIntersection(mouse: THREE.Vector2, screenCoordinate: THREE.Vector2) {
    const ray = this.camera.getRay(mouse);
    this.raycaster.set(ray.origin, ray.direction);
    const all_annotations = three_tools.findAllByName(this.scene, 'annotation');
    this.raycaster.params.Points.threshold = 0.01;
    const annotation_intersects = this.raycaster.intersectObjects(all_annotations, true);
    if (annotation_intersects.length > 0) {
      this.handleExistingFootAnnotation(
        screenCoordinate.x,
        screenCoordinate.y,
        annotation_intersects[0].object.userData.annotation_id);
      return;
    }
    const all_foot_meshes = three_tools.findAllByName(this.scene, 'foot');
    const intersects = this.raycaster.intersectObjects(all_foot_meshes);
    if (intersects.length === 0) {
      this.handleCloseFootAnnotation();
      return;
    }
    this.addFootAnnotation(intersects[0].object, intersects[0].point, screenCoordinate);
  }

  /**
   * ===========================================
   * FITZONES VISUALIZATION
   * -------------------------------------------
   */
  showFitZones(
    fitZoneClassifications: FitZoneClassifications,
    measurementDescriptions: MeasurementDescriptions,
    orbitControlsOnChangeListener: (
      data: { [K in 'left' | 'right']: { [K in FitZone]: { x: number; y: number } } }) => void,
  ) {
    this.colorMode = 'fit_zones';
    this.fitZonesStartTime = three_tools.getTimeInSeconds();
    visualizeFitZones(
      this.fitZonesDescriptionRoots,
      this.detailedFootMaterials,
      fitZoneClassifications,
      measurementDescriptions,
    );
    this.updateMaterials();
    const updateFitZonesInfoPointsCanvasPositions = () =>
      orbitControlsOnChangeListener(
        getFitZoneAnchorPointsCanvasPositions(
          this.fitZonesDescriptionRoots, this.camera, this.container as HTMLCanvasElement),
      );
    if (this.controlsListeners['fit_zones_positions_listener']) {
      this.controls?.removeEventListener(
        'change',
        this.controlsListeners['fit_zones_positions_listener'],
      );
    }
    this.controlsListeners['fit_zones_positions_listener'] = updateFitZonesInfoPointsCanvasPositions;
    this.controls?.addEventListener(
      'change',
      this.controlsListeners['fit_zones_positions_listener'],
    );
    updateFitZonesInfoPointsCanvasPositions();
  }

  removeFitZones() {
    clearFitZoneUniformsOfFootMaterials(this.detailedFootMaterials);
    three_tools.clearObjectRoots(this.fitZonesDescriptionRoots);
    this.controls.removeEventListener('change', this.controlsListeners['fit_zones_positions_listener']);
    this.controlsListeners['fit_zones_positions_listener'] = null;
    this.colorMode = 'default';
    this.fitZonesStartTime = 0.0;
    this.updateMaterials();
  }

  paint() {
    if (!this.container) {
      return;
    }

    const WIREFRAME_DELAY        = 0.0;  // Wait this long before starting to show the mesh lines
    const MESH_DELAY             = 1.0;  // Wait this long before starting to show the feet
    const CUTOFF_ANIMATION_SPEED = 0.04; // Meters per second
    const SHADOW_SPEED           = 1.5;  // How fast to fade in the shadows
    const INITIAL_ANIMATION_TIME = 3.0;  // Approximate estimation for most feet.

    if (this.hasRendererSizeChanged()) {
      this.updateRendererSizeAndMaterials();
    }

    const now = three_tools.getTimeInSeconds();
    const timeSinceFeet = this.allFeetLoadedTime ? now - this.allFeetLoadedTime : 0.0;
    const timeSinceFitZonesStarted = this.fitZonesStartTime ? now - this.fitZonesStartTime : 0.0;

    // TODO(Emil): hook up to slider
    this.detailedFootMaterials['left'].uniforms.u_error_vis.value = 0.0;
    this.detailedFootMaterials['right'].uniforms.u_error_vis.value = 0.0;

    this.detailedFootMaterials['left'].uniforms.u_cutoff_height.value =
      CUTOFF_ANIMATION_SPEED * (timeSinceFeet - MESH_DELAY);
    this.detailedFootMaterials['right'].uniforms.u_cutoff_height.value =
      CUTOFF_ANIMATION_SPEED * (timeSinceFeet - MESH_DELAY);
    this.lineMaterial.uniforms.u_cutoff_height.value =
      CUTOFF_ANIMATION_SPEED * (timeSinceFeet - WIREFRAME_DELAY);

    if (this.footRoots['left'].visible) {
      this.groundMaterial.uniforms.u_left.value =
        three_tools.clamp(SHADOW_SPEED * (timeSinceFeet - MESH_DELAY), 0.0, 1.0);
    } else {
      this.groundMaterial.uniforms.u_left.value = 0.0;
    }

    if (this.footRoots['right'].visible) {
      this.groundMaterial.uniforms.u_right.value =
        three_tools.clamp(SHADOW_SPEED * (timeSinceFeet - MESH_DELAY), 0.0, 1.0);
    } else {
      this.groundMaterial.uniforms.u_right.value = 0.0;
    }

    if (timeSinceFeet < INITIAL_ANIMATION_TIME) {
      // Hold off the mesh line wave animation until we have faded in the feet.
      this.lineMaterial.uniforms.u_time.value = 0.0;
    } else {
      this.lineMaterial.uniforms.u_time.value = timeSinceFeet - INITIAL_ANIMATION_TIME;
    }

    this.detailedFootMaterials['left'].uniforms.u_time_fit_zones.value = timeSinceFitZonesStarted;
    this.detailedFootMaterials['right'].uniforms.u_time_fit_zones.value = timeSinceFitZonesStarted;
    if (this.ssaaRenderTarget) {
      this.renderer.setRenderTarget(this.ssaaRenderTarget);
      this.renderer.render(this.scene, this.camera);
      this.copyPass.render(this.renderer, null, this.ssaaRenderTarget, null, null);
    } else {
      this.renderer.render(this.scene, this.camera);
    }

    // Update info points anchor point positions to always face the camera.
    fitZoneInfoPointsLookAt(this.fitZonesDescriptionRoots, this.camera.position);
    measurementInfoPointsLookAt(this.measurementNotesRoots, this.camera.position);
    this.animationFrameId = requestAnimationFrame(() => { this.paint(); });
  }

  onMouseUp = (event: MouseEvent) => {
    const canvasRect = this.renderer.domElement.getBoundingClientRect();
    const relativeClientX = event.clientX - canvasRect.left;
    const relativeClientY = event.clientY - canvasRect.top;
    const mouse = new THREE.Vector2(
      + (relativeClientX / canvasRect.width) * 2 - 1,
      - (relativeClientY / canvasRect.height) * 2 + 1,
    );
    const screenCoordinate = new THREE.Vector2(event.clientX, event.clientY);
    if (this.annotationModeEnabled) {
      this.checkAnnotationIntersection(mouse, screenCoordinate);
    }
    this.container.removeEventListener('mouseup', this.onMouseUp);
    this.container.removeEventListener('mousemove', this.onMouseMove);
  };
}

//    888     888 8888888
//    888     888   888
//    888     888   888
//    888     888   888
//    888     888   888
//    888     888   888
//    Y88b. .d88P   888
//     "Y88888P"  8888888

export class FeetScan3DUserInterface extends UserInterface {
  protected meshView: FeetScanMeshView;

  constructor(
    styleType: 'default' | 'detailed',
    measurementDescriptions: MeasurementDescriptions,
    isVisir: boolean,
    deviceSpecs: DeviceSpecs,
    beta?: boolean,
  ) {
    super(styleType, measurementDescriptions, isVisir, deviceSpecs, true);
    this.meshView = new FeetScanMeshView(this.style);
    this.prepareCamera();
  }

  initFootAnnotationInMesh(
    openNewFootAnnotation: (screen_x: number, screen_y: number, data: FootAnnotationData) => void,
    openExistingFootAnnotation: (screen_x: number, screen_y: number, id: number) => void,
    closeFootAnnotation: () => void,
  ) {
    this.meshView.initFootAnnotation(
      this.isVisir ? () => {} : openNewFootAnnotation,
      openExistingFootAnnotation,
      closeFootAnnotation,
    );
  }

  updateFootAnnotationsInMesh(footAnnotations: FootAnnotationData[]) {
    this.meshView.updateFootAnnotations(footAnnotations);
  }

  removeDescriptionsInMesh() {
    this.meshView.removeDescriptions();
  }

  showDescriptionInMesh(
    measurementId: MeasurementId,
    measurementNotes: string,
    orbitControlsOnChangeListener: (
      data: { [K in 'left' | 'right']: { [K in string]: { x: number; y: number } } }) => void,
  ) {
    this.meshView.showDescription(
      'left', measurementId, this.measurementDescriptions);
    this.meshView.showDescription(
      'right', measurementId, this.measurementDescriptions);
    if (measurementNotes) {
      this.meshView.showDescriptionNotes(
        'left', measurementId, this.measurementDescriptions, orbitControlsOnChangeListener);
      this.meshView.showDescriptionNotes(
        'right', measurementId, this.measurementDescriptions, orbitControlsOnChangeListener);
    }
  }

  onFeetLoaded(init_camera: string) {
    this.meshView.allFeetLoadedTime = three_tools.getTimeInSeconds();
    this.meshView.animateTo(CameraOrientations[init_camera], 2.5);
  }

  setColorMode(colormode: ColorMode) {
    this.meshView.setColorMode(colormode);
  }

  getColorMode = () => this.meshView.colorMode;

  showFitZones = (
    fitZoneClassifications: FitZoneClassifications,
    orbitControlsOnChangeListener: (
      data: { [K in 'left' | 'right']: { [K in FitZone]: { x: number; y: number } } }) => void,
  ) => {
    this.meshView.showFitZones(
      fitZoneClassifications,
      this.measurementDescriptions,
      orbitControlsOnChangeListener,
    );
  };

  removeFitZones = () => this.meshView.removeFitZones();
}
