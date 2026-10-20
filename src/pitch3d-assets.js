/* Cargador mínimo de los GLB del partido 3D.
 *
 * Los assets se generan en el árbol de assets y el build los incrusta como
 * base64. Este módulo no usa three.js ni ninguna dependencia de runtime:
 * extrae posiciones, COLOR_0, JOINTS_0, WEIGHTS_0, la jerarquía del skin y
 * los cinco clips. El renderer hace el skinning en CPU porque el partido ya
 * usa un shader propio y un único VBO dinámico para todos los jugadores.
 *
 * Formato de salida (todo arrays planos):
 *   player: positions, colors, joints, weights, materials, matNames,
 *           parents, bindT, bindR, bindS, ibm, clips, triangles
 *   static: positions, colors, triangles
 */
var Pitch3DAssets = (function () {
  "use strict";

  var CT = {5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4};
  var NT = {SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16};
  var PLAYER_KEYS = {
    male: {1: "male_lod1", 2: "male_lod2"},
    female: {1: "female_lod1", 2: "female_lod2"},
    goalkeeper: {1: "goalkeeper_lod1", 2: "goalkeeper_lod2"}
  };
  var STATIC_KEYS = ["ball_lod1", "goal_lod1", "corner_flag_lod0", "ad_board_lod0", "bench_lod0", "barrier_lod0"];

  function warn(msg) {
    if (typeof console !== "undefined" && console.warn) console.warn("Pitch3D assets: " + msg);
  }

  function b64bytes(s) {
    var bin, out, i;
    if (typeof atob === "function") bin = atob(String(s || ""));
    else {
      var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
      var clean = String(s || "").replace(/[^A-Za-z0-9+/=]/g, ""), buffer = "", n = 0, bits = 0;
      for (i = 0; i < clean.length; i++) {
        var c = clean.charAt(i);
        if (c === "=") break;
        var v = chars.indexOf(c);
        if (v < 0) continue;
        bits = (bits << 6) | v; n += 6;
        if (n >= 8) { n -= 8; buffer += String.fromCharCode((bits >> n) & 255); }
      }
      bin = buffer;
    }
    out = new Uint8Array(bin.length);
    for (i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i) & 255;
    return out;
  }

  function utf8(bytes) {
    if (typeof TextDecoder !== "undefined") return new TextDecoder("utf-8").decode(bytes);
    var s = "", i = 0;
    while (i < bytes.length) {
      var c = bytes[i++];
      if (c < 128) s += String.fromCharCode(c);
      else if (c < 224) s += String.fromCharCode(((c & 31) << 6) | (bytes[i++] & 63));
      else if (c < 240) s += String.fromCharCode(((c & 15) << 12) | ((bytes[i++] & 63) << 6) | (bytes[i++] & 63));
      else {
        var cp = ((c & 7) << 18) | ((bytes[i++] & 63) << 12) | ((bytes[i++] & 63) << 6) | (bytes[i++] & 63);
        cp -= 0x10000; s += String.fromCharCode(0xD800 + (cp >> 10), 0xDC00 + (cp & 1023));
      }
    }
    return s;
  }

  function parseGLB(b64) {
    var bytes = b64bytes(b64), dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    if (dv.getUint32(0, true) !== 0x46546C67) throw new Error("cabecera GLB");
    if (dv.getUint32(4, true) !== 2) throw new Error("versión GLB");
    var jlen = dv.getUint32(12, true);
    if (dv.getUint32(16, true) !== 0x4E4F534A) throw new Error("chunk JSON");
    var json = JSON.parse(utf8(bytes.subarray(20, 20 + jlen)));
    var off = 20 + jlen;
    var blen = dv.getUint32(off, true);
    if (dv.getUint32(off + 4, true) !== 0x004E4942) throw new Error("chunk BIN");
    return {json: json, bin: bytes.subarray(off + 8, off + 8 + blen)};
  }

  function readAccessor(g, bin, index, asFloat) {
    var a = g.accessors[index], n = NT[a.type] || 1, comp = CT[a.componentType], count = a.count;
    var bv = a.bufferView == null ? null : g.bufferViews[a.bufferView];
    var base = (bv && bv.byteOffset ? bv.byteOffset : 0) + (a.byteOffset || 0);
    var stride = (bv && bv.byteStride) || n * comp;
    var out = asFloat ? new Float32Array(count * n) : new Uint32Array(count);
    var dv = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
    var i, k, o;
    for (i = 0; i < count; i++) {
      o = base + i * stride;
      for (k = 0; k < n; k++) {
        var v;
        if (a.componentType === 5126) v = dv.getFloat32(o + k * 4, true);
        else if (a.componentType === 5125) v = dv.getUint32(o + k * 4, true);
        else if (a.componentType === 5123) v = dv.getUint16(o + k * 2, true);
        else if (a.componentType === 5122) v = dv.getInt16(o + k * 2, true);
        else if (a.componentType === 5121) v = dv.getUint8(o + k);
        else v = dv.getInt8(o + k);
        if (a.normalized) {
          if (a.componentType === 5121) v /= 255;
          else if (a.componentType === 5123) v /= 65535;
          else if (a.componentType === 5120) v = Math.max(v / 127, -1);
          else if (a.componentType === 5122) v = Math.max(v / 32767, -1);
        }
        if (asFloat) out[i * n + k] = v;
        else out[i] = v;
      }
    }
    return out;
  }

  function srgb(c) {
    c = c < 0 ? 0 : c > 1 ? 1 : c;
    return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  }

  function materialColor(m) {
    var f = m && m.pbrMetallicRoughness && m.pbrMetallicRoughness.baseColorFactor;
    return f ? [srgb(f[0]), srgb(f[1]), srgb(f[2])] : [1, 1, 1];
  }

  function parsePlayer(b64, id, variant, lod) {
    var glb = parseGLB(b64), g = glb.json, bin = glb.bin;
    var mesh = g.meshes[0], mats = g.materials || [], prims = mesh.primitives || [];
    var positions = [], colors = [], joints = [], weights = [], materials = [];
    var matNames = mats.map(function (m) { return m.name || ""; });
    var matColors = mats.map(materialColor);

    for (var pi = 0; pi < prims.length; pi++) {
      var pr = prims[pi];
      if (pr.mode != null && pr.mode !== 4) continue;
      var A = pr.attributes || {};
      var pos = readAccessor(g, bin, A.POSITION, true);
      var col = A.COLOR_0 != null ? readAccessor(g, bin, A.COLOR_0, true) : null;
      var jnt = A.JOINTS_0 != null ? readAccessor(g, bin, A.JOINTS_0, true) : null;
      var wgt = A.WEIGHTS_0 != null ? readAccessor(g, bin, A.WEIGHTS_0, true) : null;
      var idx = readAccessor(g, bin, pr.indices, false);
      var cstride = col ? (NT[g.accessors[A.COLOR_0].type] || 3) : 0;
      var mi = pr.material == null ? 0 : pr.material;
      for (var t = 0; t < idx.length; t += 3) {
        for (var k = 0; k < 3; k++) {
          var vi = idx[t + k];
          positions.push(pos[vi * 3], pos[vi * 3 + 1], pos[vi * 3 + 2]);
          if (col) {
            colors.push(col[vi * cstride] == null ? 1 : col[vi * cstride],
              col[vi * cstride + 1] == null ? 1 : col[vi * cstride + 1],
              col[vi * cstride + 2] == null ? 1 : col[vi * cstride + 2]);
          } else colors.push(1, 1, 1);
          if (jnt) joints.push(Math.max(0, Math.min(255, jnt[vi * 4] | 0)),
            Math.max(0, Math.min(255, jnt[vi * 4 + 1] | 0)),
            Math.max(0, Math.min(255, jnt[vi * 4 + 2] | 0)),
            Math.max(0, Math.min(255, jnt[vi * 4 + 3] | 0)));
          else joints.push(0, 0, 0, 0);
          if (wgt) {
            var w0 = wgt[vi * 4] || 0, w1 = wgt[vi * 4 + 1] || 0, w2 = wgt[vi * 4 + 2] || 0, w3 = wgt[vi * 4 + 3] || 0;
            var ws = w0 + w1 + w2 + w3;
            if (ws > 0.00001) { w0 /= ws; w1 /= ws; w2 /= ws; w3 /= ws; }
            weights.push(w0, w1, w2, w3);
          } else weights.push(1, 0, 0, 0);
          materials.push(mi);
        }
      }
    }

    var skin = g.skins && g.skins[0];
    if (!skin) throw new Error("sin skin");
    var skel = skin.joints || [];
    var slot = {};
    for (var s = 0; s < skel.length; s++) slot[skel[s]] = s;
    var parent = new Int8Array(skel.length); parent.fill(-1);
    for (var ni = 0; ni < (g.nodes || []).length; ni++) {
      var ch = g.nodes[ni].children || [];
      for (var ci = 0; ci < ch.length; ci++) if (slot[ch[ci]] != null && slot[ni] != null) parent[slot[ch[ci]]] = slot[ni];
    }
    var bindT = new Float32Array(skel.length * 3), bindR = new Float32Array(skel.length * 4), bindS = new Float32Array(skel.length * 3);
    for (var sj = 0; sj < skel.length; sj++) {
      var nd = g.nodes[skel[sj]] || {};
      var tt = nd.translation || [0, 0, 0], rr = nd.rotation || [0, 0, 0, 1], ss = nd.scale || [1, 1, 1];
      bindT[sj * 3] = tt[0]; bindT[sj * 3 + 1] = tt[1]; bindT[sj * 3 + 2] = tt[2];
      bindR[sj * 4] = rr[0]; bindR[sj * 4 + 1] = rr[1]; bindR[sj * 4 + 2] = rr[2]; bindR[sj * 4 + 3] = rr[3];
      bindS[sj * 3] = ss[0]; bindS[sj * 3 + 1] = ss[1]; bindS[sj * 3 + 2] = ss[2];
    }
    var ibm = readAccessor(g, bin, skin.inverseBindMatrices, true);
    var clips = {};
    (g.animations || []).forEach(function (anim) {
      var tracks = [], dur = 0;
      (anim.channels || []).forEach(function (ch) {
        var slotIndex = slot[ch.target.node];
        if (slotIndex == null) return;
        var path = ch.target.path;
        if (path !== "rotation" && path !== "translation" && path !== "scale") return;
        var sm = anim.samplers[ch.sampler];
        var times = readAccessor(g, bin, sm.input, true);
        var values = readAccessor(g, bin, sm.output, true);
        var comps = path === "rotation" ? 4 : 3;
        if (values.length < times.length * comps) return;
        for (var ti = 0; ti < times.length; ti++) if (times[ti] > dur) dur = times[ti];
        tracks.push({node: slotIndex, path: path, times: times, values: values});
      });
      clips[anim.name] = {dur: dur || 1, loop: !!(anim.extras && anim.extras.loop), tracks: tracks};
    });
    return {
      id: id, variant: variant, lod: lod, positions: new Float32Array(positions), colors: new Float32Array(colors),
      joints: new Uint8Array(joints), weights: new Float32Array(weights), materials: new Uint8Array(materials),
      matNames: matNames, matColors: matColors, parents: parent, bindT: bindT, bindR: bindR, bindS: bindS,
      ibm: ibm, clips: clips, triangles: positions.length / 9
    };
  }

  function parseStatic(b64, id) {
    var glb = parseGLB(b64), g = glb.json, bin = glb.bin;
    var positions = [], colors = [];
    for (var mi = 0; mi < (g.meshes || []).length; mi++) {
      var prims = g.meshes[mi].primitives || [];
      for (var pi = 0; pi < prims.length; pi++) {
        var pr = prims[pi], A = pr.attributes || {};
        if (pr.mode != null && pr.mode !== 4) continue;
        var pos = readAccessor(g, bin, A.POSITION, true);
        var col = A.COLOR_0 != null ? readAccessor(g, bin, A.COLOR_0, true) : null;
        var idx = readAccessor(g, bin, pr.indices, false);
        var cstride = col ? (NT[g.accessors[A.COLOR_0].type] || 3) : 0;
        var base = materialColor(g.materials && g.materials[pr.material]);
        for (var t = 0; t < idx.length; t++) {
          var vi = idx[t];
          positions.push(pos[vi * 3], pos[vi * 3 + 1], pos[vi * 3 + 2]);
          var cc = col ? [col[vi * cstride], col[vi * cstride + 1], col[vi * cstride + 2]] : [1, 1, 1];
          colors.push(base[0] * cc[0], base[1] * cc[1], base[2] * cc[2]);
        }
      }
    }
    return {id: id, positions: new Float32Array(positions), colors: new Float32Array(colors), triangles: positions.length / 9};
  }

  function load(pack) {
    var out = {players: {}, static: {}, ok: 0, errors: []};
    if (!pack) return out;
    for (var v in PLAYER_KEYS) if (PLAYER_KEYS.hasOwnProperty(v)) {
      out.players[v] = {};
      for (var lod in PLAYER_KEYS[v]) if (PLAYER_KEYS[v].hasOwnProperty(lod)) {
        var id = PLAYER_KEYS[v][lod];
        if (!pack[id]) continue;
        try { out.players[v][lod] = parsePlayer(pack[id], id, v, +lod); out.ok++; }
        catch (e) { out.errors.push(id + ": " + (e && e.message ? e.message : e)); }
      }
    }
    for (var i = 0; i < STATIC_KEYS.length; i++) {
      var sid = STATIC_KEYS[i];
      if (!pack[sid]) continue;
      try { out.static[sid] = parseStatic(pack[sid], sid); out.ok++; }
      catch (e2) { out.errors.push(sid + ": " + (e2 && e2.message ? e2.message : e2)); }
    }
    if (out.errors.length) warn(out.errors.join(" | "));
    return out;
  }

  return {load: load, keys: {players: PLAYER_KEYS, statics: STATIC_KEYS}};
})();
