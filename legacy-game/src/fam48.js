/* fam48.js — «Familia» (versión 4.8), motor (modo jugador y modo entrenador).
   S.fam = {set, par (tus padres, si eres el relevo), pt: {fn, g, rel, y0} | null, ex, kids: [{id, fn, g, by, ad, no, fb}], nid}
   · Pareja: un hombre o una mujer, a elección. La relación baja con el trabajo (club grande, crisis, niños pequeños)
     y sube con las decisiones que la cuidan. Bien cuidada da química; descuidada la quita, y por debajo de 8 se rompe.
   · Hijos: con tu pareja podéis tener un hijo o una hija; si sois del mismo sexo, adoptáis (niño o niña, a elección).
   · A los 16 años, tu hijo o tu hija puede querer ser futbolista: eliges su posición y empieza en una cantera.
     Cada temporada crece y juega en su club; si es del mismo fútbol que el tuyo (masculino o femenino), puedes
     ficharlo cuando el mercado está abierto y seguir su recorrido en tu plantilla.
   El protagonista del modo entrenador es del sexo de su fútbol (entrenador en el masculino, entrenadora en el femenino). */

function famMe() { return S && S.g === "f" ? "f" : "m"; }
/* la familia vive en S.fam y acompaña al protagonista: de jugador a entrenador, y al relevo (como padres y hermanos) */
function famOf() {
  if (!S || !(S.m || S.p)) return null;
  if (!S.fam && S.m && S.m.fam) { S.fam = S.m.fam; delete S.m.fam; }
  return S.fam || (S.fam = {set: false, pt: null, ex: 0, kids: [], nid: 1});
}
function famMgr() { return S.mode === "mgr" && !!S.m; }
function famHero() { return famMgr() ? S.m : S.p; }
function famLn() { var h = famHero(); return h ? h.ln : ""; }
function famNat() { if (famMgr()) return S.m.nat; var p = S.p; return p ? (p.inat >= 0 ? p.inat : p.nat) : 0; }
function famClub() { return famMgr() ? S.m.club : S.p ? S.p.club : -1; }
function famKids(f) { return (f || famOf()).kids.filter(function (k) { return !k.sib; }); }
function famAge(k) { return S.yr - k.by; }
function famSame(k) { return k.g === famMe(); }           /* juega en tu mismo fútbol: se le puede fichar */
function famSameSex() { var f = famOf(); return !!(f && f.pt && f.pt.g === famMe()); }
function famFirst(ni, g) {
  var pm = (W.ctry[ni] && W.ctry[ni].pool) || "ang";
  var src = g === "f" ? (DATA.namesF[pm] || (DATA.namePar && DATA.namesF[DATA.namePar[pm]]) || DATA.namesF.ang) : (DATA.names[pm] || DATA.names.ang);
  var l = src.f.split(","); return l[Math.floor(R() * Math.min(l.length, 70))];
}
function famKid(id) { var f = famOf(); return f ? f.kids.filter(function (k) { return k.id === id; })[0] || null : null; }
function famKidName(k) { return k.fn + " " + famLn(); }
function famCanSetup() { var f = famOf(); return !!f && !f.set && S.ph !== "ret" && !f.par; }

/* ---------- puesta en marcha (una vez por partida, desde la tarjeta «Tu familia») ---------- */
/* o: {pt: {fn, g} | null, kids: [{fn, g, age}]} */
function famSetup(o) {
  if (!famCanSetup()) return false;
  var f = famOf();
  f.set = true;
  if (o.pt && o.pt.fn) f.pt = {fn: String(o.pt.fn).slice(0, 20), g: o.pt.g === "f" ? "f" : "m", rel: 70, y0: S.yr};
  (o.kids || []).slice(0, 3).forEach(function (k) {
    var age = clamp(+k.age || 0, 0, Math.max(0, Math.min(15, famHero().age - 18)));
    if (famHero().age < 18) return;
    f.kids.push({id: f.nid++, fn: String(k.fn || famFirst(famNat(), k.g)).slice(0, 20), g: k.g === "f" ? "f" : "m", by: S.yr - age, ad: !!k.ad, no: false, fb: null});
  });
  return true;
}

/* ---------- la relación ---------- */
function famRel(v) { var f = famOf(); if (!f || !f.pt) return 0; var a = f.pt.rel; f.pt.rel = clamp(f.pt.rel + v, 0, 100); return f.pt.rel - a; }
function famDecay() {
  var f = famOf(), h = famHero(); if (!f || !f.pt || !h) return 0;
  var small = famKids(f).filter(function (k) { return famAge(k) <= 5; }).length, c = famClub(), d;
  if (famMgr()) d = 1.6 + (c >= 0 && S.cr[c] >= 78 ? 1 : 0) + (h.board < 40 ? 1.5 : 0) + small * 0.6;
  else d = 1.4 + (h.fame >= 60 ? 1 : 0) + (c >= 0 && S.cr[c] >= 80 ? 0.5 : 0) + (h.inj ? 0.8 : 0) + small * 0.6;
  if (h.flags && h.flags.famT && h.flags.famT >= S.yr * 10 + S.bi) d *= 0.4;
  return d;
}
function famBreakup(why) {
  var f = famOf(); if (!f || !f.pt) return;
  var pt = f.pt; f.pt = null; f.ex++; f.exName = pt.fn;
  var ch;
  if (famMgr()) { S.m.chem = clamp(S.m.chem - 4, 0, 100); ch = [["chem", -4]]; }
  else { S.p.mor = clamp(S.p.mor - 10, 0, 100); S.p.form = clamp(S.p.form - 4, 0, 100); ch = [["mor", -10], ["form", -4]]; }
  feed({t: "decision", tipo: famMgr() ? "mgr" : "real", cat: tr("Vida personal"), title: tr("Ruptura"), choice: tr("{name} y tú lo dejáis", {name: pt.fn}),
    txt: why || (famMgr() ? tr("Demasiadas noches en el despacho y demasiados viajes. La relación no aguanta más.") : tr("Demasiadas concentraciones, viajes y noches fuera. La relación no aguanta más.")), chips: ch, good: false, y: S.yr});
}
/* al final de cada tramo */
(function () {
  if (typeof mgrBlockDone !== "function") return;
  var _bd = mgrBlockDone;
  mgrBlockDone = function () {
    var f = S.m ? famOf() : null;
    if (f && f.pt && S.m.club >= 0) {
      famRel(-famDecay());
      var r = f.pt.rel;
      if (r >= 70) { S.m.chem = clamp(S.m.chem + 0.8, 0, 100); }
      else if (r < 30) { S.m.chem = clamp(S.m.chem - 1, 0, 100); if (S.bnews && chance(0.5)) S.bnews.push({t: "bad", x: tr("Las cosas no van bien en casa y se nota en tu humor en los entrenamientos.")}); }
      if (r <= 8) famBreakup();
    }
    return _bd.apply(this, arguments);
  };
})();

(function () {
  if (typeof blockDone !== "function") return;
  var _bd = blockDone;
  blockDone = function () {
    var f = S.p && S.mode !== "mgr" ? famOf() : null;
    if (f && f.pt && S.p.club >= 0) {
      famRel(-famDecay());
      var r = f.pt.rel, p = S.p;
      if (r >= 70) p.mor = clamp(p.mor + 1.5, 0, 100);
      else if (r < 30) { p.mor = clamp(p.mor - 2, 0, 100); p.form = clamp(p.form - 1, 0, 100); if (S.bnews && chance(0.5)) S.bnews.push({t: "bad", x: tr("Las cosas no van bien en casa y se nota en tu cabeza en los partidos.")}); }
      if (r <= 8) famBreakup();
    }
    return _bd.apply(this, arguments);
  };
})();

/* ---------- decisiones de la vida personal (entre tramos) ---------- */
var FAM_EV = {
  cena: {when: function (f) { return !!f.pt; },
    head: function (f) { return {title: tr("Aniversario el día del partido"), text: trn(Math.max(1, S.yr - f.pt.y0 + 1), "Hoy hace {n} año que estás con {name}, y justo hay partido. Te pregunta si vas a estar en la cena.", "Hoy hace {n} años que estás con {name}, y justo hay partido. Te pregunta si vas a estar en la cena.", {name: f.pt.fn})}; },
    opts: function () { return [
      {t: tr("Dejar el partido en manos de tu segundo"), d: tr("Te pierdes el partido, pero no la cena."), fx: {rel: 14, chem: -2, board: -2}},
      {t: tr("Cenar tarde, después del partido"), d: tr("Llegas a los postres, pero llegas."), fx: {rel: 5}},
      {t: tr("Olvidarte: el fútbol es lo primero"), d: tr("Ni flores ni cena."), fx: {rel: -12, board: 1}}]; },
    optsP: function () { return [
      {t: tr("Pedir al míster que no te convoque"), d: tr("Te pierdes el partido, pero no la cena."), fx: {rel: 14, coach: -4}},
      {t: tr("Cenar tarde, después del partido"), d: tr("Llegas a los postres, pero llegas."), fx: {rel: 5}},
      {t: tr("Olvidarte: el fútbol es lo primero"), d: tr("Ni flores ni cena."), fx: {rel: -12, coach: 1}}]; }},
  escapada: {when: function (f) { return !!f.pt; },
    head: function (f) { return {title: tr("Un fin de semana para los dos"), text: tr("{name} ha encontrado una casa rural para el fin de semana sin partido. Nada de móvil, nada de vídeos del rival.", {name: f.pt.fn})}; },
    opts: function () { return [
      {t: tr("Desconectar de verdad"), d: tr("El lunes vuelves como nuevo."), fx: {rel: 12, chem: 1}, famT: true},
      {t: tr("Ir, pero con el portátil"), d: tr("Medio fin de semana viendo vídeos."), fx: {rel: 3, chem: 1}},
      {t: tr("Cancelarlo: hay mucho trabajo"), d: tr("La directiva valora tu dedicación."), fx: {rel: -10, board: 2}}]; },
    optsP: function () { return [
      {t: tr("Desconectar de verdad"), d: tr("El lunes vuelves como nuevo."), fx: {rel: 12, form: 2}, famT: true},
      {t: tr("Ir, pero pendiente del móvil"), d: tr("Medio fin de semana contestando mensajes."), fx: {rel: 3}},
      {t: tr("Cancelarlo: toca entrenar extra"), d: tr("El míster valora tu dedicación."), fx: {rel: -10, coach: 2, form: 1}}]; }},
  trabajo: {when: function (f) { return !!f.pt; },
    head: function (f) { return {title: tr("Una oferta de trabajo para {name}", {name: f.pt.fn}), text: tr("A {name} le ofrecen el trabajo de sus sueños, pero tendría que viajar mucho y te tocaría más casa a ti.", {name: f.pt.fn})}; },
    opts: function () { return [
      {t: tr("Animar a que lo acepte"), d: tr("Te toca organizarte: menos horas en el club."), fx: {rel: 12, sqMor: -2}},
      {t: tr("Pedirle que se lo piense"), d: tr("Lo entiende… más o menos."), fx: {rel: -6}}]; }},
  cumple: {when: function (f) { return famKids(f).some(function (k) { var a = famAge(k); return a >= 2 && a <= 15; }); },
    head: function (f) { var k = famKids(f).filter(function (k) { var a = famAge(k); return a >= 2 && a <= 15; })[0];
      return {title: k.g === "f" ? tr("El cumpleaños de tu hija") : tr("El cumpleaños de tu hijo"), text: tr("{name} cumple {n} años y la fiesta coincide con la sesión de vídeo del próximo rival.", {name: k.fn, n: famAge(k)})}; },
    opts: function (f) { return [
      {t: tr("Ir a la fiesta"), d: tr("Tu ayudante prepara el vídeo."), fx: {rel: 8, chem: -1}},
      {t: tr("Pasarte un rato y volver al club"), d: tr("Soplas las velas y te vas."), fx: {rel: 2}},
      {t: tr("Quedarte en el club"), d: tr("Le llamas por videollamada."), fx: {rel: -8, chem: 1}}]; },
    optsP: function () { return [
      {t: tr("Ir a la fiesta"), d: tr("Te saltas la sesión de vídeo."), fx: {rel: 8, coach: -2}},
      {t: tr("Pasarte un rato y volver al club"), d: tr("Soplas las velas y te vas."), fx: {rel: 2}},
      {t: tr("Quedarte en el club"), d: tr("Le llamas por videollamada."), fx: {rel: -8, coach: 1}}]; }},
  crisis: {when: function (f) { return !!f.pt && f.pt.rel < 28; }, prio: true,
    head: function (f) { return {title: tr("Tu relación está en crisis"), text: tr("{name} te dice que ya no os veis, que el fútbol se lo ha comido todo. Esta noche toca hablar en serio.", {name: f.pt.fn})}; },
    opts: function () { return [
      {t: tr("Prometer más tiempo en casa"), d: tr("Durante una temporada, menos horas en el club."), fx: {rel: 16, chem: -2}, famT: 5},
      {t: tr("Ir a terapia de pareja"), d: tr("Una hora a la semana, sin falta."), fx: {rel: 12, rep: -1}},
      {t: tr("Dejarlo"), d: tr("Cada uno por su lado."), fx: {}, brk: true}]; }},
  meet: {when: function (f) { return !f.pt && f.set; }, chanceW: 0.18,
    head: function () { return {title: tr("Conoces a alguien"), text: tr("En una cena benéfica del club coincides con alguien con quien la conversación fluye sola. Te deja su número.")}; },
    opts: function () { var me = famMe(); return [
      {t: tr("Llamarle: es un hombre"), d: tr("Empezáis a veros."), fx: {}, meet: "m"},
      {t: tr("Llamarla: es una mujer"), d: tr("Empezáis a veros."), fx: {}, meet: "f"},
      {t: tr("Ahora no: el banquillo no deja tiempo"), d: tr("Guardas el número en un cajón."), fx: {chem: 1}}]; }},
  kid: {when: function (f) { var ks = famKids(f), h = famHero(); return !!f.pt && f.pt.rel >= 55 && ks.length < 3 && S.yr - f.pt.y0 >= 1 && !ks.some(function (k) { return famAge(k) < 3; }) && h && h.age <= 58 && h.age >= 21; }, chanceW: 0.3,
    head: function (f) { return famSameSex() ? {title: tr("Ampliar la familia"), text: tr("{name} y tú lleváis tiempo hablándolo: queréis adoptar. La agencia os llama: hay un niño y una niña esperando una familia.", {name: f.pt.fn})}
      : {title: tr("Ampliar la familia"), text: tr("{name} y tú lleváis tiempo hablándolo: ¿ha llegado el momento de tener un bebé?", {name: f.pt.fn})}; },
    opts: function () { var ad = famSameSex(); return [
      {t: ad ? tr("Adoptar a un niño") : tr("Tener un hijo"), d: tr("La familia crece."), fx: {rel: 10}, kid: "m"},
      {t: ad ? tr("Adoptar a una niña") : tr("Tener una hija"), d: tr("La familia crece."), fx: {rel: 10}, kid: "f"},
      {t: tr("Esperar un poco más"), d: tr("No es el momento."), fx: {rel: -3}}]; }}
};
var FAM_POOL = ["cena", "escapada", "trabajo", "cumple"];
function famPickEv() {
  var f = famOf(); if (!f || famClub() < 0) return null;
  if (FAM_EV.crisis.when(f)) return "crisis";
  if (FAM_EV.kid.when(f) && chance(FAM_EV.kid.chanceW)) return "kid";
  if (FAM_EV.meet.when(f)) return chance(FAM_EV.meet.chanceW) ? "meet" : null;
  if (!f.pt) return null;
  if (!chance(0.42)) return null;
  var ok = FAM_POOL.filter(function (id) { return FAM_EV[id].when(f) && f.last !== id; });
  return ok.length ? pick(ok) : null;
}
function famNewKid(g, ad) {
  var f = famOf(), age = ad ? ri(0, 7) : 0;
  var k = {id: f.nid++, fn: famFirst(famNat(), g), g: g, by: S.yr - age, ad: !!ad, no: false, fb: null};
  f.kids.push(k);
  return k;
}
if (typeof MPH !== "undefined") MPH.fam = {
  fixed: true,
  head: function (x) { var f = famOf(), e = FAM_EV[x.id], h = e.head(f); return {tag: "real", tagTxt: tr("Vida personal"), cls: "", cat: f.pt ? tr("Con {name}", {name: f.pt.fn}) : tr("Fuera del fútbol"), title: h.title, text: h.text}; },
  opts: function (x) { return FAM_EV[x.id].opts(famOf()).map(function (o, i) { return {t: o.t, d: o.d, ok: {txt: o.d, fx: o.fx}, i: i, raw: o}; }); },
  apply: function (x, o, res) {
    var f = famOf(), r = o.raw, fx = Object.assign({}, r.fx), rv = fx.rel || 0; delete fx.rel;
    var chips = mgrFx(fx);
    if (rv && f.pt) { var dv = famRel(rv); chips.push(["rel", Math.round(dv)]); }
    if (r.famT) famHero().flags.famT = S.yr * 10 + S.bi + (r.famT === true ? 1 : r.famT);
    f.last = x.id;
    if (r.brk) { famBreakup(tr("Decidís separaros. Duele, pero es lo mejor para los dos.")); res.txt = tr("Cada uno por su lado."); }
    if (r.meet) { f.pt = {fn: famFirst(famNat(), r.meet), g: r.meet, rel: 62, y0: S.yr}; res.txt = tr("Se llama {name}. Empezáis a veros.", {name: f.pt.fn}); }
    if (r.kid) {
      var k = famNewKid(r.kid, famSameSex());
      res.txt = k.ad ? (k.g === "f" ? tr("Llega a casa {name}, de {n} años. Ya es tu hija.", {name: k.fn, n: famAge(k)}) : tr("Llega a casa {name}, de {n} años. Ya es tu hijo.", {name: k.fn, n: famAge(k)}))
        : (k.g === "f" ? tr("Nace {name}. Eres padre de una niña preciosa.", {name: k.fn}) : tr("Nace {name}. Eres padre de un niño precioso.", {name: k.fn}));
      chips.push(["note", 0, k.g === "f" ? tr("Tu hija: {name}", {name: famKidName(k)}) : tr("Tu hijo: {name}", {name: famKidName(k)})]);
    }
    return chips;
  },
  card: function (x, o, res, chips, head) { return {t: "decision", tipo: "mgr", cat: tr("Vida personal"), title: head.title, choice: o.t, txt: res.txt, chips: chips, y: S.yr}; }
};

/* ---------- tu hijo o tu hija, futbolista ---------- */
var FAM_POS = [["POR", N_("Portería")], ["DFC", N_("Defensa")], ["MC", N_("Centro del campo")], ["DC", N_("Delantera")]];
function famPosFrom(k) { return k === "DFC" ? pick(["DFC", "DFC", "LD", "LI"]) : k === "MC" ? pick(["MC", "MCD", "MCO", "MC"]) : k === "DC" ? pick(["DC", "DC", "ED", "EI"]) : "POR"; }
/* liga de su fútbol cuando no es el tuyo (no hay mundo cargado: se simula con nombres reales) */
function famOtherLeagues(g) { return g === "f" ? (DATA.leaguesF2 || DATA.leaguesF || []) : DATA.leagues; }
function famPickOther(g, code, lvl) {
  var ls = famOtherLeagues(g).filter(function (l) { return l.c === code; });
  if (!ls.length) ls = famOtherLeagues(g).filter(function (l) { return l.t === 1; });
  var best = null, bd = 1e9;
  ls.forEach(function (l) { var mid = (l.top + l.bot) / 2, d = Math.abs(mid - lvl); if (d < bd) { bd = d; best = l; } });
  var names = best.clubs.split("|"), f = clamp((best.top - lvl) / Math.max(1, best.top - best.bot), 0, 1);
  var i = clamp(Math.round(f * (names.length - 1) + ri(-2, 2)), 0, names.length - 1);
  return {cn: names[i], lvl: round1(clamp(lvl, best.bot - 2, best.top + 1)), lg: best.n};
}
function famStartFb(k, posK) {
  var m = famHero(), famSc = Math.min(4, (famMgr() ? (m.peakRep || m.rep || 30) : (m.fame || 10)) / 25), myC = famClub(), myN = famNat();
  var ovr = round1(rf(52, 58) + famSc * 0.5), pot = round1(Math.min(93, rf(68, 85) + famSc));
  var fb = {pos: famPosFrom(posK), ovr: ovr, pot: Math.max(pot, ovr + 8), club: -1, cn: null, lvl: 0, pid: null, seasons: [], y0: S.yr, ret: null};
  var code = W.ctry[myN] ? W.ctry[myN].code : "ES";
  if (famSame(k)) {
    var pool = clubsWhere(function (c) { return S.cl[c] >= 0 && W.clubs[c].ci === myN && c !== myC && S.cr[c] >= ovr + 2 && S.cr[c] <= ovr + 12; });
    if (!pool.length) pool = clubsWhere(function (c) { return S.cl[c] >= 0 && c !== myC && Math.abs(S.cr[c] - ovr - 6) < 6; });
    fb.club = pool.length ? pick(pool) : (myC >= 0 ? myC : 0);
  } else { var o = famPickOther(k.g, code, ovr + 6); fb.cn = o.cn; fb.lvl = o.lvl; fb.lg = o.lg; }
  k.fb = fb;
  return fb;
}
function famFbClubName(fb) { return fb.club >= 0 ? clubName(fb.club) : fb.cn || "—"; }
function famFbLevel(fb) { return fb.club >= 0 ? S.cr[fb.club] : fb.lvl || 60; }
var FAM_GR = {DC: 0.45, ED: 0.3, EI: 0.3, MCO: 0.25, MC: 0.12, MCD: 0.06, MD: 0.18, MI: 0.18, DFC: 0.04, LD: 0.03, LI: 0.03, POR: 0};
/* una temporada fuera de tu plantilla */
function famSimSeason(k) {
  var fb = k.fb, age = famAge(k); if (!fb || fb.ret || fb.pid != null) return;
  var lvl = famFbLevel(fb), rel = fb.ovr - lvl;
  var share = clamp(0.5 + rel * 0.08, 0.04, 0.95) * (age <= 17 ? 0.55 : age <= 19 ? 0.8 : 1);
  var apps = Math.round(34 * share * rf(0.85, 1.1)), g = 0;
  for (var i = 0; i < apps; i++) if (chance((FAM_GR[fb.pos] || 0.1) * (1 + rel * 0.03))) g++;
  fb.seasons.push({y: S.yr, club: fb.club, cn: fb.cn, apps: apps, g: g, ovr: Math.round(fb.ovr), mine: false});
  famGrow(fb, age, share);
  /* cambia de club si se le queda pequeño o si no juega */
  if (rel >= 4 && chance(0.55)) famMove(k, fb.ovr + rf(-1, 3));
  else if (share < 0.2 && age >= 19 && chance(0.6)) famMove(k, fb.ovr + rf(2, 6));
  if (age >= 36 || (age >= 33 && fb.ovr < 60 && chance(0.4))) fb.ret = S.yr;
}
function famGrow(fb, age, share) {
  var rate = age <= 17 ? 0.33 : age <= 19 ? 0.28 : age <= 21 ? 0.22 : age <= 23 ? 0.16 : age <= 25 ? 0.1 : age <= 27 ? 0.06 : age <= 29 ? 0.03 : 0.01;
  var gr = Math.max(0, fb.pot - fb.ovr) * rate * (0.45 + 0.8 * share) * rf(0.85, 1.15);
  if (age >= 30) gr -= Math.pow(age - 29, 1.3) * 0.38;
  fb.ovr = round1(clamp(fb.ovr + gr, 40, 95));
}
function famMove(k, lvl) {
  var fb = k.fb, myC = famMgr() ? S.m.club : -1;
  if (fb.club >= 0) {
    var cands = clubsWhere(function (c) { return S.cl[c] >= 0 && c !== fb.club && c !== myC && Math.abs(S.cr[c] - lvl) <= 3; });
    var home = cands.filter(function (c) { return W.clubs[c].ci === W.clubs[fb.club].ci; });
    var c = (home.length && chance(0.6) ? pick(home) : cands.length ? pick(cands) : null);
    if (c != null) fb.club = c;
  } else { var o = famPickOther(k.g, (W.ctry[famNat()] || {}).code, lvl); fb.cn = o.cn; fb.lvl = o.lvl; fb.lg = o.lg; }
}
function famFee(fb, age) { return famMgr() && fb.club === S.m.club ? 0 : Math.max(0, Math.round(3e5 * Math.exp((fb.ovr - 62) / 5.5) * (age <= 21 ? 1.3 : 1) / 1e5) * 1e5); }
/* ¿se le puede fichar ahora? */
function famSignable(k) {
  if (!famMgr() || k.sib) return false;
  var m = S.m; if (!k.fb || k.fb.ret || k.fb.pid != null || !famSame(k) || m.club < 0 || !m.mk || !m.mk.open) return false;
  return k.fb.club !== m.club && famAge(k) >= 16;
}
function famSign(k) {
  var m = S.m, fb = k.fb; if (!famSignable(k)) return null;
  var age = famAge(k), fee = famFee(fb, age);
  if (fee > m.bud) return null;
  var t = {fn: k.fn, ln: m.ln, pos: fb.pos, ovr: fb.ovr, pot: fb.pot, age: age, nat: m.nat, yrsD: 4, tr: null, club: fb.club};
  var sal = mWageFor({ovr: fb.ovr, age: age, pos: fb.pos}, m.club, "R");
  m.bud -= fee;
  var p = mgrSign(t, fee, sal, null, false);
  p.kid = k.id; p.mor = clamp(p.mor + 10, 0, 100);
  fb.pid = p.id; fb.from = fb.club; fb.club = m.club; fb.signed = (fb.signed || 0) + 1;
  return p;
}
function famKidPl(k) { return famMgr() && k.fb && k.fb.pid != null ? mPl(k.fb.pid) : null; }
if (typeof MPH !== "undefined") {
  MPH.kidfb = {
    fixed: true,
    head: function (x) { var k = famKid(x.kid), d = k.g === "f";
      return {tag: "real", tagTxt: tr("Vida personal"), cls: "", cat: tr("Familia"), title: d ? tr("Tu hija quiere ser futbolista") : tr("Tu hijo quiere ser futbolista"),
        text: d ? tr("{name} tiene {n} años y lo tiene claro: quiere jugar al fútbol. Una cantera le ha hecho una prueba y la quieren. ¿Dónde juega?", {name: k.fn, n: famAge(k)})
          : tr("{name} tiene {n} años y lo tiene claro: quiere jugar al fútbol. Una cantera le ha hecho una prueba y lo quieren. ¿Dónde juega?", {name: k.fn, n: famAge(k)})}; },
    opts: function () { return FAM_POS.map(function (p, i) { return {t: tr(p[1]), ok: {txt: "", fx: {}}, i: i, pk: p[0]}; }).concat([{t: tr("Mejor que estudie"), ok: {txt: tr("Seguirá con el fútbol los fines de semana, con los amigos."), fx: {}}, i: 4, no: true}]); },
    apply: function (x, o, res) {
      var k = famKid(x.kid); if (!k) return [];
      if (o.no) { k.no = true; return []; }
      var fb = famStartFb(k, o.pk);
      res.txt = tr("Empieza en la cantera del {club}: {pos}, {ovr} de media.", {club: famFbClubName(fb), pos: posName(fb.pos), ovr: Math.round(fb.ovr)});
      return [["note", 0, famSame(k) ? tr("Podrás ficharle cuando abra el mercado") : (k.g === "f" ? tr("Jugará en el fútbol femenino") : tr("Jugará en el fútbol masculino"))]];
    },
    card: function (x, o, res, chips, head) { return {t: "decision", tipo: "mgr", cat: tr("Familia"), title: head.title, choice: o.t, txt: res.txt, chips: chips, y: S.yr}; }
  };
  MPH.kidsign = {
    fixed: true,
    head: function (x) { var k = famKid(x.kid), fb = k.fb, d = k.g === "f";
      return {tag: "real", tagTxt: tr("Fichaje"), cls: "", cat: tr("Familia"), title: d ? tr("¿Fichas a tu hija?") : tr("¿Fichas a tu hijo?"),
        text: tr("{name} ({pos}, {age} años, {ovr} de media) juega en el {club}. Tienes {bud} de presupuesto.", {name: famKidName(k), pos: posName(fb.pos), age: famAge(k), ovr: Math.round(fb.ovr), club: famFbClubName(fb), bud: fmtMoney(S.m.bud)})}; },
    opts: function (x) { var k = famKid(x.kid), fee = famFee(k.fb, famAge(k));
      return [{t: fee ? tr("Ficharle por {fee}", {fee: fmtMoney(fee)}) : tr("Ficharle (sin coste)"), d: tr("Jugará a tus órdenes. El vestuario estará atento a si le das minutos de más."), ok: {txt: "", fx: {}}, i: 0, dis: fee > S.m.bud ? tr("No te llega el presupuesto") : null},
        {t: tr("Que siga creciendo en el {club}", {club: famFbClubName(k.fb)}), ok: {txt: tr("Mejor que se gane el sitio lejos de casa."), fx: {}}, i: 1}]; },
    apply: function (x, o, res) {
      var k = famKid(x.kid); if (!k || o.i !== 0) return [];
      var p = famSign(k);
      if (!p) { res.txt = tr("La operación no sale."); return []; }
      res.txt = tr("{name} firma por tu club. Padre y entrenador, en el mismo vestuario.", {name: famKidName(k)});
      return [["chem", -1]];
    },
    card: function (x, o, res, chips, head) { return {t: "decision", tipo: "mgr", cat: tr("Familia"), title: head.title, choice: o.t, txt: res.txt, chips: chips, y: S.yr}; }
  };
}

/* ---------- enganches ---------- */
(function () {
  if (typeof mgrPendValid === "function") {
    var _pv = mgrPendValid;
    mgrPendValid = function (x) {
      if (x.k === "fam") { var f = famOf(); return !!f && S.m.club >= 0 && !!FAM_EV[x.id] && FAM_EV[x.id].when(f); }
      if (x.k === "kidfb") { var k = famKid(x.kid); return !!k && !k.fb && !k.no && !k.sib; }
      if (x.k === "kidsign") { var k2 = famKid(x.kid); return !!k2 && famSignable(k2); }
      return _pv.apply(this, arguments);
    };
  }
  /* nueva temporada: cumpleaños, futbolistas de 16 y mercado de verano */
  if (typeof mgrStartSeason === "function") {
    var _ss = mgrStartSeason;
    mgrStartSeason = function () {
      var out = _ss.apply(this, arguments), f = S.m ? famOf() : null;
      if (f) famWindow(f, true);
      return out;
    };
  }
  if (typeof mgrQueueBetween === "function") {
    var _qb = mgrQueueBetween;
    mgrQueueBetween = function (nextBi) {
      var out = _qb.apply(this, arguments), f = S.m ? famOf() : null;
      if (f && S.m.club >= 0) {
        var id = famPickEv(); if (id) S.pend.push(mp("fam", {id: id}));
        if (nextBi === 3) famWindow(f, false);
      }
      return out;
    };
  }
  /* temporada de tus hijos futbolistas (la de tu plantilla se toma de sus números) */
  if (typeof mgrSquadSeasonEnd === "function") {
    var _sse = mgrSquadSeasonEnd;
    mgrSquadSeasonEnd = function () {
      var f = S.m ? famOf() : null;
      if (f) f.kids.forEach(function (k) {
        var p = famKidPl(k); if (!p || !k.fb) return;
        k.fb.seasons.push({y: S.yr, club: S.m.club, apps: p.st.apps, g: p.st.g, a: p.st.a, ovr: Math.round(p.ovr), rt: p.st.rn ? round1(p.st.rs / p.st.rn) : null, mine: true});
        k.fb.ovr = p.ovr; k.fb.pot = p.pot;
      });
      var out = _sse.apply(this, arguments);
      if (f) f.kids.forEach(function (k) { if (k.fb && k.fb.pid == null) famSimSeason(k); var p = famKidPl(k); if (p) { k.fb.ovr = p.ovr; } });
      return out;
    };
  }
  /* si sale de tu plantilla (venta, cesión que acaba, retirada o te vas tú) */
  if (typeof mgrRemovePlayer === "function") {
    var _rp = mgrRemovePlayer;
    mgrRemovePlayer = function (p, why, club, fee, quiet) {
      var k = p && p.kid != null ? famKid(p.kid) : null;
      var out = _rp.apply(this, arguments);
      if (k && k.fb && S.m.sq.indexOf(p) < 0) {
        k.fb.pid = null; k.fb.ovr = p.ovr;
        if (club != null && club >= 0) k.fb.club = club;
        else if (/retir/i.test(String(why)) || p.age >= 35) k.fb.ret = S.yr;
        else { k.fb.club = S.m.club; famMove(k, p.ovr); }
      }
      return out;
    };
  }
  if (typeof mgrLeaveClub === "function") {
    var _lc = mgrLeaveClub;
    mgrLeaveClub = function () {
      var f = S.m ? famOf() : null, old = S.m ? S.m.club : -1;
      if (f) f.kids.forEach(function (k) { var p = famKidPl(k); if (p) { k.fb.pid = null; k.fb.ovr = p.ovr; k.fb.club = old; } });
      return _lc.apply(this, arguments);
    };
  }
})();
/* mercado abierto: proponer el fichaje; nueva temporada: quien cumple 16 */
function famWindow(f, summer) {
  if (summer) famKids(f).forEach(function (k) {
    if (!k.fb && !k.no && famAge(k) >= 16 && famAge(k) <= 19) S.pend.push(mp("kidfb", {kid: k.id}));
  });
  f.kids.forEach(function (k) { if (famSignable(k) && (k.fb.ask || 0) < S.yr * 10 + (summer ? 0 : 3)) { k.fb.ask = S.yr * 10 + (summer ? 0 : 3); S.pend.push(mp("kidsign", {kid: k.id})); } });
}
/* para la interfaz: lo esencial de cada hijo */
function famKidInfo(k) {
  var age = famAge(k), fb = k.fb, p = famKidPl(k), tot = {apps: 0, g: 0};
  if (fb) fb.seasons.forEach(function (s) { tot.apps += s.apps; tot.g += s.g; });
  if (p) { tot.apps += p.st.apps; tot.g += p.st.g; }
  return {age: age, fb: fb, mine: !!p, p: p, tot: tot, club: fb ? (p ? clubName(S.m.club) : famFbClubName(fb)) : null, ovr: fb ? Math.round(p ? p.ovr : fb.ovr) : null};
}

/* ---------- el relevo de la dinastía: hijo o hija, y tu hijo futbolista ----------
   o: {fn, pos, foot, g: "m"|"f", kid: id}. Si quien toma el relevo es de otro fútbol (una hija en el masculino
   o un hijo en el femenino), la familia se muda de mundo: se crea el fútbol que le toca en el mismo año
   y la dinastía viaja con ella (los clubes de la familia se buscan por su nombre). */
(function () {
  if (typeof dynHeirStart !== "function") return;
  var _dh = dynHeirStart;
  dynHeirStart = function (o) {
    o = Object.assign({}, o || {});
    var wg = S.g === "f" ? "f" : "m", k = o.kid != null ? famKid(o.kid) : null;
    if (k) {
      o.fn = k.fn; o.g = k.g;
      if (k.fb && !k.fb.ret) { o.pos = k.fb.pos; o.ovr = k.fb.ovr; o.pot = k.fb.pot; o.age = famAge(k) + 1; if (k.fb.club >= 0 && famSame(k)) o.club = k.fb.club; }
    }
    var nf = famHeirFam(o, k), ok;
    if ((o.g || wg) === wg) ok = _dh.call(this, o);
    else ok = dynHeirCross(o, k);
    if (ok && nf) S.fam = nf;
    return ok;
  };
})();
function dynHeirCross(o, k) {
  if (!dynCanHeir()) return false;
  var mgr = S.mode === "mgr", par = mgr ? dynRecordM() : dynRecordP();
  if (!par) return false;
  var d = dynOf(), nameOf = function (c) { return c != null && c >= 0 && W.clubs[c] ? W.clubs[c].n : null; };
  /* lo que viaja: la dinastía con los clubes por su nombre */
  d.mem.forEach(function (x) { x.clubN = x.clubN || nameOf(x.club); x.mclubN = x.mclubN || nameOf(x.mclub); });
  var byName = {}; Object.keys(d.clubs).forEach(function (c) { var n = nameOf(+c); if (n) byName[n] = d.clubs[c]; });
  Object.keys(d.clubsX || {}).forEach(function (n) { byName[n] = d.clubsX[n]; });
  var famSc = Math.max(par.sc || 0, par.msc || 0), parFol = par.fol || famSc / 20, parMoney = par.money || 0;
  var natCode = W.ctry[par.nat != null ? par.nat : (S.p ? S.p.nat : S.m.nat)].code;
  var keep = {uid: S.uid, set: S.set, achLg: S.achLg, achE: S.achE}, ln = par.ln, yr = S.yr;
  var homeName = k && k.fb && !k.fb.ret ? k.fb.cn : (mgr ? par.mclubN || par.clubN : par.clubN);
  var sy = START_YEAR; START_YEAR = yr + 1;
  buildWorld(o.g === "f" ? "f2" : "m");
  try {
    newCareer({fn: o.fn, ln: ln, nat: natCode, pos: o.pos || "MC", foot: o.foot || "Diestro", age: k && k.fb && !k.fb.ret ? Math.max(16, famAge(k) + 1) : 17, talent: "promesa",
      club: homeName && W.cName[homeName] != null ? W.cName[homeName] : -1, ev: keep.set ? keep.set.ev : 1, g: o.g});
  } finally { START_YEAR = sy; }
  Object.keys(keep).forEach(function (kk) { if (keep[kk] !== undefined) S[kk] = keep[kk]; });
  /* la dinastía en el nuevo mundo */
  d.g = par.gen + 1; d.clubs = {}; d.clubsX = {};
  Object.keys(byName).forEach(function (n) { var c = W.cName[n]; if (c != null) d.clubs[c] = byName[n]; else d.clubsX[n] = byName[n]; });
  d.mem.forEach(function (x) { x.club = x.clubN && W.cName[x.clubN] != null ? W.cName[x.clubN] : -1; x.mclub = x.mclubN && W.cName[x.mclubN] != null ? W.cName[x.mclubN] : -1; });
  S.dyn = d;
  var p = S.p;
  p.heirOf = par.gen; p.fame = Math.round(clamp(4 + famSc / 40, 4, 35)); p.fol = round1(1.5 + parFol * 0.2);
  p.money = 15000 + Math.round(Math.min(parMoney * 0.1, 2e6) / 1000) * 1000;
  p.pot = Math.max(p.pot + clamp(famSc / 300, 0, 3.5), p.ovr + 6);
  if (k && k.fb && !k.fb.ret) { p.ovr = k.fb.ovr; p.pot = Math.max(k.fb.pot, p.ovr + 1); p.peak = p.ovr; }
  p.potSeen = potEstimate();
  dynGenMark(p.club, d.g);
  S.pend.unshift({k: "ev", id: "agente"});
  milestone(tr("Empieza la generación {n} de la familia {ln}", {n: d.g, ln: ln}));
  feed({t: "decision", tipo: "real", cat: tr("Dinastía"), title: tr("Generación {n}: {name}", {n: d.g, name: o.fn + " " + ln}),
    choice: o.g === "f" ? tr("Al fútbol femenino: cantera del {club}", {club: clubName(p.club)}) : tr("Al fútbol masculino: cantera del {club}", {club: clubName(p.club)}),
    txt: tr("Hereda el apellido de {parent} ({title}): la afición y la prensa ya saben quién es.", {parent: par.fn + " " + par.ln, title: par.title || par.mtitle || ""}),
    chips: [["fame", Math.round(p.fame - 4)]], y: S.yr});
  return true;
}
/* hijos futbolistas que pueden tomar el relevo al retirarte como entrenador */
function famHeirKids() {
  var f = S && (S.m || S.p) ? famOf() : null; if (!f) return [];
  return famKids(f).filter(function (k) { return k.fb && !k.fb.ret && famAge(k) <= 30; });
}
/* la familia que hereda quien toma el relevo: tus padres (tú y tu pareja) y tus hermanos */
function famHeirFam(o, k) {
  var f = S.fam || (S.m && S.m.fam); if (!f) return null;
  var h = famHero(); if (!h) return null;
  var heir = k || famKids(f).filter(function (x) { return !x.fb && x.fn === o.fn && x.g === (o.g || (S.g === "f" ? "f" : "m")); })[0] || null;
  return {set: true, pt: null, ex: 0, nid: f.nid || 1, par: {fn: h.fn + " " + h.ln, pt: f.pt ? f.pt.fn : null, ptg: f.pt ? f.pt.g : null, g: famMe()},
    kids: famKids(f).filter(function (x) { return x !== heir; }).map(function (x) { var c = Object.assign({}, x); c.sib = true; if (c.fb) { c.fb = Object.assign({}, c.fb); c.fb.pid = null; } return c; })};
}
/* al retirarte, la dinastía recuerda con quién compartiste la vida */
(function () {
  if (typeof retire === "function") { var _r = retire; retire = function () { var out = _r.apply(this, arguments); famMarkDyn(); return out; }; }
  if (typeof mgrRetire === "function") { var _mr = mgrRetire; mgrRetire = function () { var out = _mr.apply(this, arguments); famMarkDyn(); return out; }; }
})();
function famMarkDyn() {
  try { var f = famOf(), x = typeof dynCur === "function" ? dynCur() : null; if (f && f.pt && x) { x.pt = f.pt.fn; x.ptg = f.pt.g; } } catch (e) {}
}

/* ---------- modo jugador: decisiones de pareja, hijos que crecen y futbolistas ---------- */
function famOptsP(id) {
  var e = FAM_EV[id], f = famOf();
  var list = e.optsP ? e.optsP(f) : e.opts(f).map(function (o) {
    var fx = {}; Object.keys(o.fx || {}).forEach(function (k) {
      var v = o.fx[k], m = {chem: "mor", sqMor: "mor", board: "coach", rep: "fame"}[k] || k; fx[m] = (fx[m] || 0) + v; });
    return Object.assign({}, o, {fx: fx});
  });
  return list;
}
if (typeof EX_PEND !== "undefined") {
  EX_PEND.pfam = {
    desc: function (x) {
      var f = famOf(), h = FAM_EV[x.id].head(f);
      return {tag: "real", tagTxt: tr("Vida personal"), cls: "", cat: f.pt ? tr("Con {name}", {name: f.pt.fn}) : tr("Fuera del fútbol"), title: h.title, text: h.text,
        opts: famOptsP(x.id).map(function (o) { return descOpt({t: o.t, d: o.d, ok: {fx: o.fx}}, function (u) { return fxPreview(u.fx); }); })};
    },
    resolve: function (x, choice) {
      var f = famOf(), o = famOptsP(x.id)[choice]; if (!o) return null;
      var head = FAM_EV[x.id].head(f);
      S.pend.shift();
      var fx = Object.assign({}, o.fx), rv = fx.rel || 0; delete fx.rel;
      var chips = applyFx(fx), txt = o.d;
      if (rv && f.pt) chips.push(["rel", Math.round(famRel(rv))]);
      if (o.famT) S.p.flags.famT = S.yr * 10 + S.bi + (o.famT === true ? 1 : o.famT);
      f.last = x.id;
      if (o.brk) { famBreakup(tr("Decidís separaros. Duele, pero es lo mejor para los dos.")); txt = tr("Cada uno por su lado."); }
      if (o.meet) { f.pt = {fn: famFirst(famNat(), o.meet), g: o.meet, rel: 62, y0: S.yr}; txt = tr("Se llama {name}. Empezáis a veros.", {name: f.pt.fn}); }
      if (o.kid) {
        var k = famNewKid(o.kid, famSameSex());
        txt = k.ad ? (k.g === "f" ? tr("Llega a casa {name}, de {n} años. Ya es tu hija.", {name: k.fn, n: famAge(k)}) : tr("Llega a casa {name}, de {n} años. Ya es tu hijo.", {name: k.fn, n: famAge(k)}))
          : (k.g === "f" ? tr("Nace {name}. Eres padre de una niña preciosa.", {name: k.fn}) : tr("Nace {name}. Eres padre de un niño precioso.", {name: k.fn}));
      }
      return {t: "decision", tipo: "real", cat: tr("Vida personal"), title: head.title, choice: o.t, txt: txt, chips: chips, y: S.yr};
    }
  };
  EX_PEND.pkidfb = {
    desc: function (x) {
      var d = MPH.kidfb.head(x);
      d.opts = MPH.kidfb.opts(x).map(function (o) { return descOpt({t: o.t, ok: {fx: {}}}, function () { return []; }); });
      return d;
    },
    resolve: function (x, choice) {
      var o = MPH.kidfb.opts(x)[choice]; if (!o) return null;
      var head = MPH.kidfb.head(x), res = {txt: o.ok.txt};
      S.pend.shift();
      var chips = MPH.kidfb.apply(x, o, res);
      return {t: "decision", tipo: "real", cat: tr("Familia"), title: head.title, choice: o.t, txt: res.txt, chips: chips, y: S.yr};
    }
  };
}
function famPValid(x) {
  var f = famOf(); if (!f) return false;
  if (x.k === "pfam") return !!FAM_EV[x.id] && FAM_EV[x.id].when(f) && S.p && S.p.club >= 0;
  if (x.k === "pkidfb") { var k = famKid(x.kid); return !!k && !k.fb && !k.no && !k.sib; }
  return true;
}
(function () {
  if (typeof cleanPendPlayer === "function") {
    var _cp = cleanPendPlayer;
    cleanPendPlayer = function () {
      _cp.apply(this, arguments);
      while (S.pend.length && (S.pend[0].k === "pfam" || S.pend[0].k === "pkidfb") && !famPValid(S.pend[0])) { S.pend.shift(); _cp.apply(this, arguments); }
    };
  }
  if (typeof queueBetween === "function") {
    var _qb = queueBetween;
    queueBetween = function () {
      var out = _qb.apply(this, arguments);
      if (S.mode !== "mgr" && S.p && S.fam) { var id = famPickEv(); if (id) S.pend.push({k: "pfam", id: id}); }
      return out;
    };
  }
  if (typeof startSeason === "function") {
    var _st = startSeason;
    startSeason = function (first) {
      var out = _st.apply(this, arguments);
      if (!first && S.mode !== "mgr" && S.fam) famKids(S.fam).forEach(function (k) { if (!k.fb && !k.no && famAge(k) >= 16 && famAge(k) <= 19) S.pend.push({k: "pkidfb", kid: k.id}); });
      return out;
    };
  }
  if (typeof seasonEnd === "function") {
    var _se = seasonEnd;
    seasonEnd = function () {
      if (S.mode !== "mgr" && S.fam) S.fam.kids.forEach(function (k) { if (k.fb && k.fb.pid == null) famSimSeason(k); });
      return _se.apply(this, arguments);
    };
  }
  /* en el modo entrenador también siguen su carrera los hermanos (de una generación anterior) */
})();
