/* pets.js — mascotas en el modo jugador/a (parche 2.7).
   Se adopta una cría, se le pone nombre y crece con los años (cría → joven → adulta → senior).
   Afecta al rendimiento (atributos, moral, forma, fama) según el vínculo; cuando muere, golpea la moral. */
var PET_DEF = [
  /* normales */
  {k: "dog", ex: false, ico: ["🐶", "🐶", "🐕", "🦮"], n: N_("Perro"), price: 1500, year: 2000, life: [11, 15], att: {FIS: 2, RIT: 1}, gk: {VEL: 1, EST: 1}, mor: 1.5,
    d: N_("Te saca a correr cada día: más físico y mejor ánimo.")},
  {k: "cat", ex: false, ico: ["🐱", "🐱", "🐈", "🐈"], n: N_("Gato"), price: 300, year: 1200, life: [13, 18], att: {PAS: 1}, gk: {REF: 1}, mor: 1.2, calm: 0.8,
    d: N_("Te relaja en casa: la forma aguanta mejor las malas rachas.")},
  {k: "rabbit", ex: false, ico: ["🐰", "🐰", "🐇", "🐇"], n: N_("Conejo"), price: 150, year: 600, life: [7, 10], att: {}, gk: {}, mor: 2,
    d: N_("Cariñoso y tranquilo: sube tu moral.")},
  {k: "fish", ex: false, ico: ["🐟", "🐠", "🐠", "🐡"], n: N_("Peces de acuario"), price: 80, year: 300, life: [3, 6], att: {}, gk: {}, mor: 0.8, calm: 0.9,
    d: N_("Un acuario relajante: poco efecto y poco gasto.")},
  {k: "turtle", ex: false, ico: ["🐢", "🐢", "🐢", "🐢"], n: N_("Tortuga"), price: 200, year: 400, life: [35, 60], att: {DEF: 1}, gk: {COL: 1}, mor: 0.8,
    d: N_("Vivirá más que tu carrera: paciencia y temple.")},
  {k: "hamster", ex: false, ico: ["🐹", "🐹", "🐹", "🐹"], n: N_("Hámster"), price: 40, year: 150, life: [2, 3], att: {}, gk: {}, mor: 1.2,
    d: N_("Pequeño y divertido, pero vive muy poco.")},
  /* exóticas */
  {k: "macaw", ex: true, ico: ["🦜", "🦜", "🦜", "🦜"], n: N_("Guacamayo"), price: 4000, year: 3000, life: [40, 60], att: {}, gk: {}, mor: 1, fame: 1.5, risk: 0.04,
    d: N_("Repite tu nombre en los vídeos: más seguidores.")},
  {k: "iguana", ex: true, ico: ["🦎", "🦎", "🦎", "🦎"], n: N_("Iguana"), price: 1200, year: 1500, life: [15, 20], att: {REG: 1}, gk: {REF: 1}, mor: 0.7, fame: 1, risk: 0.05,
    d: N_("Tranquila y llamativa: un toque de fama y de calma.")},
  {k: "python", ex: true, ico: ["🐍", "🐍", "🐍", "🐍"], n: N_("Pitón"), price: 2500, year: 2000, life: [20, 30], att: {TIR: 1}, gk: {PAR: 1}, mor: 0.5, fame: 2, risk: 0.08,
    d: N_("Impone respeto en redes… y da algún susto.")},
  {k: "hedgehog", ex: true, ico: ["🦔", "🦔", "🦔", "🦔"], n: N_("Erizo"), price: 600, year: 800, life: [4, 7], att: {}, gk: {}, mor: 1.8, fame: 0.6, risk: 0.04,
    d: N_("Adorable y frágil: mucha moral, vida corta.")},
  {k: "fennec", ex: true, ico: ["🦊", "🦊", "🦊", "🦊"], n: N_("Zorro del desierto"), price: 6000, year: 4000, life: [10, 14], att: {RIT: 2}, gk: {VEL: 1}, mor: 1.2, fame: 1.5, risk: 0.06,
    d: N_("Inquieto y veloz: te contagia la chispa, pero exige mucho.")},
  {k: "capybara", ex: true, ico: ["🦫", "🦫", "🦫", "🦫"], n: N_("Capibara"), price: 9000, year: 6000, life: [8, 12], att: {}, gk: {}, mor: 3, calm: 0.7, fame: 1.5, risk: 0.04,
    d: N_("El animal más tranquilo del mundo: calma total y mucha moral.")},
  {k: "tarantula", ex: true, ico: ["🕷️", "🕷️", "🕷️", "🕷️"], n: N_("Tarántula"), price: 300, year: 300, life: [15, 25], att: {TIR: 1}, gk: {COL: 1}, mor: 0.3, fame: 1, risk: 0.05,
    d: N_("Sangre fría: tu definición no tiembla.")}
];
var PET_STAGE = [N_("Cría"), N_("Joven"), N_("Adulto"), N_("Senior")];
function petDef(k) { for (var i = 0; i < PET_DEF.length; i++) if (PET_DEF[i].k === k) return PET_DEF[i]; return null; }
function petOn() { return typeof lifeOn === "function" && lifeOn(); }
function petOf() { return petOn() ? (lifeOf().pet || null) : null; }
function petStage(pt) { var f = pt.age / Math.max(1, pt.life); return f < 0.12 ? 0 : f < 0.3 ? 1 : f < 0.78 ? 2 : 3; }
function petIco(pt) { var d = petDef(pt.k); return d ? d.ico[petStage(pt)] : "🐾"; }
/* fuerza del efecto: crece al hacerse mayor (la cría todavía es pequeña), baja en la vejez y depende del vínculo */
function petPower(pt) { var st = petStage(pt), m = [0.5, 1, 1, 0.6][st]; return m * clamp(pt.bond / 70, 0, 1.2); }
function petAttBonus() {
  var pt = petOf(); if (!pt) return {};
  var d = petDef(pt.k), m = (isGK() ? d.gk : d.att) || {}, pw = petPower(pt), out = {};
  if (pt.bond < 30) return out;
  Object.keys(m).forEach(function (a) { var v = Math.round(m[a] * pw); if (v) out[a] = v; });
  return out;
}
function petCleanName(nm) { return String(nm || "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 16); }
function petAdopt(k, nm) {
  var L = lifeOf(), p = S.p, d = petDef(k);
  if (!d || L.pet) return {ok: false};
  nm = petCleanName(nm);
  if (!nm) return {ok: false, noName: true};
  if (p.money < d.price) return {ok: false, poor: true};
  p.money -= d.price;
  L.pet = {k: k, nm: nm, age: 0, life: ri(d.life[0], d.life[1]), bond: 60, y0: S.yr, cared: false};
  p.mor = clamp(p.mor + 4, 0, 100);
  if (typeof socPostRaw === "function") socPostRaw({by: chance(0.5) ? "fan" : "press", tk: d.ex ? N_("{name} sorprende con su nueva mascota exótica: {pet}. Las redes no hablan de otra cosa.") : N_("{name} presenta a su nueva mascota: {pet}. ¡Ternura máxima! 🐾"), tp: {name: socSelfName(), pet: nm}, mood: 1});
  return {ok: true};
}
function petRename(nm) { var pt = petOf(); nm = petCleanName(nm); if (!pt || !nm) return false; pt.nm = nm; return true; }
/* pasar tiempo con ella: una vez por tramo */
function petCare() {
  var pt = petOf(); if (!pt || pt.cared) return false;
  pt.cared = true; pt.bond = clamp(pt.bond + 15, 0, 100);
  S.p.mor = clamp(S.p.mor + 1, 0, 100);
  return true;
}
/* cada tramo: moral, fama y vínculo */
function petBlock() {
  var pt = petOf(); if (!pt) return;
  var d = petDef(pt.k), p = S.p, pw = petPower(pt);
  if (!pt.cared) pt.bond = clamp(pt.bond - 6, 0, 100);
  pt.cared = false;
  p.mor = clamp(p.mor + d.mor * pw, 0, 100);
  if (d.fame) { p.fame = clamp(p.fame + d.fame * 0.25 * pw, 0, 100); p.fol = (p.fol || 0) * (1 + 0.01 * d.fame * pw); }
  if (pt.bond < 20 && chance(0.3)) notify(tr("{pet} te echa de menos: pasa más tiempo con tu mascota.", {pet: pt.nm}), "amber");
  if (chance(0.12) && typeof socPostRaw === "function") socPostRaw({by: "fan", tk: N_("Foto del día: {name} con {pet} en casa 🐾"), tp: {name: socSelfName(), pet: pt.nm}, mood: 1});
}
/* fin de temporada: cumple años, gastos, sustos y, al final de su vida, despedida */
function petSeason() {
  var L = lifeOf(), pt = L.pet; if (!pt) return [];
  var d = petDef(pt.k), p = S.p, out = [];
  pt.age++;
  if (p.money < d.year) {
    L.pet = null; p.mor = clamp(p.mor - 6, 0, 100);
    notify(tr("No puedes mantener a {pet}: se queda con tu familia. Te duele despedirte.", {pet: pt.nm}), "red");
    out.push({t: "bad", x: tr("🐾 {pet} se va a vivir con tu familia: no podías pagar sus cuidados.", {pet: pt.nm})});
    return out;
  }
  p.money -= d.year;
  if (d.risk && chance(d.risk)) {
    var bill = Math.round(d.price * 0.5 / 10) * 10;
    p.money = Math.max(0, p.money - bill); p.mor = clamp(p.mor - 3, 0, 100);
    notify(tr("Susto con {pet}: visita urgente al veterinario ({v}).", {pet: pt.nm, v: fmtMoney(bill)}), "amber");
  }
  var dies = pt.age >= pt.life || (petStage(pt) === 3 && chance(0.06));
  if (dies) {
    var hit = Math.round(8 + pt.bond / 8);
    p.mor = clamp(p.mor - hit, 0, 100); p.form = clamp(p.form - 4, 0, 100);
    (L.petMem = L.petMem || []).push({k: pt.k, nm: pt.nm, y0: pt.y0, y1: S.yr, age: pt.age});
    L.pet = null; L.petBye = S.yr;
    notify(tr("🌈 {pet} ha muerto con {n} años. Te afecta mucho: −{m} de moral.", {pet: pt.nm, n: pt.age, m: hit}), "red");
    out.push({t: "bad", x: tr("🌈 Hasta siempre, {pet} ({n} años). Te acompañó desde {y}.", {pet: pt.nm, n: pt.age, y: seasonLabel(pt.y0)})});
    if (typeof socPostRaw === "function") socPostRaw({by: "fan", tk: N_("Mucho ánimo, {name}. Descansa, {pet} 🌈"), tp: {name: socSelfName(), pet: pt.nm}, mood: -1});
  } else if (petStage(pt) === 3 && pt.age === Math.ceil(pt.life * 0.78)) {
    out.push({t: "ok", x: tr("🐾 {pet} cumple {n} años y ya es senior: rinde algo menos, pero sigue a tu lado.", {pet: pt.nm, n: pt.age})});
  } else out.push({t: "ok", x: tr("🐾 {pet} cumple {n} años.", {pet: pt.nm, n: pt.age})});
  return out;
}

(function () {
  if (typeof attrs !== "function") return;
  var _attrs = attrs;
  attrs = function () {
    var out = _attrs.apply(this, arguments);
    if (!petOn() || !S.p.life) return out;
    var b = petAttBonus();
    Object.keys(b).forEach(function (k) { if (out[k] != null) out[k] = Math.round(clamp(out[k] + b[k], 20, 99)); });
    return out;
  };
  var _block = blockDone;
  blockDone = function () { if (petOn()) petBlock(); return _block.apply(this, arguments); };
  var _fin = finishPlayer;
  finishPlayer = function (f) {
    var pt = petOf(), d = pt ? petDef(pt.k) : null, f0 = S.p ? S.p.form : 0;
    var r = _fin.apply(this, arguments);
    if (d && d.calm && S.p.form < f0) S.p.form = f0 - (f0 - S.p.form) * (1 - (1 - d.calm) * petPower(pt));
    return r;
  };
  var _se = seasonEnd;
  seasonEnd = function () {
    if (!petOn()) return _se.apply(this, arguments);
    var r = _se.apply(this, arguments), news = petSeason(), card = S.feed[0];
    if (news.length && card && card.t === "seasonEnd") card.news = (card.news || []).concat(news);
    return r;
  };
})();
