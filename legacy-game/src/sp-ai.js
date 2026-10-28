/* sp-ai.js — reglas de precisión e IA de balón parado (5.6), sin DOM: error del golpeo, portero rival,
   barrera y elección de hueco del lanzador. Lo usan los modos 3D y la herramienta de simulación (Node). */
var SpAI = (function () {
  "use strict";
  var D = SP_DATA, B = D.bal, HW = SpPhys.HW, GH = SpPhys.GH, R = SpPhys.R, PI = Math.PI;
  function cl(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function gauss(r) { var u = Math.max(1e-9, r()), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * PI * v); }
  function sN(v) { return cl((v - 40) / 55, 0, 1); }
  /* error real del golpeo: punto real = deseado + error (calidad, potencia, pie, atributos, compostura, presión) */
  function applyError(sw, o, rand) {
    var s = sN(o.skill || 70), cmp = sN(o.comp || o.skill || 70);
    var sig = (B.errBase + B.errPower * sw.power * sw.power) * (1 + B.errPress * (o.press || 0) * (1 - 0.6 * cmp)) * (o.badFoot ? 1 + B.errBadFoot : 1) * (1 - B.errSkill * s) * (1.6 - 0.6 * sw.quality) * (o.help ? 1 - o.help : 1);
    if (sw.type === "knuckle") sig *= 1.25; if (sw.type === "chip") sig *= 0.8;
    var dist = o.dist || 11; sig *= dist > 12 ? Math.pow(dist / 11, 1.35) * 0.75 + 0.35 : 1;
    return {y: sw.y + gauss(rand) * sig * 0.8, z: sw.z + gauss(rand) * sig, spin: [sw.spin[0], sw.spin[1] * (1 + gauss(rand) * 0.08), sw.spin[2] * (1 + gauss(rand) * 0.08)], v: sw.v * (1 + gauss(rand) * 0.03)};
  }

  /* ---------- IA del portero rival ---------- */
  /* decide de forma creíble, antes o después del golpeo, sin saber el resultado */
  function aiKeeper(prof, b0, o, rand) {
    var g = sN(o.gk || 70), refl = prof.refl * 0.6 + g * 0.4, cross = SpPhys.cross(b0, {}) || {t: 0.6, y: 1, z: 0};
    var reach = B.gkReach + B.gkReachSkill * g * (0.6 + prof.reach * 0.6);
    var plan = {x: o.x0 == null ? 0.3 : o.x0, z: o.z0 || 0, hands: 0.45 + g * 0.45, reach: reach};
    var guess = o.pen && rand() < prof.guess * (o.pause ? 0.45 : 1);
    if (guess) {
      /* adivina antes: lado preferido, lo que repites y la orientación del cuerpo */
      var mem = o.mem || {L: 0, R: 0, C: 0}, tot = mem.L + mem.R + mem.C + 2, adapt = prof.adapt;
      var pL = 0.5 + (prof.side ? -prof.side * 0.18 : 0) + adapt * ((mem.L - mem.R) / tot) * 0.6 + (o.tell || 0) * 0.15;
      var side = rand() < cl(pL, 0.1, 0.9) ? 1 : -1, hy = rand() < 0.65 ? lerp(0.3, 1.0, rand()) : lerp(1.2, 2.0, rand());
      if (rand() < 0.08 + prof.guess * 0.04) side = 0;
      plan.t0 = -prof.early - rand() * 0.05; plan.dur = 0.42; plan.tz = side * lerp(1.6, 3.0, rand()); plan.ty = side === 0 ? (rand() < 0.5 ? 1.2 : 2.0) : hy;
    } else {
      /* espera: reacciona al vuelo con su tiempo de reacción (más tarde si la barrera le tapa) */
      var react = B.gkReactBase - B.gkReactSkill * refl + (o.blind ? B.blindLag : 0) + rand() * 0.05;
      var nz = gauss(rand) * 0.35 * (1.2 - refl), ny = gauss(rand) * 0.25 * (1.2 - refl);
      plan.t0 = react; plan.tz = cross.z + nz; plan.ty = cl(cross.y + ny, 0.2, 2.3);
      var dd = Math.hypot(plan.tz - plan.z, plan.ty - 1.0); plan.dur = cl(dd / B.gkDiveSpeed + 0.16, 0.26, 0.65);
    }
    return plan;
  }
  function planDir(plan) { var dz = plan.tz - plan.z; return dz > 0.4 ? -1 : dz < -0.4 ? 1 : 0; }

  /* ---------- barrera ---------- */
  function buildWall(ball, n, side, o, rand) {
    /* línea del balón al centro de la portería; barrera a 9,15 m, cubriendo el palo cercano */
    var gx = 0, gz = 0, dx = gx - ball.x, dz = gz - ball.z, L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, px = -uz, pz = ux;
    var wx = ball.x + ux * 9.15, wz = ball.z + uz * 9.15;
    var near = ball.z > 0.5 ? 1 : ball.z < -0.5 ? -1 : (side || 1);
    /* desplazamiento hacia el palo cercano */
    var sh = (o && o.shift != null ? o.shift : near * 0.35 * Math.min(1, Math.abs(ball.z) / 6 + 0.4));
    var out = [];
    for (var i = 0; i < n; i++) {
      var off = (i - (n - 1) / 2) * 0.52 + sh;
      var w = {x: wx + px * off, z: wz + pz * off, dx: -ux, dz: -uz, h: 1.82 + rand() * 0.1, i: i};
      var jt = (o && o.jumpAt != null ? o.jumpAt : 0.28) + rand() * B.wallTimingVar, jh = (o && o.noJump) ? 0 : B.wallJump * (0.8 + rand() * 0.4);
      (function (jt, jh) { w.jump = function (tt) { var k = (tt - jt) / 0.6; return k <= 0 || k >= 1 ? 0 : Math.sin(k * PI) * jh; }; })(jt, jh);
      w.jt = jt; w.jh = jh; out.push(w);
    }
    if (o && o.lie) out.push({x: wx - ux * 0.9, z: wz - uz * 0.9 + sh * pz, dx: -ux, dz: -uz, h: 0.32, lie: true, jump: function () { return 0; }, w: 1.6});
    return out;
  }

  /* el lanzador rival elige hueco: evalúa candidatos contra la barrera y la posición del portero */
  function takerChoose(spec, ball, wall, org, opt, rand) {
    var best = null, bs = -1e9, sk = opt.skill || 72, type = spec.shot;
    for (var zi = -4; zi <= 4; zi++) for (var yi = 0; yi < 3; yi++) {
      var z = zi * 0.7, y = 0.3 + yi * 0.85; if (Math.abs(z) > HW - 0.3) continue;
      var under = yi === 0 && org.jump === "jump";
      var tp = under ? "placed" : type;
      var sp = D.shots[tp], spin = [0, tp === "curl" ? -Math.sign(ball.z - z || 1) * sp.spin * 0.8 : 0, tp === "dip" ? sp.spin : 0];
      var b0 = SpPhys.solve({x: ball.x, z: ball.z, kn: 0.3}, y, z, (sp.v[0] + sp.v[1]) / 2, spin, {});
      var r = SpPhys.sim(b0, {wall: wall}, {tmax: 1.6}).res;
      var open = r.how === "goal" ? 1 : 0;
      var far = Math.abs(z - org.gz) / 3.5, corner = (Math.abs(z) > 2.4 ? 0.4 : 0) + (y > 1.6 ? 0.3 : 0);
      var pref = (spec.far * far) + (under ? spec.under * 2 : 0) + (Math.sign(z) === Math.sign(ball.z) ? (1 - spec.far) * 0.5 : 0);
      var sc = open * 3 + far + corner + pref + (rand() - 0.5) * 0.8;
      if (sc > bs) { bs = sc; best = {z: z, y: y, type: tp, spin: spin, v: (sp.v[0] + sp.v[1]) / 2}; }
    }
    /* error del lanzador rival */
    var sig = 1.0 * (1.4 - sN(sk)) * (1 + (opt.press || 0) * 0.3) * Math.max(1, Math.hypot(ball.x, ball.z) / 18);
    var z2 = best.z + gauss(rand) * sig, y2 = cl(best.y + gauss(rand) * sig * 0.7, R, 3.4);
    best.b0 = SpPhys.solve({x: ball.x, z: ball.z, kn: rand()}, y2, z2, best.v * (1 + gauss(rand) * 0.03), best.spin, {});
    return best;
  }
  return {gauss: gauss, sN: sN, applyError: applyError, aiKeeper: aiKeeper, planDir: planDir, buildWall: buildWall, takerChoose: takerChoose};
})();
if (typeof module !== "undefined") module.exports = SpAI;
