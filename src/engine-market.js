/* ===== PARCHE 2.1: avisos, clausulazos, negociación con frustración, resultados y redes tras el directo ===== */

/* ---------- avisos temporales (la interfaz los muestra y los borra) ---------- */
function notify(txt, kind, extra) {
  if (!S || !txt) return;
  var q = S.ntf = S.ntf || [];
  q.push(Object.assign({t: txt, k: kind || "info"}, extra || {}));
  if (q.length > 12) q.splice(0, q.length - 12);
}

/* ---------- lesiones y expulsiones: aviso rojo ---------- */
(function () {
  var _injure = injure;
  injure = function (forced) {
    var before = S.p.injT;
    _injure(forced);
    var p = S.p;
    if (p.inj && p.injT > before) notify(trn(p.inj.w, "🚑 Lesión: {inj}. {n} semana de baja.", "🚑 Lesión: {inj}. {n} semanas de baja.", {inj: lcName(p.inj.n)}), "red");
  };
  var _finishPlayer = finishPlayer;
  finishPlayer = function (f) {
    _finishPlayer(f);
    var p = S.p, gu = f.gu + (f.etu || 0), gt = f.gt + (f.ett || 0);
    if (f.red && !f.isNat && !f.redNtf) { f.redNtf = 1; notify(trn(Math.max(1, p.susp), "🟥 Expulsado ante el {opp}: {n} partido de sanción.", "🟥 Expulsado ante el {opp}: {n} partidos de sanción.", {opp: f.isNat ? natName(f.opp) : clubName(f.opp)}), "red"); }
    /* resultado de los partidos simulados (los de un momento ya se cuentan al decidir) */
    if (!f.mom) notify(resLine(gu, gt, f.isNat ? natName(f.opp) : clubName(f.opp), f.pens), "res", {r: gu > gt ? 1 : gu < gt ? -1 : 0});
  };
  var _mInjure = mInjure;
  mInjure = function (p, w, where) {
    var before = p.inj;
    _mInjure(p, w, where);
    if (S.m && S.m.sq.indexOf(p) >= 0 && p.inj > before) {
      var n = p.inj - Math.max(before, S.tw);
      notify(trn(n, "🚑 {name}: {inj}. {n} semana de baja.", "🚑 {name}: {inj}. {n} semanas de baja.", {name: plShort(p), inj: LANG === "es" ? String(p.injN).toLowerCase() : p.injN}), "red");
    }
  };
  var _mgrFinish = mgrFinish;
  mgrFinish = function (f) {
    var sus = {};
    S.m.sq.forEach(function (p) { sus[p.id] = p.sus; });
    _mgrFinish(f);
    S.m.sq.forEach(function (p) {
      if (sus[p.id] != null && p.sus > sus[p.id]) notify(trn(p.sus, "🟥 {name}: {n} partido de sanción.", "🟥 {name}: {n} partidos de sanción.", {name: plShort(p)}), "red");
    });
    var gu = f.gu + (f.etu || 0), gt = f.gt + (f.ett || 0);
    if (f.liveDone) liveSocial(f, gu, gt);
    else notify(resLine(gu, gt, clubName(f.opp), f.pens), "res", {r: gu > gt ? 1 : gu < gt ? -1 : 0});
  };
})();
function resLine(gu, gt, opp, pens) {
  var sc = gu + "-" + gt + (pens ? " (" + pens[0] + "-" + pens[1] + " " + tr("pen.") + ")" : "");
  var win = gu > gt || (gu === gt && pens && pens[0] > pens[1]), loss = gu < gt || (gu === gt && pens && pens[0] < pens[1]);
  return (win ? "✅ " : loss ? "❌ " : "➖ ") + tr("{score} ante el {opp}", {score: sc, opp: opp});
}

/* ---------- momento de partido (jugador): al decidir, el resultado final ---------- */
(function () {
  var _res = resolvePendingPlayer;
  resolvePendingPlayer = function (choice) {
    var x = S.pend[0], fi = x && x.k === "moment" ? x.fi : null;
    var card = _res(choice);
    if (card && fi != null && S.cur && S.cur.pm[fi]) momentFinal(S.cur.pm[fi], card);
    return card;
  };
})();
function momentFinal(f, card) {
  if (f.st === 1) {
    computeExtra(f); f.st = 2;
    if (f.needPens && f.onEnd && !f.pens) { S.pend.unshift({k: "so", fi: S.cur.pm.indexOf(f)}); f.st = 3; }
    else if (f.needPens && !f.pens) { var so = shootout(0.76, 0.76); f.pens = [so[0], so[1]]; }
  }
  var gu = f.gu + (f.etu || 0), gt = f.gt + (f.ett || 0), opp = f.isNat ? natName(f.opp) : clubName(f.opp), us = f.isNat ? natName(f.us) : clubName(f.us);
  var pendSo = f.st === 3 && !f.pens;
  var r = gu > gt ? 1 : gu < gt ? -1 : f.pens ? (f.pens[0] > f.pens[1] ? 1 : -1) : 0;
  card.fin = {us: us, opp: opp, gu: gu, gt: gt, et: !!f.et, pens: f.pens || null, so: pendSo, r: pendSo ? null : r};
  var txt = pendSo ? tr("Final: {us} {a}-{b} {opp} tras la prórroga. Se decide en los penaltis.", {us: us, opp: opp, a: gu, b: gt})
    : r > 0 ? tr("Final: {us} {a}-{b} {opp}. ¡Victoria!", {us: us, opp: opp, a: gu, b: gt})
    : r < 0 ? tr("Final: {us} {a}-{b} {opp}. Derrota.", {us: us, opp: opp, a: gu, b: gt})
    : tr("Final: {us} {a}-{b} {opp}. Empate.", {us: us, opp: opp, a: gu, b: gt});
  if (f.pens && !pendSo) txt += " " + tr("Penaltis: {a}-{b}.", {a: f.pens[0], b: f.pens[1]});
  card.txt = (card.txt ? card.txt + " " : "") + txt;
  notify((pendSo ? "⏱️ " : r > 0 ? "✅ " : r < 0 ? "❌ " : "➖ ") + txt, pendSo ? "info" : r > 0 ? "good" : r < 0 ? "red" : "info");
}

/* ---------- redes sociales tras ver el partido en directo ---------- */
var LIVE_SOC = {
  win: [{by: "press", t: N_("{name} lo leyó desde el banquillo: {subs} cambios y victoria {score} ante el {opp}. 🧠")}, {by: "fan", t: N_("¡Qué manera de mover el banquillo! {score} y a casa contentos. Gracias, míster 🙌")}],
  loss: [{by: "press", t: N_("Los cambios de {name} no funcionaron. {score} ante el {opp} y muchas dudas. 🤔")}, {by: "hater", t: N_("{score}. Alguien que le explique a {name} para qué sirve el banquillo 🙄")}],
  draw: [{by: "press", t: N_("Empate {score} ante el {opp}. ¿Faltó valentía en el banquillo? {name} tendrá que explicarlo.")}, {by: "fan", t: N_("Un punto y gracias. Con ese {score} no se gana una liga, {name} 😤")}],
  attack: [{by: "fan", t: N_("¡Eso es ir a por el partido! {name} metió más gente arriba y llegó el premio ⚡")}],
  defend: [{by: "hater", t: N_("Encerrarse atrás nunca sale bien. Gracias por nada, {name} 🙄")}],
  nosubs: [{by: "meme", t: N_("{name} no hizo ni un cambio. Confianza total en los once… o pereza 😅")}],
  hero: [{by: "fan", t: N_("¡{player} entró desde el banquillo y lo cambió todo! Cambio de genio de {name} 🔥")}]
};
function liveSocial(f, gu, gt) {
  if (f.socDone || typeof SOCIAL_T === "undefined") return;
  f.socDone = true;
  var b = socBase(), club = S.m.club, derby = W.derby[club + "-" + f.opp];
  var tp = Object.assign({}, b, {opp: clubName(f.opp), score: gu + "-" + gt, subs: (f.liveSubs || []).length});
  var trig = gu > gt ? (derby ? "derby_win" : gu - gt >= 3 ? "bigwin" : "win") : gu < gt ? (derby ? "derby_loss" : gt - gu >= 3 ? "bigloss" : "loss") : "draw";
  socPost(trig, tp, {mood: gu >= gt ? 1 : -1});
  socPost(trig, tp, {by: "press"});
  var r = gu > gt ? "win" : gu < gt ? "loss" : "draw", pk = function (l) { return l[Math.floor(Math.random() * l.length)]; };
  var t = pk(LIVE_SOC[r]); socPostRaw({by: t.by, tk: t.t, tp: tp, mood: r === "loss" ? -1 : 1});
  if (!(f.liveSubs || []).length) { t = pk(LIVE_SOC.nosubs); socPostRaw({by: t.by, tk: t.t, tp: tp}); }
  else {
    var hero = (f.liveSubs || []).map(function (sb) { return sb["in"]; }).filter(function (id) { return (f.forced || []).indexOf(id) >= 0; })[0];
    if (hero != null && mPl(hero)) { t = pk(LIVE_SOC.hero); socPostRaw({by: t.by, tk: t.t, tp: Object.assign({}, tp, {player: plShort(mPl(hero))}), mood: 1}); }
  }
  if (f.ment === 2 && gu > gt) { t = pk(LIVE_SOC.attack); socPostRaw({by: t.by, tk: t.t, tp: tp, mood: 1}); }
  if (f.ment === 0 && gu < gt) { t = pk(LIVE_SOC.defend); socPostRaw({by: t.by, tk: t.t, tp: tp, mood: -1}); }
  notify("📱 " + tr("Las redes reaccionan a tu partido."), "info");
}

/* ---------- mercado abierto: aviso ---------- */
(function () {
  var _mss = mgrStartSeason;
  mgrStartSeason = function () { _mss.apply(this, arguments); if (S.m.club >= 0) notify("🔔 " + tr("¡Se abre el mercado de verano! Tienes {bud} para fichar.", {bud: fmtMoney(S.m.bud)}), "amber"); maybeClausM("verano"); };
  var _mqb = mgrQueueBetween;
  mgrQueueBetween = function (nextBi) { _mqb(nextBi); if (nextBi === 3 && S.m.club >= 0) { notify("🔔 " + tr("¡Se abre el mercado de invierno! Tienes {bud} para fichar.", {bud: fmtMoney(S.m.bud)}), "amber"); maybeClausM("invierno"); } };
  var _ss = startSeason;
  startSeason = function (first) { _ss(first); if (!first) { notify("🔔 " + tr("¡Se abre el mercado de verano!"), "amber"); maybeClausP("verano"); } };
  var _qb = queueBetween;
  queueBetween = function (nextBi) { _qb(nextBi); if (nextBi === 3) { notify("🔔 " + tr("¡Se abre el mercado de invierno!"), "amber"); maybeClausP("invierno"); } };
})();

/* ---------- clausulazo ---------- */
function clauseOf(p) { return Math.max(5e6, Math.round(pValue(p) * (p.role === "C" ? 1.6 : 1.35) / 1e6) * 1e6); }
/* jugador: un club grande paga tu cláusula y te vas, sin negociar */
function maybeClausP(kind) {
  var p = S.p;
  if (!p || p.loan || !p.con || p.con.yrs < 1 || p.club < 0) return;
  var mine = S.cr[p.club], eff = p.ovr;
  if (eff < mine + 1 || eff < 72) return;
  var pr = (0.06 + Math.max(0, eff - mine - 1) * 0.015) * [0.6, 1, 1.3][S.set.ev] * (kind === "invierno" ? 0.6 : 1);
  if (!chance(Math.min(0.22, pr))) return;
  var pool = clubsWhere(function (c) { return c !== p.club && S.cr[c] >= Math.max(mine + 2, eff - 6) && S.cr[c] <= eff + 6 && W.lg[S.cl[c]].t === 1; });
  if (!pool.length) return;
  var club = pick(pool), fee = Math.max(10e6, Math.round(marketValue() * rf(1.8, 2.4) / 1e6) * 1e6);
  var d = {club: club, fee: fee, sal: Math.round(salaryFor(p.ovr, club) * 1.4 / 1000) * 1000, yrs: p.age <= 26 ? 5 : 4, role: roleFor(p.ovr - S.cr[club], p.age), loan: false};
  S.pend = S.pend.filter(function (x) { return x.k !== "offers"; });
  S.pend.unshift({k: "clausp", d: d, kind: kind});
  notify("💥 " + tr("¡Clausulazo! El {club} paga tu cláusula.", {club: clubName(club)}), "amber");
}
EX_PEND.clausp = {
  desc: function (x) { var d = x.d;
    return {tag: "hot", tagTxt: tr("Clausulazo"), cls: "hotc", cat: x.kind === "invierno" ? tr("Mercado de invierno") : tr("Mercado de verano"), title: tr("El {club} paga tu cláusula", {club: clubName(d.club)}),
      text: tr("El {club} ha depositado {fee} en la federación. Tu cláusula está pagada: no hay nada que negociar ni nadie que pueda pararlo. Firmas {sal} al año hasta {end}.", {club: clubName(d.club), fee: fmtMoney(d.fee), sal: fmtMoney(d.sal), end: S.yr + d.yrs + 1}),
      ref: tr("En 2017 el PSG depositó los 222 millones de la cláusula de Neymar y el Barcelona no pudo hacer nada."),
      opts: [descOpt({t: tr("Hacer las maletas"), ok: {txt: tr("Te despides del vestuario. Empieza una nueva etapa.")}}, function () { return [["note", 0, tr("Fichas por el {club}", {club: clubName(d.club)})]]; })]};
  },
  resolve: function (x) {
    var d = x.d, old = S.p.club;
    S.pend.shift();
    acceptOffer(d);
    S.p.fame = clamp(S.p.fame + 5, 0, 100);
    var card = {t: "decision", tipo: "real", cat: tr("Mercado"), title: tr("Clausulazo"), choice: tr("Hacer las maletas"), txt: tr("El {club} pagó {fee} por tu cláusula. Dejas el {old}.", {club: clubName(d.club), fee: fmtMoney(d.fee), old: clubName(old)}), chips: [["fame", 5]], y: S.yr};
    socPost("signing", Object.assign(socBase(), {club: clubName(d.club), from: clubName(old), to: clubName(d.club), fee: fmtMoney(d.fee), year: S.yr + 1 + d.yrs}), {by: "romano"});
    return card;
  }
};
/* míster: un club rico paga la cláusula de uno de tus jugadores y se lo lleva */
function maybeClausM(kind) {
  var m = S.m;
  if (!m || m.club < 0 || (m.seasons.length === 0 && kind === "verano")) return;
  var my = S.cr[m.club];
  var cands = mActive().filter(function (p) { return !p.loanOut && p.age <= 31 && p.ovr >= my + 1 && p.ovr >= 72; });
  if (!cands.length) return;
  var pr = 0.1 * [0.6, 1, 1.3][S.set.ev] * (kind === "invierno" ? 0.6 : 1);
  if (!chance(pr)) return;
  var p = cands.sort(function (a, b) { return b.ovr - a.ovr; })[Math.floor(R() * Math.min(3, cands.length))];
  var pool = clubsWhere(function (c) { return c !== m.club && S.cr[c] >= Math.max(my + 3, p.ovr - 3) && W.lg[S.cl[c]].t === 1; });
  if (!pool.length) return;
  var club = pick(pool), fee = clauseOf(p);
  S.pend.unshift(mp("clausm", {pid: p.id, club: club, fee: fee, ui: true}));
  notify("💥 " + tr("¡Clausulazo! El {club} paga la cláusula de {name}.", {club: clubName(club), name: plShort(p)}), "red");
}
if (typeof MPH !== "undefined") {
  MPH.clausm = {
    fixed: true,
    head: function (x) { var p = mPl(x.pid);
      return {tag: "hot", tagTxt: tr("Clausulazo"), cls: "hotc", cat: tr("Mercado"), title: tr("El {club} se lleva a {name}", {club: clubName(x.club), name: plShort(p)}),
        text: tr("El {club} ha pagado los {fee} de la cláusula de {desc} No hay negociación posible: el jugador se marcha y el dinero entra en tu presupuesto.", {club: clubName(x.club), fee: fmtMoney(x.fee), desc: plDesc(p)})}; },
    opts: function (x) { var p = mPl(x.pid); return [{t: tr("Asumirlo"), ok: {txt: tr("{name} se despide del vestuario. Toca buscar recambio.", {name: plShort(p)})}}]; },
    apply: function (x) {
      var p = mPl(x.pid), pop = p.role === "C" || p.tot.apps + p.st.apps >= 120;
      var ch = mgrFx({bud: x.fee, fans: pop ? -6 : -2, chem: -3});
      mgrRemovePlayer(p, tr("Clausulazo del {club}", {club: clubName(x.club)}), x.club, x.fee);
      return ch;
    }
  };
}

/* ---------- negociación manual de fichajes: oferta con barra y frustración ---------- */
function negoStart(tid) {
  var m = S.m, t = mgrTarget(tid);
  if (!t || t.done || !m.mk.open || m.club < 0) return false;
  var free = t.club < 0;
  S.pend.unshift(mp("nego", {tid: tid, ph: free ? "wage" : "fee", fee: 0, fr: 0, tries: 0, log: [], ui: true}));
  negoInit(S.pend[0]);
  return true;
}
function negoInit(x) {
  var t = mgrTarget(x.tid), m = S.m;
  if (x.ph === "fee") {
    x.ask = t.ask; x.st = x.ask >= 1e6 ? 1e4 : 1000;
    /* precio mínimo oculto del club vendedor */
    x.res = t.ask * (t.key ? rf(0.86, 0.98) : rf(0.7, 0.9)) * (1 - clamp((m.rep - 50) / 500, -0.06, 0.06));
    x.lo = Math.max(x.st * 10, t.ask * 0.4); x.hi = t.ask * 1.3;
    x.v = Math.min(m.bud, t.ask * 0.8);
  } else {
    x.ask = t.sal; x.st = x.ask >= 1e6 ? 1e4 : 1000;
    x.res = t.sal * clamp(0.98 - (t.int - 50) / 250, 0.72, 1.05);
    x.lo = t.sal * 0.5; x.hi = t.sal * 1.4;
    x.v = t.sal * 0.9;
  }
  /* todos los valores caen exactamente en los escalones de la barra */
  ["ask", "res", "lo", "hi", "v"].forEach(function (k) { x[k] = negoSnap(x, x[k]); });
  x.fr = 0; x.tries = 0; x.prom = false;
}
function negoStep(x) { return x.st || (x.ph === "fee" ? 1e5 : 1000); }
function negoSnap(x, v) { var st = negoStep(x); return Math.round(Math.round(v / st) * st); }
function negoMax(x) {
  var m = S.m;
  if (x.ph === "fee") { var st = negoStep(x); return Math.max(x.lo, Math.min(x.hi, Math.floor(m.bud / st) * st)); }
  return x.hi;
}
/* hacer una oferta: el club o el jugador acepta, contraoferta o se frustra */
function negoOffer(v) {
  var x = S.pend[0]; if (!x || x.k !== "nego") return null;
  var t = mgrTarget(x.tid), m = S.m, fee = x.ph === "fee";
  v = negoSnap(x, clamp(v, x.lo, negoMax(x)));
  x.v = v; x.tries++;
  var res = x.res * (!fee && x.prom ? 0.9 : 1), who = fee ? clubName(t.club) : t.fn + " " + t.ln, out = {v: v};
  if (!fee) {
    var bill = mWageBill();
    if (bill + v > m.wcap * 1.1) { out.r = "cap"; out.txt = tr("Superarías el tope salarial: vende o renegocia antes."); x.tries--; x.log.unshift(out); return out; }
  }
  if (v >= x.ask || (v >= res && R() < 0.35 + 0.65 * (v - res) / Math.max(1, x.ask - res))) {
    out.r = "ok";
    out.txt = fee ? tr("El {club} acepta {fee}. Ahora falta convencer al jugador.", {club: who, fee: fmtMoney2(v)}) : tr("{name} acepta {sal} al año. ¡Fichado!", {name: who, sal: fmtMoney2(v)});
  } else {
    var gap = (res - v) / res;
    x.fr = clamp(x.fr + 9 + (gap > 0 ? 75 * gap : 0) + (x.tries > 3 ? 6 : 0), 0, 100);
    if (x.fr >= 100) {
      out.r = "break";
      out.txt = fee ? tr("El {club} se cansa y rompe las negociaciones.", {club: who}) : tr("{name} se cansa de regatear y elige otra oferta.", {name: who});
    } else if (gap > 0.35) {
      out.r = "insult";
      out.txt = fee ? tr("«¿Esto es una broma?» El {club} ni se lo plantea. Siguen pidiendo {ask}.", {club: who, ask: fmtMoney2(x.ask)}) : tr("«Así no vamos a ningún sitio.» {name} sigue pidiendo {ask}.", {name: who, ask: fmtMoney2(x.ask)});
    } else {
      var na = Math.max(res, Math.round((x.ask - (x.ask - v) * (gap > 0 ? 0.25 : 0.45)) / negoStep(x)) * negoStep(x));
      out.r = "counter";
      x.ask = Math.max(na, v + negoStep(x));
      out.txt = fee ? tr("El {club} rechaza {fee} y baja su petición a {ask}.", {club: who, fee: fmtMoney2(v), ask: fmtMoney2(x.ask)}) : tr("{name} rechaza {sal} y pide {ask}.", {name: who, sal: fmtMoney2(v), ask: fmtMoney2(x.ask)});
    }
  }
  out.fr = Math.round(x.fr);
  x.log.unshift(out);
  if (x.log.length > 6) x.log.length = 6;
  if (out.r === "ok") negoAccept(x, v);
  else if (out.r === "break") negoBreak(x, out.txt);
  return out;
}
function negoAccept(x, v) {
  var t = mgrTarget(x.tid), m = S.m;
  if (x.ph === "fee") {
    var nx = mp("nego", {tid: x.tid, ph: "wage", fee: v, ui: true});
    negoInit(nx);
    nx.log = x.log.slice(0, 1);
    var i = S.pend.indexOf(x);
    if (i >= 0) S.pend[i] = nx; else S.pend.unshift(nx);
    return;
  }
  var over = mWageBill() + v > m.wcap;
  m.bud -= x.fee;
  if (over) m.board = clamp(m.board - 5, 0, 100);
  var p = mgrSign(t, x.fee, v, x.prom ? "C" : null, x.prom);
  S.pend.shift();
  feed({t: "decision", tipo: "mgr", cat: tr("Fichaje"), title: tr("Fichaje cerrado"), choice: trn(x.tries, "Negociación: {n} oferta", "Negociación: {n} ofertas"), txt: tr("¡Fichado! {name} firma hasta {end}.", {name: plName(p), end: S.yr + t.yrsD}), chips: [["bud", -x.fee]].concat(over ? [["board", -5]] : []), y: S.yr});
  notify("✍️ " + tr("¡Fichado! {name} es nuevo jugador del {club}.", {name: plShort(p), club: clubName(m.club)}), "good");
}
function negoBreak(x, txt) {
  var t = mgrTarget(x.tid);
  t.done = "rechazado";
  S.pend.shift();
  feed({t: "decision", tipo: "mgr", cat: tr("Fichaje"), title: tr("Negociación rota"), choice: t.fn + " " + t.ln, txt: txt, chips: [], y: S.yr});
  notify("💢 " + txt, "red");
}
function negoQuit() {
  var x = S.pend[0]; if (!x || x.k !== "nego") return;
  S.pend.shift();
  if (x.ph === "wage" && x.fee) { var t = mgrTarget(x.tid); if (t) t.done = "descartado"; }
}
function negoSet(v) { var x = S.pend[0]; if (x && x.k === "nego") x.v = negoSnap(x, clamp(+v || 0, x.lo, negoMax(x))); }
function negoProm(on) { var x = S.pend[0]; if (x && x.k === "nego" && x.ph === "wage") x.prom = !!on; }
/* las pruebas automáticas y los bots usan las opciones normales */
if (typeof MPH !== "undefined") {
  MPH.nego = {
    fixed: true,
    head: function (x) { var t = mgrTarget(x.tid);
      return {tag: "real", tagTxt: tr("Fichaje"), cls: "", cat: tr("Negociación"), title: tr("Negociar por {name}", {name: t.fn + " " + t.ln}), text: tr("Piden {ask}.", {ask: fmtMoney(x.ask)})}; },
    opts: function (x) { return [
      {t: tr("Pagar lo que piden"), ok: {txt: tr("Aceptas sus condiciones.")}},
      {t: tr("Retirarte de la operación"), ok: {txt: tr("Te retiras. Quizá en otro momento.")}}
    ]; },
    apply: function (x, o) {
      var t = mgrTarget(x.tid);
      if (o.t === tr("Retirarte de la operación")) { if (x.ph === "wage" && x.fee) t.done = "descartado"; return []; }
      /* aceptar el precio: vuelve a ponerse delante para la fase siguiente o firma */
      S.pend.unshift(x);
      if (x.ph === "fee" && x.ask > S.m.bud) { S.pend.shift(); t.done = "rechazado"; return [["note", 0, tr("No te llega el presupuesto")]]; }
      if (x.ph === "wage" && mWageBill() + x.ask > S.m.wcap * 1.1) { S.pend.shift(); t.done = "rechazado"; return [["note", 0, tr("Superarías el tope salarial: vende o renegocia antes")]]; }
      x.log = x.log || []; x.log.unshift({r: "ok", v: x.ask, txt: ""});
      negoAccept(x, x.ask);
      return [];
    },
    card: function () { return null; }
  };
}

/* ---------- títulos: premio en presupuesto y efectos guardados para la celebración ---------- */
(function () {
  var _mat = mgrAddTrophy;
  mgrAddTrophy = function (k, name) {
    var m = S.m, b0 = {bud: m.bud, rep: m.rep, board: m.board, fans: m.fans};
    _mat(k, name);
    var t = m.trophies[m.trophies.length - 1]; if (!t) return;
    var prize = Math.round(Math.max(2e5, m.bud * Math.min(0.2, 0.03 + (t.w || 2) * 0.008)) / 1e5) * 1e5;
    m.bud += prize;
    t.fx = {bud: m.bud - b0.bud, budPct: b0.bud > 0 ? Math.round((m.bud - b0.bud) / b0.bud * 100) : 0, rep: Math.round((m.rep - b0.rep) * 10) / 10, board: Math.round(m.board - b0.board), fans: Math.round(m.fans - b0.fans)};
    S.troQ = (S.troQ || []).concat([m.trophies.length - 1]).slice(-5);
  };
  var _at = addTrophy;
  addTrophy = function (k, name, nat) {
    var p = S.p, b0 = {fame: p.fame, fans: p.fans, mor: p.mor};
    _at(k, name, nat);
    var t = p.trophies[p.trophies.length - 1]; if (!t) return;
    t.fx = {fame: Math.round(p.fame - b0.fame), fans: Math.round(p.fans - b0.fans), mor: Math.round(p.mor - b0.mor)};
    S.troQ = (S.troQ || []).concat([p.trophies.length - 1]).slice(-5);
  };
})();
