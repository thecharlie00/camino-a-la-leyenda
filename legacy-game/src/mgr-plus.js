/* mgr-plus.js — PARCHE 2.5 · MÍSTER+ (motor)
   1) Ojeadores con estrellas, presupuesto de viaje y región; informes reales y cobertura de todas las posiciones.
   2) Cláusulas visibles y renegociables al renovar; cesiones (de salida y de entrada) con opción u obligación de compra.
   3) Filial: objetivos de formación que abren la puerta del primer equipo.
   4) Selecciones: ofertas (compaginar o en exclusiva), convocatoria y partidos narrados.
   5) Charlas rápidas de vestuario.  6) Partido en directo en todos los ritmos.
   Todo el estado nuevo vive en S.m.xp y se crea al usarlo (las partidas antiguas cargan igual). */

function mpOn() { return !!(S && S.mode === "mgr" && S.m); }
function mpX() { var m = S.m; if (!m.xp) m.xp = {}; return m.xp; }
function mpNow() { return S.yr * 10 + (S.bi || 0); }
function mpRound(v, step) { return Math.round(v / step) * step; }
function mpErr(e) { if (typeof console !== "undefined") console.error(e); }

/* ============ 6) PARTIDO EN DIRECTO EN TODOS LOS RITMOS ============ */
/* activado por defecto en los tres ritmos: siempre decides si ves el partido o lo simulas (se puede quitar en el menú) */
function mpAlwaysLive() { return mpOn() && !(S.m.xp && S.m.xp.live === 0); }
function mpSetAlwaysLive(on) { if (!mpOn()) return; mpX().live = on ? 1 : 0; }
(function () {
  var _lw = liveWanted;
  liveWanted = function (f) {
    if (_lw.apply(this, arguments)) return true;
    return mpAlwaysLive() && !!S.cur && !S.cur.noLive && !f.isNat && !S.noLiveAuto;
  };
})();

/* ============ 1) OJEADORES ============ */
var MP_SC_SAL = [0, 60000, 140000, 300000, 550000, 900000];
var MP_SC_ERR = [0, 7, 5, 3.5, 2, 1];
var MP_SC_TRIP = [0, 90000, 240000];
var MP_SC_MAX = 4;
var MP_CONF_N = {UEFA: N_("Europa"), CONMEBOL: N_("Sudamérica"), CONCACAF: N_("Norteamérica y Caribe"), AFC: N_("Asia"), CAF: N_("África"), OFC: N_("Oceanía")};
/* los sueldos crecen con el tamaño del club */
function mpScale() { var m = S.m; return m.club >= 0 ? clamp(Math.sqrt(Math.max(0.05, mBudgetFor(m.club) / 2e7)), 0.35, 2.2) : 1; }
function mpScSal(st) { return Math.max(20000, mpRound(MP_SC_SAL[st] * mpScale(), 10000)); }
function mpScTrip(lv) { return mpRound(MP_SC_TRIP[lv] * mpScale(), 10000); }
function mpSc() { var x = mpX(); if (!x.sc) x.sc = {l: [], nid: 1}; return x.sc; }
function mpScById(id) { var l = mpSc().l; for (var i = 0; i < l.length; i++) if (l[i].id === +id) return l[i]; return null; }
/* candidatos para contratar: se renuevan cada tramo */
function mpScCands() {
  var sc = mpSc(), m = S.m;
  if (sc.cand && sc.cy === mpNow()) return sc.cand;
  var ci = m.club >= 0 ? W.clubs[m.club].ci : m.nat, out = [];
  [[1, 2], [2, 3], [3, 4], [4, 5]].forEach(function (r) {
    var st = ri(r[0], r[1]), ni = chance(0.6) ? ci : mNat(ci), nm = mName(ni);
    out.push({fn: nm.fn, ln: nm.ln, ni: ni, st: st, sal: mpScSal(st)});
  });
  sc.cand = out; sc.cy = mpNow();
  return out;
}
function mpScHire(i) {
  var sc = mpSc(), m = S.m, c = mpScCands()[i];
  if (!c || m.club < 0 || sc.l.length >= MP_SC_MAX || m.bud < c.sal) return false;
  m.bud -= c.sal;
  sc.l.push({id: sc.nid++, fn: c.fn, ln: c.ln, ni: c.ni, st: c.st, sal: c.sal, reg: "N:" + W.clubs[m.club].ci, lv: 1, n: 0, y: S.yr});
  sc.cand.splice(i, 1);
  notify("🔭 " + tr("{name} se une a tu red de ojeadores.", {name: c.fn + " " + c.ln}), "good");
  return true;
}
function mpScFire(id) {
  var sc = mpSc(), s = mpScById(id); if (!s) return false;
  sc.l.splice(sc.l.indexOf(s), 1);
  return true;
}
function mpScSet(id, k, v) {
  var s = mpScById(id); if (!s) return false;
  if (k === "reg" && mpRegName(v)) s.reg = v;
  else if (k === "lv") s.lv = clamp(+v || 0, 0, 2);
  return true;
}
/* regiones: países con liga en el juego y confederaciones */
function mpRegions() {
  var seen = {}, out = [];
  Object.keys(MP_CONF_N).forEach(function (cf) { if (W.lg.some(function (l) { return l.conf === cf; })) out.push({k: "C:" + cf, n: tr(MP_CONF_N[cf]), conf: true}); });
  W.lg.forEach(function (l) { if (seen[l.ci]) return; seen[l.ci] = 1; out.push({k: "N:" + l.ci, n: natName(l.ci), ci: l.ci}); });
  return out;
}
function mpRegName(k) {
  k = String(k || "");
  if (k.indexOf("C:") === 0) return MP_CONF_N[k.slice(2)] ? tr(MP_CONF_N[k.slice(2)]) : "";
  if (k.indexOf("N:") === 0) return W.ctry[+k.slice(2)] ? natName(+k.slice(2)) : "";
  return "";
}
function mpRegClubs(k) {
  k = String(k || "");
  if (k.indexOf("C:") === 0) { var cf = k.slice(2); return clubsWhere(function (c) { return W.lg[S.cl[c]].conf === cf; }); }
  var ci = +k.slice(2);
  return clubsWhere(function (c) { return W.clubs[c].ci === ci; });
}
/* un objetivo de mercado del club c para el puesto pos (real si el club tiene plantilla real) */
function mpMakeTarget(club, pos, young, bonus) {
  var rt = chance(0.9) ? realTargetFor(club, pos, young) : null;
  if (rt) return mgrNewTarget(Object.assign({club: club}, rt));
  var age = young ? ri(18, 22) : ri(23, 32);
  var ovr = S.cr[club] + gauss() * 2.6 - (young ? rf(2, 6) : 0) + (bonus ? rf(0, bonus) : 0);
  if (ovr > 88) ovr = 88 + (ovr - 88) * 0.4;
  return mgrNewTarget({pos: pos, age: age, ovr: clamp(ovr, 45, 92), club: club, ni: mNat(W.clubs[club].ci)});
}
/* precisión del informe: horquilla de potencial según las estrellas */
function mpAccuracy(t, st) {
  var err = MP_SC_ERR[st] || 4, sh = gauss() * err * 0.35;
  var a = Math.round(Math.max(t.ovr, t.pot + sh - rf(0.5, 1) * err)), b = Math.round(Math.min(95, t.pot + sh + rf(0.5, 1) * err));
  if (b < a) b = a;
  t.potR = [a, b];
}
function mpScReport(s, n) {
  var m = S.m, myR = S.cr[m.club], needs = typeof mkNeeds === "function" ? mkNeeds() : mgrNeeds(), out = [];
  var all = mpRegClubs(s.reg).filter(function (c) { return c !== m.club; });
  var pool = all.filter(function (c) { return S.cr[c] >= myR - 13 && S.cr[c] <= myR + 3 + s.st * 1.5; });
  if (!pool.length) pool = all.slice().sort(function (a, b) { return Math.abs(S.cr[a] - myR) - Math.abs(S.cr[b] - myR); }).slice(0, 10);
  if (!pool.length) return out;
  for (var i = 0; i < n; i++) {
    var pos = wpick(Object.keys(needs), function (k) { return Math.pow(needs[k], 1.5); });
    var t = mpMakeTarget(pick(pool), pos, chance(0.22 + s.st * 0.07), s.st * 0.6);
    t.sc = s.id; t.scN = s.ln; t.scSt = s.st; t.scW = mpNow();
    mpAccuracy(t, s.st);
    out.push(t);
  }
  return out;
}
/* los informes entran en la lista del mercado (se ve aunque esté cerrado) */
function mpScDeliver(list) {
  var m = S.m;
  if (!list.length) return;
  m.mk.list = (m.mk.list || []).concat(list);
  var sc = m.mk.list.filter(function (t) { return t.sc && !t.done; });
  while (sc.length > 14) { var old = sc.shift(); m.mk.list.splice(m.mk.list.indexOf(old), 1); }
}
function mpScRun(summer) {
  var m = S.m; if (!m.xp || !m.xp.sc || m.club < 0) return;
  var news = [];
  m.xp.sc.l.forEach(function (s) {
    var n = summer ? 1 : [1, 2, 3][s.lv] || 1;
    if (!summer && s.lv > 0) {
      var cost = mpScTrip(s.lv);
      if (cost > m.bud) { s.lv = 0; n = 1; news.push(tr("{name} vuelve a viajar sin presupuesto: no te queda dinero para sus viajes.", {name: s.ln})); }
      else m.bud -= cost;
    }
    var got = mpScReport(s, n);
    s.n += got.length;
    mpScDeliver(got);
    if (got.length) news.push(trn(got.length, "🔭 {name} ({reg}) te manda {n} informe.", "🔭 {name} ({reg}) te manda {n} informes.", {name: s.ln, reg: mpRegName(s.reg)}));
  });
  news.forEach(function (x) { if (S.bnews && S.ph === "blk") S.bnews.push({t: "ok", x: x}); else feedNote(x); });
  if (news.length) notify(news[news.length - 1], "info");
}
function mpScPay() {
  var m = S.m; if (!m.xp || !m.xp.sc || m.club < 0) return;
  var keep = [];
  m.xp.sc.l.forEach(function (s) {
    s.sal = mpScSal(s.st);
    if (m.bud >= s.sal) { m.bud -= s.sal; keep.push(s); }
    else feedNote(tr("No hay presupuesto para el sueldo de {name}: deja tu red de ojeadores.", {name: s.fn + " " + s.ln}));
  });
  m.xp.sc.l = keep;
}
/* cobertura: siempre opciones en todas las líneas (POR, DEF, MED, DEL), priorizando las necesidades */
var MP_COV = {POR: 1, DEF: 2, MED: 2, DEL: 2};
function mpCoverage(list) {
  var m = S.m, myR = S.cr[m.club], needs = mgrNeeds(), have = {POR: 0, DEF: 0, MED: 0, DEL: 0};
  list.forEach(function (t) { if (!t.done && W.pos[t.pos]) have[W.pos[t.pos].g]++; });
  var pool = clubsWhere(function (c) { return c !== m.club && S.cr[c] >= myR - 8 && S.cr[c] <= myR + 5; });
  if (!pool.length) return list;
  var byG = {};
  POS_ORDER.forEach(function (p) { var g = W.pos[p].g; (byG[g] = byG[g] || []).push(p); });
  Object.keys(MP_COV).forEach(function (g) {
    var want = MP_COV[g] + (g === "POR" && needs.POR >= 3 ? 1 : 0), guard = 0;
    while (have[g] < want && guard++ < 6) {
      var pos = byG[g].slice().sort(function (a, b) { return needs[b] - needs[a]; })[guard % 2 === 0 ? 0 : Math.min(1, byG[g].length - 1)];
      var t = mpMakeTarget(pick(pool), pos, chance(0.3), 0);
      t.cov = 1; list.push(t);
      if (W.pos[t.pos] && W.pos[t.pos].g === g) have[g]++; else if (W.pos[t.pos]) have[W.pos[t.pos].g]++;
    }
  });
  /* primero los puestos que más necesitas */
  var w = function (t) { return t.done ? -1 : (needs[t.pos] || 1); };
  return list.map(function (t, i) { return {t: t, i: i}; }).sort(function (a, b) { return w(b.t) - w(a.t) || a.i - b.i; }).map(function (x) { return x.t; });
}
(function () {
  var _sl = mgrScoutList;
  mgrScoutList = function (n) {
    var out = _sl.apply(this, arguments);
    try {
      if (mpOn() && S.m.club >= 0) {
        var old = (S.m.mk && S.m.mk.list) || [], now = mpNow();
        var carry = old.filter(function (t) { return t.sc && !t.done && now - (t.scW || 0) <= 6 && out.indexOf(t) < 0; });
        out = mpCoverage(carry.concat(out));
      }
    } catch (e) { mpErr(e); }
    return out;
  };
})();

/* ============ 2) CLÁUSULAS ============ */
var mpClBase = clauseOf;
(function () { var _c = clauseOf; clauseOf = function (p) { return p && p.cl ? p.cl : _c(p); }; })();
function mpClLevel(p) { var b = mpClBase(p); return !p.cl ? "n" : p.cl >= b * 1.4 ? "hi" : p.cl <= b * 0.75 ? "lo" : "n"; }
(function () {
  var r = MPH.renew, _ro = r.opts;
  r.opts = function (x) {
    var o = _ro.apply(this, arguments), p = mPl(x.pid);
    if (!p) return o;
    var tm = mgrRenewTerms(p), base = mpClBase(p), end = S.yr + tm.yrs + 1;
    /* las renovaciones normales fijan la cláusula de siempre */
    o.forEach(function (op) { if (op.ko && op.ok && op.ok.then) { var th = op.ok.then; op.ok.then = function () { th.apply(this, arguments); p.cl = base; }; } });
    var hi = Math.max(base + 1e6, mpRound(base * 1.8, 1e6)), lo = Math.max(2e6, mpRound(base * 0.6, 1e6));
    var wHi = mpRound(tm.wage * 1.12, 1000), wLo = mpRound(tm.wage * 0.97, 1000);
    var sign = function (w, cl) { return function () { p.sal = w; p.yrs = 1 + tm.yrs; p.cl = cl; }; };
    var fail = function (d) { return {txt: tr("Quiere esperar a ver qué otras ofertas le llegan."), fx: {pmor: d}, n: tr("Podrás volver a intentarlo el próximo tramo"), then: function () { p.rnT = S.yr * 10 + S.bi; }}; };
    var extra = [
      {t: tr("Renovar y blindarle con una cláusula de {cl}", {cl: fmtMoney(hi)}), d: tr("{sal}/año hasta {end} · más difícil que te lo quiten", {sal: fmtMoney(wHi), end: end}), p: clamp(tm.p - 0.1, 0.03, 0.9),
        ok: {txt: tr("{name} renueva hasta {end} con la cláusula blindada.", {name: plShort(p), end: end}), fx: {pmor: 3}, n: tr("Cláusula: {cl}", {cl: fmtMoney(hi)}), then: sign(wHi, hi)}, ko: fail(-5)},
      {t: tr("Renovar con una cláusula baja de {cl}", {cl: fmtMoney(lo)}), d: tr("{sal}/año · le abres la puerta a un grande", {sal: fmtMoney(wLo)}), p: clamp(tm.p + 0.15, 0.05, 0.97),
        ok: {txt: tr("{name} renueva hasta {end}. Valora que no le cierres puertas.", {name: plShort(p), end: end}), fx: {pmor: 7}, n: tr("Cláusula: {cl}", {cl: fmtMoney(lo)}), then: sign(wLo, lo)}, ko: fail(-3)}
    ];
    var last = o.length - 1;
    return o.slice(0, last).concat(extra, o.slice(last));
  };
})();
/* cláusula blindada: los ricos se lo piensan; y nadie paga la cláusula de un cedido */
(function () {
  var _mc = maybeClausM;
  maybeClausM = function (kind) {
    var n0 = S.pend.length, r = _mc.apply(this, arguments);
    try {
      var x = S.pend[0];
      if (S.pend.length > n0 && x && x.k === "clausm") {
        var p = mPl(x.pid);
        var drop = p && (p.loanIn || (mpClLevel(p) === "hi" && chance(0.6)));
        if (drop) {
          S.pend.shift();
          if (S.ntf && S.ntf.length) S.ntf.pop();
          if (!p.loanIn) notify("🛡️ " + tr("El {club} quería a {name}, pero su cláusula blindada les frena.", {club: clubName(x.club), name: plShort(p)}), "good");
        }
      }
    } catch (e) { mpErr(e); }
    return r;
  };
})();

/* ============ 2) CESIONES CON OPCIÓN U OBLIGACIÓN ============ */
function mpLoanFee(p, kind) { return Math.max(3e5, mpRound(pValue(p) * (kind === "obl" ? 0.92 : 1.05), 1e5)); }
(function () {
  var L = MPH.loan;
  L.head = function (x) { var p = mPl(x.pid);
    return {tag: "real", tagTxt: tr("Cesión"), cls: "", cat: tr("Mercado"), title: tr("Ceder a {name}", {name: plName(p)}),
      text: plDesc(p) + " " + tr("Jugará la temporada en otro club. Puedes pactar una opción de compra (decide el otro club en verano) o una obligación de compra (venta cerrada al acabar la cesión). Cláusula actual: {cl}.", {cl: fmtMoney(clauseOf(p))})}; };
  L.opts = function (x) {
    var p = mPl(x.pid), out = [];
    x.clubs.forEach(function (c) {
      var go = function (kind, fee) { return function () { p.loanOut = {club: c, y: S.yr}; if (kind) { p.loanOut.k = kind; p.loanOut.fee = fee; } mFixXI(); mSync(); }; };
      var fo = mpLoanFee(p, "opt"), fb = mpLoanFee(p, "obl"), lab = W.lg[S.cl[c]] ? lgName(S.cl[c]) : "";
      out.push({t: tr("Ceder al {club}", {club: clubName(c)}), d: tr("{lg} · nivel {n}", {lg: lab, n: Math.round(S.cr[c])}), dis: x.ob ? tr("Con más de 23 años solo se cede con compra") : null, club: c, lk: "",
        ok: {txt: tr("{name} se va cedido al {club}.", {name: plName(p), club: clubName(c)}), fx: {}, n: tr("Vuelve en verano con más rodaje"), then: go(null)}});
      out.push({t: tr("Ceder al {club} con opción de compra", {club: clubName(c)}), d: tr("Opción de {fee}: la decide el {club} en verano", {fee: fmtMoney(fo), club: clubName(c)}), club: c, lk: "opt", fee: fo,
        ok: {txt: tr("{name} se va cedido al {club} con opción de compra de {fee}.", {name: plName(p), club: clubName(c), fee: fmtMoney(fo)}), fx: {}, n: tr("Opción de compra: {fee}", {fee: fmtMoney(fo)}), then: go("opt", fo)}});
      out.push({t: tr("Ceder al {club} con obligación de compra", {club: clubName(c)}), d: tr("Venta cerrada por {fee} al acabar la cesión", {fee: fmtMoney(fb)}), club: c, lk: "obl", fee: fb,
        ok: {txt: tr("{name} se va cedido al {club}; en verano será suyo por {fee}.", {name: plName(p), club: clubName(c), fee: fmtMoney(fb)}), fx: {}, n: tr("Obligación de compra: {fee}", {fee: fmtMoney(fb)}), then: go("obl", fb)}});
    });
    out.push({t: tr("Cancelar"), lk: "x", ok: {txt: tr("Se queda en la plantilla."), fx: {}}});
    return out;
  };
})();
(function () {
  var _st = mgrStartLoan;
  mgrStartLoan = function (pid) {
    var p = mPl(pid);
    if (!p || p.loanIn) return false;
    if (p.age > 23 && p.age <= 31 && S.m.mk.open && !p.loanOut) {
      var l = mgrLoanClubs(p);
      if (!l.length) l = clubsWhere(function (c) { return c !== S.m.club && S.cr[c] <= S.cr[S.m.club] && Math.abs(S.cr[c] - p.ovr) <= 6; }).sort(byRating).slice(0, 3);
      if (!l.length) return false;
      S.pend.unshift(mp("loan", {pid: pid, clubs: l, ui: true, ob: true}));
      return true;
    }
    return _st.apply(this, arguments);
  };
  /* los cedidos que llegan no se venden, ni se renuevan, ni se rescinden */
  var blocked = function (pid) { var p = mPl(pid); return !!(p && p.loanIn); };
  var _sell = mgrStartSell, _rel = mgrStartRelease, _ren = mgrStartRenew;
  mgrStartSell = function (pid) { return blocked(pid) ? false : _sell.apply(this, arguments); };
  mgrStartRelease = function (pid) { return blocked(pid) ? false : _rel.apply(this, arguments); };
  mgrStartRenew = function (pid) { return blocked(pid) ? false : _ren.apply(this, arguments); };
  var _io = mgrIncomingOffers;
  mgrIncomingOffers = function () {
    var r = _io.apply(this, arguments);
    S.pend = S.pend.filter(function (x) { if (x.k !== "inoffer") return true; var p = mPl(x.pid); return !(p && p.loanIn); });
    return r;
  };
})();
/* pedir cedido a un jugador de la lista de ojeadores */
function mpLoanInOk(t) { var m = S.m; return !!(t && !t.done && t.club >= 0 && m.mk.open && m.club >= 0 && !t.loanNo); }
function mpStartLoanIn(tid) {
  var t = mgrTarget(tid);
  if (!mpLoanInOk(t)) return false;
  S.pend.unshift(mp("mploanin", {tid: tid, ui: true}));
  return true;
}
function mpLoanInTerms(t) {
  var m = S.m, base = clamp(0.55 - (t.key ? 0.3 : 0) + (t.age <= 23 ? 0.15 : 0) - (t.ovr - S.cr[t.club]) * 0.04 + (m.rep - 50) / 300, 0.05, 0.85);
  return {cuota: Math.max(1e5, mpRound(t.val * 0.08, 1e5)), opt: Math.max(5e5, mpRound(t.ask * 0.95, 1e5)), obl: Math.max(5e5, mpRound(t.ask * 0.9, 1e5)), p: base};
}
MPH.mploanin = {
  head: function (x) { var t = mgrTarget(x.tid), k = mpLoanInTerms(t);
    return {tag: "real", tagTxt: tr("Cesión"), cls: "", cat: S.m.mk.open === "invierno" ? tr("Mercado de invierno") : tr("Mercado de verano"), title: tr("Pedir cedido a {name}", {name: t.fn + " " + t.ln}),
      text: tDesc(t) + " " + tr("El {club} lo tasa en {fee}. Una cesión cuesta {cuota} de cuota y pagas su sueldo ({sal}/año). Tienes {bud} de presupuesto.", {club: clubName(t.club), fee: fmtMoney(t.ask), cuota: fmtMoney(k.cuota), sal: fmtMoney(t.sal), bud: fmtMoney(S.m.bud)})}; },
  opts: function (x) {
    var t = mgrTarget(x.tid), m = S.m, k = mpLoanInTerms(t), out = [];
    var dis = k.cuota > m.bud ? tr("No te llega el presupuesto") : mWageBill() + t.sal > m.wcap * 1.1 ? tr("Superarías el tope salarial: vende o renegocia antes") : null;
    var sign = function (kind, fee) { return function () {
      m.bud -= k.cuota;
      var p = mgrSign(t, 0, t.sal, null, false);
      p.loanIn = {club: t.club, k: kind, fee: fee, y: S.yr, yrs: t.yrsD}; p.yrs = 2;
      if (m.tx[0] && m.tx[0].n === plName(p)) m.tx[0].loan = 1;
    }; };
    var no = {txt: tr("El {club} no quiere cederlo en esas condiciones.", {club: clubName(t.club)}), n: tr("No habrá cesión"), then: function () { t.loanNo = true; }};
    out.push({t: tr("Cesión sin compra"), d: tr("Cuota de {c} · vuelve a su club en verano", {c: fmtMoney(k.cuota)}), p: k.p, dis: dis, lk: "",
      ok: {txt: tr("¡Cedido! {name} jugará en tu equipo esta temporada.", {name: t.fn + " " + t.ln}), fx: {bud: -k.cuota}, then: sign("", 0)}, ko: no});
    out.push({t: tr("Cesión con opción de compra ({fee})", {fee: fmtMoney(k.opt)}), d: tr("Cuota de {c} · en verano decides si te lo quedas", {c: fmtMoney(k.cuota)}), p: clamp(k.p + 0.12, 0.05, 0.92), dis: dis, lk: "opt", fee: k.opt,
      ok: {txt: tr("¡Cedido con opción de compra! Al final de la temporada decidirás."), fx: {bud: -k.cuota}, n: tr("Opción de compra: {fee}", {fee: fmtMoney(k.opt)}), then: sign("opt", k.opt)}, ko: no});
    out.push({t: tr("Cesión con obligación de compra ({fee})", {fee: fmtMoney(k.obl)}), d: tr("Cuota de {c} · en verano pagas el traspaso sí o sí", {c: fmtMoney(k.cuota)}), p: clamp(k.p + 0.25, 0.05, 0.95), dis: dis, lk: "obl", fee: k.obl,
      ok: {txt: tr("¡Cedido con obligación de compra! En verano será tuyo."), fx: {bud: -k.cuota}, n: tr("Obligación de compra: {fee}", {fee: fmtMoney(k.obl)}), then: sign("obl", k.obl)}, ko: no});
    out.push({t: tr("Retirarte de la operación"), lk: "x", ok: {txt: tr("Te retiras. Quizá en otro momento."), fx: {}}});
    return out;
  }
};
MPH.mploanopt = {
  fixed: true,
  head: function (x) { var p = mPl(x.pid), li = p.loanIn;
    return {tag: "real", tagTxt: tr("Opción de compra"), cls: "", cat: tr("Mercado"), title: tr("¿Te quedas a {name}?", {name: plName(p)}),
      text: tr("Termina su cesión. Puedes quedártelo pagando {fee} al {club}. Esta temporada: {apps} partidos y media {ovr}. Tienes {bud} de presupuesto.", {fee: fmtMoney(li.fee), club: clubName(li.club), apps: p.tot.apps, ovr: Math.round(p.ovr), bud: fmtMoney(S.m.bud)})}; },
  opts: function (x) { var p = mPl(x.pid), li = p.loanIn, m = S.m; return [
    {t: tr("Ejercer la opción: {fee}", {fee: fmtMoney(li.fee)}), dis: li.fee > m.bud ? tr("No te llega el presupuesto") : null,
      ok: {txt: tr("{name} firma en propiedad hasta {end}.", {name: plShort(p), end: S.yr + 1 + (li.yrs || 3)}), fx: {bud: -li.fee, pmor: 6}, then: function () { mpLoanKeep(p); }}},
    {t: tr("Devolverlo al {club}", {club: clubName(li.club)}), ok: {txt: tr("{name} vuelve a su club.", {name: plShort(p)}), fx: {}, then: function () { mgrRemovePlayer(p, tr("Vuelve a su club tras la cesión"), li.club, 0, true); }}}
  ]; }
};
function mpLoanKeep(p) {
  var li = p.loanIn, m = S.m;
  p.yrs = li.yrs || 3; delete p.loanIn;
  var tx = {y: S.yr, w: S.w, n: plName(p), pos: p.pos, from: li.club, to: m.club, fee: li.fee, inn: true};
  m.tx.unshift(tx); if (m.tx.length > 80) m.tx.length = 80;
}
/* fin de temporada: compras de cesiones (salida y entrada) */
(function () {
  var _se = mgrSquadSeasonEnd;
  mgrSquadSeasonEnd = function () {
    var m = S.m, news = [];
    try {
      m.sq.slice().forEach(function (p) {
        var lo = p.loanOut; if (!lo || !lo.k) return;
        var buy = lo.k === "obl" || chance(clamp(0.35 + (p.ovr - S.cr[lo.club]) * 0.06 + (p.age <= 23 ? 0.1 : 0), 0.1, 0.9));
        if (!buy) { news.push({t: "ok", x: tr("El {club} no ejerce la opción de compra de {name}: vuelve a casa.", {club: clubName(lo.club), name: plName(p)})}); delete lo.k; return; }
        m.bud += lo.fee;
        p.tot.apps += p.st.apps; p.tot.g += p.st.g; p.tot.a += p.st.a;
        news.push({t: "ok", x: lo.k === "obl" ? tr("{name}: el {club} cumple la obligación de compra y paga {fee}.", {name: plName(p), club: clubName(lo.club), fee: fmtMoney(lo.fee)}) : tr("{name}: el {club} ejerce la opción de compra y paga {fee}.", {name: plName(p), club: clubName(lo.club), fee: fmtMoney(lo.fee)})});
        var tx = {y: S.yr, w: S.w, n: plName(p), pos: p.pos, from: m.club, to: lo.club, fee: lo.fee, inn: false};
        m.tx.unshift(tx);
        mgrRemovePlayer(p, tr("Comprado por el {club} tras su cesión", {club: clubName(lo.club)}), lo.club, lo.fee, true);
      });
    } catch (e) { mpErr(e); }
    var r = _se.apply(this, arguments) || [];
    try {
      m.sq.slice().forEach(function (p) {
        var li = p.loanIn; if (!li) return;
        if (li.k === "obl") {
          m.bud -= li.fee;
          news.push({t: "ok", x: tr("{name} se queda: pagas {fee} al {club} por la obligación de compra.", {name: plName(p), fee: fmtMoney(li.fee), club: clubName(li.club)})});
          mpLoanKeep(p);
        } else if (li.k === "opt") {
          p.yrs = Math.max(p.yrs, 1);
          S.pend.push(mp("mploanopt", {pid: p.id}));
        } else {
          news.push({t: "ok", x: tr("{name} vuelve al {club} al acabar su cesión.", {name: plName(p), club: clubName(li.club)})});
          mgrRemovePlayer(p, tr("Vuelve a su club tras la cesión"), li.club, 0, true);
        }
      });
    } catch (e) { mpErr(e); }
    return news.concat(r);
  };
})();
/* si la opción quedó sin decidir, el cedido vuelve a su club */
function mpLoanCleanup() {
  var m = S.m; if (!m || m.club < 0) return;
  m.sq.slice().forEach(function (p) { if (p.loanIn && p.loanIn.y <= S.yr && S.ph !== "pre") mgrRemovePlayer(p, tr("Vuelve a su club tras la cesión"), p.loanIn.club, 0, true); });
}

/* ============ 3) FILIAL ============ */
var MP_RES_RX = /^(.+?)\s+(B|II|Castilla|Promesas|Atl[eè]tic)$/;
var MP_RES_ALIAS = {"barca": "barcelona"};
var MP_NEXT_FIL = null;
function mpNorm(s) { return String(s).toLowerCase().replace(/[áàä]/g, "a").replace(/[éèë]/g, "e").replace(/[íìï]/g, "i").replace(/[óòö]/g, "o").replace(/[úùü]/g, "u").replace(/ç/g, "c").replace(/ñ/g, "n").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim(); }
/* primer equipo del filial c por la raíz del nombre (Real Madrid Castilla → Real Madrid), o -1 */
function mpParentOf(c) {
  if (c == null || c < 0 || !W.clubs[c]) return -1;
  W.mpPar = W.mpPar || {};
  if (W.mpPar[c] != null) return W.mpPar[c];
  var nm = W.clubs[c].n0 || W.clubs[c].n, mm = MP_RES_RX.exec(nm), res = -1;
  if (mm) {
    var stem = mpNorm(mm[1]); stem = MP_RES_ALIAS[stem] || stem;
    var ci = W.clubs[c].ci, best = 1e9;
    for (var i = 0; i < W.clubs.length; i++) {
      var cl = W.clubs[i];
      if (i === c || cl.ci !== ci || cl.lg0 == null || cl.lg0 < 0) continue;
      var n2 = cl.n0 || cl.n;
      if (MP_RES_RX.test(n2)) continue;
      var nn = mpNorm(n2);
      if (!nn || !(nn === stem || (" " + nn + " ").indexOf(" " + stem + " ") >= 0 || (" " + stem + " ").indexOf(" " + nn + " ") >= 0)) continue;
      var sc = Math.abs(nn.length - stem.length);
      if (sc < best) { best = sc; res = i; }
    }
  }
  return (W.mpPar[c] = res);
}
function mpTopLg(c) { var li = S && S.cl ? S.cl[c] : null; if (li == null || li < 0) li = W.clubs[c].lg0; return li != null && li >= 0 && W.lg[li] && W.lg[li].t === 1; }
/* filial de un club grande: el real si existe; si no, un club modesto del país hace de filial convenido */
function mpFil() { return mpOn() && S.m.xp && S.m.xp.fil && S.m.xp.fil.club === S.m.club ? S.m.xp.fil : null; }
function mpFilSnap() { var f = mpFil(); if (!f) return; f.o0 = {}; mActive().forEach(function (p) { f.o0[p.id] = p.ovr; }); f.y = S.yr; }
var MP_FIL_OBJ = [N_("Cumplir el objetivo de liga"), N_("Dar 10 partidos o más a tres jugadores de 21 años o menos"), N_("Que dos jugadores mejoren su media 2 puntos")];
function mpFilProgress() {
  var f = mpFil(); if (!f) return null;
  var main = (S.m.objs || []).filter(function (o) { return o.main; })[0], pr = main ? mgrObjProgress(main) : {met: false, txt: "—"};
  var yo = mActive().filter(function (p) { return p.age <= 21 && p.st.apps >= 10; }).length;
  var gr = mActive().filter(function (p) { return f.o0 && f.o0[p.id] != null && p.ovr - f.o0[p.id] >= 2; }).length;
  return [{n: MP_FIL_OBJ[0], met: !!pr.met, txt: pr.txt}, {n: MP_FIL_OBJ[1], met: yo >= 3, txt: yo + "/3"}, {n: MP_FIL_OBJ[2], met: gr >= 2, txt: gr + "/2"}];
}
MPH.mpfilup = {
  fixed: true,
  head: function (x) { return {tag: "real", tagTxt: tr("Filial"), cls: "", cat: tr("Banquillo"), title: tr("El {club} te quiere en el primer equipo", {club: clubName(x.par)}),
    text: tr("Has cumplido {n} de 3 objetivos con el filial. La directiva del {club} te ofrece el banquillo del primer equipo ({sal}/año).", {n: x.met, club: clubName(x.par), sal: fmtMoney(mgrSalary(x.par))})}; },
  opts: function (x) { return [
    {t: tr("Subir al primer equipo"), ok: {txt: tr("Das el salto: diriges al {club}.", {club: clubName(x.par)}), fx: {rep: 3}, then: function () { mpX().filDone = S.yr; mgrJoinClub(x.par, {sal: mgrSalary(x.par)}); }}},
    {t: tr("Seguir formando en el filial"), ok: {txt: tr("Prefieres un año más con los chavales."), fx: {board: 6, rep: 1}}}
  ]; }
};

/* ============ 4) SELECCIONES ============ */
function mpNT() { return mpOn() && S.m.xp && S.m.xp.nt ? S.m.xp.nt : null; }
function mpClubless() { var nt = mpNT(); return !!(nt && nt.ex && S.m.club < 0); }
function mpNatLabel(ni) { return S.g === "f" ? tr("Selección femenina de {nat}", {nat: natName(ni)}) : tr("Selección de {nat}", {nat: natName(ni)}); }
function mpNatSal(ni, ex) { return mpRound(2.5e5 * Math.exp((S.nr[ni] - 66) / 9) * (ex ? 1.8 : 0.7), 1e4); }
/* convocables: jugadores reales de esa nacionalidad en todo el mundo, los tuyos y, si faltan, inventados */
function mpNatPool(ni) {
  var key = ni + ":" + S.yr + ":" + (S.m.club >= 0 ? S.m.sq.length : 0);
  W.mpNP = W.mpNP || {};
  if (W.mpNP[key]) return W.mpNP[key];
  var out = [], seen = {}, R0 = realDB(), m = S.m;
  if (m.club >= 0) mActive().forEach(function (p) { if (p.nat !== ni) return; out.push({k: "m" + p.id, fn: p.fn, ln: p.ln, pos: p.pos, ovr: p.ovr, age: p.age, club: m.club, mine: 1}); if (p.rid) seen[p.rid] = 1; });
  if (R0 && R0.c) Object.keys(R0.c).forEach(function (cn) {
    var c = W.cName[cn]; if (c == null || S.cl[c] < 0 || c === m.club) return;
    var rc = R0.c[cn], ofs = null;
    rc.p.forEach(function (r, i) {
      if (W.cIdx[r[5]] !== ni || !W.pos[r[2]]) return;
      var rid = cn + "#" + i;
      if (seen[rid] || (S.rp && S.rp[rid]) || realRetired(r, S.yr, i)) return;
      if (ofs == null) ofs = realOffset(c, S.yr);
      var at = realAt(r, S.yr);
      out.push({k: rid, fn: r[0], ln: r[1], pos: r[2], ovr: round1(clamp(at.ovr + ofs, 40, 94)), age: at.age, club: c, rl: 1});
    });
  });
  /* relleno determinista para las selecciones sin datos */
  var plan = ["POR", "POR", "POR", "LD", "LD", "DFC", "DFC", "DFC", "DFC", "LI", "LI", "MCD", "MCD", "MC", "MC", "MC", "MCO", "MD", "MI", "ED", "EI", "DC", "DC", "DC"];
  var cnt = {}; out.forEach(function (x) { var g = W.pos[x.pos].g; cnt[g] = (cnt[g] || 0) + 1; });
  var pool = namePool(ni), fns = pool.f.split(","), lns = pool.l.split(","), k = 0;
  var gWant = {POR: 4, DEF: 10, MED: 9, DEL: 7};
  plan.forEach(function (pos, j) {
    var g = W.pos[pos].g;
    if ((cnt[g] || 0) >= gWant[g]) return;
    cnt[g] = (cnt[g] || 0) + 1;
    var h = hashStr("np" + ni + ":" + S.yr + ":" + j);
    out.push({k: "s" + ni + "_" + j, fn: fns[h % fns.length], ln: lns[(h >>> 8) % lns.length], pos: pos, ovr: round1(clamp(S.nr[ni] - 3 - (h % 9) * 0.7, 40, 92)), age: 20 + (h >>> 16) % 13, club: -1});
    k++;
  });
  out.sort(function (a, b) { return b.ovr - a.ovr; });
  return (W.mpNP[key] = out);
}
function mpPoolMap(pool) { var o = {}; pool.forEach(function (x) { o[x.k] = x; }); return o; }
var MP_NAT_PLAN = {POR: 3, DEF: 8, MED: 7, DEL: 5};
function mpNatAuto(pool) {
  var got = {POR: 0, DEF: 0, MED: 0, DEL: 0}, out = [];
  pool.forEach(function (x) { var g = W.pos[x.pos].g; if (got[g] < MP_NAT_PLAN[g]) { got[g]++; out.push(x.k); } });
  return out;
}
function mpNatXI(keys, pool) {
  var mp0 = mpPoolMap(pool), need = {POR: 1, DEF: 4, MED: 3, DEL: 3}, xi = [];
  keys.map(function (k) { return mp0[k]; }).filter(Boolean).sort(function (a, b) { return b.ovr - a.ovr; }).forEach(function (x) { var g = W.pos[x.pos].g; if (need[g] > 0) { need[g]--; xi.push(x); } });
  var miss = need.POR + need.DEF + need.MED + need.DEL, sum = xi.reduce(function (s, x) { return s + x.ovr; }, 0);
  var floor = xi.length ? Math.min.apply(null, xi.map(function (x) { return x.ovr; })) - 8 : 50;
  return {xi: xi, avg: (sum + miss * floor) / 11};
}
function mpNatSquad() {
  var nt = mpNT(), pool = mpNatPool(nt.ni), mp0 = mpPoolMap(pool);
  var sq = (nt.sq || []).filter(function (k) { return mp0[k]; });
  return sq.length >= 11 ? sq : mpNatAuto(pool);
}
function mpNatRating() {
  var nt = mpNT(), pool = mpNatPool(nt.ni);
  var a = mpNatXI(mpNatAuto(pool), pool), me = mpNatXI(mpNatSquad(), pool);
  var bonus = Math.min(1.5, 0.3 * me.xi.filter(function (x) { return x.mine; }).length);
  return round1(clamp(S.nr[nt.ni] + (me.avg - a.avg) * 0.8 + bonus, 30, 95));
}
function mpNatToggle(k) {
  var nt = mpNT(); if (!nt) return false;
  if (!nt.sq || !nt.sq.length) nt.sq = mpNatSquad().slice();
  var i = nt.sq.indexOf(k);
  if (i >= 0) nt.sq.splice(i, 1); else if (nt.sq.length < 26) nt.sq.push(k); else return false;
  return true;
}
function mpNatAutoSet() { var nt = mpNT(); if (nt) nt.sq = mpNatAuto(mpNatPool(nt.ni)); }
/* ofertas: al acabar la temporada, según tu prestigio */
function mpNatCands() {
  var m = S.m, tgt = 52 + m.rep * 0.36, out = [];
  var l = range(W.ctry.length).filter(function (i) { return natLive(i) && W.ctry[i].code !== "RU" && S.nr[i] >= tgt - 7 && S.nr[i] <= tgt + 3; });
  for (var k = 0; k < 2 && l.length; k++) {
    var ni = wpick(l, function (i) { return (i === m.nat ? 4 : 1) * (W.ctry[i].conf === W.ctry[m.nat].conf ? 1.5 : 1); });
    if (ni == null) break;
    out.push(ni); l = l.filter(function (i) { return i !== ni; });
  }
  return out;
}
function mpNatOffer(force) {
  var m = S.m, x = mpX();
  if (x.nt || (!force && x.ntOffY === S.yr)) return false;
  if (!force && !chance(clamp((m.rep - 35) / 120, 0.03, 0.35))) return false;
  var l = mpNatCands();
  if (!l.length) return false;
  x.ntOffY = S.yr;
  S.pend.push(mp("mpnatoff", {list: l}));
  return true;
}
function mpNatTake(ni, ex) {
  var m = S.m, x = mpX();
  x.nt = {ni: ni, y0: S.yr + 1, ex: !!ex, sal: mpNatSal(ni, ex), end: S.yr + 2, sq: [], log: [], w: 0, d: 0, l: 0, s: {w: 0, d: 0, l: 0}, tro: 0};
  if (ex && m.club >= 0) {
    feed({t: "decision", tipo: "mgr", cat: tr("Banquillo"), title: tr("Dejas el {club}", {club: clubName(m.club)}), choice: mpNatLabel(ni), txt: tr("Te dedicas en exclusiva a la selección."), chips: [], y: S.yr});
    mgrLeaveClub();
  }
  notify("🏳️ " + tr("Eres el nuevo seleccionador: {nat}.", {nat: mpNatLabel(ni)}), "good");
}
function mpNatEnd(txt) {
  var m = S.m, x = mpX(), nt = x.nt; if (!nt) return;
  (x.ntH = x.ntH || []).push({ni: nt.ni, y0: nt.y0, y1: S.yr + 1, w: nt.w, d: nt.d, l: nt.l, tro: nt.tro});
  delete x.nt;
  feed({t: "decision", tipo: "mgr", cat: tr("Selección"), title: tr("Fin de tu etapa en la selección"), choice: mpNatLabel(nt.ni), txt: txt, chips: [], y: S.yr});
  if (nt.ex && m.club < 0 && !S.pend.some(function (p) { return p.k === "jobs"; })) {
    var jo = mgrJobOffers(true);
    S.pend.push(mp("jobs", {list: jo, forced: true}));
  }
}
function mpNatSeasonEnd() {
  var nt = mpNT(); if (!nt) return;
  S.m.money += nt.sal;
  var s = nt.s || {w: 0, d: 0, l: 0}, n = s.w + s.d + s.l, tot = nt.w + nt.d + nt.l;
  nt.s = {w: 0, d: 0, l: 0};
  if (n >= 5 && s.w / n < 0.25) { mpNatEnd(tr("La federación te destituye tras una temporada con {w} victorias en {n} partidos.", {w: s.w, n: n})); return; }
  if (S.yr >= nt.end) {
    if (!tot || nt.w / tot >= 0.4 || nt.tro) { nt.end += 2; notify("🏳️ " + tr("La federación te renueva hasta {y}.", {y: nt.end + 1}), "good"); }
    else mpNatEnd(tr("La federación no te renueva: {w} victorias en {n} partidos.", {w: nt.w, n: tot}));
  }
}
function mpNatOpp() {
  var nt = mpNT(), ni = nt.ni, conf = W.ctry[ni].conf;
  var l = natsOfConf(conf).filter(function (i) { return i !== ni && natLive(i) && Math.abs(S.nr[i] - S.nr[ni]) <= 10; });
  if (l.length < 3) l = range(W.ctry.length).filter(function (i) { return i !== ni && natLive(i); }).sort(function (a, b) { return Math.abs(S.nr[a] - S.nr[ni]) - Math.abs(S.nr[b] - S.nr[ni]); }).slice(0, 8);
  return pick(l);
}
function mpNatWindow() {
  var nt = mpNT(); if (!nt) return;
  var it = mp("mpnatm", {w: S.w, opp: mpNatOpp(), cmp: chance(0.6) ? "q" : "f", h: chance(0.5) ? 1 : 0});
  S.pend.unshift(it);
}
/* narración: [minuto, tipo, plantilla, a, b, g1, g2] */
var MP_NCOM = {
  ko: [N_("¡Rueda el balón! {us} contra {them}.")],
  gu: [N_("¡GOOOL de {us}! {a} la empuja tras un pase de {b}. {g1}-{g2}."), N_("¡GOLAZO de {a}! Disparo desde fuera del área que se cuela por la escuadra. {g1}-{g2}."), N_("¡Gol! {a} cabecea un centro de {b}. {g1}-{g2}.")],
  gt: [N_("Gol de {them}. {a} no perdona. {g1}-{g2}."), N_("{a} bate a {b} por bajo. {g1}-{g2}."), N_("Jarro de agua fría: cabezazo de {a}. {g1}-{g2}.")],
  cu: [N_("¡Uy! {a} la manda rozando el palo."), N_("Paradón del portero rival a tiro de {a}."), N_("{a} se queda solo… ¡y la tira fuera!")],
  ct: [N_("{a} avisa: remate desviado."), N_("¡Paradón de {b}! Evita el gol de {a}."), N_("¡Al palo! {a} casi marca.")],
  yc: [N_("Amarilla para {a} por una entrada a destiempo.")],
  ht: [N_("Descanso: {g1}-{g2}.")],
  ft: [N_("Final: {us} {g1}-{g2} {them}.")],
  et: [N_("Prórroga: {g1}-{g2} tras los 120 minutos.")],
  pen: [N_("Penaltis: {g1}-{g2}.")]
};
function mpOppNames(ni) {
  var nt = mpNT(), cur = nt ? nt.ni : -1, l;
  try { l = ni === cur ? [] : mpNatPool(ni).slice(0, 14); } catch (e) { l = []; }
  if (!l.length) { var pool = namePool(ni), lns = pool.l.split(","); for (var i = 0; i < 11; i++) l.push({ln: lns[hashStr("o" + ni + i) % lns.length], pos: i ? (i < 5 ? "DFC" : i < 8 ? "MC" : "DC") : "POR"}); }
  return l;
}
function mpNatEvents(rec, xi, opp) {
  var ev = [[0, "ko", 0]], gm = [], gk = xi.filter(function (x) { return x.pos === "POR"; })[0], ogk = opp.filter(function (x) { return x.pos === "POR"; })[0];
  var shooter = function (l) { var x = wpick(l.filter(function (q) { return q.pos !== "POR"; }), function (q) { return (GOAL_SHARE[q.pos] || 0.02) + 0.01; }); return x ? x.ln : "—"; };
  var helper = function (l, not) { var x = wpick(l.filter(function (q) { return q.pos !== "POR" && q.ln !== not; }), function (q) { return (AST_SHARE[q.pos] || 0.02) + 0.01; }); return x ? x.ln : "—"; };
  for (var i = 0; i < rec.gu; i++) gm.push([ri(2, 90), 1]);
  for (var j = 0; j < rec.gt; j++) gm.push([ri(2, 90), 0]);
  for (var k = 0; k < 4; k++) gm.push([ri(3, 88), chance(0.5) ? 3 : 2]);
  if (chance(0.6)) gm.push([ri(10, 85), 4]);
  gm.sort(function (a, b) { return a[0] - b[0]; });
  var g1 = 0, g2 = 0, half = false;
  gm.forEach(function (x) {
    if (!half && x[0] > 45) { ev.push([45, "ht", 0, "", "", g1, g2]); half = true; }
    if (x[1] === 1) { g1++; var s = shooter(xi); ev.push([x[0], "gu", ri(0, 2), s, helper(xi, s), g1, g2]); }
    else if (x[1] === 0) { g2++; ev.push([x[0], "gt", ri(0, 2), shooter(opp), gk ? gk.ln : "—", g1, g2]); }
    else if (x[1] === 3) ev.push([x[0], "cu", ri(0, 2), shooter(xi), "", g1, g2]);
    else if (x[1] === 2) ev.push([x[0], "ct", ri(0, 2), shooter(opp), gk ? gk.ln : "—", g1, g2]);
    else ev.push([x[0], "yc", 0, helper(xi, ""), "", g1, g2]);
  });
  if (!half) ev.push([45, "ht", 0, "", "", g1, g2]);
  ev.push([90, "ft", 0, "", "", g1, g2]);
  if (rec.et) ev.push([120, "et", 0, "", "", rec.gu + rec.eu, rec.gt + rec.ett]);
  if (rec.p) ev.push([121, "pen", 0, "", "", rec.p[0], rec.p[1]]);
  if (ogk) ev.forEach(function (e) { if (e[1] === "cu" && e[2] === 1) e[4] = ogk.ln; });
  return ev;
}
function mpNatLog(o) {
  var nt = mpNT(), pool = mpNatPool(nt.ni), sq = mpNatXI(mpNatSquad(), pool).xi;
  var rec = {y: S.yr, w: S.w, opp: o.opp, cmp: o.cmp, rn: o.rn || "", h: o.h, gu: o.gu, gt: o.gt, eu: o.eu || 0, ett: o.ett || 0, et: !!o.et, p: o.p || null};
  rec.ev = mpNatEvents(rec, sq.map(function (x) { return {ln: x.ln, pos: x.pos}; }), mpOppNames(o.opp));
  var a = rec.gu + rec.eu, b = rec.gt + rec.ett;
  rec.r = a > b ? 1 : a < b ? -1 : rec.p ? (rec.p[0] > rec.p[1] ? 1 : -1) : 0;
  var k = rec.r > 0 ? "w" : rec.r < 0 ? "l" : "d";
  nt[k]++; nt.s = nt.s || {w: 0, d: 0, l: 0}; nt.s[k]++;
  nt.log.unshift(rec); if (nt.log.length > 8) nt.log.length = 8;
  notify("🏳️ " + resLine(a, b, natName(o.opp), rec.p), "res", {r: rec.r});
  return rec;
}
function mpNatPlay(o) {
  var nt = mpNT(), rt = mpNatRating(), ro = S.nr[o.opp], g;
  if (o.h === 1) g = simGoals(rt, ro, 1);
  else if (o.h === 0) { g = simGoals(ro, rt, 1); g = [g[1], g[0]]; }
  else g = simGoals(rt, ro, 0);
  return mpNatLog({opp: o.opp, cmp: o.cmp, h: o.h, gu: g[0], gt: g[1]});
}
function mpNatCmpName(rec) {
  if (rec.cmp === "q") return tr("Clasificación");
  if (rec.cmp === "f") return tr("Amistoso");
  return trComp(String(rec.cmp).replace(/ \d{4}$/, ""));
}
/* texto de un acontecimiento de la narración */
MPH.mpnatoff = {
  fixed: true,
  head: function (x) { var ni = x.list[0], m = S.m;
    var txt = x.list.length > 1 ? tr("Dos federaciones te quieren como seleccionador: {a} (nivel {ra}) y {b} (nivel {rb}).", {a: natName(x.list[0]), ra: Math.round(S.nr[x.list[0]]), b: natName(x.list[1]), rb: Math.round(S.nr[x.list[1]])})
      : tr("La federación de {nat} (nivel {r}) te quiere como seleccionador.", {nat: natName(ni), r: Math.round(S.nr[ni])});
    txt += " " + (S.g === "f" ? tr("Dirigirías a la selección femenina hasta {y}.", {y: S.yr + 3}) : tr("Dirigirías a la selección hasta {y}.", {y: S.yr + 3}));
    txt += " " + (m.club >= 0 ? tr("Puedes compaginarlo con el {club} o dejar el club y dedicarte en exclusiva.", {club: clubName(m.club)}) : tr("Ahora mismo no tienes club: sería tu único trabajo."));
    return {tag: "real", tagTxt: tr("Selección"), cls: "", cat: tr("Federación"), title: tr("Llamada de la federación"), text: txt}; },
  opts: function (x) {
    var m = S.m, out = [];
    x.list.forEach(function (ni) {
      if (m.club >= 0) out.push({t: tr("Aceptar {nat} y compaginarlo con el club", {nat: natName(ni)}), d: tr("{sal}/año extra · la directiva prefiere que no te distraigas", {sal: fmtMoney(mpNatSal(ni, false))}),
        ok: {txt: tr("Serás club y selección a la vez."), fx: {board: -3, rep: 2}, then: function () { mpNatTake(ni, false); }}});
      out.push({t: m.club >= 0 ? tr("Aceptar {nat} en exclusiva (dejas el club)", {nat: natName(ni)}) : tr("Aceptar {nat}", {nat: natName(ni)}), d: tr("{sal}/año", {sal: fmtMoney(mpNatSal(ni, true))}),
        ok: {txt: tr("Te dedicas en cuerpo y alma a la selección."), fx: {rep: 3}, then: function () { mpNatTake(ni, true); }}});
    });
    out.push({t: tr("Rechazar la oferta"), ok: {txt: tr("Agradeces la llamada, pero no es el momento."), fx: m.club >= 0 ? {board: 2} : {}}});
    return out;
  }
};
MPH.mpnatm = {
  fixed: true,
  head: function (x) { var nt = mpNT();
    return {tag: "hot", tagTxt: tr("Selección"), cls: "hotc", hot: true, cat: x.cmp === "q" ? tr("Partido de clasificación") : tr("Amistoso internacional"),
      title: tr("{us} contra {them}", {us: natName(nt.ni), them: natName(x.opp)}),
      text: tr("Ventana internacional. Tu selección llega con un nivel de {a} frente a {b}, {where}. ¿Lo ves en directo o lo simulas?", {a: Math.round(mpNatRating()), b: Math.round(S.nr[x.opp]), where: x.h === 1 ? tr("en casa") : tr("a domicilio")})}; },
  opts: function () { return [
    {t: tr("Ver el partido en directo"), d: tr("Narración minuto a minuto."), live: 1, ok: {txt: ""}},
    {t: tr("Simular el partido"), ok: {txt: ""}}
  ]; },
  apply: function (x, o) {
    var rec = mpNatPlay({opp: x.opp, cmp: x.cmp, h: x.h});
    x.rec = rec;
    if (o.live) S.mpLive = 0;
    return [["note", 0, natName(mpNT().ni) + " " + rec.gu + "-" + rec.gt + " " + natName(x.opp)]];
  },
  card: function (x, o, res, chips) { var rec = x.rec, nt = mpNT();
    return {t: "decision", tipo: "mgr", cat: tr("Selección"), title: mpNatLabel(nt.ni), choice: o.t,
      txt: rec.r > 0 ? tr("Victoria {a}-{b} ante {opp}.", {a: rec.gu, b: rec.gt, opp: natName(x.opp)}) : rec.r < 0 ? tr("Derrota {a}-{b} ante {opp}.", {a: rec.gu, b: rec.gt, opp: natName(x.opp)}) : tr("Empate {a}-{b} ante {opp}.", {a: rec.gu, b: rec.gt, opp: natName(x.opp)}),
      chips: chips, good: rec.r > 0 ? true : rec.r < 0 ? false : null, y: S.yr}; }
};
/* ventana internacional: tu selección también juega */
(function () {
  var _iw = mgrIntlWindow;
  mgrIntlWindow = function () { var r = _iw.apply(this, arguments); try { if (mpNT()) mpNatWindow(); } catch (e) { mpErr(e); } return r; };
  var _pf = mgrPlayFixture;
  mgrPlayFixture = function (f) {
    if (f && f.st == null && mpOn()) {
      var hold = false;
      S.pend.forEach(function (x) { if (x.k === "mpnatm" && !x.held) { x.held = true; hold = true; } });
      if (hold) return "pause";
    }
    return _pf.apply(this, arguments);
  };
  /* torneos de verano: el nivel de tu selección sale de tu convocatoria y cada partido queda narrado */
  var _sim = simFixture;
  simFixture = function (f) {
    var nt = mpNT(), c = nt ? compOfFixture(f) : null;
    if (!nt || !c || !c.nat || (f.h !== nt.ni && f.a !== nt.ni)) return _sim.apply(this, arguments);
    var keep = S.nr[nt.ni], res;
    try { S.nr[nt.ni] = mpNatRating(); } catch (e) { mpErr(e); }
    try { res = _sim.apply(this, arguments); } finally { S.nr[nt.ni] = keep; }
    try {
      var home = f.h === nt.ni;
      mpNatLog({opp: home ? f.a : f.h, cmp: c.n, rn: f.rn || (f.kind === "tb" ? N_("Fase de grupos") : ""), h: f.neutral ? 2 : home ? 1 : 0,
        gu: home ? res.gh : res.ga, gt: home ? res.ga : res.gh, eu: home ? res.eh : res.ea, ett: home ? res.ea : res.eh, et: !!res.et,
        p: res.ph != null ? (home ? [res.ph, res.pa] : [res.pa, res.ph]) : null});
    } catch (e) { mpErr(e); }
    return res;
  };
  var _sd = mgrSummerDone;
  mgrSummerDone = function () {
    try {
      var nt = mpNT();
      if (nt) (S.sumMade || []).forEach(function (k) {
        var c = S.C[k]; if (!c || !c.nat || !c.teams || c.teams.indexOf(nt.ni) < 0) return;
        if (c.win === nt.ni) { nt.tro++; mgrAddTrophy(k, c.n); S.bnews.push({t: "trophy", x: tr("¡CAMPEONES! {nat} gana el {comp}.", {nat: natName(nt.ni), comp: trComp(c.n)})}); }
        else S.bnews.push({t: "ok", x: tr("{nat} en el {comp}: {stage}.", {nat: natName(nt.ni), comp: trComp(c.n), stage: lcT(tr(stageReached(c, nt.ni)))})});
      });
    } catch (e) { mpErr(e); }
    return _sd.apply(this, arguments);
  };
})();
/* seleccionador en exclusiva: el mundo avanza sin banquillo de club */
function mpClublessBlock() {
  var m = S.m, b = BLOCKS[S.bi];
  S.blog = []; S.bnews = []; m.mk.open = "";
  for (var w = b[0]; w <= b[1]; w++) {
    S.w = w; S.tw++;
    weekFixtures(w).forEach(function (f) { if (f.kind !== "nq") recordFixture(f, simFixture(f)); });
    if (INTL_W.indexOf(w) >= 0) mpNatWindow();
  }
  feed({t: "decision", tipo: "mgr", cat: tr("Selección"), title: tr("{block} sin club", {block: tr(b[2])}), choice: mpNatLabel(mpNT().ni), txt: tr("Sigues el fútbol de clubes desde la grada y preparas las próximas convocatorias."), chips: [], y: S.yr});
  if (S.bi < 4) { S.bi++; S.ph = "gap"; return; }
  seasonEndWorld();
  pruneComps([]);
  S.ph = "post";
  mpNatSeasonEnd();
  if (mpClubless()) { var jo = mgrJobOffers(false); if (jo.length) S.pend.push(mp("jobs", {list: jo, forced: false})); }
}
function mpClublessSeason() {
  var m = S.m;
  S.yr++; m.age++;
  S.w = 0; S.bi = 0; S.cur = null;
  S.L = W.lg.map(function (l, li) { return newLeagueSeason(li); });
  setupSeasonComps();
  m.mk = {open: "", list: [], tx: []}; m.objs = [];
  S.ph = "pre"; S.pend = [];
  feed({t: "decision", tipo: "mgr", cat: tr("Selección"), title: tr("Temporada {season}", {season: seasonLabel(S.yr)}), choice: mpNatLabel(mpNT().ni), txt: tr("Una temporada más como seleccionador en exclusiva."), chips: [], y: S.yr});
}
(function () {
  var _adv = mgrAdvance;
  mgrAdvance = function () {
    if (mpClubless()) {
      mgrCleanPend();
      if (S.pend.length) return;
      if (S.ph === "pre" || S.ph === "gap") { mpClublessBlock(); mgrCleanPend(); return; }
      if (S.ph === "off") { mpClublessSeason(); mgrCleanPend(); return; }
    }
    return _adv.apply(this, arguments);
  };
})();

/* ============ 5) CHARLAS RÁPIDAS ============ */
function mpQtIssue(p) {
  var m = S.m;
  if (!p || p.loanOut || m.club < 0) return null;
  if (p.req) return "req";
  var games = m.ss ? m.ss.w + m.ss.d + m.ss.l : 0, share = games ? p.st.min / (games * 90) : 1, avail = p.inj <= S.tw;
  if (avail && ((games >= 3 && share < ROLES[p.role].s - 0.15 && (p.role === "C" || p.role === "I" || p.mor < 55)) || p.mor < 40)) return "min";
  if (p.yrs <= 1 && !p.noRenew && !p.loanIn && (p.role === "C" || p.role === "I" || p.mor < 55)) return "con";
  return null;
}
function mpQtOpts(p, k) {
  var low = ROLE_ORDER[Math.min(ROLE_ORDER.length - 1, ROLE_ORDER.indexOf(p.role) + 1)];
  if (k === "min") return [
    {k: "prom", t: tr("Prometerle minutos"), fx: {pmor: 12}, n: tr("Si no juega, se sentirá engañado")},
    {k: "pac", t: tr("Pedirle paciencia"), fx: {pmor: p.tr === "profesional" ? 7 : 4, chem: 1}},
    {k: "role", t: tr("Ajustarle el rol con sinceridad"), fx: {pmor: low === p.role ? 2 : -2}, n: low === p.role ? null : tr("{name} pasa a {role}", {name: plShort(p), role: lcT(tr(ROLES[low].n))})}
  ];
  if (k === "con") return [
    {k: "renew", t: tr("Prometerle la renovación"), fx: {pmor: 6}, n: tr("Abres ahora la negociación")},
    {k: "wait", t: tr("Que espere a final de temporada"), fx: {pmor: -3}},
    {k: "bye", t: tr("Decirle que no seguirá"), fx: {pmor: -8}, n: tr("Se irá libre al acabar su contrato")}
  ];
  return [
    {k: "stay", t: tr("Convencerle para que se quede"), fx: {pmor: 10}, n: tr("Deja de pedir salir")},
    {k: "list", t: tr("Ponerle en la lista de venta"), fx: {pmor: 5}, n: tr("{name} pasa a estar en venta", {name: plShort(p)})},
    {k: "hard", t: tr("Mano dura: aquí manda el club"), fx: {pmor: -6, chem: 1}}
  ];
}
function mpQtCan(p) { return !!p && p.qtT !== mpNow() && !!mpQtIssue(p); }
function mpQtPreview(p, o) { return mgrFxPreview(o.fx, p.id).concat(o.n ? [["note", 0, o.n]] : []); }
function mpQuickTalk(pid, i) {
  var p = mPl(pid); if (!mpQtCan(p)) return null;
  var k = mpQtIssue(p), o = mpQtOpts(p, k)[i]; if (!o) return null;
  var ch = mgrFx(o.fx, p.id);
  switch (o.k) {
    case "prom": p.prom = "C"; break;
    case "role": var low = ROLE_ORDER[Math.min(ROLE_ORDER.length - 1, ROLE_ORDER.indexOf(p.role) + 1)]; if (low !== p.role) { p.role = low; ch.push(["prole", 0, tr("{name} pasa a {role}", {name: plShort(p), role: lcT(tr(ROLES[low].n))})]); } break;
    case "renew": p.rnT = null; mgrStartRenew(p.id); break;
    case "bye": p.noRenew = true; ch.push(["note", 0, tr("Se irá libre al acabar su contrato")]); break;
    case "stay": p.req = false; break;
    case "list": p.list = true; p.req = false; break;
  }
  if (o.n && o.k !== "bye" && o.k !== "role") ch.push(["note", 0, o.n]);
  p.qtT = mpNow();
  var card = {t: "decision", tipo: "mgr", cat: tr("Vestuario"), title: tr("Charla rápida con {name}", {name: plName(p)}), choice: o.t, txt: tr("Dos minutos en el vestuario."), chips: ch, y: S.yr};
  feed(card);
  return card;
}

/* ============ decisiones válidas y enganches de temporada ============ */
function mpPendValid(x) {
  var m = S.m;
  switch (x.k) {
    case "mploanin": var t = mgrTarget(x.tid); return mpLoanInOk(t);
    case "mploanopt": var p = mPl(x.pid); return !!(p && p.loanIn && p.loanIn.k === "opt" && m.club >= 0);
    case "mpnatoff": return !!(x.list && x.list.length && !(m.xp && m.xp.nt));
    case "mpnatm": return !!mpNT() && x.opp != null;
    case "mpfilup": var f = mpFil(); return !!(f && f.par === x.par && S.cl[x.par] >= 0);
  }
  return false;
}
(function () {
  var _join = mgrJoinClub;
  mgrJoinClub = function (c, o) {
    var r = _join.apply(this, arguments);
    try {
      var x = mpX(), nf = MP_NEXT_FIL; MP_NEXT_FIL = null;
      var par = nf && nf.club === c ? nf.par : mpParentOf(c);
      if (par >= 0 && par !== c && S.cl[par] >= 0 && S.cl[par] !== S.cl[c] && (mpTopLg(par) || (nf && nf.club === c))) { x.fil = {club: c, par: par}; mpFilSnap(); }
      else if (x.fil && x.fil.club !== c) delete x.fil;
      if (x.nt && x.nt.ex) x.nt.ex = false;
      /* llegas sin club en pretemporada: se abre el mercado de verano */
      if (S.ph === "pre" && !S.m.mk.open) S.m.mk = {open: "verano", list: mgrScoutList(14), tx: []};
    } catch (e) { mpErr(e); }
    return r;
  };
  var _mss = mgrStartSeason;
  mgrStartSeason = function () {
    if (mpClubless()) return mpClublessSeason();
    try { if (mpOn()) mpLoanCleanup(); } catch (e) { mpErr(e); }
    var r = _mss.apply(this, arguments);
    try { if (mpOn() && S.m.club >= 0) { mpScPay(); mpScRun(true); mpFilSnap(); } } catch (e) { mpErr(e); }
    return r;
  };
  var _bd = mgrBlockDone;
  mgrBlockDone = function () {
    try { if (mpOn() && S.m.club >= 0) mpScRun(false); } catch (e) { mpErr(e); }
    return _bd.apply(this, arguments);
  };
  var _se = mgrSeasonEnd;
  mgrSeasonEnd = function () {
    var fil = null;
    try { if (mpFil()) { fil = {club: S.m.club, par: mpFil().par, met: mpFilProgress().filter(function (o) { return o.met; }).length}; } } catch (e) { mpErr(e); }
    var r = _se.apply(this, arguments);
    try {
      if (mpOn() && S.ph === "post") {
        if (fil && S.m.club === fil.club && (fil.met >= 3 || (fil.met === 2 && chance(0.65)))) S.pend.push(mp("mpfilup", {par: fil.par, met: fil.met}));
        mpNatSeasonEnd();
        if (!mpNT()) mpNatOffer(false);
      }
    } catch (e) { mpErr(e); }
    return r;
  };
})();
