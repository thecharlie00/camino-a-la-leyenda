// Node: lógica de la mascota 5.6 (tiempo real, reloj atrasado, trucos, migración, concursos)
global.N_ = function (s) { return s; };
var fs = require("fs"), vm = require("vm");
global.S = {yr: 2026, p: {money: 5000, mor: 50, fame: 10}};
var L = {}; global.lifeOf = function () { return L; };
[ "src/pet-items.js", "src/pet-sim.js"].forEach(function (f) { vm.runInThisContext(fs.readFileSync(f, "utf8"), {filename: f}); });
var ok = 0, bad = 0; function T(c, m) { if (c) ok++; else { bad++; console.log("FAIL", m); } }
var now = new Date(2026, 9, 20, 12, 0).getTime(); PetSim.clock = function () { return now; };
var pt = PetSim.fresh("dog", "Toby"); L.pet = pt;
now += 3 * PetSim.H; PetSim.tick(pt); T(pt.n.hun < 80 && pt.n.hun > 60, "hun decays " + pt.n.hun);
var h0 = pt.n.hun; now -= 5 * PetSim.H; T(PetSim.tick(pt) === 0 && pt.n.hun === h0, "clock back = no time");
now += 5 * PetSim.H; PetSim.tick(pt); T(Math.abs(pt.n.hun - h0) < 0.01, "back to tmax: still nothing");
now += 30 * 24 * PetSim.H; PetSim.tick(pt); T(Math.min.apply(null, PetSim.NEEDS.map(function (k) { return pt.n[k]; })) >= 18, "absence floor");
T(pt.bond >= 5 && pt.missed, "bond floor + missed");
T(PetSim.expr(pt) === "sad" || PetSim.expr(pt) === "sleep", "sad on return " + PetSim.expr(pt));
PetSim.inv().food_basic = 2; var r = PetSim.feed(pt, "food_basic"); T(r.ok && PetSim.inv().food_basic === 1, "feed uses food");
// trucos: sin días distintos no pasa de 60
pt.mood = 90; pt.n.ene = 90; var rng = function () { return 0.01; };
for (var i = 0; i < 40; i++) { PetSim.trickTry(pt, "sit", rng); PetSim.reward(pt, "sit", "pat"); }
T(pt.tr.sit.m <= 60, "one day caps " + pt.tr.sit.m);
for (var d = 0; d < 4; d++) { now += 24 * PetSim.H; for (i = 0; i < 20; i++) { pt.n.ene = 90; PetSim.trickTry(pt, "sit", rng); PetSim.reward(pt, "sit", "pat"); } }
T(pt.tr.sit.m >= 80, "mastered after days " + pt.tr.sit.m);
now += 40 * 24 * PetSim.H; PetSim.tick(pt); T(pt.tr.sit.m >= 70 && pt.tr.sit.m < 100, "forget floor " + pt.tr.sit.m);
// racha de fallos ayuda
pt.fails = 0; var hard = function () { return 0.3; }; var seq = []; for (i = 0; i < 8; i++) seq.push(PetSim.trickTry(pt, "juggle", hard).r); T(seq.indexOf("ok") >= 0, "pity " + seq.join(","));
// migración
var L2 = {pet: {k: "cat", nm: "Misi", age: 4, bond: 77, tricks: 3, eq: {h: "cap"}, life: 15}};
PetSim.migrate(L2); T(L2.pet.v === 2 && L2.pet.nm === "Misi" && L2.pet.bond === 77 && L2.pet.tr.sit.m === 55 && L2.pet.eq.h === "cap" && PetSim.stage(L2.pet) === 2, "migrate");
// tienda y concurso
var st = PetSim.stock(pt); T(st.length === 6 && st.join() === PetSim.stock(pt).join(), "stock deterministic");
var m0 = S.p.money; T(PetSim.buy(st[0]).ok && S.p.money < m0 && PetSim.has(st[0]), "buy");
var c = PetSim.CONT[0]; var res = PetSim.contRun(pt, c, "style", 99, function () { return 0.5; }); T(res.pos === 1 && pt.cont.local && PetSim.has("trophy_local"), "contest win");
T(PetSim.contOpen(pt, PetSim.CONT[1]) && !PetSim.contOpen(pt, PetSim.CONT[2]), "contest ladder");
var mor0 = S.p.mor; pt.bond = 90; pt.mood = 90; PetSim.block(pt); T(S.p.mor >= mor0, "hidden mor");
T(PetSim.season(pt) && pt.age === 1 && PetSim.stage(pt) === 1, "grow");
console.log("petsim", ok, "ok,", bad, "fail"); process.exit(bad ? 1 : 0);
