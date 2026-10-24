// Node: física de balón parado (determinismo, gol, parada, poste, barrera, rosca)
global.N_ = s => s;
const fs = require("fs"), vm = require("vm");
["src/sp-data.js", "src/sp-phys.js"].forEach(f => vm.runInThisContext(fs.readFileSync(f, "utf8"), {filename: f}));
let ok = 0, bad = 0; const T = (c, m) => { if (c) ok++; else { bad++; console.log("FAIL", m); } };
const from = {x: 11, z: 0};
let v = SpPhys.solve(from, 2.0, 3.0, 25, [0, 0, 0], {});
let r = SpPhys.sim(v, {}); T(r.res.how === "goal", "corner goal " + r.res.how);
const c = SpPhys.cross(v, {}); T(Math.abs(c.y - 2.0) < 0.02 && Math.abs(c.z - 3.0) < 0.02, "solver hits target " + JSON.stringify(c));
let r2 = SpPhys.sim(v, {}); T(JSON.stringify(r2.path) === JSON.stringify(r.path), "deterministic");
// portero que llega
let v2 = SpPhys.solve(from, 1.0, 2.4, 22, [0, 0, 0], {});
const kp = {x: 0.3, z: 0, t0: 0.05, dur: 0.38, tz: 2.4, ty: 1.0, reach: 2.6, hands: 0.7};
let r3 = SpPhys.sim(v2, {keeper: kp}); T(r3.res.saved, "save " + r3.res.how);
// poste
let vp = SpPhys.solve(from, 1.0, 3.72, 24, [0, 0, 0], {}); let r4 = SpPhys.sim(vp, {}); T(/post/.test(r4.res.how), "post " + r4.res.how);
// fuera
let vw = SpPhys.solve(from, 1.0, 4.4, 24, [0, 0, 0], {}); T(SpPhys.sim(vw, {}).res.how === "wide", "wide");
let vo = SpPhys.solve(from, 2.9, 0, 26, [0, 0, 0], {}); T(SpPhys.sim(vo, {}).res.how === "over", "over");
// barrera a 9.15 m en una falta frontal a 22 m: tiro raso choca
const wall = [-0.75, -0.25, 0.25, 0.75].map(z => ({x: 22 - 9.15, z, dx: 1, dz: 0, h: 1.85}));
let vf = SpPhys.solve({x: 22, z: 0}, 0.4, 0.5, 24, [0, 0, 0], {}); T(SpPhys.sim(vf, {wall}).res.how === "wall", "wall block " + SpPhys.sim(vf, {wall}).res.how);
// rosca: con efecto la trayectoria se curva (cruza en otro sitio que sin efecto con la misma velocidad inicial)
const base = {x: 22, z: 0, vx: -24, vy: 7.5, vz: 2.5};
const a = SpPhys.cross(Object.assign({}, base), {}), b = SpPhys.cross(Object.assign({}, base, {wy: 55}), {});
T(Math.abs(a.z - b.z) > 1.2, "curl bends " + a.z.toFixed(2) + " vs " + b.z.toFixed(2));
// folha seca: topspin baja más
const d = SpPhys.cross(Object.assign({}, base, {wz: 40}), {}); T(d.y < a.y - 0.6, "dip drops " + a.y.toFixed(2) + " vs " + d.y.toFixed(2));
// solver con rosca y barrera saltando
let vc = SpPhys.solve({x: 22, z: 0}, 2.1, 2.8, 25, [0, 55, 0], {}); const cc = SpPhys.cross(vc, {}); T(Math.abs(cc.z - 2.8) < 0.03 && Math.abs(cc.y - 2.1) < 0.03, "solver with curl");
console.log("spphys", ok, "ok,", bad, "fail"); process.exit(bad ? 1 : 0);
