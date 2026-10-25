/* gx-sim.js — simula carreras completas y cuenta qué trofeos ampliados se consiguen (equilibrio 5.6).
   Uso: node tools/gx-sim.js [carreras] [--mgr] */
const fs = require("fs"), vm = require("vm"), path = require("path");
const SRC = path.join(__dirname, "../src"), files = require("../test/files.js");
const N = +(process.argv[2] || 6), MGR = process.argv.includes("--mgr");
const ctx = {console, Math, Date, JSON}; vm.createContext(ctx);
vm.runInContext(files.map(f => fs.readFileSync(path.join(SRC, f), "utf8")).join("\n"), ctx, {filename: "game.js"});
const G = ctx; let rnd = 777; const r = () => (rnd = (rnd * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
const got = {}, firstAt = {}, money = []; let errs = 0;
function pick(d) { const ok = d.opts.map((o, i) => o.dis ? -1 : i).filter(i => i >= 0); return ok.length ? ok[Math.floor(r() * ok.length)] : 0; }
function step() {
  G.cleanPendPlayer(); const S = G.S;
  if (S.pend.length) { const x = S.pend[0]; let ch = 0;
    if (x.k === "ev" || x.k === "moment" || x.k === "so") ch = pick(G.playerDesc(x)); else if (x.k === "focus") ch = Math.floor(r() * 6); else if (x.k === "offers") ch = x.forced ? 0 : Math.floor(r() * (x.list.length + 1)) - 1;
    G.resolvePendingPlayer(ch);
  } else G.advancePlayer();
}
function mstep() { G.cleanPend(); const S = G.S; if (S.pend.length) { const x = S.pend[0]; G.resolvePending(x.k === "jobs" ? Math.floor(r() * x.list.length) : pick(G.pendDesc(x))); } else G.advance(); }
const t0 = Date.now();
for (let i = 0; i < N; i++) {
  try {
    G.newCareer({fn: "Sim", ln: "N" + i, nat: ["ES", "AR", "FR", "BR", "ENG", "MA", "JP", "US"][i % 8], nat2: null, pos: ["DC", "MC", "DFC", "POR", "ED", "LD", "MCO", "MCD"][i % 8], foot: "Diestro", age: 17, talent: ["joya", "elegido", "promesa", "misterio"][i % 4], club: -1, ev: 2, seed: 1000 + i});
    let k = 0, m0 = 0; const ids = {};
    const chk = () => { G.achCheck(); Object.keys(G.S.ach || {}).forEach(id => { if (!ids[id]) { ids[id] = 1; got[id] = (got[id] || 0) + 1; (firstAt[id] = firstAt[id] || []).push(G.S.p ? G.S.p.age : 0); } }); };
    while (G.S.ph !== "ret" && k++ < 40000) { step(); if (k % 25 === 0) chk(); }
    chk();
    Object.keys((G.S.gx || {}).t || {}).forEach(id => { m0 += G.S.gx.t[id].$ || 0; }); money.push(m0);
    if (MGR) { G.S.p.age = 34; G.startManager(); let j = 0; while (G.S.ph !== "ret" && j++ < 120000) { mstep(); if (j % 40 === 0) chk(); if (G.S.m && G.S.m.seasons.length >= 10 && G.S.ph === "off" && !G.S.pend.length) break; } chk(); }
    process.stdout.write(".");
  } catch (e) { errs++; console.log("\nERROR", i, e.stack); }
}
console.log("\n" + N + " carreras en " + ((Date.now() - t0) / 1000).toFixed(1) + "s · errores " + errs);
const L = G.GX.list(), rows = L.map(o => [o.id, o.rar, o.mode, got[o.id] || 0]);
const byR = {b: [], s: [], g: []}; rows.forEach(x => byR[x[1]] && byR[x[1]].push(x[3] / N));
Object.keys(byR).forEach(k => { const a = byR[k]; console.log(k, "media de carreras que lo consiguen:", (a.reduce((s, x) => s + x, 0) / a.length * 100).toFixed(0) + "%"); });
console.log("Nunca:", rows.filter(x => !x[3] && x[2] === (MGR ? x[2] : "p")).map(x => x[0]).join(" "));
console.log("Siempre:", rows.filter(x => x[3] === N).map(x => x[0]).join(" "));
console.log("Dinero de trofeos por carrera:", money.map(x => Math.round(x / 1000) + "k").join(" "));
console.log(rows.filter(x => x[3]).map(x => x[0] + ":" + x[3]).join(" "));
