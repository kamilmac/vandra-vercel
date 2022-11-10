import * as assert from 'assert';
import * as THREE from 'three';

import { getAnchorPointMaterial } from '../materials';
import * as three_tools from '../three_tools';

import { getFitZoneInfoPositions } from './fit_zones_visualization';

type LineMaterial =
  THREE.LineDashedMaterial |
  THREE.LineBasicMaterial |
  THREE.ShaderMaterial;

// Returns unit vector perpendicular to the axis, and in the plane
function getTangentToAxis(axis: THREE.Vector3, plane: THREE.Plane): THREE.Vector3 {
  const tangent = axis.clone();
  tangent.cross(plane.normal);
  tangent.normalize();
  return tangent;
}

function translateAndProject(
  point: THREE.Vector3,
  direction: THREE.Vector3,
  distance: number,
  plane: THREE.Plane): THREE.Vector3 {
  return plane.projectPoint(point.clone().addScaledVector(direction, distance), new THREE.Vector3());
}

// Transform a (u,v) coordinate on a plane to a 3D point on the same plane
// with the restriction that the point is above ground (z >= 0).
function projectUvOnPlaneAboveGround(
  tangent: THREE.Vector3,
  cotangent: THREE.Vector3,
  u: number,
  v: number,
  plane: THREE.Plane): THREE.Vector3 {
  let point = new THREE.Vector3(0, 0, 0)
    .addScaledVector(tangent, u)
    .addScaledVector(cotangent, v);
  point = plane.projectPoint(point, new THREE.Vector3());

  if (point.z < 0) {
    const correction_dir =
      Math.abs(tangent.z) > Math.abs(cotangent.z) ? tangent : cotangent;
    point.addScaledVector(correction_dir, -point.z / correction_dir.z);
  }

  return point;
}

function createAxisRulerObject3D(
  axis: THREE.Vector3, // eg. y-axis
  a: THREE.Vector3, // eg. heel
  b: THREE.Vector3, // eg. toe
  plane: THREE.Plane,   // Usually floor (z = 0)
  bounds: THREE.Box3,
  side_flip: -1 | 1,
  ruler_padding: number,
  inner_padding: number,
  outer_padding: number,
  axis_material: LineMaterial,
  stopline_material: LineMaterial) {
  const tangent = getTangentToAxis(axis, plane).multiplyScalar(side_flip);
  const mid = a.clone().add(b).multiplyScalar(0.5);

  const ray = new THREE.Ray(mid.clone().add(tangent), tangent.clone().negate());
  const mid_on_bounds = ray.intersectBox(bounds, new THREE.Vector3());

  const plane_a = new THREE.Plane().setFromNormalAndCoplanarPoint(axis, a);
  const plane_b = new THREE.Plane().setFromNormalAndCoplanarPoint(axis, b);

  const a_on_axis = plane_a.projectPoint(mid_on_bounds, new THREE.Vector3());
  const b_on_axis = plane_b.projectPoint(mid_on_bounds, new THREE.Vector3());

  // The cotangent usually the same as axis but can be sign flipped
  // in order to always follow the direction of a -> b.
  const cotangent = new THREE.Vector3().subVectors(b_on_axis, a_on_axis).normalize();

  const distance_to_a = a_on_axis.distanceTo(a);
  const distance_to_b = b_on_axis.distanceTo(b);
  const stopline_start = -(inner_padding + Math.max(distance_to_a, distance_to_b));
  const stopline_stop = ruler_padding + outer_padding;

  const arrow_a = translateAndProject(a_on_axis, tangent, ruler_padding, plane);
  const arrow_b = translateAndProject(b_on_axis, tangent, ruler_padding, plane);

  // Flip arrowheads if the arrow is very short
  //  ________
  //    A                  |
  //    |                __V_____
  //    | long arrow     __|_____ short arrow
  //    |                  A
  //  __V_____             |
  //
  const arrow_length = arrow_a.distanceTo(arrow_b);
  const is_short_arrow = arrow_length < 0.015;
  const arrowhead_dx = 0.0025;
  const arrowhead_dy = is_short_arrow ? -0.005 : 0.005;

  const axis_geometry = new THREE.BufferGeometry();
  const axis_vertices = [
    arrow_a,
    arrow_b,
    // Add arrowheads
    arrow_a,
    arrow_a.clone()
      .addScaledVector(tangent, -arrowhead_dx)
      .addScaledVector(cotangent, arrowhead_dy),
    arrow_a,
    arrow_a.clone()
      .addScaledVector(tangent, arrowhead_dx)
      .addScaledVector(cotangent, arrowhead_dy),
    arrow_b,
    arrow_b.clone()
      .addScaledVector(tangent, -arrowhead_dx)
      .addScaledVector(cotangent, -arrowhead_dy),
    arrow_b,
    arrow_b.clone()
      .addScaledVector(tangent, arrowhead_dx)
      .addScaledVector(cotangent, -arrowhead_dy)];

  if (is_short_arrow) {
    // Add tails to the arrowheads
    axis_vertices.push(
      arrow_a,
      arrow_a.clone().addScaledVector(cotangent, arrowhead_dy * 2),
      arrow_b,
      arrow_b.clone().addScaledVector(cotangent, -arrowhead_dy * 2));
  }
  axis_geometry.setFromPoints(axis_vertices);

  const stopline_geometry =  new THREE.BufferGeometry().setFromPoints([
    translateAndProject(a_on_axis, tangent, stopline_start, plane),
    translateAndProject(a_on_axis, tangent, stopline_stop, plane),
    translateAndProject(b_on_axis, tangent, stopline_start, plane),
    translateAndProject(b_on_axis, tangent, stopline_stop, plane)]);

  const axis_line = new THREE.LineSegments(axis_geometry, axis_material);
  const stop_line = new THREE.LineSegments(stopline_geometry, stopline_material);
  axis_line.computeLineDistances();
  stop_line.computeLineDistances();

  const o = new THREE.Object3D();
  o.add(axis_line);
  o.add(stop_line);
  o.children[0].name = 'arrow';
  o.children[1].name = 'stoplines';
  return o;
}

export function createAxisRuler(
  foot_side: FootSide,
  measurement_type: MeasurementDistanceType,
  description: MeasurementDescription,
  bounds_in_foot: THREE.Box3,
  solid_material: THREE.LineBasicMaterial,
  dashed_material: THREE.LineDashedMaterial): THREE.Object3D {
  /*
   Inner             Ruler     Outer
   padding           padding   padding
  |<---->|          |<------->|<------->|
  ----------------------------x----------
       .!!!!                 /|\
      #MMMMMB$!               |
     !MMMMMMMMM#!             |
     "MMMMMMMMMMM%            |
     $MMMMMMMMMMMM%           |
     #MMMMMMMMMMMMM3          |
    !MMMMMMMMMMMMMMW          |
    (MMMMMMMMMMMMMMM!         |
    !MMMMMMMMMMMMMMM"         |
    `MMMMMMMMMMMMMMM"         |
     MMMMMMMMMMMMMMM'         |
     MMMMMMMMMMMMMM#          |
     BMMMMMMMMMMMMM!          |
     BMMMMMMMMMMMM#           |
    .MMMMMMMMMMMMM(           |
     MMMMMMMMMMMM#            |
     #MMMMMMMMMMM(            |
     "MMMMMMMMMM@`            |
     'MMMMMMMMMM#             |
     `MMMMMMMMMM!             |
      $MMMMMMMM$              |
      .#MMMMMB"               |
        !"%J!                \|/
  ----------------------------x----------
  */
  // Values are in meters.
  let ruler_padding = 0.01;
  let inner_padding = 0.025;
  const outer_padding = 0.02;

  const axis = three_tools.parseVector3(description.axis);
  const from = three_tools.parseVector3(description.from);
  const to   = three_tools.parseVector3(description.to);

  // Plane defaults to floor.
  let plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  if (description.plane) {
    plane.setComponents(
      description.plane[0],
      description.plane[1],
      description.plane[2],
      description.plane[3]);
  }

  let side_flip: -1 | 1 = foot_side === 'left' ? -1 : 1;

  if (measurement_type === 'width') {
    // Both rulers should be on the toe side.
    side_flip = -1;
  } else if (measurement_type === 'half_width') {
    // Both rulers should be over the foot.
    side_flip = description.axis[0] > 0 ? 1 : -1;
    // Overrid bounds to move the ruler closer to the foot.
    bounds_in_foot = bounds_in_foot.clone();// eslint-disable-line no-param-reassign
    const bounds_size = bounds_in_foot.getSize(new THREE.Vector3());
    bounds_in_foot.max.z -= bounds_size.z * Math.abs(plane.constant) / bounds_size.y;
    // Adjust padding
    ruler_padding = 0.025;
    inner_padding = 0.0;
  } else if (measurement_type === 'heel_width') {
    // Both rulers should be on the heel side.
    side_flip = 1;
    // Override plane for heel width.
    plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  } else if (measurement_type === 'height') {
    // Override bottom point position because it is so unstable.
    from.set(to.x, to.y, 0.0);
  }

  return createAxisRulerObject3D(
    axis, from, to, plane, bounds_in_foot, side_flip,
    ruler_padding, inner_padding, outer_padding,
    solid_material, dashed_material);
}

export function createPlaneRectangle(
  foot_side: FootSide,
  measurement_type: MeasurementGirthType,
  description: MeasurementDescription,
  bounds_in_foot: THREE.Box3,
  dashed_material: THREE.LineDashedMaterial): THREE.Object3D {
  assert('plane' in description);
  assert('cross_section_bounds' in description);
  /*
        .!!!!
       #MMMMMB$!
      !MMMMMMMMM#!
      "MMMMMMMMMMM%       A
      $MMMMMMMMMMMM%      |
      #MMMMMMMMMMMMM3     |
     !MMMMMMMMMMMMMMW     | cotangent
     (MMMMMMMMMMMMMMM!    |
     !MMMMMMMMMMMMMMM"    |
     `MMMMMMMMMMMMMMM"    o––––––––––>
      MMMMMMMMMMMMMMM'      tangent
      MMMMMMMMMMMMMM#
  ____BMMMMMMMMMMMMM!__
  |   BMMMMMMMMMMMM#  |
  |  .MMMMMMMMMMMMM(..|......
  |  :MMMMMMMMMMMM#:  |   A
  |  :#MMMMMMMMMMM(:  |   :
  |  :"MMMMMMMMMM@`:  |   :
  |  :'MMMMMMMMMM# :  |   : bounds
  |  :`MMMMMMMMMM! :  |   :
  |  : $MMMMMMMM$  :  |   :
  |  : .#MMMMMB"   :  |   :
  |  :...!"%J!.....:..|...V..V
  |__:_____________:__|......| padding
     :             :  :      A
     :<----------->:  :
     :    bounds   :  :
                  >:--:<
                  padding
  */
  // Values are in meters.
  const padding = 0.01;

  const plane = new THREE.Plane().setComponents(
    description.plane[0],
    description.plane[1],
    description.plane[2],
    description.plane[3]);

  const {
    tangent,
    cotangent,
    tangent_min,
    tangent_max,
    cotangent_min,
    cotangent_max,
  } = description.cross_section_bounds;

  const u_vector = three_tools.parseVector3(tangent);
  const v_vector = three_tools.parseVector3(cotangent);
  const u_min = tangent_min - padding;
  const u_max = tangent_max + padding;
  const v_min = cotangent_min - padding;
  const v_max = cotangent_max + padding;

  const lower_left  = projectUvOnPlaneAboveGround(u_vector, v_vector, u_min, v_min, plane);
  const lower_right = projectUvOnPlaneAboveGround(u_vector, v_vector, u_max, v_min, plane);
  const upper_left  = projectUvOnPlaneAboveGround(u_vector, v_vector, u_min, v_max, plane);
  const upper_right = projectUvOnPlaneAboveGround(u_vector, v_vector, u_max, v_max, plane);

  const geometry = new THREE.BufferGeometry().setFromPoints([
    upper_left, upper_right,   //  ----1----
    lower_left, upper_left,    //  2       ¦
    lower_right, upper_right,   //  ¦       3
    lower_left, lower_right]); //  ----4----

  const dashed_line = new THREE.LineSegments(geometry, dashed_material);
  dashed_line.computeLineDistances();

  const o = new THREE.Object3D();
  o.add(dashed_line);
  return o;
}

// FOR MEASUREMENT INFO POINTS
const MEASUREMENT_INFO_POINT_NAME = 'measurement_info';

export const createMeasurementInfoPoints = (
  measurement_type: MeasurementType,
  description: MeasurementDescription,
): THREE.Group => {
  const material = getAnchorPointMaterial('#1CB5D1');
  const geometry = new THREE.PlaneGeometry(0.01, 0.01);
  const infoPoints = new THREE.Group();
  Object.keys(description.markers).forEach((k) => {
    const position = new THREE.Vector3().fromArray(description.markers[k]);
    const infoPoint = new THREE.Mesh(geometry, material);
    infoPoint.name = MEASUREMENT_INFO_POINT_NAME;
    infoPoint.userData = {
      measurement_type,
      marker: k,
    };
    infoPoint.position.copy(position);
    infoPoints.add(infoPoint);
  });
  return infoPoints;
};

export const measurementInfoPointsLookAt = (
  roots: Record<'left' | 'right', THREE.Group>,
  lookAt: THREE.Vector3,
) => {
  ['left', 'right'].forEach((footSide) => {
    (roots[footSide]?.children || [])
      .filter(child => child.name === MEASUREMENT_INFO_POINT_NAME)
      .forEach(point => point.lookAt(lookAt));
  });
};

export const getMeasurementAnchorPointsCanvasPositions = (
  roots: Record<'left' | 'right', THREE.Group>,
  camera: THREE.Camera,
  container: HTMLCanvasElement,
): {
  [K in 'left' | 'right']: { [K in string]: { x: number; y: number } };
} => {
  if (!roots.left.children.length || !roots.right.children.length) {
    return null;
  }
  const infoPoints = {
    left:  three_tools.findAllByName(roots.left, MEASUREMENT_INFO_POINT_NAME),
    right: three_tools.findAllByName(roots.right, MEASUREMENT_INFO_POINT_NAME),
  };
  if (!infoPoints.left?.length || !infoPoints.right?.length) {
    console.error('Three view: cannot find measurement info points.');
    return null;
  }
  const canvasPositions = {
    left:  {},
    right: {},
  };
  ['left', 'right'].forEach((footSide) => {
    infoPoints[footSide].forEach((infoPoint) => {
      const position = three_tools.toCanvasPosition(
        infoPoint, camera, container as HTMLCanvasElement);
      canvasPositions[footSide][infoPoint.userData.measurement_type] = position;
    });
  });
  return canvasPositions;
};

export const getFitZoneFromMeasurementType = (measurementType: MeasurementType): FitZone => {
  switch (measurementType) {
    case 'length':
      return 'toe';
    case 'width':
      return 'ball';
    case 'height':
      return 'instep';
    case 'heel_width':
      return 'heel';
    default:
      return null;
  }
};

export const updateMeasurementFitZoneUniformsOfFootMaterials = (
  detailedFootMaterials: Record<'left' | 'right', THREE.ShaderMaterial>,
  measurementType: MeasurementType,
  measurementDescriptions: MeasurementDescriptions,
) => {
  if (!measurementType) {
    return;
  }
  const fitZone = getFitZoneFromMeasurementType(measurementType);
  const fitZoneAnchorPoints = getFitZoneInfoPositions(measurementDescriptions);
  ['left', 'right'].forEach((footSide) => {
    const uniforms = detailedFootMaterials[footSide].uniforms;
    const highlightColor = new THREE.Color('#B9DBE5');
    uniforms[`u_${fitZone}_color`].value = new THREE.Vector3(highlightColor.r, highlightColor.g, highlightColor.b);
    uniforms[`u_${fitZone}_marker`].value = fitZoneAnchorPoints[footSide][fitZone];
  });
};
