/* 5.7 comprobación del equipamiento vóxel (solo desarrollo): recorre TODAS las piezas × TODOS los clips de SpRig
   y busca bloques de una prenda que se queden ocultos dentro del cuerpo, que compartan cara con él (parpadeo)
   o que se metan en otro hueso durante una animación (más de 1,2 cm).
   Uso con Playwright: node test/gearcheck.js [carpeta-capturas]   (necesita dist/index.html)
   En el navegador: pega GEARCHECK y llama gearCheck() con una partida de jugador cargada. */
const GEARCHECK = function gearCheck(opt) {
  opt = opt || {};
  var D = SpRig._dev, MX = VoxCore.MX, C = Pitch3D.core, SC = D.SC, B = D.BONES, BY = D.BY_ID, MI = D.MIRROR, EPS = 1e-4, PEN = opt.pen || 0.012;
  /* bloques del cuerpo por hueso, en metros sin escalar (como VOX_PARTS) */
  var body = [];
  C.VOX_PARTS.forEach(function (Q) { body.push({b: Q[0], box: Q.slice(1, 7)}); if (Q[9]) body.push({b: MI[Q[0]] || Q[0], box: [-Q[4], Q[2], Q[3], -Q[1], Q[5], Q[6]]}); });
  function name(b) { return BY[b]; }
  function rel(a, b) { /* mismo hueso, padre o hijo directo: se tocan por diseño */
    var na = name(a), nb = name(b); return na === nb || B[na].par === nb || B[nb].par === na; }
  function inside(p, q, m) { return p[0] > q[0] + m && p[0] < q[3] - m && p[1] > q[1] + m && p[1] < q[4] - m && p[2] > q[2] + m && p[2] < q[5] - m; }
  function depth(p, q) { return Math.min(p[0] - q[0], q[3] - p[0], p[1] - q[1], q[4] - p[1], p[2] - q[2], q[5] - p[2]); }
  function corners(q) { var o = []; [0, 3].forEach(function (i) { [1, 4].forEach(function (j) { [2, 5].forEach(function (k) { o.push([q[i], q[j], q[k]]); }); }); }); o.push([(q[0] + q[3]) / 2, (q[1] + q[4]) / 2, (q[2] + q[5]) / 2]); return o; }
  function coplanar(g, q) { /* una cara de la prenda en el mismo plano que una del cuerpo, con área común */
    for (var ax = 0; ax < 3; ax++) {
      var o1 = (ax + 1) % 3, o2 = (ax + 2) % 3;
      var ov = Math.min(g[o1 + 3], q[o1 + 3]) - Math.max(g[o1], q[o1]) > EPS && Math.min(g[o2 + 3], q[o2 + 3]) - Math.max(g[o2], q[o2]) > EPS;
      if (!ov) continue;
      for (var s = 0; s < 2; s++) for (var t = 0; t < 2; t++) if (Math.abs(g[ax + s * 3] - q[ax + t * 3]) < EPS) return true;
    }
    return false;
  }
  /* clips de cada contexto: en «Yo» respira y celebra; en el campo, todo menos los del árbitro y del míster */
  var YO = ["idle", "breathe", "arms", "slide", "plane", "jump", "silence", "flip"], ALL = Object.keys(SpRig.CLIPS).filter(function (k) { return ["whistle", "spray", "point"].indexOf(k) < 0 && !/^c[a-z]/.test(k); });
  var looks = opt.looks || [PLook.rig(), PLook.rig(null, {ctx: "pitch", outfield: true, gk: false})], clipsOf = opt.clips || [YO, ALL], out = {hidden: [], zfight: [], anim: [], boxes: 0, clips: Object.keys(SpRig.CLIPS).length, frames: 0};
  looks.forEach(function (o, li) {
    var gb = D.gearBoxes(o); out.boxes += gb.length;
    /* estático */
    gb.forEach(function (g) {
      body.forEach(function (q) {
        if (q.b !== g.b) return;
        var c = corners(g.box);
        if (c.every(function (p) { return inside(p, q.box, -EPS); })) out.hidden.push(g.s + "@" + name(g.b));
        if (coplanar(g.box, q.box)) out.zfight.push(g.s + "@" + name(g.b) + " " + q.box.map(function (v) { return v.toFixed(3); }).join(","));
      });
    });
    /* animado: cada clip muestreado a 30 fps. Línea base: lo que ya se cruza el cuerpo sin ropa en ese clip
       (piernas plegadas al deslizar, brazos cruzados en la barrera) no es culpa de la prenda */
    var man = new SpRig.Man(o), worst = {}, base = {};
    function pen(boxes, bone, inv, W0, clip, tag, store) {
      var gn = name(bone), P = B[gn].p, W = W0[gn];
      boxes.forEach(function (g) {
        var pts = corners(g.box).map(function (p) { return MX.tp(W, (p[0] - P[0]) * SC, (p[1] - P[1]) * SC, (p[2] - P[2]) * SC); });
        body.forEach(function (q) {
          if (rel(q.b, bone)) return;
          var qn = name(q.b), Q = B[qn].p, lb = [(q.box[0] - Q[0]) * SC, (q.box[1] - Q[1]) * SC, (q.box[2] - Q[2]) * SC, (q.box[3] - Q[0]) * SC, (q.box[4] - Q[1]) * SC, (q.box[5] - Q[2]) * SC];
          pts.forEach(function (pw) {
            var pl = MX.tp(inv[qn], pw[0], pw[1], pw[2]); if (!inside(pl, lb, 0)) return;
            var d = depth(pl, lb), k = (tag ? tag(g) + "@" : "") + gn + "→" + qn + " (" + clip + ")";
            if (!store[k] || store[k] < d) store[k] = d;
          });
        });
      });
    }
    var bones = {}; gb.forEach(function (g) { bones[g.b] = 1; });
    (clipsOf[li] || ALL).forEach(function (clip) {
      man.clip = null; man.play(clip);
      for (var f = 0; f < 150 && man.clip; f++) {
        man.update(1 / 30); man.matrices(); out.frames++;
        var inv = {}; SpRig.ORDER.forEach(function (n) { inv[n] = MX.invRigid(man.W[n]); });
        Object.keys(bones).forEach(function (b) {
          b = +b;
          pen(body.filter(function (q) { return q.b === b; }), b, inv, man.W, clip, null, base);
          pen(gb.filter(function (g) { return g.b === b; }), b, inv, man.W, clip, function (g) { return g.s; }, worst);
        });
      }
    });
    Object.keys(worst).forEach(function (k) {
      var bk = k.slice(k.indexOf("@") + 1), d = worst[k] - (base[bk] || 0);
      if (d >= PEN) out.anim.push((li ? "campo " : "yo ") + k + " " + (d * 100).toFixed(1) + " cm");
    });
  });
  out.hidden = out.hidden.filter(function (v, i, a) { return a.indexOf(v) === i; });
  out.zfight = out.zfight.filter(function (v, i, a) { return a.indexOf(v) === i; });
  return out;
};
if (typeof module !== "undefined" && require.main === module) {
  const path = require("path"), fs = require("fs"), { chromium } = require("playwright");
  const OUT = process.argv[2] || "/tmp/gearcheck"; fs.mkdirSync(OUT, { recursive: true });
  (async () => {
    const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 412, height: 915 } })).newPage();
    await p.goto("file://" + path.join(__dirname, "../dist/index.html")); await p.waitForTimeout(400);
    const c = async s => { await p.evaluate(s => { const e = document.querySelector(s); if (e) e.click(); }, s); await p.waitForTimeout(150); };
    await c('[data-a="setlang"][data-v="es"]'); await c('[data-a="newgame"]'); await c('[data-a="pickmode"][data-v="p"]');
    await p.fill("#fn", "Leo"); await p.fill("#ln", "Botas");
    for (let i = 0; i < 3; i++) await c('[data-a="cnext"]');
    await c('[data-a="cclub"]'); await c('[data-a="cnext"]'); await p.waitForTimeout(500);
    /* todas las piezas, una por ranura en cada pasada, en tier Leyenda */
    /* la CSP del juego no deja usar eval: la herramienta entra como script en línea */
    await p.addScriptTag({ content: "window.gearCheck = " + GEARCHECK.toString() + ";" });
    const res = await p.evaluate(() => {
      const fn = window.gearCheck, all = GXI.items("p"), bySlot = {}, rep = [];
      all.forEach(it => (bySlot[it.slot] = bySlot[it.slot] || []).push(it.id));
      const n = Math.max(...Object.values(bySlot).map(l => l.length));
      for (let i = 0; i < n; i++) {
        Object.keys(bySlot).forEach(s => { const id = bySlot[s][i % bySlot[s].length]; GXI.give(id, 5); if (GXI.gear("p").eq[s] !== id) GXI.equip(id, "p"); });
        rep.push(fn());
      }
      return rep;
    });
    let bad = 0; res.forEach((r, i) => { bad += r.hidden.length + r.zfight.length + r.anim.length; console.log("pasada", i, JSON.stringify(r)); });
    console.log(bad ? "gearcheck: " + bad + " avisos" : "gearcheck OK");
    await b.close();
  })();
}
if (typeof module !== "undefined") module.exports = GEARCHECK;
