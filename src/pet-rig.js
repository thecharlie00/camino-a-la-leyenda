/* pet-rig.js — la mascota viva en 3D (5.6): piezas rígidas con pivotes, poses y clips de animación,
   física secundaria con muelles (orejas, cola, bufandas, capas), mirada, parpadeo, expresiones,
   suciedad y accesorios, y detección de toques por zonas. Se dibuja con VoxCore.Engine. */
var PetRig = (function () {
  "use strict";
  if (typeof VoxCore === "undefined" || !VoxCore || typeof PetModels === "undefined") return null;
  var MX = VoxCore.MX, VS = PetStyle.VOXEL, PI = Math.PI, T = MX.T, mul = MX.mul;
  function cl(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function ang(a) { while (a > PI) a -= 2 * PI; while (a < -PI) a += 2 * PI; return a; }
  function rot(rx, ry, rz) { var m = MX.m4(); if (ry) m = mul(m, MX.RY(ry)); if (rx) m = mul(m, MX.RX(rx)); if (rz) m = mul(m, MX.RZ(rz)); return m; }
  function Spring(k, d) { this.v = 0; this.x = 0; this.k = k || 60; this.d = d || 8; }
  Spring.prototype.step = function (target, dt) { var a = (target - this.x) * this.k - this.v * this.d; this.v += a * dt; this.x += this.v * dt; return this.x; };
  var WET = {m: [0.72, 0, 0, 0, 0.72, 0, 0, 0, 0.78], o: [0, 0.01, 0.03]};
  var SMALL = {hamster: 1, hedgehog: 1, rabbit: 1, cat: 1, fennec: 1, tarantula: 1, macaw: 1, iguana: 1, turtle: 1, python: 1};

  function Actor(o) {
    this.o = o || {};
    this.x = 0; this.z = 0; this.y = 0; this.yaw = 0; this.vy = 0; this.spd = 0; this.tx = null; this.tz = null; this.goal = null;
    this.expr = "content"; this.exprT = 0; this.baseExpr = "content"; this.blinkT = 2; this.look = null; this.hy = 0; this.hp = 0;
    this.clip = null; this.clipT = 0; this.clipW = 0; this.walkPh = 0; this.t = 0; this.held = false; this.dirt = 0; this.wet = 0; this.mouth = null;
    this.sp = {}; this.P = {r: {}, root: {y: 0, rx: 0, ry: 0, rz: 0, s: 1, sy: 1, ox: 0, oz: 0, pivY: 0, pivZ: 0}};
    this.W = {}; this.Wacc = []; this.ax = 0; this.az = 0; this.lx = 0; this.lz = 0;
    this.build();
  }
  Actor.prototype.build = function () {
    var o = this.o, M = PetModels.build({k: o.k, stage: o.stage || 0, col: o.col, ico: o.ico});
    this.M = M; this.plan = M.plan; this.rel = {};
    var self = this;
    M.order.forEach(function (n) { var P = M.parts[n], par = P.parent ? M.parts[P.parent] : null; self.rel[n] = par ? [(P.piv[0] - par.piv[0]) * VS, (P.piv[1] - par.piv[1]) * VS, (P.piv[2] - par.piv[2]) * VS] : [P.piv[0] * VS, P.piv[1] * VS, P.piv[2] * VS]; });
    this.small = !!SMALL[o.k] || (o.stage || 0) < 1;
    this.hipZ = (M.dims.bz0 != null ? M.dims.bz0 : -4) * VS; this.midY = (M.dims.by0 != null ? (M.dims.by0 + M.dims.by1) / 2 : M.height / VS / 2) * VS;
    this.setAcc(o.eq || {});
  };
  /* accesorios: piezas hijas de las partes; las cadenas colgantes llevan muelle */
  Actor.prototype.setAcc = function (eq) {
    this.o.eq = eq; this.acc = []; this.toy = null;
    var T2 = this.o.T || PetStyle.teamColors(), M = this.M, self = this;
    Object.keys(eq).forEach(function (s) {
      var id = eq[s]; if (!id) return; var it = petItem(id); if (!it) return;
      if (s === "t") { if (it.model) self.toy = PetProps.prop(it.model); return; }
      var ps = PetProps.acc(it, M, T2), base = self.acc.length;
      ps.forEach(function (p, i) {
        var q = {verts: p.verts, parent: p.parent, glow: p.glow, dangle: p.dangle, cape: p.cape, wing: p.wing};
        if (p.chainParent != null) q.chainParent = base + p.chainParent;
        if (p.dangle || p.wing) {
          q.piv = p.pivAbs || p.piv;
          var parPiv = q.chainParent != null ? self.acc[q.chainParent].piv : M.parts[p.parent].piv;
          q.rel = [(q.piv[0] - parPiv[0]) * VS, (q.piv[1] - parPiv[1]) * VS, (q.piv[2] - parPiv[2]) * VS];
          q.spr = new Spring(p.cape ? 30 : 45, p.cape ? 5 : 6); q.spz = new Spring(40, 6);
        }
        self.acc.push(q);
      });
    });
  };
  Actor.prototype.say = function (expr, dur) { this.expr = expr; this.exprT = dur || 1.2; };
  Actor.prototype.play = function (name, o) {
    var C = CLIPS[name]; if (!C) return false;
    this.clip = {n: name, f: C, d: (C.d || 1) * ((o && o.speed) ? 1 / o.speed : 1), o: o || {}, done: o && o.done};
    this.clipT = 0; return true;
  };
  Actor.prototype.busy = function () { return !!this.clip; };
  Actor.prototype.moveTo = function (x, z, run, done) { this.goal = {x: x, z: z, run: !!run, done: done}; };
  Actor.prototype.lookAt = function (p, w) { this.look = p; this.lookW = w == null ? 1 : w; };

  /* ---------- poses por plan ---------- */
  function legs(a, P, ph, amp, lift) {
    var s = Math.sin(ph), c = Math.cos(ph);
    if (a.plan === "spider") {
      for (var i = 0; i < 8; i++) { var side = i < 4 ? -1 : 1, q = Math.sin(ph + i * 1.3 + (side > 0 ? PI : 0)); P.r["leg" + i + "1"] = [0, q * amp * 0.6, side * (0.15 + Math.max(0, q) * lift)]; }
      return;
    }
    if (a.plan === "snake" || a.plan === "fish") return;
    P.r.legFL1 = [-s * amp, 0, 0]; P.r.legBR1 = [-s * amp, 0, 0]; P.r.legFR1 = [s * amp, 0, 0]; P.r.legBL1 = [s * amp, 0, 0];
    P.r.legFL2 = [Math.max(0, c) * lift, 0, 0]; P.r.legBR2 = [Math.max(0, c) * lift, 0, 0]; P.r.legFR2 = [Math.max(0, -c) * lift, 0, 0]; P.r.legBL2 = [Math.max(0, -c) * lift, 0, 0];
    if (a.plan === "bird") { P.r.legFL1 = [-s * amp * 0.8, 0, 0]; P.r.legFR1 = [s * amp * 0.8, 0, 0]; }
  }
  function sit(a, P, k) {
    if (a.plan === "bird" || a.plan === "snake" || a.plan === "fish" || a.plan === "spider") { P.root.y -= 0.01 * k; return; }
    var R = P.root; R.pivZ = a.hipZ; R.pivY = a.M.legH * VS; R.rx -= 0.5 * k; R.y -= a.M.legH * VS * 0.45 * k;
    add(P, "legFL1", 0.5 * k); add(P, "legFR1", 0.5 * k); add(P, "legBL1", -1.0 * k); add(P, "legBR1", -1.0 * k); add(P, "legBL2", 1.5 * k); add(P, "legBR2", 1.5 * k);
    add(P, "head", 0.35 * k); add(P, "tail1", 0.6 * k);
  }
  function lie(a, P, k) {
    if (a.plan === "bird") { P.root.y -= a.M.legH * VS * 0.7 * k; return; }
    if (a.plan === "snake" || a.plan === "fish") return;
    if (a.plan === "spider") { P.root.y -= a.M.legH * VS * 0.5 * k; return; }
    P.root.y -= a.M.legH * VS * 0.82 * k;
    add(P, "legFL1", -1.45 * k); add(P, "legFR1", -1.45 * k); add(P, "legBL1", 1.35 * k); add(P, "legBR1", 1.35 * k);
  }
  function add(P, n, rx, ry, rz) { var r = P.r[n] || (P.r[n] = [0, 0, 0]); r[0] += rx || 0; r[1] += ry || 0; r[2] += rz || 0; }
  function wag(a, P, f, amp) {
    var t = a.t, tl = a.M.tail || [];
    tl.forEach(function (n, i) { add(P, n, a.plan === "fish" ? 0 : -0.1, Math.sin(t * f - i * 0.6) * amp * (1 + i * 0.25), 0); });
  }
  /* clips: f(a, P, k (0..1 del clip), t (s), dt) */
  function hop(k, n) { return Math.abs(Math.sin(k * PI * n)); }
  var CLIPS = {
    sit: {d: 1.6, f: function (a, P, k) { sit(a, P, env(k, 0.18, 0.2)); }},
    sitHold: {d: 1e9, f: function (a, P) { sit(a, P, 1); }},
    lie: {d: 2, f: function (a, P, k) { lie(a, P, env(k, 0.2, 0.2)); }},
    paw: {d: 1.8, f: function (a, P, k) { var e = env(k, 0.15, 0.2); sit(a, P, e); add(P, "legFR1", -1.5 * e * (0.8 + 0.2 * Math.sin(k * 30))); add(P, "head", 0, -0.2 * e, 0); if (a.plan === "bird") add(P, "wingR1", 0, 0, -1.2 * e); }},
    spin: {d: 1.1, f: function (a, P, k) { P.root.ry += k * 2 * PI; legs(a, P, k * 20, 0.6, 0.6); P.root.y += hop(k, 1) * 0.02; }},
    jump: {d: 0.9, f: function (a, P, k) { var h = Math.sin(cl(k * 1.15, 0, 1) * PI); P.root.y += h * Math.max(0.12, a.M.height * 0.9); P.root.rx -= Math.cos(k * PI) * 0.3; var sq = k < 0.12 ? 1 - k * 2 : k > 0.88 ? 1 - (1 - k) * 2 : 1; P.root.sy *= sq; legs(a, P, 0, 0, 0); add(P, "legFL1", -0.8 * h); add(P, "legFR1", -0.8 * h); add(P, "legBL1", 0.8 * h); add(P, "legBR1", 0.8 * h); }},
    roll: {d: 1.6, f: function (a, P, k) { var e = env(k, 0.15, 0.15); lie(a, P, e); P.root.pivY = a.midY; P.root.rz += cl((k - 0.15) / 0.7, 0, 1) * 2 * PI; }},
    dead: {d: 2.6, f: function (a, P, k) { var e = env(k, 0.15, 0.12); P.root.pivY = a.midY * 0.6; P.root.rz += e * PI / 2; P.root.y -= e * a.M.legH * VS * 0.5; ["legFL1", "legFR1", "legBL1", "legBR1"].forEach(function (n) { add(P, n, 0, 0, 0); }); }},
    belly: {d: 1e9, f: function (a, P) { P.root.pivY = a.midY; P.root.rz += PI * 0.92; P.root.y += a.M.dims.W ? 0 : 0; ["legFL1", "legFR1", "legBL1", "legBR1"].forEach(function (n, i) { add(P, n, Math.sin(a.t * 6 + i) * 0.4, 0, 0); }); }},
    eat: {d: 1e9, f: function (a, P) { add(P, "head", 0.75 + Math.sin(a.t * 14) * 0.08); add(P, "jaw", Math.max(0, Math.sin(a.t * 14)) * 0.3); }},
    drink: {d: 1e9, f: function (a, P) { add(P, "head", 0.8); add(P, "jaw", Math.max(0, Math.sin(a.t * 18)) * 0.2); }},
    sleep: {d: 1e9, f: function (a, P) { lie(a, P, 1); add(P, "head", 0.45); P.root.sy *= 1 + Math.sin(a.t * 1.6) * 0.015; }},
    shake: {d: 1.1, f: function (a, P, k) { P.root.pivY = a.midY; P.root.rz += Math.sin(k * 60) * 0.35 * (1 - k); add(P, "head", 0, Math.sin(k * 60 + 1) * 0.4 * (1 - k)); }},
    happy: {d: 1.0, f: function (a, P, k) { P.root.y += hop(k, 3) * 0.035; wag(a, P, 22, 0.7); add(P, "head", -0.15); }},
    sad: {d: 1.6, f: function (a, P, k) { var e = env(k, 0.2, 0.3); add(P, "head", 0.4 * e); add(P, "tail1", 0.6 * e); ["earL1", "earR1"].forEach(function (n) { add(P, n, 0, 0, (n === "earL1" ? 0.5 : -0.5) * e); }); }},
    nuzzle: {d: 1.2, f: function (a, P, k) { add(P, "head", 0.1, Math.sin(k * 12) * 0.3, Math.sin(k * 12) * 0.2); wag(a, P, 18, 0.6); }},
    stretch: {d: 1.8, f: function (a, P, k) { var e = env(k, 0.3, 0.3); P.root.pivZ = a.hipZ; P.root.rx += 0.3 * e; add(P, "legFL1", -0.9 * e); add(P, "legFR1", -0.9 * e); add(P, "head", -0.2 * e); }},
    sniff: {d: 1.6, f: function (a, P, k) { add(P, "head", 0.55 + Math.sin(k * 40) * 0.05, Math.sin(k * 6) * 0.4); }},
    scratch: {d: 1.4, f: function (a, P, k) { sit(a, P, env(k, 0.15, 0.15)); add(P, "legBR1", -1.6 - Math.sin(k * 50) * 0.3); add(P, "head", 0, 0.3, 0.3); }},
    yawn: {d: 1.4, f: function (a, P, k) { var e = Math.sin(k * PI); add(P, "head", -0.4 * e); add(P, "jaw", 0.6 * e); }},
    beg: {d: 1.8, f: function (a, P, k) { var e = env(k, 0.2, 0.2); sit(a, P, e); P.root.rx -= 0.5 * e; add(P, "legFL1", -1.2 * e); add(P, "legFR1", -1.2 * e); add(P, "legFL2", 1 * e); add(P, "legFR2", 1 * e); }},
    dizzy: {d: 1.6, f: function (a, P, k) { P.root.pivY = a.midY; P.root.rz += Math.sin(k * 12) * 0.2 * (1 - k); P.root.ry += Math.sin(k * 7) * 0.3; }},
    fall: {d: 1.3, f: function (a, P, k) { var e = k < 0.3 ? k / 0.3 : 1 - Math.max(0, k - 0.7) / 0.3; P.root.pivY = a.midY; P.root.rz += e * 1.1; P.root.y -= e * 0.02; }},
    distract: {d: 1.6, f: function (a, P, k) { var e = env(k, 0.2, 0.2); P.root.ry += e * 1.2; add(P, "head", 0.2 * e, 0.6 * e); }},
    halfsit: {d: 1.3, f: function (a, P, k) { sit(a, P, Math.sin(k * PI) * 0.45); }},
    /* futbol */
    nose: {d: 2.4, ball: 1, f: function (a, P, k) { sit(a, P, env(k, 0.12, 0.12)); add(P, "head", -0.4 - hop(k, 6) * 0.25); }},
    header: {d: 1.3, ball: 1, f: function (a, P, k) { CLIPS.jump.f(a, P, k); add(P, "head", k > 0.4 && k < 0.6 ? 0.6 : -0.3); }},
    pass: {d: 1.2, ball: 1, f: function (a, P, k) { var e = k > 0.35 && k < 0.6 ? Math.sin((k - 0.35) / 0.25 * PI) : 0; add(P, "legFR1", -1.4 * e); P.root.rx -= 0.08 * e; }},
    dribble: {d: 3.0, ball: 1, f: function (a, P, k) { P.root.ry += k * 2 * PI; legs(a, P, k * 45, 0.7, 0.8); P.root.y += hop(k, 14) * 0.012; }},
    juggle: {d: 3.2, ball: 1, f: function (a, P, k) { sit(a, P, env(k, 0.1, 0.1) * 0.6); var j = (k * 8) % 1; add(P, "head", -0.3 - (j < 0.3 ? Math.sin(j / 0.3 * PI) * 0.4 : 0)); }},
    control: {d: 1.6, ball: 1, f: function (a, P, k) { var e = k > 0.3 && k < 0.6 ? Math.sin((k - 0.3) / 0.3 * PI) : 0; add(P, "legFL1", -0.9 * e); add(P, "legFL2", 0.6 * e); add(P, "head", 0.3); }},
    save: {d: 1.6, ball: 1, f: function (a, P, k) { var e = k < 0.25 ? k / 0.25 : k < 0.75 ? 1 : 1 - (k - 0.75) / 0.25; P.root.pivY = a.midY; P.root.rz -= e * 1.3; P.root.ox += e * 0.12; P.root.y += Math.sin(cl(k / 0.5, 0, 1) * PI) * 0.06; add(P, "legFL1", -1.4 * e); add(P, "legFR1", -1.4 * e); }},
    kneeslide: {d: 1.8, f: function (a, P, k) { var e = env(k, 0.15, 0.2); P.root.pivZ = a.hipZ; P.root.rx += 0.25 * e; P.root.oz += Math.sin(cl(k / 0.7, 0, 1) * PI / 2) * 0.35; add(P, "legFL1", -1.3 * e); add(P, "legFR1", -1.3 * e); add(P, "head", -0.5 * e); wag(a, P, 25, 0.8); }},
    flip: {d: 1.2, f: function (a, P, k) { var h = Math.sin(k * PI); P.root.y += h * Math.max(0.16, a.M.height * 1.1); P.root.pivY = a.midY; P.root.rx -= k * 2 * PI; }},
    dive: {d: 1.6, f: function (a, P, k) { var e = env(k, 0.2, 0.2); lie(a, P, e); P.root.oz += Math.sin(cl(k / 0.6, 0, 1) * PI / 2) * 0.25; P.root.rx += e * 0.15; add(P, "head", -0.4 * e); }},
    combo: {d: 3.2, f: function (a, P, k) { if (k < 0.33) CLIPS.spin.f(a, P, k / 0.33); else if (k < 0.62) CLIPS.jump.f(a, P, (k - 0.33) / 0.29); else CLIPS.roll.f(a, P, (k - 0.62) / 0.38); }},
    mycel: {d: 2.6, f: function (a, P, k) { var e = env(k, 0.15, 0.15); CLIPS.beg.f(a, P, cl(k * 1.2, 0, 1)); P.root.ry += Math.sin(k * PI * 2) * 0.5 * e; add(P, "head", -0.3 * e); }},
    swim: {d: 1e9, f: function () {}},
    lifted: {d: 1e9, f: function (a, P) { ["legFL1", "legFR1", "legBL1", "legBR1"].forEach(function (n, i) { add(P, n, Math.sin(a.t * 9 + i * 1.7) * 0.5); }); wag(a, P, 14, 0.4); }}
  };
  function env(k, a, b) { return k < a ? k / a : k > 1 - b ? (1 - k) / b : 1; }
  CLIPS.sit.d = 1.6;
  Object.keys(CLIPS).forEach(function (n) { if (CLIPS[n].d == null) CLIPS[n].d = 1; });

  /* ---------- un paso de simulación ---------- */
  Actor.prototype.update = function (dt, world) {
    var a = this, P = this.P, R = P.root, M = this.M;
    this.t += dt;
    for (var n in P.r) { var r = P.r[n]; r[0] = r[1] = r[2] = 0; }
    R.y = 0; R.rx = 0; R.ry = 0; R.rz = 0; R.s = 1; R.sy = 1; R.ox = 0; R.oz = 0; R.pivY = this.midY; R.pivZ = 0;
    /* locomoción hacia el objetivo */
    var px = this.x, pz = this.z;
    if (this.goal && !this.held) {
      var g = this.goal, dx = g.x - this.x, dz = g.z - this.z, d = Math.hypot(dx, dz), sp = (g.run ? 1.1 : 0.42) * Math.max(0.5, M.length * 2.4) * (this.plan === "snake" ? 0.6 : 1) * (this.o.k === "turtle" ? 0.35 : 1);
      if (d < 0.03) { this.goal = null; this.spd = 0; if (g.done) g.done(); }
      else {
        var want = Math.atan2(dx, dz), da = ang(want - this.yaw);
        this.yaw += cl(da, -dt * 7, dt * 7);
        var s = Math.min(sp, d * 4) * (Math.abs(da) > 1.2 ? 0.3 : 1);
        this.spd = lerp(this.spd, s, Math.min(1, dt * 6));
        this.x += Math.sin(this.yaw) * this.spd * dt; this.z += Math.cos(this.yaw) * this.spd * dt;
      }
    } else this.spd = lerp(this.spd, 0, Math.min(1, dt * 8));
    if (world && world.bounds) { var B = world.bounds; this.x = cl(this.x, B[0], B[2]); this.z = cl(this.z, B[1], B[3]); }
    var vx = (this.x - px) / Math.max(dt, 1e-4), vz = (this.z - pz) / Math.max(dt, 1e-4);
    this.ax = lerp(this.ax, (vx - this.lx) / Math.max(dt, 1e-4), 0.2); this.az = lerp(this.az, (vz - this.lz) / Math.max(dt, 1e-4), 0.2); this.lx = vx; this.lz = vz;
    /* gravedad (saltos al soltarla) */
    if (!this.held && !this.float && this.y > 0) { this.vy -= 9.8 * dt; this.y += this.vy * dt; if (this.y <= 0) { this.y = 0; if (this.vy < -1.2) { this.say("dizzy", 0.8); if (world && world.onLand) world.onLand(this, -this.vy); } this.vy = 0; } }
    /* andar */
    var run = this.spd > 0.5;
    if (this.spd > 0.02) {
      this.walkPh += dt * this.spd * (run ? 22 : 30) / Math.max(0.6, M.legH * VS * 20);
      legs(this, P, this.walkPh, run ? 0.75 : 0.5, run ? 0.9 : 0.6);
      R.y += Math.abs(Math.sin(this.walkPh)) * (run ? 0.012 : 0.005);
      if (this.plan === "snake") { M.order.forEach(function (nm, i) { if (nm.indexOf("seg") === 0) add(P, nm, 0, Math.sin(a.walkPh * 0.6 - i * 0.9) * 0.35, 0); }); }
      if (this.plan === "bird") { add(P, "body", 0, 0, Math.sin(this.walkPh) * 0.08); }
      if (world && world.onStep && Math.floor(this.walkPh / PI) !== this.stepN) { this.stepN = Math.floor(this.walkPh / PI); world.onStep(this); }
    }
    /* respiración y cola en reposo */
    R.sy *= 1 + Math.sin(this.t * (this.clip && this.clip.n === "sleep" ? 1.6 : 3)) * 0.012;
    var mood = this.mood == null ? 70 : this.mood;
    wag(this, P, 6 + mood / 10, 0.12 + mood / 300);
    if (this.plan === "snake" && this.spd < 0.02) M.order.forEach(function (nm, i) { if (nm.indexOf("seg") === 0) add(P, nm, 0, Math.sin(a.t * 1.2 - i * 0.7) * 0.12, 0); });
    if (this.plan === "fish") { add(P, "tail1", 0, Math.sin(this.t * 7) * 0.5, 0); add(P, "tail2", 0, Math.sin(this.t * 7 - 0.8) * 0.6, 0); add(P, "finL", 0, 0, Math.sin(this.t * 9) * 0.5); add(P, "finR", 0, 0, -Math.sin(this.t * 9) * 0.5); R.y += Math.sin(this.t * 1.7) * 0.01; }
    if (this.plan === "bird" && (this.held || this.y > 0.02)) { var fl = Math.sin(this.t * 26) * 0.9; add(P, "wingL1", 0, 0, -0.4 - fl); add(P, "wingR1", 0, 0, 0.4 + fl); }
    /* clip */
    if (this.clip) {
      var c = this.clip; this.clipT += dt;
      var k = cl(this.clipT / c.d, 0, 1);
      c.f.f(this, P, k, this.clipT, dt);
      if (this.clipT >= c.d) { this.clip = null; if (c.done) c.done(); }
    }
    if (this.held) CLIPS.lifted.f(this, P, 0);
    /* mirada: la cabeza sigue un punto (cámara o dedo) dentro de un margen */
    var wy = 0, wp = 0;
    if (this.look && M.parts.head && !(this.clip && /sleep|roll|dead|flip|belly/.test(this.clip.n))) {
      var lp = this.look, hx = this.x, hz = this.z, dxl = lp[0] - hx, dzl = lp[2] - hz, dl = Math.hypot(dxl, dzl);
      wy = cl(ang(Math.atan2(dxl, dzl) - this.yaw), -0.9, 0.9) * this.lookW;
      wp = cl(-Math.atan2(lp[1] - M.height * 0.9, Math.max(0.1, dl)) * 0.6, -0.5, 0.4) * this.lookW;
    }
    this.hy = lerp(this.hy, wy, Math.min(1, dt * 6)); this.hp = lerp(this.hp, wp, Math.min(1, dt * 6));
    if (M.parts.head) add(P, "head", this.hp, this.hy, 0);
    /* orejas y cola con muelle: reaccionan a la aceleración */
    var accF = cl((this.ax * Math.sin(this.yaw) + this.az * Math.cos(this.yaw)) * 0.03, -0.6, 0.6), accY = this.held ? Math.sin(this.t * 8) * 0.3 : 0;
    ["earL1", "earR1", "earL2", "earR2"].forEach(function (n) {
      if (!M.parts[n]) return; var s = a.sp[n] || (a.sp[n] = new Spring(70, 7));
      var v = s.step(accF + accY + (a.vy > 0.5 ? -0.4 : 0), dt); add(P, n, v * (n.charAt(4) === "2" ? 1.5 : 1));
    });
    /* expresión */
    this.exprT -= dt; this.blinkT -= dt;
    if (this.blinkT < 0) this.blinkT = 2.5 + Math.random() * 3;
    if (this.landed) this.landed = 0;
  };
  Actor.prototype.curExpr = function () {
    if (this.exprT > 0) return this.expr;
    if (this.clip && this.clip.n === "sleep") return "sleep";
    if (this.blinkT < 0.13 && this.baseExpr !== "sleep") return "blink";
    return this.baseExpr;
  };
  /* matrices del mundo y volcado al buffer dinámico */
  Actor.prototype.matrices = function () {
    var P = this.P, R = P.root, M = this.M, W = this.W, self = this;
    var root = mul(T(this.x + Math.sin(this.yaw) * R.oz + Math.cos(this.yaw) * R.ox, this.y + R.y, this.z + Math.cos(this.yaw) * R.oz - Math.sin(this.yaw) * R.ox), MX.RY(this.yaw + R.ry));
    var sc = (this.o.scale || 1) * R.s;
    root = mul(root, MX.S(sc, sc * R.sy, sc));
    if (R.rx || R.rz) root = mul(root, MX.about([0, R.pivY, R.pivZ], mul(MX.RX(R.rx), MX.RZ(R.rz))));
    this.root = root;
    M.order.forEach(function (n) {
      var Pp = M.parts[n], rl = self.rel[n], r = P.r[n], m = mul(Pp.parent ? W[Pp.parent] : root, T(rl[0], rl[1], rl[2]));
      if (r && (r[0] || r[1] || r[2])) m = mul(m, rot(r[0], r[1], r[2]));
      W[n] = m;
    });
    /* accesorios colgantes: el muelle sigue el balanceo */
    var spd = this.spd;
    this.acc.forEach(function (q, i) {
      if (!q.rel) { q.W = W[q.parent]; return; }
      var base = q.chainParent != null ? self.acc[q.chainParent].W : W[q.parent];
      var tgt = q.cape ? 0.15 + spd * 1.6 : q.wing ? Math.sin(self.t * (self.y > 0.02 ? 22 : 3)) * (self.y > 0.02 ? 0.8 : 0.08) : spd * 0.9;
      var v = q.spr.step(tgt + (self.held ? Math.sin(self.t * 7) * 0.2 : 0), Math.min(0.05, self.dtLast || 0.016));
      var m = mul(base, T(q.rel[0], q.rel[1], q.rel[2]));
      q.W = q.wing ? mul(m, MX.RZ(q.wing * (0.3 + v))) : mul(m, MX.RX(q.cape ? -v : v));
    });
  };
  Actor.prototype.draw = function (E, o) {
    o = o || {};
    this.dtLast = o.dt;
    this.matrices();
    var M = this.M, W = this.W, tint = this.wet > 0.05 ? WET : null, self = this;
    M.order.forEach(function (n) { E.bake(M.mesh[n], W[n], tint); });
    var fm = M.faceMesh(this.curExpr()); if (fm) E.bake(fm, W[M.facePart], tint);
    if (this.dirt > 0) M.order.forEach(function (n) { if (n === "body" || n === "head" || /leg.*2|seg/.test(n)) { var dm = M.dirtMesh(n, self.dirt); if (dm) E.bake(dm, W[n]); } });
    this.acc.forEach(function (q) { E.bake(q.verts, q.W, tint); });
    if (this.mouth) { var hp = M.parts.jaw ? "jaw" : M.facePart; E.bake(this.mouth.verts, mul(W[hp], T(0, -0.02, 0.05))); }
  };
  /* posición de un ancla en el mundo (para partículas, bocadillos y objetos) */
  Actor.prototype.anchor = function (name) {
    var a = this.M.anchors[name]; if (!a || !this.W[a.part]) return [this.x, this.M.height, this.z];
    var piv = this.M.parts[a.part].piv;
    return MX.tp(this.W[a.part], (a.p[0] - piv[0]) * VS, (a.p[1] - piv[1]) * VS, (a.p[2] - piv[2]) * VS);
  };
  /* toque: devuelve la parte y una zona (cabeza, barbilla, orejas, lomo, barriga, mejilla) */
  Actor.prototype.hit = function (E, R) {
    var best = -1, bn = null, M = this.M, W = this.W;
    M.order.forEach(function (n) { if (!W[n]) return; var d = E.hitBox(R, W[n], M.bb[n]); if (d >= 0 && (best < 0 || d < best)) { best = d; bn = n; } });
    if (!bn) return null;
    var p = [R.o[0] + R.d[0] * best, R.o[1] + R.d[1] * best, R.o[2] + R.d[2] * best];
    var inv = MX.invRigid(W[bn]), lp = MX.tp(inv, p[0], p[1], p[2]), bb = M.bb[bn], fy = (lp[1] - bb[1]) / Math.max(1e-4, bb[4] - bb[1]), fx = Math.abs(lp[0]) / Math.max(1e-4, (bb[3] - bb[0]) / 2);
    var zone = "back";
    if (/^ear/.test(bn)) zone = "ears";
    else if (bn === "jaw") zone = "chin";
    else if (bn === "head") zone = fy < 0.35 ? "chin" : fx > 0.7 ? "cheek" : "head";
    else if (bn === "body" || /^seg/.test(bn)) zone = (this.clip && this.clip.n === "belly") || fy < 0.3 ? "belly" : "back";
    else if (/^tail/.test(bn)) zone = "back";
    else if (/^leg|^wing|^fin/.test(bn)) zone = "back";
    return {part: bn, zone: zone, p: p, d: best};
  };
  return {Actor: Actor, CLIPS: CLIPS, Spring: Spring};
})();
