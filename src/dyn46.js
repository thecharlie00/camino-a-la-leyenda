/* dyn46.js — «Dinastías» (versión 4.6), motor.
   S.dyn = {g: generación actual, mem: [miembros], clubs: {club: {p, g, m, tro, gens}}}
   - Cada retirada (de futbolista o de entrenador) guarda al miembro de la familia y su paso por cada club.
   - Al retirarte, tu hijo (o tu hija, en el fútbol femenino) puede seguir tus pasos: empieza a los 17 años
     en la cantera de tu club de referencia y hereda parte de tu fama.
   - Los clubes de la familia reciben a los tuyos con cariño y se acuerdan de ti cuando buscan entrenador.
   - Récords de la dinastía: partidos, goles, títulos e internacionalidades de toda la familia. */

function dynOf() { return S.dyn || (S.dyn = {g: 1, mem: [], clubs: {}}); }
function dynClub(c) { var d = dynOf(); return d.clubs[c] || (d.clubs[c] = {p: 0, g: 0, m: 0, tro: 0, gens: []}); }
function dynGenMark(c, g) { var x = dynClub(c); if (x.gens.indexOf(g) < 0) x.gens.push(g); }
/* el miembro de la generación actual (se crea al retirarse) */
function dynCur() { var d = dynOf(); return d.mem.filter(function (x) { return x.gen === d.g; })[0] || null; }

/* ---------- guardar a quien se retira ---------- */
function dynRecordP() {
  var d = dynOf(), p = S.p, r = S.retired; if (!p || !r) return null;
  if (dynCur() && dynCur().pk) return dynCur();
  var x = dynCur() || {gen: d.g};
  var best = {g: 0, y: 0};
  p.seasons.forEach(function (s) { if (s.g > best.g) best = {g: s.g, y: s.y}; });
  Object.assign(x, {pk: true, fn: p.fn, ln: p.ln, pos: p.pos, nat: p.inat >= 0 ? p.inat : p.nat, y0: p.seasons.length ? p.seasons[0].y : S.yr, y1: r.y, age: r.age, club: r.main,
    apps: r.tot.apps, g: r.tot.g, a: r.tot.a, tro: p.trophies.length, caps: p.intl.caps, ig: p.intl.g, bdo: p.awards.filter(function (a) { return a.k === "bdo"; }).length,
    sc: r.lg.sc, title: r.lg.title, peak: Math.round(p.peak), best: best, fame: Math.round(p.fame), fol: p.fol, money: p.money});
  if (d.mem.indexOf(x) < 0) d.mem.push(x);
  p.seasons.forEach(function (s) { var c = dynClub(s.club); c.p += s.apps; c.g += s.g; dynGenMark(s.club, x.gen); });
  p.trophies.forEach(function (t) { if (t.team != null && t.team >= 0) dynClub(t.team).tro++; });
  return x;
}
function dynRecordM() {
  var d = dynOf(), m = S.m, r = S.mretired; if (!m || !r) return null;
  var x = dynCur() || {gen: d.g};
  if (x.mk) return x;
  Object.assign(x, {mk: true, fn: x.fn || m.fn, ln: x.ln || m.ln, nat: x.nat != null ? x.nat : m.nat, my0: m.y0, my1: r.y, mage: r.age, mclub: r.main, seasons: m.seasons.length,
    mn: r.tot.n, mw: r.tot.w, mtro: m.trophies.length, msc: r.lg.sc, mtitle: r.lg.title, rep: Math.round(m.peakRep)});
  if (x.y0 == null) { x.y0 = m.y0; x.club = r.main; }
  x.y1 = r.y;
  if (d.mem.indexOf(x) < 0) d.mem.push(x);
  m.seasons.forEach(function (s) { if (s.club >= 0) { dynClub(s.club).m++; dynGenMark(s.club, x.gen); } });
  m.trophies.forEach(function (t) { if (t.club != null && t.club >= 0) dynClub(t.club).tro++; });
  return x;
}
function dynCanHeir() { return !!S && S.ph === "ret" && !!(S.retired || S.mretired); }

/* ---------- el relevo: tu hijo o tu hija ---------- */
/* o: {fn, pos, foot} */
function dynHeirStart(o) {
  if (!dynCanHeir()) return false;
  var d = dynOf(), mgr = S.mode === "mgr";
  var par = mgr ? dynRecordM() : dynRecordP();
  if (!par) return false;
  var old = S.p, m = S.m;
  var famSc = Math.max(par.sc || 0, par.msc || 0);
  var nat = par.nat != null ? par.nat : (old ? (old.inat >= 0 ? old.inat : old.nat) : m.nat);
  var home = mgr ? (par.mclub != null ? par.mclub : par.club) : par.club;
  d.g = par.gen + 1;
  /* el nuevo futbolista */
  var T = TALENT.promesa, ovr = T.ovr - 1.5, pot = rf(T.pot[0], T.pot[1]) + clamp(famSc / 300, 0, 3.5);
  var keys = o.pos === "POR" ? ATT_GK : ATT_OUT, att = {};
  keys.forEach(function (k) { att[k] = ri(-3, 3); });
  if (o.pos !== "POR") att[o.foot === "Zurdo" ? "REG" : "PAS"] += 1;
  var fame = clamp(4 + famSc / 40, 4, 35), parFol = par.fol || (famSc / 20), parMoney = par.money || 0;
  S.p = {fn: o.fn, ln: par.ln, nat: nat, nat2: -1, inat: nat, pos: o.pos, foot: o.foot, age: 16,
    ovr: ovr + rf(-0.5, 0.5), pot: Math.max(pot, ovr + 6), att: att, tr: {}, form: 56, mor: 70, fit: 92, prof: 66, fame: Math.round(fame), coach: 55, fans: 50,
    money: 15000 + Math.round(Math.min(parMoney * 0.1, 2e6) / 1000) * 1000, fol: round1(1.5 + parFol * 0.2), club: -1, loan: null, con: null, agent: 0, injT: 0, inj: null, susp: 0, buffs: [], flags: {}, focus: null,
    seasons: [], intl: {caps: 0, g: 0, a: 0, debut: null, tours: []}, trophies: [], awards: [], ms: [], peak: ovr, evCd: {}, objs: [], tx: [],
    ss: null, ns: null, potSeen: null, motm: 0, pom: 0, heirOf: par.gen};
  /* la mascota de la familia sigue en casa */
  if (old && old.life && old.life.pet && old.life.pet.age < old.life.pet.life) S.p.life0pet = old.life.pet;
  S.p.potSeen = potEstimate();
  /* fuera lo que era del padre o la madre */
  S.mode = "p"; delete S.m; S.retired = null; S.mretired = null; S.retiredP = null; S.soc = null; S.troQ = []; S.cur = null; S.tour = null; S.live = null; S.ch = null;
  var club = home != null && home >= 0 && S.cl[home] >= 0 ? home : randomStartClub(nat), fam = dynFamClub(club);
  joinClub(club, {sal: salaryFor(S.p.ovr, club) * 0.6, yrs: 3, fee: 0, first: true});
  S.ph = "off"; S.pend = [];
  startSeason(false);
  S.pend.unshift({k: "ev", id: "agente"});
  if (S.p.life0pet && typeof lifeOf === "function") { try { lifeOf().pet = S.p.life0pet; } catch (e) {} delete S.p.life0pet; }
  if (fam) { S.p.fans = clamp(S.p.fans + 10, 0, 100); S.p.coach = clamp(S.p.coach + 4, 0, 100); }
  dynGenMark(club, d.g);
  milestone(tr("Empieza la generación {n} de la familia {ln}", {n: d.g, ln: par.ln}));
  feed({t: "decision", tipo: "real", cat: tr("Dinastía"), title: tr("Generación {n}: {name}", {n: d.g, name: o.fn + " " + par.ln}),
    choice: fam ? tr("A la cantera del {club}, el club de la familia", {club: clubName(club)}) : tr("A la cantera del {club}", {club: clubName(club)}),
    txt: tr("Hereda el apellido de {parent} ({title}): la afición y la prensa ya saben quién es.", {parent: par.fn + " " + par.ln, title: par.title || par.mtitle || ""}),
    chips: [["fame", Math.round(fame - 4)]], y: S.yr});
  return true;
}

/* ---------- récords de la dinastía (incluye a quien está en activo) ---------- */
function dynRecords() {
  var d = dynOf(), t = {apps: 0, g: 0, a: 0, tro: 0, caps: 0, bdo: 0, seasons: 0, mtro: 0, gens: 0}, best = {g: null, tro: null, sc: null, season: null};
  var all = d.mem.slice();
  var live = dynLive(); if (live) all.push(live);
  all.forEach(function (x) {
    t.apps += x.apps || 0; t.g += x.g || 0; t.a += x.a || 0; t.tro += (x.tro || 0); t.caps += x.caps || 0; t.bdo += x.bdo || 0; t.seasons += x.seasons || 0; t.mtro += x.mtro || 0;
    if ((x.g || 0) > 0 && (!best.g || x.g > best.g.g)) best.g = x;
    var tt = (x.tro || 0) + (x.mtro || 0); if (tt > 0 && (!best.tro || tt > (best.tro.tro || 0) + (best.tro.mtro || 0))) best.tro = x;
    var sc = Math.max(x.sc || 0, x.msc || 0); if (sc > 0 && (!best.sc || sc > Math.max(best.sc.sc || 0, best.sc.msc || 0))) best.sc = x;
    if (x.best && x.best.g > 0 && (!best.season || x.best.g > best.season.best.g)) best.season = x;
  });
  t.gens = all.length;
  return {t: t, best: best, all: all};
}
/* el miembro en activo, con sus números hasta hoy */
function dynLive() {
  if (!S || S.ph === "ret") return null;
  var d = dynOf();
  if (S.mode === "mgr" && S.m) {
    var cur = dynCur(), m = S.m, tot = typeof mgrTotals === "function" ? mgrTotals() : {n: 0, w: 0};
    return Object.assign({}, cur || {}, {gen: d.g, live: true, fn: m.fn, ln: m.ln, nat: m.nat, my0: m.y0, mclub: m.club, seasons: m.seasons.length, mn: tot.n, mw: tot.w, mtro: m.trophies.length, y0: cur ? cur.y0 : m.y0});
  }
  if (S.p) {
    var p = S.p, tp = typeof careerTotals === "function" ? careerTotals() : {apps: 0, g: 0, a: 0}, best = {g: 0, y: 0};
    p.seasons.forEach(function (s) { if (s.g > best.g) best = {g: s.g, y: s.y}; });
    return {gen: d.g, live: true, pk: true, fn: p.fn, ln: p.ln, pos: p.pos, nat: p.inat >= 0 ? p.inat : p.nat, y0: p.seasons.length ? p.seasons[0].y : S.yr, club: p.club,
      apps: tp.apps, g: tp.g, a: tp.a, tro: p.trophies.length, caps: p.intl.caps, bdo: p.awards.filter(function (a) { return a.k === "bdo"; }).length, best: best};
  }
  return null;
}
/* ¿este club es de la familia? (generaciones anteriores a la actual) */
function dynFamClub(c) {
  var d = S && S.dyn; if (!d || c == null || c < 0 || !d.clubs[c]) return false;
  return d.clubs[c].gens.some(function (g) { return g < d.g; });
}
function dynParentOn(c) {
  var d = S.dyn; if (!d) return null;
  return d.mem.filter(function (x) { return x.gen < d.g && d.clubs[c] && d.clubs[c].gens.indexOf(x.gen) >= 0; }).sort(function (a, b) { return b.gen - a.gen; })[0] || null;
}

/* ---------- enganches ---------- */
(function () {
  if (typeof retire === "function") { var _r = retire; retire = function () { var res = _r.apply(this, arguments); try { dynRecordP(); } catch (e) {} return res; }; }
  if (typeof mgrRetire === "function") { var _mr = mgrRetire; mgrRetire = function () { var res = _mr.apply(this, arguments); try { dynRecordM(); } catch (e) {} return res; }; }
  /* fichar por un club de la familia: la afición lo celebra */
  if (typeof joinClub === "function") {
    var _jc = joinClub;
    joinClub = function (c, t) {
      var res = _jc.apply(this, arguments);
      if (dynFamClub(c) && !(t && t.first)) {
        var par = dynParentOn(c);
        S.p.fans = clamp(S.p.fans + 10, 0, 100); S.p.coach = clamp(S.p.coach + 3, 0, 100);
        if (par) (S.bnews || []).push({t: "star", x: tr("La afición del {club} recibe a lo grande a la nueva generación de los {ln}.", {club: clubName(c), ln: par.ln})});
      }
      if (S.dyn) dynGenMark(c, S.dyn.g);
      return res;
    };
  }
  if (typeof mgrJoinClub === "function") {
    var _mj = mgrJoinClub;
    mgrJoinClub = function (c) {
      var fam = dynFamClub(c), res = _mj.apply(this, arguments);
      if (fam && S.m) {
        S.m.board = clamp(S.m.board + 6, 0, 100); S.m.fans = clamp(S.m.fans + 10, 0, 100);
        feedNote(tr("Vuelve un apellido de la casa: la afición del {club} recibe con cariño al nuevo míster.", {club: clubName(c)}));
      }
      if (S.dyn) dynGenMark(c, S.dyn.g);
      return res;
    };
  }
  /* los clubes de la familia se acuerdan de ti cuando buscan banquillo */
  if (typeof mgrJobOffers === "function") {
    var _jo = mgrJobOffers;
    mgrJobOffers = function (lower, upward) {
      var out = _jo.apply(this, arguments), d = S.dyn, m = S.m;
      if (!d || !m || upward) return out;
      var max = mgrMaxClubR(), fam = Object.keys(d.clubs).map(Number).filter(function (c) { return c !== m.club && dynFamClub(c) && S.cl[c] >= 0 && S.cr[c] <= max + 3 && !out.some(function (o) { return o.club === c; }); });
      if (fam.length && chance(0.7)) { var c = pick(fam); out.unshift({club: c, sal: mgrSalary(c), yrs: ri(2, 3), fam: true}); if (out.length > 4) out.length = 4; }
      return out;
    };
  }
})();
