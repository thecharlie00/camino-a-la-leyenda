/* pets.js — mascotas en el modo jugador/a (parche 2.7; cariño, estilo y accesorios en la 3.7).
   Se adopta una cría, se le pone nombre y crece con los años (cría → joven → adulta → senior).
   5.6: vive en tiempo real (pet-sim.js), no muere y su efecto en la moral es suave y no se muestra. */
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
function petOn() { return typeof lifeOn === "function" && (lifeOn() || !!(S && S.mode === "mgr" && S.p && S.m)); }
/* 5.6: en modo míster la mascota sigue contigo y se paga con el dinero del míster */
function petWallet() { return S && S.mode === "mgr" && S.m ? S.m : S.p; }
function petOf() { if (!petOn()) return null; var L = lifeOf(); if (L.pet && L.pet.v !== 2 && typeof PetSim !== "undefined") PetSim.migrate(L); return L.pet || null; }
/* 5.6: crece por temporadas de la carrera y la senior se queda para siempre */
function petStage(pt) { var a = pt.age || 0; return a < 1 ? 0 : a < 3 ? 1 : a < 10 ? 2 : 3; }
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
  var L = lifeOf(), p = petWallet(), d = petDef(k);
  if (!d || L.pet) return {ok: false};
  nm = petCleanName(nm);
  if (!nm) return {ok: false, noName: true};
  if (p.money < d.price) return {ok: false, poor: true};
  p.money -= d.price;
  L.pet = PetSim.fresh(k, nm); PetSim.inv(); PetSim.first(L.pet, "adopt");
  petAccSync(true);
  p.mor = clamp(p.mor + 4, 0, 100);
  if (typeof socPostRaw === "function") socPostRaw({by: chance(0.5) ? "fan" : "press", tk: d.ex ? N_("{name} sorprende con su nueva mascota exótica: {pet}. Las redes no hablan de otra cosa.") : N_("{name} presenta a su nueva mascota: {pet}. ¡Ternura máxima! 🐾"), tp: {name: socSelfName(), pet: nm}, mood: 1});
  return {ok: true};
}
function petRename(nm) { var pt = petOf(); nm = petCleanName(nm); if (!pt || !nm) return false; pt.nm = nm; return true; }
/* ---------- cariño (versión 3.7): varias formas de cuidarla, hasta dos por tramo ---------- */
var PET_ACT_MAX = 2;
var PET_FUR = ["dog", "cat", "rabbit", "hamster", "hedgehog", "fennec", "capybara"];
var PET_CARE = [
  {k: "pat", ico: "🤲", n: N_("Mimos"), d: N_("Caricias y rascarle justo donde le gusta."), bond: 8, mor: 1, no: ["fish", "tarantula"]},
  {k: "walk", ico: "🦮", n: N_("Salir a pasear"), d: N_("Un buen paseo: también te pone en forma."), bond: 12, form: 1, sp: ["dog", "fennec", "capybara"]},
  {k: "play", ico: "🎾", n: N_("Jugar juntos"), d: N_("Su juguete favorito y un rato de risas."), bond: 10, mor: 2, sp: ["dog", "cat", "rabbit", "hamster", "hedgehog", "fennec", "macaw"]},
  {k: "trick", ico: "🎓", n: N_("Enseñarle un truco"), d: N_("Cuesta, pero cuando lo aprende es un vídeo viral."), bond: 7, sp: ["dog", "cat", "rabbit", "macaw", "fennec"]},
  {k: "home", ico: "🫧", n: N_("Limpiar su hogar"), d: N_("Acuario o terrario impecable: vive más feliz."), bond: 10, sp: ["fish", "turtle", "iguana", "python", "tarantula", "hamster"]},
  {k: "watch", ico: "🧘", n: N_("Contemplarla un rato"), d: N_("Mirarla sin prisas te baja las pulsaciones."), bond: 6, mor: 2, calm: 1, sp: ["fish", "turtle", "iguana", "python", "tarantula", "capybara"]},
  {k: "treat", ico: "🍖", n: N_("Darle un premio"), d: N_("Su comida favorita: vínculo rápido."), bond: 7, cost: 0.02},
  {k: "spa", ico: "🛁", n: N_("Baño y peluquería"), d: N_("Reluciente para las fotos: un toque de fama."), bond: 10, fame: 0.4, cost: 0.06, sp: PET_FUR},
  {k: "photo", ico: "📸", n: N_("Sesión de fotos"), d: N_("Para tus redes: cada accesorio que lleve suma seguidores."), bond: 4, photo: 1}
];
function petCareDef(k) { for (var i = 0; i < PET_CARE.length; i++) if (PET_CARE[i].k === k) return PET_CARE[i]; return null; }
function petCareList(pt) { return PET_CARE.filter(function (c) { return (!c.sp || c.sp.indexOf(pt.k) >= 0) && (!c.no || c.no.indexOf(pt.k) < 0); }); }
function petCareCost(c, pt) { var d = petDef(pt.k); return c.cost ? Math.max(10, Math.round(d.year * c.cost / 10) * 10) : 0; }
function petActs(pt) { if (!pt.acts || typeof pt.acts !== "object") pt.acts = {}; return pt.acts; }
function petActN(pt) { return Object.keys(petActs(pt)).length; }
/* hace una acción de cariño: devuelve {ok, ...} con lo que pasó */
function petAct(k) {
  var pt = petOf(), c = petCareDef(k); if (!pt || !c) return {ok: false};
  if (petCareList(pt).indexOf(c) < 0) return {ok: false};
  var A = petActs(pt);
  if (A[k]) return {ok: false, done: true};
  if (petActN(pt) >= PET_ACT_MAX) return {ok: false, tired: true};
  var p = petWallet(), cost = petCareCost(c, pt);
  if (cost && p.money < cost) return {ok: false, poor: true};
  p.money -= cost; A[k] = 1; pt.cared = true; pt.need = false; pt.miss = 0;
  var gain = c.bond * (pt.bond > 85 ? 0.6 : 1), out = {ok: true, k: k};
  if (c.mor) p.mor = clamp(p.mor + c.mor, 0, 100);
  if (c.form) p.form = clamp(p.form + c.form, 0, 100);
  if (c.calm) p.form = clamp(p.form + 0.5, 0, 100);
  if (c.fame) p.fame = clamp(p.fame + c.fame, 0, 100);
  if (k === "trick") {
    var okT = chance(clamp(0.3 + pt.bond / 200, 0.3, 0.8));
    out.learned = okT;
    if (okT) {
      pt.tricks = (pt.tricks || 0) + 1; gain += 6; p.fame = clamp(p.fame + 0.5, 0, 100); p.fol = Math.round((p.fol || 0) * 1.01);
      if ((pt.tricks === 1 || pt.tricks % 3 === 0) && typeof socPostRaw === "function") socPostRaw({by: "fan", tk: N_("¡{pet} ya sabe {n} trucos! El vídeo de {name} arrasa 🐾"), tp: {pet: pt.nm, n: pt.tricks, name: socSelfName()}, mood: 1});
    }
  }
  if (c.photo) {
    var d = petDef(pt.k), eq = petEqList(pt), bonus = 1 + eq.reduce(function (s, a) { return s + (a.un ? 0.4 : 0.2); }, 0);
    p.fame = clamp(p.fame + 0.3 * bonus * (1 + (d.fame || 0) / 2), 0, 100); p.fol = Math.round((p.fol || 0) * (1 + 0.004 * bonus));
    out.bonus = bonus;
    if (typeof socPostRaw === "function") socPostRaw({by: "fan", tk: eq.length ? N_("{pet} posa con su look nuevo en el perfil de {name}. ¡Icono de estilo! 📸") : N_("Foto del día: {name} con {pet} en casa 🐾"), tp: {name: socSelfName(), pet: pt.nm}, mood: 1});
  }
  pt.bond = clamp(pt.bond + gain, 0, 100);
  return out;
}
/* compatibilidad: la acción clásica de «pasar tiempo» son los mimos (o la primera que admita) */
function petCare() { var pt = petOf(); if (!pt) return false; var l = petCareList(pt); return petAct(l[0].k).ok; }
function petNeeds() { var pt = petOf(); if (!pt) return false; PetSim.tick(pt); return PetSim.wants(pt); }

/* ---------- estilo: color del pelaje, fondo y accesorios ---------- */
var PET_COL = [
  ["nat", N_("Natural"), ""],
  ["snow", N_("Nieve"), "grayscale(1) brightness(1.35)"],
  ["coal", N_("Carbón"), "grayscale(1) brightness(.55) contrast(1.2)"],
  ["choc", N_("Chocolate"), "sepia(.9) saturate(1.5) brightness(.72)"],
  ["pink", N_("Rosa"), "hue-rotate(300deg) saturate(1.4)"],
  ["blue", N_("Azul"), "hue-rotate(185deg) saturate(1.3)"],
  ["green", N_("Verde"), "hue-rotate(80deg) saturate(1.2)"],
  ["purple", N_("Morado"), "hue-rotate(245deg) saturate(1.3)"],
  ["gold", N_("Oro"), "sepia(1) saturate(3) hue-rotate(-8deg) brightness(1.08)", "bdo"],
  ["rainbow", N_("Arcoíris"), "anim", "nat"]
];
var PET_BG = [["none", N_("Sin fondo"), ""], ["grass", N_("Césped"), "#1f7a3a"], ["sky", N_("Cielo"), "#2c6fb7"], ["rose", N_("Rosa"), "#c4527d"], ["sun", N_("Atardecer"), "#d9822b"], ["night", N_("Noche"), "#2a2350"], ["club", N_("Colores de tu club"), "club"]];
/* accesorios: cabeza (h), cara (f), cuello (n) y juguete (t); los de trofeo se ganan, no se compran */
var PET_ACC = [
  {k: "cap", s: "h", ico: "🧢", n: N_("Gorra"), price: 120},
  {k: "bow", s: "h", ico: "🎀", n: N_("Lazo"), price: 80},
  {k: "straw", s: "h", ico: "👒", n: N_("Pamela"), price: 250},
  {k: "grad", s: "h", ico: "🎓", n: N_("Birrete"), price: 400},
  {k: "tophat", s: "h", ico: "🎩", n: N_("Sombrero de copa"), price: 600},
  {k: "crown", s: "h", ico: "👑", n: N_("Corona de campeón"), un: "cont", ud: N_("Gana una competición continental (Champions, Libertadores…).")},
  {k: "star", s: "h", ico: "🌟", n: N_("Aura de estrella"), un: "bdo", ud: N_("Gana el Balón de Oro.")},
  {k: "glasses", s: "f", ico: "👓", n: N_("Gafas de pasta"), price: 150},
  {k: "sun", s: "f", ico: "🕶️", n: N_("Gafas de sol"), price: 200},
  {k: "disguise", s: "f", ico: "🥸", n: N_("Bigote de incógnito"), price: 300},
  {k: "bell", s: "n", ico: "🔔", n: N_("Collar con cascabel"), price: 60},
  {k: "scarf", s: "n", ico: "🧣", n: N_("Bufanda del club"), price: 150},
  {k: "pearls", s: "n", ico: "📿", n: N_("Collar de perlas"), price: 900},
  {k: "medal", s: "n", ico: "🏅", n: N_("Medalla de campeón"), un: "cup", ud: N_("Gana una copa nacional.")},
  {k: "gold", s: "n", ico: "🥇", n: N_("Oro con la selección"), un: "nat", ud: N_("Gana un Mundial, una Eurocopa u otro gran torneo de selecciones.")},
  {k: "bone", s: "t", ico: "🦴", n: N_("Hueso"), price: 40},
  {k: "ball", s: "t", ico: "⚽", n: N_("Pelota"), price: 50},
  {k: "teddy", s: "t", ico: "🧸", n: N_("Peluche"), price: 120},
  {k: "cup", s: "t", ico: "🏆", n: N_("Copa en miniatura"), un: "league", ud: N_("Gana una liga.")},
  {k: "boot", s: "t", ico: "👟", n: N_("Bota dorada"), un: "scorer", ud: N_("Gana un trofeo de máximo goleador.")},
  {k: "glove", s: "t", ico: "🧤", n: N_("Guante de oro"), un: "gk", ud: N_("Gana un premio al mejor portero.")}
];
var PET_SLOT = [["h", N_("Cabeza")], ["f", N_("Cara")], ["n", N_("Cuello")], ["t", N_("Juguete")]];
function petAccDef(k) { for (var i = 0; i < PET_ACC.length; i++) if (PET_ACC[i].k === k) return PET_ACC[i]; return null; }
function petColDef(k) { for (var i = 0; i < PET_COL.length; i++) if (PET_COL[i][0] === k) return PET_COL[i]; return PET_COL[0]; }
function petBgDef(k) { for (var i = 0; i < PET_BG.length; i++) if (PET_BG[i][0] === k) return PET_BG[i]; return PET_BG[0]; }
function petOwned() { var L = lifeOf(); if (!L.petAcc) L.petAcc = []; return L.petAcc; }
/* logros que desbloquean accesorios y colores (salen de la vitrina y los premios del jugador) */
function petUnTest(u) {
  var p = S.p; if (!p) return false;
  var tk = (p.trophies || []).map(function (t) { return String(t.k || ""); }), aw = (p.awards || []).map(function (a) { return a.k; });
  function T(re) { return tk.some(function (k) { return re.test(k); }); }
  function A(l) { return aw.some(function (k) { return l.indexOf(k) >= 0; }); }
  switch (u) {
    case "cont": return T(/^(UCL|UEL|UECL|LIB|SUD|ACL|CAF|CCC|CWC)$/);
    case "cup": return T(/^CUP:/);
    case "league": return T(/^L:/);
    case "nat": return T(/^(WC|EURO|CA|AFCON|ASIAN|GOLD|OFCN)$/);
    case "bdo": return A(["bdo"]);
    case "scorer": return A(["pichichi", "boot", "tboot"]);
    case "gk": return A(["yashin", "tglove", "bestgk"]);
    case "mvp": return aw.length > 0;
  }
  return false;
}
function petHasAcc(k) { return petOwned().indexOf(k) >= 0; }
function petColOk(c) { return !c[3] || petUnTest(c[3]); }
var PET_UND = {bdo: N_("Gana el Balón de Oro."), nat: N_("Gana un Mundial, una Eurocopa u otro gran torneo de selecciones.")};
/* revisa desbloqueos nuevos y los anuncia (una vez) */
function petAccSync(quiet) {
  if (!petOn()) return [];
  var own = petOwned(), L = lifeOf(), got = [];
  PET_ACC.forEach(function (a) { if (a.un && own.indexOf(a.k) < 0 && petUnTest(a.un)) { own.push(a.k); got.push(a); } });
  if (typeof PET_ACC2 !== "undefined") PET_ACC2.forEach(function (a) { if (a.un && !/^cont_/.test(a.un) && own.indexOf(a.id) < 0 && petUnTest(a.un)) { own.push(a.id); got.push({ico: a.ico || "🎁", n: a.n}); } });
  L.petColU = L.petColU || [];
  PET_COL.forEach(function (c) { if (c[3] && L.petColU.indexOf(c[0]) < 0 && petColOk(c)) { L.petColU.push(c[0]); got.push({ico: "🎨", n: c[1], col: 1}); } });
  if (!quiet && got.length && L.pet) got.forEach(function (a) { notify(tr("🎁 Nuevo para {pet}: {acc}. Lo has ganado con tus títulos.", {pet: L.pet.nm, acc: a.ico + " " + tr(a.n)}), "green"); });
  return got;
}
function petBuyAcc(k) {
  var a = petAccDef(k), p = petWallet(); if (!a || a.un || petHasAcc(k)) return {ok: false};
  if (p.money < a.price) return {ok: false, poor: true};
  p.money -= a.price; petOwned().push(k);
  var pt = petOf(); if (pt) { petEq(pt)[a.s] = k; }
  return {ok: true};
}
function petEq(pt) { if (!pt.eq || typeof pt.eq !== "object") pt.eq = {}; return pt.eq; }
function petEqList(pt) { var e = petEq(pt); return PET_SLOT.map(function (s) { return e[s[0]] && petHasAcc(e[s[0]]) ? petAccDef(e[s[0]]) : null; }).filter(Boolean); }
function petWear(k) {
  var pt = petOf(), a = petAccDef(k); if (!pt || !a || !petHasAcc(k)) return false;
  var e = petEq(pt); e[a.s] = e[a.s] === k ? null : k; return true;
}
function petSetCol(k) { var pt = petOf(), c = petColDef(k); if (!pt || c[0] !== k) return false; if (c[3] && !petColOk(c)) return false; pt.col = k; return true; }
function petSetBg(k) { var pt = petOf(), b = petBgDef(k); if (!pt || b[0] !== k) return false; pt.bg = k; return true; }

/* cada tramo: efecto suave y oculto en la moral según vínculo y ánimo; un aviso discreto si te echa de menos */
function petBlock() {
  var pt = petOf(); if (!pt) return;
  PetSim.block(pt);
  var d = petDef(pt.k), p = S.p;
  if (d.fame) { p.fame = clamp(p.fame + d.fame * 0.15 * clamp(pt.bond / 70, 0, 1.2), 0, 100); }
  if (PetSim.wants(pt) && !pt.warned) { pt.warned = 1; notify(tr("🐾 {pet} te echa de menos. Pásate por Yo › Tu mascota.", {pet: pt.nm}), "amber"); }
  else if (!PetSim.wants(pt)) pt.warned = 0;
  if (chance(0.06) && typeof socPostRaw === "function") socPostRaw({by: "fan", tk: N_("Foto del día: {name} con {pet} en casa 🐾"), tp: {name: socSelfName(), pet: pt.nm}, mood: 1});
  petAccSync();
}
/* fin de temporada: cumple años y crece; los gastos se pagan si se puede (nunca se va ni muere) */
function petSeason() {
  var L = lifeOf(), pt = petOf(); if (!pt) return [];
  var d = petDef(pt.k), p = petWallet(), out = [], g = PetSim.season(pt);
  if (p.money >= d.year) p.money -= d.year;
  if (g.grow != null) out.push({t: "ok", x: tr("🐾 {pet} cumple {n} y ya es {st}.", {pet: pt.nm, n: trn(pt.age, "{n} año", "{n} años"), st: tr(PET_STAGE[g.grow]).toLowerCase()})});
  else out.push({t: "ok", x: tr("🐾 {pet} cumple {n} años.", {pet: pt.nm, n: pt.age})});
  return out;
}

(function () {
  if (typeof blockDone !== "function") return;
  var _block = blockDone;
  blockDone = function () { if (petOn()) petBlock(); return _block.apply(this, arguments); };
  var _fin = finishPlayer;
  finishPlayer = function (f) {
    var r = _fin.apply(this, arguments), pt = petOf();
    if (pt && f && f.min > 0) { var gu = f.gu + (f.etu || 0), gt = f.gt + (f.ett || 0); PetSim.matchMood(pt, gu > gt ? "W" : gu < gt ? "L" : "D"); }
    return r;
  };
  var _se = seasonEnd;
  seasonEnd = function () {
    if (!petOn()) return _se.apply(this, arguments);
    var r = _se.apply(this, arguments), news = petSeason(), card = S.feed[0];
    petAccSync();
    if (news.length && card && card.t === "seasonEnd") card.news = (card.news || []).concat(news);
    return r;
  };
})();
