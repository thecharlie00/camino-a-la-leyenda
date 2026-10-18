/* blp47.js — «Sin rachas eternas» (versión 4.7): protección contra las malas rachas.
   Principio: nada se amaña a escondidas. Cada ayuda se anuncia en las noticias o en una tarjeta,
   y casi todas son una decisión del jugador.

   Jugador
   · Oportunidad del míster: tras 4 partidos de club seguidos sin jugar (suplente sin salir o menos de 15 min),
     cada partido añade un 12 % de opciones de ser titular (máx. 60 %). A los 5 puedes hablar con el míster.
   · Confianza en el minijuego: cada fallo seguido suma +4 al tiro (o a la parada) del siguiente, máx. +12.
   · Mercado: un verano sin ofertas jugando poco, tu agente consigue al menos un club que te quiere de titular.
   · Lesiones (engine-player.js, alta médica): tras 4+ semanas de baja vuelves con moral y forma.
   Míster
   · Ultimátum: la primera vez que la directiva te despediría, te da un tramo para sumar una media de puntos
     (según lo que se espera del club). Si la alcanzas, recuperas crédito; si no, te despide.
     Una vez por temporada y club; no hay segundo ultimátum seguido.
   · Conjura: a los 5 y 9 partidos sin ganar, el vestuario se conjura (+0,8 de nivel el resto del tramo).

   Estado en S.blp = {bench, mg, mwl, askY} y S.m.ult = {club, y, bi, need, st: "on"|"ok"|"fail", b0}. */

var BLP = {benchFrom: 4, benchStep: 0.12, benchMax: 0.6, benchAsk: 5, mgStep: 4, mgMax: 12, wl: [5, 9], wlBuff: 0.8};
function blpOf() { if (!S.blp) S.blp = {bench: 0, mg: 0, mwl: 0, askY: -1}; return S.blp; }

/* ---------- jugador: minutos ---------- */
function blpBenchChance(n) { return n >= BLP.benchFrom ? Math.min(BLP.benchMax, BLP.benchStep * (n - BLP.benchFrom + 1)) : 0; }
(function () {
  if (typeof selection !== "function") return;
  var _sel = selection;
  selection = function (f, c, trr, or, nat) {
    var r = _sel.apply(this, arguments);
    if (nat || r === "start" || !S.p || (S.p.flags && S.p.flags.frozen)) return r;
    var b = blpOf();
    if (b.promise) { b.promise = 0; f.blpGive = "promise"; return "start"; }
    if (b.bench >= BLP.benchFrom && chance(blpBenchChance(b.bench))) { f.blpGive = "pity"; return "start"; }
    return r;
  };
})();
(function () {
  if (typeof finishPlayer !== "function") return;
  var _fin = finishPlayer;
  finishPlayer = function (f) {
    var out = _fin.apply(this, arguments);
    if (!f || f.isNat || !S.p) return out;
    var b = blpOf(), was = b.bench;
    if (f.role === "bench" || (f.role === "sub" && f.min < 15)) b.bench++;
    else if (f.role === "start" || f.role === "sub") b.bench = 0;
    if (f.blpGive && S.bnews) S.bnews.push({t: "ok", x: f.blpGive === "promise" ? tr("El míster cumple su palabra: eres titular.") : trn(was, "El míster te da una oportunidad tras {n} partido sin jugar.", "El míster te da una oportunidad tras {n} partidos sin jugar.")});
    if (b.bench === BLP.benchAsk && b.askY !== S.yr && !(S.p.flags && S.p.flags.frozen) && !S.pend.some(function (x) { return x.k === "blpbench"; })) {
      b.askY = S.yr; S.pend.push({k: "blpbench", n: b.bench});
    }
    return out;
  };
})();
var BLP_BENCH_OPTS = [
  {t: N_("Pedir explicaciones al míster"), d: N_("Te promete minutos en el próximo partido, aunque no le hace gracia."), fx: {coach: -3}, promise: true},
  {t: N_("Callar y entrenar el doble"), d: N_("Más confianza del míster y más forma, a costa de cansancio."), fx: {coach: 6, form: 4, fit: -5}},
  {t: N_("Pedirle a tu agente una salida"), d: N_("Más clubes se interesarán por ti en el próximo mercado. En el vestuario no gusta."), fx: {coach: -4, fans: -2, flag: {wantOut: true}}}
];
if (typeof EX_PEND !== "undefined") EX_PEND.blpbench = {
  desc: function (x) {
    return {tag: "real", tagTxt: tr("Vestuario"), cls: "", cat: tr("Minutos"), title: trn(x.n, "{n} partido sin jugar", "{n} partidos sin jugar"),
      text: tr("Llevas {n} partidos sin apenas pisar el césped. Cada partido que pasa, el míster se plantea más darte una oportunidad, pero puedes mover ficha.", {n: x.n}),
      opts: BLP_BENCH_OPTS.map(function (o) { return descOpt({t: tr(o.t), d: tr(o.d), ok: {fx: o.fx}}, function (u) { return fxPreview(u.fx); }); })};
  },
  resolve: function (x, choice) {
    var o = BLP_BENCH_OPTS[choice]; if (!o) return null;
    S.pend.shift();
    var chips = applyFx(o.fx);
    if (o.promise) { blpOf().promise = 1; chips.push(["note", 0, tr("Titular en el próximo partido")]); }
    return {t: "decision", tipo: "real", cat: tr("Minutos"), title: trn(x.n, "{n} partido sin jugar", "{n} partidos sin jugar"), choice: tr(o.t), txt: tr(o.d), chips: chips, y: S.yr};
  }
};

/* ---------- jugador: confianza en los minijuegos (la usa la interfaz) ---------- */
function blpMgBonus() { return S && S.blp ? Math.min(BLP.mgMax, (S.blp.mg || 0) * BLP.mgStep) : 0; }
function blpMgResult(ok) { var b = blpOf(); b.mg = ok ? 0 : (b.mg || 0) + 1; }

/* ---------- jugador: un verano sin ofertas jugando poco ---------- */
(function () {
  if (typeof genOffers !== "function") return;
  var _go = genOffers;
  genOffers = function (kind) {
    var out = _go.apply(this, arguments), p = S.p;
    if (kind !== "verano" || out.length || !p || p.loan || p.club < 0) return out;
    var perf = recentPerf();
    if (perf.share >= 0.4) return out;
    var eff = p.ovr, c = clubsWhere(function (i) { return i !== p.club && S.cl[i] >= 0 && S.cr[i] >= eff - 9 && S.cr[i] <= eff - 2 && i !== p.flags.snub; });
    if (!c.length) return out;
    var ci = pick(c), free = p.con && p.con.yrs <= 0;
    out.push({club: ci, sal: Math.round(salaryFor(eff, ci) * 1.05 / 1000) * 1000, yrs: p.age <= 29 ? ri(3, 4) : 2, fee: free ? 0 : Math.round(marketValue() * 0.9 / 1e5) * 1e5,
      role: roleFor(eff - S.cr[ci], p.age), loan: false, blp: true});
    return out;
  };
})();

/* ---------- míster: ultimátum ---------- */
function blpExpP(club) {
  var li = S.cl[club], L = S.L && S.L[li]; if (!L) return 1.4;
  var n = L.tm.length, exp = L.exp.indexOf(club) + 1;
  return 2.3 - 1.4 * (exp - 1) / Math.max(1, n - 1);
}
function blpUltNeed(club) { return Math.round(clamp(blpExpP(club) - 0.55, 0.8, 1.75) * 10) / 10; }
/* devuelve true si, en vez de despedirte, la directiva te da un ultimátum (stage 0: a mitad de temporada; 1: al final) */
function blpUltimatum(stage) {
  var m = S.m, u = m.ult;
  if (!m || m.club < 0 || m.owner) return false;
  if (u && u.club === m.club && (u.st === "on" || u.st === "fail")) return false;
  if (u && u.club === m.club && u.st === "ok" && (stage === 1 ? S.yr + 1 : S.yr) - u.y < 1) return false;
  var y = stage === 0 ? S.yr : S.yr + 1, bi = stage === 0 ? S.bi : 0;
  m.ult = {club: m.club, y: y, bi: bi, need: blpUltNeed(m.club), st: "on", b0: Math.round(m.board)};
  m.board = mSackT(stage) + 1;
  S.pend.push(mp("ult", {}));
  if (S.bnews) S.bnews.push({t: "bad", x: tr("La directiva estaba a punto de despedirte, pero te concede una última oportunidad: una media de {need} puntos por partido de liga en el próximo tramo.", {need: fmtNeed(m.ult.need)})});
  return true;
}
function fmtNeed(v) { var s = (Math.round(v * 10) / 10).toFixed(1); return LANG === "en" ? s : s.replace(".", ","); }
/* un ultimátum fallado en el último tramo obliga a despedirte aunque los objetivos suban la nota */
function blpMustGo() { var m = S.m, u = m && m.ult; return !!(u && u.st === "fail" && u.club === m.club && u.y === S.yr); }
/* al acabar un tramo: 1 superado, -1 no superado, 0 no había ultimátum en juego */
function blpUltBlock(bst) {
  var m = S.m, u = m && m.ult;
  if (!u || u.st !== "on" || u.club !== m.club || u.y !== S.yr || u.bi !== S.bi) return 0;
  var ppg = bst.lgN ? bst.lgPts / bst.lgN : u.need;
  if (ppg + 1e-9 >= u.need) {
    u.st = "ok"; u.got = Math.round(ppg * 100) / 100;
    m.board = Math.max(m.board, mSackT(1) + 14);
    m.fans = clamp(m.fans + 4, 0, 100);
    if (S.bnews) S.bnews.push({t: "star", x: tr("¡Ultimátum superado! Media de {got} puntos por partido (pedían {need}). La directiva vuelve a confiar en ti.", {got: fmtNeed(ppg), need: fmtNeed(u.need)})});
    return 1;
  }
  u.st = "fail"; u.got = Math.round(ppg * 100) / 100;
  if (S.bnews) S.bnews.push({t: "bad", x: tr("Ultimátum no superado: media de {got} puntos por partido (pedían {need}).", {got: fmtNeed(ppg), need: fmtNeed(u.need)})});
  return -1;
}
function blpUltLive() {
  var m = S.m, u = m && m.ult;
  if (!u || u.st !== "on" || u.club !== m.club) return null;
  var playing = u.y === S.yr && u.bi === S.bi && (S.ph === "blk" || S.ph === "sblk") && S.bst;
  return {need: u.need, n: playing ? S.bst.lgN : 0, pts: playing ? S.bst.lgPts : 0, playing: !!playing};
}
var BLP_ULT_OPTS = [
  {t: N_("Aceptar el reto en público"), d: N_("Das la cara ante la prensa. La afición se pone de tu lado."), fx: {fans: 5, chem: 3}},
  {t: N_("Encerrarte con la plantilla"), d: N_("Concentración y charla a puerta cerrada: el equipo rinde más este tramo."), fx: {sqMor: 4}, conj: true},
  {t: N_("Pedir un refuerzo de urgencia"), d: N_("La directiva suelta algo de dinero para fichar, pero se lo apunta."), fx: {bud: 0, board: -1}, bud: true}
];
if (typeof MPH !== "undefined") MPH.ult = {
  fixed: true,
  head: function () {
    var m = S.m, u = m.ult;
    return {tag: "hot", tagTxt: tr("Ultimátum"), cls: "hotc", cat: tr("Directiva"), title: tr("La directiva te da un último tramo"),
      text: tr("Tu crédito estaba bajo mínimos y el presidente ha decidido no despedirte… todavía. Necesitas una media de {need} puntos por partido de liga en el próximo tramo. Si lo consigues, la directiva vuelve a confiar en ti. ¿Cómo lo afrontas?", {need: fmtNeed(u ? u.need : 1)})};
  },
  opts: function () {
    var m = S.m, extra = Math.max(1e6, Math.round(mBudgetFor(m.club) * mBudM() * 0.25 / 1e5) * 1e5);
    return BLP_ULT_OPTS.map(function (o, i) {
      var fx = o.bud ? {bud: extra, board: -1} : o.conj ? {sqMor: 4, buff: {v: 1, b: 1, n: tr("Conjura")}} : o.fx;
      return {t: tr(o.t), d: tr(o.d), ok: {txt: tr(o.d), fx: fx}, i: i, dis: o.bud && !m.mk.open ? tr("Solo con el mercado abierto") : null};
    });
  },
  card: function (x, o, res, chips, head) { return {t: "decision", tipo: "mgr", cat: tr("Directiva"), title: tr("Ultimátum de la directiva"), choice: o.t, txt: res.txt, chips: chips, y: S.yr}; }
};
(function () {
  if (typeof mgrPendValid !== "function") return;
  var _pv = mgrPendValid;
  mgrPendValid = function (x) {
    if (x.k === "ult") return S.m.club >= 0 && !!S.m.ult && S.m.ult.st === "on" && S.m.ult.club === S.m.club;
    return _pv.apply(this, arguments);
  };
})();

/* ---------- míster: conjura tras una mala racha ---------- */
(function () {
  if (typeof mgrFinish !== "function") return;
  var _mf = mgrFinish;
  mgrFinish = function (f) {
    var out = _mf.apply(this, arguments);
    if (!f || f.isNat || !S.m) return out;
    var b = blpOf(), gu = f.gu + (f.etu || 0), gt = f.gt + (f.ett || 0);
    if (b.conjX) b.conjX = null; /* la conjura ya ha tenido al menos un partido */
    if (gu > gt) b.mwl = 0; else b.mwl = (b.mwl || 0) + 1;
    if (BLP.wl.indexOf(b.mwl) >= 0) {
      var bf = {v: BLP.wlBuff, b: 1, n: tr("Conjura")};
      S.m.buffs.push(bf); b.conjX = true;
      if (typeof mSync === "function") mSync();
      if (S.bnews) S.bnews.push({t: "ok", x: tr("{n} partidos sin ganar: el vestuario se conjura y aprieta en los entrenamientos (+{v} de nivel el resto del tramo).", {n: b.mwl, v: fmtNeed(BLP.wlBuff)})});
    }
    return out;
  };
})();

/* si la conjura llega en el último partido del tramo, se guarda para el siguiente */
(function () {
  if (typeof mgrBlockDone !== "function") return;
  var _bd = mgrBlockDone;
  mgrBlockDone = function () {
    var b = S.blp;
    if (b && b.conjX && S.m) { var n = tr("Conjura"); S.m.buffs.forEach(function (x) { if (x.n === n && x.v === BLP.wlBuff && x.b === 1) x.b = 2; }); b.conjX = null; }
    return _bd.apply(this, arguments);
  };
})();

/* ---------- una nueva generación de la dinastía empieza sin rachas heredadas ---------- */
(function () {
  if (typeof dynHeirStart !== "function") return;
  var _h = dynHeirStart;
  dynHeirStart = function () { var r = _h.apply(this, arguments); if (r && S) S.blp = null; return r; };
})();

/* ---------- mala suerte en las decisiones (jugador y míster) ----------
   Cada decisión o jugada con porcentaje que sale mal seguida suma +12 puntos de probabilidad de éxito
   a la siguiente (máx. +36, y nunca por encima del 90 %: ninguna opción pasa a ser segura).
   Las jugadas de partido y el resto de decisiones llevan la cuenta por separado.
   Los porcentajes que ves en las opciones ya lo incluyen; se reinicia cuando una sale bien.
   A la tercera seguida, en silencio: +3 de moral y +2 de profesionalidad (jugador) o +3 de química (míster).
   No se anuncia en ningún sitio: el jugador tiene que sentir que sus decisiones pesan, no que le ayudan. */
BLP.luckStep = 0.12; BLP.luckMax = 0.36; BLP.luckCap = 0.9;
/* dos contadores: jugadas de partido (momentos) y el resto de decisiones */
function blpLuckKey() { var x = S && S.pend && S.pend[0]; return x && (x.k === "moment" || x.k === "mmom") ? "mbad" : "bad"; }
function blpBad(k) { return S && S.blp ? S.blp[k || blpLuckKey()] || 0 : 0; }
function blpLuck(k) { return Math.min(BLP.luckMax, blpBad(k) * BLP.luckStep); }
(function () {
  if (typeof outcomesOf !== "function") return;
  var _oo = outcomesOf;
  outcomesOf = function (o) {
    var list = _oo.apply(this, arguments), b = blpLuck();
    if (!b || list.length < 2) return list;
    var G = 0, B = 0;
    list.forEach(function (x) { if (x.neu) return; if (x.good) G += x.p; else B += x.p; });
    var d = Math.min(b, B, Math.max(0, BLP.luckCap - G));
    if (G <= 0 || d <= 0) return list;
    list.forEach(function (x) { if (x.neu) return; x.p = x.good ? x.p * (G + d) / G : x.p * (B - d) / B; x.luck = true; });
    return list;
  };
})();
(function () {
  if (typeof feed !== "function") return;
  var _fd = feed;
  feed = function (card) {
    if (S && card && (card.t === "decision" || card.t === "moment") && typeof card.good === "boolean" && card.pct != null) {
      /* sin avisos: el jugador solo ve los porcentajes, que ya incluyen la ayuda */
      var b = blpOf(), key = card.t === "moment" ? "mbad" : "bad";
      if (card.good) b[key] = 0;
      else {
        b[key] = (b[key] || 0) + 1;
        if (b[key] === 3) {
          if (S.mode === "mgr" && S.m) S.m.chem = clamp(S.m.chem + 3, 0, 100);
          else if (S.p) { S.p.mor = clamp(S.p.mor + 3, 0, 100); S.p.prof = clamp(S.p.prof + 2, 0, 100); }
        }
      }
    }
    return _fd.apply(this, arguments);
  };
})();
