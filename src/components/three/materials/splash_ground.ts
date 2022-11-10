import * as THREE from 'three';

export function getGroundBgMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      u_accent_color: { value: new THREE.Vector3(0.0, 0.0, 0.0) },
      u_time:         { value: 0.0 },
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
      uniform vec3 u_accent_color;
      uniform float u_time;
      uniform vec2 u_resolution;

      varying vec2 v_tc;

      float circle(in vec2 _st, in float _radius){
        vec2 l = _st-vec2(0.5);
        return 1.-smoothstep(_radius-(_radius*0.01),
                             _radius+(_radius*0.01),
                             dot(l,l)*4.0);
      }

      void main()
      {
        vec4 transparent = vec4(1.0, 1.0, 1.0, 0.0);
        vec4 accent = vec4(u_accent_color, 0.4);
        float speed_duration = 6.0;
        float circle_max_r = 0.5;
        float pct = circle(v_tc, mod(u_time, speed_duration) / speed_duration * circle_max_r);
        vec4 color = mix(transparent, accent, pct);
        gl_FragColor = color;
      }
    `,
  });
}

export function getGroundBgLineMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      u_base_color: { value: new THREE.Vector4(0, 0, 0, 0.3) },
      u_time:       { value: 0.0 },
      u_resolution: { value: new THREE.Vector2(10.0, 10.0) },
    },
    transparent: true,
    depthWrite:  false,
    depthTest:   true,

    vertexShader: `
      varying vec3 v_position;

      void main()
      {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        v_position = position;
      }
    `,

    fragmentShader: `
      uniform vec4 u_base_color;
      uniform float u_time;
      uniform vec2 u_resolution;

      varying vec3 v_position;

      float circle(in vec2 _st, in float _radius){
        vec2 l = _st-vec2(0.0);
        return 1.-smoothstep(_radius-(_radius*0.001),
                             _radius+(_radius*0.001),
                             dot(l,l)*4.0);
      }

      void main()
      {
        vec2 st = vec2(v_position.x / u_resolution.x, v_position.z / u_resolution.y);
        vec4 white = vec4(1.0, 1.0, 1.0, 1.0);
        float speed_duration = 6.0;
        float circle_max_r = 0.5;
        float pct = circle(st, mod(u_time, speed_duration) / speed_duration * circle_max_r);
        vec4 color = mix(u_base_color, white, pct);
        gl_FragColor = color;
      }
    `,
  });
}
