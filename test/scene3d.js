/* 5.6 escenas 3D: decisión nueva (con consecuencias), decisión antigua y rueda de prensa. Uso: node test/scene3d.js */
const path = require("path"), fs = require("fs"), { chromium } = require("playwright");
const OUT = "/tmp/scene3d"; fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"] });
  const p = await (await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
  const errs = [], fail = []; p.on("pageerror", e => errs.push(e.message)); p.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
  await p.goto("file://" + path.join(__dirname, "../dist/index.html")); await p.waitForTimeout(400);
  const js = (s, a) => p.evaluate(s, a), c = async s => { await js(s => { const e = document.querySelector(s); if (e) e.click(); }, s); await p.waitForTimeout(150); };
  await c('[data-a="setlang"][data-v="es"]'); await c('[data-a="newgame"]'); await c('[data-a="pickmode"][data-v="p"]');
  await p.fill("#fn", "Leo"); await p.fill("#ln", "Escena"); for (let i = 0; i < 3; i++) await c('[data-a="cnext"]'); await c('[data-a="cclub"]'); await c('[data-a="cnext"]'); await p.waitForTimeout(400);
  const show = async (pend, name) => {
    await js(x => { S.ph = "gap"; S.p.age = 27; S.p.fame = 40; S.pend = [x]; UIX.ui().tab = "carrera"; UIX.render(false); const d = document.querySelector(".decision"); if (d) d.scrollIntoView({ block: "start" }); }, pend);
    await p.waitForTimeout(3500);
    const r = await js(() => { const d = document.querySelector(".decision"); return d ? { sc3: !!d.querySelector(".gxsc.has3d .sc3-cv"), chips: d.querySelectorAll(".opt .chip, .opt .pct").length, title: d.querySelector("h3").textContent } : null; });
    console.log(name, JSON.stringify(r)); const el = await p.$(".decision"); if (el) await el.screenshot({ path: path.join(OUT, name + ".png") }); return r;
  };
  const a = await show({ k: "ev", id: "gx_pelea_mediar", s: 5 }, "nueva"); if (!a || !a.sc3 || !a.chips) fail.push("nueva");
  const old = await js(() => { S.ph = "gap"; S.p.age = 27; S.p.fame = 40; const L = EVENTS.filter(e => { if (e.gx || e.manual) return false; try { X.cur = {id: e.id, s: 5}; const ok = (!e.when || e.when(X)) && e.text(X) && e.opts(X).length; X.cur = null; return ok; } catch (er) { X.cur = null; return false; } }); return (L.filter(e => /Vestuario|Salud|Familia|Prensa/.test((e._es || {}).cat || ""))[0] || L[0]).id; }); console.log("antigua id", old);
  const bb = await show({ k: "ev", id: old, s: 5 }, "antigua"); if (!bb || !bb.sc3) fail.push("antigua");
  /* rueda de prensa */
  const pr = await js(() => { const t = Object.keys(typeof EX_PEND !== "undefined" ? EX_PEND : {}); return t.filter(k => /press/.test(k)); });
  console.log("tipos de prensa", JSON.stringify(pr));
  if (pr.length) { const k = pr.indexOf("pressq") >= 0 ? "press" : pr[0]; const r = await show({ k: k, n: 1, pre: false, s: 3 }, "prensa"); if (!r || !r.sc3) fail.push("prensa"); }
  console.log(fail.length ? "FALLOS: " + fail.join(", ") : "scene3d OK"); console.log(errs.length ? "ERRORES:\n" + errs.slice(0, 5).join("\n") : "SIN ERRORES");
  await b.close();
})();
