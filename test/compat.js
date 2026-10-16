/* Compatibilidad: una partida guardada con la versión anterior debe cargarse y seguir jugando en la nueva. */
const fs = require("fs"), vm = require("vm"), path = require("path");
const OLD = process.argv[2];
const html = fs.readFileSync(OLD, "utf8");
const js = html.slice(html.indexOf("<script>") + 8, html.lastIndexOf("</script>")).replace(/<\\\/script/g, "</script");
const engine = js.slice(0, js.indexOf("/* ===== INTERFAZ ===== */"));
const A = {console, Math, Date, JSON}; vm.createContext(A); vm.runInContext(engine, A);
A.newCareer({fn: "Viejo", ln: "Guardado", nat: "AR", nat2: "IT", pos: "DC", foot: "Zurdo", age: 17, talent: "joya", club: -1, ev: 2, seed: 4242});
let k = 0, saves = [];
while (A.S.ph !== "ret" && k++ < 60000) {
  A.cleanPend();
  if (A.S.pend.length) { const x = A.S.pend[0]; if (saves.length < 6 && (x.k === "ev" || x.k === "moment" || x.k === "so")) saves.push(A.serialize()); let ch = 0; if (x.k === "offers") ch = x.forced ? 0 : -1; if (x.k === "ev" && x.id === "retiro") ch = A.EVENT_BY_ID.retiro.opts(A.X).length - 1; A.resolvePending(ch); }
  else A.advance();
  if (A.S.yr >= 2031 && A.S.ph === "gap" && saves.length < 8) saves.push(A.serialize());
}
saves.push(A.serialize());
console.log("partidas antiguas generadas:", saves.length, "· la última, retirado:", A.S.ph);
const SRC = path.join(__dirname, "../src");
const files = require("./files.js");
let ok = 0;
saves.forEach((json, i) => {
  const B = {console, Math, Date, JSON}; vm.createContext(B);
  vm.runInContext(files.map(f => fs.readFileSync(path.join(SRC, f), "utf8")).join("\n"), B);
  try {
    B.restore(json);
    const x0 = B.S.pend[0];
    if (x0 && (x0.k === "ev" || x0.k === "moment" || x0.k === "so")) { const d = B.pendDesc(x0); if (!d || !d.opts.length) throw new Error("sin descripción para " + JSON.stringify(x0)); }
    let s = 0;
    while (B.S.ph !== "ret" && s++ < 60000) {
      B.cleanPend();
      if (B.S.pend.length) { const x = B.S.pend[0]; let ch = 0; if (x.k === "offers") ch = x.forced ? 0 : -1; if (x.k === "ev" && x.id === "retiro") ch = B.playerDesc(x).opts.length - 1; B.resolvePending(ch); }
      else B.advance();
    }
    B.startManager();
    for (let t = 0; t < 4000 && B.S.m.seasons.length < 2; t++) { B.cleanPend(); if (B.S.pend.length) B.resolvePending(0); else B.advance(); }
    ok++;
  } catch (e) { console.log("fallo con la partida", i, e.stack.split("\n").slice(0, 3).join(" | ")); }
});
console.log("cargadas y continuadas sin errores:", ok + "/" + saves.length);
