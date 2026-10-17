/* market26.js — mercado útil y equilibrado (parche 2.6).
   La lista de traspasos y los informes de los ojeadores proponen jugadores que mejoran o complementan
   a tus titulares, y el precio y la ficha crecen con lo que aportan y con el presupuesto del club. */

/* nivel del titular que ocupa (o cubriría) esa posición */
function mStarterOvr(pos) {
  var m = S.m, slots = FORMATIONS[m.form] || [], best = 0;
  (m.xi || []).forEach(function (id, i) { var p = id != null ? mPl(id) : null; if (p && slots[i] === pos) best = Math.max(best, p.ovr); });
  if (best) return best;
  (m.xi || []).forEach(function (id, i) { var p = id != null ? mPl(id) : null; if (p && slots[i] && posOk(pos, slots[i])) best = Math.max(best, p.ovr); });
  if (best) return best;
  mActive().forEach(function (p) { if (p.pos === pos) best = Math.max(best, p.ovr); });
  return best || mSquadAvg() - 2;
}
/* tres perfiles: mejora inmediata, veterano a buen precio y promesa que complementa */
function mkKind() { var x = R(); return x < 0.55 ? "up" : x < 0.75 ? "vet" : "pro"; }
function mkBand(kind, st) {
  if (kind === "up") return {lo: st + 0.8, hi: st + 4.5, a0: 23, a1: 30};
  if (kind === "vet") return {lo: st + 0.3, hi: st + 3.2, a0: 30, a1: 33};
  return {lo: st - 5, hi: st - 1, a0: 18, a1: 21};
}
function mkClubsFor(ovr, from) {
  var m = S.m, base = from || clubsWhere(function (c) { return c !== m.club; });
  for (var w = 3; w <= 12; w += 3) {
    var l = base.filter(function (c) { return c !== m.club && S.cr[c] >= ovr - w - 2 && S.cr[c] <= ovr + w; });
    if (l.length >= 3) return l;
  }
  return base.filter(function (c) { return c !== m.club; });
}
/* un objetivo útil para pos; pool opcional = clubes donde busca el ojeador */
function mkSmartTarget(pos, kind, pool, bonus) {
  var st = mStarterOvr(pos), b = mkBand(kind, st), want = rf(b.lo, b.hi) + (bonus || 0) * 0.3;
  want = clamp(want, 45, 92);
  var clubs = mkClubsFor(want, pool);
  if (!clubs.length) return null;
  /* primero un jugador real que encaje en la horquilla */
  for (var k = 0; k < 4; k++) {
    var c = pick(clubs), rt = chance(0.85) ? realTargetFor(c, pos, kind === "pro") : null;
    if (rt && rt.ovr >= b.lo - 0.5 && rt.ovr <= b.hi + 1.5 && (kind !== "pro" || rt.pot == null || rt.pot >= st + 2)) return mkFinish(mgrNewTarget(Object.assign({club: c}, rt)), st);
  }
  var age = ri(b.a0, b.a1), o = {pos: pos, age: age, ovr: round1(want + gauss() * 0.4), club: pick(clubs), ni: null};
  o.ni = mNat(W.clubs[o.club].ci);
  if (kind === "pro") o.pot = round1(Math.min(94, Math.max(st + rf(3, 9), o.ovr + 4)));
  return mkFinish(mgrNewTarget(o), st);
}
/* precio y ficha proporcionales a lo que aporta y al presupuesto del club */
function mkFinish(t, st) {
  var m = S.m, rel = t.ovr - st, bud = Math.max(m.bud, 5e5);
  t.mk = {st: Math.round(st), rel: round1(rel)};
  if (t.club >= 0) {
    var lo, hi;
    if (rel >= 0) { lo = bud * (0.15 + 0.12 * rel); hi = bud * (0.45 + 0.2 * rel); }
    else { lo = bud * 0.05; hi = bud * (0.18 + 0.05 * Math.max(0, (t.pot || t.ovr) - st)); }
    if (t.age >= 31) hi *= 0.7;
    t.ask = Math.max(1e5, Math.round(clamp(t.ask, lo, Math.max(lo, hi)) / 1e5) * 1e5);
  }
  /* la ficha se mide con la de tus mejor pagados */
  var top = mActive().map(function (p) { return p.sal; }).sort(function (a, b) { return b - a; })[0] || t.sal;
  var cap = rel >= 0 ? top * clamp(0.85 + 0.1 * rel, 0.85, 1.35) : top * 0.45;
  t.sal = Math.max(8000, Math.round(Math.min(t.sal * clamp(1 + 0.05 * Math.max(0, rel), 1, 1.3), cap) / 1000) * 1000);
  return t;
}
/* necesidades según los puestos reales de tu once: titular flojo, falta de recambio o veteranía */
function mkNeeds() {
  var m = S.m, slots = FORMATIONS[m.form] || [], act = mActive(), avg = mSquadAvg(), needs = {};
  POS_ORDER.forEach(function (pos) { needs[pos] = 0.2; });
  slots.forEach(function (pos) {
    var st = mStarterOvr(pos), deep = act.filter(function (p) { return posOk(p.pos, pos); }).length;
    var n = 1 + Math.max(0, avg - st) / 1.5 + (deep < 3 ? 1 : 0) + (act.some(function (p) { return p.pos === pos && p.age >= 32; }) ? 0.6 : 0);
    needs[pos] = Math.max(needs[pos], n);
  });
  return needs;
}
/* lista del mercado: mitad o más asequible, todos útiles */
function mgrScoutList(n) {
  var m = S.m, needs = mkNeeds(), out = [], guard = 0;
  while (out.length < n && guard++ < n * 4) {
    var pos = wpick(Object.keys(needs), function (k) { return needs[k]; });
    var t = mkSmartTarget(pos, mkKind());
    if (!t || out.some(function (x) { return x.rid && x.rid === t.rid; })) continue;
    out.push(t);
  }
  /* si casi nada cabe en el presupuesto, añade alternativas veteranas más baratas */
  var cheap = out.filter(function (t) { return t.ask <= m.bud; }).length;
  for (var g = 0; cheap < Math.ceil(n / 2) && g < 6; g++) {
    var p2 = wpick(Object.keys(needs), function (k) { return needs[k]; }), t2 = mkSmartTarget(p2, "vet");
    if (t2 && t2.ask <= m.bud) { out.push(t2); cheap++; }
  }
  for (var j = 0; j < 2; j++) {
    var p3 = wpick(Object.keys(needs), function (k) { return needs[k]; }), s3 = mStarterOvr(p3);
    out.push(mkFinish(mgrNewTarget({pos: p3, age: ri(30, 34), ovr: clamp(s3 + rf(-0.5, 2), 45, 90), club: -1, ni: mNat(W.clubs[m.club].ci)}), s3));
  }
  return out;
}
/* los ojeadores también traen perfiles útiles dentro de su región */
if (typeof mpMakeTarget === "function") {
  mpMakeTarget = function (club, pos, young, bonus) {
    var all = typeof mpRegClubs === "function" && mpMakeTarget._reg ? mpRegClubs(mpMakeTarget._reg) : null;
    var t = mkSmartTarget(pos, young ? "pro" : chance(0.25) ? "vet" : "up", all && all.length ? all : null, bonus);
    if (t) return t;
    var o = {pos: pos, age: young ? ri(18, 22) : ri(23, 32), ovr: clamp(S.cr[club] + gauss() * 2, 45, 92), club: club, ni: mNat(W.clubs[club].ci)};
    return mkFinish(mgrNewTarget(o), mStarterOvr(pos));
  };
}
if (typeof mpScReport === "function") {
  var mpScReport0 = mpScReport;
  mpScReport = function (s, n) { mpMakeTarget._reg = s.reg; try { return mpScReport0(s, n); } finally { mpMakeTarget._reg = null; } };
}
/* QA: en la lista del mercado no puede haber dos jugadores con el mismo nombre visible (inicial + apellido) */
(function () {
  if (typeof mgrScoutList !== "function") return;
  var _sl = mgrScoutList;
  mgrScoutList = function () {
    var l = _sl.apply(this, arguments);
    try {
      var key = function (x) { return (x.fn || "").charAt(0) + "." + x.ln; }, taken = {};
      (S.m.sq || []).forEach(function (x) { taken[key(x)] = 1; });
      (l || []).forEach(function (t) {
        for (var i = 0; i < 6 && taken[key(t)]; i++) { var nm = mName(t.nat); t.fn = nm.fn; t.ln = nm.ln; }
        taken[key(t)] = 1;
      });
    } catch (e) {}
    return l;
  };
})();
