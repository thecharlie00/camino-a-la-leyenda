/* 4.5 «Mundo vivo» en Node: divisiones nuevas, play-offs de ascenso, ligas femeninas con clubes reales,
   torneo de verano, juvenil, Copa juvenil y día de cierre del mercado.
   Uso: node test/world45.js [temporadas] */
const fs = require("fs"), vm = require("vm"), path = require("path");
const SRC = process.env.CAMINO_SRC || path.join(__dirname, "../src");
const SEASONS = +(process.argv[2] || 5);
const files = require("./files.js");
const ctx = {console, Math, Date, JSON};
vm.createContext(ctx);
vm.runInContext(files.map(f => fs.readFileSync(path.join(SRC, f), "utf8")).join("\n"), ctx, {filename: "game.js"});
const G = ctx, fail = [], notes = [];
let rnd = 4545;
function r() { rnd = (rnd * 1103515245 + 12345) & 0x7fffffff; return rnd / 0x7fffffff; }
const seen = {};
function step() {
  G.cleanPend();
  const S = G.S;
  if (S.pend.length) {
    const x = S.pend[0]; seen[x.k] = (seen[x.k] || 0) + 1;
    let ch = 0;
    if (x.k === "jobs") ch = Math.floor(r() * Math.max(1, x.list.length));
    else if (x.k === "offers") ch = x.forced ? 0 : -1;
    else if (x.k === "objs" || x.k === "focus") ch = 0;
    else { const d = G.pendDesc(x); if (!d || !d.opts || !d.opts.length) throw new Error("sin opciones " + x.k); const ok = d.opts.map((o, i) => o.dis ? -1 : i).filter(i => i >= 0); ch = ok.length ? ok[Math.floor(r() * ok.length)] : 0; }
    const before = S.pend.length;
    if (x.k === "jobs" && x.list.length) G.mgrTakeJob(x.list[ch].club, x.list[ch].sal); else G.resolvePending(ch);
    if (S.pend.length === before && S.pend[0] === x) throw new Error("atascado " + x.k);
  } else G.advance();
}
function sizes() { return G.W.lg.map((l, li) => G.teamsOfLeague(li).length); }
function runSeasons(n, label) {
  const yr0 = G.S.yr, sz0 = sizes(); let guard = 0, poChecked = 0, poOk = 0;
  while (G.S.yr < yr0 + n && guard++ < 40000) {
    const ph = G.S.ph; step();
    if (G.S.ph === "post" && ph !== "post" && G.S.last.po) {
      /* tras el fin de temporada: el ganador de cada play-off ya está en la división de arriba */
      Object.keys(G.S.last.po).forEach(li => {
        const po = G.S.last.po[li], L = G.W.lg[li], now = G.S.cl[po.w];
        const upper = L.upI, ok = now === upper || (G.W.lg[upper] && G.W.lg[upper].dv && G.W.lg[now] && G.W.lg[now].dv === G.W.lg[upper].dv);
        poChecked++; if (ok) poOk++;
      });
    }
  }
  const sz1 = sizes(), bad = [];
  sz0.forEach((v, i) => { if (v !== sz1[i]) bad.push(G.W.lg[i].id + " " + v + "→" + sz1[i]); });
  notes.push(label + ": " + (G.S.yr - yr0) + " temporadas · play-offs comprobados " + poOk + "/" + poChecked + (bad.length ? " · tamaños que cambian: " + bad.slice(0, 6).join(", ") : " · todas las ligas mantienen su tamaño"));
  if (bad.length) fail.push(label + ": cambian los tamaños de liga");
  if (poChecked && poOk !== poChecked) fail.push(label + ": un ganador de play-off no sube");
  if (!poChecked && label !== "femenino") fail.push(label + ": no se jugó ningún play-off");
}

/* mundo masculino: divisiones nuevas */
G.buildWorld("m");
const ids = G.W.lg.map(l => l.id);
["ENG4", "GER3", "ITA301", "ITA302", "ITA303", "FRA3", "POR2", "NED2", "BEL2", "TUR2", "SCO2", "ARG2", "BRA2", "JPN2"].forEach(id => { if (ids.indexOf(id) < 0) fail.push("falta la liga " + id); });
const names = {}; let dup = 0; G.W.clubs.forEach(c => { if (names[c.n]) dup++; names[c.n] = 1; });
notes.push("mundo masculino: " + G.W.lg.length + " ligas, " + G.W.clubs.length + " clubes, nombres repetidos " + dup);
if (dup) fail.push("clubes con el mismo nombre");

/* carrera de jugador */
G.newCareer({fn: "Test", ln: "Mundo", nat: "ES", pos: "DC", foot: "Diestro", age: 17, talent: "promesa", club: G.W.cName["Southampton"], ev: 1, seed: 45});
runSeasons(SEASONS, "jugador");
const p = G.S.p;
const yApps = Object.values(p.y45 || {}).reduce((s, x) => s + x.apps, 0);
notes.push("juvenil: " + yApps + " partidos · torneos de verano: " + (p.pt45 || []).length + " · pendientes vistos: " + JSON.stringify({ptour: seen.ptour || 0, pdl: seen.pdl || 0}));
if (!(p.pt45 || []).length) fail.push("el jugador no jugó ningún torneo de verano");
if (!yApps) fail.push("el jugador joven no jugó con el juvenil");
const save = G.serialize(); G.restore(save);
if (G.S.p.fn !== "Test") fail.push("guardar y cargar falla");

/* carrera de míster */
Object.keys(seen).forEach(k => delete seen[k]);
G.newManagerCareer({fn: "Pep", ln: "Mundo", nat: "ES", age: 40, diff: 1, ev: 1, club: G.W.cName["Sunderland"] != null ? G.W.cName["Sunderland"] : G.W.cName["Leeds United"], seed: 46});
let g2 = 0; while (G.S.ph === "mjob" && g2++ < 50) step();
runSeasons(SEASONS, "míster");
const m = G.S.m;
notes.push("míster: torneos de verano " + (m.pt45 || []).length + " · Copas juveniles " + (m.yc45 || []).length + " · días de cierre " + (seen.dlday || 0) + " · mtour " + (seen.mtour || 0));
if (!(seen.dlday >= SEASONS)) fail.push("faltan días de cierre del mercado");
if (!(m.yc45 || []).length) fail.push("no hay Copa juvenil");

/* día de cierre en directo: aceptar una oferta y una ganga */
(function () {
  const S = G.S;
  if (S.m.club < 0) return;
  S.ph = "pre"; S.bi = 0; S.m.mk.open = "verano"; S.m.dlDone = null; S.m.dl = null; S.pend = [];
  S.m.bud = Math.max(S.m.bud, 6e7); S.m.wcap = Math.max(S.m.wcap, G.mWageBill() * 2);
  G.advance();
  if (!S.pend.length || S.pend[0].k !== "dlday") { fail.push("no aparece el día de cierre"); return; }
  const D = G.dlStart(); let sold = 0, bought = 0; const sq0 = G.mActive().length, bud0 = S.m.bud;
  for (let t = 0; t < 12; t++) {
    G.dlTick(1);
    G.dlActive().forEach(e => { const res = G.dlAct(e.id, true); if (res.ok && e.k === "off") sold++; if (res.ok && e.k === "bar") bought++; });
  }
  const card = G.dlFinish(false);
  notes.push("directo: reloj " + G.dlClock(D.t) + " · noticias " + D.log.length + " · vendidos " + sold + " · fichados " + bought + " · presupuesto " + Math.round((S.m.bud - bud0) / 1e5) / 10 + " M€");
  if (G.dlClock(D.t) !== "00:00") fail.push("el reloj no llega a medianoche");
  if (!D.log.length) fail.push("el directo no tiene noticias");
  if (G.mActive().length !== sq0 - sold + bought) fail.push("la plantilla no cuadra tras el cierre");
  if (S.pend.length && S.pend[0].k === "dlday") fail.push("el día de cierre sigue pendiente");
  if (!card) fail.push("sin resumen del cierre");
  G.advance();
  if (S.ph !== "blk" && S.ph !== "gap") fail.push("tras el cierre no empieza el tramo (" + S.ph + ")");
  if (S.m.mk.open) fail.push("el mercado sigue abierto");
})();

/* mundo femenino nuevo (f2) */
G.newCareer({fn: "Ana", ln: "Mundo", nat: "ES", pos: "MC", foot: "Diestra", age: 18, talent: "promesa", club: -1, ev: 1, seed: 47, g: "f"});
const fw = G.W.wk, tur = G.W.lg.find(l => l.id === "TUR1"), turNames = G.teamsOfLeague(G.W.lgIdx.TUR1).map(c => G.W.clubs[c].n);
notes.push("femenino: mundo " + fw + " · Süper Lig: " + turNames.slice(0, 4).join(", ") + "…");
if (fw !== "f2" || turNames.indexOf("ABB Fomget") < 0) fail.push("las ligas femeninas nuevas no se usan");
runSeasons(2, "femenino");

console.log(notes.join("\n"));
console.log(fail.length ? "ERRORES: " + fail.join(" | ") : "SIN ERRORES");
