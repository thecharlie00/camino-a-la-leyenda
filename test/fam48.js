/* 4.8 «Familia» en Node: pareja y relación, hijos (nacidos y adoptados), hijo futbolista, ficharlo y seguir su recorrido,
   relevo con hijo o hija (también cambiando de fútbol), ligas de Tailandia y partidas antiguas.
   Uso: node test/fam48.js */
const fs = require("fs"), vm = require("vm"), path = require("path");
const SRC = process.env.CAMINO_SRC || path.join(__dirname, "../src");
const files = require("./files.js");
const code = files.map(f => fs.readFileSync(path.join(SRC, f), "utf8")).join("\n");
function mk(src) { const c = {console, Math, Date, JSON}; vm.createContext(c); vm.runInContext(src || code, c, {filename: "game.js"}); return c; }
const fail = [], notes = [];
let G;
function step(pref) {
  G.cleanPend(); const S = G.S;
  if (S.pend.length) {
    const x = S.pend[0]; let ch = 0;
    if (x.k === "jobs") { if (x.list.length) { G.mgrTakeJob(x.list[0].club, x.list[0].sal); return; } ch = -1; }
    else if (x.k === "offers") ch = x.forced ? 0 : -1;
    else if (x.k === "mlive" || x.k === "mlivew") { S.pend.shift(); S.noLiveAuto = true; return; }
    else if (x.k === "objs" || x.k === "focus" || x.k === "mfocus") ch = 0;
    else if (pref && pref[x.k] != null) ch = typeof pref[x.k] === "function" ? pref[x.k](x) : pref[x.k];
    else { const d = G.pendDesc(x); if (!d || !d.opts || !d.opts.length) { S.pend.shift(); return; } ch = d.opts.findIndex(o => !o.dis); }
    G.resolvePending(ch);
  } else G.advance();
}
function untilYr(y, pref) { let g = 0; while (G.S.yr < y && G.S.ph !== "ret" && g++ < 40000) step(pref); }

/* ---------- míster con pareja del mismo sexo y dos hijos ---------- */
G = mk(); G.buildWorld("m");
const club = G.W.clubs.findIndex(c => c.lg0 === 0);
G.newManagerCareer({fn: "Pep", ln: "Familia", nat: "ES", age: 44, diff: 0, ev: 1, club, seed: 48});
G.S.noLiveAuto = true;
if (!G.famCanSetup()) fail.push("no se puede preparar la familia al empezar");
G.famSetup({pt: {fn: "Álex", g: "m"}, kids: [{fn: "Leo", g: "m", age: 15}, {fn: "Ana", g: "f", age: 14}]});
const F = G.S.fam;
if (!F.pt || F.kids.length !== 2 || G.famCanSetup()) fail.push("la familia no se guarda o se puede preparar dos veces");
if (!G.famSameSex()) fail.push("pareja del mismo sexo no detectada");
const counts = {}, rels = [];
const pref = {kidfb: x => (G.famKid(x.kid).fn === "Leo" ? 3 : 2), kidsign: 0, fam: x => (x.id === "kid" ? 1 : 0)};
const res0 = G.resolvePending;
G.resolvePending = function (ch) { const x = G.S.pend[0]; if (x) counts[x.k + (x.id ? ":" + x.id : "")] = (counts[x.k + (x.id ? ":" + x.id : "")] || 0) + 1; return res0.apply(this, arguments); };
const y0 = G.S.yr;
for (let y = 1; y <= 4; y++) { untilYr(y0 + y, pref); if (G.S.fam.pt) rels.push(Math.round(G.S.fam.pt.rel)); }
const leo = G.S.fam.kids.find(k => k.fn === "Leo"), ana = G.S.fam.kids.find(k => k.fn === "Ana");
notes.push("decisiones: " + JSON.stringify(counts));
notes.push("relación por temporada: " + rels.join(" → ") + (G.S.fam.pt ? "" : " (ruptura)") + " · hijos: " + G.S.fam.kids.map(k => k.fn + (k.ad ? " (adoptado/a, " : " (") + G.famAge(k) + ")").join(", "));
if (!leo.fb) fail.push("Leo no empieza como futbolista a los 16");
else {
  const I = G.famKidInfo(leo);
  notes.push("Leo: " + G.posName(leo.fb.pos) + " · " + I.ovr + " de media · " + I.club + (I.mine ? " (en tu plantilla)" : "") + " · temporadas " + leo.fb.seasons.map(s => s.y + ":" + s.apps + "p/" + s.g + "g" + (s.mine ? "*" : "")).join(" "));
  if (!counts.kidsign) fail.push("nunca se ofrece fichar a tu hijo");
  if (leo.fb.pid == null && !leo.fb.seasons.some(s => s.mine)) fail.push("fichar a tu hijo no lo trae a tu plantilla");
  if (leo.fb.pid != null && !G.mPl(leo.fb.pid)) fail.push("el hijo fichado no está en la plantilla");
  if (leo.fb.pid != null && G.S.m.sq.find(p => p.id === leo.fb.pid).ln !== "Familia") fail.push("el hijo no lleva tu apellido");
}
if (!ana.fb) fail.push("Ana no empieza como futbolista");
else {
  notes.push("Ana: " + G.posName(ana.fb.pos) + " · " + Math.round(ana.fb.ovr) + " · " + G.famFbClubName(ana.fb) + " (" + (ana.fb.lg || "?") + ")");
  if (ana.fb.club !== -1 || !ana.fb.cn) fail.push("tu hija no juega en el fútbol femenino");
  if (G.famSignable(ana)) fail.push("se puede fichar a tu hija para el equipo masculino");
}
if (G.S.fam.kids.some(k => k.ad === false && G.famAge(k) < 3)) fail.push("una pareja del mismo sexo tiene un bebé en vez de adoptar");
/* ruptura si la relación cae del todo */
const sv = G.serialize();
G.S.fam.pt.rel = 9;
G.S.m.flags.famT = 0;
let g2 = 0; const bi = G.S.bi, yy = G.S.yr; while (G.S.fam.pt && g2++ < 4000 && G.S.yr <= yy + 1) step({fam: x => (x.id === "crisis" ? 2 : 2)});
if (G.S.fam.pt) fail.push("con la relación por los suelos no hay ruptura");
else notes.push("ruptura: " + G.S.fam.ex + " · " + (G.S.fam.exName || ""));
G.restore(sv);
if (!G.S.fam || G.S.fam.kids.length < 2) fail.push("la familia no se guarda");

/* ---------- relevo con Leo (mismo fútbol) ---------- */
let sv2 = G.serialize();
G.mgrRetire();
const hk = G.famHeirKids().map(k => k.fn);
notes.push("pueden tomar el relevo: " + hk.join(", "));
if (hk.indexOf("Leo") < 0) fail.push("tu hijo futbolista no puede tomar el relevo");
const leoOvr = Math.round(leo.fb.ovr);
G.dynHeirStart({kid: leo.id});
notes.push("relevo Leo: " + G.S.p.fn + " " + G.S.p.ln + " · " + G.S.p.age + " años · " + Math.round(G.S.p.ovr) + " (tenía " + leoOvr + ") · " + G.clubName(G.S.p.club) + " · mundo " + G.S.g);
if (G.S.p.fn !== "Leo" || G.S.mode !== "p" || Math.abs(G.S.p.ovr - leo.fb.ovr) > 1.5) fail.push("el relevo no sigue con tu hijo");
untilYr(G.S.yr + 1);
if (!G.S.p.seasons.length) fail.push("la carrera del hijo no avanza");

/* ---------- relevo con Ana (cambia al fútbol femenino) ---------- */
G = mk(); G.restore(sv2); G.mgrRetire();
const anaK = G.S.fam.kids.find(k => k.fn === "Ana");
const famClubs0 = Object.keys(G.S.dyn.clubs).length;
G.dynHeirStart({kid: anaK.id});
const S2 = G.S;
notes.push("relevo Ana: " + S2.p.fn + " " + S2.p.ln + " · " + S2.p.age + " años · " + Math.round(S2.p.ovr) + " · " + G.clubName(S2.p.club) + " · mundo " + S2.g + "/" + S2.wk + " · año " + S2.yr + " · generación " + S2.dyn.g + " · clubes de la familia " + Object.keys(S2.dyn.clubs).length + "+" + Object.keys(S2.dyn.clubsX || {}).length + " (antes " + famClubs0 + ")");
if (S2.g !== "f" || S2.wk !== "f2" || S2.p.fn !== "Ana" || S2.dyn.g !== 2) fail.push("el relevo de tu hija no la lleva al fútbol femenino");
if (Math.abs(S2.p.ovr - anaK.fb.ovr) > 1.5) fail.push("tu hija pierde su nivel al cambiar de fútbol");
untilYr(S2.yr + 1);
const R = G.dynRecords();
if (!R.all.length || !G.S.p.seasons.length) fail.push("la dinastía no sigue en el nuevo fútbol");
const sv3 = G.serialize(); G.restore(sv3);
if (G.S.g !== "f" || !G.S.dyn) fail.push("la partida cambiada de fútbol no se guarda bien");

/* ---------- relevo de jugador: elegir hija en una carrera masculina ---------- */
G = mk();
G.newCareer({fn: "Paco", ln: "Relevo", nat: "TH", pos: "DC", foot: "Diestro", age: 18, talent: "joya", club: -1, ev: 1, seed: 9});
const thClub = G.clubName(G.S.p.club), thLg = G.W.lg[G.S.cl[G.S.p.club]].n;
untilYr(G.S.yr + 2); let gg = 0; while (G.S.ph !== "off" && gg++ < 30000) step();
G.retire();
G.dynHeirStart({fn: "Nita", pos: "MC", foot: "Zurdo", g: "f"});
notes.push("jugador tailandés (" + thClub + ", " + thLg + ") → hija: " + G.S.p.fn + " " + G.S.p.ln + " · " + G.clubName(G.S.p.club) + " (" + G.W.lg[G.S.cl[G.S.p.club]].n + ") · mundo " + G.S.g);
if (G.S.g !== "f" || G.S.p.ln !== "Relevo") fail.push("elegir hija no cambia al fútbol femenino");
untilYr(G.S.yr + 1);

/* ---------- modo jugador: pareja, decisiones, y la familia sigue al pasar a entrenador y al relevo ---------- */
G = mk();
G.newCareer({fn: "Raúl", ln: "Pareja", nat: "ES", pos: "MC", foot: "Diestro", age: 24, talent: "joya", club: -1, ev: 1, seed: 77});
if (!G.famCanSetup()) fail.push("en modo jugador no se puede preparar la familia");
G.famSetup({pt: {fn: "Laura", g: "f"}, kids: [{fn: "Bruno", g: "m", age: 3}]});
const pc = {};
const rp0 = G.resolvePending;
G.resolvePending = function (ch) { const x = G.S.pend[0]; if (x) pc[x.k + (x.id ? ":" + x.id : "")] = (pc[x.k + (x.id ? ":" + x.id : "")] || 0) + 1; return rp0.apply(this, arguments); };
const yp = G.S.yr; untilYr(yp + 4, {pfam: 0});
const PF = G.S.fam;
notes.push("jugador · decisiones de pareja: " + JSON.stringify(Object.fromEntries(Object.entries(pc).filter(([k]) => /fam/.test(k)))) + " · relación " + (PF.pt ? Math.round(PF.pt.rel) : "ruptura") + " · hijos " + PF.kids.map(k => k.fn + "(" + G.famAge(k) + ")").join(", "));
if (!Object.keys(pc).some(k => /^pfam/.test(k))) fail.push("en modo jugador no salen decisiones de pareja");
let gr = 0; while (G.S.ph !== "off" && gr++ < 30000) step();
G.retire(); G.startManager();
let gj = 0; while (G.S.ph === "mjob" && gj++ < 200) step();
const MF = G.famOf();
notes.push("de jugador a entrenador: pareja " + (MF.pt ? MF.pt.fn : "—") + " · hijos " + MF.kids.map(k => k.fn).join(", ") + " · modo " + G.S.mode);
if (MF !== G.S.fam || (PF.pt && (!MF.pt || MF.pt.fn !== PF.pt.fn)) || MF.kids.length !== PF.kids.length) fail.push("la familia no sigue al pasar a entrenador");
untilYr(G.S.yr + 1);
const pt0 = MF.pt ? MF.pt.fn : null;
G.mgrRetire();
const dm = G.dynCur();
G.dynHeirStart({fn: "Bruno", pos: "DC", foot: "Diestro", g: "m"});
const HF = G.S.fam;
notes.push("relevo de Bruno: padres " + JSON.stringify(HF.par) + " · hermanos " + HF.kids.map(k => k.fn + (k.sib ? "*" : "")).join(", ") + " · pareja propia " + (HF.pt ? HF.pt.fn : "no") + " · árbol: " + (dm && dm.pt ? "con " + dm.pt : "sin pareja"));
if (!HF.par || HF.par.fn.indexOf("Raúl") < 0 || (pt0 && HF.par.pt !== pt0)) fail.push("el relevo no conserva a sus padres");
if (HF.kids.some(k => k.fn === "Bruno")) fail.push("quien toma el relevo sigue en la lista de hijos");
if (pt0 && (!dm || dm.pt !== pt0)) fail.push("la dinastía no recuerda a la pareja");
untilYr(G.S.yr + 1);

/* ---------- ligas de Tailandia ---------- */
G = mk(); G.buildWorld("m");
const th1 = G.W.lgIdx.THA1, th2 = G.W.lgIdx.THA2;
G.newManagerCareer({fn: "Kiat", ln: "Thai", nat: "TH", age: 40, diff: 1, ev: 1, club: G.W.lg[th1].cl0 && G.W.lg[th1].cl0.length ? G.W.lg[th1].cl0[0] : G.teamsOfLeague(th1)[0], seed: 66});
G.S.noLiveAuto = true;
const yT = G.S.yr; untilYr(yT + 2);
const tb = G.S.L[th1] && G.S.L[th1].tb ? G.S.L[th1].tb.length : 0;
notes.push("Thai League 1: " + G.teamsOfLeague(th1).length + " clubes · Thai League 2: " + G.teamsOfLeague(th2).length + " · tu club " + G.clubName(G.S.m.club) + " · temporadas " + G.S.m.seasons.map(s => s.pos + "º").join(", "));
if (G.teamsOfLeague(th1).length !== 16 || G.teamsOfLeague(th2).length !== 18) fail.push("las ligas tailandesas no tienen sus clubes");
/* una partida guardada antes de la 4.8 sigue funcionando */
const OLD = process.env.CAMINO_OLD;
if (OLD) {
  const of = files.filter(f => fs.existsSync(path.join(OLD, f))).map(f => fs.readFileSync(path.join(OLD, f), "utf8")).join("\n");
  const O = mk(of); O.buildWorld("m");
  O.newManagerCareer({fn: "Viejo", ln: "Guardado", nat: "ES", age: 45, diff: 1, ev: 1, club: O.W.clubs.findIndex(c => c.lg0 === 0), seed: 7});
  O.S.noLiveAuto = true;
  for (let i = 0; i < 3000; i++) { O.cleanPend(); if (O.S.pend.length) { const x = O.S.pend[0]; if (x.k === "mlive" || x.k === "mlivew") { O.S.pend.shift(); continue; } const d = O.pendDesc(x); O.resolvePending(x.k === "jobs" ? 0 : d && d.opts ? d.opts.findIndex(o => !o.dis) : 0); } else O.advance(); }
  const save = O.serialize();
  G = mk(); G.restore(save); G.S.noLiveAuto = true;
  const yo = G.S.yr; untilYr(yo + 1);
  notes.push("partida antigua: " + G.S.m.seasons.length + " temporadas · clubes " + G.S.cl.length + "/" + G.W.clubs.length + " · Thai League 1 " + G.teamsOfLeague(G.W.lgIdx.THA1).length + " · ¿familia? " + G.famCanSetup());
  if (G.S.cl.length !== G.W.clubs.length || !G.famCanSetup()) fail.push("la partida antigua no se adapta");
}
console.log(notes.join("\n"));
console.log(fail.length ? "ERRORES: " + fail.join(" | ") : "SIN ERRORES");
