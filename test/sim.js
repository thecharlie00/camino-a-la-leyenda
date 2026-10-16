/* Simulación de carreras completas en Node para cazar errores y revisar el equilibrio.
   Uso: node test/sim.js [carreras] [--mgr] */
const fs = require("fs"), vm = require("vm"), path = require("path");
const SRC = process.env.CAMINO_SRC || path.join(__dirname, "../src");
const N = +(process.argv[2] || 6);
const MGR = process.argv.includes("--mgr");
const files = require("./files.js");
const ctx = {console, Math, Date, JSON};
vm.createContext(ctx);
vm.runInContext(files.map(f => fs.readFileSync(path.join(SRC, f), "utf8")).join("\n"), ctx, {filename: "game.js"});
const G = ctx;
const hasDispatch = typeof G.mgrResolve === "function";
const seen = {}, outc = {good: 0, bad: 0, sure: 0}, mseen = {}, problems = [];
let rnd = 12345;
function r() { rnd = (rnd * 1103515245 + 12345) & 0x7fffffff; return rnd / 0x7fffffff; }
function checkDesc(d, x) {
  if (!d) { problems.push("sin descripción " + JSON.stringify(x)); return; }
  if (!d.title || !d.text) problems.push("sin título/texto " + x.k + " " + x.id);
  if (!d.opts || !d.opts.length) problems.push("sin opciones " + x.k + " " + x.id);
  d.opts.forEach(o => {
    const s = o.outs.reduce((a, u) => a + u.p, 0);
    if (Math.abs(s - 1) > 1e-6) problems.push("probabilidades no suman 1 " + x.id + " " + o.t);
    o.outs.forEach(u => u.chips.forEach(c => { if (!Array.isArray(c) || typeof c[0] !== "string") problems.push("chip raro " + x.id); if (typeof c[1] === "number" && !isFinite(c[1])) problems.push("chip NaN " + x.id + " " + c[0]); }));
  });
}
function pickIdx(d) { const ok = d.opts.map((o, i) => o.dis ? -1 : i).filter(i => i >= 0); return ok.length ? ok[Math.floor(r() * ok.length)] : 0; }
function playerStep() {
  G.cleanPendPlayer();
  const S = G.S;
  if (S.pend.length) {
    const x = S.pend[0];
    let ch = 0;
    if (x.k === "ev" || x.k === "moment" || x.k === "so") {
      const d = G.playerDesc(x); checkDesc(d, x);
      ch = pickIdx(d);
      const key = x.k === "ev" ? x.id : x.k === "moment" ? "M:" + x.id : "SO";
      seen[key] = (seen[key] || 0) + 1;
    } else if (x.k === "focus") ch = Math.floor(r() * 6);
    else if (x.k === "offers") ch = x.forced ? 0 : Math.floor(r() * (x.list.length + 1)) - 1;
    const before = S.pend.length, fid = S.fid;
    const card = G.resolvePendingPlayer(ch);
    if (card && card.t === "decision" || card && card.t === "moment") { if (card.good === null || card.good === undefined) outc.sure++; else if (card.good) outc.good++; else outc.bad++; }
    if (S.pend.length === before && S.pend[0] === x) throw new Error("decisión atascada " + JSON.stringify(x).slice(0, 200));
  } else G.advancePlayer();
}
function careerPlayer(i) {
  const pos = ["DC", "MC", "DFC", "POR", "ED", "LD", "MCO", "MCD"][i % 8];
  const nat = ["ES", "AR", "FR", "BR", "ENG", "MA", "JP", "US"][i % 8];
  G.newCareer({fn: "Prueba", ln: "N" + i, nat: nat, nat2: i % 3 === 0 ? "IT" : null, pos: pos, foot: "Diestro", age: 17, talent: ["joya", "elegido", "promesa", "misterio"][i % 4], club: -1, ev: 2, seed: 1000 + i * 7, g: process.env.FEM ? "f" : "m"});
  let steps = 0;
  while (G.S.ph !== "ret" && steps < 40000) { steps++; playerStep(); }
  if (G.S.ph !== "ret") throw new Error("la carrera no termina");
  const p = G.S.p, lg = G.legacy();
  return {pos, age: p.age, peak: Math.round(p.peak), apps: G.careerTotals().apps, g: G.careerTotals().g, tro: p.trophies.length, aw: p.awards.length, lg: lg.sc, title: lg.title, size: JSON.stringify(G.S).length};
}
function mgrStep() {
  G.cleanPend();
  const S = G.S;
  if (S.pend.length) {
    const x = S.pend[0];
    let ch = 0;
    if (x.k === "jobs") ch = Math.floor(r() * x.list.length);
    else {
      const d = G.pendDesc(x); checkDesc(d, x);
      ch = pickIdx(d);
      mseen[x.k + (x.id ? ":" + x.id : "")] = (mseen[x.k + (x.id ? ":" + x.id : "")] || 0) + 1;
    }
    const before = S.pend.length;
    G.resolvePending(ch);
    if (S.pend.length === before && S.pend[0] === x) throw new Error("decisión de míster atascada " + JSON.stringify(x).slice(0, 200));
  } else G.advance();
}
function careerMgr(i) {
  G.S.p.age = 34;
  G.startManager();
  let steps = 0, seasons0 = 0;
  /* el script hace de entrenador: ficha a veces, renueva, ajusta el once */
  while (G.S.ph !== "ret" && steps < 120000) {
    steps++;
    const m = G.S.m;
    if (m && m.club >= 0 && G.S.mk_tick !== G.S.tw && m.mk && m.mk.open && !G.S.pend.length) {
      G.S.mk_tick = G.S.tw;
      if (r() < 0.5) { const t = m.mk.list.filter(t => !t.done)[0]; if (t) G.mgrStartBid(t.id); }
      if (r() < 0.2) { const pl = m.sq.filter(p => p.age >= 31)[0]; if (pl) G.mgrStartSell(pl.id); }
      if (r() < 0.3) { m.xi = G.mBestXI(m.form); }
      if (r() < 0.1) { const f = Object.keys(G.FORMATIONS)[Math.floor(r() * 8)]; G.mSetFormation(f); }
      if (r() < 0.15) { const pl = m.sq.filter(p => p.yrs <= 2)[0]; if (pl) G.mgrStartRenew(pl.id); }
    }
    mgrStep();
    if (m && m.seasons.length > seasons0) { seasons0 = m.seasons.length; }
    if (m && m.seasons.length >= 12 && G.S.ph === "off" && !G.S.pend.length) break;
  }
  const m = G.S.m;
  return {club: G.clubName(m.club), seasons: m.seasons.length, tro: m.trophies.length, rep: Math.round(m.rep), board: Math.round(m.board), sq: m.sq.length,
    rows: m.seasons.map(s => s.y + " " + G.clubName(s.club).slice(0, 14) + " " + s.pos + "º " + s.w + "-" + s.d + "-" + s.l + " r" + s.r + (s.tro.length ? " [" + s.tro.join(", ") + "]" : "")).join("\n   "),
    size: JSON.stringify(G.S).length};
}
const t0 = Date.now();
for (let i = 0; i < N; i++) {
  try {
    const t = Date.now();
    const res = careerPlayer(i);
    console.log("jugador", i, JSON.stringify(res), (Date.now() - t) + "ms");
    if (MGR) {
      const t2 = Date.now();
      const rm = careerMgr(i);
      console.log("  míster:", rm.club, rm.seasons, "temp.", rm.tro, "títulos, prestigio", rm.rep, "directiva", rm.board, "plantilla", rm.sq, "tamaño", rm.size, (Date.now() - t2) + "ms\n   " + rm.rows);
    }
  } catch (e) { console.log("ERROR en carrera", i, e.stack); problems.push(String(e)); }
}
console.log("\nDecisiones vistas:", Object.keys(seen).length, "distintas");
console.log(Object.entries(seen).sort((a, b) => b[1] - a[1]).map(e => e[0] + ":" + e[1]).join("  "));
console.log("Desenlaces:", JSON.stringify(outc));
if (MGR) { console.log("Míster:", Object.entries(mseen).sort((a, b) => b[1] - a[1]).map(e => e[0] + ":" + e[1]).join("  ")); }
const never = G.EVENTS.filter(e => !seen[e.id]).map(e => e.id), neverM = G.MOMENTS.filter(m => !seen["M:" + m.id]).map(m => m.id);
console.log("Nunca vistas:", never.join(", "), "| momentos:", neverM.join(", "));
console.log("Problemas:", problems.length, problems.slice(0, 12));
console.log("Total", ((Date.now() - t0) / 1000).toFixed(1) + "s");
