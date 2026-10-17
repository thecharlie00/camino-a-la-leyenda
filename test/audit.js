/* Auditoría QA: carreras largas con detectores de anomalías (rangos, NaN, duplicados, nombres, eventos, economía).
   Uso: node test/audit.js [carreras jugador] [carreras míster] */
const fs = require("fs"), vm = require("vm"), path = require("path");
const SRC = path.join(__dirname, "../src"), files = require("./files.js");
const NP = +(process.argv[2] || 4), NM = +(process.argv[3] || 4);
const issues = {}, stats = {evs: {}, mev: {}, names: {}, ln: {}, careers: [], mgr: [], fin: [], market: []};
function issue(k, d) { issues[k] = issues[k] || {n: 0, ex: d}; issues[k].n++; }
function boot() { const G = {console, Math, Date, JSON}; vm.createContext(G); vm.runInContext(files.map(f => fs.readFileSync(path.join(SRC, f), "utf8")).join("\n"), G); G.buildWorld(); return G; }
function rng(seed) { let s = seed; return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; }
function chk(o, keys, lo, hi, tag) { keys.forEach(k => { const v = o[k]; if (v == null) return; if (typeof v !== "number" || !isFinite(v)) issue(tag + "." + k + " no numérico", v); else if (v < lo - 0.01 || v > hi + 0.01) issue(tag + "." + k + " fuera de rango", v); }); }
function scanP(G) {
  const S = G.S, p = S.p; if (!p) return;
  chk(p, ["form", "mor", "fit", "fame", "coach", "fans", "prof"], 0, 100, "jugador");
  chk(p, ["ovr"], 30, 99, "jugador"); if (!isFinite(p.money)) issue("jugador.money NaN", p.money);
  if (p.money < -5e5) issue("jugador.money muy negativo", Math.round(p.money));
}
function scanM(G) {
  const S = G.S, m = S.m; if (!m) return;
  chk(m, ["board", "fans", "chem", "rep"], 0, 100, "míster");
  if (!isFinite(m.bud)) issue("míster.bud NaN", m.bud); else if (m.bud < 0) issue("míster.bud negativo", Math.round(m.bud));
  const ids = {};
  m.sq.forEach(p => { if (ids[p.id]) issue("jugador duplicado en plantilla", p.id); ids[p.id] = 1; chk(p, ["fit", "mor"], 0, 100, "plantilla"); chk(p, ["ovr", "pot"], 25, 99, "plantilla"); if (p.age < 15 || p.age > 45) issue("plantilla.edad rara", p.age); if (!(p.sal >= 0)) issue("plantilla.sueldo NaN/negativo", p.sal); });
  if (m.club >= 0) { const xi = (m.xi || []).filter(x => x != null); if (new Set(xi).size !== xi.length) issue("once con repetidos", xi.join(",")); (m.bench || []).forEach(id => { if (xi.indexOf(id) >= 0) issue("jugador en once y banquillo", id); }); }
}
function scanWorld(G) { const S = G.S; Object.keys(S.cr).forEach(c => { const v = S.cr[c]; if (!isFinite(v)) issue("valoración de club NaN", c); else if (v < 25 || v > 99) issue("valoración de club fuera de rango", v); }); }
function pickIdx(d, r) { const ok = d.opts.map((o, i) => o.dis ? -1 : i).filter(i => i >= 0); return ok.length ? ok[Math.floor(r() * ok.length)] : 0; }
/* ---------- carreras de jugador ---------- */
for (let i = 0; i < NP; i++) {
  const G = boot(), r = rng(100 + i * 7);
  const pos = ["DC", "MC", "DFC", "POR", "ED", "LI"][i % 6];
  G.newCareer({fn: "Audit", ln: "P" + i, nat: ["ES", "AR", "FR", "BR", "NG", "JP"][i % 6], pos, foot: "Diestro", age: 17, talent: ["joya", "promesa", "elegido", "misterio"][i % 4], club: -1, ev: i % 3, seed: 300 + i, g: i % 2 ? "f" : "m"});
  const S = G.S; let g = 0, err = null;
  try {
    while (S.ph !== "ret" && g++ < 400000) {
      G.cleanPendPlayer();
      if (S.pend.length) {
        const x = S.pend[0];
        if (x.k === "ev") stats.evs[x.id] = (stats.evs[x.id] || 0) + 1;
        let ch = 0;
        if (x.k === "ev" || x.k === "moment" || x.k === "so") { const d = G.playerDesc(x); if (!d || !d.opts || !d.opts.length) issue("decisión sin opciones", x.k + ":" + x.id); else ch = pickIdx(d, r); }
        else if (x.k === "focus") ch = Math.floor(r() * 6);
        else if (x.k === "offers") ch = x.forced ? 0 : Math.floor(r() * (x.list.length + 1)) - 1;
        const fid = S.fid, before = S.pend.length;
        G.resolvePendingPlayer(ch);
        if (S.pend.length === before && S.pend[0] === x) { issue("decisión atascada", x.k); S.pend.shift(); }
      } else G.advancePlayer();
      if (g % 50 === 0) { scanP(G); }
      if (S.p.age >= 42) { issue("carrera que no termina", S.p.age); break; }
    }
  } catch (e) { err = e.message; issue("excepción en carrera de jugador", e.message.slice(0, 120)); }
  scanWorld(G);
  const t = G.careerTotals(), p = S.p;
  stats.careers.push({pos, g: S.g, seasons: p.seasons.length, peak: Math.round(p.peak), apps: t.apps, goals: t.g, tro: p.trophies.length, bdo: p.awards.filter(a => a.k === "bdo").length, caps: p.intl.caps, money: Math.round(p.money / 1e6), kb: Math.round(G.serialize().length / 1024), diary: (S.diary || []).length, feed: S.feed.length, err});
}
/* ---------- carreras de míster ---------- */
for (let i = 0; i < NM; i++) {
  const G = boot(), r = rng(900 + i * 13), lgs = [0, 3, 5, 9, 11, 36];
  const li = lgs[i % lgs.length], cl = G.W.lg[li].cl0;
  G.newManagerCareer({fn: "Audit", ln: "M" + i, nat: "ES", age: 40, diff: i % 4, ev: 1, club: cl[(i * 5) % cl.length], seed: 700 + i, g: i % 3 === 2 ? "f" : "m"});
  const S = G.S; S.noLiveAuto = true; S.m.xp = S.m.xp || {}; S.m.xp.live = 0;
  let g = 0, sacked = 0, err = null;
  try {
    while (S.m.seasons.length < 8 && S.ph !== "ret" && g++ < 400000) {
      G.cleanPend();
      if (S.pend.length) {
        const x = S.pend[0];
        if (x.k === "mev") stats.mev[x.id] = (stats.mev[x.id] || 0) + 1;
        if (x.k === "jobs") { if (x.sacked) sacked++; if (x.list.length) G.mgrTakeJob(x.list[Math.floor(r() * x.list.length)].club, x.list[0].sal); else { issue("sin ofertas tras despido", S.yr); break; } }
        else { const d = G.pendDesc(x); if (!d || !d.opts || !d.opts.length) { issue("decisión míster sin opciones", x.k + ":" + (x.id || "")); S.pend.shift(); continue; } const before = S.pend.length; G.resolvePending(pickIdx(d, r)); if (S.pend.length === before && S.pend[0] === x) { issue("decisión míster atascada", x.k); S.pend.shift(); } }
      } else G.advance();
      if (g % 40 === 0) scanM(G);
      if (S.m && S.m.mk && S.m.mk.list && g % 400 === 0) S.m.mk.list.forEach(t => stats.market.push({ovr: Math.round(t.ovr), fee: t.ask || t.fee || 0, sal: t.sal || 0, bud: S.m.bud, r: Math.round(S.cr[S.m.club] || 0)}));
    }
  } catch (e) { err = e.message; issue("excepción en carrera de míster", e.message.slice(0, 120)); }
  scanWorld(G);
  const m = S.m;
  stats.mgr.push({lg: G.W.lg[li].n, diff: i % 4, seasons: m.seasons.length, sacked, tro: m.trophies.length, rep: Math.round(m.rep), pos: m.seasons.map(x => x.pos).join(","), kb: Math.round(G.serialize().length / 1024), err});
  (m.finH || []).forEach(f => stats.fin.push({r: Math.round(S.cr[f.club] || 0), net: Math.round(f.net / 1e6), inc: Math.round(f.inc / 1e6)}));
  /* nombres generados */
  m.sq.concat(m.alumni || []).forEach(p => { const n = (p.fn || "") + " " + (p.ln || ""); stats.names[n] = (stats.names[n] || 0) + 1; stats.ln[p.ln] = (stats.ln[p.ln] || 0) + 1; });
}
/* ---------- informe ---------- */
console.log("=== INCIDENCIAS ===");
Object.keys(issues).sort((a, b) => issues[b].n - issues[a].n).forEach(k => console.log(issues[k].n + "× " + k + " · ej: " + JSON.stringify(issues[k].ex)));
console.log("=== CARRERAS DE JUGADOR ==="); stats.careers.forEach(c => console.log(JSON.stringify(c)));
console.log("=== CARRERAS DE MÍSTER ==="); stats.mgr.forEach(c => console.log(JSON.stringify(c)));
const ev = Object.entries(stats.evs).sort((a, b) => b[1] - a[1]); console.log("eventos jugador distintos:", ev.length, "· más repetidos:", ev.slice(0, 8).map(x => x[0] + "×" + x[1]).join(" "));
const me = Object.entries(stats.mev).sort((a, b) => b[1] - a[1]); console.log("eventos míster distintos:", me.length, "· más repetidos:", me.slice(0, 8).map(x => x[0] + "×" + x[1]).join(" "));
const nn = Object.values(stats.names), dup = nn.filter(v => v > 1).length; const lns = Object.entries(stats.ln).sort((a, b) => b[1] - a[1]);
console.log("nombres:", nn.length, "distintos · repetidos:", dup, "· apellidos más comunes:", lns.slice(0, 6).map(x => x[0] + "×" + x[1]).join(" "));
const fin = stats.fin; if (fin.length) console.log("finanzas (r, neto M, ingresos M):", fin.slice(0, 20).map(f => f.r + ":" + f.net + "/" + f.inc).join(" "));
const mk = stats.market; if (mk.length) { const aff = mk.filter(t => t.fee <= t.bud).length; console.log("mercado: objetivos", mk.length, "· asequibles", Math.round(aff / mk.length * 100) + "%", "· media ovr", Math.round(mk.reduce((a, t) => a + t.ovr, 0) / mk.length), "· r medio club", Math.round(mk.reduce((a, t) => a + t.r, 0) / mk.length)); }
