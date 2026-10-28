/* sp-phys.js — física del balón para penaltis y faltas (5.6). Determinista: paso fijo y semilla propia,
   misma entrada = mismo resultado (repeticiones y pruebas). Sin DOM: también corre en Node.
   Marco: x = metros desde la línea de gol hacia el campo (el punto de penalti está en x = 11), y = altura,
   z = lateral (z > 0 = izquierda del lanzador, que mira hacia -x). La portería va de z = -3.66 a 3.66. */
var SpPhys = (function () {
  "use strict";
  var D = (typeof SP_DATA !== "undefined" ? SP_DATA : {phys: {}}).phys;
  function P(k, d) { return D[k] != null ? D[k] : d; }
  var DT = P("dt", 1 / 240), G = P("g", 9.81), R = P("r", 0.11), KD = P("drag", 0.0125), KM = P("magnus", 0.0032);
  var HW = P("goalW", 7.32) / 2, GH = P("goalH", 2.44), ND = P("netD", 2), NBH = P("netBackH", 1.9), PR = P("postR", 0.06);
  /* semilla: mulberry32 */
  function rng(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function cl(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ball(o) { return {x: o.x, y: o.y == null ? R : o.y, z: o.z || 0, vx: o.vx || 0, vy: o.vy || 0, vz: o.vz || 0, wx: o.wx || 0, wy: o.wy || 0, wz: o.wz || 0, t: 0, kn: o.kn || 0, held: false, inNet: false, dead: false}; }

  /* ---------- portero: plan de estirada → cápsulas en función del tiempo ---------- */
  /* plan: {x, z, t0 (inicio), dur (s hasta máxima extensión), tz, ty (punto al que estira las manos), reach (m), stay, hands (0..1 calidad)} */
  function keeperAt(k, t, out) {
    var s = k.t0 == null ? 0 : cl((t - k.t0) / Math.max(0.05, k.dur), 0, 1), e = 1 - Math.pow(1 - s, 2.2);
    var bz = k.z, bx = k.x, hz = k.z + (k.tz - k.z) * e, hy = 1.05 + (k.ty - 1.05) * e;
    /* alcance máximo: el punto se recorta al alcance */
    var dz = hz - bz, dy = hy - 0.35, d = Math.sqrt(dz * dz + dy * dy), mx = k.reach;
    if (d > mx) { hz = bz + dz / d * mx; hy = 0.35 + dy / d * mx; }
    var lowDive = k.ty < 0.6;
    out.feet = [bx, 0.15 + (lowDive ? 0 : e * Math.max(0, hy - 1.4) * 0.4), bz + (hz - bz) * (k.stay ? 0 : 0.15 * e)];
    out.hand = [bx - 0.05, hy, hz];
    out.e = e; out.s = s;
    return out;
  }
  function segDist(px, py, pz, A, B, o) {
    var ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2], L2 = ux * ux + uy * uy + uz * uz || 1e-6;
    var t = cl(((px - A[0]) * ux + (py - A[1]) * uy + (pz - A[2]) * uz) / L2, 0, 1);
    var cx = A[0] + ux * t, cy = A[1] + uy * t, cz = A[2] + uz * t, dx = px - cx, dy = py - cy, dz = pz - cz;
    o.t = t; o.d = Math.sqrt(dx * dx + dy * dy + dz * dz); o.nx = dx / (o.d || 1); o.ny = dy / (o.d || 1); o.nz = dz / (o.d || 1);
    return o;
  }

  /* ---------- un paso ---------- */
  var KS = {}, SD = {};
  function step(b, env, ev) {
    if (b.held || b.dead) { b.t += DT; return; }
    var dt = DT, sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy + b.vz * b.vz);
    var wsp = Math.sqrt(b.wx * b.wx + b.wy * b.wy + b.wz * b.wz);
    var ax = 0, ay = -G, az = 0;
    /* aire: resistencia y viento */
    var wvx = b.vx - (env.wind ? env.wind[0] : 0), wvz = b.vz - (env.wind ? env.wind[1] : 0), wsp2 = Math.sqrt(wvx * wvx + b.vy * b.vy + wvz * wvz);
    ax -= KD * wsp2 * wvx; ay -= KD * wsp2 * b.vy; az -= KD * wsp2 * wvz;
    /* efecto Magnus: w × v */
    ax += KM * (b.wy * b.vz - b.wz * b.vy); ay += KM * (b.wz * b.vx - b.wx * b.vz); az += KM * (b.wx * b.vy - b.wy * b.vx);
    /* sin rotación: oscilaciones suaves controladas por la semilla */
    if (wsp < 3 && sp > 18 && b.kn) {
      var kk = P("knuckle", 2.6) * Math.pow(sp / 28, 2), f = P("knuckleF", 2.4);
      az += kk * Math.sin(b.t * f * 6.283 + b.kn * 6.283); ay += kk * 0.55 * Math.sin(b.t * f * 1.37 * 6.283 + b.kn * 17.1);
    }
    b.vx += ax * dt; b.vy += ay * dt; b.vz += az * dt;
    var dec = 1 - P("spinDecay", 0.06) * dt; b.wx *= dec; b.wy *= dec; b.wz *= dec;
    var px = b.x, py = b.y, pz = b.z;
    b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt; b.t += dt;
    /* césped */
    if (b.y < R) {
      b.y = R;
      if (b.vy < -0.4) { if (ev) ev.push({t: b.t, k: "bounce", x: b.x, z: b.z, v: -b.vy}); b.vy = -b.vy * (env.wet ? P("groundEWet", 0.64) : P("groundE", 0.56)); }
      else b.vy = 0;
      var gf = Math.pow(env.wet ? 0.86 : P("groundF", 0.74), dt * 6);
      b.vx *= gf; b.vz *= gf;
      /* el efecto muerde al botar */
      b.vz += b.wx * 0.002 * (env.wet ? 0.6 : 1); b.wx *= 0.9; b.wy *= 0.95; b.wz *= 0.9;
    }
    /* barrera: cajas orientadas */
    if (env.wall) for (var i = 0; i < env.wall.length; i++) {
      var w = env.wall[i]; if (w.down) continue;
      var jy = w.jump ? w.jump(b.t) : 0, lx = b.x - w.x, lz = b.z - w.z, a = lx * w.dx + lz * w.dz, c = -lx * w.dz + lz * w.dx;
      if (Math.abs(a) < 0.16 + R && Math.abs(c) < 0.26 + R && b.y > jy - R && b.y < jy + w.h + R) {
        /* rebote: sobre todo hacia atrás (eje del balón) */
        var vn = b.vx * w.dx + b.vz * w.dz;
        if (vn < 0) { b.vx -= 1.55 * vn * w.dx; b.vz -= 1.55 * vn * w.dz; b.vx *= 0.55; b.vz *= 0.55; b.vy = Math.abs(b.vy) * 0.4 + 0.8; b.vz += (c > 0 ? 1 : -1) * 0.8; }
        b.x = px; b.y = py; b.z = pz;
        if (ev && !w.hit) ev.push({t: b.t, k: "wall", i: i, y: b.y});
        w.hit = true;
      }
    }
    /* portero */
    if (env.keeper && !b.touchK) {
      var K = keeperAt(env.keeper, b.t, KS);
      var sd = segDist(b.x, b.y, b.z, K.feet, K.hand, SD), rad = 0.22 + (sd.t > 0.82 ? 0.1 : 0) + (env.keeper.hands > 0.74 ? 0.05 : 0);
      if (sd.d < rad + R) {
        var hands = (env.keeper.hands == null ? 0.6 : env.keeper.hands) * (env.wet ? 0.78 : 1), catchable = sd.t > 0.7 && sp < 14 + 10 * hands && K.e > 0.6;
        var vnk = b.vx * sd.nx + b.vy * sd.ny + b.vz * sd.nz;
        if (catchable && !env.keeper.noCatch) { b.held = true; b.vx = b.vy = b.vz = 0; if (ev) ev.push({t: b.t, k: "catch", y: b.y, z: b.z, part: "hands"}); }
        else {
          var e = P("keeperE", 0.35) + 0.15 * (1 - hands);
          if (vnk < 0) { b.vx -= (1 + e) * vnk * sd.nx; b.vy -= (1 + e) * vnk * sd.ny; b.vz -= (1 + e) * vnk * sd.nz; }
          /* desvío hacia fuera: el portero empuja lejos de la portería */
          b.vx = Math.abs(b.vx) * 0.5 + 2.5; b.vz += (b.z >= env.keeper.z ? 1 : -1) * (1.5 + sp * 0.12); b.vy = Math.max(b.vy, 0.8 + sp * 0.06);
          b.wx *= 0.2; b.wy *= 0.2; b.wz *= 0.2;
          if (ev) ev.push({t: b.t, k: "parry", y: b.y, z: b.z, part: sd.t > 0.8 ? "hands" : sd.t < 0.25 ? "feet" : "body"});
        }
        b.touchK = true;
      }
    }
    /* postes y larguero (cilindros detrás de la línea) */
    postHit(b, ev, -HW - PR, true); postHit(b, ev, HW + PR, true); barHit(b, ev);
    /* línea de gol: el balón entero tiene que pasar */
    if (!b.crossed && b.x < -0.12 - R) {
      b.crossed = true;
      var inGoal = Math.abs(b.z) < HW && b.y < GH;
      if (ev) ev.push({t: b.t, k: inGoal ? "goal" : b.y >= GH ? "over" : "wide", y: b.y, z: b.z});
      b.goal = inGoal;
    }
    /* red: frena el balón dentro de la portería */
    if (b.goal && !b.inNet) {
      var backX = -ND + (b.y > NBH ? (b.y - NBH) / (GH - NBH) * 0.0 : 0), roofY = GH - (GH - NBH) * cl(-b.x / ND, 0, 1);
      if (b.x < backX + R || b.y > roofY - R || Math.abs(b.z) > HW - R) {
        b.inNet = true; if (ev) ev.push({t: b.t, k: "net", x: b.x, y: b.y, z: b.z, v: sp});
        b.vx *= -0.12; b.vy *= 0.2; b.vz *= 0.15; b.wx = b.wy = b.wz = 0;
      }
    }
    if (b.inNet) { b.x = Math.max(b.x, -ND + R); b.vx *= 0.9; b.vz *= 0.9; }
    if (b.t > 0.4 && sp < 0.25 && b.y <= R + 0.001) b.dead = true;
  }
  function postHit(b, ev, pz, vertical) {
    if (b.y > GH + PR + R) return;
    var dx = b.x + PR, dz = b.z - pz, d = Math.sqrt(dx * dx + dz * dz);
    if (d < PR + R && d > 1e-5) {
      var nx = dx / d, nz = dz / d, vn = b.vx * nx + b.vz * nz;
      if (vn < 0) {
        var e = P("postE", 0.62); b.vx -= (1 + e) * vn * nx; b.vz -= (1 + e) * vn * nz;
        b.x = -PR + nx * (PR + R); b.z = pz + nz * (PR + R);
        if (ev) ev.push({t: b.t, k: "post", y: b.y, z: pz, v: -vn});
        b.post = true;
      }
    }
  }
  function barHit(b, ev) {
    if (Math.abs(b.z) > HW + PR) return;
    var dx = b.x + PR, dy = b.y - (GH + PR), d = Math.sqrt(dx * dx + dy * dy);
    if (d < PR + R && d > 1e-5) {
      var nx = dx / d, ny = dy / d, vn = b.vx * nx + b.vy * ny;
      if (vn < 0) {
        var e = P("postE", 0.62); b.vx -= (1 + e) * vn * nx; b.vy -= (1 + e) * vn * ny;
        b.x = -PR + nx * (PR + R); b.y = GH + PR + ny * (PR + R);
        if (ev) ev.push({t: b.t, k: "bar", y: GH, z: b.z, v: -vn});
        b.post = true;
      }
    }
  }

  /* ---------- simulación completa: devuelve trayectoria, sucesos y resultado ---------- */
  function sim(b0, env, opt) {
    opt = opt || {};
    var b = ball(b0), ev = [], path = [], tmax = opt.tmax || 3.2, every = opt.every || 4, n = 0;
    if (env.wall) env.wall.forEach(function (w) { w.hit = false; });
    while (b.t < tmax && !b.dead) {
      if (n++ % every === 0) path.push(b.t, b.x, b.y, b.z, b.wx, b.wy, b.wz);
      step(b, env, ev);
      if (b.held) { path.push(b.t, b.x, b.y, b.z, 0, 0, 0); break; }
      if (opt.stopAtPlane != null && b.x < opt.stopAtPlane) break;
      if (b.crossed && !b.goal && b.t > (opt.afterCross || 0) + 0) { if (!opt.full) break; }
      if (b.inNet && b.t - (b.netT || (b.netT = b.t)) > 0.9) break;
    }
    path.push(b.t, b.x, b.y, b.z, 0, 0, 0);
    return {path: path, ev: ev, res: classify(ev, b), end: b};
  }
  function classify(ev, b) {
    var has = function (k) { for (var i = 0; i < ev.length; i++) if (ev[i].k === k) return ev[i]; return null; };
    var g = has("goal"), post = has("post") || has("bar"), wall = has("wall"), c = has("catch"), pr = has("parry");
    if (g) return {how: post ? "postin" : pr ? "touchin" : "goal", scored: true};
    if (c) return {how: "catch", scored: false, saved: true};
    if (pr) return {how: "save", scored: false, saved: true, part: pr.part};
    if (post) return {how: "post", scored: false};
    if (wall) return {how: "wall", scored: false};
    var o = has("over"); if (o) return {how: "over", scored: false};
    if (has("wide")) return {how: "wide", scored: false};
    return {how: "short", scored: false};
  }
  /* cruce del plano de la línea de gol sin portero ni barrera (para apuntar) */
  function cross(b0, env) {
    var b = ball(b0), e2 = {wind: env.wind, wet: env.wet};
    for (var i = 0; i < 2400; i++) { var px = b.x, py = b.y, pz = b.z, pt = b.t; step(b, e2, null); if (b.x <= 0) { var k = px / Math.max(1e-6, px - b.x); return {y: py + (b.y - py) * k, z: pz + (b.z - pz) * k, t: pt + (b.t - pt) * k}; } if (b.dead || b.vx > -0.5) break; }
    return null;
  }
  /* resolvedor: velocidad inicial para que el balón cruce la línea en (ty, tz) con rapidez sp y rotación w */
  function solve(from, ty, tz, sp, w, env) {
    env = env || {};
    var dx = from.x, dz = tz - from.z, dist = Math.sqrt(dx * dx + dz * dz), T = dist / sp;
    var vy = (ty - (from.y || R)) / T + 0.5 * G * T, vh = dist / T;
    var o = {x: from.x, y: from.y || R, z: from.z, vx: -vh * dx / dist, vy: vy, vz: vh * dz / dist, wx: w[0], wy: w[1], wz: w[2], kn: from.kn || 0};
    for (var it = 0; it < 10; it++) {
      var c = cross(o, env); if (!c) { o.vy += 1.5; o.vx *= 1.05; continue; }
      var ey = ty - c.y, ez = tz - c.z;
      if (Math.abs(ey) < 0.004 && Math.abs(ez) < 0.004) break;
      o.vy += ey / Math.max(0.12, c.t) * 0.95; o.vz += ez / Math.max(0.12, c.t) * 0.95;
    }
    return o;
  }
  return {DT: DT, R: R, HW: HW, GH: GH, ND: ND, rng: rng, ball: ball, step: step, sim: sim, solve: solve, cross: cross, keeperAt: keeperAt, classify: classify};
})();
if (typeof module !== "undefined") module.exports = SpPhys;
