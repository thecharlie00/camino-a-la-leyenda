#!/usr/bin/env node
/* Herramienta de equilibrio (solo desarrollo): simula miles de tiros por perfil con la física y la IA reales
   y mide gol / parada / palo / fuera. Uso: node tools/sp-sim.js [n] */
global.N_ = s => s;
const fs = require("fs"), vm = require("vm"), path = require("path");
["sp-data.js", "sp-phys.js", "sp-ai.js"].forEach(f => vm.runInThisContext(fs.readFileSync(path.join(__dirname, "../src", f), "utf8"), {filename: f}));
const N = +(process.argv[2] || 1500), D = SP_DATA;
function tally() { return {n: 0, goal: 0, save: 0, post: 0, out: 0, wall: 0}; }
function add(t, res) { t.n++; if (res.scored) t.goal++; else if (res.saved) t.save++; else if (/post/.test(res.how)) t.post++; else if (res.how === "wall") t.wall++; else t.out++; }
function pct(t) { const f = k => (100 * t[k] / t.n).toFixed(1).padStart(5) + "%"; return `gol ${f("goal")} · parada ${f("save")} · palo ${f("post")} · fuera ${f("out")}` + (t.wall ? ` · barrera ${f("wall")}` : ""); }
const lerp = (a, b, k) => a + (b - a) * k;

/* 1) penalti avanzado: lanzador competente contra cada perfil de portero */
console.log("PENALTI (lanzador competente, tiro 75, portero 70)");
const allPen = tally();
D.keepers.forEach((prof, pi) => {
  const t = tally(), r = SpPhys.rng(1000 + pi);
  for (let i = 0; i < N; i++) {
    const u = r(), side = r() < 0.5 ? 1 : -1; let z, y, type = "placed", pow = lerp(0.45, 0.9, r());
    if (u < 0.4) { z = side * lerp(2.4, 3.2, r()); y = lerp(0.3, 0.7, r()); }
    else if (u < 0.65) { z = side * lerp(2.3, 3.1, r()); y = lerp(1.6, 2.1, r()); type = "power"; }
    else if (u < 0.85) { z = side * lerp(1.6, 2.4, r()); y = lerp(0.8, 1.4, r()); }
    else if (u < 0.95) { z = lerp(-0.6, 0.6, r()); y = lerp(0.5, 1.8, r()); type = "power"; }
    else { z = 0; y = 1.9; type = "chip"; }
    const sp = D.shots[type], sw = {y, z, v: lerp(sp.v[0], sp.v[1], pow), spin: [0, 0, type === "chip" ? -10 : 0], type, power: pow, quality: lerp(0.65, 1, r())};
    const aim = SpAI.applyError(sw, {skill: 75, press: 0.3, dist: 11}, r);
    const b0 = SpPhys.solve({x: 11, z: 0, kn: r()}, Math.max(SpPhys.R, Math.min(4, aim.y)), aim.z, aim.v, aim.spin, {});
    const kp = SpAI.aiKeeper(prof, b0, {gk: 70, pen: true, mem: {L: 0, R: 0, C: 0}, tell: 0}, r);
    const res = SpPhys.sim(b0, {keeper: kp}, {full: true}).res; add(t, res); add(allPen, res);
  }
  console.log("  " + prof.k.padEnd(8), pct(t));
});
console.log("  TOTAL   ", pct(allPen));

/* 2) parada de penalti: portero (tú, modelo de jugador medio) contra cada perfil de lanzador */
console.log("PARAR PENALTIS (tu portero 70: aciertas lado ~45 %, timing alrededor del golpeo)");
const allGk = tally();
D.takers.forEach((prof, pi) => {
  const t = tally(), r = SpPhys.rng(2000 + pi);
  for (let i = 0; i < N; i++) {
    const side = prof.side ? (r() < 0.68 ? prof.side : -prof.side) : (r() < 0.5 ? 1 : -1), pan = r() < prof.panenka, high = r() < prof.high;
    let tz = pan ? 0 : side * lerp(1.4, 3.2, r()), ty = pan ? 1.9 : high ? lerp(1.5, 2.3, r()) : lerp(0.25, 0.9, r());
    const sig = 0.25 + prof.nerves * 0.5; tz += SpAI.gauss(r) * sig; ty = Math.max(SpPhys.R, Math.min(3.2, ty + SpAI.gauss(r) * sig * 0.7));
    const b0 = SpPhys.solve({x: 11, z: 0, kn: r()}, ty, tz, pan ? 9.5 : lerp(18, 30, prof.power), [0, 0, pan ? -10 : 0], {});
    const guessRight = r() < 0.45, dz = guessRight ? Math.sign(tz || 1) : -Math.sign(tz || 1);
    const kp = {x: 0.25, z: 0, t0: lerp(-0.15, 0.12, r()), dur: 0.42, tz: dz * lerp(1.5, 3.0, r()), ty: r() < 0.6 ? ty : lerp(0.4, 1.8, r()), reach: D.bal.gkReach + D.bal.gkReachSkill * SpAI.sN(70), hands: 0.78};
    const res = SpPhys.sim(b0, {keeper: kp}, {full: true}).res; add(t, res); add(allGk, res);
  }
  console.log("  " + prof.k.padEnd(8), pct(t));
});
console.log("  TOTAL   ", pct(allGk));

/* 3) falta directa: lanzador bueno (tiro 78) con rosca por encima/al lado de la barrera */
console.log("FALTA DIRECTA (lanzador 78, portero 70)");
[18, 22, 26, 30].forEach(dist => {
  const t = tally(), r = SpPhys.rng(3000 + dist);
  for (let i = 0; i < N; i++) {
    const ang = (r() - 0.5) * 0.8, ball = {x: Math.max(17.2, Math.cos(ang) * dist), z: Math.sin(ang) * dist};
    const nW = dist <= 20 ? 5 : dist <= 25 ? 4 : 3, wall = SpAI.buildWall(ball, nW, 0, {}, r);
    const far = r() < 0.6, side = far ? -Math.sign(ball.z || 1) : Math.sign(ball.z || 1);
    const type = r() < 0.6 ? "curl" : r() < 0.5 ? "dip" : "power", sp = D.shots[type], pow = lerp(0.5, 0.95, r());
    const sw = {y: lerp(1.2, 2.2, r()), z: side * lerp(1.6, 3.3, r()), v: lerp(sp.v[0], sp.v[1], pow), spin: [0, type === "curl" ? -side * sp.spin * lerp(0.6, 1.1, r()) : 0, type === "dip" ? sp.spin : 0], type, power: pow, quality: lerp(0.6, 1, r())};
    const aim = SpAI.applyError(sw, {skill: 78, press: 0.3, dist}, r);
    const b0 = SpPhys.solve({x: ball.x, z: ball.z, kn: r()}, Math.max(SpPhys.R, Math.min(5, aim.y)), aim.z, aim.v, aim.spin, {});
    const kp = SpAI.aiKeeper(D.keepers[i % D.keepers.length], b0, {gk: 70, blind: r() < 0.4, x0: 0.4, z0: -Math.sign(ball.z || 1) * 0.5}, r);
    const res = SpPhys.sim(b0, {keeper: kp, wall}, {full: true}).res; add(t, res);
  }
  console.log(`  ${dist} m    `, pct(t));
});

/* 4) parar faltas: especialistas rivales contra tu barrera por defecto y un portero que acierta a veces */
console.log("PARAR FALTAS (barrera por defecto, tu portero 70)");
const allFk = tally();
D.fkTakers.forEach((spec, si) => {
  const t = tally(), r = SpPhys.rng(4000 + si);
  for (let i = 0; i < Math.min(N, 400); i++) {
    const dist = lerp(17, 28, r()), ang = (r() - 0.5) * 0.8, ball = {x: Math.max(17.2, Math.cos(ang) * dist), z: Math.sin(ang) * dist};
    const org = {n: dist <= 20 ? 5 : 4, shift: (ball.z > 0 ? 1 : -1) * 0.35, jump: "jump", gz: -Math.sign(ball.z || 1) * 0.6};
    const wall = SpAI.buildWall(ball, org.n, 0, {shift: org.shift}, r);
    const shot = SpAI.takerChoose(spec, ball, wall, org, {skill: 76}, r), c = SpPhys.cross(shot.b0, {}) || {z: 0, y: 1, t: 0.8};
    const good = r() < 0.5, kp = {x: 0.3, z: org.gz, t0: lerp(0.05, 0.35, r()), dur: 0.42, tz: good ? c.z + SpAI.gauss(r) * 0.25 : -c.z, ty: good ? c.y : 1, reach: D.bal.gkReach + D.bal.gkReachSkill * SpAI.sN(70), hands: 0.78};
    const res = SpPhys.sim(shot.b0, {keeper: kp, wall}, {full: true}).res; add(t, res); add(allFk, res);
  }
  console.log("  " + spec.k.padEnd(9), pct(t));
});
console.log("  TOTAL    ", pct(allFk));
