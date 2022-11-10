// Copyright 2018 Volumental AB. CONFIDENTIAL. DO NOT REDISTRIBUTE.
import * as THREE from 'three';

/*
BMF = Binary Mesh Format.

A very simple 32 bit format for fast mesh encode/decode.
Made by and for Volumental needs.

kStartBmf
  kStartVertices
    u32         [num_verts]
    f32 f32 f32 [num_verts times]
  kEndVertices

  kStartRGBs [optional]
    u32         [num_colors == num_verts]
    f32 f32 f32 [num_colors times]
  kEndRGBs

  kStartGroup [0 or more]
    kMaterialName [optional]
      u32 [strlen]
      u8  [strlen times]

    kStartFaces
      u32         [num_triangles]
      u32 u32 u32 [num_triangles times]
    kEndFaces

    kStartUVs [optional]
      u32         [num_uvs == 3 * num_triangles]
      f32 f32     [num_uvs times]
    kEndUVs

    kStartNormals [optional]
      u32         [num_normals == 3 * num_triangles]
      f32 f32 f32 [num_normals times]
    kEndNormals
  kEndGroup
kEndBmf
*/

const kStartBmf      = 0x424d4630; // BMF0
const kEndBmf        = 0x464d4230; // FMB0
const kStartVertices = 0x536f5630; // SoV0
const kEndVertices   = 0x456f5630; // EoV0
const kStartRGBs     = 0x536f4330; // SoC0
const kEndRGBs       = 0x456f4330; // EoC0
const kStartGroup    = 0x536f4730; // SoG0
const kEndGroup      = 0x456f4730; // EoG0
const kMaterialName  = 0x4d617430; // Mat0
const kStartFaces    = 0x536f4630; // SoF0
const kEndFaces      = 0x456f4630; // EoF0
const kStartUVs      = 0x536f5530; // SoU0
const kEndUVs        = 0x456f5530; // EoU0
const kStartNormals  = 0x536f4E30; // SoN0
const kEndNormals    = 0x456f4E30; // EoN0

/*
 * Usage:
 *  import { BMFLoader } from './BMFLoader';
 *  const loader = new BMFLoader();
 *  loader.load('some_model.bmf', function (mesh) {
 *    scene.add(mesh);
 *  });
 */
const BMFLoader = function (manager?: THREE.LoadingManager) {
  this.manager = (manager !== undefined) ? manager : THREE.DefaultLoadingManager;
};

BMFLoader.prototype = {
  constructor: BMFLoader,

  load(url, onLoad, onProgress, onError) {
    const loader = new THREE.FileLoader(this.manager);
    loader.setResponseType('arraybuffer');
    loader.load(url, text => onLoad(this.parse(text)), onProgress, onError);
  },

  parse(data) {
    const binData = this.ensureBinary(data);
    const result = this.parseBinary(new DataView(binData));
    return result;
  },

  ensureBinary(buf) {
    if (typeof buf === 'string') {
      const array_buffer = new Uint8Array(buf.length);
      for (let i = 0; i < buf.length; i += 1) {
        array_buffer[i] = buf.charCodeAt(i) & 0xff; // implicitly assumes little-endian
      }
      return array_buffer.buffer || array_buffer;
    }
    return buf;
  },

  assert(test, message) {
    if (!test) {
      console.error(`Bad BMF file: ${message || 'BAD BMF'}`);
    }
  },

  assert_eq(actual, expected) {
    this.assert(
      actual === expected,
      `Expected ${expected.toString(16)}, got ${actual.toString(16)}`,
    );
  },

  parseBinary(reader) {
    const little_endian = true;
    let offset        = 0;

    const decode_u32 = () => {
      const v = reader.getUint32(offset, little_endian);
      offset += 4;
      return v;
    };

    const decode_f32 = () => {
      const v = reader.getFloat32(offset, little_endian);
      offset += 4;
      return v;
    };

    const decode_u32_array = (count) => {
      const result = new Uint32Array(count);
      for (let i = 0; i < count; i += 1) {
        result[i] = decode_u32();
      }
      return result;
    };

    const decode_f32_array = (count) => {
      const result = new Float32Array(count);
      for (let i = 0; i < count; i += 1) {
        result[i] = decode_f32();
      }
      return result;
    };

    const decode_string = () => {
      const count = decode_u32();
      let s = '';
      for (let i = 0; i < count; i += 1) {
        // TODO(Emil): UTF8
        s += String.fromCharCode(reader.getUint8(offset, little_endian));
        offset += 1;
      }
      return s;
    };

    this.assert(decode_u32() === kStartBmf, 'Not a BMF file');

    this.assert_eq(decode_u32(), kStartVertices);
    const num_verts = decode_u32();
    const positions = decode_f32_array(num_verts * 3);
    this.assert_eq(decode_u32(), kEndVertices);

    let next = decode_u32();

    let vertex_colors = null;
    if (next === kStartRGBs) {
      const num_colors = decode_u32();
      this.assert_eq(num_colors, num_verts);
      vertex_colors = decode_f32_array(num_colors * 3);
      this.assert_eq(decode_u32(), kEndRGBs);
      next = decode_u32();
    }

    const container = new THREE.Object3D();

    while (next === kStartGroup) {
      next = decode_u32();

      let material_name = '';

      if (next === kMaterialName) {
        material_name = decode_string();
        next = decode_u32();
      }

      this.assert_eq(next, kStartFaces);
      const num_triangles = decode_u32();
      const indices = decode_u32_array(num_triangles * 3);
      this.assert_eq(decode_u32(), kEndFaces);

      next = decode_u32();

      let uvs = null;
      if (next === kStartUVs) {
        const num_uvs = decode_u32();
        this.assert_eq(num_uvs, 3 * num_triangles);
        uvs = decode_f32_array(num_uvs * 2);
        this.assert_eq(decode_u32(), kEndUVs);
        next = decode_u32();
      }

      let normals = null;
      if (next === kStartNormals) {
        const num_normals = decode_u32();
        this.assert_eq(num_normals, 3 * num_triangles);
        normals = decode_f32_array(num_normals * 3);
        this.assert_eq(decode_u32(), kEndNormals);
        next = decode_u32();
      }

      this.assert_eq(next, kEndGroup);
      next = decode_u32();

      // -------------------------------------------------------
      // Convert:

      this.assert_eq(indices.length, num_triangles * 3);
      const group_vertices = new Float32Array(indices.length * 3);
      for (let i = 0; i < indices.length; i += 1) {
        this.assert(indices[i] < positions.length, 'Vertex index out of range');
        group_vertices[3 * i + 0] = positions[3 * indices[i] + 0];
        group_vertices[3 * i + 1] = positions[3 * indices[i] + 1];
        group_vertices[3 * i + 2] = positions[3 * indices[i] + 2];
      }

      const buffer_geometry = new THREE.BufferGeometry();

      buffer_geometry.setAttribute('position', new THREE.BufferAttribute(group_vertices, 3));

      if (normals) {
        buffer_geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
      }

      if (uvs) {
        buffer_geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      }

      if (vertex_colors) {
        const group_colors = new Float32Array(indices.length * 3);
        for (let i = 0; i < indices.length; i += 1) {
          this.assert(indices[i] < vertex_colors.length, 'Vertex index out of range');
          group_colors[3 * i + 0] = vertex_colors[3 * indices[i] + 0];
          group_colors[3 * i + 1] = vertex_colors[3 * indices[i] + 1];
          group_colors[3 * i + 2] = vertex_colors[3 * indices[i] + 2];
        }
        buffer_geometry.setAttribute('color', new THREE.BufferAttribute(group_colors, 3));
      }

      const material = new THREE.MeshLambertMaterial();
      material.name = material_name;
      const mesh = new THREE.Mesh(buffer_geometry, material);
      mesh.name = material_name;

      container.add(mesh);
    }

    this.assert_eq(next, kEndBmf);

    return container;
  },
};

export { BMFLoader };
