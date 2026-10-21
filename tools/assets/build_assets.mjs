// Generador mínimo de GLB 2.0 para validar el pipeline de assets.
// No sustituye a los GLB finales del juego; sirve como punto de partida.
import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve("assets/generated/test_cube.glb");

function writeGLB(outPath, json, bin) {
  const jsonStr = JSON.stringify(json);
  const jsonPad = (4 - (jsonStr.length % 4)) % 4;
  const binPad = (4 - (bin.length % 4)) % 4;

  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546C67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jsonStr.length + jsonPad + 8 + bin.length + binPad, 8);

  const jsonChunk = Buffer.alloc(8 + jsonStr.length + jsonPad);
  jsonChunk.writeUInt32LE(jsonStr.length + jsonPad, 0);
  jsonChunk.writeUInt32LE(0x4E4F534A, 4);
  jsonChunk.write(jsonStr, 8);
  for (let i = 0; i < jsonPad; i++) jsonChunk[8 + jsonStr.length + i] = 0x20;

  const binChunk = Buffer.alloc(8 + bin.length + binPad);
  binChunk.writeUInt32LE(bin.length + binPad, 0);
  binChunk.writeUInt32LE(0x004E4942, 4);
  Buffer.from(bin).copy(binChunk, 8);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, Buffer.concat([header, jsonChunk, binChunk]));
  console.log("Generado:", outPath);
}

// Malla mínima: un cubo de 8 vértices y 12 triángulos.
const positions = new Float32Array([
  -0.5, 0, -0.5,  0.5, 0, -0.5,  0.5, 1, -0.5, -0.5, 1, -0.5,
  -0.5, 0,  0.5,  0.5, 0,  0.5,  0.5, 1,  0.5, -0.5, 1,  0.5
]);
const indices = new Uint16Array([
  0,1,2, 0,2,3, 4,6,5, 4,7,6,
  0,4,7, 0,7,3, 1,5,6, 1,6,2,
  3,7,6, 3,6,2, 0,1,5, 0,5,4
]);
const colors = new Float32Array(positions.length);
for (let i = 0; i < colors.length; i += 3) {
  colors[i] = 0.8; colors[i+1] = 0.3; colors[i+2] = 0.2;
}

// Un hueso raíz.
const bindMatrices = new Float32Array(16);
bindMatrices[0] = 1; bindMatrices[5] = 1; bindMatrices[10] = 1; bindMatrices[15] = 1;
const ibm = new Float32Array(16);
ibm[0] = 1; ibm[5] = 1; ibm[10] = 1; ibm[15] = 1;

// Joints: todos los vértices al hueso 0.
const joints = new Uint8Array(positions.length / 3 * 4);
const weights = new Float32Array(positions.length / 3 * 4);
for (let i = 0; i < positions.length / 3; i++) {
  joints[i*4] = 0; weights[i*4] = 1;
}

const json = {
  asset: { version: "2.0", generator: "camino-build-assets-minimal" },
  scene: 0,
  scenes: [{ nodes: [0] }],
  nodes: [{ mesh: 0, skin: 0, name: "root" }],
  meshes: [{ primitives: [{ attributes: { POSITION: 0, COLOR_0: 1, JOINTS_0: 2, WEIGHTS_0: 3 }, indices: 4, material: 0 }] }],
  skins: [{ joints: [0], inverseBindMatrices: 5 }],
  materials: [{ name: "kit_shirt", pbrMetallicRoughness: { baseColorFactor: [0.8,0.3,0.2,1], metallicFactor: 0.1, roughnessFactor: 0.6 } }],
  accessors: [
    { bufferView: 0, componentType: 5126, count: positions.length / 3, type: "VEC3", min: [-0.5,0,-0.5], max: [0.5,1,0.5] },
    { bufferView: 1, componentType: 5126, count: colors.length / 3, type: "VEC3" },
    { bufferView: 2, componentType: 5121, count: joints.length / 4, type: "VEC4" },
    { bufferView: 3, componentType: 5126, count: weights.length / 4, type: "VEC4" },
    { bufferView: 4, componentType: 5123, count: indices.length, type: "SCALAR" },
    { bufferView: 5, componentType: 5126, count: 1, type: "MAT4" }
  ],
  bufferViews: [
    { buffer: 0, byteOffset: 0, byteLength: positions.byteLength, target: 34962 },
    { buffer: 0, byteOffset: positions.byteLength, byteLength: colors.byteLength, target: 34962 },
    { buffer: 0, byteOffset: positions.byteLength + colors.byteLength, byteLength: joints.byteLength, target: 34962 },
    { buffer: 0, byteOffset: positions.byteLength + colors.byteLength + joints.byteLength, byteLength: weights.byteLength, target: 34962 },
    { buffer: 0, byteOffset: positions.byteLength + colors.byteLength + joints.byteLength + weights.byteLength, byteLength: indices.byteLength, target: 34963 },
    { buffer: 0, byteOffset: positions.byteLength + colors.byteLength + joints.byteLength + weights.byteLength + indices.byteLength, byteLength: ibm.byteLength }
  ],
  buffers: [{ byteLength: positions.byteLength + colors.byteLength + joints.byteLength + weights.byteLength + indices.byteLength + ibm.byteLength }]
};

const bin = Buffer.alloc(json.buffers[0].byteLength);
let off = 0;
Buffer.from(positions.buffer).copy(bin, off); off += positions.byteLength;
Buffer.from(colors.buffer).copy(bin, off); off += colors.byteLength;
Buffer.from(joints.buffer).copy(bin, off); off += joints.byteLength;
Buffer.from(weights.buffer).copy(bin, off); off += weights.byteLength;
Buffer.from(indices.buffer).copy(bin, off); off += indices.byteLength;
Buffer.from(ibm.buffer).copy(bin, off); off += ibm.byteLength;

writeGLB(OUT, json, bin);
console.log("Listo. Este GLB es solo para validar el pipeline.");
