/* 4.6 «Dinastías» en Node: retirada → relevo familiar → otra generación → paso al banquillo → relevo desde el míster.
   Comprueba miembros, clubes de la familia, récords, guardar y cargar.
   Uso: node test/dyn46.js */
const fs = require("fs"), vm = require("vm"), path = require("path");
const SRC = process.env.CAMINO_SRC || path.join(__dirname, "../src");
const files = require("./files.js");
const ctx = {console, Math, Date, JSON};
vm.createContext(ctx);
vm.runInContext(files.map(f => fs.readFileSync(path.join(SRC, f), "utf8")).join("\n"), ctx, {filename: "game.js"});
const G = ctx, fail = [], notes = [];
let rnd = 4646;
function r() { rnd = (rnd * 1103515245 + 12345) & 0x7fffffff; return rnd / 0x7fffffff; }
function step() {
  G.cleanPend();
  const S = G.S;
  if (S.pend.length) {
    const x = S.pend[0];
    let ch = 0;
    if (x.k === "jobs") { if (x.list.length) { G.mgrTakeJob(x.list[0].club, x.list[0].sal); return; } ch = -1; }
    else if (x.k === "offers") ch = x.forced ? 0 : -1;
    else if (x.k === "objs" || x.k === "focus") ch = 0;
    else { const d = G.pendDesc(x); if (!d || !d.opts || !d.opts.length) throw new Error("sin opciones " + x.k); const ok = d.opts.map((o, i) => o.dis ? -1 : i).filter(i => i >= 0); ch = ok[Math.floor(r() * ok.length)]; }
    const before = S.pend.length;
    G.resolvePending(ch);
    if (S.pend.length === before && S.pend[0] === x) throw new Error("atascado " + x.k);
  } else G.advance();
}
function seasons(n) { const y = G.S.yr; let g = 0; while (G.S.yr < y + n && G.S.ph !== "ret" && g++ < 30000) step(); }
function toOff() { let g = 0; while (G.S.ph !== "off" && g++ < 30000) step(); }

G.newCareer({fn: "Abuelo", ln: "Dinastía", nat: "ES", pos: "DC", foot: "Diestro", age: 18, talent: "joya", club: -1, ev: 1, seed: 46});
seasons(3); toOff();
const club1 = G.S.p.club;
G.retire();
if (G.S.ph !== "ret" || !G.dynCanHeir()) fail.push("no se puede elegir relevo al retirarse");
const ok1 = G.dynHeirStart({fn: "Hijo", pos: "MC", foot: "Zurdo"});
const S = G.S, p = S.p;
notes.push("G2: " + p.fn + " " + p.ln + ", " + p.age + " años, " + G.clubName(p.club) + " (club del padre " + G.clubName(club1) + ") · fama " + p.fame + " · fase " + S.ph + " · pendientes " + S.pend.map(x => x.k).join(","));
if (!ok1 || S.dyn.g !== 2 || S.dyn.mem.length !== 1) fail.push("el relevo no crea la generación 2");
if (p.ln !== "Dinastía" || p.age !== 17) fail.push("el hijo no hereda apellido o no tiene 17 años");
if (S.mode !== "p" || S.retired) fail.push("quedan restos de la carrera anterior");
if (S.pend.map(x => x.k).indexOf("ev") < 0) fail.push("el hijo no empieza con su agente");
if (!G.dynFamClub(p.club) && G.S.cl[club1] >= 0) fail.push("el club del padre no cuenta como club de la familia");

seasons(2); toOff();
G.retire();
G.startManager();
let g2 = 0; while (G.S.ph === "mjob" && g2++ < 100) step();
const fam = G.S.feed.some(f => f.t === "mstart");
seasons(2);
let g3 = 0; while (G.S.ph !== "off" && g3++ < 30000) step();
G.mgrRetire();
const ok2 = G.dynHeirStart({fn: "Nieta", pos: "POR", foot: "Diestro"});
const R = G.dynRecords(), d = G.S.dyn;
notes.push("generaciones " + d.g + " · miembros " + d.mem.map(x => "G" + x.gen + (x.pk ? "J" : "") + (x.mk ? "M" : "")).join(" ") + " · clubes de la familia " + Object.keys(d.clubs).length);
notes.push("récords: " + JSON.stringify(R.t));
if (!ok2 || d.g !== 3 || d.mem.length !== 2) fail.push("el relevo desde el banquillo falla");
if (!d.mem[1].pk || !d.mem[1].mk) fail.push("la generación 2 no guarda su etapa de jugador y de míster");
if (R.t.apps !== d.mem.reduce((s, x) => s + (x.apps || 0), 0) + (G.dynLive() ? G.dynLive().apps || 0 : 0)) fail.push("los partidos de la familia no cuadran");
if (G.S.mode !== "p" || G.S.m) fail.push("tras el míster no vuelve el modo jugador");
seasons(1);
const save = G.serialize(); G.restore(save);
if (!G.S.dyn || G.S.dyn.g !== 3) fail.push("la dinastía no se guarda");
notes.push("G3 en su primera temporada: " + G.S.p.fn + " " + G.S.p.ln + " · " + G.clubName(G.S.p.club) + " · " + G.S.p.seasons.length + " temporada(s)");

console.log(notes.join("\n"));
console.log(fail.length ? "ERRORES: " + fail.join(" | ") : "SIN ERRORES");
