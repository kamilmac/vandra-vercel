import { zipWith } from 'lodash';
import * as THREE from 'three';

import { getFitColor } from '@components/fit_visualization_mesh/shoe_fit_visualization_mesh';
import { FitZone, FitZoneClassifications } from '@data/shoes';

import { getAnchorPointMaterial } from '../materials';
import * as three_tools from '../three_tools';

const FIT_ZONE_INFO_POINT_NAME = 'fit_zone_info';

// get fit zone markers positions from measurementDescriptions
export const getFitZoneInfoPositions = (
  measurementDescriptions: MeasurementDescriptions,
): { [K in 'left' | 'right']: { [K in FitZone]: NumberArray3; }} => {
  return {
    left: {
      toe:  measurementDescriptions.left_length.markers.toe,
      ball: zipWith(
        measurementDescriptions.left_width.markers.width_lateral,
        measurementDescriptions.left_width.markers.width_medial,
        [0, 0, measurementDescriptions.left_forefoot_height.markers.maxz[2]],
        (p1, p2, p3) => ((p1 + p2) / 2.0 + p3)) as NumberArray3,
      instep: measurementDescriptions.left_instep_height.markers.maxz,
      heel:   measurementDescriptions.left_length.markers.heel,
    },
    right: {
      toe:  measurementDescriptions.right_length.markers.toe,
      ball: zipWith(
        measurementDescriptions.right_width.markers.width_lateral,
        measurementDescriptions.right_width.markers.width_medial,
        [0, 0, measurementDescriptions.right_forefoot_height.markers.maxz[2]],
        (p1, p2, p3) => ((p1 + p2) / 2.0 + p3)) as NumberArray3,
      instep: measurementDescriptions.right_instep_height.markers.maxz,
      heel:   measurementDescriptions.right_length.markers.heel,
    },
  };
};

const createFitZoneInfoPoints = (
  fitZonesDescriptionRoots: { [K in 'left' | 'right']: THREE.Group },
  fitZoneClassifications: FitZoneClassifications,
  fitZoneInfoPositions: { [K in 'left' | 'right']: { [K in FitZone]: number[]; }},
) => {
  const footZones: FitZone[] = ['ball', 'heel', 'instep', 'toe'];
  ['left', 'right'].forEach((footSide) => {
    footZones.forEach((fitZone) => {
      const fitColor = getFitColor(fitZoneClassifications[fitZone]);
      const position = new THREE.Vector3().fromArray(fitZoneInfoPositions[footSide][fitZone]);
      const geometry = new THREE.PlaneGeometry(0.01, 0.01);
      const material = getAnchorPointMaterial(fitColor);
      material.transparent = true;
      const fitZoneInfoPoint = new THREE.Mesh(geometry, material);
      fitZoneInfoPoint.name = FIT_ZONE_INFO_POINT_NAME;
      fitZoneInfoPoint.userData = {
        fitZone,
        footSide,
        fit: fitZoneClassifications[fitZone],
      };
      fitZoneInfoPoint.position.copy(position);
      fitZonesDescriptionRoots[footSide].add(fitZoneInfoPoint);
    });
  });
};

const updateFitZoneInfoPoints = (
  fitZonesDescriptionRoots: Record<'left' | 'right', THREE.Group>,
  fitZoneClassifications: FitZoneClassifications,
) => {
  ['left', 'right'].forEach((footSide) => {
    const fitZoneInfoPoints = three_tools.findAllByName(
      fitZonesDescriptionRoots[footSide],
      FIT_ZONE_INFO_POINT_NAME,
    );
    fitZoneInfoPoints.forEach((fitZoneInfoPoint) => {
      const newFit = fitZoneClassifications[fitZoneInfoPoint.userData.fitZone];
      const fitColor = getFitColor(newFit);
      const material = (fitZoneInfoPoint as THREE.Mesh).material;
      const uniforms = (material as THREE.ShaderMaterial).uniforms;
      uniforms['u_inner_color'].value = new THREE.Color(parseInt(fitColor.replace(/^#/, ''), 16));
      fitZoneInfoPoint.userData = {
        ...fitZoneInfoPoint.userData,
        fit: newFit,
      };
    });
  });
};

const updateFitZoneUniformsOfFootMaterials = (
  detailedFootMaterials: Record<'left' | 'right', THREE.ShaderMaterial>,
  fitZoneClassifications: FitZoneClassifications,
  fitZoneInfoPositions: { [K in 'left' | 'right']: { [K in FitZone]: NumberArray3; }},
) => {
  ['left', 'right'].forEach((footSide) => {
    const uniforms = detailedFootMaterials[footSide].uniforms;
    ['toe', 'ball', 'instep', 'heel'].forEach((fitZone) => {
      // Paint fit zone colors on feet
      const fitColor = getFitColor(fitZoneClassifications[fitZone]);
      const fitColorAlpha = ['snug', 'roomy'].includes(fitZoneClassifications[fitZone]) ? 0.35 : 1.0;
      const fitColorThree = new THREE.Color(parseInt(fitColor.replace(/^#/, ''), 16));
      uniforms[`u_${fitZone}_color`].value = new THREE.Color().lerp(fitColorThree, fitColorAlpha);
      uniforms[`u_${fitZone}_marker`].value = fitZoneInfoPositions[footSide][fitZone];
    });
  });
};

export const clearFitZoneUniformsOfFootMaterials = (
  detailedFootMaterials: Record<'left' | 'right', THREE.ShaderMaterial>,
) => {
  const defaultColor = new THREE.Vector3(1.0, 1.0, 1.0);
  ['left', 'right'].forEach((footSide) => {
    const uniforms = detailedFootMaterials[footSide].uniforms;
    ['toe', 'ball', 'instep', 'heel'].forEach((fitZone) => {
      uniforms[`u_${fitZone}_color`].value = defaultColor;
    });
  });
};

export const visualizeFitZones = (
  fitZonesDescriptionRoots: Record<'left' | 'right', THREE.Group>,
  detailedFootMaterials: Record<'left' | 'right', THREE.ShaderMaterial>,
  fitZoneClassifications: FitZoneClassifications,
  measurementDescriptions: MeasurementDescriptions,
) => {
  const fitZoneInfoPositions = getFitZoneInfoPositions(measurementDescriptions);
  updateFitZoneUniformsOfFootMaterials(detailedFootMaterials, fitZoneClassifications, fitZoneInfoPositions);
  if (!fitZonesDescriptionRoots.left.children.length) {
    createFitZoneInfoPoints(fitZonesDescriptionRoots, fitZoneClassifications, fitZoneInfoPositions);
  } else {
    updateFitZoneInfoPoints(fitZonesDescriptionRoots, fitZoneClassifications);
  }
};

export const getFitZoneAnchorPointsCanvasPositions = (
  fitZonesDescriptionRoots: Record<'left' | 'right', THREE.Group>,
  camera: THREE.Camera,
  container: HTMLCanvasElement,
): {
  [K in 'left' | 'right']: { [K in FitZone]: { x: number; y: number } };
} => {
  if (!fitZonesDescriptionRoots.left.children.length || !fitZonesDescriptionRoots.right.children.length) {
    console.error('Three view: fit zone info points root empty.');
    return null;
  }
  const fitZoneInfoPoints = {
    left:  three_tools.findAllByName(fitZonesDescriptionRoots.left, FIT_ZONE_INFO_POINT_NAME),
    right: three_tools.findAllByName(fitZonesDescriptionRoots.right, FIT_ZONE_INFO_POINT_NAME),
  };
  if (!fitZoneInfoPoints.left?.length || !fitZoneInfoPoints.right?.length) {
    console.error('Three view: cannot find fit zone info points.');
    return null;
  }
  const canvasPositions = {
    left:  { heel: null, instep: null, toe: null, ball: null },
    right: { heel: null, instep: null, toe: null, ball: null },
  };
  ['left', 'right'].forEach((footSide) => {
    fitZoneInfoPoints[footSide].forEach((fitZoneInfoPoint) => {
      const position = three_tools.toCanvasPosition(
        fitZoneInfoPoint, camera, container as HTMLCanvasElement);
      canvasPositions[footSide][fitZoneInfoPoint.userData.fitZone] = position;
    });
  });
  return canvasPositions;
};

export const fitZoneInfoPointsLookAt = (
  fitZonesDescriptionRoots: Record<'left' | 'right', THREE.Group>,
  lookAt: THREE.Vector3,
) => {
  ['left', 'right'].forEach((footSide) => {
    (fitZonesDescriptionRoots[footSide]?.children || [])
      .filter(child => child.name === FIT_ZONE_INFO_POINT_NAME)
      .forEach(point => point.lookAt(lookAt));
  });
};
