import * as THREE from 'three';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

import * as materials from '@components/three/materials';
import { Style } from '@components/three/styles';
import * as three_tools from '@components/three/three_tools';
import { MeshView, UserInterface } from '@components/three/three_view_base';
import { CameraOrientations } from '@components/three/three_view_base/advanced_camera';
import { DeviceSpecs } from '@tools/device_specs';
import { checkStatus } from '@tools/helpers';

const SCENE_OBJECTS_TRANSLATE_X = 0.2;
const SCENE_OBJECTS_TRANSLATE_Y = 0.1;

class OnboardingMeshView extends MeshView {
  groundBgMaterial: THREE.ShaderMaterial = materials.getGroundBgMaterial();
  groundBgLineMaterial: THREE.ShaderMaterial = materials.getGroundBgLineMaterial();

  constructor(style: Style) {
    super(style);
  }

  setupControls(camera) {
    super.setupControls(camera);
    this.controls.target = new THREE.Vector3(SCENE_OBJECTS_TRANSLATE_X, 0, 0);
  }

  updateMaterials() {
    super.updateMaterials();
    if (this.groundBgMaterial) {
      const accent_color = three_tools.getElementColorVec4('ground-pattern-color');
      accent_color.w = 1.0;
      this.groundBgMaterial.uniforms.u_accent_color.value = accent_color;
    }
  }

  loadVandra = () => {
    const loader = new GLTFLoader();
    loader.load(
      '/build/models/vandra.gltf',
      (gltf) => {
        gltf.scene.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.material = new THREE.MeshStandardMaterial({
              color:     0xaaaaaa, // 0xE6E6E6,
              emissive:  0x3f3f3f,
              roughness: 0.5,
              metalness: 0.06,
            });
          }
        });
        this.basePlateRoot.add(gltf.scene);
      },
    );
  };

  loadGroundBg = () => {
    const geometry = new THREE.PlaneGeometry(10.0, 10.0);
    const groundBg = new THREE.Mesh(geometry, this.groundBgMaterial);
    groundBg.position.setZ(-0.11);
    this.basePlateRoot.add(groundBg);

    const groundBgWireFrame = new THREE.GridHelper(10.0, 80);
    groundBgWireFrame.rotateX(Math.PI / 2);
    groundBgWireFrame.position.setZ(-0.1);
    groundBgWireFrame.material = this.groundBgLineMaterial;
    this.basePlateRoot.add(groundBgWireFrame);

    this.updateMaterials();

    const loader = new FontLoader();
    loader.load('/build/models/helvetiker_bold.typeface.json', (response) => {
      const font = response;
      const textGeo = new TextGeometry('SCAN\nNOW', {
        font,
        size:   0.06,
        height: 0.001,
      });
      textGeo.computeBoundingBox();
      const text = new THREE.Mesh(textGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
      text.rotateZ(-Math.PI / 2);
      text.position.set(0.16, -0.2, -0.03);
      this.root.add(text);
    });
  };

  loadSceneFile(url: string, onSuccess, onError) {
    fetch(url)
      .then(checkStatus)
      .then(response => response.json())
      .then((response) => {
        const world_from_foot = response['world_from_foot'];
        this.footRoots['left'].matrix
          .makeTranslation(SCENE_OBJECTS_TRANSLATE_X, SCENE_OBJECTS_TRANSLATE_Y, 0)
          .multiply(three_tools.parseMatrix(world_from_foot['left']));
        this.footRoots['right'].matrix
          .makeTranslation(SCENE_OBJECTS_TRANSLATE_X, SCENE_OBJECTS_TRANSLATE_Y, 0)
          .multiply(three_tools.parseMatrix(world_from_foot['right']));
        this.basePlateRoot.matrix
          .makeTranslation(SCENE_OBJECTS_TRANSLATE_X, SCENE_OBJECTS_TRANSLATE_Y, 0)
          .multiply(three_tools.parseMatrix(response['world_from_ground']));

        this.footRoots['left'].matrixAutoUpdate = false;
        this.footRoots['right'].matrixAutoUpdate = false;
        this.basePlateRoot.matrixAutoUpdate = false;

        onSuccess();
      }).catch(onSuccess); // A missing scene.json file is not an error.
  }

  paint() {
    if (!this.container) {
      return;
    }

    const WIREFRAME_DELAY        = 0.1;  // Wait this long before starting to show the mesh lines
    const MESH_DELAY             = 0.1;  // Wait this long before starting to show the feet
    const CUTOFF_ANIMATION_SPEED = 0.3; // Meters per second
    const SHADOW_SPEED           = 0.1;  // How fast to fade in the shadows
    const INITIAL_ANIMATION_TIME = 0.1;  // Approximate estimation for most feet.

    if (this.hasRendererSizeChanged()) {
      this.updateRendererSizeAndMaterials();
    }

    const now = three_tools.getTimeInSeconds();
    const timeSinceFeet = this.allFeetLoadedTime ? now - this.allFeetLoadedTime : 0.0;

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
      this.groundBgMaterial.uniforms.u_time.value = timeSinceFeet - INITIAL_ANIMATION_TIME;
      this.groundBgLineMaterial.uniforms.u_time.value = timeSinceFeet - INITIAL_ANIMATION_TIME;
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

}

export class OnBoarding3DUserInterface extends UserInterface {
  protected meshView: OnboardingMeshView;

  constructor(
    styleType: 'default' | 'detailed',
    measurementDescriptions: MeasurementDescriptions,
    isVisir: boolean,
    deviceSpecs: DeviceSpecs,
    beta?: boolean,
  ) {
    super(styleType, measurementDescriptions, isVisir, deviceSpecs, true);
    this.meshView = new OnboardingMeshView(this.style);
    this.meshView.warpTo(CameraOrientations.initial_splash);
  }

  renderPlaceholder = (): Promise<void> => {
    const loadGround = () => {
      return new Promise((resolve, reject) => {
        this.meshView.loadGround(
          '/feet_placeholder_data/ground.png',
          resolve,
          console.error,
        );
        this.meshView.loadGroundBg();
      });
    };

    const loadFootMesh = (side) => {
      return new Promise((resolve, reject) => {
        this.meshView.loadFootMesh(
          `/feet_placeholder_data/${side}.bmf`,
          side,
          resolve,
          console.error,
        );
      });
    };

    const loadFootMeshLines = (side) => {
      return new Promise((resolve, reject) => {
        this.meshView.loadMeshLines(
          `/feet_placeholder_data/mesh_lines_${side}.json`,
          side,
          resolve,
          console.error,
        );
      });
    };

    const loadSceneFile = () => {
      return new Promise((resolve, reject) => {
        this.meshView.loadSceneFile(
          '/feet_placeholder_data/scene.json',
          resolve,
          console.error,
        );
      });
    };

    const loadVandra = () => this.meshView.loadVandra();

    const feet = ['left', 'right'];
    const foot_loaders = [];

    feet.forEach((d) => {
      foot_loaders.push(loadFootMesh(d));
    });

    if (this.style.is_detailed) {
      foot_loaders.push(loadSceneFile());
      foot_loaders.push(loadGround());
      foot_loaders.push(loadVandra());
      feet.forEach((d) => {
        foot_loaders.push(loadFootMeshLines(d));
      });
    }

    const show_load_delay = 1000;
    const minimum_load_spinner_time = 1000;
    const start_feet_loading = (new Date()).getTime();

    const initFeet = () => {
      this.onFeetLoaded('initial_splash');
    };

    return Promise.all(foot_loaders).then(() => {
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
}
