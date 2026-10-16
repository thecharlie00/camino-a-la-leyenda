/* week29.js — versión 2.9 «La semana de trabajo» (modo míster y «Crea tu club»).
   - Carga de entrenamiento semanal: suave, normal o intensa (recuperación, lesiones, progresión y ánimo).
   - Preparación de cada partido según el rival, con informe del rival.
   - Cuerpo técnico: segundo entrenador, preparador físico y médico (1–5 estrellas).
   - Estilos y roles: bloque bajo y laterales invertidos.
   Todo vive en S.m.wk; los efectos son pequeños y compensados para no romper el equilibrio. */
var WK_LOAD = [
  {n: N_("Suave"), d: N_("Recuperan más y se lesionan menos, pero progresan algo menos.")},
  {n: N_("Normal"), d: N_("Equilibrio entre progresión y descanso.")},
  {n: N_("Intensa"), d: N_("Progresan más, pero se cansan y se lesionan más. Al vestuario no le encanta.")}
];
var WK_PREP = {
  gen: {n: N_("General"), d: N_("Sin plan específico."), fx: [1, 1]},
  def: {n: N_("Frenar su ataque"), d: N_("Encajas menos, generas algo menos."), fx: [0.98, 0.92], vs: "ofe"},
  att: {n: N_("Atacar su punto débil"), d: N_("Más ocasiones a favor, algo más expuesto."), fx: [1.08, 1.02], vs: "def"},
  sp: {n: N_("Balón parado"), d: N_("Jugadas ensayadas: un pequeño plus en las dos áreas."), fx: [1.04, 0.97], vs: "pos"},
  fresh: {n: N_("Dosificar esfuerzos"), d: N_("Menos desgaste físico; algo menos de chispa."), fx: [0.98, 1], vs: "con"}
};
var WK_STYLE = {
  ofe: {n: N_("ofensivo"), w: N_("deja espacios atrás")},
  def: {n: N_("muy defensivo"), w: N_("le cuesta salir jugando")},
  con: {n: N_("de contraataque"), w: N_("sufre si le quitas la pelota y le obligas a atacar")},
  pos: {n: N_("de posesión"), w: N_("defiende mal el balón parado")}
};
var WK_STAFF = {
  as: {n: N_("Segundo entrenador"), d: N_("Mejora la preparación de los partidos y los informes del rival.")},
  fis: {n: N_("Preparador físico"), d: N_("Más recuperación y menos lesiones.")},
  med: {n: N_("Médico"), d: N_("Las lesiones duran menos.")}
};
function wkOf() {
  var m = S.m; if (!m) return null;
  if (!m.wk) m.wk = {load: 1, prep: "gen", low: 0, inv: 0, staff: {as: 2, fis: 2, med: 2}};
  return m.wk;
}
function wkOn() { return !!(S && S.mode === "mgr" && S.m && S.m.club >= 0); }
/* estilo del rival: estable por club, con sesgo según su nivel */
function wkOppStyle(c) {
  var k = ["ofe", "def", "con", "pos"], i = hashStr("wk" + c) % 4, r = S.cr[c] || 60;
  if (r >= 80 && i === 1) i = 3; if (r <= 60 && i === 3) i = 2;
  return k[i];
}
/* el segundo entrenador acierta más con más estrellas */
function wkReport(c) {
  var w = wkOf(), st = wkOppStyle(c), lv = w.staff.as, rec = null;
  Object.keys(WK_PREP).forEach(function (k) { if (WK_PREP[k].vs === st) rec = k; });
  return {style: st, sure: lv >= 3, weak: lv >= 3 ? WK_STYLE[st].w : null, rec: lv >= 2 ? rec : null};
}
function wkStaffCost(k) {
  var w = wkOf(), lv = w.staff[k] + 1, base = mBudgetFor(S.m.club);
  return Math.max(2e4, Math.round(base * 0.006 * lv * lv / 1e4) * 1e4);
}
function wkHire(k) {
  var w = wkOf(), m = S.m;
  if (!WK_STAFF[k] || w.staff[k] >= 5) return {max: true};
  var cost = wkStaffCost(k);
  if (m.bud < cost) return {poor: true, cost: cost};
  m.bud -= cost; w.staff[k]++;
  return {ok: true, cost: cost, lv: w.staff[k]};
}
/* ---- efectos que lee el motor ---- */
function wkRecK() { if (!wkOn()) return 0; var w = wkOf(); return [3, 0, -2][w.load] + (w.staff.fis - 2) * 0.7; }
function wkInjK() { if (!wkOn()) return 1; var w = wkOf(); return [0.8, 1, 1.25][w.load] * (1 - (w.staff.fis - 2) * 0.06); }
function wkGrowK() { if (!wkOn()) return 1; return [0.85, 1, 1.2][wkOf().load]; }
function wkFitK(f) { return f && f.prep === "fresh" ? 0.7 : 1; }
function wkMul(f) {
  if (!f || !f.wk) return [1, 1];
  var w = f.wk, P = WK_PREP[w.prep] || WK_PREP.gen, k = 0.6 + 0.2 * w.as, a = 1, b = 1;
  var match = P.vs && P.vs === f.ostyle ? 1.35 : 1;
  a *= 1 + (P.fx[0] - 1) * k * (P.fx[0] > 1 ? match : 1);
  b *= 1 + (P.fx[1] - 1) * k * (P.fx[1] < 1 ? match : 1);
  if (w.low) { var under = f.or > f.tr + 3; a *= under ? 0.92 : 0.9; b *= under ? 0.76 : 0.82; }
  if (w.inv) { a *= 1.04; b *= f.ostyle === "con" ? 1.06 : 1.0; }
  return [a, b];
}
(function () {
  if (typeof mLambdas !== "function") return;
  var _lam = mLambdas;
  mLambdas = function (f) { var L = _lam.apply(this, arguments), k = wkMul(f); return [L[0] * k[0], L[1] * k[1]].concat(L.slice(2)); };
  var _prep = mgrPrepFixture;
  mgrPrepFixture = function (f) {
    var r = _prep.apply(this, arguments);
    if (wkOn()) {
      var w = wkOf();
      f.ostyle = wkOppStyle(f.opp); f.prep = w.prep;
      f.wk = {prep: w.prep, as: w.staff.as, low: w.low, inv: w.inv};
      if (w.low && !f.tac) f.tac = {line: 0, width: 1, pass: 2, tempo: 1};
      else if (w.inv && !f.tac) f.tac = {line: 1, width: 0, pass: 0, tempo: 1};
      /* informe del rival antes de los partidos importantes */
      if (f.imp >= 2 && typeof notify === "function") {
        var rp = wkReport(f.opp);
        notify(tr("Informe del rival: el {opp} es un equipo {st}.", {opp: clubName(f.opp), st: tr(WK_STYLE[rp.style].n)}) + (rp.weak ? " " + tr("Punto débil: {w}.", {w: tr(rp.weak)}) : "") +
          (rp.rec ? " " + tr("Tu segundo recomienda: {p}.", {p: tr(WK_PREP[rp.rec].n)}) : ""), "info");
      }
    }
    return r;
  };
  var _inj = mInjure;
  mInjure = function (p) {
    var t0 = p.inj, r = _inj.apply(this, arguments);
    if (wkOn() && p.inj > S.tw) {
      var lv = wkOf().staff.med, wks = p.inj - Math.max(t0 || 0, S.tw), cut = Math.floor(wks * (lv - 2) * 0.1);
      if (cut > 0) p.inj -= Math.min(cut, wks - 1);
    }
    return r;
  };
  var _gr = mgrGrowth;
  mgrGrowth = function () {
    var k = wkGrowK(), before = {};
    if (k !== 1 && S.m) S.m.sq.forEach(function (p) { before[p.id] = p.ovr; });
    var r = _gr.apply(this, arguments);
    if (k !== 1 && S.m) S.m.sq.forEach(function (p) { var o = before[p.id]; if (o != null && p.ovr > o) p.ovr = o + (p.ovr - o) * k; });
    return r;
  };
  var _ew = mgrEndWeek;
  mgrEndWeek = function () {
    var r = _ew.apply(this, arguments);
    if (wkOn()) {
      var w = wkOf(), rk = wkRecK(), mk = [0.3, 0, -0.4][w.load];
      S.m.sq.forEach(function (p) { if (p.loanOut) return; p.fit = clamp(p.fit + rk, 0, 100); p.mor = clamp(p.mor + mk, 0, 100); });
    }
    return r;
  };
})();
