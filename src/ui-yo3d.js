/* ui-yo3d.js — en «Yo», el jugador (y en «Tu míster», el míster) es el modelo vóxel 3D de los partidos:
   las mismas piezas y clips (SpRig) sobre una peana, con su equipación, dorsal, botas y brazalete
   (o el traje equipado). Respira, mira alrededor, hace su gesto de vez en cuando y celebra al tocarlo;
   arrastrando se gira. Un único contexto WebGL que se reutiliza entre pintados y se para fuera de pantalla.
   Sin WebGL se queda la figura 2D de siempre. */
(function () {
  if (typeof UIX === "undefined") return;
  var U = UIX, V = null, PI = Math.PI;
  function ok() { return typeof VoxCore !== "undefined" && VoxCore && typeof SpRig !== "undefined" && SpRig && typeof Pitch3D !== "undefined" && Pitch3D && Pitch3D.core; }
  function rm() { return document.documentElement.classList.contains("rm"); }
  function hex(c) { return VoxCore.rgb(c); }
  /* aspecto */
  function playerLook() {
    var o = {};
    try { o = Object.assign({}, SpModes._int.myKit()); } catch (e) { o = {shirt: "#c8312f", shorts: "#f4f4f0", num: 9}; }
    try {
      var L = S.p.life || {}; if (L.num) o.num = L.num;
      var gk = typeof isGK === "function" && isGK(); o.gk = gk;
      if (gk) { var g = L.gear && L.gear.eq && L.gear.eq.gloves && GXI.item(L.gear.eq.gloves); o.gloves = g ? g.look.c : "#f4f4f0"; }
      o.captain = !!(S.p.flags && S.p.flags.captain);
      var hs = {short: 0, buzz: 1, curly: 2, long: 3, bald: 4}[(L.cos || {}).hair]; if (hs != null) o.hairStyle = hs;
    } catch (e) {}
    return o;
  }
  function mgrLook() { var c = U.coachLook ? U.coachLook() : null; if (!c) return null; /* traje: mangas largas (como el portero, con las manos de su piel) y pantalón largo hasta el zapato */
    return {shirt: c.suit, shorts: c.trousers, socks: c.trousers, trim: c.trousers, skin: c.skin, hair: c.hair, boots: c.shoes, fem: c.fem, official: true, gk: true, gloves: c.skin, longLegs: true, tie: c.tie}; }
  function celebClip() { try { var k = SpModes._int.celebOf(); return SpRig.CLIPS[k] ? k : "arms"; } catch (e) { return "arms"; } }
  /* peana vóxel (en el marco local) */
  function baseVerts() {
    var C = Pitch3D.core, m = new C.Mesh(4096); m.code = C.MAT.MATTE;
    for (var x = -5; x <= 5; x++) for (var z = -5; z <= 5; z++) { var d = Math.hypot(x, z); if (d > 5.3) continue; var top = d < 4.3; m.box(x * 0.1, -0.06, z * 0.1, 0.1, 0.12, 0.1, hex(top ? ((x + z) % 2 ? "#2f8f4e" : "#37a35a") : "#ffb21e"), 0.85); }
    m.box(0, -0.2, 0, 1.0, 0.16, 1.0, hex("#1b2428"), 0.8);
    return m.a.slice(0, m.n);
  }
  function create() {
    var cv = document.createElement("canvas"); cv.className = "yo3d-cv"; cv.setAttribute("aria-label", tr("Tu jugador en 3D"));
    var E;
    try { E = new VoxCore.Engine(cv, {quality: "auto", alpha: true, clear: [0, 0, 0, 0], shadowR: 2.2, fog: null, particles: 60, vignette: 0}); } catch (e) { return null; }
    E.cam.near = 0.05; E.cam.far = 60; E.cam.fov = 30; E.cam.iso = false;
    E.setEnv("day", null);
    var v = {cv: cv, E: E, man: null, key: "", base: baseVerts(), yaw: -0.35, vyaw: 0, drag: null, t: 0, next: 4, raf: 0, last: 0, vis: true, kind: "p"};
    /* arrastrar para girar; tocar para celebrar */
    cv.addEventListener("pointerdown", function (e) { v.drag = {x: e.clientX, y0: e.clientX, t: performance.now()}; try { cv.setPointerCapture(e.pointerId); } catch (er) {} });
    cv.addEventListener("pointermove", function (e) { if (!v.drag) return; var dx = e.clientX - v.drag.x; v.drag.x = e.clientX; v.yaw += dx * 0.012; v.vyaw = dx * 0.012; });
    cv.addEventListener("pointerup", function (e) {
      var d = v.drag; v.drag = null; if (!d) return;
      if (Math.abs(e.clientX - d.y0) < 6 && performance.now() - d.t < 350 && v.man) { v.man.clip = null; v.man.play(v.kind === "m" ? "cfist" : celebClip()); v.next = 5; try { Anim.haptic("tap"); } catch (er) {} }
    });
    cv.addEventListener("click", function (e) { e.stopPropagation(); });
    if (typeof IntersectionObserver !== "undefined") { v.io = new IntersectionObserver(function (en) { v.vis = en[0] && en[0].isIntersecting; if (v.vis) loop(); }); }
    return v;
  }
  function setMan(kind) {
    var o = kind === "m" ? mgrLook() : playerLook(); if (!o) return false;
    var key = kind + JSON.stringify(o);
    if (key !== V.key) {
      V.key = key; V.kind = kind; V.man = new SpRig.Man(o); V.man.x = 0; V.man.z = 0;
      /* entrada: aparece con un pequeño salto (anticipación y caída) */
      V.man.y = 0; V.pop = 0;
    }
    return true;
  }
  function idle(dt) {
    var m = V.man; V.next -= dt;
    if (!m.clip && V.next <= 0) {
      var pool = V.kind === "m" ? ["ccross", "cpoint", "cclap", "breathe"] : ["breathe", "breathe", celebClip()];
      m.play(pool[Math.floor(Math.random() * pool.length)]); V.next = 4 + Math.random() * 4;
    }
  }
  function loop() {
    if (!V || V.raf) return;
    V.last = performance.now();
    var step = function (now) {
      V.raf = 0;
      if (!V.cv.isConnected || !V.vis || document.hidden) return;
      var dt = Math.min(0.05, (now - V.last) / 1000); V.last = now; V.t += dt;
      var E = V.E, m = V.man;
      if (!V.drag) { V.vyaw *= Math.pow(0.04, dt); V.yaw += V.vyaw; if (Math.abs(V.vyaw) < 0.0005) V.yaw += (-0.35 + Math.sin(V.t * 0.35) * 0.35 - V.yaw) * Math.min(1, dt * 0.8); }
      V.pop = Math.min(1, (V.pop || 0) + dt / 0.6);
      var p = V.pop, hop = p < 0.25 ? -0.04 * (p / 0.25) : Math.sin((p - 0.25) / 0.75 * PI) * 0.12 * (1 - p);
      if (m) { m.yaw = V.yaw; m.y = rm() ? 0 : hop; idle(dt); m.update(rm() ? 0 : dt); }
      E.cam.target = [0, 0.92, 0]; E.cam.dist = 3.6; E.cam.yaw = 0; E.cam.pitch = 0.1;
      E.frame(dt, function () {
        E.bake(V.base, VoxCore.MX.m4());
        if (m) { m.matrices(); SpRig.ORDER.forEach(function (n) { E.bake(m.m.mesh[n], m.W[n]); }); }
      });
      V.raf = requestAnimationFrame(step);
    };
    V.raf = requestAnimationFrame(step);
  }
  /* se coloca en el hueco del avatar después de cada pintado */
  function mountInto(host, kind) {
    if (!ok()) return false;
    if (!V) { V = create(); if (!V) return false; }
    if (!setMan(kind)) return false;
    if (V.cv.parentNode !== host) { host.appendChild(V.cv); host.classList.add("has3d"); if (V.io) { V.io.disconnect(); V.io.observe(host); } }
    loop();
    return true;
  }
  U.add("after", function () {
    if (!S) return;
    var h = document.querySelector(".lfav"), mh = document.querySelector(".myo-fig");
    if (h && S.p && S.mode !== "mgr") mountInto(h, "p");
    else if (mh && S.mode === "mgr") mountInto(mh, "m");
  });
  U.yo3d = {mount: mountInto, get: function () { return V; }};
})();
