/* rig.js — el jugador y la mascota cobran vida (5.6).
   Animación procedural sobre el mismo pixel art (sin sprites nuevos):
   - Poses compartidas por la vista 2D y la 3D: ángulos de brazos, piernas y cabeza, desplazamiento,
     giro y squash & stretch del cuerpo. Las celebraciones del jugador son poses con fotogramas clave.
   - Rig2D: aplica la pose a los grupos <g> del avatar SVG (cabeza, torso, brazos, piernas, ojos).
   - Idle con vida: respiración, parpadeo aleatorio, cambios de peso y gestos sueltos con intervalos al azar.
   - Estados diegéticos según moral, forma física y lesión; reacción cuando la moral sube o baja de golpe.
   - Mascota: squash & stretch exagerado, parpadeo, estados (contenta, triste, aburrida, dormida),
     trucos aprendidos en su idle, cosquillas al tocarla y accesorios con follow-through.
   Todo va por delta time con Anim.loop; con animaciones reducidas se queda casi quieto. */
var Rig = (function () {
  "use strict";
  if (typeof Anim === "undefined") return null;
  var E = Anim.ease, rnd = Anim.rnd;
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  var KEYS = ["aL", "aR", "lL", "lR", "hd", "hx", "hy", "bx", "by", "br", "sx", "sy", "yaw", "pitch", "roll", "ball", "bh", "eye", "tor"];
  function zero() { return {aL: 0, aR: 0, lL: 0, lR: 0, hd: 0, hx: 0, hy: 0, bx: 0, by: 0, br: 0, sx: 0, sy: 0, yaw: 0, pitch: 0, roll: 0, ball: 0, bh: 0, eye: 0, tor: 0}; }
  function addTo(a, b, w) { for (var i = 0; i < KEYS.length; i++) { var k = KEYS[i]; if (b[k]) a[k] += b[k] * w; } return a; }

  /* ---------- poses con fotogramas clave ----------
     aL/aR: brazo izquierdo/derecho (grados, + = sentido horario en pantalla; subir el izquierdo es +, el derecho es −)
     lL/lR: piernas · hd: cabeza (grados) · hx/hy: cabeza desplazada (celdas) · bx/by: cuerpo (celdas, − = arriba)
     br: giro del cuerpo en el plano · sx/sy: squash (0 = normal, +0.1 = 10 % más) · yaw/pitch/roll: solo en 3D
     ball: 1 = balón visible, bh: altura del balón (celdas sobre el pie) */
  var A = function (t, o, ez) { o.t = t; o.ez = ez || "inOutQuad"; return o; };
  var CEL = {
    fist: [A(0, {}), A(0.18, {sy: -0.12, sx: 0.08, by: 0.6}), A(0.4, {aR: -168, by: -3, sy: 0.1, sx: -0.06, hd: -6}, "outBack"), A(0.75, {aR: -170, by: 0, hd: -8}), A(1.15, {aR: -175, by: -1.2, hd: -8}), A(1.6, {})],
    plane: [A(0, {}), A(0.25, {aL: 92, aR: -92, br: -8, hx: -0.5}, "outBack"), A(0.7, {aL: 95, aR: -88, br: 8, hx: 0.5, bx: 1}), A(1.15, {aL: 88, aR: -95, br: -8, bx: -1}), A(1.6, {aL: 92, aR: -92, br: 0}), A(1.95, {})],
    lips: [A(0, {}), A(0.3, {aR: -158, hd: 4}, "outBack"), A(1.3, {aR: -160, hd: 6}), A(1.7, {})],
    heart: [A(0, {}), A(0.15, {sy: -0.08, by: 0.4}), A(0.45, {aL: 152, aR: -152, hd: -6, by: -0.5}, "outBack"), A(1.4, {aL: 150, aR: -150, hd: -8}), A(1.8, {})],
    knee: [A(0, {}), A(0.2, {by: -0.5, br: -6}), A(0.55, {by: 5, lL: 70, lR: -70, br: 6, aL: 110, aR: -110, hd: -10, bx: 3}, "outCubic"), A(1.3, {by: 5, lL: 70, lR: -70, br: 10, aL: 120, aR: -120, hd: -14, bx: 3.5}), A(1.75, {})],
    phone: [A(0, {}), A(0.3, {aR: -150, hd: 10, hx: 0.6}, "outBack"), A(1.4, {aR: -152, hd: 12, hx: 0.6, aL: 15}), A(1.8, {})],
    flip: [A(0, {}), A(0.2, {sy: -0.16, sx: 0.1, by: 1}), A(0.75, {by: -9, br: -360, pitch: -360, aL: 40, aR: -40, sy: 0.08}, "inOutQuad"), A(0.95, {sy: -0.14, sx: 0.1, by: 0.6, br: -360, pitch: -360}), A(1.3, {br: -360, pitch: -360})],
    spin: [A(0, {}), A(0.18, {sy: -0.14, sx: 0.1, by: 0.8}), A(0.75, {by: -7, yaw: 360, aL: 60, aR: -60}, "inOutQuad"), A(0.95, {sy: -0.12, sx: 0.08, yaw: 360}), A(1.3, {yaw: 360})],
    statue: [A(0, {}), A(0.35, {aL: -24, aR: 24, hd: -10, hy: -0.4, tor: 0.04}, "outBack"), A(1.7, {aL: -24, aR: 24, hd: -10, hy: -0.4, tor: 0.04}), A(2.0, {})],
    dance: [A(0, {}), A(0.25, {bx: -1, br: -6, aL: 60, aR: -20, lL: 8}), A(0.5, {bx: 1, br: 6, aL: 20, aR: -60, lR: -8}), A(0.75, {bx: -1, br: -6, aL: 60, aR: -20, lL: 8}), A(1.0, {bx: 1, br: 6, aL: 20, aR: -60, lR: -8}), A(1.3, {})],
    roar: [A(0, {}), A(0.25, {aL: 38, aR: -38, hd: -12, hy: -0.6, br: 0, sy: -0.06, sx: 0.06}, "outBack"), A(0.5, {aL: 42, aR: -42, hd: -14, bx: 0.3}), A(0.6, {aL: 38, aR: -38, hd: -12, bx: -0.3}), A(0.7, {aL: 42, aR: -42, hd: -14, bx: 0.3}), A(1.3, {aL: 40, aR: -40, hd: -12}), A(1.6, {})],
    chest: [A(0, {}), A(0.2, {aL: -35, hd: -6}), A(0.35, {aL: 0, aR: 35, tor: -0.03}), A(0.5, {aR: 0, aL: -35, tor: -0.03}), A(0.65, {aL: 0, aR: 35}), A(0.85, {aR: -165, by: -1.5, hd: -8}, "outBack"), A(1.3, {aR: -165}), A(1.6, {})]
  };
  /* gestos del idle y reacciones */
  var GEST = {
    look: function () { var d = Math.random() < 0.5 ? -1 : 1; return [A(0, {}), A(0.35, {hd: 9 * d, hx: 0.5 * d}, "outBack"), A(1.4, {hd: 10 * d, hx: 0.5 * d}), A(1.8, {})]; },
    stretch: function () { return [A(0, {}), A(0.2, {sy: -0.05}), A(0.6, {aL: 165, aR: -165, sy: 0.06, hd: -6, by: -0.4}, "outCubic"), A(1.3, {aL: 170, aR: -170, sy: 0.07, hd: -8, by: -0.5}), A(1.8, {})]; },
    tug: function () { return [A(0, {}), A(0.25, {aL: -30, aR: 30, tor: 0.03, hd: 5}), A(0.45, {aL: -26, aR: 26, tor: -0.02, hd: 3}), A(0.65, {aL: -30, aR: 30, tor: 0.03}), A(1.0, {})]; },
    juggle: function () {
      var k = [A(0, {ball: 1, bh: 0}), A(0.15, {ball: 1, bh: 0, lR: -8})], t = 0.15;
      for (var i = 0; i < 3; i++) { k.push(A(t + 0.12, {ball: 1, bh: 0.5, lR: -28, hd: 6}, "outQuad")); k.push(A(t + 0.42, {ball: 1, bh: 8, lR: 0, hd: 8}, "outQuad")); k.push(A(t + 0.72, {ball: 1, bh: 0.5, lR: -10, hd: 6}, "inQuad")); t += 0.6; }
      k.push(A(t + 0.4, {ball: 1, bh: 0})); k.push(A(t + 0.6, {})); return k;
    },
    boots: function () { return [A(0, {}), A(0.35, {hd: 14, hy: 0.5, lL: 18, br: -3}, "outBack"), A(0.9, {hd: 16, hy: 0.6, lL: 22, br: -3}), A(1.25, {hd: 14, hy: 0.5, lR: -18, lL: 0, br: 3}), A(1.7, {})]; },
    wave: function () { return [A(0, {}), A(0.25, {aR: -150, hd: -4}, "outBack"), A(0.45, {aR: -125}), A(0.65, {aR: -155}), A(0.85, {aR: -125}), A(1.05, {aR: -150}), A(1.4, {})]; },
    jump: function () { return [A(0, {}), A(0.16, {sy: -0.18, sx: 0.12, by: 1, aL: -20, aR: 20}), A(0.42, {by: -6, sy: 0.12, sx: -0.08, aL: 60, aR: -60}, "outQuad"), A(0.66, {by: 0, sy: 0.04}, "inQuad"), A(0.78, {sy: -0.14, sx: 0.1, by: 0.6}), A(1.05, {})]; },
    nod: function () { return [A(0, {}), A(0.2, {hd: 0, hy: 0.5}), A(0.4, {hy: -0.2}), A(0.6, {hy: 0.5}), A(0.85, {})]; },
    brow: function () { return [A(0, {}), A(0.35, {aR: -150, hd: 8, hy: 0.3}, "outBack"), A(0.6, {aR: -140, hx: -0.3}), A(0.85, {aR: -152, hx: 0.3}), A(1.3, {})]; },
    kick: function () { return [A(0, {}), A(0.3, {hd: 16, hy: 0.7, aL: 6, aR: -6}), A(0.55, {lR: -30, hd: 18}, "outBack"), A(0.75, {lR: 0}), A(1.6, {hd: 14, hy: 0.6}), A(2.0, {})]; },
    knee: function () { return [A(0, {}), A(0.35, {hd: 14, hy: 0.6, aR: 25, br: 4, by: 0.8}, "outBack"), A(1.2, {hd: 14, hy: 0.6, aR: 30, br: 4, by: 0.8}), A(1.6, {})]; },
    pet: function () { return [A(0, {}), A(0.35, {hd: 16, hy: 0.6, hx: 0.6, aR: 40, br: 6, by: 1.2, sy: -0.06}, "outBack"), A(0.6, {aR: 48}), A(0.85, {aR: 36}), A(1.1, {aR: 48}), A(1.5, {})]; },
    sad: function () { return [A(0, {}), A(0.6, {hd: 18, hy: 0.9, aL: 3, aR: -3, tor: -0.03}, "inOutQuad"), A(2.0, {hd: 18, hy: 0.9, tor: -0.03}), A(2.5, {})]; },
    land: function () { return [A(0, {by: -18, sy: 0.12, sx: -0.08}), A(0.32, {by: 0, sy: 0.05}, "inQuad"), A(0.44, {sy: -0.16, sx: 0.12, by: 0.5}), A(0.72, {sy: 0.03}, "outBack"), A(0.9, {})]; }
  };
  function sample(keys, t) {
    if (!keys || !keys.length) return zero();
    var out = zero();
    if (t <= keys[0].t) return addTo(out, keys[0], 1);
    for (var i = 1; i < keys.length; i++) {
      var a = keys[i - 1], b = keys[i];
      if (t <= b.t) {
        var k = (t - a.t) / Math.max(1e-4, b.t - a.t), f = (E[b.ez] || E.inOutQuad)(clamp01(k));
        for (var j = 0; j < KEYS.length; j++) { var q = KEYS[j]; out[q] = lerp(a[q] || 0, b[q] || 0, f); }
        return out;
      }
    }
    return addTo(out, keys[keys.length - 1], 1);
  }
  function dur(keys) { return keys[keys.length - 1].t; }

  /* ---------- cerebro del idle (compartido por 2D y 3D) ---------- */
  function Brain(o) {
    this.o = o || {};
    this.t = 0; this.breathT = 0; this.w = 0; this.wv = 0; this.wTarget = 0; this.wNext = rnd(2, 5);
    this.blinkNext = rnd(1, 4); this.blink = -1; this.dbl = false;
    this.gNext = rnd(3, 6); this.cur = null; this.curT = 0; this.queue = [];
    this.mood = "ok";
  }
  Brain.prototype.play = function (keys, front) {
    if (!keys) return;
    if (front) { this.cur = keys; this.curT = 0; this.queue.length = 0; } else if (!this.cur) { this.cur = keys; this.curT = 0; } else if (this.queue.length < 2) this.queue.push(keys);
  };
  Brain.prototype.busy = function () { return !!this.cur; };
  Brain.prototype.gestures = function () {
    var m = this.mood, g = this.o.gestures;
    if (g) return g;
    if (m === "inj") return ["look", "knee", "nod"];
    if (m === "tired") return ["brow", "look", "nod", "stretch"];
    if (m === "sad") return ["sad", "look", "kick"];
    if (m === "hot") return ["juggle", "jump", "look", "tug", "boots", "juggle"];
    return ["look", "stretch", "tug", "juggle", "boots", "look"];
  };
  Brain.prototype.step = function (dt, red) {
    this.t += dt;
    var m = this.mood, P = zero();
    /* respiración: más rápida y honda si está cansado, lenta y hundida si está triste */
    var bp = m === "tired" ? 2.3 : m === "sad" ? 4.2 : m === "hot" ? 2.9 : 3.4, amp = red ? 0.4 : (m === "tired" ? 1.8 : m === "sad" ? 1.3 : 1);
    this.breathT += dt * Math.PI * 2 / bp;
    var br = Math.sin(this.breathT);
    P.tor = 0.014 * amp * br;
    P.hy = -0.22 * amp * Math.sin(this.breathT - 0.7);
    P.aL = 1.5 * amp * Math.sin(this.breathT - 0.4); P.aR = -P.aL;
    /* postura del estado */
    if (m === "tired") { P.hd += 7; P.hy += 0.5; P.aL += 3; P.aR -= 3; }
    else if (m === "sad") { P.hd += 10; P.hy += 0.6; P.tor -= 0.02; }
    else if (m === "inj") { P.br += 2.5; P.lR -= 4; P.bx += 0.4; }
    else if (m === "hot" && !red) { var hop = Math.abs(Math.sin(this.t * Math.PI * 1.6)); P.by -= 0.35 * hop; P.sy += 0.02 * hop; P.hd -= 3; }
    /* cambios de peso: muelle amortiguado hacia un objetivo que cambia al azar */
    this.wNext -= dt;
    if (this.wNext <= 0) { this.wTarget = m === "inj" ? 1 : [-1, 0, 1][(Math.random() * 3) | 0]; this.wNext = rnd(3, 8); }
    var k = 18, c = 2 * Math.sqrt(k) * 0.9;
    this.wv += (k * (this.wTarget - this.w) - c * this.wv) * dt; this.w += this.wv * dt;
    var w = red ? 0 : this.w;
    P.bx += 0.35 * w; P.br += 1.2 * w; P.lL += 2.5 * Math.max(0, w); P.lR -= 2.5 * Math.max(0, -w); P.hx -= 0.15 * w;
    /* parpadeo aleatorio, a veces doble */
    this.blinkNext -= dt;
    if (this.blinkNext <= 0 && this.blink < 0) { this.blink = 0; this.dbl = Math.random() < 0.22; this.blinkNext = m === "tired" ? rnd(1.2, 3) : rnd(2, 6); }
    if (this.blink >= 0) {
      this.blink += dt;
      var bd = 0.15, b = this.blink;
      if (this.dbl && b > bd && b < bd + 0.09) P.eye = 0; else if (this.dbl && b >= bd + 0.09) b -= bd + 0.09;
      if (b < bd) P.eye = Math.sin(b / bd * Math.PI);
      if (this.blink > (this.dbl ? bd * 2 + 0.09 : bd)) this.blink = -1;
    }
    if (m === "tired") P.eye = Math.max(P.eye, 0.35);
    /* gestos sueltos y reacciones */
    if (!this.cur && !red && this.o.idleGestures !== false) {
      this.gNext -= dt;
      if (this.gNext <= 0) {
        var g = this.gestures(), name = g[(Math.random() * g.length) | 0];
        if (GEST[name]) this.play(GEST[name]());
        this.gNext = m === "hot" ? rnd(4, 9) : m === "sad" ? rnd(8, 15) : rnd(5, 12);
      }
    }
    if (this.cur) {
      this.curT += dt;
      addTo(P, sample(this.cur, this.curT), 1);
      if (this.curT >= dur(this.cur)) { this.cur = this.queue.shift() || null; this.curT = 0; }
    }
    return P;
  };

  /* ---------- aplicar la pose al avatar SVG (celdas de 5 unidades) ---------- */
  function Rig2D(svg, o) {
    this.svg = svg; this.o = o || {};
    var q = function (c) { return svg.querySelector(".pa-" + c); };
    this.g = {body: q("body"), up: q("up"), torso: q("torso"), head: q("head"), eyes: q("eyes"), aL: q("armL"), aR: q("armR"), lL: q("legL"), lR: q("legR"), sh: q("sh"), ball: q("ball")};
    this.brain = new Brain(o);
    this.last = "";
  }
  function f1(v) { return Math.round(v * 10) / 10; }
  Rig2D.prototype.apply = function (P) {
    var g = this.g, S5 = 5;
    var sx = 1 + P.sx, sy = 1 + P.sy;
    /* el giro «yaw» de 2D se simula volteando en horizontal */
    if (P.yaw) { var c = Math.cos(P.yaw * Math.PI / 180); sx *= Math.abs(c) < 0.08 ? 0.08 * (c < 0 ? -1 : 1) : c; }
    var bx = P.bx * S5, by = P.by * S5, rot = P.br, cx = 60, cy = 165, ry = 95;
    if (g.body) g.body.setAttribute("transform", "translate(" + f1(bx) + " " + f1(by) + ") rotate(" + f1(rot) + " " + cx + " " + ry + ") translate(" + cx + " " + cy + ") scale(" + (Math.round(sx * 1000) / 1000) + " " + (Math.round(sy * 1000) / 1000) + ") translate(" + (-cx) + " " + (-cy) + ")");
    if (g.up) g.up.setAttribute("transform", "translate(60 120) scale(1 " + (Math.round((1 + P.tor) * 1000) / 1000) + ") translate(-60 -120)");
    if (g.head) g.head.setAttribute("transform", "translate(" + f1(P.hx * S5) + " " + f1(P.hy * S5) + ") rotate(" + f1(P.hd) + " 60 50)");
    if (g.eyes) g.eyes.setAttribute("transform", "translate(0 27.5) scale(1 " + (Math.round(Math.max(0.12, 1 - P.eye) * 100) / 100) + ") translate(0 -27.5)");
    if (g.aL) g.aL.setAttribute("transform", "rotate(" + f1(P.aL) + " 30 53)");
    if (g.aR) g.aR.setAttribute("transform", "rotate(" + f1(P.aR) + " 90 53)");
    if (g.lL) g.lL.setAttribute("transform", "rotate(" + f1(P.lL) + " 47 118)");
    if (g.lR) g.lR.setAttribute("transform", "rotate(" + f1(P.lR) + " 73 118)");
    if (g.sh) { var hgt = Math.max(0, -P.by); g.sh.setAttribute("transform", "translate(60 167) scale(" + (Math.round(Math.max(0.45, 1 - hgt * 0.06) * 100) / 100) + " 1) translate(-60 -167)"); g.sh.style.opacity = String(Math.max(0.3, 1 - hgt * 0.07)); }
    if (g.ball) { g.ball.style.display = P.ball > 0.5 ? "" : "none"; if (P.ball > 0.5) g.ball.setAttribute("transform", "translate(" + (82 + P.bx * S5) + " " + f1(160 - P.bh * S5) + ") rotate(" + Math.round(P.bh * 40) + ")"); }
  };
  Rig2D.prototype.step = function (dt, red) { var P = this.brain.step(dt, red); this.apply(P); return P; };

  /* ---------- estado del jugador: moral, forma, lesión ---------- */
  function playerMood() {
    try {
      var p = S.p; if (!p) return "ok";
      if (p.inj && p.injT > S.tw) return "inj";
      if ((p.fit != null && p.fit < 45) || (p.form != null && p.form < 30)) return "tired";
      if (p.mor != null && p.mor < 35) return "sad";
      if (p.mor != null && p.mor >= 80 && (p.form == null || p.form >= 60)) return "hot";
    } catch (e) {}
    return "ok";
  }
  function celKeys() {
    try { var c = (S.p.life && S.p.life.cos && S.p.life.cos.cel) || "fist"; return CEL[c] || CEL.fist; } catch (e) { return CEL.fist; }
  }

  /* ---------- registro de rigs vivos y bucle compartido ---------- */
  var live = [], stopLoop = null;
  function tick(dt) {
    var red = Anim.reduced();
    for (var i = live.length - 1; i >= 0; i--) {
      var r = live[i];
      if (!r.el.isConnected) { live.splice(i, 1); continue; }
      r.step(dt, red);
    }
    if (!live.length) { stopLoop = null; return false; }
    mate(dt);
    return true;
  }
  function track(r) { live.push(r); if (!stopLoop) stopLoop = Anim.loop(tick, {noStop: true}); }
  function rigOf(el) { for (var i = 0; i < live.length; i++) if (live[i].el === el) return live[i]; return null; }

  /* ---------- mascota en 2D ---------- */
  /* trucos: un repertorio común y la lista de cada especie (se aprenden en este orden) */
  var TRICK_N = {
    spin: N_("Dar una vuelta"), sit: N_("Sentarse"), jump: N_("Saltar"), paw: N_("Chocar la pata"), roll: N_("Voltereta"), dead: N_("Hacerse el muerto"),
    dance: N_("Bailar"), flip: N_("Mortal hacia atrás"), fetch: N_("Traer la pelota"), stretch: N_("Estirarse"), pounce: N_("Abalanzarse"),
    binky: N_("Brinco loco"), hide: N_("Esconderse en el caparazón"), fly: N_("Volar en círculo"), coil: N_("Enroscarse"), pushup: N_("Flexiones"),
    ball: N_("Hacerse una bola"), swim: N_("Nadar en círculo"), bubbles: N_("Hacer burbujas"), wave: N_("Saludar"), dive: N_("Zambullirse"), chill: N_("Modo relax")
  };
  var SPECIES_TRICKS = {
    dog: ["sit", "paw", "spin", "jump", "fetch", "roll", "dead", "flip"], cat: ["stretch", "sit", "spin", "pounce", "roll", "jump", "dance", "flip"],
    rabbit: ["binky", "sit", "spin", "jump", "roll", "dance", "dead", "flip"], hamster: ["sit", "spin", "ball", "jump", "roll", "dance", "dead", "flip"],
    fish: ["swim", "bubbles", "spin", "jump", "flip", "dance", "roll", "dead"], turtle: ["hide", "spin", "dance", "sit", "roll", "jump", "dead", "flip"],
    macaw: ["fly", "wave", "dance", "spin", "sit", "jump", "roll", "flip"], iguana: ["pushup", "spin", "jump", "dead", "dance", "sit", "roll", "flip"],
    python: ["coil", "dance", "spin", "jump", "roll", "dead", "sit", "flip"], hedgehog: ["ball", "spin", "jump", "roll", "sit", "dance", "dead", "flip"],
    fennec: ["dive", "pounce", "spin", "jump", "sit", "roll", "dance", "flip"], capybara: ["chill", "sit", "spin", "dance", "jump", "roll", "dead", "flip"],
    tarantula: ["wave", "dance", "spin", "jump", "roll", "dead", "sit", "flip"]
  };
  function speciesTricks(pt) { var l = SPECIES_TRICKS[pt && pt.k] || SPECIES_TRICKS.dog; return l.map(function (k) { return {k: k, n: TRICK_N[k]}; }); }
  var PET_TRICKS = speciesTricks({k: "dog"});
  /* en 2D, los trucos propios usan la pose común más parecida */
  var PT2D = {fetch: "hop", stretch: "sit", pounce: "jump", binky: "spin", hide: "droop", fly: "jump", coil: "spin", pushup: "hop", ball: "roll", swim: "roll", bubbles: "giggle", wave: "paw", dive: "flip", chill: "sit"};
  /* poses de la mascota: by/br/sx/sy/yaw/pitch/roll sobre el cuerpo entero (celdas de su sprite de 12) */
  var PT = {
    spin: [A(0, {}), A(0.15, {sy: -0.2, sx: 0.15}), A(0.35, {by: -2, sy: 0.15, sx: -0.1}, "outQuad"), A(0.8, {by: -2.4, yaw: 360}), A(1.0, {by: 0, yaw: 360, sy: -0.22, sx: 0.18}, "inQuad"), A(1.3, {yaw: 360})],
    sit: [A(0, {}), A(0.2, {sy: -0.12, sx: 0.1}), A(0.45, {sy: -0.2, sx: 0.06, br: -6, by: 0.4}, "outBack"), A(1.4, {sy: -0.2, sx: 0.06, br: -6, by: 0.4}), A(1.7, {})],
    jump: [A(0, {}), A(0.18, {sy: -0.3, sx: 0.22}), A(0.5, {by: -5, sy: 0.25, sx: -0.16}, "outQuad"), A(0.82, {by: 0, sy: 0.1}, "inQuad"), A(0.92, {sy: -0.28, sx: 0.24}), A(1.25, {})],
    paw: [A(0, {}), A(0.25, {br: -14, by: -0.4, sx: -0.04}, "outBack"), A(0.45, {br: -18, by: -0.6}), A(0.6, {br: -10, by: -0.3}), A(0.75, {br: -18, by: -0.6}), A(1.1, {})],
    roll: [A(0, {}), A(0.15, {sy: -0.2, sx: 0.15}), A(0.75, {br: 360, roll: 360, by: -1.5}), A(0.9, {br: 360, roll: 360, sy: -0.2, sx: 0.16}), A(1.2, {br: 360, roll: 360})],
    dead: [A(0, {}), A(0.3, {br: 90, roll: 90, by: 0.8, sy: -0.06}, "outBounce"), A(1.6, {br: 90, roll: 90, by: 0.8}), A(1.75, {br: 70, roll: 70, by: 0.6}), A(2.05, {by: -1.5, sy: 0.15}, "outQuad"), A(2.3, {sy: -0.18, sx: 0.14}), A(2.5, {})],
    dance: [A(0, {}), A(0.2, {br: -12, bx: -0.6, sy: 0.08}), A(0.4, {br: 12, bx: 0.6, sy: -0.08}), A(0.6, {br: -12, bx: -0.6, sy: 0.08}), A(0.8, {br: 12, bx: 0.6, sy: -0.08}), A(1.0, {br: -8, by: -1.4}), A(1.25, {})],
    flip: [A(0, {}), A(0.2, {sy: -0.32, sx: 0.24}), A(0.75, {by: -6, br: -360, pitch: -360, sy: 0.12}), A(0.92, {by: 0, br: -360, pitch: -360, sy: -0.3, sx: 0.24}, "inQuad"), A(1.3, {br: -360, pitch: -360})],
    hop: [A(0, {}), A(0.12, {sy: -0.22, sx: 0.18}), A(0.32, {by: -2.6, sy: 0.18, sx: -0.12}, "outQuad"), A(0.52, {by: 0}, "inQuad"), A(0.6, {sy: -0.24, sx: 0.2}), A(0.85, {})],
    giggle: [A(0, {}), A(0.08, {sy: -0.16, sx: 0.14}), A(0.16, {sy: 0.1, sx: -0.08, br: -8}), A(0.24, {sy: -0.12, sx: 0.1, br: 8}), A(0.32, {sy: 0.08, br: -6}), A(0.4, {sy: -0.1, br: 6}), A(0.6, {})],
    yawn: [A(0, {}), A(0.5, {sy: 0.14, sx: -0.06, by: -0.3, eye: 1}), A(1.2, {sy: 0.16, sx: -0.06, eye: 1}), A(1.5, {sy: -0.1, sx: 0.08}), A(1.8, {})],
    look: [A(0, {}), A(0.3, {br: 6, bx: 0.3}, "outBack"), A(1.2, {br: 6, bx: 0.3}), A(1.5, {})],
    shiver: [A(0, {}), A(0.06, {bx: 0.15}), A(0.12, {bx: -0.15}), A(0.18, {bx: 0.15}), A(0.24, {bx: -0.15}), A(0.3, {bx: 0.15}), A(0.36, {bx: -0.15}), A(0.5, {})],
    droop: [A(0, {}), A(0.6, {sy: -0.1, sx: 0.06, by: 0.3, eye: 0.4}), A(1.8, {sy: -0.1, sx: 0.06, by: 0.3, eye: 0.4}), A(2.2, {})],
    cheer: [A(0, {}), A(0.12, {sy: -0.3, sx: 0.25}), A(0.36, {by: -4, sy: 0.3, sx: -0.18, br: -10}, "outQuad"), A(0.6, {by: 0, br: 10}, "inQuad"), A(0.68, {sy: -0.25, sx: 0.2}), A(0.82, {by: -2.5, sy: 0.18, br: -6}, "outQuad"), A(1.02, {by: 0}, "inQuad"), A(1.1, {sy: -0.2, sx: 0.16}), A(1.35, {})]
  };
  function petMood(pt) {
    try {
      if (!pt) return "ok";
      if (sleepy) return "sleep";
      if (typeof petNeeds === "function" && petNeeds()) return "bored";
      if (pt.bond < 35) return "sad";
      if (pt.bond >= 75 && pt.cared) return "happy";
    } catch (e) {}
    return "ok";
  }
  /* dormida si llevas tiempo sin jugar (más de 10 h): se despierta al tocarla */
  var sleepy = false;
  (function () {
    try {
      var k = "camino.lastSeen", last = +localStorage.getItem(k) || 0, n = Date.now();
      if (last && n - last > 10 * 3600 * 1000) sleepy = true;
      localStorage.setItem(k, String(n));
      setInterval(function () { try { localStorage.setItem(k, String(Date.now())); } catch (e) {} }, 60000);
    } catch (e) {}
  })();
  function knownTricks(pt) { var l = speciesTricks(pt), n = Math.min(l.length, (pt && pt.tricks) || 0); return l.slice(0, n); }

  function PetRig(el, o) {
    this.el = el; this.o = o || {};
    this.body = el.querySelector(".petbody");
    this.acc = Array.prototype.slice.call(el.querySelectorAll(".pacc"));
    this.accBase = this.acc.map(function (a) { return a.style.transform || ""; });
    this.t = rnd(0, 10); this.breathT = rnd(0, 6); this.gNext = rnd(2, 5); this.cur = null; this.curT = 0;
    this.blinkNext = rnd(1, 4); this.blink = -1; this.eyes = null; this.eyeFill = null;
    this.sw = 0; this.swv = 0; this.prevBr = 0; /* follow-through de los accesorios */
    this.zz = 0; this.mood = "ok"; this.lookAt = 0;
  }
  PetRig.prototype.findEyes = function () {
    /* ojos = píxeles oscuros aislados en la mitad superior del sprite; al parpadear se pintan del color de arriba */
    if (this.eyes) return;
    var svg = this.body && this.body.querySelector("svg"); if (!svg) return;
    var rs = Array.prototype.slice.call(svg.querySelectorAll("rect")), map = {}, eyes = [];
    rs.forEach(function (r) { var x = +r.getAttribute("x"), y = +r.getAttribute("y"), w = +r.getAttribute("width"); for (var i = 0; i < w; i++) map[(x + i) + "," + y] = r; });
    rs.forEach(function (r) {
      var y = +r.getAttribute("y"), w = +r.getAttribute("width"), x = +r.getAttribute("x"), c = (r.getAttribute("fill") || "").toLowerCase();
      if (y > 6 || w > 2 || !/^#/.test(c)) return;
      var hx = c.replace("#", ""); if (hx.length === 3) hx = hx[0] + hx[0] + hx[1] + hx[1] + hx[2] + hx[2];
      var v = parseInt(hx, 16), lum = ((v >> 16) * 0.3 + ((v >> 8) & 255) * 0.59 + (v & 255) * 0.11) / 255;
      if (lum > 0.22) return;
      var up = map[x + "," + (y - 1)];
      if (!up || up === r || !map[(x - 1) + "," + y] || !map[(x + w) + "," + y]) return;
      eyes.push([r, c, up.getAttribute("fill")]);
    });
    if (eyes.length >= 1 && eyes.length <= 4) this.eyes = eyes; else this.eyes = [];
  };
  PetRig.prototype.setEyes = function (closed) {
    if (!this.eyes) this.findEyes();
    if (!this.eyes || !this.eyes.length || this.closed === closed) return;
    this.closed = closed;
    this.eyes.forEach(function (e) { e[0].setAttribute("fill", closed ? e[2] : e[1]); });
  };
  PetRig.prototype.play = function (keys) { if (keys) { this.cur = keys; this.curT = 0; } };
  PetRig.prototype.trick = function () {
    var ks = knownTricks(this.o.pt); if (!ks.length) return false;
    var k = ks[(Math.random() * ks.length) | 0].k; this.play(PT[k] || PT[PT2D[k]] || PT.hop); return true;
  };
  PetRig.prototype.react = function (kind) {
    if (this.mood === "sleep") { sleepy = false; this.mood = "ok"; this.play(PT.yawn); return; }
    if (kind === "tap") {
      var r = Math.random();
      if (r < 0.35) this.play(PT.giggle); else if (r < 0.6) this.play(PT.hop); else if (!this.trick()) this.play(PT.jump);
      Anim.burstAt(this.el, {n: 8, colors: ["#ff6fa8", "#ffd1e3", "#ffffff"], speed: 140, gravity: -60, life: 0.7, size: 4, spread: Math.PI * 0.9});
      Anim.haptic("tap");
    } else if (kind === "cheer") this.play(PT.cheer);
    else if (kind === "sad") this.play(PT.droop);
    else if (kind === "nervous") this.play(PT.shiver);
  };
  PetRig.prototype.step = function (dt, red) {
    this.t += dt;
    var m = this.mood, P = zero();
    if (m === "sleep") {
      this.breathT += dt * Math.PI * 2 / 4.5;
      P.sy = -0.12 + 0.05 * Math.sin(this.breathT); P.sx = 0.08 - 0.03 * Math.sin(this.breathT); P.by = 0.4; P.eye = 1;
      this.zz -= dt;
      if (this.zz <= 0 && !red) { this.zz = 1.6; var r = this.el.getBoundingClientRect(); if (r.width) Anim.floatText("z", r.right - r.width * 0.2, r.top + r.height * 0.2, "fxzz"); }
    } else {
      var bp = m === "sad" ? 4 : m === "happy" ? 2.2 : 3;
      this.breathT += dt * Math.PI * 2 / bp;
      var b = Math.sin(this.breathT), amp = red ? 0.3 : 1;
      P.sy = 0.035 * amp * b; P.sx = -0.025 * amp * b;
      if (m === "happy" && !red) { var hop = Math.abs(Math.sin(this.t * Math.PI * 1.25)); P.by -= 0.5 * hop * hop; }
      if (m === "sad") { P.sy -= 0.06; P.sx += 0.04; P.by += 0.2; }
      /* parpadeo */
      this.blinkNext -= dt;
      if (this.blinkNext <= 0 && this.blink < 0) { this.blink = 0; this.blinkNext = rnd(1.8, 5.5); }
      if (this.blink >= 0) { this.blink += dt; P.eye = 1; if (this.blink > 0.13) this.blink = -1; }
      if (m === "sad" || m === "bored") P.eye = Math.max(P.eye, 0.4);
      /* acciones al azar: trucos aprendidos, mirar al jugador, bostezo, saltito */
      if (!this.cur && !red) {
        this.gNext -= dt;
        if (this.gNext <= 0) {
          var opts = m === "bored" ? ["yawn", "look", "droop"] : m === "sad" ? ["droop", "look"] : ["hop", "look", "trick", "trick", "giggle", "yawn"];
          var pick = opts[(Math.random() * opts.length) | 0];
          if (pick === "trick") { if (!this.trick()) this.play(PT.hop); } else this.play(PT[pick]);
          this.gNext = m === "happy" ? rnd(3, 7) : rnd(5, 11);
        }
      }
    }
    if (this.cur) {
      this.curT += dt;
      addTo(P, sample(this.cur, this.curT), 1);
      if (this.curT >= dur(this.cur)) { this.cur = null; this.curT = 0; }
    }
    /* paseíto: va y viene dentro de su sitio y se gira hacia donde camina (el sprite mira a la izquierda) */
    var R = this.range || 0;
    if (R && !red && m !== "sleep" && !this.cur) {
      this.wNext = (this.wNext == null ? rnd(1, 3) : this.wNext) - dt;
      if (this.wNext <= 0) { this.wT = Math.random() < 0.3 ? 0 : rnd(-R, R); this.wNext = rnd(2.5, 6); }
      var d = (this.wT || 0) - (this.wx || 0), sp = (m === "happy" ? 22 : m === "sad" ? 7 : 14) * dt;
      if (Math.abs(d) > 0.5) { this.wx = (this.wx || 0) + Math.max(-sp, Math.min(sp, d)); this.face = d > 0 ? -1 : 1; this.walkT = (this.walkT || 0) + dt; P.by -= 0.45 * Math.abs(Math.sin(this.walkT * 11)); P.br += 3 * Math.sin(this.walkT * 11); }
    }
    this.apply(P, dt);
  };
  PetRig.prototype.apply = function (P, dt) {
    var sx = 1 + P.sx, sy = 1 + P.sy;
    if (P.yaw) { var c = Math.cos(P.yaw * Math.PI / 180); sx *= Math.abs(c) < 0.08 ? 0.08 * (c < 0 ? -1 : 1) : c; }
    if (!this.cell || (this.cellN = (this.cellN || 0) + 1) % 120 === 0) this.cell = (parseFloat(getComputedStyle(this.el).fontSize) || 40) / 12;
    var cell = this.cell;
    var fc = this.face || 1;
    var tf = "translate(" + f1(P.bx * cell + (this.wx || 0)) + "px," + f1(P.by * cell) + "px) rotate(" + f1(P.br * fc) + "deg) scale(" + (Math.round(sx * fc * 1000) / 1000) + "," + (Math.round(sy * 1000) / 1000) + ")";
    if (this.inner) this.inner.style.transform = tf;
    this.setEyes(P.eye > 0.5);
    /* accesorios: muelle que se queda atrás cuando el cuerpo gira o salta (partes colgantes) */
    var drive = (P.br - this.prevBr) / Math.max(dt, 1e-3) * 0.02 + (P.sy) * 30;
    this.prevBr = P.br;
    var k = 60, c2 = 2 * Math.sqrt(k) * 0.35;
    this.swv += (-k * this.sw - c2 * this.swv - drive) * dt; this.sw += this.swv * dt;
    var sw = Math.max(-14, Math.min(14, this.sw));
    for (var i = 0; i < this.acc.length; i++) {
      var a = this.acc[i], base = this.accBase[i];
      a.style.transform = base + " rotate(" + f1(sw * (a.classList.contains("pn") ? 1.4 : a.classList.contains("pt") ? 0.6 : 0.8)) + "deg)";
    }
  };

  /* ---------- montar rigs tras cada render ---------- */
  function wrapPet(el) {
    /* todo (cuerpo y accesorios) dentro de un contenedor que se deforma con el squash */
    if (el.__petInner) return el.__petInner;
    var w = document.createElement("span"); w.className = "petrig";
    while (el.firstChild) w.appendChild(el.firstChild);
    el.appendChild(w); el.__petInner = w;
    return w;
  }
  function attachPet(el, pt) {
    if (el.__rig || el.closest("[data-ico]") || el.hasAttribute("data-ico")) return null;
    wrapPet(el);
    var r = new PetRig(el, {pt: pt}); r.inner = el.__petInner; r.mood = petMood(pt); el.__rig = r;
    r.range = el.closest(".lfav") ? 10 : el.closest(".pethero") ? 14 : el.closest(".petcard") ? 5 : 0;
    track(r);
    if (!Anim.reduced() && !el.closest(".sheet")) { Anim.pop(el.__petInner, {from: 0.4, dur: 480}); }
    return r;
  }
  var lastMor = null, lastOvr = null, lastAttrs = null, lastPetTricks = null;
  function attachPlayer(svg, entry) {
    if (svg.__rig) return svg.__rig;
    var r = new Rig2D(svg, {}); r.el = svg; r.brain.mood = playerMood(); svg.__rig = r;
    if (entry && !Anim.reduced()) r.brain.play(GEST.land(), true);
    track(r);
    return r;
  }
  function scan() {
    if (typeof S === "undefined" || !S || !S.p) return;
    var svgs = document.querySelectorAll("svg.rig");
    var firstAttach = false;
    for (var i = 0; i < svgs.length; i++) if (!svgs[i].__rig) { attachPlayer(svgs[i], true); firstAttach = true; }
    var pt = typeof petOf === "function" ? petOf() : null;
    var arts = document.querySelectorAll(".petart");
    for (var j = 0; j < arts.length; j++) if (!arts[j].__rig && pt) attachPet(arts[j], pt);
    /* la mascota a los pies del jugador en la zona Yo */
    var av = document.querySelector(".lfav");
    if (av && pt && !av.querySelector(".lfpet") && UIX.petArt) {
      av.insertAdjacentHTML("beforeend", '<span class="lfpet" aria-hidden="true">' + UIX.petArt(pt, 26) + "</span>");
      var pa = av.querySelector(".lfpet .petart"); if (pa) { if (typeof PX !== "undefined" && PX.emojify) PX.emojify(pa); attachPet(pa, pt); }
    }
    reactToState(firstAttach);
  }
  /* reacciones cuando cambian moral, media o atributos entre renders */
  function reactToState(fresh) {
    var p = S.p, mor = p.mor, ovr = typeof ovrInt === "function" ? ovrInt() : null;
    var mood = playerMood();
    live.forEach(function (r) { if (r.brain) r.brain.mood = mood; else if (r instanceof PetRig) r.mood = petMood(r.o.pt); });
    var players = live.filter(function (r) { return r.brain; }), pets = live.filter(function (r) { return r instanceof PetRig; });
    if (lastMor != null && mor != null && !fresh) {
      if (mor - lastMor >= 6) { players.forEach(function (r) { r.brain.play(celKeys(), true); }); pets.forEach(function (r) { r.react("cheer"); }); }
      else if (lastMor - mor >= 6) { players.forEach(function (r) { r.brain.play(GEST.sad(), true); }); pets.forEach(function (r) { r.react("sad"); }); }
    }
    lastMor = mor;
    if (ovr != null && lastOvr != null && ovr > lastOvr) levelUp(lastOvr, ovr, players);
    if (ovr != null) lastOvr = ovr;
    /* atributos del cromo que han subido: cuenta hacia arriba con rebote */
    var bs = document.querySelectorAll(".cromo .attrs > div > b");
    var vals = Array.prototype.map.call(bs, function (b) { return +b.textContent || 0; });
    if (lastAttrs && lastAttrs.length === vals.length) vals.forEach(function (v, i) { if (v > lastAttrs[i]) { Anim.countUp(bs[i], lastAttrs[i], v, {delay: i * 60}); Anim.burstAt(bs[i], {n: 6, speed: 120, life: 0.5, size: 3}); } });
    if (bs.length) lastAttrs = vals;
  }
  function levelUp(a, b, players) {
    var el = document.querySelector("header.top .ovr b"); if (el) { Anim.countUp(el, a, b, {dur: 700}); Anim.burstAt(el, {n: 16, confetti: true, speed: 240, colors: ["#ffb21e", "#fff0b8", "#3fcf7c"]}); }
    var big = document.querySelector(".cromo .big"); if (big) Anim.countUp(big, a, b, {dur: 800});
    players.forEach(function (r) { r.brain.play(GEST.jump(), true); r.brain.play(CEL.fist); var rc = r.el.getBoundingClientRect(); if (rc.width) Anim.burst(rc.left + rc.width / 2, rc.top + rc.height * 0.3, {n: 22, confetti: true, speed: 260}); });
    Anim.haptic("ok");
  }
  /* tocar al jugador: varias respuestas al azar */
  function tapPlayer(el) {
    var svg = el.querySelector("svg.rig"), r = svg && rigOf(svg); if (!r) return;
    var opts = ["wave", "jump", "juggle", "look", "cel"], pick = opts[(Math.random() * opts.length) | 0];
    if (r.brain.mood === "inj") pick = "knee";
    r.brain.play(pick === "cel" ? celKeys() : GEST[pick](), true);
    var pet = el.querySelector(".lfpet .petart"), pr = pet && rigOf(pet);
    if (pr && Math.random() < 0.6) setTimeout(function () { pr.react("tap"); }, 250);
    Anim.haptic("tap");
  }
  /* de vez en cuando jugador y mascota interactúan: él la mira y la acaricia, ella salta */
  var mateT = 0;
  function mate(dt) {
    mateT += dt;
    if (mateT < 9) return;
    mateT = 0;
    if (Math.random() > 0.45 || Anim.reduced()) return;
    var av = document.querySelector(".lfav"); if (!av) return;
    var svg = av.querySelector("svg.rig"), r = svg && rigOf(svg), pet = av.querySelector(".lfpet .petart"), pr = pet && rigOf(pet);
    if (!r || !pr || r.brain.busy() || pr.mood === "sleep") return;
    if (Math.random() < 0.5) { r.brain.play(GEST.pet(), true); setTimeout(function () { pr.play(PT.giggle); }, 350); }
    else { pr.play(PT.hop); setTimeout(function () { r.brain.play([A(0, {}), A(0.3, {hd: 14, hy: 0.5, hx: 0.6}, "outBack"), A(1.2, {hd: 14, hy: 0.5, hx: 0.6}), A(1.5, {})], true); }, 200); }
  }

  function boot() {
    if (typeof UIX === "undefined") return;
    UIX.add("after", function () { try { scan(); } catch (e) {} return ""; });
    UIX.actions.lfavtap = function (b) { tapPlayer(b); };
    /* tocar la mascota en su tarjeta o en la zona Yo: cosquillas (sin abrir nada si es la de los pies) */
    document.addEventListener("pointerdown", function (ev) {
      var a = ev.target && ev.target.closest && ev.target.closest(".petart");
      if (!a) return;
      var r = rigOf(a); if (r) r.react("tap");
    }, true);
    /* hojas y avisos que se pintan fuera del render principal: montar en cuanto aparecen */
    var pend = false;
    try {
      new MutationObserver(function (ms) {
        if (pend) return;
        for (var i = 0; i < ms.length; i++) for (var j = 0; j < ms[i].addedNodes.length; j++) {
          var n = ms[i].addedNodes[j];
          if (n.nodeType === 1 && (n.matches && (n.matches(".petart, svg.rig") || n.querySelector(".petart, svg.rig")))) {
            pend = true; requestAnimationFrame(function () { pend = false; try { scan(); } catch (e) {} }); return;
          }
        }
      }).observe(document.body || document.documentElement, {childList: true, subtree: true});
    } catch (e) {}
  }
  boot();
  return {poses: CEL, gestures: GEST, petPoses: PT, petTricks: PET_TRICKS, speciesTricks: speciesTricks, trickNames: TRICK_N, knownTricks: knownTricks, Brain: Brain, sample: sample, dur: dur, zero: zero,
    playerMood: playerMood, celKeys: celKeys, petMood: petMood, rigOf: rigOf, scan: scan,
    cheer: function () { live.forEach(function (r) { if (r.brain) r.brain.play(celKeys(), true); else r.react("cheer"); }); },
    nervous: function () { live.forEach(function (r) { if (!r.brain) r.react("nervous"); }); }};
})();
