/* pet-world.js — el mundo de la mascota (5.6): pantalla completa en vóxeles con el motor del partido.
   Casa (jardín) con cuidados, juego, trucos, vestidor, paseos, concursos, tienda y álbum.
   La lógica vive en pet-sim.js; aquí sólo hay escena, cámara, gestos, animación y la interfaz. */
var PetWorld = (function () {
  "use strict";
  if (typeof VoxCore === "undefined" || !VoxCore || typeof PetRig === "undefined" || !PetRig) return null;
  var MX = VoxCore.MX, PI = Math.PI, cur = null;
  function cl(v, a, b) { return v < a ? a : v > b ? b : v; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]; }); }
  function sfx(n) { try { PetAudio.fx(n); } catch (e) {} }
  function hap(k) { try { Anim.haptic(k); } catch (e) {} }
  function persist() { try { if (UIX && UIX.persist) UIX.persist(); } catch (e) {} }
  function red() { try { return Anim.reduced(); } catch (e) { return false; } }
  function supported() { return VoxCore.supported(); }
  function todNow() { var h = PetSim.hourOf(PetSim.clock()); return h >= 7.5 && h < 18.5 ? "day" : (h >= 6.5 && h < 7.5) || (h >= 18.5 && h < 20.5) ? "dusk" : "night"; }
  function seasonIdx() { var bi = null; try { if (S && S.bi != null) bi = S.bi; } catch (e) {} if (bi == null) { var mo = new Date().getMonth(); bi = mo >= 7 && mo <= 8 ? 0 : mo >= 9 && mo <= 10 ? 1 : mo === 11 || mo === 0 ? 2 : mo >= 1 && mo <= 2 ? 3 : 4; } return bi; }
  var SKY = {day: ["#5fb2ea", "#bfe3f6"], dusk: ["#4b4f86", "#f2a66a"], night: ["#060b18", "#1a2a46"]};
  var NEED_ICO = {hun: "🍖", thi: "💧", cln: "🛁", ene: "💤", fun: "🎾", aff: "💗"};
  var NEED_TXT = {hun: N_("Tiene hambre"), thi: N_("Tiene sed"), cln: N_("Está sucio"), ene: N_("Tiene sueño"), fun: N_("Se aburre"), aff: N_("Quiere mimos")};
  var TRAIT_TXT = {act: N_("Juguetón"), aff: N_("Cariñoso"), cur: N_("Curioso"), ind: N_("Independiente"), glu: N_("Glotón")};
  var TIER_TXT = [N_("Sin aprender"), N_("Aprendiendo"), N_("Casi dominado"), N_("Dominado")];

  /* ===================== núcleo ===================== */
  function open(o) {
    o = o || {};
    if (cur) close(true);
    var pt = petOf(); if (!pt || !supported()) return false;
    PetSim.tick(pt);
    var el = document.createElement("div");
    el.className = "pw"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", tr("Tu mascota"));
    el.innerHTML = '<canvas class="pw-cv" aria-hidden="true"></canvas><div class="pw-top"><div class="pw-id"><b class="pw-nm"></b><span class="pw-sub"></span></div><div class="pw-needs" aria-live="polite"></div><button class="iconbtn pw-x" data-pw="x" aria-label="' + esc(tr("Cerrar")) + '">✕</button></div>' +
      '<div class="pw-bub" aria-live="polite"></div><div class="pw-cap" aria-live="polite"></div><div class="pw-panel"></div><nav class="pw-bar"></nav>';
    document.body.appendChild(el);
    var cv = el.querySelector("canvas"), E;
    try { E = new VoxCore.Engine(cv, {quality: PetStyle.quality() === "low" ? "low" : PetStyle.quality() === "high" ? "high" : "auto", sun: [-0.3, 0.9, 0.35], ambient: 1.6, alpha: true, clear: [0, 0, 0, 0], shadowR: PetStyle.SHADOW_R, fog: 0.004, particles: 320}); }
    catch (e) { el.parentNode.removeChild(el); return false; }
    var W = cur = {el: el, cv: cv, E: E, pt: pt, o: o, t: 0, raf: 0, mode: null, actor: null, props: [], ball: null, ptrs: {}, last: 0, tod: todNow(), season: seasonIdx(), wx: null};
    W.wx = W.season === 3 ? "rain" : W.season === 2 ? "snow" : W.season === 1 ? "leaf" : W.season === 4 ? "petal" : null;
    if (W.tod === "night" && W.wx === "petal") W.wx = null;
    setSky(W);
    W.actor = makeActor(pt);
    el.addEventListener("click", function (e) { var b = e.target.closest("[data-pw]"); if (!b) return; e.preventDefault(); action(b.getAttribute("data-pw"), b.getAttribute("data-v"), b); });
    bindInput(W);
    W.onKey = function (e) { if (e.key === "Escape") { if (W.mode && W.mode.back && W.mode.back()) return; close(); } };
    window.addEventListener("keydown", W.onKey);
    W.onVis = function () { if (!document.hidden && cur === W) { W.last = 0; PetSim.tick(pt); hud(); } };
    document.addEventListener("visibilitychange", W.onVis);
    E.onLow = function () { E.reflect = 0; };
    setMode(o.mode || "home");
    try { Anim.animate(el, [{opacity: 0}, {opacity: 1}], {dur: 220, easing: Anim.css.out}); } catch (e) {}
    loop(0);
    greet(W);
    return true;
  }
  function close(silent) {
    var W = cur; if (!W) return; cur = null;
    cancelAnimationFrame(W.raf);
    if (W.mode && W.mode.exit) W.mode.exit();
    window.removeEventListener("keydown", W.onKey); document.removeEventListener("visibilitychange", W.onVis);
    persist();
    var fin = function () { W.E.dispose(); if (W.el.parentNode) W.el.parentNode.removeChild(W.el); };
    if (silent) fin(); else { try { Anim.animate(W.el, [{opacity: 1}, {opacity: 0}], {dur: 160, easing: Anim.css.in, onfinish: fin}); } catch (e) {} setTimeout(fin, 360); }
    thumbDirty = true;
    try { if (UIX) { UIX.render(false); } } catch (e) {}
  }
  function setSky(W) {
    var s = SKY[W.tod], g = W.season === 3 ? ["#56606b", "#9aa4ad"] : s;
    W.el.style.background = "linear-gradient(180deg," + g[0] + " 0%," + g[1] + " 70%)";
    W.E.setEnv(W.tod, W.season === 3 ? "rain" : W.season === 2 ? "cold" : null, W.tod === "night" ? PetStyle.LIGHT.nightFlood : W.tod === "dusk" ? PetStyle.LIGHT.duskFlood : 0);
    W.E.lamps = [[1.2, 1.6, -0.4], [-1.2, 1.6, -0.4], [0, 2.4, 1.2], [0, 2.4, -1.4]];
  }
  function makeActor(pt) {
    var a = new PetRig.Actor({k: pt.k, stage: PetSim.stage(pt), col: pt.col, ico: petIco(pt), eq: pt.eq || {}});
    a.mood = pt.mood; a.baseExpr = PetSim.expr(pt); a.dirt = pt.dirt || 0;
    return a;
  }
  function refreshActor() { var W = cur; if (!W) return; var a = W.actor, b = makeActor(W.pt); b.x = a.x; b.z = a.z; b.yaw = a.yaw; W.actor = b; }
  function loop(ts) {
    var W = cur; if (!W) return;
    W.raf = requestAnimationFrame(loop);
    if (document.hidden) return;
    var dt = W.last ? Math.min(0.05, (ts - W.last) / 1000) : 0.016; W.last = ts; W.t += dt;
    var pt = W.pt, a = W.actor;
    /* el reloj real avanza también con la pantalla abierta */
    W.tickT = (W.tickT || 0) + dt; if (W.tickT > 20) { W.tickT = 0; PetSim.tick(pt); hud(); a.mood = pt.mood; if (!a.clip || a.clip.n !== "sleep") a.baseExpr = PetSim.expr(pt); }
    W.E.frame(dt, function () {
      if (W.mode && W.mode.update) W.mode.update(dt);
      if (a.plan === "fish") fishTank(W, a, dt);
      a.update(dt, W.mode);
      a.draw(W.E, {dt: dt});
      if (a.plan === "fish") fishGlass(W);
      W.props.forEach(function (p) { if (p.show !== false) W.E.bake(p.m.verts, p.M || MX.T(p.x, p.y || 0, p.z)); });
      if (W.ball && W.ball.show) W.E.bake(W.ball.m.verts, MX.mul(MX.T(W.ball.x, W.ball.y, W.ball.z), MX.RX(W.ball.rot || 0)));
      if (W.mode && W.mode.draw) W.mode.draw(dt);
      weather(W, dt);
    });
    bubbleFollow(W);
    if (W.shot) { var s = W.shot; W.shot = null; s(); }
  }
  /* el pez vive en un acuario sobre una mesita: nada dentro y el cristal se dibuja translúcido */
  var TANK = {x: 0, z: 0, y: 0.32, w: 0.5, h: 0.34, d: 0.32};
  function fishTank(W, a, dt) {
    a.float = true; a.held = false;
    if (W.modeK !== "home" && W.modeK !== "care" && W.modeK !== "play" && W.modeK !== "train" && W.modeK !== "out") { a.y = 0.16; return; }
    if (!a.goal && Math.random() < dt * 0.5) a.moveTo(TANK.x + rnd(-0.16, 0.16), TANK.z + rnd(-0.08, 0.08));
    if (a.goal) { a.goal.x = cl(a.goal.x, -0.18, 0.18); a.goal.z = cl(a.goal.z, -0.09, 0.09); }
    a.x = cl(a.x, -0.18, 0.18); a.z = cl(a.z, -0.09, 0.09); a.y = TANK.y + 0.08 + Math.sin(W.t * 0.7) * 0.05;
    if (Math.random() < dt * 2) W.E.spawn({x: a.x + rnd(-0.02, 0.02), y: a.y + 0.05, z: a.z, vy: 0.15, life: 1.2, s: 0.008, c: "#e8f6ff"});
  }
  function fishGlass(W) {
    if (W.actor.y < 0.25) return;
    var O = VoxCore.core.ORIGIN, d = W.E.dyn, T2 = TANK, c1 = [0.55, 0.36, 0.2], c2 = [0.2, 0.55, 0.85];
    /* mesita y fondo de grava (opacos) */
    d.box(O[0], O[1], O[2], 0.6, T2.y - 0.02, 0.4, c1, 1);
    d.box(O[0], O[1] + T2.y - 0.02, O[2], T2.w, 0.04, T2.d, [0.82, 0.74, 0.58], 1);
    d.box(O[0] - 0.12, O[1] + T2.y + 0.02, O[2] - 0.06, 0.03, 0.12, 0.03, [0.3, 0.7, 0.35], 1);
    d.box(O[0] + 0.15, O[1] + T2.y + 0.02, O[2] + 0.05, 0.03, 0.08, 0.03, [0.35, 0.78, 0.4], 1);
    /* agua y cristal */
    W.E.alphaT = 0.22; W.E.dynT.box(O[0], O[1] + T2.y + 0.02, O[2], T2.w, T2.h - 0.04, T2.d, c2, 1);
  }
  function weather(W, dt) {
    if (!W.wx || red() || W.E.quality === 0) return;
    W.wxT = (W.wxT || 0) + dt; var rate = W.wx === "rain" ? 0.012 : W.wx === "snow" ? 0.03 : 0.12;
    while (W.wxT > rate) {
      W.wxT -= rate;
      var t = W.E.cam.target, x = t[0] + rnd(-1.6, 1.6), z = t[2] + rnd(-1.6, 1.2);
      if (W.wx === "rain") W.E.spawn({x: x, y: 2, z: z, vy: -5, life: 0.45, s: 0.012, c: "#b8d4f0", floor: 0});
      else if (W.wx === "snow") W.E.spawn({x: x, y: 2, z: z, vy: -0.4, vx: rnd(-0.1, 0.1), life: 5, s: 0.014, c: "#ffffff", floor: 0});
      else W.E.spawn({x: x, y: 1.6, z: z, vy: -0.3, vx: rnd(-0.2, 0.2), life: 5, s: 0.02, spin: 2, c: W.wx === "leaf" ? (Math.random() < 0.5 ? "#e08a2a" : "#c0602a") : "#ffc4dc", floor: 0, shape: null});
    }
  }
  /* bocadillo sobre la mascota y rótulos breves */
  function say(txt, dur) { var W = cur; if (!W) return; var b = W.el.querySelector(".pw-bub"); b.textContent = txt; b.classList.add("on"); clearTimeout(W.bubT); W.bubT = setTimeout(function () { b.classList.remove("on"); }, (dur || 2.2) * 1000); }
  function cap(txt, dur) { var W = cur; if (!W) return; var b = W.el.querySelector(".pw-cap"); b.textContent = txt; b.classList.add("on"); clearTimeout(W.capT); W.capT = setTimeout(function () { b.classList.remove("on"); }, (dur || 2.6) * 1000); }
  function bubbleFollow(W) {
    var b = W.el.querySelector(".pw-bub"); if (!b.classList.contains("on")) return;
    var p = W.E.project(W.actor.anchor("head_top")), r = W.el.getBoundingClientRect();
    b.style.transform = "translate(" + Math.round(cl(p.x - r.left, 70, r.width - 70)) + "px," + Math.round(cl(p.y - r.top - 18, 70, r.height - 120)) + "px) translate(-50%,-100%)";
  }
  function fx(kind, p, n) {
    var W = cur; if (!W || red()) return; p = p || W.actor.anchor("head_top"); n = n || 1;
    for (var i = 0; i < n; i++) {
      if (kind === "heart") W.E.spawn({x: p[0] + rnd(-0.03, 0.03), y: p[1] + 0.02, z: p[2], vy: 0.35, vx: rnd(-0.08, 0.08), life: 1.2, s: 0.028, c: "#ff5f8f", shape: "heart", drag: 0.5});
      else if (kind === "star") W.E.spawn({x: p[0] + rnd(-0.06, 0.06), y: p[1] + 0.02, z: p[2], vy: rnd(0.3, 0.6), vx: rnd(-0.3, 0.3), vz: rnd(-0.2, 0.2), g: 0.8, life: 1, s: 0.026, c: "#ffd23a", shape: "star", spin: 3, code: VoxCore.MAT.EMIT});
      else if (kind === "zz") W.E.spawn({x: p[0] + 0.03, y: p[1] + 0.03, z: p[2], vy: 0.12, vx: 0.05, life: 1.8, s: 0.026, c: "#cfe0ff", shape: "zz"});
      else if (kind === "note") W.E.spawn({x: p[0], y: p[1] + 0.03, z: p[2], vy: 0.25, vx: rnd(-0.1, 0.1), life: 1.2, s: 0.024, c: "#7ad0ff", shape: "note"});
      else if (kind === "foam") W.E.spawn({x: p[0] + rnd(-0.03, 0.03), y: p[1] + rnd(-0.02, 0.03), z: p[2] + rnd(-0.03, 0.03), vy: rnd(0.02, 0.1), life: rnd(0.8, 1.6), s: rnd(0.012, 0.022), c: "#f4f8ff", drag: 2});
      else if (kind === "drop") W.E.spawn({x: p[0], y: p[1], z: p[2], vx: rnd(-0.8, 0.8), vy: rnd(0.4, 1.2), vz: rnd(-0.8, 0.8), g: 6, life: 0.7, s: 0.01, c: "#9fd4ff", floor: 0});
      else if (kind === "spark") W.E.spawn({x: p[0] + rnd(-0.05, 0.05), y: p[1] + rnd(-0.03, 0.04), z: p[2] + rnd(-0.05, 0.05), vy: 0.1, life: 0.6, s: 0.012, c: "#fff7c8", code: VoxCore.MAT.EMIT});
      else if (kind === "dust") W.E.spawn({x: p[0] + rnd(-0.04, 0.04), y: 0.01, z: p[2] + rnd(-0.04, 0.04), vx: rnd(-0.2, 0.2), vy: rnd(0.1, 0.3), vz: rnd(-0.2, 0.2), g: 0.5, life: 0.6, s: 0.014, c: "#c8b896", drag: 2});
      else if (kind === "kibble") W.E.spawn({x: p[0] + rnd(-0.03, 0.03), y: p[1] + 0.25 + rnd(0, 0.1), z: p[2] + rnd(-0.03, 0.03), vy: -0.2, g: 5, life: 0.8, s: 0.012, c: "#b98552", floor: p[1] + 0.03});
      else if (kind === "confetti") W.E.spawn({x: p[0] + rnd(-0.4, 0.4), y: p[1] + rnd(0.5, 0.9), z: p[2] + rnd(-0.3, 0.3), vy: rnd(-0.2, 0.4), vx: rnd(-0.3, 0.3), g: 0.7, life: 2.4, s: 0.016, spin: 4, c: ["#e2403a", "#f6c83a", "#3a7ad8", "#4cb84a", "#f070a8"][i % 5], floor: 0, drag: 0.8});
    }
  }
  /* cabecera: nombre, etapa y carácter, iconos discretos de necesidades */
  function hud() {
    var W = cur; if (!W) return; var pt = W.pt;
    W.el.querySelector(".pw-nm").textContent = pt.nm;
    W.el.querySelector(".pw-sub").textContent = tr(PET_STAGE[PetSim.stage(pt)]) + " · " + tr(TRAIT_TXT[PetSim.trait(pt)]);
    var nd = PetSim.need(pt).slice(0, 3);
    W.el.querySelector(".pw-needs").innerHTML = nd.map(function (k) { return '<span class="pw-need" title="' + esc(tr(NEED_TXT[k])) + '" aria-label="' + esc(tr(NEED_TXT[k])) + '">' + NEED_ICO[k] + "</span>"; }).join("");
  }
  function greet(W) {
    var pt = W.pt, a = W.actor;
    hud();
    if (pt.sleep) { a.play("sleep"); say(tr("Zzz…")); return; }
    if (pt.missed) {
      a.say("sad", 1.6); a.play("sad", {done: function () { a.say("excited", 1.5); a.play("happy"); fx("heart", null, 3); PetAudio.voice(pt.k, PetSim.stage(pt), "excited"); }});
      say(tr("¡Te ha echado de menos!"), 2.8); pt.missed = 0; return;
    }
    a.say("happy", 1.4); a.play("happy"); try { PetAudio.voice(pt.k, PetSim.stage(pt), "happy"); } catch (e) {}
  }

  /* ===================== gestos ===================== */
  function bindInput(W) {
    var cv = W.cv, E = W.E;
    function pts() { return Object.keys(W.ptrs).map(function (k) { return W.ptrs[k]; }); }
    cv.addEventListener("pointerdown", function (e) {
      try { cv.setPointerCapture(e.pointerId); } catch (er) {}
      var p = W.ptrs[e.pointerId] = {id: e.pointerId, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t0: performance.now(), moved: 0, path: [[e.clientX, e.clientY, performance.now()]]};
      var P = pts();
      if (P.length === 2) { W.pinch = {d: Math.hypot(P[0].x - P[1].x, P[0].y - P[1].y), dist: E.cam.dist}; return; }
      var R = E.ray(e.clientX, e.clientY), h = W.actor.hit(E, R);
      p.onPet = h; W.drag = null;
      if (W.mode && W.mode.down && W.mode.down(p, h, R)) { p.claimed = true; return; }
      if (h) { p.petT = 0; W.actor.lookAt(h.p, 1); }
      p.lp = setTimeout(function () { if (!p.moved && p.onPet && W.mode && W.mode.longPress) W.mode.longPress(p); }, 480);
    });
    cv.addEventListener("pointermove", function (e) {
      var p = W.ptrs[e.pointerId]; if (!p) return;
      var dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY; p.moved += Math.abs(dx) + Math.abs(dy);
      p.path.push([e.clientX, e.clientY, performance.now()]); if (p.path.length > 64) p.path.shift();
      var P = pts();
      if (P.length === 2 && W.pinch) { var d = Math.hypot(P[0].x - P[1].x, P[0].y - P[1].y); E.cam.dist = cl(W.pinch.dist * W.pinch.d / Math.max(20, d), W.camMin || 0.6, W.camMax || 4); return; }
      if (p.moved > 6) clearTimeout(p.lp);
      if (p.claimed) { if (W.mode.move) W.mode.move(p, dx, dy); return; }
      if (p.onPet && !W.mode.noPet) {
        var R = E.ray(e.clientX, e.clientY), h = W.actor.hit(E, R);
        if (h) { W.actor.lookAt(h.p, 0.6); p.rub = (p.rub || 0) + Math.abs(dx) + Math.abs(dy); if (p.rub > 70) { p.rub = 0; pet(h, "pat"); } return; }
      }
      if (W.mode && W.mode.noOrbit) return;
      E.cam.yaw -= dx * 0.008; E.cam.pitch = cl(E.cam.pitch + dy * 0.004, 0.08, 1.2); W.idleCam = 0;
    });
    function up(e) {
      var p = W.ptrs[e.pointerId]; if (!p) return; delete W.ptrs[e.pointerId]; clearTimeout(p.lp);
      if (pts().length < 2) W.pinch = null;
      if (p.claimed) { if (W.mode.up) W.mode.up(p); return; }
      var dt = performance.now() - p.t0;
      if (p.moved < 10 && dt < 350) {
        var now = performance.now();
        if (W.lastTap && now - W.lastTap.t < 320 && Math.hypot(W.lastTap.x - p.x, W.lastTap.y - p.y) < 30 && !p.onPet) { recenter(); W.lastTap = null; return; }
        W.lastTap = {t: now, x: p.x, y: p.y};
        if (p.onPet) { if (W.mode && W.mode.tapPet) W.mode.tapPet(p.onPet); else pet(p.onPet, "poke"); }
        else if (W.mode && W.mode.tapGround) { var g = E.groundAt(p.x, p.y, 0); if (g) W.mode.tapGround(g, p); }
      } else if (W.mode && W.mode.gesture && !p.onPet) W.mode.gesture(p.path);
      setTimeout(function () { if (cur === W && !pts().length) W.actor.lookAt(camEye(), 0.5); }, 600);
    }
    cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
    cv.addEventListener("wheel", function (e) { e.preventDefault(); E.cam.dist = cl(E.cam.dist * (1 + e.deltaY * 0.001), W.camMin || 0.6, W.camMax || 4); }, {passive: false});
  }
  function faceCam(a) { var e = camEye(); a.yaw = Math.atan2(e[0] - a.x, e[2] - a.z); }
  function camEye() { var W = cur; return W ? W.E.eye.slice() : [0, 1, 2]; }
  function recenter() { var W = cur; if (!W) return; var c = W.camHome || {yaw: 0.35, pitch: 0.32, dist: 1.6}; W.camTo = {yaw: c.yaw, pitch: c.pitch, dist: c.dist}; }
  function camStep(dt, target) {
    var W = cur, c = W.E.cam;
    if (target) { c.target[0] += (target[0] - c.target[0]) * Math.min(1, dt * 3); c.target[1] += (target[1] - c.target[1]) * Math.min(1, dt * 3); c.target[2] += (target[2] - c.target[2]) * Math.min(1, dt * 3); }
    if (W.camTo) { var k = Math.min(1, dt * 5); c.yaw += (W.camTo.yaw - c.yaw) * k; c.pitch += (W.camTo.pitch - c.pitch) * k; c.dist += (W.camTo.dist - c.dist) * k; if (Math.abs(W.camTo.dist - c.dist) < 0.005) W.camTo = null; }
  }
  /* caricias y toques */
  function pet(h, kind) {
    var W = cur, pt = W.pt, a = W.actor, r = PetSim.touch(pt, h.zone, kind);
    if (r.r === "wake") { PetSim.wake(pt); a.clip = null; a.play("yawn"); a.say("blink", 1); a.baseExpr = PetSim.expr(pt); say(tr("¡Se ha despertado!")); return; }
    if (r.r === "sleepy") { fx("zz", null, 1); return; }
    if (r.r === "love") { a.say("love", 1.2); fx("heart", h.p, 2); if (!a.clip) a.play(h.zone === "belly" ? "happy" : "nuzzle"); sfx("pop"); hap("tap"); if (r.found) say(tr("¡Ahí le encanta!"), 2.4); }
    else if (r.r === "ok") { a.say(Math.random() < 0.5 ? "happy" : "content", 0.9); fx("heart", h.p, 1); if (!a.clip && Math.random() < 0.3) a.play("happy"); }
    else if (r.r === "dislike") { a.say("angry", 1); if (!a.clip) a.play("shake"); say(tr("Ahí no le gusta…")); hap("bad"); }
    else if (r.r === "enough") { a.say("content", 1); if (!a.clip) a.play("stretch"); }
    else if (r.r === "annoyed") { a.say("angry", 0.8); a.yaw += 0.6; }
    else if (r.r === "curious") { a.say("curious", 1); a.lookAt(camEye(), 1); sfx("tap"); try { PetAudio.voice(pt.k, PetSim.stage(pt)); } catch (e) {} }
    a.mood = pt.mood; hud();
  }

  /* ===================== interfaz ===================== */
  var BAR = [["home", "🏡", N_("Casa")], ["care", "🍖", N_("Cuidar")], ["play", "🎾", N_("Jugar")], ["train", "⭐", N_("Trucos")], ["dress", "👕", N_("Vestir")], ["out", "🧭", N_("Salir")]];
  function bar(active) {
    var W = cur; W.el.querySelector(".pw-bar").innerHTML = BAR.map(function (b) { return '<button data-pw="mode" data-v="' + b[0] + '"' + (active === b[0] ? ' aria-current="page"' : "") + '><span aria-hidden="true">' + b[1] + "</span>" + esc(tr(b[2])) + "</button>"; }).join("");
  }
  function panel(html) { var W = cur; if (!W) return; var p = W.el.querySelector(".pw-panel"); p.innerHTML = html || ""; p.classList.toggle("on", !!html); }
  function setMode(m, arg) {
    var W = cur; if (!W) return;
    if (W.mode && W.mode.exit) W.mode.exit();
    W.ball = null; W.props = []; W.actor.mouth = null;
    var M = MODES[m] || MODES.home; W.modeK = m; W.mode = M;
    bar(M.bar || m);
    W.camMin = 0.6; W.camMax = 4;
    M.enter(arg);
    hud();
  }
  function action(a, v, b) {
    var W = cur; if (!W) return;
    if (a === "x") { close(); return; }
    if (a === "mode") { if (v === W.modeK && v !== "home") v = "home"; setMode(v); return; }
    if (W.mode && W.mode.act) W.mode.act(a, v, b);
  }
  function money() { return S && S.p ? fmtMoney(S.p.money) : ""; }
  function owned(id) { return PetSim.has(id); }
  function invN(id) { return PetSim.inv()[id] || 0; }

  /* ===================== escenas ===================== */
  function scene(kind, o) {
    var W = cur, E = W.E;
    E.batches.slice().forEach(function (b) { E.removeStatic(b.id); });
    PetProps.scene(kind, {season: W.season, night: W.tod === "night", route: o && o.route}).forEach(function (s) { E.addStatic(s.id, s.verts, {floor: s.floor}); });
    E.reflect = W.season === 3 || W.season === 2 ? PetStyle.REFLECT : kind === "show" || kind === "wardrobe" ? 0.5 : 0;
  }
  function homeProps() {
    var W = cur, pt = W.pt, dec = PetSim.decor(pt), out = [];
    Object.keys(dec).forEach(function (id) {
      var d = null; PET_DECOR.forEach(function (x) { if (x.id === id) d = x; }); if (!d) return;
      var lv = id === "bowl_food" ? (W.bowlF || 0) : id === "bowl_water" ? (pt.n.thi > 60 ? 1 : 0.3) : null;
      out.push({id: id, m: PetProps.prop(d.model, lv != null ? {level: lv} : null), x: dec[id][0] * 2, z: dec[id][1] * 2, y: 0});
    });
    W.props = out;
  }
  /* encuadre según el tamaño de la mascota (una tarántula no se ve igual que un capibara) */
  function fit(k, lo, hi) { var M = cur.actor.M, sz = Math.max(M.height, M.length * 0.8, cur.actor.plan === "fish" && cur.modeK !== "dress" && cur.modeK !== "shop" ? 0.3 : 0); return cl(sz * k, lo, hi); }
  function showY(d) { var M = cur.actor.M; return 0.16 + M.height * 0.45 - d * 0.14; }
  function propPos(id) { var W = cur; for (var i = 0; i < W.props.length; i++) if (W.props[i].id === id) return W.props[i]; return null; }

  /* idle: la mascota vive sola (pasea, olisquea, se rasca, mira a cámara, se tumba) */
  function idleBrain(dt) {
    var W = cur, a = W.actor, pt = W.pt;
    if (a.held || a.clip || a.goal || W.busy) { W.idleT = 0; return; }
    W.idleT = (W.idleT || 0) + dt;
    if (W.idleT < rnd(1.5, 4)) return;
    W.idleT = 0;
    var p = pt.pers, r = Math.random();
    if (pt.n.ene < 20 && r < 0.4) { a.play("yawn"); return; }
    if (r < 0.32 + p.act * 0.2) { var ang = rnd(0, 2 * PI), d = rnd(0.2, 0.6); a.moveTo(cl(Math.cos(ang) * d, -1, 1), cl(Math.sin(ang) * d, -0.7, 0.8), Math.random() < p.act * 0.4); return; }
    if (r < 0.5) { a.play(p.cur > 0.5 ? "sniff" : "stretch"); return; }
    if (r < 0.6 && a.plan === "quad") { a.play("scratch"); return; }
    if (r < 0.78) { a.lookAt(camEye(), 1); a.play("happy"); if (Math.random() < 0.4) { try { PetAudio.voice(pt.k, PetSim.stage(pt)); } catch (e) {} } return; }
    if (r < 0.88 && a.plan === "quad") { a.play("sit"); return; }
  }

  /* ===================== modos ===================== */
  var MODES = {};
  /* casa: jardín, mimos, llamar con un toque, cogerla en brazos si es pequeña */
  MODES.home = {
    bounds: [-1.2, -1, 1.2, 0.9],
    enter: function () {
      var W = cur; scene("home"); homeProps();
      var c = W.E.cam; var dh = fit(7.5, 1.4, 2.4); c.target = [0, 0.15, 0]; c.yaw = 0.35; c.pitch = 0.36; c.dist = dh; c.iso = false; W.camHome = {yaw: 0.35, pitch: 0.36, dist: dh};
      W.actor.lookAt(camEye(), 0.6);
      var pt = W.pt;
      panel('<div class="pw-row">' + [["photo", "📷", N_("Foto")], ["album", "🖼️", N_("Álbum")], ["iso", "🧊", N_("Vista")], ["deco", "🪴", N_("Decorar")], ["prefs", "⚙️", N_("Ajustes")]].map(function (b) { return '<button class="pw-chip" data-pw="' + b[0] + '"><span aria-hidden="true">' + b[1] + "</span>" + esc(tr(b[2])) + "</button>"; }).join("") + "</div>" +
        '<p class="pw-hint">' + esc(tr("Acaríciale con el dedo · toca el suelo para llamarle · arrastra para girar")) + "</p>");
      if (pt.sleep && !W.actor.clip) W.actor.play("sleep");
    },
    update: function (dt) { var W = cur; idleBrain(dt); camStep(dt, [W.actor.x * 0.5, 0.15, W.actor.z * 0.5]); if (W.actor.clip && W.actor.clip.n === "sleep" && Math.random() < dt * 0.6) fx("zz", null, 1); },
    tapGround: function (g) {
      var W = cur, a = W.actor;
      if (W.pt.sleep) return;
      if (W.decoPick) { if (PetSim.place(W.pt, W.decoPick, g[0] / 2, g[2] / 2)) { homeProps(); sfx("pop"); persist(); } W.decoPick = null; panelDeco(); return; }
      sfx("whistle"); a.clip = null; a.moveTo(cl(g[0], -1.1, 1.1), cl(g[2], -0.9, 0.85), true, function () { faceCam(a); a.lookAt(camEye(), 1); a.play("happy"); });
    },
    longPress: function (p) {
      var W = cur, a = W.actor; if (!a.small || W.pt.sleep) return;
      a.held = true; a.clip = null; a.goal = null; p.claimed = true; p.lift = true; a.say("surprised", 0.8); hap("tap");
      W.mode.move = function (pp) { var g = W.E.groundAt(pp.x, pp.y, 0.25); if (g) { a.x = cl(g[0], -1.1, 1.1); a.z = cl(g[2], -0.9, 0.85); } a.y = 0.25; };
      W.mode.up = function () { a.held = false; a.vy = 0; W.mode.move = null; W.mode.up = null; a.say("happy", 1); };
      a.y = 0.25;
    },
    onLand: function (a, v) { fx("dust", [a.x, 0, a.z], 6); sfx("bounce"); },
    act: function (k, v) {
      var W = cur;
      if (k === "photo") return photo();
      if (k === "album") return albumView();
      if (k === "iso") { W.E.cam.iso = !W.E.cam.iso; return; }
      if (k === "deco") return panelDeco();
      if (k === "decopick") { W.decoPick = v; cap(tr("Toca el jardín para colocarlo")); return; }
      if (k === "decodel") { PetSim.unplace(W.pt, v); homeProps(); panelDeco(); persist(); return; }
      if (k === "prefs") return prefsView();
      if (k === "q") { PetStyle.setQuality(v); prefsView(); cap(tr("Se aplicará al volver a entrar")); return; }
      if (k === "vol") { PetAudio.volume(+v); prefsView(); sfx("pop"); return; }
      if (k === "back") { setMode("home"); return; }
    }
  };
  function panelDeco() {
    var W = cur, dec = PetSim.decor(W.pt);
    var list = PET_DECOR.filter(function (d) { return d.fixed || owned(d.id); });
    panel('<div class="pw-h">' + esc(tr("Decorar el jardín")) + '</div><div class="pw-grid">' + list.map(function (d) {
      var on = !!dec[d.id];
      return '<div class="pw-item' + (on ? " on" : "") + '"><b>' + esc(tr(d.n)) + '</b><div class="pw-row">' + '<button class="btn" data-pw="decopick" data-v="' + d.id + '">' + esc(on ? tr("Mover") : tr("Colocar")) + "</button>" + (on && !d.fixed ? '<button class="btn" data-pw="decodel" data-v="' + d.id + '">' + esc(tr("Quitar")) + "</button>" : "") + "</div></div>";
    }).join("") + '</div><p class="pw-hint">' + esc(tr("Más decoración en la tienda.")) + '</p><button class="btn wide" data-pw="back">' + esc(tr("Listo")) + "</button>");
  }
  function prefsView() {
    var q = PetStyle.quality(), v = PetAudio.volume();
    panel('<div class="pw-h">' + esc(tr("Ajustes de la mascota")) + '</div><div class="lbl">' + esc(tr("Gráficos")) + '</div><div class="seg">' + [["auto", N_("Automático")], ["high", N_("Alta")], ["low", N_("Baja")]].map(function (x) { return '<button data-pw="q" data-v="' + x[0] + '" aria-pressed="' + (q === x[0]) + '">' + esc(tr(x[1])) + "</button>"; }).join("") + "</div>" +
      '<div class="lbl">' + esc(tr("Sonidos de la mascota")) + '</div><div class="seg">' + [[0, N_("No")], [0.35, N_("Bajo")], [0.7, N_("Medio")], [1, N_("Alto")]].map(function (x) { return '<button data-pw="vol" data-v="' + x[0] + '" aria-pressed="' + (Math.abs(v - x[0]) < 0.05) + '">' + esc(tr(x[1])) + "</button>"; }).join("") + "</div>" +
      '<button class="btn wide" data-pw="back">' + esc(tr("Listo")) + "</button>");
  }

  /* cuidar: comida, agua, baño, cepillo y cama */
  MODES.care = {
    bar: "care", bounds: MODES.home.bounds,
    enter: function () { MODES.home.enter(); careView(); },
    update: function (dt) {
      var W = cur, a = W.actor; MODES.home.update(dt);
      if (W.eating) { W.eating.t -= dt; W.bowlF = Math.max(0, W.eating.t / W.eating.d); if (Math.random() < dt * 3) sfx("munch"); if (W.eating.t <= 0) { W.eating = null; W.busy = false; a.clip = null; a.say("happy", 1.2); a.play("happy"); fx("heart", null, 2); homeProps(); hud(); } else if (Math.random() < dt * 2) homeProps(); }
      if (W.drinking) { W.drinking -= dt; if (Math.random() < dt * 4) sfx("slurp"); if (W.drinking <= 0) { W.drinking = 0; W.busy = false; a.clip = null; a.play("happy"); homeProps(); hud(); } }
      if (W.brushing) { var b = W.brushing; if (b.idle != null) b.idle += dt; }
    },
    onLand: MODES.home.onLand, tapGround: MODES.home.tapGround, longPress: MODES.home.longPress,
    down: function (p, h) { var W = cur; if (W.brushing && h) { p.brush = true; return true; } return false; },
    move: function (p, dx, dy) {
      var W = cur; if (!p.brush) return;
      var h = W.actor.hit(W.E, W.E.ray(p.x, p.y)); if (!h) return;
      var amt = Math.min(0.02, (Math.abs(dx) + Math.abs(dy)) / 4000), r = PetSim.brush(W.pt, amt);
      if (Math.random() < 0.5) fx("spark", h.p, 1); if (Math.random() < 0.25) sfx("brush");
      W.brushing.prop.M = MX.mul(MX.T(h.p[0], h.p[1] + 0.02, h.p[2]), MX.RY(W.actor.yaw));
      W.actor.say("content", 0.4);
      if (r.ok && r.shine >= 1 && !W.brushing.done) { W.brushing.done = true; sfx("sparkle"); cap(tr("¡Brilla como nunca!")); fx("star", null, 4); }
      var bar2 = W.el.querySelector(".pw-prog i"); if (bar2) bar2.style.width = Math.round(W.pt.shine * 100) + "%";
    },
    up: function () {},
    act: function (k, v) {
      var W = cur, pt = W.pt, a = W.actor;
      if (k === "food") {
        if (pt.sleep) return cap(tr("Está durmiendo"));
        var r = PetSim.feed(pt, v);
        if (r.full) return say(tr("¡Está lleno!"));
        if (!r.ok) return;
        var bp = propPos("bowl_food"); W.bowlF = 1; homeProps(); if (bp) fx("kibble", [bp.x, 0, bp.z], 10); sfx("pop");
        W.busy = true; a.clip = null;
        a.moveTo(bp ? bp.x : 0.3, (bp ? bp.z : 0.2) + 0.12, true, function () { a.yaw = PI; a.play("eat"); W.eating = {t: 3, d: 3}; if (r.fav) { say(tr("¡Su comida favorita!")); fx("heart", null, 3); } });
        careView(); persist(); return;
      }
      if (k === "water") {
        var rw = PetSim.water(pt); if (rw.full) return say(tr("No tiene sed")); homeProps(); sfx("splash");
        var wp = propPos("bowl_water"); W.busy = true; a.clip = null;
        a.moveTo(wp ? wp.x : 0.4, (wp ? wp.z : 0.3) + 0.12, false, function () { a.yaw = PI; a.play("drink"); W.drinking = 2.4; });
        persist(); return;
      }
      if (k === "bath") { setMode("bath"); return; }
      if (k === "brush") {
        if (!invN("brush")) { cap(tr("Necesitas un cepillo: lo tienes en la tienda.")); return; }
        W.brushing = {prop: {m: PetProps.prop("brush"), x: 0, z: 0, M: MX.T(0, -1, 0)}}; W.props.push(W.brushing.prop); W.noPetSave = true;
        a.clip = null; a.goal = null; a.moveTo(0, 0, false, function () { faceCam(a); a.lookAt(camEye(), 1); });
        panel('<div class="pw-h">' + esc(tr("Cepíllale con el dedo")) + '</div><div class="pw-prog"><i style="width:' + Math.round((pt.shine || 0) * 100) + '%"></i></div><button class="btn wide" data-pw="brushend">' + esc(tr("Listo")) + "</button>");
        return;
      }
      if (k === "brushend") { W.brushing = null; homeProps(); careView(); persist(); return; }
      if (k === "bed") {
        var rb = PetSim.toSleep(pt); if (rb.awake) { say(tr("¡No tiene sueño!")); a.play("happy"); return; }
        var bp2 = propPos("bed"); a.clip = null; a.moveTo(bp2 ? bp2.x : -0.9, bp2 ? bp2.z : 0.4, false, function () { a.play("sleep"); a.baseExpr = "sleep"; fx("zz", null, 2); });
        persist(); careView(); return;
      }
      if (k === "wake") { PetSim.wake(pt); a.clip = null; a.play("yawn"); a.baseExpr = PetSim.expr(pt); careView(); return; }
      if (k === "shop") { setMode("shop", "care"); return; }
    }
  };
  function careView() {
    var W = cur, pt = W.pt, inv = PetSim.inv();
    var foods = PET_FOOD.filter(function (f) { return inv[f.id] > 0; });
    var s = '<div class="pw-h">' + esc(tr("Cuidados")) + "</div>";
    s += '<div class="pw-row">' + foods.map(function (f) { return '<button class="pw-chip" data-pw="food" data-v="' + f.id + '"><span class="pw-dot" style="background:' + f.col + '"></span>' + esc(tr(f.n)) + " ×" + inv[f.id] + "</button>"; }).join("") +
      (foods.length ? "" : '<button class="pw-chip" data-pw="shop">🛍️ ' + esc(tr("Comprar comida")) + "</button>") + "</div>";
    s += '<div class="pw-row"><button class="pw-chip" data-pw="water">💧 ' + esc(tr("Agua")) + '</button><button class="pw-chip" data-pw="bath">🛁 ' + esc(tr("Baño")) + (invN("shampoo") ? " ×" + invN("shampoo") : "") + '</button><button class="pw-chip" data-pw="brush">✨ ' + esc(tr("Cepillar")) + "</button>" +
      (pt.sleep ? '<button class="pw-chip" data-pw="wake">☀️ ' + esc(tr("Despertar")) + "</button>" : '<button class="pw-chip" data-pw="bed">🛏️ ' + esc(tr("A dormir")) + "</button>") + "</div>";
    panel(s);
  }

  /* baño: frotar con la esponja (espuma y la suciedad se va), aclarar con la ducha y sacudirse */
  MODES.bath = {
    bar: "care", noPet: true, noOrbit: false, bounds: [-0.25, -0.2, 0.25, 0.2],
    enter: function () {
      var W = cur, a = W.actor; scene("home"); W.props = [{id: "tub", m: PetProps.prop("tub"), x: 0, z: 0, y: 0}];
      a.x = 0; a.z = 0; a.yaw = 0.3; a.clip = null; a.goal = null; a.y = 0; a.dirt = W.pt.dirt || 0; W.bath = {p: 0, step: 0, foam: 0};
      var c = W.E.cam; var db = fit(6, 1.0, 1.7); c.target = [0, 0.12, 0]; c.dist = db; c.pitch = 0.62; c.yaw = 0.2; W.camHome = {yaw: 0.2, pitch: 0.62, dist: db};
      if (W.pt.pers.ind > 0.65 && W.pt.k !== "dog") { a.say("angry", 1.5); say(tr("No le hace mucha gracia…")); }
      bathPanel();
    },
    update: function (dt) { var W = cur, a = W.actor; a.y = 0.04; if (W.bath.step === 2) { a.wet = 1; } else a.wet = Math.max(0, a.wet - dt * 0.25); camStep(dt, [0, 0.2, 0]); if (W.bath.step === 1 && W.showerOn) { var hp = a.anchor("head_top"); for (var i = 0; i < 3; i++) W.E.spawn({x: hp[0] + rnd(-0.08, 0.08), y: hp[1] + 0.3, z: hp[2] + rnd(-0.08, 0.08), vy: -2, life: 0.3, s: 0.008, c: "#a8d8ff"}); } },
    down: function (p, h) { if (h) { p.scrub = true; return true; } return false; },
    move: function (p, dx, dy) {
      var W = cur, B = W.bath; if (!p.scrub) return;
      var h = W.actor.hit(W.E, W.E.ray(p.x, p.y)); if (!h) return;
      if (B.step === 0) {
        B.p = Math.min(1, B.p + (Math.abs(dx) + Math.abs(dy)) / 2600); fx("foam", h.p, 2); if (Math.random() < 0.3) sfx("scrub"); if (Math.random() < 0.15) sfx("bubble");
        var d0 = W.pt.dirt || 0; W.actor.dirt = Math.max(0, Math.round(d0 * (1 - B.p) + 0.49 - 0.49 * B.p * 2)); if (B.p > 0.95) W.actor.dirt = 0;
        W.actor.say(W.pt.pers.ind > 0.65 && W.pt.k !== "dog" ? "angry" : "content", 0.4);
        if (B.p >= 1) { B.step = 1; sfx("sparkle"); bathPanel(); }
        var bi = W.el.querySelector(".pw-prog i"); if (bi) bi.style.width = Math.round(B.p * 100) + "%";
      } else if (B.step === 1) { W.showerOn = true; B.r = (B.r || 0) + (Math.abs(dx) + Math.abs(dy)) / 1800; if (Math.random() < 0.2) sfx("splash"); if (B.r >= 1) { B.step = 2; W.showerOn = false; bathPanel(); } var bj = W.el.querySelector(".pw-prog i"); if (bj) bj.style.width = Math.round(Math.min(1, B.r) * 100) + "%"; }
    },
    up: function () { cur.showerOn = false; },
    act: function (k) {
      var W = cur, a = W.actor;
      if (k === "dry") {
        a.play("shake", {done: function () { a.wet = 0.4; a.say("happy", 1.4); a.play("happy"); fx("star", null, 3); sfx("success"); var r = PetSim.bathDone(W.pt, true); a.dirt = 0; W.bath.step = 3; persist(); hud(); bathPanel(r); }});
        var hp = a.anchor("back"); for (var i = 0; i < 30; i++) fx("drop", hp, 1); sfx("splash"); return;
      }
      if (k === "back") { setMode("care"); }
    }
  };
  function bathPanel(r) {
    var B = cur.bath, s = '<div class="pw-h">' + esc(tr("Hora del baño")) + "</div>";
    if (B.step === 0) s += '<p class="pw-hint">' + esc(tr("Frota con el dedo para hacer espuma.")) + '</p><div class="pw-prog"><i style="width:' + Math.round(B.p * 100) + '%"></i></div>';
    else if (B.step === 1) s += '<p class="pw-hint">' + esc(tr("Ahora aclara: pasa el dedo por encima para la ducha.")) + '</p><div class="pw-prog"><i style="width:0%"></i></div>';
    else if (B.step === 2) s += '<p class="pw-hint">' + esc(tr("¡Que se sacuda!")) + '</p><button class="go" data-pw="dry">' + esc(tr("Sacudirse")) + "</button>";
    else s += '<p class="pw-hint">' + esc(r && !r.shampoo ? tr("Limpio, aunque con champú quedaría perfecto.") : tr("¡Limpio y oliendo de maravilla!")) + '</p><button class="btn wide" data-pw="back">' + esc(tr("Volver")) + "</button>";
    panel(s);
  }

  /* jugar: lanzar pelota o disco y que lo traiga; cuerda para tirar; peluche */
  function ballPhys(dt) {
    var W = cur, b = W.ball; if (!b || b.held) return;
    var fr = b.kind === "frisbee";
    b.vy -= (fr ? 2.5 : 9.8) * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt; b.rot = (b.rot || 0) + Math.hypot(b.vx, b.vz) * dt * 12;
    if (b.y < b.r) { b.y = b.r; if (Math.abs(b.vy) > 0.6) { sfx("bounce"); fx("dust", [b.x, 0, b.z], 3); } b.vy = -b.vy * (fr ? 0.1 : 0.5); b.vx *= fr ? 0.5 : 0.8; b.vz *= fr ? 0.5 : 0.8; }
    var B = MODES.home.bounds; if (b.x < B[0] - 0.2 || b.x > B[2] + 0.2) { b.vx = -b.vx * 0.6; b.x = cl(b.x, B[0] - 0.2, B[2] + 0.2); } if (b.z < B[1] - 0.2 || b.z > B[3] + 0.2) { b.vz = -b.vz * 0.6; b.z = cl(b.z, B[1] - 0.2, B[3] + 0.2); }
  }
  MODES.play = {
    bounds: MODES.home.bounds,
    enter: function () { MODES.home.enter(); playView(); },
    update: function (dt) {
      var W = cur, a = W.actor, b = W.ball, pt = W.pt;
      camStep(dt, [a.x * 0.5, 0.15, a.z * 0.5]);
      if (!b) { idleBrain(dt); return; }
      ballPhys(dt);
      if (b.state === "fly" && b.y < 0.2 && Math.hypot(b.vx, b.vz) < 3) {
        if (!a.goal && !a.clip && !a.held) { if (pt.n.ene < 12) { b.state = "rest"; a.play("lie"); say(tr("Está muy cansado…")); return; } a.moveTo(b.x, b.z, true); a.lookAt([b.x, 0, b.z], 1); b.state = "chase"; }
      }
      if (b.state === "chase") {
        a.goal && (a.goal.x = b.x, a.goal.z = b.z);
        var mz = a.anchor("face");
        if (Math.hypot(mz[0] - b.x, mz[2] - b.z) < 0.08 + a.M.length * 0.2 && b.y < 0.15) {
          b.show = false; b.state = "carry"; a.mouth = b.m; a.goal = null; sfx("pop");
          var cam = camEye(), dx = cam[0] - a.x, dz = cam[2] - a.z, d = Math.hypot(dx, dz) || 1;
          a.moveTo(cl(a.x + dx / d * Math.max(0, d - 0.55), -1, 1), cl(a.z + dz / d * Math.max(0, d - 0.55), -0.8, 0.8), true, function () {
            a.mouth = null; b.show = true; var f = a.anchor("face"); b.x = f[0]; b.z = f[2]; b.y = 0.05; b.vx = b.vy = b.vz = 0; b.state = "rest";
            var r = PetSim.play(pt, W.toyId, true); faceCam(a); a.lookAt(camEye(), 1); a.say("excited", 1.2); a.play("happy"); fx("heart", null, r.fav ? 3 : 1); hud(); persist();
          });
        }
      }
    },
    draw: function () {},
    down: function (p) { var W = cur, b = W.ball; if (!b || b.state === "chase" || b.state === "carry") return false; var s = W.E.project([b.x, b.y, b.z]); if (Math.hypot(s.x - p.x, s.y - p.y) < 44) { p.ballGrab = true; b.held = true; b.state = "held"; return true; } return false; },
    move: function (p) { var W = cur, b = W.ball; if (!p.ballGrab) return; var g = W.E.groundAt(p.x, p.y, 0.15); if (g) { b.x = g[0]; b.z = g[2]; b.y = 0.15; } },
    up: function (p) {
      var W = cur, b = W.ball; if (!p.ballGrab) return; b.held = false;
      var P = p.path, n = P.length, i = Math.max(0, n - 6), dtp = Math.max(16, P[n - 1][2] - P[i][2]) / 1000, sx = (P[n - 1][0] - P[i][0]) / dtp, sy = (P[n - 1][1] - P[i][1]) / dtp;
      var c = W.E.cam, yaw = c.yaw, fwd = -sy * 0.0032, side = sx * 0.0032;
      b.vx = -Math.sin(yaw) * fwd + Math.cos(yaw) * side; b.vz = -Math.cos(yaw) * fwd - Math.sin(yaw) * side; b.vy = cl(Math.hypot(fwd, side) * 0.9, 0.5, 4) * (b.kind === "frisbee" ? 0.5 : 1);
      var sp = Math.hypot(b.vx, b.vz); if (sp > 4) { b.vx *= 4 / sp; b.vz *= 4 / sp; }
      if (sp < 0.3) { b.vx = -Math.sin(yaw) * 1.2; b.vz = -Math.cos(yaw) * 1.2; b.vy = 1.4; }
      b.state = "fly"; sfx("kick"); W.actor.say("excited", 1); W.actor.lookAt([b.x, b.y, b.z], 1);
    },
    tapGround: MODES.home.tapGround, longPress: MODES.home.longPress, onLand: MODES.home.onLand,
    act: function (k, v) {
      var W = cur, a = W.actor;
      if (k === "toy") {
        W.toyId = v; var it = petItem(v), kind = it.model;
        if (kind === "rope" || kind === "plush") { W.ball = null; a.clip = null; a.moveTo(0, 0.3, true, function () { a.mouth = PetProps.prop(kind); a.play(kind === "rope" ? "shake" : "happy", {done: function () { a.mouth = null; var r = PetSim.play(W.pt, v, true); fx("heart", null, r.fav ? 3 : 1); a.say("happy", 1); hud(); persist(); }}); }); return; }
        var m = PetProps.prop(kind), c = W.E.cam;
        W.ball = {m: m, kind: kind, x: c.target[0] + Math.sin(c.yaw) * 0.5, z: c.target[2] + Math.cos(c.yaw) * 0.5, y: 0.05, vx: 0, vy: 0, vz: 0, r: kind === "frisbee" ? 0.02 : 0.05, show: true, state: "rest"};
        cap(tr("Arrastra el juguete y suéltalo para lanzarlo")); return;
      }
      if (k === "photo") return photo();
      if (k === "shop") return setMode("shop", "play");
    }
  };
  function playView() {
    var toys = PET_TOYS.filter(function (t) { return owned(t.id) || t.id === "toy_ball"; });
    panel('<div class="pw-h">' + esc(tr("Jugar")) + '</div><div class="pw-row">' + toys.map(function (t) { return '<button class="pw-chip" data-pw="toy" data-v="' + t.id + '">' + esc(tr(t.n)) + "</button>"; }).join("") + '<button class="pw-chip" data-pw="photo">📷 ' + esc(tr("Foto")) + '</button><button class="pw-chip" data-pw="shop">🛍️ ' + esc(tr("Más juguetes")) + "</button></div>");
  }

  /* trucos: orden (botón o gesto en pantalla), intento con resultado y premio a tiempo */
  var GEST_ICO = {down: "⬇️", down2: "⏬", right: "➡️", left: "⬅️", up: "⬆️", circle: "🔄", circle2: "🔁", zig: "〰️", tap2: "👆👆", upup: "⏫", rightright: "⏩", wave: "🌊", downup: "↕️", leftright: "↔️", slash: "↘️", loop: "➰", downleft: "↙️", star: "⭐", heart: "💗"};
  function readGesture(path) {
    if (path.length < 4) return null;
    var x0 = path[0][0], y0 = path[0][1], x1 = path[path.length - 1][0], y1 = path[path.length - 1][1], dx = x1 - x0, dy = y1 - y0, len = 0, turn = 0, pa = null;
    for (var i = 1; i < path.length; i++) { var ex = path[i][0] - path[i - 1][0], ey = path[i][1] - path[i - 1][1], l = Math.hypot(ex, ey); if (l < 2) continue; len += l; var aa = Math.atan2(ey, ex); if (pa != null) { var d = aa - pa; while (d > PI) d -= 2 * PI; while (d < -PI) d += 2 * PI; turn += d; } pa = aa; }
    if (len < 40) return null;
    if (Math.abs(turn) > 5 && Math.hypot(dx, dy) < len * 0.35) return "circle";
    if (Math.abs(dx) > Math.abs(dy) * 1.6) return dx > 0 ? "right" : "left";
    if (Math.abs(dy) > Math.abs(dx) * 1.6) return dy > 0 ? "down" : "up";
    return dx > 0 && dy > 0 ? "slash" : dx < 0 && dy > 0 ? "downleft" : null;
  }
  MODES.train = {
    bounds: [-0.6, -0.4, 0.6, 0.5],
    enter: function () {
      var W = cur, a = W.actor; MODES.home.enter(); W.train = {k: null, wait: 0};
      a.clip = null; a.moveTo(0, 0.2, false, function () { faceCam(a); a.lookAt(camEye(), 1); });
      var c = W.E.cam; var dt2 = fit(6.5, 1.1, 1.9); W.camTo = {yaw: 0, pitch: 0.3, dist: dt2}; W.camHome = {yaw: 0, pitch: 0.3, dist: dt2};
      if (W.pt.sleep) { PetSim.wake(W.pt); a.play("yawn"); }
      trainView();
    },
    update: function (dt) {
      var W = cur, T2 = W.train, a = W.actor; camStep(dt, [a.x, 0.16, a.z]);
      if (T2.wait > 0) { T2.wait -= dt; if (T2.wait <= 0) doTrick(); }
      if (T2.win > 0) { T2.win -= dt; if (T2.win <= 0) { T2.win = 0; trainView(); } }
      if (!a.clip && !a.goal && !T2.k) { W.idleT = (W.idleT || 0) + dt; if (W.idleT > 5) { W.idleT = 0; a.play(Math.random() < 0.5 ? "sniff" : "happy"); } }
    },
    gesture: function (path) {
      var g = readGesture(path); if (!g) return;
      var W = cur, list = PetSim.tricks(W.pt).filter(function (t) { return t.g === g; });
      if (list.length) command(list[0].k); else cap(tr("No conoce esa señal"));
    },
    tapPet: function (h) { var W = cur; if (W.train.win > 0) { reward("pat"); return; } pet(h, "poke"); },
    act: function (k, v) {
      if (k === "cmd") return command(v);
      if (k === "rew") return reward(v);
      if (k === "list") return trainView(true);
    }
  };
  function command(k) {
    var W = cur, T2 = W.train, a = W.actor; if (T2.wait > 0 || (a.clip && a.clip.n !== "sitHold")) return;
    T2.k = k; T2.wait = 0.55 + Math.random() * 0.3; T2.win = 0; a.clip = null; a.lookAt(camEye(), 1);
    var t = petTrick(k); cap((GEST_ICO[t.g] || "") + " " + tr(t.n), 1.2); sfx("whistle");
    W.idleT = 0;
  }
  function doTrick() {
    var W = cur, T2 = W.train, a = W.actor, pt = W.pt, k = T2.k, r = PetSim.trickTry(pt, k);
    if (r.r === "tired" || r.r === "sleep") { say(tr("Está muy cansado…")); a.play("yawn"); T2.k = null; return; }
    var clip = k === "dead" ? "dead" : k === "lie" ? "lie" : k;
    if (r.r === "ok") { if (PetRig.CLIPS[clip].ball) trickBall(k); a.play(clip, {done: function () { T2.win = 2.5; a.say("excited", 1); trainView(); }}); }
    else if (r.r === "half") { a.play("halfsit", {done: function () { T2.win = 2.5; trainView(); }}); say(tr("Casi…")); }
    else if (r.r === "other") { var oc = r.other === "dead" ? "dead" : r.other; a.play(PetRig.CLIPS[oc] ? oc : "spin", {done: function () { T2.k = null; trainView(); }}); say(tr("Ha hecho otro truco")); }
    else if (r.r === "distracted") { a.play("distract", {done: function () { T2.k = null; trainView(); }}); say(tr("Se ha despistado")); a.say("curious", 1.2); }
    else { a.play("fall", {done: function () { T2.k = null; trainView(); }}); a.say("dizzy", 1); say(tr("¡Uy! Casi")); }
    hud();
  }
  function trickBall(k) {
    var W = cur, a = W.actor, f = a.anchor("face"), m = PetProps.prop("ball");
    var b = W.ball = {m: m, kind: "ball", x: f[0], y: 0.5, z: f[2], vx: 0, vy: 0, vz: 0, r: 0.05, show: true, state: "trick", t: 0};
    if (k === "pass" || k === "control" || k === "save") { var cam = camEye(); b.x = a.x + (cam[0] - a.x) * 0.4; b.z = a.z + (cam[2] - a.z) * 0.4; b.y = 0.05; if (k === "save") { b.vx = 1.2; b.vy = 0.8; b.x -= 0.4; } else if (k === "control") { b.vx = (a.x - b.x) * 1.6; b.vz = (a.z - b.z) * 1.6; } }
    if (k === "nose" || k === "juggle") { var hd = a.anchor("head_top"); b.x = hd[0]; b.z = hd[2]; b.y = hd[1] + 0.12; b.vy = 1.2; }
    if (k === "dribble") { b.y = 0.05; }
    W.trickBallK = k;
    W.mode.draw = function (dt) {
      var bb = W.ball; if (!bb) return; bb.t += dt;
      if (W.trickBallK === "nose" || W.trickBallK === "juggle") { var hd2 = a.anchor("head_top"); bb.vy -= 9.8 * dt; bb.y += bb.vy * dt; bb.x += (hd2[0] - bb.x) * dt * 8; bb.z += (hd2[2] - bb.z) * dt * 8; if (bb.y < hd2[1] + 0.05 && bb.vy < 0) { bb.vy = 1.6; sfx("bounce"); } }
      else if (W.trickBallK === "dribble") { var fc = a.anchor("face"); bb.x += (fc[0] - bb.x) * dt * 10; bb.z += (fc[2] - bb.z) * dt * 10; bb.y = 0.05; bb.rot += dt * 10; }
      else if (W.trickBallK === "pass" && bb.t > 0.5 && !bb.kicked) { bb.kicked = true; var cam2 = camEye(); bb.vx = (cam2[0] - bb.x) * 1.2; bb.vz = (cam2[2] - bb.z) * 1.2; bb.vy = 0.6; sfx("kick"); ballPhys(dt); }
      else if (W.trickBallK === "header" && bb.t > 0.45 && !bb.kicked) { bb.kicked = true; bb.vz = 1.5; bb.vy = 2; sfx("kick"); }
      else ballPhys(dt);
      if (bb.t > 3.4) { W.ball = null; W.mode.draw = null; }
    };
  }
  function reward(kind) {
    var W = cur, T2 = W.train, a = W.actor, pt = W.pt; if (!T2.k) return;
    var r = PetSim.reward(pt, T2.k, kind === "treat" ? "treat" : "pat"); T2.win = 0;
    if (r.wasted) { a.say("curious", 1); }
    else if (r.ok) {
      a.say("love", 1.2); fx("heart", null, 2); sfx(kind === "treat" ? "munch" : "pop"); hap("ok");
      if (r.up && r.tier === 3) { cap(tr("¡Truco dominado!"), 3); fx("star", null, 5); sfx("success"); }
      else if (r.up && r.tier === 2) cap(tr("¡Ya casi lo domina!"), 2.6);
      else if (r.capped) cap(tr("Por hoy ya ha aprendido bastante. Mañana, más."), 3);
    }
    T2.k = null; a.play("happy"); trainView(); hud(); persist();
  }
  function trainView() {
    var W = cur, pt = W.pt, T2 = W.train, inv = PetSim.inv();
    if (T2 && T2.win > 0) {
      panel('<div class="pw-h">' + esc(tr("¡Prémiale ya!")) + '</div><div class="pw-row"><button class="go" data-pw="rew" data-v="pat">💗 ' + esc(tr("Caricia")) + '</button><button class="go" data-pw="rew" data-v="treat"' + ((inv.treat_bone || inv.treat) ? "" : " disabled") + ">🦴 " + esc(tr("Premio")) + ((inv.treat_bone || 0) + (inv.treat || 0) ? " ×" + ((inv.treat_bone || 0) + (inv.treat || 0)) : "") + "</button></div>");
      return;
    }
    var list = PetSim.tricks(pt), locked = PET_TRICKS2.filter(function (t) { return t.bond && pt.bond < t.bond; });
    var cats = [["b", N_("Básicos")], ["f", N_("Futboleros")], ["s", N_("Especiales")]];
    var s = '<div class="pw-h">' + esc(tr("Trucos")) + '</div><p class="pw-hint">' + esc(tr("Da la orden y prémiale justo después de que lo haga. Practicad en días distintos.")) + "</p>";
    cats.forEach(function (c) {
      var L = list.filter(function (t) { return t.cat === c[0]; }); if (!L.length) return;
      s += '<div class="lbl">' + esc(tr(c[1])) + '</div><div class="pw-grid tricks">' + L.map(function (t) { var m = PetSim.trickLv(pt, t.k), tier = PetSim.tier(m); return '<button class="pw-trick t' + tier + '" data-pw="cmd" data-v="' + t.k + '"><span aria-hidden="true">' + (GEST_ICO[t.g] || "") + "</span><b>" + esc(tr(t.n)) + "</b><small>" + esc(tr(TIER_TXT[tier])) + '</small><i class="pw-dots" aria-hidden="true">' + "●●●".slice(0, tier) + "○○○".slice(tier) + "</i></button>"; }).join("") + "</div>";
    });
    if (locked.length) s += '<p class="pw-hint">' + esc(tr("Con más vínculo aprenderá trucos especiales.")) + "</p>";
    s += '<p class="pw-hint">' + esc(tr("También puedes dibujar la señal en la pantalla.")) + "</p>";
    panel(s);
  }

  /* vestidor: pedestal giratorio, ranuras, color y nombre */
  MODES.dress = {
    noPet: false,
    enter: function () {
      var W = cur, a = W.actor; scene("wardrobe"); W.props = [{id: "ped", m: PetProps.prop("pedestal"), x: 0, z: 0, y: 0}];
      a.x = 0; a.z = 0; a.yaw = 0; a.clip = null; a.goal = null; a.play("sitHold");
      var c = W.E.cam; var dd = fit(6, 1.0, 1.8); c.target = [0, showY(dd), 0]; c.yaw = 0; c.pitch = 0.2; c.dist = dd; W.camHome = {yaw: 0, pitch: 0.2, dist: dd}; W.slot = W.slot || "h";
      dressView();
    },
    update: function (dt) { var W = cur, a = W.actor; a.y = 0.16; if (!W.ptrs || !Object.keys(W.ptrs).length) W.E.cam.yaw += dt * 0.25; if (!a.clip) a.play("sitHold"); camStep(dt, null); },
    act: function (k, v) {
      var W = cur, a = W.actor, pt = W.pt;
      if (k === "slot") { W.slot = v; dressView(); return; }
      if (k === "wear") {
        PetSim.wear(pt, v); a.setAcc(pt.eq);
        if (pt.eq[petItem(v).s] === v) { var lk = PetSim.accLike(pt, v); if (lk > 0) { a.say("love", 1.4); fx("heart", null, 3); say(tr("¡Le encanta!")); sfx("sparkle"); a.clip = null; a.play("happy"); } else if (lk < 0) { a.say("angry", 1.2); a.clip = null; a.play("shake"); say(tr("No le convence…")); } else { a.say("happy", 0.8); sfx("pop"); } }
        dressView(); persist(); return;
      }
      if (k === "col") { if (petSetCol(v)) { refreshActor(); W.actor.play("sitHold"); W.actor.y = 0.16; dressView(); persist(); } return; }
      if (k === "name") { var i = W.el.querySelector("#pwrn"); if (i && petRename(i.value)) { hud(); cap(tr("Ahora se llama {pet}.", {pet: pt.nm})); persist(); } return; }
      if (k === "shop") return setMode("shop", "dress");
    }
  };
  function dressView() {
    var W = cur, pt = W.pt, sl = W.slot, s = '<div class="pw-tabs" role="tablist">' + PET_SLOTS2.map(function (x) { return '<button role="tab" data-pw="slot" data-v="' + x[0] + '" aria-selected="' + (sl === x[0]) + '">' + esc(tr(x[1])) + "</button>"; }).join("") + '<button role="tab" data-pw="slot" data-v="col" aria-selected="' + (sl === "col") + '">' + esc(tr("Pelaje")) + "</button></div>";
    if (sl === "col") {
      s += '<div class="pw-row">' + PET_COL.filter(function (c) { return petColOk(c); }).map(function (c) { return '<button class="pw-chip" data-pw="col" data-v="' + c[0] + '" aria-pressed="' + (pt.col === c[0]) + '">' + esc(tr(c[1])) + "</button>"; }).join("") + "</div>";
      s += '<div class="pw-row"><input id="pwrn" maxlength="16" value="' + esc(pt.nm) + '" aria-label="' + esc(tr("Nombre")) + '"><button class="btn" data-pw="name">' + esc(tr("Cambiar nombre")) + "</button></div>";
    } else {
      var items = PET_ACC2.filter(function (a) { return a.s === sl; }), have = items.filter(function (a) { return owned(a.id); }), locked = items.filter(function (a) { return !owned(a.id) && a.un; });
      s += '<div class="pw-grid">' + have.map(function (a) { var on = pt.eq[sl] === a.id; return '<button class="pw-item r' + a.r + (on ? " on" : "") + '" data-pw="wear" data-v="' + a.id + '" aria-pressed="' + on + '"><b>' + esc(tr(a.n)) + "</b><small>" + esc(tr(PET_RARITY.filter(function (x) { return x[0] === a.r; })[0][1])) + "</small></button>"; }).join("") +
        locked.map(function (a) { return '<div class="pw-item locked"><b>🔒 ' + esc(tr(a.n)) + "</b><small>" + esc(tr(a.ud || "")) + "</small></div>"; }).join("") + "</div>";
      if (!have.length) s += '<p class="pw-hint">' + esc(tr("Todavía no tienes nada para esta parte.")) + "</p>";
      s += '<button class="btn wide" data-pw="shop">🛍️ ' + esc(tr("Ir a la tienda")) + "</button>";
    }
    panel(s);
  }

  /* salir: paseos, concursos, tienda */
  MODES.out = {
    enter: function () { MODES.home.enter(); outView(); },
    update: MODES.home.update, tapGround: MODES.home.tapGround, longPress: MODES.home.longPress, onLand: MODES.home.onLand,
    act: function (k, v) {
      if (k === "walk") return setMode("walk", v);
      if (k === "cont") return contView(v);
      if (k === "contgo") return setMode("contest", v);
      if (k === "shop") return setMode("shop", "out");
      if (k === "back") return outView();
    }
  };
  function outView() {
    var W = cur, pt = W.pt, s = '<div class="pw-h">' + esc(tr("Paseos")) + '</div>' + (PetSim.canWalk(pt) ? "" : '<p class="pw-hint">' + esc(tr("Prefiere quedarse en casa: nada de paseos.")) + "</p>") + '<div class="pw-grid">';
    s += PetSim.ROUTES.map(function (r) { var ok = PetSim.routeOk(pt, r), ready = PetSim.walkReady(pt, r.k); return '<button class="pw-item" data-pw="walk" data-v="' + r.k + '"' + (ok && ready ? "" : " disabled") + "><b>" + esc(tr(r.n)) + "</b><small>" + esc(!ok ? tr("Se desbloquea paseando") : ready ? tr("Listo para salir") : tr("Descansando del último paseo")) + "</small></button>"; }).join("");
    s += '</div><div class="pw-h">' + esc(tr("Concursos")) + '</div><div class="pw-grid">';
    s += PetSim.CONT.map(function (c) { var ok = PetSim.contOpen(pt, c), ready = PetSim.contReady(pt, c); return '<button class="pw-item" data-pw="cont" data-v="' + c.k + '"' + (ok && ready ? "" : " disabled") + "><b>" + (pt.cont[c.k] ? "🏆 " : "") + esc(tr(c.n)) + "</b><small>" + esc(!ok ? tr("Gana el anterior para entrar") : ready ? tr("Inscripción: {v}", {v: fmtMoney(c.fee)}) : tr("Vuelve mañana")) + "</small></button>"; }).join("");
    s += '</div><button class="btn wide" data-pw="shop">🛍️ ' + esc(tr("Tienda de mascotas")) + " · " + esc(money()) + "</button>";
    panel(s);
  }
  function contView(k) {
    var W = cur, pt = W.pt, c = PetSim.CONT.filter(function (x) { return x.k === k; })[0], th = PetSim.contTheme(pt, c);
    var TH = {sporty: N_("deportivo"), cute: N_("tierno"), cozy: N_("cómodo"), regal: N_("elegante"), silly: N_("divertido"), shiny: N_("brillante")};
    var known = PetSim.known(pt).length;
    panel('<div class="pw-h">' + esc(tr(c.n)) + '</div><p class="pw-hint">' + esc(tr("Premio para el ganador: {v}.", {v: fmtMoney(c.prize)})) + '</p><div class="pw-grid">' +
      '<button class="pw-item" data-pw="contgo" data-v="' + k + ':style"><b>👗 ' + esc(tr("Estilo")) + "</b><small>" + esc(tr("Tema de hoy: {t}", {t: tr(TH[th])})) + "</small></button>" +
      '<button class="pw-item" data-pw="contgo" data-v="' + k + ':tricks"' + (known >= 3 ? "" : " disabled") + "><b>🎓 " + esc(tr("Trucos")) + "</b><small>" + esc(known >= 3 ? tr("Elige tres trucos que domine") : tr("Necesita al menos tres trucos casi dominados")) + "</small></button></div>" +
      '<button class="btn wide" data-pw="back">' + esc(tr("Volver")) + "</button>");
  }

  /* paseo: recorrido con correa; la cámara sigue; sucesos a lo largo del camino */
  MODES.walk = {
    bar: "out", noOrbit: true,
    enter: function (route) {
      var W = cur, a = W.actor, pt = W.pt; route = route || "park";
      if (pt.sleep) PetSim.wake(pt);
      scene("walk", {route: route}); W.props = [];
      var R = PetSim.ROUTES.filter(function (r) { return r.k === route; })[0];
      W.walk = {route: route, len: R.len * 0.04, pos: 0, ev: PetSim.walkPlan(pt, route), i: 0, log: [], mud: false, fans: 0, poo: false, hold: false, steps: 0, stop: 0};
      W.walk.ev.forEach(function (e) {
        var z = -e.at * W.walk.len, x = Math.sin(z / 0.92) * 0.24;
        var mdl = e.k === "find" ? "bone" : e.k === "puddle" ? null : e.k === "bench" ? "hurdle" : e.k === "ball" ? "ball" : e.k === "poo" ? null : e.k === "sniff" ? "plant" : e.k === "fan" ? "pennant" : null;
        if (mdl) W.props.push({id: "ev", m: PetProps.prop(mdl), x: x + (e.k === "find" || e.k === "ball" ? 0 : 0.36), z: z, y: 0});
        e.z = z; e.x = x;
      });
      a.x = 0; a.z = 0; a.yaw = PI; a.clip = null; a.goal = null;
      var c = W.E.cam; c.target = [0, 0.15, 0]; c.yaw = 0; c.pitch = 0.32; c.dist = 1.9;
      panel('<div class="pw-h">' + esc(tr(R.n)) + '</div><p class="pw-hint">' + esc(tr("Mantén pulsado para caminar.")) + '</p><div class="pw-prog"><i style="width:0%"></i></div><div class="pw-row"><button class="go pw-hold" data-pw="hold">🦮 ' + esc(tr("Caminar")) + '</button><button class="btn" data-pw="end">' + esc(tr("Volver a casa")) + "</button></div>");
      var hb = W.el.querySelector(".pw-hold");
      function on(e) { e.preventDefault(); W.walk.hold = true; } function off() { W.walk.hold = false; }
      hb.addEventListener("pointerdown", on); hb.addEventListener("pointerup", off); hb.addEventListener("pointerleave", off); hb.addEventListener("pointercancel", off);
    },
    down: function () { cur.walk.hold = true; return true; },
    up: function () { cur.walk.hold = false; },
    move: function () {},
    update: function (dt) {
      var W = cur, w = W.walk, a = W.actor; if (!w) return;
      if (w.stop > 0) { w.stop -= dt; }
      else if (w.hold && w.pos < w.len) {
        w.pos = Math.min(w.len, w.pos + dt * 0.45); var z = -w.pos, x = Math.sin(z / 0.92) * 0.24;
        a.goal = {x: x, z: z, run: false}; w.steps += dt * 3;
        if (Math.random() < dt) sfx("step");
        var e = w.ev[w.i];
        if (e && w.pos >= e.at * w.len - 0.05) { w.i++; walkEvent(e); }
        var pb = W.el.querySelector(".pw-prog i"); if (pb) pb.style.width = Math.round(w.pos / w.len * 100) + "%";
        if (w.pos >= w.len) walkEnd();
      } else if (!w.hold) a.goal = null;
      var c = W.E.cam; camStep(dt, [a.x, 0.15, a.z - 0.15]); c.yaw += (0 - c.yaw) * Math.min(1, dt * 2);
    },
    draw: function () {
      var W = cur, a = W.actor, n = a.anchor("neck"), c = W.E.cam, hx = c.target[0] + 0.05, hz = c.target[2] + 0.9, hy = 0.7;
      /* correa: cubos pequeños de la mano a su cuello, con una curva suave */
      for (var i = 1; i < 14; i++) { var k = i / 14, sag = Math.sin(k * PI) * 0.08; W.E.dyn.box(n[0] + (hx - n[0]) * k + VoxCore.core.ORIGIN[0], n[1] + (hy - n[1]) * k - sag + VoxCore.core.ORIGIN[1], n[2] + (hz - n[2]) * k + VoxCore.core.ORIGIN[2], 0.012, 0.012, 0.012, [0.89, 0.25, 0.23], 1); }
    },
    act: function (k) {
      var W = cur;
      if (k === "end") return walkEnd(true);
      if (k === "bag") { W.walk.poo = false; W.walk.log.push(tr("Has recogido lo suyo como un buen vecino.")); W.props = W.props.filter(function (p) { return p.id !== "poo"; }); sfx("pop"); panelWalkMain(); return; }
      if (k === "home") return setMode("care");
    }
  };
  function panelWalkMain() { var W = cur, b = W.el.querySelector(".pw-row .pw-bag"); if (b) b.remove(); }
  function walkEvent(e) {
    var W = cur, a = W.actor, w = W.walk, pt = W.pt;
    w.stop = 1.6; a.goal = null;
    if (e.k === "find") { a.play("sniff"); var f = PetSim.walkFind(pt, e.s); W.props = W.props.filter(function (p) { return !(p.id === "ev" && Math.abs(p.z - e.z) < 0.01 && Math.abs(p.x - e.x) < 0.01); });
      var t = f.k === "acc" ? tr("¡Ha encontrado algo! {x}", {x: tr(petItem(f.id).n)}) : f.k === "treat" ? tr("¡Ha encontrado una chuche!") : f.k === "coin" ? tr("¡Ha encontrado unas monedas!") : tr("Ha encontrado un palo. Muy orgulloso."); say(t, 2.6); w.log.push(t); fx("star", null, 3); sfx(f.k === "coin" ? "coin" : "sparkle"); }
    else if (e.k === "pet") { var other = new PetRig.Actor({k: ["dog", "cat", "rabbit", "fennec", "capybara"][e.s % 5], stage: 2}); other.x = e.x + 0.3; other.z = e.z - 0.1; other.yaw = -PI / 2; W.npc = other; a.lookAt([other.x, 0.1, other.z], 1); a.play("happy"); a.say("excited", 1.5); say(tr("¡Un nuevo amigo!")); w.log.push(tr("Ha hecho un amigo nuevo.")); PetSim.bond(pt, 1, "friend"); w.stop = 2.6; }
    else if (e.k === "fan") { w.fans++; say(tr("«¡Qué mascota más bonita!»"), 2.4); a.play("happy"); w.log.push(tr("Unos aficionados se han parado a saludar.")); }
    else if (e.k === "sniff") { a.play("sniff"); }
    else if (e.k === "puddle") { a.play("jump"); fx("drop", [a.x, 0.02, a.z], 20); sfx("splash"); w.mud = true; a.dirt = Math.max(a.dirt, 2); say(tr("¡Directo al charco!")); w.log.push(tr("Ha saltado en un charco.")); }
    else if (e.k === "poo") { a.play("sit"); w.poo = true; W.props.push({id: "poo", m: PetProps.prop("poop"), x: a.x - 0.05, z: a.z + 0.08, y: 0}); var row = W.el.querySelector(".pw-panel .pw-row"); if (row && !row.querySelector(".pw-bag")) { var bt = document.createElement("button"); bt.className = "btn pw-bag"; bt.setAttribute("data-pw", "bag"); bt.textContent = "🛍️ " + tr("Recoger"); row.appendChild(bt); } }
    else if (e.k === "bench") { a.play("lie"); pt.n.ene = Math.min(100, pt.n.ene + 6); w.stop = 2.2; }
    else if (e.k === "ball") { a.play("dribble"); trickBall("dribble"); say(tr("¡Un balón suelto!")); w.stop = 3; }
  }
  function walkEnd(early) {
    var W = cur, w = W.walk; if (!w || w.done) return; w.done = true;
    if (w.pos < 0.6) { setMode("out"); return; }
    if (w.poo) w.log.push(tr("Te has dejado algo en el camino…"));
    PetSim.walkEnd(W.pt, w.route, {mud: w.mud, fans: w.fans, poo: !w.poo, steps: Math.round(w.steps * 10)});
    W.actor.say("happy", 1.5); W.actor.play("happy"); fx("heart", null, 3); persist(); hud();
    panel('<div class="pw-h">' + esc(tr("¡Paseo terminado!")) + "</div><ul class=\"pw-log\">" + (w.log.length ? w.log : [tr("Un paseo tranquilo.")]).map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + '</ul><button class="btn wide" data-pw="home">' + esc(tr("Volver a casa")) + "</button>");
  }

  /* concurso: estilo (tema del día) o trucos (tres, con buen ritmo) */
  MODES.contest = {
    bar: "out",
    enter: function (arg) {
      var W = cur, a = W.actor, pt = W.pt, parts = String(arg || "local:style").split(":"), c = PetSim.CONT.filter(function (x) { return x.k === parts[0]; })[0];
      if (!PetSim.contPay(c)) { cap(tr("No tienes dinero suficiente.")); setMode("out"); return; }
      scene("arena"); W.props = [{id: "ped", m: PetProps.prop("pedestal"), x: 0, z: 0, y: 0}, {id: "t", m: PetProps.prop("trophy3"), x: 0.5, z: -0.5, y: 0}];
      a.x = 0; a.z = 0.05; a.yaw = 0; a.clip = null; a.goal = null;
      var cm = W.E.cam; cm.target = [0, 0.28, 0]; cm.yaw = 0.15; cm.pitch = 0.24; cm.dist = 2.1;
      W.cont = {c: c, cat: parts[1], picks: [], res: [], step: 0, theme: PetSim.contTheme(pt, c)};
      if (pt.sleep) PetSim.wake(pt);
      persist();
      if (W.cont.cat === "style") { a.play("spin", {done: function () { a.play("sitHold"); }}); setTimeout(function () { if (cur === W) contResult(PetSim.styleScore(pt, W.cont.theme)); }, 2400); panel('<div class="pw-h">' + esc(tr("Desfile")) + '</div><p class="pw-hint">' + esc(tr("El jurado observa cada detalle…")) + "</p>"); sfx("cheer"); }
      else contPick();
    },
    update: function (dt) { var W = cur; W.actor.y = 0.16; camStep(dt, null); W.E.cam.yaw += dt * 0.08; if (W.cont && W.cont.timing) { var T2 = W.cont.timing; T2.t += dt; var mk = W.el.querySelector(".pw-tim i"); if (mk) mk.style.left = Math.round(((Math.sin(T2.t * 3.2) + 1) / 2) * 100) + "%"; } },
    act: function (k, v) {
      var W = cur, C = W.cont;
      if (k === "pick") { if (C.picks.indexOf(v) < 0 && C.picks.length < 3) C.picks.push(v); else C.picks = C.picks.filter(function (x) { return x !== v; }); contPick(); return; }
      if (k === "start") { C.step = 0; contTrick(); return; }
      if (k === "hit") {
        var T2 = C.timing; if (!T2) return; var pos = (Math.sin(T2.t * 3.2) + 1) / 2, good = Math.abs(pos - 0.5) < 0.14; C.timing = null;
        var trk = C.picks[C.step], pt = W.pt, a = W.actor;
        var m = PetSim.trickLv(pt, trk) / 100, ok = Math.random() < (good ? 0.55 + m * 0.45 : 0.2 + m * 0.5) ? "ok" : Math.random() < 0.6 ? "half" : "fail";
        C.res.push(ok); var clip = trk === "dead" ? "dead" : trk;
        a.clip = null; a.play(ok === "ok" ? clip : ok === "half" ? "halfsit" : "fall", {done: function () { C.step++; if (C.step >= C.picks.length) contResult(PetSim.trickScore(pt, C.picks, C.res)); else contTrick(); }});
        if (ok === "ok") { sfx("cheer"); fx("star", null, 3); } else sfx("fail");
        panel('<div class="pw-h">' + esc(tr(petTrick(trk).n)) + "</div>");
        return;
      }
      if (k === "done") return setMode("out");
    }
  };
  function contPick() {
    var W = cur, pt = W.pt, C = W.cont, kn = PetSim.known(pt);
    panel('<div class="pw-h">' + esc(tr("Elige tres trucos")) + '</div><div class="pw-grid tricks">' + kn.map(function (k) { var t = petTrick(k), on = C.picks.indexOf(k) >= 0; return '<button class="pw-trick' + (on ? " on" : "") + '" data-pw="pick" data-v="' + k + '" aria-pressed="' + on + '"><b>' + esc(tr(t.n)) + "</b><small>" + esc(tr(TIER_TXT[PetSim.tier(PetSim.trickLv(pt, k))])) + "</small></button>"; }).join("") + '</div><button class="go wide" data-pw="start"' + (C.picks.length === 3 ? "" : " disabled") + ">" + esc(tr("¡A la pista!")) + "</button>");
  }
  function contTrick() {
    var W = cur, C = W.cont, t = petTrick(C.picks[C.step]); C.timing = {t: 0};
    panel('<div class="pw-h">' + esc(tr(t.n)) + " · " + (C.step + 1) + "/3</div><p class=\"pw-hint\">" + esc(tr("Da la orden cuando el marcador pase por el centro.")) + '</p><div class="pw-tim" aria-hidden="true"><b></b><i></i></div><button class="go wide" data-pw="hit">' + esc(tr("¡Ahora!")) + "</button>");
  }
  function contResult(score) {
    var W = cur, C = W.cont, pt = W.pt, a = W.actor, r = PetSim.contRun(pt, C.c, C.cat, score);
    persist(); hud();
    var win = r.pos === 1;
    if (win) { a.say("excited", 2); a.play("happy"); fx("confetti", [0, 0, 0], 60); fx("star", null, 5); sfx("success"); sfx("cheer"); } else { a.say(r.pos <= 3 ? "happy" : "sad", 1.5); a.play(r.pos <= 3 ? "happy" : "sad"); }
    var s = '<div class="pw-h">' + esc(win ? tr("¡Campeón!") : tr("Puesto {n}", {n: r.pos})) + '</div><p class="pw-hint">' + esc(r.prize ? tr("Premio: {v}", {v: fmtMoney(r.prize)}) : tr("Esta vez no ha habido suerte. ¡A seguir entrenando!")) + "</p>";
    if (r.unlock) s += '<p class="pw-hint">🎁 ' + esc(tr("Nuevo accesorio: {x}", {x: tr(petItem(r.unlock).n)})) + "</p>";
    if (r.tro) s += '<p class="pw-hint">🏆 ' + esc(tr("Trofeo para tu jardín: {x}", {x: tr(petItem(r.tro).n)})) + "</p>";
    panel(s + '<button class="btn wide" data-pw="done">' + esc(tr("Volver")) + "</button>");
  }

  /* tienda: escaparate con probador; stock diario de accesorios */
  MODES.shop = {
    bar: "out",
    enter: function (from) {
      var W = cur, a = W.actor; W.shopFrom = from || "out"; scene("shop"); W.props = [{id: "ped", m: PetProps.prop("pedestal"), x: 0, z: 0, y: 0}];
      a.x = 0; a.z = 0; a.yaw = 0; a.clip = null; a.goal = null; a.play("sitHold"); W.tryOn = null;
      var c = W.E.cam; var ds = fit(6, 1.0, 1.8); c.target = [0, showY(ds), 0]; c.yaw = 0.25; c.pitch = 0.2; c.dist = ds;
      W.shopTab = W.shopTab || "acc"; shopView();
    },
    update: function (dt) { var W = cur; W.actor.y = 0.16; camStep(dt, null); if (!W.actor.clip) W.actor.play("sitHold"); },
    exit: function () { var W = cur; if (W && W.tryOn) { W.tryOn = null; W.actor.setAcc(W.pt.eq); } },
    act: function (k, v) {
      var W = cur, a = W.actor, pt = W.pt;
      if (k === "tab") { W.shopTab = v; shopView(); return; }
      if (k === "try") { var it = petItem(v), eq = JSON.parse(JSON.stringify(pt.eq || {})); eq[it.s] = v; a.setAcc(eq); W.tryOn = v; var lk = PetSim.accLike(pt, v); a.clip = null; if (lk > 0) { a.say("love", 1.2); fx("heart", null, 2); a.play("happy"); } else if (lk < 0) { a.say("angry", 1); a.play("shake"); } else a.say("curious", 0.8); shopView(); return; }
      if (k === "buy") {
        var r = PetSim.buy(v);
        if (r.poor) { cap(tr("No tienes dinero suficiente.")); hap("bad"); return; }
        if (!r.ok) return;
        sfx("coin"); hap("ok"); var it2 = petItem(v);
        if (it2.s) { pt.eq[it2.s] = v; a.setAcc(pt.eq); W.tryOn = null; }
        cap(tr("¡Comprado!")); persist(); shopView(); return;
      }
      if (k === "back") { setMode(W.shopFrom === "out" ? "out" : W.shopFrom); return; }
    }
  };
  function shopView() {
    var W = cur, pt = W.pt, tab = W.shopTab, inv = PetSim.inv(), s = '<div class="pw-h">' + esc(tr("Tienda de mascotas")) + ' <span class="pw-money">' + esc(money()) + "</span></div>";
    s += '<div class="pw-tabs" role="tablist">' + [["acc", N_("Novedades de hoy")], ["food", N_("Comida")], ["care", N_("Cuidado")], ["toy", N_("Juguetes")], ["deco", N_("Jardín")]].map(function (x) { return '<button role="tab" data-pw="tab" data-v="' + x[0] + '" aria-selected="' + (tab === x[0]) + '">' + esc(tr(x[1])) + "</button>"; }).join("") + "</div>";
    function row(it, extra, can) { var p = it.price || 0, poor = S.p.money < p; return '<div class="pw-item' + (W.tryOn === it.id ? " on" : "") + '"><b>' + esc(tr(it.n)) + "</b><small>" + esc(it.d ? tr(it.d) : "") + (extra || "") + '</small><div class="pw-row">' + (it.s ? '<button class="btn" data-pw="try" data-v="' + it.id + '">' + esc(tr("Probar")) + "</button>" : "") + (can === false ? '<span class="pw-own">' + esc(tr("Ya lo tienes")) + "</span>" : '<button class="go" data-pw="buy" data-v="' + it.id + '"' + (poor ? " disabled" : "") + ">" + esc(fmtMoney(p)) + "</button>") + "</div></div>"; }
    var list = [];
    if (tab === "acc") list = PetSim.stock(pt).map(function (id) { var it = petItem(id); return row(it, " · " + tr(PET_RARITY.filter(function (x) { return x[0] === it.r; })[0][1]), !owned(id)); });
    if (tab === "food") list = PET_FOOD.map(function (f) { return row(f, inv[f.id] ? " · " + tr("Tienes {n}", {n: inv[f.id]}) : ""); });
    if (tab === "care") list = PET_CARE_ITEMS.map(function (f) { return row(f, inv[f.id] ? " · " + tr("Tienes {n}", {n: inv[f.id]}) : "", !(f.durable && inv[f.id])); });
    if (tab === "toy") list = PET_TOYS.map(function (f) { return row(f, "", !owned(f.id) && f.id !== "toy_ball"); });
    if (tab === "deco") list = PET_DECOR.filter(function (d) { return !d.fixed && !d.un; }).map(function (f) { return row(f, "", !owned(f.id)); });
    s += '<div class="pw-grid">' + list.join("") + '</div><button class="btn wide" data-pw="back">' + esc(tr("Volver")) + "</button>";
    panel(s);
  }

  /* foto y álbum: captura del lienzo reducida, guardada aparte de la partida */
  var ALB = "camino.petalbum";
  function albumGet() { try { return JSON.parse(localStorage.getItem(ALB) || "[]"); } catch (e) { return []; } }
  function photo() {
    var W = cur; if (!W) return;
    var a = W.actor; a.lookAt(camEye(), 1); a.say("happy", 1.5); sfx("pop");
    W.el.classList.add("flash"); setTimeout(function () { if (W.el) W.el.classList.remove("flash"); }, 260);
    W.shot = function () {
      try {
        var c = document.createElement("canvas"), w = 320, h = Math.round(w * W.cv.height / Math.max(1, W.cv.width)); c.width = w; c.height = h;
        var g = c.getContext("2d"), gr = g.createLinearGradient(0, 0, 0, h), sk = SKY[W.tod]; gr.addColorStop(0, sk[0]); gr.addColorStop(1, sk[1]); g.fillStyle = gr; g.fillRect(0, 0, w, h);
        g.drawImage(W.cv, 0, 0, w, h);
        var url = c.toDataURL("image/jpeg", 0.72), al = albumGet(); al.push({t: PetSim.clock(), u: url, n: W.pt.nm}); while (al.length > 24) al.shift();
        try { localStorage.setItem(ALB, JSON.stringify(al)); } catch (e) { al.shift(); try { localStorage.setItem(ALB, JSON.stringify(al)); } catch (e2) {} }
        PetSim.photo(W.pt, {expr: a.curExpr(), scene: W.modeK}); persist();
        cap(tr("¡Foto guardada en el álbum!"));
      } catch (e) { cap(tr("No se ha podido guardar la foto")); }
    };
  }
  function albumView() {
    var al = albumGet().slice().reverse();
    panel('<div class="pw-h">' + esc(tr("Álbum")) + "</div>" + (al.length ? '<div class="pw-album">' + al.map(function (p) { var d = new Date(p.t); return '<figure><img src="' + p.u + '" alt="' + esc(tr("Foto de {pet}", {pet: p.n})) + '"><figcaption>' + d.toLocaleDateString() + "</figcaption></figure>"; }).join("") + "</div>" : '<p class="pw-hint">' + esc(tr("Todavía no hay fotos. Pulsa Foto en casa o jugando.")) + "</p>") +
      memView() + '<button class="btn wide" data-pw="back">' + esc(tr("Volver")) + "</button>");
  }
  /* recuerdos: las primeras veces, con fecha */
  var MEM_TXT = {adopt: N_("Llegó a casa"), meal: N_("Primera comida"), bath: N_("Primer baño"), favzone: N_("Descubriste dónde le encantan los mimos"), favtoy: N_("Encontró su juguete favorito"), trick: N_("Dominó su primer truco"),
    walk_park: N_("Primer paseo por el parque"), walk_barrio: N_("Primer paseo por el barrio"), walk_training: N_("Visitó la ciudad deportiva"), walk_stadium: N_("Paseó junto al estadio"), photo: N_("Primera foto"),
    win_local: N_("Ganó su primer concurso"), win_com: N_("Campeón comarcal"), win_nac: N_("Campeón nacional"), lovedacc: N_("Estrenó un accesorio que le encanta"), stage1: N_("Se hizo joven"), stage2: N_("Llegó a adulto"), stage3: N_("Ya es senior"), migr: N_("Empezó una nueva etapa contigo")};
  function memView() {
    var W = cur, m = W.pt.mem.filter(function (x) { return MEM_TXT[x.k]; });
    if (!m.length) return "";
    return '<div class="lbl">' + esc(tr("Recuerdos")) + '</div><ul class="pw-log">' + m.slice(-12).reverse().map(function (x) { return "<li>" + esc(tr(MEM_TXT[x.k])) + ' <small>' + new Date(x.t).toLocaleDateString() + "</small></li>"; }).join("") + "</ul>";
  }

  /* ===================== miniatura para la tarjeta ===================== */
  var thumbDirty = true, thumbKey = "", thumbURL = null, thumbE = null, thumbCv = null;
  function thumb(pt) {
    if (!pt || !supported()) return null;
    var key = [pt.k, PetSim.stage(pt), pt.col, JSON.stringify(pt.eq || {}), PetSim.expr(pt), pt.dirt || 0].join("|");
    if (key === thumbKey && thumbURL) return thumbURL;
    try {
      if (!thumbE) { thumbCv = document.createElement("canvas"); thumbCv.width = 192; thumbCv.height = 192; thumbCv.style.cssText = "width:96px;height:96px"; thumbE = new VoxCore.Engine(thumbCv, {quality: "high", sun: [-0.3, 0.9, 0.35], ambient: 1.7, alpha: true, preserve: true, clear: [0, 0, 0, 0], shadows: false, w: 96, h: 96, particles: 4}); thumbE.lowAuto = false; thumbE.dpr = 2; }
      var a = new PetRig.Actor({k: pt.k, stage: PetSim.stage(pt), col: pt.col, ico: petIco(pt), eq: pt.eq || {}});
      a.baseExpr = PetSim.expr(pt) === "sleep" ? "content" : PetSim.expr(pt); a.dirt = pt.dirt || 0; a.yaw = 0.5; a.update(0.016); a.lookAt([0.4, 0.3, 1.5], 1);
      for (var i = 0; i < 10; i++) a.update(0.05);
      var h = Math.max(0.1, a.M.height), E = thumbE;
      E.cam.target = [0, h * 0.5, 0]; E.cam.dist = Math.max(0.35, Math.max(h, a.M.length) * 1.9); E.cam.pitch = 0.22; E.cam.yaw = 0.15;
      E.frame(0.016, function () { a.draw(E, {dt: 0.016}); });
      thumbURL = thumbCv.toDataURL("image/png"); thumbKey = key;
      return thumbURL;
    } catch (e) { return null; }
  }
  return {open: open, close: close, supported: supported, thumb: thumb, isOpen: function () { return !!cur; }, _cur: function () { return cur; }, say: say};
})();
