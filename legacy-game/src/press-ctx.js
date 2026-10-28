/* ===== PARCHE 2.5 · PRENSA CON CONTEXTO, PRESIÓN MEDIÁTICA Y MOTES DINÁMICOS =====
   - Preguntas generadas a partir del estado real (clasificación, rachas, forma, rival, exclub, presupuesto…),
     mezcladas con el banco de PRESS (press-data.js). Se guardan en S.prx.cq mientras están pendientes.
   - Presión mediática 0–100 en S.p.mpr / S.m.mpr: sube con respuestas incendiarias y malas rachas, baja sola.
   - Cada respuesta enseña su efecto antes de elegir (chips), clave de efecto "press" = presión mediática.
   - Frecuencia: jugador = solo hitos narrativos; míster = ritmo profesional según S.set.ev.
   - Motes procedurales (catálogo + combinaciones), positivos y negativos, que cambian a lo largo de la carrera.
   Estado propio: S.prx = {h: historial de partidos, n: tramos absorbidos, k, lp, at, aw, dd, cq, cid, nq} */

/* ---------- estado y presión mediática ---------- */
function prxSelf() { return S && S.mode === "mgr" ? S.m : S ? S.p : null; }
function prxState() {
  var st = S.prx || (S.prx = {h: [], n: 0, k: "", lp: -9, at: {agr: 0, dip: 0, hum: 0, eva: 0}, aw: -1, cq: {}, cid: 0});
  if (!st.cq) st.cq = {};
  if (!st.at) st.at = {agr: 0, dip: 0, hum: 0, eva: 0};
  return st;
}
function mpGet(o) { o = o || prxSelf(); return o && o.mpr != null ? o.mpr : 20; }
function mpAdd(v, o) {
  o = o || prxSelf();
  if (!o || !v) return 0;
  var a = mpGet(o);
  o.mpr = Math.round(clamp(a + v, 0, 100));
  return o.mpr - a;
}
var MP_LV = [N_("Baja"), N_("Media"), N_("Alta"), N_("Máxima")];
function mpLevel(v) { return v < 35 ? 0 : v < 65 ? 1 : v < 85 ? 2 : 3; }
onLang(function () { if (typeof FX_LABEL !== "undefined" && FX_LABEL) FX_LABEL.press = tr("Presión mediática"); if (typeof MFX_LABEL !== "undefined" && MFX_LABEL) MFX_LABEL.press = tr("Presión mediática"); });

/* ---------- parámetros con plural y apodo (se resuelven al mostrarse) ---------- */
var PX_U = {pt: [N_("{n} punto"), N_("{n} puntos")], g: [N_("{n} gol"), N_("{n} goles")], m: [N_("{n} partido"), N_("{n} partidos")],
  j: [N_("{n} jornada"), N_("{n} jornadas")], pen: [N_("{n} penalti"), N_("{n} penaltis")]};
function pxTp(a, b) {
  var o = {};
  [b, a].forEach(function (src) {
    if (!src) return;
    Object.keys(src).forEach(function (k) {
      var v = src[k];
      if (v && typeof v === "object") {
        if (v.u && PX_U[v.u]) v = trn(v.n, PX_U[v.u][0], PX_U[v.u][1]);
        else if (v.nk) v = nickName(prxSelf()) || "";
        else if (v.rt != null) v = fmtDec(v.rt, 1);
        else if (v.pc != null) v = v.pc + " %";
        else v = "";
      }
      o[k] = v;
    });
  });
  return o;
}
function pxU(n, u) { return {n: n, u: u}; }

/* ---------- historial de partidos (S.blog solo guarda el tramo en curso) ---------- */
function prxAbsorb() {
  if (!S || !S.blog) return false;
  var st = prxState(), log = S.blog.filter(function (e) { return !e.nat; });
  var key = S.yr + ":" + (S.blog[0] ? S.blog[0].w : "x") + ":" + S.blog.length;
  if (st.k === key) return false;
  st.k = key; st.n++;
  var mgr = S.mode === "mgr", club = mgr ? S.m.club : S.p.club;
  log.forEach(function (e) {
    var row = {r: e.gu > e.gt ? "W" : e.gu < e.gt ? "L" : "D", gu: e.gu, gt: e.gt, o: e.o, b: st.n, y: S.yr};
    if (club >= 0 && W.derby && W.derby[club + "-" + e.o]) row.d = 1;
    if (e.r && /Final/.test(e.r) && !/Semi|Cuartos|Octavos/.test(e.r)) row.f = 1;
    if (e.x >= 2) row.x = e.x;
    if (!mgr) { row.m = e.m || 0; row.g = e.g || 0; if (e.rt != null) row.rt = e.rt; if (e.red) row.red = 1; if (e.ro) row.ro = e.ro; }
    st.h.push(row);
  });
  if (st.h.length > 16) st.h = st.h.slice(-16);
  prxBlockTick(log.length > 0);
  return true;
}
/* rachas y forma a partir del historial (lo más reciente al final) */
function prxRuns(h) {
  var R0 = {win: 0, loss: 0, unb: 0, wl: 0, tcs: 0, blank: 0};
  var stop = {win: 0, loss: 0, unb: 0, wl: 0, tcs: 0, blank: 0};
  for (var i = h.length - 1; i >= 0; i--) {
    var e = h[i];
    if (!stop.win) { if (e.r === "W") R0.win++; else stop.win = 1; }
    if (!stop.loss) { if (e.r === "L") R0.loss++; else stop.loss = 1; }
    if (!stop.unb) { if (e.r !== "L") R0.unb++; else stop.unb = 1; }
    if (!stop.wl) { if (e.r !== "W") R0.wl++; else stop.wl = 1; }
    if (!stop.tcs) { if (e.gt === 0) R0.tcs++; else stop.tcs = 1; }
    if (!stop.blank) { if (e.gu === 0) R0.blank++; else stop.blank = 1; }
  }
  return R0;
}
function prxApps(h) { return h.filter(function (e) { return e.m > 0; }); }
function nextLgOpp(club) {
  var li = club >= 0 ? S.cl[club] : -1, L = li >= 0 && S.L ? S.L[li] : null;
  if (!L || L.md >= L.N) return -1;
  var idx = L.tm.indexOf(club), pr = leagueFixtures(L, L.md);
  for (var i = 0; i < pr.length; i++) { if (pr[i][0] === idx) return L.tm[pr[i][1]]; if (pr[i][1] === idx) return L.tm[pr[i][0]]; }
  return -1;
}
function prxExClubs() {
  var out = {};
  if (S.mode === "mgr") {
    var m = S.m;
    (m.spells || []).forEach(function (s) { if (s.club !== m.club) out[s.club] = 1; });
    if (m.exClub != null && m.exClub >= 0 && m.exClub !== m.club) out[m.exClub] = 1;
  } else {
    var p = S.p;
    (p.seasons || []).forEach(function (r) { (r.clubs || [r.club]).forEach(function (c) { if (c !== p.club) out[c] = 1; }); });
    ((p.ss && p.ss.clubs) || []).forEach(function (c) { if (c !== p.club) out[c] = 1; });
  }
  return out;
}

/* ---------- foto del momento ---------- */
function prxFacts() {
  var mgr = S.mode === "mgr", self = prxSelf(), club = mgr ? S.m.club : S.p.club, st = prxState();
  var F = {mgr: mgr, club: club, gk: !mgr && isGK(), grp: mgr ? "DT" : posGroup(), mp: mpGet(), h: st.h, bn: st.n};
  F.clubN = club >= 0 ? clubName(club) : "";
  var li = club >= 0 ? S.cl[club] : -1;
  F.li = li;
  if (li >= 0 && S.L && S.L[li]) {
    var tb = standings(li), L = S.L[li], lg = W.lg[li], n = tb.length;
    var pos = 0;
    for (var i = 0; i < n; i++) if (tb[i].c === club) pos = i + 1;
    if (pos) {
      F.pos = pos; F.n = n; F.pts = tb[pos - 1].r[6]; F.played = tb[pos - 1].r[0]; F.left = Math.max(0, L.N - F.played);
      F.tb = tb;
      F.rel = n > 6 ? (lg.rel || (lg.downI >= 0 ? 3 : 0)) : 0;
      F.eu = lg.t === 1 ? (lg.eu ? lg.eu[0] + lg.eu[1] + lg.eu[2] : lg.sa ? lg.sa[0] + lg.sa[1] : lg.cc || lg.afc || lg.caf || 0) : (lg.upI >= 0 ? lgUpN(li) : 0);
      F.up = lg.upI >= 0;
      if (F.eu >= n - F.rel - 1) F.eu = 0;
    }
  }
  var objs = (self && self.objs) || [];
  objs.forEach(function (o) { if (o.k === "pos" && o.v) F.objT = o.v; });
  F.run = prxRuns(st.h);
  var last = st.h.filter(function (e) { return e.b === st.n; });
  F.lastBlk = last;
  F.lastE = st.h[st.h.length - 1] || null;
  F.nextOpp = nextLgOpp(club);
  F.ex = prxExClubs();
  if (!mgr) {
    var p = S.p, apps = prxApps(st.h), a5 = apps.slice(-5);
    F.apps5 = a5.length;
    F.rt5 = a5.length ? round1(a5.reduce(function (s, e) { return s + (e.rt || 6.5); }, 0) / a5.length) : 0;
    F.g5 = a5.reduce(function (s, e) { return s + (e.g || 0); }, 0);
    F.gc5 = a5.reduce(function (s, e) { return s + (e.gt || 0); }, 0);
    var cs = 0, dr = 0, sc = 0, dS = 0, cS = 0;
    for (var j = apps.length - 1; j >= 0; j--) {
      var e = apps[j];
      if (!cS) { if (e.gt === 0 && e.m >= 60) cs++; else cS = 1; }
      if (!dS) { if (!e.g) dr++; else dS = 1; }
    }
    F.csRun = cs; F.drought = dr;
    var club4 = st.h.slice(-4);
    F.benchN = club4.filter(function (e) { return e.ro === "bench" || (e.m === 0 && e.ro !== "nc"); }).length;
    F.benchM = club4.length;
    var rr = null;
    for (var k = st.h.length - 1; k >= Math.max(0, st.h.length - 6); k--) if (st.h[k].red && st.h[k].b >= st.n - 1) { rr = st.h[k]; break; }
    F.red = rr;
    F.yc = p.ss ? p.ss.yc : 0;
    F.age = p.age; F.fame = p.fame;
    F.role = roleNow();
    F.debut = !!(p.flags.debut && !st.dd && (p.seasons.length <= 1));
    F.psv = p.ss && p.ss.psv || 0;
    F.psvNew = !!(st.psN);
  } else {
    var m = S.m, sq = m.sq.filter(function (q) { return !q.loanOut; });
    var star = sq.slice().sort(function (a, b) { return b.ovr - a.ovr; })[0];
    if (star && star.st && star.st.rn >= 4) { F.star = star; F.starRt = round1(star.st.rs / star.st.rn); }
    var top = sq.slice().sort(function (a, b) { return (b.st ? b.st.g : 0) - (a.st ? a.st.g : 0); })[0];
    if (top && top.st && top.st.g >= 6) F.top = top;
    F.reds = sq.reduce(function (s, q) { return s + (q.st ? q.st.rc : 0); }, 0);
    F.fit = sq.length ? Math.round(sq.reduce(function (s, q) { return s + q.fit; }, 0) / sq.length) : 80;
    F.board = Math.round(m.board); F.rot = m.rot;
  }
  F.aw = self && self.awards ? self.awards.length : 0;
  F.newAw = st.aw >= 0 && F.aw > st.aw ? self.awards[self.awards.length - 1] : null;
  return F;
}

/* ---------- mapeo de efectos genéricos → claves reales ---------- */
var PX_MAP = {mgr: {team: "sqMor", boss: "board", fans: "fans", img: "rep", chem: "chem", form: null},
  ply: {team: "mor", boss: "coach", fans: "fans", img: "fame", chem: null, form: "form"}};
function pxFx(g, mp) {
  var mm = PX_MAP[S.mode === "mgr" ? "mgr" : "ply"], o = {};
  Object.keys(g).forEach(function (k) {
    var kk = k === "press" ? "press" : mm[k], v = g[k];
    if (!kk || !v) return;
    if (k === "press" && v > 0 && mp >= 70) v = Math.round(v * 1.3);
    o[kk] = (o[kk] || 0) + v;
  });
  return o;
}
/* respuestas del banco: la presión se deduce de lo polémicas que son */
function bankPress(fx) {
  var neg = 0, mag = 0;
  Object.keys(fx || {}).forEach(function (k) { var v = fx[k]; if (typeof v !== "number") return; mag += Math.abs(v); if (v < 0) neg++; });
  if (neg >= 2) return Math.min(12, Math.round(5 + mag / 3));
  if (neg === 1) return clamp(Math.round(mag / 2 - 2), -3, 6);
  return -3;
}
function A(t, fx, st) { return {t: t, fx: fx, st: st}; }

/* ---------- generadores de preguntas con contexto ----------
   w(F) → peso (0 = no aplica) · b(F) → {q, tp, a:[4 × A()], top}. Grupos: tabla, racha, yo, rival, mote. */
var PX_TOP = {tabla: N_("Clasificación"), racha: N_("Racha"), yo: N_("Tu momento"), gk: N_("Portería"), rival: N_("El rival"), mote: N_("Tu mote"), vest: N_("Vestuario")};
var PX_GEN = [
  {id: "title", g: "tabla", w: function (F) {
    if (!F.pos || F.played < 5 || F.pos > 2 || F.n < 6) return 0;
    var other = F.tb[F.pos === 1 ? 1 : 0].r[6], gap = Math.abs(F.pts - other);
    return gap <= 7 ? 5 + (S.bi >= 3 ? 2 : 0) : 0;
  }, b: function (F) {
    var lead = F.pos === 1, rv = F.tb[lead ? 1 : 0], gap = Math.abs(F.pts - rv.r[6]), tp = {gap: pxU(gap, "pt"), rival: clubName(rv.c), left: pxU(F.left, "j")};
    var q = lead ? (gap ? N_("Líderes con {gap} de ventaja sobre el {rival} y {left} por delante. ¿Está la liga sentenciada?") : N_("Líderes, pero empatados a puntos con el {rival} y con {left} por delante. ¿Quién se lleva la liga?"))
      : (gap ? N_("Sois segundos, a {gap} del {rival}, con {left} por jugar. ¿Os veis campeones?") : N_("Empatados a puntos con el {rival} en lo más alto y con {left} por jugar. ¿Os veis campeones?"));
    return {q: q, tp: tp, a: lead ? [
      A(N_("Sentenciada no hay nada. El {rival} no va a regalar un punto y nosotros tampoco."), {team: 3, boss: 2, press: -3}, "dip"),
      A(N_("Si seguimos así, el título es nuestro. Que lo vaya asumiendo todo el mundo."), {fans: 5, team: 2, boss: -2, press: 10}, "agr"),
      A(N_("Yo solo miro el próximo partido. La calculadora os la dejo a vosotros."), {boss: 2, fans: -1, press: -5}, "eva"),
      A(N_("Que se preocupe el {rival}. Nosotros vamos a dormir tranquilos esta noche."), {fans: 3, img: 2, team: -1, press: 7}, "hum")
    ] : [
      A(N_("Claro que sí. Vamos a por ellos y no vamos a levantar el pie."), {fans: 4, team: 3, boss: -1, press: 8}, "agr"),
      A(N_("Primero hay que ganar nuestros partidos. Si ellos fallan, estaremos ahí."), {boss: 3, team: 1, press: -3}, "dip"),
      A(N_("La presión la tiene el {rival}. Nosotros no tenemos nada que perder."), {team: 2, fans: 2, press: 4}, "hum"),
      A(N_("Sinceramente, ellos tienen más plantilla. Pero soñar es gratis."), {boss: -2, fans: -2, team: -2, img: 1, press: -4}, "eva")
    ]};
  }},
  {id: "rel", g: "tabla", w: function (F) {
    if (!F.pos || !F.rel || F.played < 5) return 0;
    var firstRel = F.n - F.rel + 1, relPts = F.tb[firstRel - 1].r[6];
    if (F.pos >= firstRel) return 6;
    return F.pts - relPts <= 3 ? 4 : 0;
  }, b: function (F) {
    var firstRel = F.n - F.rel + 1, inZone = F.pos >= firstRel, safe = F.tb[firstRel - 2].r[6], relP = F.tb[firstRel - 1].r[6];
    var gap = inZone ? safe - F.pts : F.pts - relP, tp = {pos: F.pos, gap: pxU(gap, "pt"), left: pxU(F.left, "j")};
    var q = inZone ? (gap > 0 ? N_("Estáis {pos}º, en descenso y a {gap} de la salvación. ¿Temes por la categoría?") : N_("Estáis {pos}º, en descenso, aunque empatados con quien marca la salvación. ¿Temes por la categoría?"))
      : (gap > 0 ? N_("Solo {gap} os separan del descenso. ¿Os preocupa mirar hacia abajo?") : N_("Estáis justo por encima del descenso, empatados a puntos. ¿Os preocupa mirar hacia abajo?"));
    return {q: q, tp: tp, a: [
      A(N_("Miedo ninguno. Este equipo se va a salvar y lo vamos a hacer con margen."), {fans: 3, team: 3, boss: -1, press: 6}, "agr"),
      A(N_("La situación es delicada y no la voy a maquillar. Toca trabajar el doble."), {boss: 3, team: -1, fans: 1, press: -3}, "dip"),
      A(N_("Quedan {left} y mucho fútbol. Quien nos dé por muertos se equivoca."), {team: 2, fans: 2, press: 3}, "hum"),
      A(N_("Hay cosas que se están haciendo mal desde arriba, no solo en el campo."), {fans: 2, boss: -5, team: 1, press: 12}, "agr")
    ]};
  }},
  {id: "europe", g: "tabla", w: function (F) {
    if (!F.pos || !F.eu || F.played < 6 || F.pos <= 2) return 0;
    return Math.abs(F.pos - F.eu) <= 2 ? 4 : 0;
  }, b: function (F) {
    var inside = F.pos <= F.eu, ref = F.tb[inside ? F.eu : F.eu - 1], gap = Math.abs(F.pts - ref.r[6]), tp = {pos: F.pos, gap: pxU(gap, "pt"), rival: clubName(ref.c)};
    var q = F.up ? (inside ? N_("Estáis {pos}º, en puestos de ascenso, con {gap} de margen sobre el {rival}. ¿Firmáis subir ya?") : N_("Sois {pos}º, a {gap} del ascenso que ahora tiene el {rival}. ¿Llegaréis?"))
      : (inside ? N_("Estáis {pos}º, en puestos europeos, con {gap} de margen sobre el {rival}. ¿Es Europa el objetivo?") : N_("Sois {pos}º, a {gap} de los puestos europeos que marca el {rival}. ¿Llegaréis?"));
    return {q: q, tp: tp, a: [
      A(N_("Es el sueño de este vestuario y vamos a pelearlo hasta el final."), {fans: 4, team: 2, boss: 1, press: 6}, "agr"),
      A(N_("No nos ponemos techo, pero tampoco objetivos que no tocan."), {boss: 2, fans: -1, press: -4}, "dip"),
      A(N_("Ojalá. Esta afición se merece una alegría así."), {fans: 5, img: 1, press: 3}, "hum"),
      A(N_("Lo que diga la clasificación en mayo es lo único que cuenta."), {boss: 1, press: -2}, "eva")
    ]};
  }},
  {id: "obj", g: "tabla", w: function (F) {
    if (!F.pos || !F.objT || F.played < 6) return 0;
    return F.pos >= F.objT + 4 ? 5 : F.pos <= F.objT - 4 ? 3 : 0;
  }, b: function (F) {
    var tp = {pos: F.pos, t: F.objT};
    if (F.pos >= F.objT + 4) return {q: N_("El objetivo marcado era el puesto {t} y ahora mismo sois {pos}º. ¿Qué está fallando?"), tp: tp, a: [
      A(N_("Asumo mi parte. El objetivo sigue ahí y vamos a recortar."), {boss: 2, team: 2, press: -2}, "dip"),
      A(N_("Ese objetivo era irreal desde el principio. Estamos donde nos toca."), {boss: -5, fans: -2, img: 1, press: 9}, "agr"),
      A(N_("Queda temporada de sobra. Hablamos en mayo."), {boss: -1, press: -3}, "eva"),
      F.mgr ? A(N_("Que miren a quien hizo la plantilla, no a quien sale al campo."), {boss: -6, team: 3, press: 12}, "agr")
        : A(N_("Yo hago mi trabajo. Las preguntas tácticas, al banquillo."), {boss: -6, team: 1, fans: 1, press: 10}, "agr")
    ]};
    return {q: N_("Vais {pos}º cuando el objetivo era el puesto {t}. ¿Toca subir el listón?"), tp: tp, a: [
      A(N_("Sí. Quien se conforma, retrocede. Vamos a por más."), {fans: 4, team: 2, boss: -1, press: 7}, "agr"),
      A(N_("El objetivo no cambia. Cuando lo asegure, ya soñaremos."), {boss: 3, press: -4}, "dip"),
      A(N_("Disfrutemos el momento sin volvernos locos."), {team: 2, fans: 2, press: -1}, "hum"),
      A(N_("Ni lo sé ni me importa. Yo solo pienso en el domingo."), {fans: -1, press: -3}, "eva")
    ]};
  }},
  {id: "winrun", g: "racha", w: function (F) { return F.run.win >= 3 ? 3 + Math.min(3, F.run.win - 3) : 0; }, b: function (F) {
    return {q: N_("{n} victorias seguidas. ¿Cuál es el secreto de esta racha?"), tp: {n: F.run.win}, a: [
      A(N_("Trabajo y humildad. No hay más secreto."), {team: 2, boss: 2, press: -3}, "dip"),
      A(N_("Que ahora mismo somos mejores que nadie. Así de simple."), {fans: 4, img: 2, team: -1, press: 9}, "agr"),
      A(N_("No lo digáis muy alto, que en este vestuario somos muy supersticiosos."), {fans: 2, team: 2, press: -1}, "hum"),
      A(N_("Las rachas se acaban. Lo importante es mantener la cabeza fría."), {boss: 2, press: -2}, "eva")
    ]};
  }},
  {id: "lossrun", g: "racha", w: function (F) { return F.run.loss >= 3 ? 5 + Math.min(3, F.run.loss - 3) : 0; }, b: function (F) {
    return {q: N_("{n} derrotas seguidas. ¿Qué está fallando?"), tp: {n: F.run.loss}, a: [
      A(N_("Fallamos todos, empezando por mí. Toca dar la cara."), {team: 3, boss: 1, img: -1, press: -2}, "dip"),
      F.mgr ? A(N_("Hay jugadores que no están dando lo que se espera. Lo hablaremos dentro."), {team: -5, boss: 2, press: 10}, "agr")
        : A(N_("Hay compañeros que tienen que dar un paso adelante. Yo el primero, pero no el único."), {team: -4, fans: 1, boss: -1, press: 10}, "agr"),
      A(N_("Es fútbol: hoy perdemos, mañana ganamos. No hay que hacer un drama."), {fans: -3, press: 4}, "eva"),
      A(N_("Los árbitros tampoco nos están ayudando, que conste en acta."), {fans: 2, team: 1, img: -2, press: 8}, "agr")
    ]};
  }},
  {id: "winless", g: "racha", w: function (F) { return F.run.wl >= 4 && F.run.loss < 3 ? 4 : 0; }, b: function (F) {
    return {q: N_("{n} partidos sin ganar. ¿Está el equipo en crisis?"), tp: {n: F.run.wl}, a: [
      A(N_("Crisis es una palabra muy grande. Estamos a una victoria de cambiarlo todo."), {team: 2, boss: 1, press: -2}, "dip"),
      A(N_("Si esto es una crisis, la vamos a sacar entre todos. Nadie se esconde."), {team: 3, fans: 2, press: 2}, "dip"),
      A(N_("La crisis la vendéis vosotros. Dentro estamos más unidos que nunca."), {team: 2, fans: 1, img: -1, press: 9}, "agr"),
      A(N_("Pues habrá que ganar el domingo. Fácil de decir, ¿eh?"), {fans: 1, press: 1}, "hum")
    ]};
  }},
  {id: "unbeaten", g: "racha", w: function (F) { return F.run.unb >= 6 && F.run.win < 3 ? 3 : 0; }, b: function (F) {
    return {q: N_("{n} partidos sin perder. ¿Os sentís invencibles?"), tp: {n: F.run.unb}, a: [
      A(N_("Invencible no hay nadie. Somos un equipo difícil de batir y eso nos basta."), {boss: 2, team: 1, press: -3}, "dip"),
      A(N_("Quien quiera ganarnos, que venga preparado. Hoy no somos un rival cómodo."), {fans: 3, team: 2, press: 6}, "agr"),
      A(N_("Me falta convertir algunos empates en victorias. Ahí está la diferencia."), {boss: 3, team: -1, press: -1}, "dip"),
      A(N_("Invencibles no, pero cabezotas un rato."), {fans: 2, team: 2, press: 1}, "hum")
    ]};
  }},
  {id: "tcs", g: "racha", w: function (F) { return F.mgr && F.run.tcs >= 3 ? 4 : 0; }, b: function (F) {
    return {q: N_("{n} partidos seguidos sin encajar un gol. ¿Es la defensa la base de todo?"), tp: {n: F.run.tcs}, a: [
      A(N_("Defender bien es el primer paso para ganar. El orden no se negocia."), {boss: 3, chem: 2, press: -2}, "dip"),
      A(N_("Mérito del portero y de los de atrás, pero también de los de arriba, que presionan como nadie."), {team: 4, chem: 2, press: -1}, "dip"),
      A(N_("Que digan que somos aburridos. Nosotros sumamos y ellos opinan."), {boss: 2, fans: -2, press: 6}, "agr"),
      A(N_("No me fío. El cero se rompe cuando menos te lo esperas."), {team: 1, press: -3}, "eva")
    ]};
  }},
  {id: "blank", g: "racha", w: function (F) { return F.run.blank >= 3 ? 4 : 0; }, b: function (F) {
    return {q: N_("{n} partidos sin marcar. ¿Os preocupa la falta de gol?"), tp: {n: F.run.blank}, a: [
      A(N_("Generamos ocasiones. El gol llegará, estoy convencido."), {team: 2, press: -2}, "dip"),
      F.mgr ? A(N_("Necesitamos un delantero y así se lo he dicho al club."), {boss: -4, fans: 2, press: 9}, "agr")
        : A(N_("Si me llegan balones, yo los meto. Hasta ahora llegan pocos."), {team: -4, fans: 1, press: 9}, "agr"),
      A(N_("Esta semana, todos a rematar hasta que se haga de noche."), {boss: 2, team: 1, press: -3}, "dip"),
      A(N_("La portería sigue en el mismo sitio, eso os lo garantizo."), {fans: 1, press: 2}, "hum")
    ]};
  }},
  /* --- porteros --- */
  {id: "gkcs", g: "gk", w: function (F) { return F.gk && F.csRun >= 2 ? 5 + Math.min(3, F.csRun - 2) : 0; }, b: function (F) {
    return {q: N_("Llevas {n} partidos seguidos con la portería a cero. ¿Cuál es tu secreto?"), tp: {n: F.csRun}, a: [
      A(N_("Hablo sin parar con mis centrales. Si la defensa está bien colocada, yo apenas trabajo."), {team: 4, boss: 2, press: -2}, "dip"),
      A(N_("Estudio a cada delantero: cómo golpea, hacia dónde mira. Nada es casualidad."), {img: 2, boss: 2, form: 2, press: 2}, "dip"),
      A(N_("Que me tiren lo que quieran. Hoy por hoy, ahí atrás no entra nada."), {fans: 4, img: 2, team: -2, press: 9}, "agr"),
      A(N_("Llevo los mismos calcetines desde el primer cero. No pienso lavarlos."), {fans: 3, team: 1, press: 3}, "hum")
    ]};
  }},
  {id: "gkleak", g: "gk", w: function (F) { return F.gk && F.apps5 >= 3 && F.gc5 >= Math.max(7, F.apps5 * 2) ? 5 : 0; }, b: function (F) {
    return {q: N_("Has encajado {gc} en tus últimos {n} partidos. Se habla de inseguridad bajo palos. ¿Qué pasa?"), tp: {gc: pxU(F.gc5, "g"), n: F.apps5}, a: [
      A(N_("Soy el primero en asumirlo. Tengo que sacar paradas que ahora no saco."), {boss: 2, team: 2, img: -1, press: -3}, "dip"),
      A(N_("Los goles se encajan entre todos. Yo no juego solo ahí atrás."), {team: -4, img: 1, press: 8}, "agr"),
      A(N_("Estoy trabajando las salidas y los balones aéreos con el preparador. Se va a notar."), {boss: 3, form: 2, press: -2}, "dip"),
      A(N_("Un portero sin goles encajados sería un portero sin trabajo."), {fans: -1, team: 1, press: 3}, "hum")
    ]};
  }},
  {id: "gkform", g: "gk", w: function (F) { return F.gk && F.apps5 >= 3 && F.rt5 >= 7.2 ? 4 : 0; }, b: function (F) {
    return {q: N_("Tu nota media en los últimos {n} partidos es de {rt}. Se habla de paradones de selección. ¿Estás en tu mejor momento?"), tp: {n: F.apps5, rt: {rt: F.rt5}}, a: [
      A(N_("Las paradas importantes son las que no se ven: estar bien colocado antes del disparo."), {boss: 2, img: 2, press: -1}, "dip"),
      A(N_("Si el seleccionador no me llama ahora, no sé qué más tengo que hacer."), {img: 3, fans: 3, boss: -1, press: 10}, "agr"),
      A(N_("Mérito de los guantes nuevos. Que les suban el sueldo a ellos."), {fans: 3, press: 2}, "hum"),
      A(N_("Mi trabajo es que el equipo gane, no salir en los resúmenes."), {team: 3, boss: 1, press: -3}, "dip")
    ]};
  }},
  {id: "gkpens", g: "gk", w: function (F) { return F.gk && F.psv >= 1 && F.psvNew ? 5 : 0; }, b: function (F) {
    return {q: N_("Ya llevas {n} parados esta temporada. ¿Cuál es el truco con los penaltis?"), tp: {n: pxU(F.psv, "pen")}, a: [
      A(N_("Miro la cadera del lanzador hasta el último segundo. Y aguanto, aguanto…"), {img: 2, form: 1, press: 1}, "dip"),
      A(N_("Tenemos un dosier de cada lanzador. El mérito también es del preparador de porteros."), {team: 2, boss: 3, press: -2}, "dip"),
      A(N_("Ellos tienen toda la presión. Yo solo tengo que tirarme al lado bueno."), {fans: 3, img: 1, press: 4}, "agr"),
      A(N_("Si lo cuento, deja de funcionar."), {fans: 2, press: -1}, "hum")
    ]};
  }},
  {id: "gkline", g: "gk", w: function (F) { return F.gk && F.apps5 >= 2 ? 1.5 : 0; }, b: function (F) {
    if (prxState().n % 2) return {q: N_("Se critica que sales poco a por los balones aéreos. ¿Vas a cambiar?"), tp: {}, a: [
      A(N_("Si salgo, es para llegar. Prefiero no arriesgar a lo loco."), {boss: 1, fans: -1, press: -2}, "dip"),
      A(N_("Voy a ser más agresivo. El área pequeña es mía y se va a notar."), {fans: 3, form: 1, boss: -1, press: 5}, "agr"),
      A(N_("Lo trabajo cada día con el entrenador de porteros. Ya veréis la diferencia."), {boss: 3, press: -2}, "dip"),
      A(N_("Mis centrales cabecean mejor que yo. ¿Para qué voy a molestarlos?"), {team: 2, fans: 1, press: 3}, "hum")
    ]};
    return {q: N_("Desde la grada se te oye dar órdenes todo el partido. ¿Cuánto pesa la comunicación en tu juego?"), tp: {}, a: [
      A(N_("Es la mitad de mi trabajo. Un grito a tiempo vale más que una parada."), {team: 3, boss: 2, press: -1}, "dip"),
      A(N_("Si no hablo, me duermo. Y si me duermo, nos meten gol."), {fans: 2, press: 1}, "hum"),
      A(N_("Ahí atrás mando yo. El que no escuche, que se siente en el banquillo."), {team: -3, img: 2, press: 8}, "agr"),
      A(N_("Prefiero que hablen mis paradas."), {img: 1, press: -3}, "eva")
    ]};
  }},
  /* --- jugador de campo --- */
  {id: "drought", g: "yo", w: function (F) {
    if (F.mgr || F.gk) return 0;
    return (F.grp === "DEL" && F.drought >= 4) || (F.grp === "MED" && F.drought >= 7) ? 5 : 0;
  }, b: function (F) {
    return {q: N_("Llevas {n} partidos sin marcar. ¿Te pesa la sequía?"), tp: {n: F.drought}, a: [
      A(N_("Un delantero vive del gol y ahora no lo tengo. Toca trabajar más."), {boss: 2, team: 1, press: -2}, "dip"),
      A(N_("El gol volverá. Y cuando vuelva, no habrá quien me pare."), {fans: 3, img: 1, press: 6}, "agr"),
      A(N_("Si me llegaran más balones, otro gallo cantaría."), {team: -4, fans: 1, press: 10}, "agr"),
      A(N_("Me he cortado el pelo para cambiar la suerte. Ya me diréis."), {fans: 2, press: 2}, "hum")
    ]};
  }},
  {id: "scoring", g: "yo", w: function (F) { return !F.mgr && !F.gk && F.g5 >= 4 ? 5 : 0; }, b: function (F) {
    return {q: N_("{g} en tus últimos {n} partidos. ¿Es el mejor momento de tu carrera?"), tp: {g: pxU(F.g5, "g"), n: F.apps5}, a: [
      A(N_("Los goles son del equipo. Yo solo empujo lo que me ponen."), {team: 4, press: -2}, "dip"),
      A(N_("Estoy en racha y quiero más. Que se preparen los porteros."), {fans: 4, img: 2, team: -1, press: 8}, "agr"),
      A(N_("Mi madre dice que todavía no he marcado el bueno. Le haré caso."), {fans: 3, press: 1}, "hum"),
      A(N_("Lo mejor está por llegar. No me pongo límites."), {img: 2, form: 1, press: 3}, "agr")
    ]};
  }},
  {id: "form", g: "yo", w: function (F) {
    if (F.mgr || F.apps5 < 3) return 0;
    if (F.rt5 <= 6.1) return 4;
    return !F.gk && F.rt5 >= 7.4 ? 3 : 0;
  }, b: function (F) {
    var tp = {n: F.apps5, rt: {rt: F.rt5}};
    if (F.rt5 <= 6.1) return {q: N_("Tu nota media en los últimos {n} partidos es de {rt}. ¿Qué te está pasando?"), tp: tp, a: [
      A(N_("No estoy a mi nivel y lo sé. Voy a darle la vuelta con trabajo."), {boss: 3, team: 1, press: -3}, "dip"),
      A(N_("Las notas las ponéis vosotros. Yo sé lo que doy al equipo."), {img: -1, fans: -2, press: 8}, "agr"),
      A(N_("Arrastro unas molestias, pero no busco excusas."), {boss: 1, fans: 1, press: -1}, "eva"),
      A(N_("Estoy guardando lo mejor para cuando más se necesite."), {fans: 1, press: 3}, "hum")
    ]};
    return {q: N_("Tu nota media en los últimos {n} partidos es de {rt}. ¿Estás en tu mejor momento?"), tp: tp, a: [
      A(N_("Me siento bien, pero esto va de constancia. Quiero mantenerlo."), {boss: 2, form: 2, press: -2}, "dip"),
      A(N_("Sí, y no pienso bajar el ritmo. Quiero más minutos y más responsabilidad."), {img: 2, fans: 2, boss: -2, press: 7}, "agr"),
      A(N_("Duermo nueve horas y como como un niño. Es el secreto."), {fans: 3, press: 1}, "hum"),
      A(N_("Todo es mérito del cuerpo técnico, que me ha dado confianza."), {boss: 4, team: 1, press: -2}, "dip")
    ]};
  }},
  {id: "red", g: "yo", w: function (F) { return F.red ? 5 : 0; }, b: function (F) {
    return {q: N_("Te expulsaron ante el {opp}. ¿Fue justa la roja?"), tp: {opp: clubName(F.red.o)}, a: [
      A(N_("Fue roja. Pido perdón a mis compañeros: los dejé con diez."), {team: 3, boss: 2, fans: -1, press: -3}, "dip"),
      A(N_("Ni de broma. El árbitro tenía la tarjeta en la mano antes de la jugada."), {fans: 3, img: -2, press: 10}, "agr"),
      A(N_("La he visto diez veces y sigo sin saber qué pitó."), {fans: 1, press: 4}, "hum"),
      A(N_("No voy a hablar del árbitro. No quiero otra sanción."), {boss: 1, press: -2}, "eva")
    ]};
  }},
  {id: "yellows", g: "yo", w: function (F) { return !F.mgr && F.yc >= 4 && F.yc % 5 === 4 ? 3 : 0; }, b: function (F) {
    return {q: N_("Llevas {n} amarillas esta temporada y estás a una de la sanción. ¿Vas a levantar el pie?"), tp: {n: F.yc}, a: [
      A(N_("Jugaré igual. Si tengo que cortar una contra, la corto."), {fans: 2, team: 1, boss: -1, press: 5}, "agr"),
      A(N_("Tendré cuidado. El equipo me necesita en el campo, no en la grada."), {boss: 3, press: -2}, "dip"),
      A(N_("Mi madre me ha quitado el móvil hasta que deje de ver tarjetas."), {fans: 2, press: 1}, "hum"),
      A(N_("Eso se lo tendréis que preguntar a los árbitros."), {img: -1, press: 4}, "eva")
    ]};
  }},
  {id: "debut", g: "yo", w: function (F) { return F.debut ? 7 : 0; }, b: function (F) {
    return {q: N_("Debutas con {age} años en el {club}. ¿Cómo lo has vivido?"), tp: {age: F.age, club: F.clubN}, a: [
      A(N_("Es el sueño de toda mi vida. Se lo dedico a mi familia."), {fans: 4, img: 2, press: 2}, "dip"),
      A(N_("Ahora empieza lo difícil: quedarme. No me conformo con un día."), {boss: 3, form: 2, press: 2}, "dip"),
      A(N_("Me temblaban las piernas en el túnel, pero luego ya solo veía el balón."), {fans: 3, team: 2, press: 1}, "hum"),
      A(N_("Vengo a quedarme y a ser importante aquí, cuanto antes."), {img: 2, fans: 2, team: -2, press: 8}, "agr")
    ]};
  }},
  {id: "bench", g: "yo", w: function (F) { return !F.mgr && F.benchM >= 3 && F.benchN >= 2 && (F.role === "Estrella" || F.role === "Titular") ? 4 : 0; }, b: function (F) {
    return {q: N_("No has jugado en {n} de los últimos {m} partidos. ¿Hay algún problema con el míster?"), tp: {n: F.benchN, m: F.benchM}, a: [
      A(N_("Ninguno. El míster decide y yo entreno para que lo tenga difícil."), {boss: 4, team: 1, press: -3}, "dip"),
      A(N_("No lo entiendo, y él lo sabe. Hablaremos en privado."), {boss: -4, fans: 2, press: 9}, "agr"),
      A(N_("Problema ninguno. Ya me he leído todos los libros del banquillo."), {fans: 2, boss: -1, press: 3}, "hum"),
      A(N_("Eso es cosa del entrenador. Yo no voy a decir nada."), {press: -2}, "eva")
    ]};
  }},
  {id: "award", g: "yo", w: function (F) { return F.newAw ? 6 : 0; }, b: function (F) {
    return {q: N_("Te acaban de dar el premio «{award}». ¿A quién se lo dedicas?"), tp: {award: awardName(F.newAw)}, a: [
      A(N_("A mis compañeros. Sin ellos, este premio no existe."), {team: 4, press: -2}, "dip"),
      A(N_("A mí mismo, que también me lo he currado."), {img: 2, team: -3, fans: 1, press: 8}, "agr"),
      A(N_("A la afición, que no ha dejado de empujar en ningún momento."), {fans: 5, press: 1}, "dip"),
      A(N_("A mi madre, que sigue diciéndome que estudie por si acaso."), {fans: 3, team: 1, press: 2}, "hum")
    ]};
  }},
  /* --- míster --- */
  {id: "star", g: "vest", w: function (F) { return F.mgr && F.star && F.starRt <= 6.3 ? 4 : F.mgr && F.top ? 3 : 0; }, b: function (F) {
    if (F.star && F.starRt <= 6.3) return {q: N_("{player} está lejos de su nivel: {rt} de nota media. ¿Le vas a sentar?"), tp: {player: plShort(F.star), rt: {rt: F.starRt}}, a: [
      A(N_("Es nuestro mejor jugador y lo va a demostrar. Tiene toda mi confianza."), {team: 2, boss: -1, press: 3}, "dip"),
      A(N_("Aquí juega el que mejor está. Nadie tiene el puesto asegurado."), {team: -2, boss: 2, press: 7}, "agr"),
      A(N_("Le he pedido más en privado. En público, lo defiendo siempre."), {team: 3, chem: 1, press: -2}, "dip"),
      A(N_("Ya hablará él en el campo. Yo no voy a añadir nada."), {press: -2}, "eva")
    ]};
    return {q: N_("{player} ya lleva {g} esta temporada. ¿Es el mejor delantero de la liga?"), tp: {player: plShort(F.top), g: pxU(F.top.st.g, "g")}, a: [
      A(N_("Para mí, sin duda. Y lo mejor es que todavía puede crecer."), {team: 3, fans: 3, press: 5}, "agr"),
      A(N_("Sus goles son mérito de todo el equipo. Él lo sabe mejor que nadie."), {chem: 3, team: 1, press: -2}, "dip"),
      A(N_("No está en venta, por si alguien pregunta."), {fans: 4, boss: -1, press: 6}, "hum"),
      A(N_("Que siga así y que no lea los periódicos."), {press: -3}, "eva")
    ]};
  }},
  {id: "discip", g: "vest", w: function (F) { return F.mgr && F.reds >= 3 ? 3 : 0; }, b: function (F) {
    return {q: N_("Tu equipo suma {n} expulsiones esta temporada. ¿Hay un problema de disciplina?"), tp: {n: F.reds}, a: [
      A(N_("Lo hemos hablado. A partir de ahora, quien proteste de más, paga multa."), {boss: 3, team: -2, chem: 1, press: -2}, "dip"),
      A(N_("Somos un equipo intenso. Prefiero pasarme que quedarme corto."), {fans: 2, boss: -2, press: 6}, "agr"),
      A(N_("Algunas rojas no se las cree ni el árbitro que las sacó."), {fans: 2, img: -2, press: 9}, "agr"),
      A(N_("Vamos a trabajar la cabeza tanto como las piernas."), {chem: 2, press: -3}, "dip")
    ]};
  }},
  {id: "rotate", g: "vest", w: function (F) { return F.mgr && ((F.rot === 2 && F.run.wl >= 2) || (F.rot === 0 && F.fit < 72)) ? 3 : 0; }, b: function (F) {
    if (F.rot === 2) return {q: N_("Has rotado mucho y el equipo lleva {n} partidos sin ganar. ¿Te arrepientes?"), tp: {n: F.run.wl}, a: [
      A(N_("No. La temporada es larga y necesito a todos frescos."), {boss: -1, team: 2, press: 3}, "agr"),
      A(N_("Quizá me he pasado. Daré más continuidad al once."), {boss: 2, team: -1, press: -2}, "dip"),
      A(N_("Si no roto, en marzo me pedís explicaciones por las lesiones."), {fans: 1, press: 4}, "hum"),
      A(N_("Las rotaciones no fallan los goles. Los fallamos todos."), {team: 1, press: -1}, "eva")
    ]};
    return {q: N_("Siempre juegan los mismos y el físico de la plantilla está al {fit}. ¿No temes un bajón?"), tp: {fit: {pc: F.fit}}, a: [
      A(N_("El once que gana no se toca. Ya descansarán en verano."), {fans: 2, team: -2, press: 5}, "agr"),
      A(N_("Tienes razón: daremos minutos a los que menos juegan."), {team: 3, boss: 1, press: -2}, "dip"),
      A(N_("Aquí nadie se cansa. Es la ventaja de tener un preparador físico que da miedo."), {fans: 1, press: 2}, "hum"),
      A(N_("Lo controlamos con datos. No es una decisión a ciegas."), {boss: 2, press: -3}, "eva")
    ]};
  }},
  {id: "board", g: "vest", w: function (F) { return F.mgr && F.board < 35 ? 5 : 0; }, b: function (F) {
    return {q: N_("La confianza de la directiva está bajo mínimos y ya suenan nombres para tu banquillo. ¿Te sientes cuestionado?"), tp: {}, a: [
      A(N_("Me siento con fuerzas. Los resultados van a cambiar y el tiempo me dará la razón."), {team: 2, boss: 2, press: -2}, "dip"),
      A(N_("Que hablen. Si me quieren echar, que lo hagan a la cara."), {fans: 3, boss: -5, press: 12}, "agr"),
      A(N_("Llevo la maleta hecha desde el primer día. Es lo que tiene este oficio."), {fans: 2, press: 4}, "hum"),
      A(N_("Yo solo pienso en el próximo entrenamiento."), {boss: 1, press: -3}, "eva")
    ]};
  }},
  /* --- rival y entorno --- */
  {id: "derby", g: "rival", w: function (F) {
    if (F.club < 0) return 0;
    if (F.nextOpp >= 0 && W.derby[F.club + "-" + F.nextOpp]) return 6;
    return F.lastBlk.some(function (e) { return e.d; }) ? 5 : 0;
  }, b: function (F) {
    if (F.nextOpp >= 0 && W.derby[F.club + "-" + F.nextOpp]) return {pre: 1, q: N_("Se acerca el derbi contra el {opp}. ¿Qué mensaje le mandas a su afición?"), tp: {opp: clubName(F.nextOpp)}, a: [
      A(N_("Respeto máximo. Es un gran rival y se lo vamos a demostrar en el campo."), {boss: 2, img: 1, press: -3}, "dip"),
      A(N_("Que vayan preparando los pañuelos. Este derbi es nuestro."), {fans: 6, team: 2, boss: -2, press: 12}, "agr"),
      A(N_("A los nuestros les pido que llenen el estadio. Los necesitamos."), {fans: 4, team: 1, press: 2}, "dip"),
      A(N_("¿Derbi? Para mí son tres puntos como otros cualquiera."), {fans: -3, boss: 1, press: 2}, "eva")
    ]};
    var d = F.lastBlk.filter(function (e) { return e.d; }).pop(), tp = {opp: clubName(d.o), gu: d.gu, gt: d.gt};
    if (d.r === "W") return {q: N_("Habéis ganado el derbi ante el {opp} ({gu}-{gt}). ¿Cómo se celebra algo así?"), tp: tp, a: [
      A(N_("Con humildad. Mañana ya pensamos en el siguiente."), {boss: 2, press: -3}, "dip"),
      A(N_("Por todo lo alto. La ciudad vuelve a ser nuestra."), {fans: 6, img: 1, boss: -1, press: 9}, "agr"),
      A(N_("Esta noche nadie de mi familia me pide nada. Hoy mando yo en casa."), {fans: 3, press: 2}, "hum"),
      A(N_("Se lo dedico a la afición. Ellos lo viven más que nadie."), {fans: 5, team: 1, press: 1}, "dip")
    ]};
    return {q: N_("{gu}-{gt} en el derbi ante el {opp}. ¿Cómo se le explica eso a la afición?"), tp: tp, a: [
      A(N_("No hay explicación que valga. Solo pedir perdón y darlo todo en el próximo."), {fans: 3, team: 1, press: -2}, "dip"),
      A(N_("Ellos no fueron mejores. Nos pitaron todo en contra."), {fans: 2, img: -2, press: 10}, "agr"),
      A(N_("Duele, y tiene que doler. Al que no le duela, que se lo haga mirar."), {fans: 4, team: -2, press: 6}, "agr"),
      A(N_("Ya lo hablaremos dentro."), {press: -1, fans: -2}, "eva")
    ]};
  }},
  {id: "exclub", g: "rival", w: function (F) {
    if (F.nextOpp >= 0 && F.ex[F.nextOpp]) return 6;
    return F.lastE && F.lastE.b === F.bn && F.ex[F.lastE.o] ? 4 : 0;
  }, b: function (F) {
    var nx = F.nextOpp >= 0 && F.ex[F.nextOpp], opp = nx ? F.nextOpp : F.lastE.o, tp = {opp: clubName(opp)};
    if (nx) return {pre: 1, q: F.mgr ? N_("Te mides al {opp}, uno de tus antiguos clubes. ¿Es un partido especial?") : N_("El próximo rival es el {opp}, tu antiguo club. ¿Celebrarías un gol contra ellos?"), tp: tp, a: [
      F.mgr ? A(N_("Especial, sí. Les tengo cariño, pero el domingo quiero ganar."), {fans: 1, img: 3, press: -2}, "dip") : A(N_("No lo celebraría. Respeto mucho a esa afición."), {fans: -1, img: 3, press: -3}, "dip"),
      A(N_("Ni especial ni nada. Ahora me debo a esta camiseta."), {fans: 4, img: -1, press: 6}, "agr"),
      A(N_("Allí me trataron muy bien… y aquí me tratan todavía mejor."), {fans: 3, press: 1}, "hum"),
      A(N_("Me fui por algo. El domingo lo verán."), {fans: 3, img: -2, team: 1, press: 10}, "agr")
    ]};
    return {q: N_("Acabas de enfrentarte al {opp}, tu antiguo club. ¿Qué has sentido?"), tp: tp, a: [
      A(N_("Mucho cariño. Saludar a la gente de allí ha sido emocionante."), {img: 3, fans: -1, press: -2}, "dip"),
      A(N_("Nada especial. Un rival más."), {fans: 2, img: -1, press: 3}, "eva"),
      A(N_("Que quizá alguno de allí se arrepiente de dejarme ir."), {fans: 3, img: -2, press: 9}, "agr"),
      A(N_("He ido al vestuario equivocado del puro hábito."), {fans: 2, press: 2}, "hum")
    ]};
  }},
  {id: "budget", g: "rival", w: function (F) {
    if (F.nextOpp < 0 || F.club < 0) return 0;
    var r = mBudgetFor(F.nextOpp) / Math.max(1, mBudgetFor(F.club));
    return r >= 2.5 || r <= 0.4 ? 3 : 0;
  }, b: function (F) {
    var r = mBudgetFor(F.nextOpp) / Math.max(1, mBudgetFor(F.club)), tp = {opp: clubName(F.nextOpp), x: Math.round(r >= 1 ? r : 1 / r)};
    if (r >= 1) return {pre: 1, q: N_("El {opp} maneja un presupuesto {x} veces mayor que el vuestro. ¿David contra Goliat?"), tp: tp, a: [
      A(N_("El dinero no juega. Once contra once, cualquiera puede ganar."), {team: 3, fans: 2, press: 4}, "agr"),
      A(N_("Son favoritos, sin duda. Nosotros intentaremos ponérselo difícil."), {boss: 2, fans: -1, press: -3}, "dip"),
      A(N_("Con lo que cuesta su banquillo nos pagamos la temporada entera. Y ojo, que nos sobra ilusión."), {fans: 3, team: 2, press: 3}, "hum"),
      A(N_("Que se preocupen ellos: tienen mucho más que perder."), {fans: 2, img: 1, press: 6}, "agr")
    ]};
    return {pre: 1, q: N_("Vuestro presupuesto es {x} veces el del {opp}. ¿Estáis obligados a ganar?"), tp: tp, a: [
      A(N_("Obligados no; responsables, sí. Hay que demostrarlo en el campo."), {boss: 2, team: 1, press: -2}, "dip"),
      A(N_("Si no ganamos ese partido, que me lo reprochen a mí."), {boss: 2, fans: 2, press: 6}, "agr"),
      A(N_("El presupuesto no marca goles. Ojalá fuera tan fácil."), {fans: -1, press: 2}, "eva"),
      A(N_("Ningún partido es fácil. Ellos querrán dar la sorpresa."), {team: 2, press: -3}, "dip")
    ]};
  }},
  {id: "final", g: "rival", w: function (F) { return F.lastBlk.some(function (e) { return e.f; }) ? 6 : 0; }, b: function (F) {
    var f = F.lastBlk.filter(function (e) { return e.f; }).pop(), tp = {opp: clubName(f.o)};
    if (f.r === "W") return {q: N_("Campeones tras ganar la final al {opp}. ¿Qué significa este título?"), tp: tp, a: [
      A(N_("Es de todos: jugadores, cuerpo técnico, afición. Yo solo he puesto un granito."), {team: 3, fans: 3, press: -2}, "dip"),
      A(N_("Que esto solo es el principio. Vamos a por todo."), {fans: 4, img: 2, boss: 1, press: 7}, "agr"),
      A(N_("Que esta noche no me esperen en casa temprano."), {fans: 3, team: 2, press: 2}, "hum"),
      A(N_("Lo disfruto hoy y mañana a trabajar. Así se ganan los siguientes."), {boss: 3, press: -3}, "dip")
    ]};
    return {q: N_("Habéis perdido la final ante el {opp}. ¿Cómo se levanta uno de esto?"), tp: tp, a: [
      A(N_("Con la cabeza alta. Llegar hasta aquí ya dice mucho de este grupo."), {team: 3, fans: 1, press: -2}, "dip"),
      A(N_("Nos han robado la final y todo el mundo lo ha visto."), {fans: 3, img: -3, press: 12}, "agr"),
      A(N_("Volveremos. Y la próxima vez, la ganaremos."), {fans: 4, team: 2, press: 3}, "agr"),
      A(N_("Hoy no es día de hablar. Lo siento."), {fans: -2, press: 2}, "eva")
    ]};
  }},
  /* --- el mote --- */
  {id: "nick", g: "mote", w: function (F) {
    var o = prxSelf(), st = prxState();
    if (!o || !o.nick) return 0;
    return st.nq === nickKey(o.nick) ? 0 : 4;
  }, b: function (F) {
    var o = prxSelf(), bad = o.nick.m < 0, tp = {nick: {nk: 1}};
    prxState().nq = nickKey(o.nick);
    if (bad) return {q: N_("En redes te han bautizado como «{nick}». ¿Te duele?"), tp: tp, a: [
      A(N_("Me lo he ganado con mi rendimiento. Me toca a mí cambiarlo."), {boss: 2, fans: 2, press: -3}, "dip"),
      A(N_("Los que lo dicen no han tocado un balón en su vida."), {fans: -3, img: -1, press: 10}, "agr"),
      A(N_("Me he hecho una camiseta con el mote. Hay que saber reírse de uno mismo."), {fans: 4, team: 1, press: -1}, "hum"),
      A(N_("No leo las redes. Ni pienso empezar ahora."), {press: -2}, "eva")
    ]};
    return {q: N_("La grada ya te llama «{nick}». ¿Te gusta el mote?"), tp: tp, a: [
      A(N_("Me encanta. Intentaré estar a la altura cada domingo."), {fans: 4, img: 1, press: 1}, "dip"),
      A(N_("Me lo he ganado. Y todavía no habéis visto nada."), {fans: 3, img: 2, team: -1, press: 7}, "agr"),
      A(N_("Mi familia ya me llama así en casa. Estoy perdido."), {fans: 3, team: 1, press: 1}, "hum"),
      A(N_("Prefiero que me recuerden por mi nombre y por lo que gane."), {boss: 1, fans: -1, press: -2}, "eva")
    ]};
  }}
];
var PX_BY_ID = {};
PX_GEN.forEach(function (g) { PX_BY_ID[g.id] = g; });

/* candidatos ordenados por peso, uno por grupo como mucho */
function pxCandidates(F) {
  var list = [];
  PX_GEN.forEach(function (g) {
    var w = 0;
    try { w = g.w(F) || 0; } catch (e) { w = 0; }
    if (w > 0) list.push({g: g, w: w, s: w + R() * 1.5});
  });
  list.sort(function (a, b) { return b.s - a.s; });
  var seen = {}, out = [];
  list.forEach(function (c) { if (seen[c.g.g]) return; seen[c.g.g] = 1; out.push(c); });
  return out;
}
function pxBuild(F, c) {
  var st = prxState(), r = c.g.b(F);
  if (!r) return null;
  var mp = F.mp, a = r.a.map(function (x) { return {t: x.t, fx: pxFx(x.fx, mp), st: x.st}; });
  shuffle(a);
  var id = "c" + (st.cid = (st.cid || 0) + 1);
  st.cq[id] = {id: id, q: r.q, tp: r.tp || {}, a: a, top: PX_TOP[c.g.g], gen: c.g.id};
  return {id: id, pre: !!r.pre};
}
/* pregunta normalizada (contextual o del banco) */
function pxQ(mgr, id) {
  var st = S && S.prx;
  if (st && st.cq && st.cq[id]) return st.cq[id];
  var pool = typeof PRESS !== "undefined" ? (mgr ? PRESS.mgr : PRESS.ply) : [];
  for (var i = 0; i < pool.length; i++) if (pool[i].id === id) {
    var q = pool[i];
    return {id: id, q: q.q, tp: {}, bank: 1, a: q.a.map(function (a) { var fx = Object.assign({}, a.fx || {}); fx.press = bankPress(a.fx); return {t: a.t, fx: fx, ref: a.ref || null, st: fx.press >= 6 ? "agr" : fx.press <= -3 ? "dip" : "eva"}; })};
  }
  return null;
}
function prxPruneCq() {
  var st = prxState(), keep = {};
  (S.pend || []).forEach(function (x) { if (x.q) keep[x.q] = 1; (x.qs || []).forEach(function (id) { keep[id] = 1; }); });
  Object.keys(st.cq).forEach(function (k) { if (!keep[k]) delete st.cq[k]; });
}

/* ---------- motivos (hitos) y frecuencia ---------- */
function prxWhy(F) {
  var why = [];
  if (!F.mgr && F.debut) why.push("debut");
  if (F.newAw) why.push("award");
  if (F.lastBlk.some(function (e) { return e.f; })) why.push("final");
  if (F.club >= 0 && ((F.nextOpp >= 0 && W.derby[F.club + "-" + F.nextOpp]) || F.lastBlk.some(function (e) { return e.d; }))) why.push("derby");
  if ((F.nextOpp >= 0 && F.ex[F.nextOpp])) why.push("former");
  var r = F.run;
  if (r.win >= 4 || r.loss >= 3 || r.unb >= 8 || r.wl >= 5 || (F.gk && F.csRun >= 3) || (!F.mgr && !F.gk && (F.g5 >= 4 || (F.grp === "DEL" && F.drought >= 5)))) why.push("streak");
  if (!F.mgr && F.gk && F.psvNew) why.push("streak");
  if (S.bi >= 3 && F.pos && F.played >= 8) {
    var other = F.tb[F.pos === 1 ? 1 : 0].r[6];
    if (F.pos <= 2 && Math.abs(F.pts - other) <= 4) why.push("decisive");
    else if (F.rel && F.pos >= F.n - F.rel - 1) why.push("decisive");
  }
  if (!F.mgr && F.red) why.push("red");
  return why;
}
var PX_WHY_TXT = {
  debut: N_("Tras tu debut, los periodistas quieren conocerte."),
  award: N_("Con el premio recién recibido, la prensa te reclama."),
  final: N_("La final todavía da que hablar y la sala está a rebosar."),
  derby: N_("Semana de derbi: la sala de prensa está llena."),
  former: N_("Partido especial a la vista: te mides a tu antiguo club."),
  streak: N_("Tu racha no pasa desapercibida: todos quieren preguntarte."),
  decisive: N_("Se juega mucho en las próximas jornadas y nadie quiere perderse tus palabras."),
  red: N_("La expulsión sigue dando que hablar.")
};
/* sustituye a maybePress: hitos en modo jugador, ritmo profesional en modo míster */
maybePress = function () {
  if (typeof PRESS === "undefined" || !S || S.pend.some(function (x) { return x.k === "ppress" || x.k === "mpress" || x.k === "ppq" || x.k === "mpq"; })) return;
  var mgr = S.mode === "mgr";
  if (mgr ? S.m.club < 0 : S.p.club < 0) return;
  var st = prxState(), F = prxFacts(), ctx = pressCtx(), why = prxWhy(F), ev = S.set && S.set.ev != null ? S.set.ev : 1;
  var mpF = 1 + (F.mp - 45) / 150, pr;
  if (mgr) {
    var hot = ctx.filter(function (c) { return c !== "win" && c !== "draw" && c !== "loss"; }).length + why.length;
    pr = [0.42, 0.62, 0.78][ev] * mpF + (hot ? 0.12 : 0);
    if (st.lp === st.n - 1 && !hot) pr *= 0.7;
  } else {
    if (!why.length) pr = 0.02;
    else {
      pr = [0.45, 0.62, 0.78][ev] * mpF + (why.indexOf("debut") >= 0 || why.indexOf("award") >= 0 ? 0.25 : 0);
      if (st.lp === st.n - 1) pr *= 0.35;
      if (S.p.fame < 12 && why.indexOf("debut") < 0) pr *= 0.6;
    }
  }
  if (!chance(clamp(pr, 0, 0.95))) return;
  prxMakePress(F, ctx, why);
};
function prxMakePress(F, ctx, why) {
  var mgr = S.mode === "mgr", st = prxState();
  prxPruneCq();
  var cands = pxCandidates(F), strong = cands.filter(function (c) { return c.w >= 3; }).length;
  var nC = strong >= 3 && chance(0.55) ? 3 : Math.min(2, cands.length);
  var made = [], pre = false;
  for (var i = 0; i < cands.length && made.length < nC; i++) { var b = pxBuild(F, cands[i]); if (b) { made.push(b.id); if (b.pre) pre = true; } }
  var qs = made.slice(0, 3);
  if (qs.length < 3) { var bank = pressPick(mgr, ctx.concat(["any"])); for (var j = 0; qs.length < 3 && j < bank.length; j++) qs.push(bank[j]); }
  if (qs.length < 3) return;
  var x = {k: mgr ? "mpress" : "ppress", ctx: ctx, qs: qs, tp: pressParams(), s: ri(1, 999999999), why: why.slice(0, 2), pre: pre ? 1 : 0};
  if (pre && F.nextOpp >= 0) x.tp.nopp = clubName(F.nextOpp);
  if (why.indexOf("debut") >= 0) st.dd = 1;
  st.lp = st.n;
  st.psN = 0;
  S.pend.push(x);
  prxPruneCq();
}
/* los motivos hacen visible al jugador: crece algo la presión aunque no haya rueda de prensa */
function prxIntro(x) {
  var mgr = x.k === "mpress", tp = x.tp || {}, t = "";
  if (x.why && x.why.length && PX_WHY_TXT[x.why[0]]) t = tr(PX_WHY_TXT[x.why[0]]);
  else if (mgr && x.pre && tp.nopp) t = tr("Previa del partido ante el {opp}: la sala de prensa espera.", {opp: tp.nopp});
  else if (mgr && tp.opp && tp.opp !== tr("rival")) t = tr("Rueda de prensa tras el partido ante el {opp}.", {opp: tp.opp});
  else t = pressCtxText(x.ctx || []);
  var nk = nickName(prxSelf());
  if (nk) t += " " + tr("Los periodistas esperan a «{nick}».", {nick: nk});
  var lv = mpLevel(mpGet());
  if (lv >= 2) t += " " + tr("La presión mediática está por las nubes.");
  return t;
}

/* ---------- descripción y resolución (sustituyen a las de engine-extra.js) ---------- */
pressAskOpts = function (x, mgr) {
  return [
    {t: tr("Ir a la rueda de prensa"), d: tr("Tres preguntas. Verás el efecto de cada respuesta antes de elegir."), ok: {txt: tr("Te sientas ante los micrófonos."), fx: {}}},
    {t: tr("No ir"), d: tr("La afición y el vestuario lo notarán, y la prensa hablará de tu silencio."), ok: {txt: tr("Mandas a un portavoz. A la afición no le gusta nada."), fx: mgr ? {fans: -4, sqMor: -2, press: 6} : {fans: -4, mor: -3, press: 6}}}
  ];
};
pressQ = function (mgr, id) { return pxQ(mgr, id); };
pressAskDesc = function (x) {
  var mgr = x.k === "mpress";
  return {scene: "press", tag: "real", tagTxt: tr("Rueda de prensa"), cls: "", cat: x.pre ? tr("Previa") : tr("Prensa"), title: tr("¿Vas a la rueda de prensa?"), text: prxIntro(x) + " " + tr("Si vas, te harán tres preguntas."),
    mp: mpGet(), opts: pressAskOpts(x, mgr).map(function (o) { return descOpt(o, function (u) { return mgr ? mgrPreview(u, null) : fxPreview(u.fx, u.n); }); })};
};
function pxOpts(x, q) {
  var tp = pxTp(q.tp, x.tp);
  return q.a.map(function (a) { return {t: tr(a.t, tp), ref: a.ref ? tr(a.ref) : null, st: a.st, ok: {txt: tr("«{answer}»", {answer: tr(a.t, tp)}), fx: a.fx}}; });
}
pressQDesc = function (x) {
  var mgr = x.k === "mpq", q = pxQ(mgr, x.q);
  if (!q) return null;
  var tp = pxTp(q.tp, x.tp);
  return {scene: "press", sceneQ: x, tag: "hot", tagTxt: tr("Rueda de prensa"), cls: "hotc", cat: tr("Pregunta {n} de 3", {n: x.n}), title: tr(q.q, tp),
    text: q.bank ? tr("Todas las cámaras te enfocan. ¿Qué respondes?") : tr("Pregunta con datos en la mano. ¿Qué respondes?"), mp: mpGet(), top: q.top ? tr(q.top) : null, ctxq: !q.bank,
    opts: pxOpts(x, q).map(function (o) { var d = descOpt(o, function (u) { return mgr ? mgrFxPreview(u.fx, null) : fxPreview(u.fx); }); d.st = o.st; return d; })};
};
function pxApply(fx, mgr) {
  var f = Object.assign({}, fx || {}), pv = f.press || 0;
  delete f.press;
  var chips = mgr ? mgrFx(f) : applyFx(f), dp = mpAdd(pv);
  if (dp) chips.push(["press", dp]);
  return chips;
}
pressResolve = function (x, choice) {
  var mgr = x.k === "mpress" || x.k === "mpq", chips = [], card, st = prxState();
  if (x.k === "ppress" || x.k === "mpress") {
    var o = pressAskOpts(x, mgr)[choice];
    if (!o) return null;
    S.pend.shift();
    if (choice === 0) {
      var items = x.qs.map(function (id, i) { return {k: mgr ? "mpq" : "ppq", q: id, n: i + 1, tp: x.tp, s: ri(1, 999999999), ui: mgr}; });
      S.pend = items.concat(S.pend);
      return null;
    }
    chips = pxApply(o.ok.fx, mgr);
    card = {t: "decision", tipo: mgr ? "mgr" : "real", cat: tr("Prensa"), title: tr("Rueda de prensa"), choice: o.t, txt: o.ok.txt, chips: chips, y: S.yr};
    socPostRaw({by: "press", tk: N_("{name} no se presenta en la sala de prensa. Silencio que dice mucho. 🎙️❌"), tp: {name: socSelfName()}});
    prxPruneCq();
    if (mgr) feed(card);
    return card;
  }
  var q = pxQ(mgr, x.q), a = q && q.a[choice];
  if (!a) return null;
  S.pend.shift();
  var tp = pxTp(q.tp, x.tp);
  chips = pxApply(a.fx, mgr);
  if (a.st && st.at[a.st] != null) st.at[a.st]++;
  card = {t: "decision", tipo: mgr ? "mgr" : "real", cat: tr("Rueda de prensa"), title: tr(q.q, tp), choice: tr(a.t, tp), txt: a.ref ? tr(a.ref) : "", chips: chips, y: S.yr};
  var hot = (a.fx.press || 0) >= 8;
  if (hot && chance(0.6)) socPostRaw({by: chance(0.5) ? "press" : "hater", tk: pick(PX_SOC_HOT), tp: {name: socSelfName(), quote: a.t, quoteTp: tp}, mood: -1});
  else if (x.n === 3 || chance(0.5)) { var spb = chance(0.5) ? "press" : "fan", spt = pick(SOCIAL_T.press || [{t: N_("«{quote}»")}]); socPostRaw({by: socAcc(spt.by) ? spt.by : spb, tk: spt.t, tp: {name: socSelfName(), club: socBase().club, quote: a.t, quoteTp: tp}, mood: 0}); }
  if (st.cq[x.q]) delete st.cq[x.q];
  if (mgr) feed(card);
  return card;
};
var PX_SOC_HOT = [N_("«{quote}». {name} ha incendiado la sala de prensa. Mañana, portadas 🔥📰"), N_("Lo de {name} en rueda de prensa no tiene nombre: «{quote}» 😳"),
  N_("Titular servido: «{quote}» ({name}). La tertulia de esta noche ya tiene tema 🎙️🍿")];
if (typeof EX_PEND !== "undefined") {
  EX_PEND.ppress = {desc: function (x) { return pressAskDesc(x); }, resolve: function (x, c) { return pressResolve(x, c); }};
  EX_PEND.ppq = {desc: function (x) { return pressQDesc(x); }, resolve: function (x, c) { return pressResolve(x, c); }};
}
if (typeof MPH !== "undefined" && MPH.mpq) {
  MPH.mpress.head = function (x) { var d = pressAskDesc(x); return {scene: "press", tag: d.tag, tagTxt: d.tagTxt, cls: d.cls, cat: d.cat, title: d.title, text: d.text, mp: d.mp}; };
  MPH.mpq.head = function (x) { var d = pressQDesc(x); return {scene: "press", sceneQ: x, tag: d.tag, tagTxt: d.tagTxt, cls: d.cls, cat: d.cat, title: d.title, text: d.text, mp: d.mp, top: d.top, ctxq: d.ctxq}; };
  MPH.mpq.opts = function (x) { var q = pxQ(true, x.q); return q ? pxOpts(x, q) : []; };
  MPH.mpq.apply = function (x, o) { var q = pxQ(true, x.q), i = q ? pxOpts(x, q).map(function (z) { return z.t; }).indexOf(o.t) : -1; S.pend.unshift(x); pressResolve(x, i); return []; };
}

/* ---------- cada tramo: presión que baja sola, motes, memes de portero ---------- */
function prxBlockTick(played) {
  var o = prxSelf(), mgr = S.mode === "mgr", st = prxState();
  if (!o) return;
  var F = prxFacts(), r = F.run, base = mgr ? 12 + (S.m.rep || 0) * 0.25 : 8 + (S.p.fame || 0) * 0.3;
  var mp = mpGet(o), d = (base - mp) * 0.3;
  if (played) {
    if (r.loss >= 3) d += 6; else if (r.wl >= 4) d += 3;
    if (r.win >= 4) d += 3;
    if (F.lastBlk.some(function (e) { return e.d; })) d += 3;
    if (F.lastBlk.some(function (e) { return e.gt - e.gu >= 3; })) d += 4;
    if (!mgr && F.red) d += 5;
  }
  mpAdd(Math.round(d), o);
  if (st.aw < 0) st.aw = F.aw;
  /* presión muy alta: algo más de ruido en redes y un pequeño desgaste */
  if (played && mpGet(o) >= 70) {
    if (chance(0.55)) { var hp = pick(PX_SOC_HEAT); socPostRaw({by: hp.by, tk: hp.t, tp: {name: socSelfName()}, mood: hp.m}); }
    if (chance(0.5)) { if (mgr) S.m.board = clamp(S.m.board - 1, 0, 100); else S.p.mor = clamp(S.p.mor - 1, 0, 100); }
  }
  if (played && !mgr && F.gk) prxGkSocial(F);
  if (played) { try { prxNickTick(F); } catch (e) {} }
  if (played && mgr) { try { prxSquadNicks(); } catch (e2) {} }
  st.aw = F.aw;
}
var PX_SOC_HEAT = [
  {by: "press", m: 0, t: N_("La lupa sobre {name}: cada palabra suya abre tertulias. La presión mediática está al máximo 🔥🎙️")},
  {by: "hater", m: -1, t: N_("Ya está bien de {name}. Mucho titular y poco fútbol 🙄")},
  {by: "fan", m: 1, t: N_("Dejad trabajar a {name}, que la prensa no para de buscar polémica 😤")},
  {by: "meme", m: 0, t: N_("Los periodistas esperando a {name} a la salida del entrenamiento: 📸📸📸📸📸")}
];
var GK_SOC = {
  cs: [{by: "meme", t: N_("{name} lleva {n} partidos seguidos sin encajar. Han puesto un candado y han tirado la llave 🔒🧤"), m: 1},
    {by: "fan", t: N_("Con {name} bajo palos dormimos tranquilos. {n} porterías a cero seguidas 🧤💤"), m: 1},
    {by: "stats", t: N_("📊 {name}: {n} partidos consecutivos con la portería a cero."), m: 0}],
  leak: [{by: "hater", t: N_("{n} goles encajados ante el {opp}. ¿{name} juega con guantes o con manoplas de cocina? 🧈"), m: -1},
    {by: "meme", t: N_("La defensa del {club} y {name} ante el {opp}: 👋⚽👋⚽👋⚽"), m: -1},
    {by: "fan", t: N_("{name}, levanta la cabeza. Un mal día lo tiene cualquiera ({n} encajados ante el {opp}) 💪"), m: 1}],
  star: [{by: "fan", t: N_("Paradón tras paradón: {name} firma un {rt} ante el {opp}. ¡Qué portero tenemos! 🧱"), m: 1},
    {by: "meme", t: N_("Los delanteros del {opp} intentando marcarle a {name}: 🚪🔒🧱"), m: 1},
    {by: "stats", t: N_("📊 {name} firmó un {rt} ante el {opp}. Actuación de muro."), m: 0}],
  pen: [{by: "meme", t: N_("{name} adivina el lado OTRA VEZ. Que alguien compruebe si tiene poderes 🔮🧤"), m: 1},
    {by: "fan", t: N_("¡Penalti parado por {name}! Tenemos un gato bajo palos 🐈🧤"), m: 1}]
};
function prxGkSocial(F) {
  var st = prxState(), nm = socSelfName(), club = F.clubN, posts = 0;
  var put = function (k, tp) { if (posts >= 2) return; var t = pick(GK_SOC[k]); socPostRaw({by: t.by, tk: t.t, tp: Object.assign({name: nm, club: club}, tp), mood: t.m}); posts++; };
  if (st.psN) put("pen", {});
  if (F.csRun >= 3 && chance(0.7)) put("cs", {n: F.csRun});
  F.lastBlk.forEach(function (e) {
    if (!(e.m > 0)) return;
    if (e.gt >= 4 && chance(0.6)) put("leak", {n: e.gt, opp: clubName(e.o)});
    else if (e.rt >= 8.3 && chance(0.5)) put("star", {rt: fmtDec(e.rt, 1), opp: clubName(e.o)});
  });
}
/* paradas de penalti y paradas clave del portero (momentos y tandas) */
(function () {
  if (typeof resolvePendingPlayer !== "function") return;
  var _r = resolvePendingPlayer;
  resolvePendingPlayer = function (choice) {
    var x = S && S.pend && S.pend[0], gk = S && S.mode !== "mgr" && S.p && isGK();
    var card = _r.apply(this, arguments);
    try {
      if (gk && x && card && card.good && (x.k === "so" || (x.k === "moment" && /penal/i.test(String(x.id))))) {
        S.p.ss.psv = (S.p.ss.psv || 0) + 1; var st = prxState(); st.psN = (st.psN || 0) + 1;
      }
    } catch (e) {}
    return card;
  };
})();

/* ---------- historial: engancharse antes de las ruedas de prensa y del cierre de temporada ---------- */
(function () {
  if (typeof queueBetween === "function") { var _qb = queueBetween; queueBetween = function () { try { prxAbsorb(); } catch (e) {} return _qb.apply(this, arguments); }; }
  if (typeof mgrQueueBetween === "function") { var _mqb = mgrQueueBetween; mgrQueueBetween = function () { try { prxAbsorb(); } catch (e) {} return _mqb.apply(this, arguments); }; }
  if (typeof seasonEnd === "function") { var _se = seasonEnd; seasonEnd = function () { try { prxAbsorb(); } catch (e) {} return _se.apply(this, arguments); }; }
  if (typeof mgrSeasonEnd === "function") { var _mse = mgrSeasonEnd; mgrSeasonEnd = function () { try { prxAbsorb(); } catch (e) {} return _mse.apply(this, arguments); }; }
})();

/* ============ MOTES DINÁMICOS ============
   Catálogo por grupos (m = 1 positivo, −1 negativo) + sufijos combinables + plantillas con nombre ({ln}, {fn}, {club}).
   El mote se guarda como plantilla: {tk, tp, sf?, m, g, y, b} y se traduce al mostrarse (las versiones en femenino
   salen de las tablas de lang-fem.js). Ampliable: basta con añadir textos a NK[grupo].l. */
var NK_SF = {
  pos: [N_("{x} de {club}"), N_("{x} de Hierro"), N_("{x} de Oro"), N_("{x} del Área")],
  neg: [N_("{x} de Cristal"), N_("{x} de Papel"), N_("{x} de {club}")],
  dt: [N_("{x} del Banquillo"), N_("{x} de {club}"), N_("{x} de Oro")]
};
var NK = {
  gk: {m: 1, sf: "pos", l: [N_("El Gato"), N_("La Muralla"), N_("El Pulpo"), N_("Manos de Seda"), N_("El Candado"), N_("San {ln}"), N_("El Felino"), N_("La Pared"), N_("El Ángel de la Guarda"),
    N_("La Araña"), N_("El Halcón"), N_("Manos de Tenaza"), N_("El Cerrojo"), N_("{ln} el Invencible"), N_("El Muro de {club}"), N_("El Guardián"), N_("El Imbatible")]},
  gkbad: {m: -1, sf: "neg", l: [N_("El Coladero"), N_("Manos de Mantequilla"), N_("El Colador"), N_("El Flan"), N_("Manos de Trapo"), N_("La Puerta Giratoria"), N_("{ln} Mantequilla"), N_("El Recogepelotas"), N_("La Gelatina")]},
  def: {m: 1, sf: "pos", l: [N_("El Muro"), N_("El Káiser"), N_("El Sheriff"), N_("La Roca"), N_("El Jefe"), N_("El Mariscal"), N_("El Comandante"), N_("La Aduana"), N_("El Faro"), N_("El Tanque"), N_("El Búfalo"), N_("El General {ln}")]},
  defbad: {m: -1, sf: "neg", l: [N_("El Cono"), N_("El Despiste"), N_("El Semáforo en Verde"), N_("El Pasillo"), N_("El Botones")]},
  mid: {m: 1, sf: "pos", l: [N_("El Arquitecto"), N_("El Profesor"), N_("El Metrónomo"), N_("El Cerebro"), N_("El Director de Orquesta"), N_("El Reloj"), N_("La Brújula"), N_("El Pulmón"), N_("El GPS"), N_("El Motor"), N_("El Maestro {ln}")]},
  midbad: {m: -1, sf: "neg", l: [N_("El Fantasma"), N_("El Desaparecido"), N_("El Turista"), N_("El Paseante"), N_("El Holograma")]},
  att: {m: 1, sf: "pos", l: [N_("El Killer"), N_("El Pistolero"), N_("El Matador"), N_("El Depredador"), N_("El Goleador"), N_("El Verdugo"), N_("El Tiburón"), N_("El Martillo"), N_("Míster Gol"),
    N_("{ln}gol"), N_("El Rey del Área"), N_("El Cazador"), N_("El Lobo"), N_("La Cobra")]},
  attbad: {m: -1, sf: "neg", l: [N_("Pólvora Mojada"), N_("Señor Poste"), N_("El Desaparecido"), N_("El Fallón"), N_("El Larguero"), N_("Mira Torcida"), N_("El Sin Gol")]},
  fast: {m: 1, sf: "pos", l: [N_("El Rayo"), N_("El Correcaminos"), N_("La Bala"), N_("El Guepardo"), N_("El Expreso"), N_("La Moto"), N_("El Cohete"), N_("La Gacela")]},
  skill: {m: 1, sf: "pos", l: [N_("El Mago"), N_("El Bailarín"), N_("El Ilusionista"), N_("El Malabarista"), N_("El Duende"), N_("Pies de Seda")]},
  shot: {m: 1, sf: "pos", l: [N_("El Cañonero"), N_("El Francotirador"), N_("El Misil"), N_("El Bazuca"), N_("Pierna de Dinamita")]},
  young: {m: 1, sf: "", l: [N_("El Niño"), N_("El Niño Maravilla"), N_("La Perla de {club}"), N_("El Chaval"), N_("La Joya"), N_("El Prodigio")]},
  vet: {m: 1, sf: "", l: [N_("El Eterno"), N_("El Abuelo"), N_("El Sabio"), N_("El Inoxidable"), N_("Matusalén"), N_("El Capitán Eterno")]},
  hard: {m: -1, sf: "", l: [N_("El Carnicero"), N_("El Leñero"), N_("El Tarjetitas"), N_("El Pitbull"), N_("El Guerrero")]},
  loud: {m: -1, sf: "", l: [N_("El Bocazas"), N_("El Provocador"), N_("El Incendiario"), N_("El Showman"), N_("Boca de Trueno")]},
  calm: {m: 1, sf: "", l: [N_("El Diplomático"), N_("El Caballero"), N_("El Señor"), N_("El Monje"), N_("Don Tranquilo")]},
  joker: {m: 1, sf: "", l: [N_("El Cómico"), N_("El Bromista"), N_("El Showman"), N_("El Risas")]},
  mute: {m: 0, sf: "", l: [N_("La Esfinge"), N_("El Mudo"), N_("El Silencioso"), N_("El Hermético")]},
  star: {m: 1, sf: "", l: [N_("El Rey de {club}"), N_("El Elegido"), N_("El Fenómeno"), N_("El Crack"), N_("Su Majestad"), N_("El Emperador"), N_("San {ln}"), N_("{fn} el Grande")]},
  dt: {m: 1, sf: "dt", l: [N_("El Profe"), N_("El Sabio"), N_("El Ingeniero"), N_("El Comandante"), N_("El Filósofo"), N_("El Alquimista"), N_("El Sargento"), N_("El Estratega"), N_("Míster {ln}"), N_("Don {ln}")]},
  dttac: {m: 1, sf: "dt", l: [N_("El Ajedrecista"), N_("El Pizarras"), N_("El Científico"), N_("El Arquitecto"), N_("El Ingeniero"), N_("El Profesor {ln}")]},
  dtdef: {m: 0, sf: "dt", l: [N_("El Cerrojo"), N_("El Autobusero"), N_("El Candado"), N_("El Muro"), N_("Catenaccio {ln}")]},
  dtatt: {m: 1, sf: "dt", l: [N_("El Kamikaze"), N_("El Loco"), N_("El Romántico"), N_("El Valiente"), N_("El Profeta del Gol")]},
  dtwin: {m: 1, sf: "dt", l: [N_("El Rey Midas"), N_("El Emperador"), N_("El Mago"), N_("El Ganador"), N_("Míster Títulos"), N_("San {ln}")]},
  dtyouth: {m: 1, sf: "dt", l: [N_("El Jardinero"), N_("El Padre de la Cantera"), N_("El Pastor"), N_("El Profe de la Cantera")]},
  dtbad: {m: -1, sf: "", l: [N_("El Interino"), N_("El Funambulista"), N_("Silla Eléctrica"), N_("El Desahuciado"), N_("El Equilibrista"), N_("El Último Tren")]},
  dtloud: {m: -1, sf: "", l: [N_("El Polémico"), N_("El Bocazas"), N_("El Incendiario"), N_("El Provocador")]},
  dtcalm: {m: 1, sf: "", l: [N_("El Caballero"), N_("El Diplomático"), N_("El Señor del Banquillo"), N_("El Monje")]}
};
function nickKey(nk) { return nk ? String(nk.tk) + "|" + (nk.sf || "") : ""; }
function nkRender(nk) {
  if (!nk || !nk.tk) return "";
  var tp = nk.tp || {}, base = tr(nk.tk, tp);
  return nk.sf ? tr(nk.sf, Object.assign({}, tp, {x: base})) : base;
}
nickName = function (o) { return o && o.nick ? nkRender(o.nick) : ""; };
/* genera un mote para {fn, ln, club} a partir de grupos con peso; evita repetir el actual */
function nkGen(who, groups, salt, cur) {
  var keys = Object.keys(groups).filter(function (k) { return NK[k] && groups[k] > 0; });
  if (!keys.length) return null;
  var tot = 0; keys.forEach(function (k) { tot += groups[k]; });
  var hv = hashStr((who.fn || "") + "|" + who.ln + "|" + salt), r = (hv % 1000) / 1000 * tot, g = keys[0];
  for (var i = 0; i < keys.length; i++) { r -= groups[keys[i]]; if (r < 0) { g = keys[i]; break; } }
  var G = NK[g], list = G.l.filter(function (t) { return !cur || t !== cur.tk; });
  if (!list.length) list = G.l;
  var tk = list[(hv >>> 7) % list.length], sf = null;
  if (G.sf && !/\{(ln|fn|club)\}/.test(tk) && ((hv >>> 13) % 100) < 30) { var sl = NK_SF[G.sf]; sf = sl[(hv >>> 17) % sl.length]; }
  if (sf && /\{club\}/.test(sf) && !who.club) sf = null;
  return {tk: tk, tp: {ln: who.ln, fn: who.fn || "", club: who.club || ""}, sf: sf, m: G.m, g: g, y: S.yr + 1};
}
/* grupos según el perfil del jugador o del míster */
function nkGroupsPlayer(mood) {
  var p = S.p, grp = posGroup(), at = attrs(), g = {}, st = prxState();
  var base = {POR: "gk", DEF: "def", MED: "mid", DEL: "att"}[grp] || "mid";
  if (mood < 0) { g[base + "bad"] = 4; if ((p.ss && p.ss.rc >= 2)) g.hard = 1; if (st.at.agr >= 4) g.loud = 1; return g; }
  g[base] = 4;
  var top = null, tv = -1;
  ["RIT", "REG", "TIR"].forEach(function (k) { if (at[k] != null && at[k] > tv) { tv = at[k]; top = k; } });
  if (top && tv >= p.ovr + 4) g[{RIT: "fast", REG: "skill", TIR: "shot"}[top]] = 3;
  if (p.age <= 20) g.young = 2;
  if (p.age >= 33) g.vet = 3;
  if (p.fame >= 70 || p.trophies.length >= 4) g.star = 2;
  if (p.ss && p.ss.rc >= 2) g.hard = 1;
  var A0 = st.at, n = A0.agr + A0.dip + A0.hum + A0.eva;
  if (n >= 6) { if (A0.agr / n >= 0.45) g.loud = 2; else if (A0.dip / n >= 0.5) g.calm = 1.5; else if (A0.hum / n >= 0.35) g.joker = 1.5; else if (A0.eva / n >= 0.4) g.mute = 1.5; }
  if (mood > 0) { delete g.loud; delete g.hard; delete g.mute; }
  return g;
}
function nkGroupsMgr(mood) {
  var m = S.m, g = {}, st = prxState();
  if (mood < 0) { g.dtbad = 4; if (st.at.agr >= 4) g.dtloud = 1; return g; }
  g.dt = 3;
  if (m.ment === "bus" || m.ment === 0) g.dtdef = 3;
  if (m.ment === 2 || m.ment === "press") g.dtatt = 3;
  if (m.trophies.length >= 2) g.dtwin = 3;
  if (m.focus === "cantera" || m.focus === "tecnica") g.dtyouth = 2;
  if (m.chem >= 70 || m.focus === "tactica") g.dttac = 2;
  var A0 = st.at, n = A0.agr + A0.dip + A0.hum + A0.eva;
  if (n >= 6) { if (A0.agr / n >= 0.45) g.dtloud = 2; else if (A0.dip / n >= 0.5) g.dtcalm = 2; }
  if (mood > 0) delete g.dtloud;
  return g;
}
var NK_SOC_POS = [N_("Ya es oficial: para la grada, {name} es «{nick}» 🔥"), N_("Nuevo mote desbloqueado: {name} pasa a ser «{nick}» 👑"), N_("La grada ya lo canta: «¡{nick}, {nick}!» 🎶 ({name})")];
var NK_SOC_NEG = [N_("Lo siento, pero desde hoy {name} es «{nick}» para todo el mundo 😂"), N_("Las redes no perdonan: a {name} ya le llaman «{nick}» 🙃"), N_("Mote nuevo y no es bonito: «{nick}». {name}, toca reaccionar 😬")];
function nkSet(o, nk, why) {
  if (!o || !nk) return;
  var st = prxState(), first = !o.nick;
  nk.b = st.n;
  if (o.nick && o.nick.tk) { (o.nickH = o.nickH || []).push({tk: o.nick.tk, sf: o.nick.sf || null, tp: o.nick.tp, y: o.nick.y}); if (o.nickH.length > 5) o.nickH = o.nickH.slice(-5); }
  o.nick = nk;
  var name = (o.fn ? o.fn + " " : "") + o.ln, txt = nkRender(nk);
  if (S.mode !== "mgr" && o === S.p) {
    milestone(nk.m < 0 ? tr("La grada te cuelga un mote: «{nick}»", {nick: txt}) : first ? tr("La afición te bautiza: «{nick}»", {nick: txt}) : tr("Nuevo mote de la afición: «{nick}»", {nick: txt}));
  }
  if (typeof notify === "function") notify(nk.m < 0 ? tr("Te han puesto un mote que escuece: «{nick}»", {nick: txt}) : tr("La grada te llama ahora «{nick}»", {nick: txt}), nk.m < 0 ? "amber" : "good");
  socPostRaw({by: "meme", tk: pick(nk.m < 0 ? NK_SOC_NEG : NK_SOC_POS), tp: {name: name, nick: txt}, mood: nk.m < 0 ? -1 : 1});
  if (nk.m < 0) mpAdd(4, o);
}
/* entre tramos: rachas que hacen nacer (o cambiar) un mote */
function prxNickTick(F) {
  var o = prxSelf(), st = prxState(), cur = o.nick, mood = 0;
  if (cur && cur.b != null && st.n - cur.b < 2) return;
  if (!F.mgr) {
    var p = S.p, fame = p.fame || 0;
    if (F.gk) { if (F.csRun >= 4) mood = 1; else if (F.apps5 >= 3 && F.gc5 >= Math.max(9, F.apps5 * 2.4)) mood = -1; }
    else if (F.grp === "DEL" || F.grp === "MED") { if (F.g5 >= 5) mood = 1; else if (F.grp === "DEL" && F.drought >= 7) mood = -1; }
    if (!mood && F.apps5 >= 4 && F.rt5 <= 5.9) mood = -1;
    if (!mood && F.apps5 >= 4 && F.rt5 >= 7.8) mood = 1;
    if (!mood) return;
    if (mood > 0 && fame < 15 && !(F.gk && F.csRun >= 5)) return;
    if (mood < 0 && fame < 10) return;
    if (cur && cur.m === mood && chance(0.7)) return;
    if (cur && cur.m > 0 && mood < 0 && !chance(0.5)) return;
    nkSet(p, nkGen({fn: p.fn, ln: p.ln, club: clubName(p.club)}, nkGroupsPlayer(mood), S.yr + ":" + st.n, cur), "run");
  } else {
    var m = S.m;
    if (F.run.loss >= 4 || m.board < 25) mood = -1;
    else if (F.run.win >= 5) mood = 1;
    if (!mood) return;
    if (cur && cur.m === mood && chance(0.75)) return;
    var gr = mood > 0 ? {dtwin: 3, dt: 1} : nkGroupsMgr(-1);
    nkSet(m, nkGen({fn: m.fn, ln: m.ln, club: clubName(m.club)}, gr, S.yr + ":" + st.n, cur), "run");
  }
}
/* final de temporada: primer mote para los que destacan; los veteranos y los redimidos cambian */
maybeNickPlayer = function () {
  var p = S.p;
  if (!p.seasons.length) return;
  var row = p.seasons[p.seasons.length - 1], cur = p.nick;
  var star = p.fame >= 32 || row.g >= 15 || (row.cs >= 15 && isGK()) || (row.rt >= 7.3 && row.apps >= 20) || p.seasons.length >= 5;
  var who = {fn: p.fn, ln: p.ln, club: clubName(row.club != null ? row.club : p.club)};
  if (!cur) { if (star) nkSet(p, nkGen(who, nkGroupsPlayer(0), "s" + S.yr, null), "season"); return; }
  if (cur.m < 0 && row.rt >= 7 && row.apps >= 15) { nkSet(p, nkGen(who, nkGroupsPlayer(1), "r" + S.yr, cur), "redeem"); return; }
  if (p.age >= 33 && cur.g !== "vet" && chance(0.35)) { nkSet(p, nkGen(who, {vet: 1}, "v" + S.yr, cur), "vet"); return; }
  if (cur.y && S.yr + 1 - cur.y >= 4 && star && chance(0.2)) nkSet(p, nkGen(who, nkGroupsPlayer(1), "e" + S.yr, cur), "evolve");
};
maybeNickMgr = function () {
  var m = S.m;
  if (!m.seasons || !m.seasons.length) return;
  var cur = m.nick, who = {fn: m.fn, ln: m.ln, club: m.club >= 0 ? clubName(m.club) : ""};
  if (!cur) { if (m.rep >= 45 || m.trophies.length || m.seasons.length >= 4) nkSet(m, nkGen(who, nkGroupsMgr(0), "s" + S.yr, null), "season"); return; }
  var row = m.seasons[m.seasons.length - 1];
  if (cur.m < 0 && row && row.tro && row.tro.length) { nkSet(m, nkGen(who, {dtwin: 3, dt: 1}, "r" + S.yr, cur), "redeem"); return; }
  if (cur.y && S.yr + 1 - cur.y >= 4 && chance(0.25)) nkSet(m, nkGen(who, nkGroupsMgr(1), "e" + S.yr, cur), "evolve");
};
/* míster: motes para las figuras de la plantilla (aparecen en el directo) */
function prxSquadNicks() {
  var m = S.m, sq = m.sq.filter(function (p) { return !p.loanOut; }), have = sq.filter(function (p) { return p.nk; }).length;
  if (have >= 3) return;
  var cand = null;
  sq.forEach(function (p) {
    if (p.nk || !p.st) return;
    var grp = W.pos[p.pos].g, sc = grp === "POR" ? (p.st.cs >= 7 ? p.st.cs : 0) : (p.st.g >= 8 ? p.st.g : 0);
    if (sc && (!cand || sc > cand.sc)) cand = {p: p, sc: sc, grp: grp};
  });
  if (!cand || !chance(0.5)) return;
  var p = cand.p, g = {}; g[{POR: "gk", DEF: "def", MED: "mid", DEL: "att"}[cand.grp] || "att"] = 1;
  p.nk = nkGen({fn: p.fn, ln: p.ln, club: clubName(m.club)}, g, "q" + S.yr + p.id, null);
  socPostRaw({by: "fan", tk: pick(NK_SOC_POS), tp: {name: plName(p), nick: nkRender(p.nk)}, mood: 1});
}

/* ---------- directo (míster): el comentarista usa los motes de vez en cuando ---------- */
var LNK_GOAL = [N_("¡«{nick}» no perdona! {s} vuelve a marcar."), N_("La grada lo corea: «¡{nick}, {nick}!». Gol de {s}.")];
var LNK_SAVE = [N_("«{nick}» lo vuelve a hacer: ¡qué parada de {k}!"), N_("Por algo le llaman «{nick}»: {k} lo saca todo.")];
var LNK_MGR = [N_("La grada corea el nombre de «{nick}» hacia el banquillo."), N_("Las cámaras enfocan a «{nick}», que da instrucciones sin parar desde la banda.")];
(function () {
  if (typeof liveStep !== "function") return;
  var _ls = liveStep;
  liveStep = function () {
    var out = _ls.apply(this, arguments);
    try { prxLiveNick(out); } catch (e) {}
    return out;
  };
})();
function prxLiveNick(out) {
  var L = S.live;
  if (!L || !out || !out.length || S.mode !== "mgr") return;
  for (var i = out.length - 1; i >= 0; i--) {
    var ev = out[i];
    if (ev.t === "goal" && ev.us && ev.pid != null) {
      var p = mPl(ev.pid);
      if (p && p.nk && chance(0.45)) out.splice(i + 1, 0, {t: "com", us: 1, txt: tr(pick(LNK_GOAL), {nick: nkRender(p.nk), s: plShort(p)})});
    } else if (ev.t === "save" && !ev.us) {
      var gk = null;
      L.xi.forEach(function (id) { var q = mPl(id); if (q && q.pos === "POR") gk = q; });
      if (gk && gk.nk && chance(0.3)) out.splice(i + 1, 0, {t: "com", us: 1, txt: tr(pick(LNK_SAVE), {nick: nkRender(gk.nk), k: plShort(gk)})});
    }
  }
  if (S.m.nick && !L.nkS && L.min >= 20 && L.min <= 75 && chance(0.03)) { L.nkS = 1; out.push({t: "com", us: 1, txt: tr(pick(LNK_MGR), {nick: nickName(S.m)})}); }
}
