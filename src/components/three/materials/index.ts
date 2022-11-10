import * as THREE from 'three';

export function getDetailedMaterial() {
  return new THREE.ShaderMaterial({
    depthTest:    true,
    depthWrite:   true,
    transparent:  false,
    vertexColors: true,

    uniforms: {
      u_accent_color:           { value: new THREE.Vector4(1, 1, 1, 1) },
      u_cutoff_height:          { value: 0.0 },
      u_error_vis:              { value: 0.0 },
      u_girth_plane:            { value: new THREE.Vector4(0, 0, 1, 1) },
      u_measurement_line_color: { value: new THREE.Vector4(0, 0, 0, 1) },
      u_measurement_line_width: { value: 0.0025 },
      u_stopline1_p1:           { value: new THREE.Vector3(0, 0, -1) },
      u_stopline1_p2:           { value: new THREE.Vector3(0, 0, -1) },
      u_stopline2_p1:           { value: new THREE.Vector3(0, 0, -1) },
      u_stopline2_p2:           { value: new THREE.Vector3(0, 0, -1) },
      u_toe_color:              { value: new THREE.Vector3(1.0, 1.0, 1.0) },
      u_ball_color:             { value: new THREE.Vector3(1.0, 1.0, 1.0) },
      u_instep_color:           { value: new THREE.Vector3(1.0, 1.0, 1.0) },
      u_heel_color:             { value: new THREE.Vector3(1.0, 1.0, 1.0) },
      u_instep_marker:          { value: new THREE.Vector3(0, 0, 0) },
      u_ball_marker:            { value: new THREE.Vector3(0, 0, 0) },
      u_toe_marker:             { value: new THREE.Vector3(0, 0, 0) },
      u_heel_marker:            { value: new THREE.Vector3(0, 0, 0) },
      u_time_fit_zones:         { value: 0.0 },
    },

    vertexShader: `
      uniform float u_error_vis;

      // World coordinates:
      varying vec2 v_tc;
      varying vec3 v_color;
      varying vec3 v_eye_pos;
      varying vec3 v_normal_in_world;
      varying vec3 v_pos_in_mesh;
      varying vec3 v_pos_in_world;

      void main()
      {
        vec3 in_pos = position;
        vec2 in_uv = uv;

        if (color.x < 0.5) {
          in_pos = mix(position, color, u_error_vis);
          in_uv = mix(in_uv, vec2(0, 0), u_error_vis);
        }

        gl_Position       = projectionMatrix * modelViewMatrix * vec4(in_pos, 1.0);
        v_color           = color;
        v_eye_pos         = cameraPosition;
        v_normal_in_world = (modelMatrix * vec4(normal, 0.0)).xyz;
        v_pos_in_mesh     = in_pos;
        v_pos_in_world    = (modelMatrix * vec4(in_pos, 1.0)).xyz;
        v_tc              = in_uv;
      }
    `,

    fragmentShader: `
      uniform vec4  u_accent_color;
      uniform float u_cutoff_height;
      uniform vec4  u_girth_plane;
      uniform float u_measurement_line_width;
      uniform vec4  u_measurement_line_color;
      uniform vec3  u_stopline1_p1;
      uniform vec3  u_stopline1_p2;
      uniform vec3  u_stopline2_p1;
      uniform vec3  u_stopline2_p2;

      // Fit zones
      uniform vec3 u_toe_color;
      uniform vec3 u_ball_color;
      uniform vec3 u_instep_color;
      uniform vec3 u_heel_color;
      uniform vec3 u_toe_marker;
      uniform vec3 u_ball_marker;
      uniform vec3 u_instep_marker;
      uniform vec3 u_heel_marker;
      uniform float u_time_fit_zones;

      // World coordinates:
      varying vec2 v_tc;
      varying vec3 v_color;
      varying vec3 v_eye_pos;
      varying vec3 v_normal_in_world;
      varying vec3 v_pos_in_mesh;
      varying vec3 v_pos_in_world;

      float AMBIENT_LIGHT     =  0.02;
      float LIGHT_MULTIPLIER  =  0.50;
      float LIGHT_Z           =  0.8;
      float SPECULAR_STRENGTH =  0.2;
      float SHININESS         = 10.0; // Higher value == smaller specular highlights

      vec3 calc_light_color(
        vec3 mesh_normal, vec3 eye_dir, vec3 mat_diffuse, vec3 light_dir, vec3 light_color)
      {
        vec3 diffuse_color = mat_diffuse * max(dot(mesh_normal, light_dir), 0.0);

        vec3 reflect_dir = normalize(-reflect(light_dir, mesh_normal));
        float spec_color = SPECULAR_STRENGTH * pow(max(dot(reflect_dir, eye_dir), 0.0), SHININESS);

        return light_color * (diffuse_color + spec_color);
      }

      float roundStep(float x)
      {
        return floor(x + 0.5);
      }

      vec3 colorFromStep(float step)
      {
        float NUM_STEPS = 5.0;
        vec3 COLOR_TOO_SMALL  = vec3(0.00, 0.60, 1.00);
        vec3 COLOR_JUST_RIGHT = vec3(1.00, 1.00, 1.00);
        vec3 COLOR_TOO_BIG    = vec3(1.00, 0.15, 0.00);
        if (step < 0.0) {
          return mix(COLOR_JUST_RIGHT, COLOR_TOO_SMALL, min(1.0, -step / NUM_STEPS));
        } else if (step == 0.0) {
          return COLOR_JUST_RIGHT;
        } else {
          return mix(COLOR_JUST_RIGHT, COLOR_TOO_BIG, min(1.0, step / NUM_STEPS));
        }
      }

      vec3 colorFromMeshError(float error_mm, float gradient_norm_mm)
      {
        float STEPS_PER_MILLIMETER = 2.0;
        float step_f = error_mm / STEPS_PER_MILLIMETER;
        float step = roundStep(step_f);
        vec3 color = colorFromStep(step);

        // Add contour lines:
        float change_distance = abs(step_f + 0.5 - step);
        float line_width = 0.0002 * gradient_norm_mm;
        if (change_distance < line_width) {
          color *= 0.5;
        }

        return color;
      }

      float absDistanceToPlane(vec4 plane, vec3 point)
      {
        // A point is on the plane iff: dot(plane.xyz, point) + plane.w == 0
        return abs(dot(plane.xyz, point) + plane.w);
      }

      float absDistanceToPlaneInDirection(vec4 plane, vec3 point, vec3 direction)
      {
        return absDistanceToPlane(plane, point) / length(cross(plane.xyz, direction));
      }

      float absDistanceToLineSegment(vec3 p1, vec3 p2, vec3 probe)
      {
        vec3 offset = probe - p1;
        vec3 axis = normalize(p2 - p1);
        float d = length(p2 - p1);
        float t = dot(axis, offset) / d;
        if (t < 0.0) {
          return distance(probe, p1);
        }
        if (t > 1.0) {
          return distance(probe, p2);
        }
        return length(offset - dot(axis, offset) * axis);
      }

      void main()
      {
        float cutoff_height = u_cutoff_height;
        cutoff_height += 0.007 * sin(50.0 * v_pos_in_world.x);
        cutoff_height += 0.007 * sin(50.0 * v_pos_in_world.y);

        if (v_pos_in_world.z > cutoff_height) { discard; }

        // Accentuate the fade-in ?
        // float cutoff_dist = cutoff_height - v_pos_in_world.z;
        // if (cutoff_dist < 0.001) {
        //   gl_FragColor = u_accent_color;
        //   return;
        // }

        vec3 normal = normalize(v_normal_in_world);

        vec3 mat_diffuse = vec3(1.0, 1.0, 1.0);

        // Pick fit zone
        float animation_duration = 0.6;
        float fade_in = smoothstep(0.0, 1.0, 1.0 - u_time_fit_zones / animation_duration);
        float scale_in = smoothstep(0.0, 1.0, u_time_fit_zones / animation_duration);
        if (
          pow(u_toe_marker.x - v_pos_in_mesh.x, 2.0) +
          pow(u_toe_marker.y - v_pos_in_mesh.y, 2.0) * 10.0 +
          pow(u_toe_marker.z - v_pos_in_mesh.z, 2.0) < 0.025 * scale_in) {
          mat_diffuse = mix(u_toe_color, mat_diffuse, fade_in);
        } else if (abs(u_ball_marker.y - v_pos_in_mesh.y) < 0.018 * scale_in) {
          mat_diffuse = mix(u_ball_color, mat_diffuse, fade_in);
        } else if (
          pow(u_instep_marker.x - v_pos_in_mesh.x, 2.0) +
          pow(u_instep_marker.y - v_pos_in_mesh.y, 2.0) * 5.0 +
          pow(u_instep_marker.z - v_pos_in_mesh.z, 2.0) < 0.002 * scale_in) {
          mat_diffuse = mix(u_instep_color, mat_diffuse, fade_in);
        } else if (distance(u_heel_marker, v_pos_in_mesh) < 0.07 * scale_in) {
          mat_diffuse = mix(u_heel_color, mat_diffuse, fade_in);
        }

        if (v_color.x < 0.5) {
          float error_mm = 1000.0 * v_tc.x;
          float gradient_norm_mm = 1000.0 * v_tc.y;
          mat_diffuse = colorFromMeshError(error_mm, gradient_norm_mm);
        }

        // Visualize measurement line gracing area.
        float distance_to_stoplines = min(
          absDistanceToLineSegment(u_stopline1_p1, u_stopline1_p2, v_pos_in_mesh),
          absDistanceToLineSegment(u_stopline2_p1, u_stopline2_p2, v_pos_in_mesh));

        // Visualize measurement girth plane.
        float distance_to_plane = absDistanceToPlaneInDirection(
          u_girth_plane, v_pos_in_mesh, normal);

        // Apply measurement line color.
        if (min(distance_to_stoplines, distance_to_plane) <= u_measurement_line_width * 0.5) {
          mat_diffuse = mix(mat_diffuse, u_measurement_line_color.rgb, u_measurement_line_color.a);
        }

        vec3 eye_dir = normalize(v_eye_pos - v_pos_in_world);

        gl_FragColor.rgb = mat_diffuse * AMBIENT_LIGHT;
        gl_FragColor.rgb += calc_light_color(
          normal, eye_dir, mat_diffuse,
          normalize(vec3(-1, +1, LIGHT_Z)),
          vec3(1.00, 0.95, 0.95) * LIGHT_MULTIPLIER);
        gl_FragColor.rgb += calc_light_color(
          normal, eye_dir, mat_diffuse,
          normalize(vec3(+1, +1, LIGHT_Z)),
          vec3(0.90, 1.00, 0.90) * LIGHT_MULTIPLIER);
        gl_FragColor.rgb += calc_light_color(
          normal, eye_dir, mat_diffuse,
          normalize(vec3(-1, -1, LIGHT_Z)),
          vec3(0.90, 0.90, 1.00) * LIGHT_MULTIPLIER);
        gl_FragColor.rgb += calc_light_color(
          normal, eye_dir, mat_diffuse,
          normalize(vec3(+1, -1, LIGHT_Z)),
          vec3(1.00, 0.95, 1.00) * LIGHT_MULTIPLIER);

        gl_FragColor.a = 1.0;
        gl_FragColor = clamp(gl_FragColor, 0.0, 1.0);
        gl_FragColor = LinearTosRGB(gl_FragColor);
      }
    `,
  });
}

export function getGroundMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      u_texture:       { value: null },
      u_right:         { value: 1.0 },
      u_left:          { value: 1.0 },
      u_pattern_color: { value: new THREE.Vector4(1, 1, 1, 1) },
    },
    transparent: true,
    depthWrite:  false,
    depthTest:   true,

    vertexShader: `
      varying vec2 v_tc;

      void main()
      {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        v_tc        = uv;
      }
    `,

    fragmentShader: `
      uniform sampler2D u_texture;
      uniform float u_left;
      uniform float u_right;
      uniform vec4 u_pattern_color;

      varying vec2 v_tc;

      float BORDER = 0.10;
      vec4 SHADOW_COLOR = vec4(0.0, 0.0, 0.0, 1.0);

      void main()
      {
        vec4 tex = texture2D(u_texture, v_tc);

        float calibration_pattern = 1.0 - tex.r;

        float right_shadow = (1.0 - tex.g) * u_right;
        float left_shadow  = (1.0 - tex.b) * u_left;
        float total_shadow = min(1.0, right_shadow + left_shadow);

        // Fade out shadow towards edges to avoid sharp cutoff at image end:
        total_shadow *= smoothstep(0.0, BORDER, v_tc.x);
        total_shadow *= smoothstep(0.0, BORDER, v_tc.y);
        total_shadow *= smoothstep(1.0, 1.0 - BORDER, v_tc.x);
        total_shadow *= smoothstep(1.0, 1.0 - BORDER, v_tc.y);

        float alpha = max(calibration_pattern, total_shadow);
        vec4 pattern_color = mix(u_pattern_color, SHADOW_COLOR, total_shadow / alpha);
        gl_FragColor = mix(pattern_color, SHADOW_COLOR, total_shadow);
        gl_FragColor.a *= alpha;
      }
    `,
  });
}

export function getLineMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      u_accent_color:  { value: new THREE.Vector4(1, 0, 0, 1) },
      u_color:         { value: new THREE.Vector4(0, 0, 0, 1) },
      u_time:          { value: 0.0 },
      u_cutoff_height: { value: 0.0 },
    },
    depthWrite:  false,
    transparent: true,

    vertexShader: `
      varying vec3 v_position;

      void main()
      {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        v_position = position;
      }
    `,

    fragmentShader: `
      uniform vec4  u_accent_color;
      uniform vec4  u_color;
      uniform float u_time;
      uniform float u_cutoff_height;

      varying vec3 v_position;

      void main()
      {
        float cutoff_height = u_cutoff_height;
        cutoff_height += 0.007 * sin(50.0 * v_position.x);
        cutoff_height += 0.007 * sin(50.0 * v_position.y);

        if (v_position.z > cutoff_height) { discard; }
        float cutoff_distance = cutoff_height - v_position.z;
        gl_FragColor = mix(u_accent_color, u_color, smoothstep(0.02, 0.04, cutoff_distance));

        // We animate a stripe of color change going from heel to toe.
        // The center of it starts at START_Y and wraps at STOP_Y.

        float START_Y    = -0.1;
        float STOP_Y     =  0.8; // Larger = longer time between waves
        float SPEED      =  0.15;
        float WAVE_WIDTH =  0.02;

        float wave_y = START_Y + mod(SPEED * u_time, STOP_Y - START_Y);
        float wave_dist = abs(v_position.y -  wave_y);
        float t = smoothstep(1.0, 0.0, wave_dist / WAVE_WIDTH);

        gl_FragColor = mix(gl_FragColor, u_accent_color, t);
      }
    `,
  });
}

export const solidMaterialLineWidth  = 1.5;
export const dashedMaterialLineWidth = 1.0;

export function getSolidMaterial() {
  return new THREE.LineBasicMaterial({
    color:       0x000000,
    linewidth:   solidMaterialLineWidth,
    opacity:     0.8,
    transparent: true,
  });
}

export function getDashedMaterial() {
  return new THREE.LineDashedMaterial({
    color:       0x000000,
    dashSize:    0.003,
    gapSize:     0.002,
    linewidth:   dashedMaterialLineWidth,
    opacity:     0.8,
    transparent: true,
  });
}

export const getAnchorPointMaterial = (fitColor: string) => {
  const fitColorThree = new THREE.Color(parseInt(fitColor.replace(/^#/, ''), 16));
  const size = 1;
  return new THREE.ShaderMaterial({
    uniforms: {
      u_inner_color:  { value: fitColorThree },
      u_stroke_color: { value: new THREE.Vector3(1, 1, 1) },
      u_radius:       { value: (size / 2.0) * 0.8 },
      u_resolution:   { value: new THREE.Vector2(size, size) },
    },
    depthWrite:   false,
    depthTest:    false,
    transparent:  true,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3  u_inner_color;
      uniform vec3  u_stroke_color;
      uniform float u_radius;
      uniform vec3  u_resolution;

      varying vec2  vUv;

      void main() {
        float d = distance(vUv, vec2(u_resolution.x * 0.5, u_resolution.y * 0.5));
        if (d <= u_radius) {
          gl_FragColor = vec4(u_inner_color, 1.0);
        } else if (d > u_radius && d < 0.5) {
          gl_FragColor = vec4(u_stroke_color, 1.0);
        } else {
          discard;
        }
      }
    `,
  });
};

export { getGroundBgMaterial, getGroundBgLineMaterial } from './splash_ground';
