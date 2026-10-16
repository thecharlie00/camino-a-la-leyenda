/* Carreras de míster directo y de club propio en Node: errores, banquillo, mover jugadores, guardar/cargar.
   Uso: node test/modes.js [carreras] [temporadas] */
const fs = require("fs"), vm = require("vm"), path = require("path");
const SRC = process.env.CAMINO_SRC || path.join(__dirname, "../src");
const N = +(process.argv[2] || 3), SEASONS = +(process.argv[3] || 6);
const files = require("./files.js");
const ctx = {console, Math, Date, JSON};
vm.createContext(ctx);
vm.runInContext(files.map(f => fs.readFileSync(path.join(SRC, f), "utf8")).join("\n"), ctx, {filename: "game.js"});
const G = ctx, problems = [];
let rnd = 777;
function r() { rnd = (rnd * 1103515245 + 12345) & 0x7fffffff; return rnd / 0x7fffffff; }
function pickIdx(d) { const ok = d.opts.map((o, i) => o.dis ? -1 : i).filter(i => i >= 0); return ok.length ? ok[Math.floor(r() * ok.length)] : 0; }
function step() {
  G.cleanPend();
  const S = G.S;
  if (S.pend.length) {
    const x = S.pend[0];
    let ch = 0;
    if (x.k === "jobs") ch = Math.floor(r() * Math.max(1, x.list.length));
    else { const d = G.pendDesc(x); if (!d || !d.opts || !d.opts.length) throw new Error("sin opciones " + JSON.stringify(x).slice(0, 120)); ch = pickIdx(d); }
    const before = S.pend.length;
    if (x.k === "jobs" && x.list.length) G.mgrTakeJob(x.list[ch].club, x.list[ch].sal); else G.resolvePending(ch);
    if (S.pend.length === before && S.pend[0] === x) throw new Error("atascado " + JSON.stringify(x).slice(0, 160));
  } else G.advance();
}
function fiddle() {
  const m = G.S.m;
  if (!m || m.club < 0) return;
  /* mover jugadores al azar entre once, banquillo y grada */
  const zones = ["xi", "bench", "nc"];
  for (let k = 0; k < 3; k++) {
    const act = G.mActive();
    const p = act[Math.floor(r() * act.length)], q = act[Math.floor(r() * act.length)];
    if (!p || !q) continue;
    const z = G.mZoneOf(p.id), src = z[0] === "xi" ? {z: "xi", i: z[1]} : {z: z[0], id: p.id};
    const mode = Math.floor(r() * 3);
    let dst;
    if (mode === 0) { const zq = G.mZoneOf(q.id); dst = zq[0] === "xi" ? {z: "xi", i: zq[1]} : {z: zq[0], id: q.id}; }
    else if (mode === 1) dst = {z: "xi", i: Math.floor(r() * 11)};
    else dst = {z: zones[1 + Math.floor(r() * 2)]};
    G.mgrMove(src, dst);
  }
  /* invariantes */
  const ids = {}, all = [];
  m.xi.forEach(id => { if (id != null) all.push(id); });
  (m.bench || []).forEach(id => all.push(id));
  all.forEach(id => { if (ids[id]) problems.push("duplicado " + id); ids[id] = 1; if (!G.mPl(id)) problems.push("fantasma " + id); });
  if (m.xi.length !== 11) problems.push("once de " + m.xi.length);
  if ((m.bench || []).length > G.BENCH_N) problems.push("banquillo de " + m.bench.length);
}
function career(kind, i) {
  const diff = i % 4;
  if (kind === "mgr") {
    const lgs = [3, 0, 5, 7, 9, 4, 11, 45, 36, 48];
    const li = lgs[i % lgs.length];
    G.buildWorld();
    const cl = G.W.lg[li].cl0;
    G.newManagerCareer({fn: "Míster", ln: "Prueba" + i, nat: "ES", age: 40, diff, ev: 2, club: cl[(i * 7) % cl.length], seed: 500 + i, g: process.env.FEM ? "f" : "m"});
  } else {
    G.buildWorld();
    const li = [3, 4, 0, 5][i % 4], cl = G.W.lg[li].cl0;
    G.newClubCareer({fn: "Dueño", ln: "N" + i, nat: "ES", age: 38, diff, ev: 2, seed: 900 + i, cn: "Atlètic Prova " + i, ab: "APR", col: ["#123456", "#ffcc00"], repl: cl[cl.length - 1], g: process.env.FEM ? "f" : "m"});
    if (G.S.ph !== "draft") throw new Error("no empieza en el borrador");
    G.clubRedraft();
    G.S.m.sq.slice(0, 3).forEach((p, k) => G.mgrRename(p.id, "Nombre" + k, "Cambiado" + k));
    G.clubStart();
    if (G.W.clubs[G.S.m.club].n !== "Atlètic Prova " + i) problems.push("el club propio no tiene su nombre");
  }
  let steps = 0, saved = false;
  while (steps < 150000) {
    steps++;
    if (r() < 0.02) fiddle();
    step();
    const m = G.S.m;
    if (!saved && m.seasons.length === 2) {
      /* guardar y cargar a mitad de carrera */
      const json = G.serialize();
      G.restore(json);
      saved = true;
      if (kind === "club" && G.W.clubs[G.S.custom.id].n !== G.S.custom.n) problems.push("al cargar se pierde el club propio");
    }
    if (G.S.ph === "ret") break;
    if (m.seasons.length >= SEASONS && G.S.ph === "off" && !G.S.pend.length) break;
  }
  const m = G.S.m;
  const reals = m.sq.filter(p => p.rl).length;
  return {kind, diff, club: G.clubName(m.club), seasons: m.seasons.length, tro: m.trophies.length, rep: Math.round(m.rep), board: Math.round(m.board), sq: m.sq.length, bench: (m.bench || []).length, reals,
    rows: m.seasons.map(s => s.y + " " + G.clubName(s.club).slice(0, 16) + " " + s.pos + "º " + s.w + "-" + s.d + "-" + s.l + " r" + s.r).join(" | ")};
}
const t0 = Date.now();
for (let i = 0; i < N; i++) {
  for (const kind of ["mgr", "club"]) {
    try { const res = career(kind, i); console.log(JSON.stringify(res)); }
    catch (e) { console.log("ERROR", kind, i, e.stack); problems.push(String(e)); }
  }
}
/* el club propio no debe quedarse pegado al cargar otra partida */
try {
  G.newCareer({fn: "A", ln: "B", nat: "ES", pos: "DC", foot: "Diestro", age: 17, talent: "joya", club: -1, ev: 1, seed: 1});
  const dup = G.W.clubs.filter(c => /Atlètic Prova/.test(c.n)).length;
  if (dup) problems.push("nombre del club propio pegado en otra partida");
} catch (e) { problems.push(String(e)); }
console.log("Problemas:", problems.length, problems.slice(0, 15));
console.log("Total", ((Date.now() - t0) / 1000).toFixed(1) + "s");
