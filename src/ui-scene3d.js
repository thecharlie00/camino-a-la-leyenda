/* ui-scene3d.js — escenas 3D vóxel en vivo para las decisiones y la rueda de prensa (5.6).
   El decorado sale del mismo plano de vóxeles que las ilustraciones (vestuario, sala de prensa, despacho…),
   mallado con la oclusión del motor; las personas son los muñecos vóxel del partido (SpRig): tú con tu
   equipación (o el míster con su traje) y quien te acompañe, con sus gestos. En la sala de prensa saltan
   los flashes. Un único contexto WebGL reutilizado; se para fuera de pantalla. Sin WebGL queda la ilustración. */
(function () {
  if (typeof UIX === "undefined") return;
  var U = UIX, V = null, PI = Math.PI, VS = 0.2;
  function ok() { return typeof VoxCore !== "undefined" && VoxCore && typeof SpRig !== "undefined" && SpRig && U.gxScenePlan && U.yo3d; }
  function rm() { return document.documentElement.classList.contains("rm"); }
  /* gestos de cada escena: tú y los demás */
  var ACT = {press: ["cpoint", "breathe", "cpoint"], party: ["arms", "breathe"], locker: ["ccross", "breathe", "cclap"], office: ["breathe", "ccross"], home: ["breathe", "cclap"],
    hospital: ["breathe"], training: ["breathe", "cclap"], stadium: ["arms", "breathe"], pitch: ["breathe", "arms"], street: ["breathe"], plane: ["breathe", "cpoint"]};
  function create() {
    var cv = document.createElement("canvas"); cv.className = "sc3-cv"; cv.setAttribute("aria-hidden", "true");
    var E; try { E = new VoxCore.Engine(cv, {quality: "auto", alpha: true, clear: [0, 0, 0, 0], shadowR: 5, fog: null, particles: 120, vignette: 0}); } catch (e) { return null; }
    E.cam.near = 0.1; E.cam.far = 80; E.cam.fov = 32; E.setEnv("day", null);
    var v = {cv: cv, E: E, key: "", men: [], me: null, sc: "", t: 0, raf: 0, vis: true, flashT: 1};
    if (typeof IntersectionObserver !== "undefined") v.io = new IntersectionObserver(function (en) { v.vis = en[0] && en[0].isIntersecting; if (v.vis) loop(); });
    return v;
  }
  function build(sc) {
    var mgr = S.mode === "mgr", plan = U.gxScenePlan(sc), look = mgr ? U.yo3d.mgr() : U.yo3d.player(), key = plan.key + JSON.stringify(look);
    if (key === V.key) return;
    V.key = key; V.sc = sc;
    var g = new VoxCore.VGrid();
    Object.keys(plan.V).forEach(function (k) { var p = k.split(","); g.set(+p[0], +p[1], +p[2], plan.V[k]); });
    V.E.addStatic("sc", VoxCore.meshArray(g, VS, [0, 0, 0]), {});
    V.men = [];
    plan.spots.forEach(function (sp, i) {
      var sk = ["#e0ac85", "#8d5a3b", "#f3d2b3", "#c18a5e"][i % 4], o = sp.me || (i === 0 && !sp.back) ? look : {shirt: sp.shirt || "#2a2a3a", shorts: sp.back ? ["#3a5a8a", "#2a2a2a", "#5a4a3a"][i % 3] : (sp.shorts || "#1b1d1f"), socks: sp.back ? "#1b1d1f" : null, trim: sp.back ? "#1b1d1f" : null, skin: sk, hair: ["#1d1612", "#5a3a22", "#b9b9b9"][i % 3], hairStyle: i % 5, gk: true, gloves: sk, longLegs: true};
      var m = new SpRig.Man(o); m.x = sp.x * VS; m.z = (sp.z + 0.5) * VS; m.y = VS; m.yaw = sp.back ? PI + (sp.x > 0 ? 0.35 : -0.35) : (sp.x > 0 ? -0.25 : 0.25); m.back = !!sp.back; m.me = !!(sp.me || i === 0); m.next = 1 + i; V.men.push(m);
    });
    V.pop = 0;
  }
  function loop() {
    if (!V || V.raf) return;
    V.last = performance.now();
    var step = function (now) {
      V.raf = 0;
      if (!V.cv.isConnected || !V.vis || document.hidden) return;
      var dt = Math.min(0.05, (now - V.last) / 1000); V.last = now; V.t += dt;
      var E = V.E, acts = ACT[V.sc] || ["breathe"];
      V.pop = Math.min(1, (V.pop || 0) + dt / 0.9);
      var e = 1 - Math.pow(1 - V.pop, 3);
      /* cámara: entra acercándose y luego se balancea despacio */
      var close = V.sc === "press" ? 5.4 : 6.6; E.cam.target = [0, V.sc === "press" ? 1.05 : 0.95, 0.1]; E.cam.dist = close + (1 - e) * 2.2; E.cam.yaw = rm() ? 0.25 : 0.25 + Math.sin(V.t * 0.25) * 0.22; E.cam.pitch = 0.28 - (1 - e) * 0.1;
      V.men.forEach(function (m) {
        m.next -= dt;
        if (!m.clip && m.next <= 0) { m.play(m.back ? (Math.random() < 0.5 ? "cpoint" : "breathe") : acts[Math.floor(Math.random() * acts.length)]); m.next = 3 + Math.random() * 3; }
        m.update(rm() ? 0 : dt);
      });
      /* flashes de los fotógrafos */
      if (V.sc === "press" && !rm()) {
        V.flashT -= dt;
        if (V.flashT <= 0) { V.flashT = 0.35 + Math.random() * 1.6; var x = (Math.random() < 0.5 ? -1 : 1) * (1.2 + Math.random() * 0.8); for (var i = 0; i < 10; i++) E.spawn({x: x, y: 0.9 + Math.random() * 0.2, z: 1.1, vx: (Math.random() - 0.5) * 1.6, vy: (Math.random() - 0.5) * 1.2, vz: (Math.random() - 0.5) * 1.6, g: 0, life: 0.18, s: 0.05, c: "#ffffff", code: Pitch3D.core.MAT.EMIT}); E.flood = 1; }
        E.flood = Math.max(0, (E.flood || 0) - dt * 4);
      }
      E.frame(dt, function () { V.men.forEach(function (m) { m.matrices(); SpRig.ORDER.forEach(function (n) { E.bake(m.m.mesh[n], m.W[n]); }); }); });
      V.raf = requestAnimationFrame(step);
    };
    V.raf = requestAnimationFrame(step);
  }
  function mount(host) {
    if (!ok()) return false;
    if (!V) { V = create(); if (!V) return false; }
    try { build(host.getAttribute("data-sc3")); } catch (e) { return false; }
    if (V.cv.parentNode !== host) { host.appendChild(V.cv); host.classList.add("has3d"); if (V.io) { V.io.disconnect(); V.io.observe(host); } V.pop = 0; }
    loop();
    return true;
  }
  U.add("after", function () { if (!S) return; var h = document.querySelector(".gxsc[data-sc3]"); if (h) mount(h); });
  U.scene3d = {mount: mount, get: function () { return V; }};
})();
