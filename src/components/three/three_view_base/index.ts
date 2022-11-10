import * as assert from 'assert';
import * as _ from 'lodash';
import * as THREE from 'three';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader';

import { reconstructionBlobUrl } from '@data/reconstruction_blob';
import { DeviceSpecs } from '@tools/device_specs';
import { checkStatus, getElementOpacity, isFastTesting } from '@tools/helpers';

import { VandraOrbitControls } from '../controls/VandraOrbitControls';
import { BMFLoader } from '../loaders/BMFLoader';
import * as materials from '../materials';
import { Style, styles } from '../styles';
import * as three_tools from '../three_tools';

import { AdvancedCamera, CameraOrientation, CameraOrientations } from './advanced_camera';
import { addLights } from './lightings';

type CameraViewName = keyof typeof CameraOrientations;
type ColorMode = 'default' | 'arch_type' | 'fit_zones' | 'measurement';
type VandraOrbitControlsListeners = { [K in string]: (event: any) => void };

function setMatteMaterial(mesh: THREE.Mesh, style: Style) {
  if (!(mesh.material instanceof THREE.Material)) {
    return;
  }
  mesh.material.side = THREE.DoubleSide;
  if (style.opacity && style.opacity < 1.0) {
    mesh.material.opacity = style.opacity;
    mesh.material.transparent = true;
  }

  if (mesh.material instanceof THREE.MeshLambertMaterial) {
    mesh.material.color.set(0xefefef);
  }
}

function averageVector3(positions: THREE.Vector3[]): THREE.Vector3 {
  assert(positions.length !== 0);
  const sum = positions.reduce((acc, x) => { return acc.add(x); }, new THREE.Vector3(0, 0, 0));
  return sum.divideScalar(positions.length);
}

export class MeshView {
  container: HTMLElement = null;
  dimensions = { height: 0, width: 0 };
  allFeetLoadedTime?: number = null;
  basePlateRoot: THREE.Group = new THREE.Group();
  camera: AdvancedCamera = new AdvancedCamera(60, 1, 0.05, 1.5);
  controls?: VandraOrbitControls = null;
  controlsListeners?: VandraOrbitControlsListeners = {};
  copyPass: ShaderPass = new ShaderPass(CopyShader);
  groundMaterial: THREE.ShaderMaterial = materials.getGroundMaterial();
  lineMaterial: THREE.ShaderMaterial = materials.getLineMaterial();
  solidMaterial: THREE.LineBasicMaterial = materials.getSolidMaterial();
  dashedMaterial: THREE.LineDashedMaterial = materials.getDashedMaterial();
  raycaster: THREE.Raycaster = new THREE.Raycaster();
  renderer: THREE.WebGLRenderer;
  root: THREE.Group = new THREE.Group();
  scene: THREE.Scene = new THREE.Scene();
  ssaaRenderTarget?: THREE.WebGLRenderTarget = null;
  style: Style;
  colorMode: ColorMode = 'default';
  footAnnotations: FootAnnotationData[] = [];
  animationFrameId: number;

  public footRoots = {
    left:  new THREE.Group(),
    right: new THREE.Group(),
  };

  detailedFootMaterials: {[K in 'left' | 'right']: THREE.ShaderMaterial} = {
    left:  materials.getDetailedMaterial(),
    right: materials.getDetailedMaterial(),
  };

  constructor(style: Style) {
    this.style = style;

    this.updateMaterials();

    this.container = document.getElementById('canvas');

    // Scene
    three_tools.moveObjectTo(this.root, new THREE.Vector3(0.0, 0.0, -0.02));
    addLights(this.scene, style);
    this.scene.add(this.root);

    // Renderer
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const aspect = width / height;

    console.log(`renderer: ${width}x${height}`);
    this.renderer = new THREE.WebGLRenderer({ alpha: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(width, height);
    this.renderer.setClearColor(0xffffff);
    this.renderer.setClearAlpha(0);
    this.container.appendChild(this.renderer.domElement);

    // Default foot positions in case there is no scene.json:
    three_tools.moveObjectTo(this.footRoots['left'], new THREE.Vector3(-0.06, -0.2, 0.0));
    three_tools.moveObjectTo(this.footRoots['right'], new THREE.Vector3(+0.06, -0.2, 0.0));

    this.root.add(this.footRoots['left']);
    this.root.add(this.footRoots['right']);
    this.root.add(this.basePlateRoot);

    // Camera
    this.camera.setOrientation(CameraOrientations.pre_initial);
    this.camera.setAspect(aspect);
    this.setupControls(this.camera);

    this.copyPass.renderToScreen = false;

    this.updateRendererSize(); // Generates this.ssaaRenderTarget

    this.animationFrameId = requestAnimationFrame(() => { this.paint(); });

    // Fixes app crash in ios app, event sent from ios app
    window.addEventListener('appInactive', (e) => {
      // Stop drawing when app is inactive
      window.cancelAnimationFrame(this.animationFrameId);
      console.log('AppInactive');
    }, false);

    window.addEventListener('appActive', (e) => {
      // Start drawing again when app is active
      this.animationFrameId = requestAnimationFrame(() => { this.paint(); });
      console.log('appActive');
    }, false);

    window.onbeforeunload = () => {
      this.dispose();
    };
  }

  setColorMode(colormode: ColorMode): void {
    this.colorMode = colormode;
    this.updateMaterials();
  }

  setupControls(camera) {
    this.controls = new VandraOrbitControls(camera, this.container);
    this.controls.minDistance = 0.2;
    this.controls.maxDistance = 1.5;
    this.controls.minZoom = 0.2;
    this.controls.maxZoom = 5.0;
    this.controls.target = new THREE.Vector3(0, 0, 0);
    this.controls.rotateSpeed = 0.75;
    this.controls.animationRadiusSpeed = 0.25;
    this.controls.animationTargetSpeed = 0.25;
    this.controls.animationZoomSpeed = 2.0;

    this.controls.addEventListener('change', () => {
      this.invalidate();
    });
    this.controls.addEventListener('end', () => {
      this.updateAnimationTarget();
    });
  }

  updateMaterials(): void {
    const {
      ground_color_id,
      meshlines_color_id,
    } = this.colorMode === 'arch_type' ? {
      ground_color_id:    'arch-type-color',
      meshlines_color_id: 'arch-type-color',
    } : {
      ground_color_id:    'ground-pattern-color',
      meshlines_color_id: 'default-meshlines-color',
    };
    const measurement_line_color_id: string =
      'measurement-visualization-line-color';
    // TODO(kamil): refactor to use UI config directly
    const ground_color: THREE.Vector4 =
      this.colorMode === 'fit_zones' ?
        new THREE.Vector4(0, 0, 0, 0.07) :
        three_tools.getElementColorVec4(ground_color_id);
    // Adjust opacity of meshlines to account for supersampling.
    const meshlines_color: THREE.Vector4 = (() => {
      const color = three_tools.getElementThreeColor(meshlines_color_id);
      const opacity = getElementOpacity(meshlines_color_id) * this.superSampling();
      return new THREE.Vector4(color.r, color.g, color.b, opacity);
    })();

    const accent_color = three_tools.getElementColorVec4(ground_color_id);
    accent_color.w = 1.0;

    const measurement_line_color =
      three_tools.getElementColorVec4(measurement_line_color_id);

    this.groundMaterial.uniforms.u_pattern_color.value = ground_color;
    this.lineMaterial.uniforms.u_color.value = meshlines_color;
    this.lineMaterial.uniforms.u_accent_color.value = accent_color;

    Object.keys(this.detailedFootMaterials).forEach((side) => {
      const m = this.detailedFootMaterials[side];
      m.uniforms.u_accent_color.value = accent_color;
      m.uniforms.u_measurement_line_color.value = measurement_line_color;
    });

    // Adjust line thickness of ruler visualizations for supersampling.
    const line_width_scaling = window.devicePixelRatio * this.superSampling();
    this.solidMaterial.linewidth = materials.solidMaterialLineWidth * line_width_scaling;
    this.dashedMaterial.linewidth = materials.dashedMaterialLineWidth * line_width_scaling;
    this.invalidate();
  }

  superSampling() {
    // Return how much super-sampling we should do, or 1.0 for nothing.
    // 2.0 is high quality, for fast graphics cards.

    // TODO(Emil): more advanced logic here, e.g. 2.0 SS on *modern* iPhones and iPads
    return window.devicePixelRatio > 1.0 ?
      // e.g. iPad.
      Math.sqrt(2.0) : 2.0;
  }

  hasRendererSizeChanged(): boolean {
    return (
      this.dimensions.width !== this.container.clientWidth ||
      this.dimensions.height !== this.container.clientHeight
    );
  }

  updateRendererSize() {
    const container = this.container;
    if (!container) {
      console.warn('Update renderer size failed: canvas not found');
      return;
    }
    const width = container.clientWidth;
    const height = container.clientHeight;

    if (!width || !height) {
      console.log(`bad dimensions: ${width}x${height}`);
    } else {
      this.dimensions.height = height;
      this.dimensions.width = width;
      this.camera.setAspect(width / height);
      this.renderer.setSize(width, height);

      if (!this.ssaaRenderTarget ||
          this.ssaaRenderTarget.width !== width ||
          this.ssaaRenderTarget.height !== height) {
        if (this.ssaaRenderTarget) {
          this.ssaaRenderTarget.dispose();
        }

        const SSAA = this.superSampling();

        if (SSAA > 1.0) {
          // Set up super-sampling anti-aliasing by rendering to a back buffer:
          const rt_params = {
            depthBuffer:   true,
            format:        THREE.RGBAFormat,
            magFilter:     THREE.LinearFilter,
            minFilter:     THREE.LinearFilter,
            stencilBuffer: false,
          };
          const rt_width = Math.floor(SSAA * width * window.devicePixelRatio);
          const rt_height = Math.floor(SSAA * height * window.devicePixelRatio);
          this.ssaaRenderTarget = new THREE.WebGLRenderTarget(rt_width, rt_height, rt_params);
        }
      }
    }
  }

  onMouseDown = () => {
    this.container.addEventListener('mouseup', this.onMouseUp);
    this.container.addEventListener('mousemove', this.onMouseMove);
  };

  onMouseUp = (event: MouseEvent) => {
    this.container.removeEventListener('mouseup', this.onMouseUp);
    this.container.removeEventListener('mousemove', this.onMouseMove);
  };

  onMouseMove = () => {
    this.container.removeEventListener('mouseup', this.onMouseUp);
    this.container.removeEventListener('mousemove', this.onMouseMove);
  };

  getVisibleCenter(): THREE.Vector3 {
    const positions = [];
    Object.keys(this.footRoots).forEach((side) => {
      const foot = this.footRoots[side];
      if (foot.visible) {
        positions.push(foot.position);
      }
    });
    const center = positions.length === 0 ? new THREE.Vector3(0, 0, 0) : averageVector3(positions);
    center.y = 0;
    center.z = 0;
    return center;
  }

  // Call this when something changes and we needs to repaint
  invalidate() {
    // Ignored for now - we repaint each and every frame.
  }

  updateRendererSizeAndMaterials = _.debounce(
    () => {
      this.updateRendererSize();
      this.updateMaterials();
    },
    400,
    { maxWait: 0 },
  );

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

    if (this.ssaaRenderTarget) {
      this.renderer.setRenderTarget(this.ssaaRenderTarget);
      this.renderer.render(this.scene, this.camera);
      this.copyPass.render(this.renderer, null, this.ssaaRenderTarget, null, null);
    } else {
      this.renderer.render(this.scene, this.camera);
    }

    this.animationFrameId = requestAnimationFrame(() => { this.paint(); });
  }

  warpTo(orientation: CameraOrientation) {
    this.controls.jumpToPose(orientation.position, this.getVisibleCenter(), orientation.zoom);
  }

  animateTo(orientation: CameraOrientation, duration_factor?: number) {
    if (isFastTesting()) {
      // Used during screenshot testing to get to the finish quicker
      const INITIAL_ANIMATION_TIME = 3.0;
      const timeSinceAllFeetLoaded = three_tools.getTimeInSeconds() - this.allFeetLoadedTime;
      if (timeSinceAllFeetLoaded < INITIAL_ANIMATION_TIME) {
        this.allFeetLoadedTime = three_tools.getTimeInSeconds() - 5.0; // Chosen so no mesh lines are shown
      }
      this.warpTo(orientation);
    } else {
      this.controls.animateToPose(
        orientation.position,
        this.getVisibleCenter(),
        orientation.zoom,
        duration_factor);
    }
  }

  updateAnimationTarget() {
    this.controls.updateTarget(this.getVisibleCenter());
  }

  loadGround(url: string, onSuccess, onError) {
    const texture_loader = new THREE.TextureLoader();
    texture_loader.load(
      url,
      (texture) => {
        this.groundMaterial.uniforms.u_texture.value = texture;
        const geometry = new THREE.PlaneGeometry(1.0, 1.0);
        const mesh     = new THREE.Mesh(geometry, this.groundMaterial);
        mesh.name = 'ground';
        mesh.renderOrder = -10;
        this.basePlateRoot.add(mesh);
        this.basePlateRoot.renderOrder = -10;
        this.invalidate();
        this.updateMaterials();
        onSuccess();
      },
      () => {},
      () => {
        console.log(`Failed to load ${url}`);
        onSuccess();
      },
    );
  }

  loadFootMesh(url: string, foot_side: FootSide, onSuccess, onError) {
    const onProgress = () => {};
    const mesh_loader = new BMFLoader();
    mesh_loader.load(url, (root) => {
      root.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.name = 'foot';
          child.userData.foot = foot_side;
          three_tools.computeNormalsIfMissing(child);
          if (this.style.wireframe) {
            setMatteMaterial(child, this.style);
            child = three_tools.addWireFrame( // eslint-disable-line no-param-reassign
              child, three_tools.getElementThreeColor('default-wireframe-color'));
          } else {
            child.material = this.detailedFootMaterials[foot_side];
          }
        }
      });

      const foot_root = this.footRoots[foot_side];
      foot_root.add(root);

      if (!this.style.is_detailed) {
        // Center mesh in y-direction
        foot_root.position.y = 0;
        const bbox = new THREE.Box3().setFromObject(foot_root);
        foot_root.position.y = -0.5 * (bbox.min.y + bbox.max.y);
      }

      // TODO(samuel): Workaround for weird browsers
      // where width&height of element containing renderer not set
      // at document.ready()
      this.updateRendererSize();

      this.invalidate();

      onSuccess();
    }, onProgress, onError);
  }

  loadMeshLines(url: string, foot_side: FootSide, onSuccess, onError) {
    fetch(url)
      .then(checkStatus)
      .then(response => response.json())
      .then((response) => {
        const json_vertices = response['vertices'];
        const three_vertices = new Float32Array(json_vertices.length * 3);

        for (let i = 0; i < json_vertices.length; i += 1) {
          three_vertices[3 * i + 0] = json_vertices[i][0];
          three_vertices[3 * i + 1] = json_vertices[i][1];
          three_vertices[3 * i + 2] = json_vertices[i][2];
        }

        const json_edges = response['edges'];
        const three_indices = [];
        for (let i = 0; i < json_edges.length; i += 1) {
          three_indices.push(json_edges[i][0]);
          three_indices.push(json_edges[i][1]);
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(three_vertices, 3));
        geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(three_indices), 1));

        const mesh_lines = new THREE.LineSegments(geometry, this.lineMaterial);
        mesh_lines.name = 'meshlines';

        this.footRoots[foot_side].add(mesh_lines);

        onSuccess();
      }).catch(onSuccess); // A missing mesh lines file is not an error.
  }

  loadSceneFile(url: string, onSuccess, onError) {
    fetch(url)
      .then(checkStatus)
      .then(response => response.json())
      .then((response) => {
        const world_from_foot = response['world_from_foot'];
        this.footRoots['left'].matrix = three_tools.parseMatrix(world_from_foot['left']);
        this.footRoots['left'].matrixAutoUpdate = false;
        this.footRoots['right'].matrix = three_tools.parseMatrix(world_from_foot['right']);
        this.footRoots['right'].matrixAutoUpdate = false;
        this.basePlateRoot.matrix = three_tools.parseMatrix(response['world_from_ground']);
        this.basePlateRoot.matrixAutoUpdate = false;
        onSuccess();
      }).catch(onSuccess); // A missing scene.json file is not an error.
  }

  dispose() {
    window.cancelAnimationFrame(this.animationFrameId);
    const disposeMesh = (mesh: THREE.Mesh | THREE.Object3D) => {
      if (mesh.children.length) {
        mesh.children.forEach((child) => {
          disposeMesh(child);
        });
      } else {
        (mesh as THREE.Mesh).geometry?.dispose();
        (mesh as any).material?.dispose();
      }
    };
    this.scene.remove(this.root);
    disposeMesh(this.root);
    three_tools.disposeObject(this.root);
    this.ssaaRenderTarget.dispose();
    this.controls?.dispose();
    this.renderer.dispose();
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
  }
}

//    888     888 8888888
//    888     888   888
//    888     888   888
//    888     888   888
//    888     888   888
//    888     888   888
//    Y88b. .d88P   888
//     "Y88888P"  8888888

export class UserInterface {
  protected meshView: MeshView;
  style: Style;
  measurementDescriptions: MeasurementDescriptions;
  isVisir: boolean = false;
  deviceSpecs: DeviceSpecs;
  beta?: boolean;

  constructor(
    styleType: 'default' | 'detailed',
    measurementDescriptions: MeasurementDescriptions,
    isVisir: boolean,
    deviceSpecs: DeviceSpecs,
    beta?: boolean,
  ) {
    this.style = styles[styleType];
    this.measurementDescriptions = measurementDescriptions;
    this.isVisir = isVisir;
    this.deviceSpecs = deviceSpecs;
    this.beta = beta;
  }

  updateDeviceSpecs = (deviceSpecs: DeviceSpecs) => {
    this.deviceSpecs = deviceSpecs;
  };

  prepareCamera() {
    this.meshView.warpTo(CameraOrientations.pre_initial);
  }

  setCameraInitialView(view: string) {
    this.setFootVisible('left', true);
    this.setFootVisible('right', true);
    this.meshView.animateTo(CameraOrientations[view]);
  }

  animateViewTo(view: CameraViewName) {
    if (!this.meshView) { return; }
    this.meshView.animateTo(CameraOrientations[view]);
  }

  setFootVisible(footSide: FootSide, visible: boolean) {
    assert(footSide === 'left' || footSide === 'right');
    this.meshView.footRoots[footSide].visible = visible;
    this.meshView.updateAnimationTarget();
  }

  onFeetLoaded(init_camera: string) {
    this.meshView.allFeetLoadedTime = three_tools.getTimeInSeconds();
    this.meshView.animateTo(CameraOrientations[init_camera], 2.5);
  }

  renderFeet = (
    external_id: string,
    onFeetReady?: () => void,
  ) => {
    const loadGround = () => {
      return new Promise((resolve, reject) => {
        this.meshView.loadGround(
          reconstructionBlobUrl(external_id, 'ground.png'),
          resolve,
          console.error,
        );
      });
    };

    const loadFootMesh = (side) => {
      return new Promise((resolve, reject) => {
        this.meshView.loadFootMesh(
          reconstructionBlobUrl(external_id, `${side}.bmf`),
          side,
          resolve,
          console.error,
        );
      });
    };

    const loadFootMeshLines = (side) => {
      return new Promise((resolve, reject) => {
        this.meshView.loadMeshLines(
          reconstructionBlobUrl(external_id, `mesh_lines_${side}.json`),
          side,
          resolve,
          console.error,
        );
      });
    };

    const loadSceneFile = () => {
      return new Promise((resolve, reject) => {
        this.meshView.loadSceneFile(
          reconstructionBlobUrl(external_id, 'scene.json'),
          resolve,
          console.error,
        );
      });
    };

    const feet = ['left', 'right'];
    const foot_loaders = [];

    feet.forEach((d) => {
      foot_loaders.push(loadFootMesh(d));
    });

    if (this.style.is_detailed) {
      foot_loaders.push(loadSceneFile());
      foot_loaders.push(loadGround());
      feet.forEach((d) => {
        foot_loaders.push(loadFootMeshLines(d));
      });
    }

    const show_load_delay = 1000;
    const minimum_load_spinner_time = 1000;
    const start_feet_loading = (new Date()).getTime();

    const initFeet = () => {
      onFeetReady();
      const initCamera: CameraViewName =
        this.deviceSpecs.lowres ? 'visir' :
          this.beta ? 'initial_beta' : 'initial';
      this.onFeetLoaded(initCamera);
    };

    Promise.all(foot_loaders).then(() => {
      const time_diff = (new Date()).getTime() - start_feet_loading;
      if (time_diff < show_load_delay) {
        initFeet();
      } else {
        const remaining_time = show_load_delay + minimum_load_spinner_time - time_diff;
        setTimeout(() => {
          initFeet();
        }, remaining_time);
      }
    }, console.error);
  };

  dispose = () => {
    this.meshView.dispose();
  };
}
