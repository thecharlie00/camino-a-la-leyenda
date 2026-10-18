/* 4.7 «Sin rachas eternas» en Node: oportunidad tras suplencias, decisión de minutos, oferta de verano,
   ultimátum de la directiva (superado, fallado y uno solo por temporada), conjura y guardado.
   Uso: node test/blp47.js */
const fs = require("fs"), vm = require("vm"), path = require("path");
const SRC = process.env.CAMINO_SRC || path.join(__dirname, "../src");
const files = require("./files.js");
const code = files.map(f => fs.readFileSync(path.join(SRC, f), "utf8")).join("\n");
function mk() { const c = {console, Math, Date, JSON}; vm.createContext(c); vm.runInContext(code, c, {filename: "game.js"}); return c; }
const fail = [], notes = [];
function step(G) {
  G.cleanPend(); const S = G.S;
  if (S.pend.length) {
    const x = S.pend[0]; let ch = 0;
    if (x.k === "jobs") { if (x.list.length) { G.mgrTakeJob(x.list[0].club, x.list[0].sal); return; } ch = -1; }
    else if (x.k === "offers") ch = x.forced ? 0 : -1;
    else if (x.k === "objs" || x.k === "focus" || x.k === "mfocus") ch = 0;
    else if (x.k === "mlive" || x.k === "mlivew") { S.pend.shift(); S.noLiveAuto = true; return; }
    else { const d = G.pendDesc(x); if (!d || !d.opts || !d.opts.length) { S.pend.shift(); return; } ch = d.opts.findIndex(o => !o.dis); }
    G.resolvePending(ch);
  } else G.advance();
}

/* ---------- jugador ---------- */
let G = mk();
G.newCareer({fn: "Ana", ln: "Banquillo", nat: "ES", pos: "DC", foot: "Diestro", age: 18, talent: "normal", club: -1, ev: 1, seed: 47});
let g = 0; while (!(G.S.ph === "blk" && G.S.cur) && g++ < 2000) step(G);
const S = G.S, f0 = {kind: "lg", imp: 1};
/* un jugador muy por debajo del equipo casi nunca sería titular */
S.p.ovr = 40; S.p.coach = 5; S.p.flags.frozen = false;
G.blpOf().bench = 0;
let base = 0; for (let i = 0; i < 2000; i++) if (G.selection(Object.assign({}, f0), null, 80, 70, false) === "start") base++;
G.blpOf().bench = 6;
let pity = 0; for (let i = 0; i < 2000; i++) { G.blpOf().bench = 6; if (G.selection(Object.assign({}, f0), null, 80, 70, false) === "start") pity++; }
notes.push("titular sin ayuda " + (base / 20).toFixed(1) + " % · tras 6 sin jugar " + (pity / 20).toFixed(1) + " % (esperado ≈ " + Math.round(G.blpBenchChance(6) * 100) + " %)");
if (pity / 2000 < G.blpBenchChance(6) - 0.05 || pity / 2000 > G.blpBenchChance(6) + base / 2000 + 0.05) fail.push("la oportunidad del míster no sigue su fórmula");
if (G.blpBenchChance(3) !== 0 || G.blpBenchChance(4) !== 0.12 || G.blpBenchChance(20) !== 0.6) fail.push("escala de la oportunidad incorrecta");
/* congelado (castigado) no recibe ayuda */
S.p.flags.frozen = true; let fr = 0; for (let i = 0; i < 500; i++) { G.blpOf().bench = 8; if (G.selection(Object.assign({}, f0), null, 80, 70, false) === "start") fr++; }
if (fr > 25) fail.push("un jugador apartado recibe la ayuda");
S.p.flags.frozen = false;
/* decisión de minutos → promesa → titular */
const d = G.EX_PEND.blpbench.desc({k: "blpbench", n: 5});
if (!d || d.opts.length !== 3) fail.push("la decisión de minutos no tiene tres opciones");
S.pend.unshift({k: "blpbench", n: 5});
const card = G.resolvePending(0);
if (!card || !G.blpOf().promise) fail.push("pedir explicaciones no deja la promesa");
const ff = Object.assign({}, f0); const r1 = G.selection(ff, null, 80, 70, false);
if (r1 !== "start" || ff.blpGive !== "promise" || G.blpOf().promise) fail.push("la promesa no se cumple en el siguiente partido");
/* oferta de verano jugando poco */
S.p.ovr = 70; S.p.loan = null; S.p.ss = {rn: 10, rs: 58, min: 100, tm: 30}; S.p.fame = 0; S.p.agent = 0; S.p.flags.wantOut = false; S.p.age = 27; S.p.con = {yrs: 2, sal: 1e5};
const old = G.genOffers; let empty = 0, saved = 0;
for (let i = 0; i < 60; i++) { const o = G.genOffers("verano"); if (o.some(x => x.blp)) saved++; if (!o.length) empty++; }
notes.push("veranos jugando poco: sin ninguna oferta " + empty + "/60 · rescatados por el agente " + saved);
if (empty) fail.push("un verano jugando poco se queda sin ofertas");
/* la racha se guarda */
G.blpOf().bench = 3; G.blpOf().mg = 2;
G.restore(G.serialize());
if (!G.S.blp || G.S.blp.bench !== 3 || G.blpMgBonus() !== 8) fail.push("las rachas no se guardan");
G.blpMgResult(false); if (G.blpMgBonus() !== 12) fail.push("la confianza no sube tras otro fallo");
G.blpMgResult(false); if (G.blpMgBonus() !== 12) fail.push("la confianza no tiene tope");
G.blpMgResult(true); if (G.blpMgBonus() !== 0) fail.push("la confianza no se reinicia al acertar");

/* mala suerte en las decisiones */
G.S.pend = [{k: "ev", id: "x"}]; G.S.blp.bad = 0;
const opt = p0 => ({p: p0, ok: {txt: "bien"}, ko: {txt: "mal"}});
const goodP = (p0) => G.outcomesOf(opt(p0)).filter(u => u.good).reduce((t, u) => t + u.p, 0);
const lk = [];
[0, 1, 2, 3].forEach(n => { G.S.blp.bad = n; lk.push([n, Math.round(goodP(0.5) * 100), Math.round(goodP(0.3) * 100)]); });
notes.push("mala suerte (seguidas → % con 50 / con 30): " + lk.map(x => x[0] + "→" + x[1] + "/" + x[2]).join(" · "));
if (lk[0][1] !== 50 || lk[1][1] !== 62 || lk[2][1] !== 74 || lk[3][1] !== 86 || lk[3][2] !== 66) fail.push("la protección de mala suerte no sigue su fórmula");
G.S.blp.bad = 3; G.S.pend = [{k: "moment", id: "x"}]; G.S.blp.mbad = 0;
G.S.blp.mbad = 5; if (Math.round(goodP(0.8) * 100) !== 90) fail.push("la ayuda supera el 90 %"); G.S.blp.mbad = 0;
if (Math.round(goodP(0.5) * 100) !== 50) fail.push("las jugadas de partido comparten la cuenta con las decisiones");
G.S.pend = [];
G.S.blp.bad = 2; const m0 = G.S.p.mor;
G.feed({t: "decision", good: false, pct: 40, chips: [], title: "x"});
if (G.S.blp.bad !== 3 || G.S.p.mor < m0 + 3 - 0.01) fail.push("a la tercera mala no hay consuelo");
G.feed({t: "decision", good: true, pct: 100, chips: [], title: "x"});
if (G.S.blp.bad !== 0) fail.push("la racha no se reinicia al salir bien");
G.S.blp.mbad = 1; G.feed({t: "moment", good: false, pct: 30, chips: [], title: "x"});
if (G.S.blp.mbad !== 2 || G.S.blp.bad !== 0) fail.push("las jugadas no llevan su propia cuenta");

/* ---------- míster ---------- */
G = mk(); G.buildWorld("m");
const club = G.W.clubs.findIndex(c => c.lg0 === 0);
G.newManagerCareer({fn: "Pep", ln: "Ultimátum", nat: "ES", age: 45, diff: 2, ev: 1, club, seed: 470});
G.S.noLiveAuto = true;
/* segunda temporada: en la primera la directiva da margen hasta el tramo 2 */
const yM = G.S.yr; g = 0; while (!(G.S.ph === "blk" && G.S.bi === 1 && G.S.yr > yM) && g++ < 20000) step(G);
const M = G.S.m;
M.board = 1; /* al acabar este tramo la directiva te despediría */
let sackedNow = 0; const sk = G.mgrSacked; G.mgrSacked = function () { sackedNow++; return sk.apply(this, arguments); };
g = 0; while (G.S.bi === 1 && g++ < 5000) step(G);
const u = G.S.m.ult;
console.log("club tras la 1.ª temporada: " + G.clubName(G.S.m.club) + " (inicial " + G.clubName(club) + ")");
notes.push("tramo 1 con la directiva a 1: " + (u ? "ultimátum, piden " + u.need + " pts/partido en el tramo " + u.bi : "sin ultimátum") + " · despidos " + sackedNow);
if (!u || sackedNow) fail.push("con la directiva en el suelo no hay ultimátum, hay despido");
if (!u) { console.log(notes.join("\n")); console.log("ERRORES: " + fail.join(" | ")); process.exit(1); }
if (u.bi !== 2) fail.push("el ultimátum no es para el tramo siguiente");
if (u && (u.need < 0.9 || u.need > 1.9)) fail.push("objetivo del ultimátum fuera de rango");
/* superado */
let sv = G.serialize();
G.S.m.ult.bi = G.S.bi; G.S.m.ult.y = G.S.yr;
let r = G.blpUltBlock({lgN: 5, lgPts: Math.ceil(5 * u.need)});
if (r !== 1 || G.S.m.ult.st !== "ok" || G.S.m.board < G.mSackT(1) + 14) fail.push("superar el ultimátum no devuelve la confianza");
/* uno por temporada: otra caída en la misma temporada es despido */
if (G.blpUltimatum(0)) fail.push("segundo ultimátum en la misma temporada");
/* fallado */
G.restore(sv); G.S.m.ult.bi = G.S.bi; G.S.m.ult.y = G.S.yr;
r = G.blpUltBlock({lgN: 5, lgPts: 1});
if (r !== -1 || G.S.m.ult.st !== "fail" || !G.blpMustGo()) fail.push("fallar el ultimátum no despide");
if (G.blpUltimatum(0)) fail.push("tras fallar el ultimátum llega otro");
/* camino completo: jugar el tramo del ultimátum */
G.restore(sv);
g = 0; sackedNow = 0; while (G.S.bi === 2 && g++ < 5000) step(G);
const u2 = G.S.m.ult;
notes.push("tramo del ultimátum jugado: " + (u2 ? u2.st + " (media " + u2.got + ", piden " + u2.need + ")" : "?") + " · despedido " + sackedNow + " · club " + G.clubName(G.S.m.club));
if (!u2 || (u2.st === "fail") !== (sackedNow > 0)) fail.push("el resultado del ultimátum no cuadra con el despido");
/* temporadas enteras con un bot que lo hace mal, sin errores */
G.restore(sv);
/* (conjura: a los 5 y 9 partidos sin ganar aparece el refuerzo «Conjura») */
const y0 = G.S.yr; g = 0; let conj = 0, maxWl = 0, had = false;
while (G.S.yr < y0 + 4 && g++ < 60000) {
  step(G);
  const b = G.S.blp || {}; maxWl = Math.max(maxWl, b.mwl || 0);
  const has = !!(G.S.m.buffs || []).some(x => x.n === G.tr("Conjura"));
  if (has && !had) conj++; had = has;
  if ((b.mwl === 5 || b.mwl === 9) && G.S.m.club >= 0 && !has && G.S.ph === "blk") { fail.push("racha de " + b.mwl + " sin ganar sin conjura"); break; }
}
notes.push("4 temporadas más: " + G.S.m.seasons.length + " temporadas · club " + G.clubName(G.S.m.club) + " · peor racha sin ganar " + maxWl + " · conjuras " + conj);

console.log(notes.join("\n"));
console.log(fail.length ? "ERRORES: " + fail.join(" | ") : "SIN ERRORES");
