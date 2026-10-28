/* shootout.js — TANDA DE PENALTIS COMPLETA (patch 2.5, motor puro)
   Estado de una tanda (JSON): {us: [lanzadores], them: [lanzadores], gkUs, gkThem, imp, first, k: [[bool…], [bool…]], log: [...]}
   Lanzador: {id?, n, pos, pen (técnica 30-99), comp (sangre fría 5-99), fat (fatiga 0-95), me?}
   Lado 0 = tu equipo, lado 1 = el rival. Alternan desde first; 5 por bando y después muerte súbita.
   La probabilidad de cada penalti depende del lanzador (técnica, sangre fría, fatiga), del portero y de la presión del momento.
   Decisiones: el modo jugador ("so") y el de míster ("mso") ganan la opción 0 «vivir la tanda»; resolverla sin interfaz
   simula la tanda completa con este motor. La interfaz (ui-shootout.js) la juega penalti a penalti y deja el resultado en
   SO.forced antes de resolver la decisión. */
var SO = (function () {
  function hsh(s) { s = String(s); var x = 2166136261; for (var i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = (x * 16777619) >>> 0; } return x; }
  function srng(seed) { var r = (seed >>> 0) % 2147483647 || 1; return function () { r = (r * 48271) % 2147483647; return r / 2147483647; }; }
  var TRC = {lider: 14, profesional: 8, ambicioso: 4, fiestero: -5, conflictivo: -8};
  var POSB = {DC: 6, MCO: 5, ED: 4, EI: 4, MC: 3, MD: 2, MI: 2, MCD: 0, DFC: -2, LD: -1, LI: -1, POR: -14};
  var POSF = {MC: 8, MCD: 7, LD: 7, LI: 7, MD: 6, MI: 6, ED: 5, EI: 5, MCO: 4, DC: 2, DFC: 1, POR: -12};

  /* ---------- lanzadores ---------- */
  function mgrTaker(p) {
    var r1 = srng(hsh("so" + p.id + p.ln + p.fn));
    var pen = Math.round(clamp(p.ovr + (POSB[p.pos] || 0) - 3 + (p.tr === "lider" ? 2 : 0) + r1() * 12 - 6, 30, 99));
    var comp = Math.round(clamp(50 + (TRC[p.tr] || 0) + (p.age - 24) * 1.6 + ((p.mor || 60) - 60) * 0.35 + (p.ovr - 70) * 0.3 + r1() * 26 - 13, 5, 99));
    var fat = Math.round(clamp(100 - (p.fit == null ? 92 : p.fit) + 18 + (POSF[p.pos] || 0) + Math.max(0, p.age - 30) * 2, 5, 95));
    return {id: p.id, n: plShort(p), pos: p.pos, pen: pen, comp: comp, fat: fat};
  }
  function fakeTakers(ni, rating, seed, n, skip) {
    var r1 = srng(seed), pool = namePool(ni), ls = pool.l.split(","), fs = pool.f.split(","), out = [], used = {}, poss = ["DC", "MCO", "ED", "MC", "EI", "MC", "DFC", "MCD", "LD", "DFC", "POR"];
    for (var i = 0; i < n; i++) {
      var ln = ls[Math.floor(r1() * ls.length)], g = 0;
      while ((used[ln] || ln === skip) && g++ < 8) ln = ls[Math.floor(r1() * ls.length)];
      used[ln] = 1;
      var pos = poss[i % poss.length];
      out.push({n: fs[Math.floor(r1() * fs.length)].charAt(0) + ". " + ln, pos: pos, pen: Math.round(clamp(rating + (POSB[pos] || 0) - 3 + r1() * 12 - 6, 30, 99)),
        comp: Math.round(clamp(30 + r1() * 55 + (rating - 70) * 0.4, 5, 99)), fat: Math.round(clamp(18 + (POSF[pos] || 0) + r1() * 22, 5, 95))});
    }
    return out;
  }
  function score(t) { return t.pen + t.comp * 0.35 - t.fat * 0.25; }
  /* orden sugerido: el más frío de los cinco mejores tira el quinto, el mejor técnico el primero y el resto por nivel */
  function autoOrder(list) {
    var a = list.slice().sort(function (x, y) { return (x.pos === "POR") - (y.pos === "POR") || score(y) - score(x); });
    var top = a.slice(0, 5), rest = a.slice(5);
    if (top.length < 5) return a;
    var fifth = top.slice().sort(function (x, y) { return (y.comp + y.pen * 0.5) - (x.comp + x.pen * 0.5); })[0];
    top.splice(top.indexOf(fifth), 1);
    var first = top.slice().sort(function (x, y) { return y.pen - x.pen; })[0];
    top.splice(top.indexOf(first), 1);
    return [first].concat(top, [fifth], rest);
  }

  /* ---------- probabilidad ---------- */
  function kickP(t, press, gkR) {
    var p = 0.775 + (t.pen - 72) * 0.0058 - Math.max(0, t.fat - 20) * 0.0013 - press * (0.11 - (t.comp - 50) * 0.0018) - ((gkR || 72) - 72) * 0.0028;
    return clamp(p, 0.3, 0.94);
  }

  /* ---------- estado ---------- */
  function make(o) { return {us: o.us, them: o.them, gkUs: o.gkUs, gkThem: o.gkThem, imp: o.imp || 1, first: o.first ? 1 : 0, k: [[], []], log: [], gkMe: !!o.gkMe}; }
  function sum(a) { var n = 0; for (var i = 0; i < a.length; i++) if (a[i]) n++; return n; }
  function score2(st) { return [sum(st.k[0]), sum(st.k[1])]; }
  /* -1 sin decidir, 0 gana tu equipo, 1 gana el rival */
  function winner(k) {
    var a = sum(k[0]), b = sum(k[1]), n0 = k[0].length, n1 = k[1].length;
    if (n0 <= 5 && n1 <= 5) {
      if (a + (5 - n0) < b) return 1;
      if (b + (5 - n1) < a) return 0;
      if (n0 === 5 && n1 === 5 && a !== b) return a > b ? 0 : 1;
      return -1;
    }
    if (n0 === n1 && a !== b) return a > b ? 0 : 1;
    return -1;
  }
  function done(st) { return winner(st.k) >= 0; }
  function sideNext(st) { var n = st.k[0].length + st.k[1].length; return n % 2 === 0 ? st.first : 1 - st.first; }
  function nextKick(st) {
    if (done(st)) return null;
    var s = sideNext(st), i = st.k[s].length, list = s === 0 ? st.us : st.them, t = list[i % list.length];
    var k0 = [st.k[0].slice(), st.k[1].slice()], k1 = [st.k[0].slice(), st.k[1].slice()];
    k0[s].push(true); k1[s].push(false);
    var winIf = winner(k0) === s, loseIf = winner(k1) === 1 - s, sd = i >= 5;
    var kind = sd ? "sd" : winIf ? "win" : loseIf ? "save" : "";
    var press = sd ? 1 : winIf || loseIf ? 0.75 : i >= 3 ? 0.38 : 0.12 + 0.06 * i;
    press = clamp(press + 0.06 * ((st.imp || 1) - 1), 0, 1);
    var gk = s === 0 ? st.gkThem : st.gkUs;
    return {side: s, i: i, t: t, press: Math.round(press * 100) / 100, kind: kind, p: kickP(t, press, gk)};
  }
  function record(st, nk, ok, how) {
    st.k[nk.side].push(!!ok);
    st.log.push({s: nk.side, n: nk.t.n, me: !!nk.t.me, ok: !!ok, h: how || "", kind: nk.kind, p: Math.round(nk.p * 100)});
    return winner(st.k);
  }
  function simKick(st, rnd) {
    var nk = nextKick(st); if (!nk) return null;
    rnd = rnd || R;
    var ok = rnd() < nk.p, w = ok ? 0 : rnd();
    record(st, nk, ok, ok ? "" : w < 0.55 ? "parada" : w < 0.73 ? "palo" : "fuera");
    return nk;
  }
  function simAll(st, rnd) { var g = 0; while (!done(st) && g++ < 60) simKick(st, rnd); if (!done(st)) { st.k[0].push(true); st.k[1].push(false); } return st; }
  /* probabilidad aproximada de ganar (Monte Carlo con semilla fija: no gasta azar de la partida) */
  function winProb(o, n) {
    var r1 = srng(hsh(JSON.stringify([o.gkUs, o.gkThem, o.us.length, o.us[0] && o.us[0].pen]))), w = 0;
    n = n || 200;
    for (var i = 0; i < n; i++) { var st = make(Object.assign({}, o, {first: i % 2})); simAll(st, r1); if (winner(st.k) === 0) w++; }
    return clamp(w / n, 0.05, 0.95);
  }

  /* ---------- contexto: modo míster ---------- */
  function mgrList(f) {
    return f.xi.map(mPl).filter(function (p) { return p && p.id !== f.redId; }).map(mgrTaker);
  }
  function mgrCtx(f, ord) {
    var list = mgrList(f), by = {}, us = [];
    list.forEach(function (t) { by[t.id] = t; });
    (ord || []).forEach(function (id) { if (by[id]) { us.push(by[id]); delete by[id]; } });
    var left = list.filter(function (t) { return by[t.id]; });
    us = us.length ? us.concat(autoOrder(left)) : autoOrder(list);
    var gk = list.filter(function (t) { return t.pos === "POR"; })[0];
    var them = fakeTakers(W.clubs[f.opp].ci, f.or || 70, hsh("op" + f.opp + "-" + S.yr + "-" + (f.d || 0)), 11);
    return {us: us, them: them, gkUs: gk ? clamp(gk.pen + 14, 45, 95) : (f.tr || 70) - 4, gkThem: f.or || 70, imp: f.fin ? 3 : 2};
  }
  /* ---------- contexto: modo jugador ---------- */
  function playerCtx(f) {
    var p = S.p, at = attrs(), gk = isGK(), us = f.isNat ? S.nr[f.us] : S.cr[f.us], ni = f.isNat ? f.us : W.clubs[f.us].ci;
    var mates = fakeTakers(ni, us || 70, hsh("us" + f.us + "-" + S.yr + "-" + p.ln), 11, p.ln);
    var me = {n: p.fn.charAt(0) + ". " + p.ln, pos: p.pos, me: true,
      pen: Math.round(clamp(gk ? p.ovr - 14 : (at.TIR || p.ovr), 30, 99)),
      comp: Math.round(clamp(45 + (p.prof - 50) * 0.3 + (p.mor - 50) * 0.35 + Math.min(20, p.fame / 4), 5, 99)),
      fat: Math.round(clamp(100 - p.fit + 18, 5, 95))};
    var order;
    if (gk) { order = mates.filter(function (t) { return t.pos !== "POR"; }).slice(0, 10); order = autoOrder(order).concat([me]); }
    else {
      var out = mates.filter(function (t) { return t.pos !== "POR"; }).slice(0, 9).concat([me]);
      order = autoOrder(out).concat(mates.filter(function (t) { return t.pos === "POR"; }).slice(0, 1));
    }
    var them = fakeTakers(f.isNat ? f.opp : W.clubs[f.opp].ci, f.or || 70, hsh("op" + f.opp + "-" + S.yr + "-" + p.ln), 11);
    var myGk = gk ? Math.round(clamp(((at.REF || p.ovr) + (at.EST || at.COL || p.ovr)) / 2, 40, 95)) : (us || 70);
    return {us: order, them: them, gkUs: myGk, gkThem: f.or || 70, imp: f.imp || 1, gkMe: gk};
  }
  function myIndex(st) { for (var i = 0; i < st.us.length; i++) if (st.us[i].me) return i; return -1; }

  /* ---------- aplicar el resultado ---------- */
  function apply(f, st) { var sc = score2(st); f.pens = [sc[0], sc[1]]; return {a: sc[0], b: sc[1], win: sc[0] > sc[1]}; }
  function dots(st, s) { return st.k[s].map(function (v) { return v ? "✓" : "✗"; }).join(""); }

  return {make: make, nextKick: nextKick, record: record, simKick: simKick, simAll: simAll, done: done, winner: function (st) { return winner(st.k); }, score: score2,
    kickP: kickP, autoOrder: autoOrder, mgrTaker: mgrTaker, mgrList: mgrList, mgrCtx: mgrCtx, playerCtx: playerCtx, myIndex: myIndex, winProb: winProb,
    apply: apply, dots: dots, forced: null, hsh: hsh, srng: srng};
})();

/* ---------- modo jugador: opción 0 «vivir la tanda entera» ---------- */
(function () {
  var _opts = SHOOTOUT_OPTS, _res = resolveShootout;
  SHOOTOUT_OPTS = function (gk) {
    var list = _opts(gk), f = S.cur && S.pend[0] && S.pend[0].k === "so" ? S.cur.pm[S.pend[0].fi] : null, wp = 0.5;
    try { if (f) wp = SO.winProb(SO.playerCtx(f), 120); } catch (e) { wp = 0.5; }
    list.unshift({t: gk ? tr("Vivir la tanda bajo palos") : tr("Vivir la tanda entera"), so: gk ? "gk" : "out",
      d: gk ? tr("Te enfrentas a cada lanzador rival y sigues los penaltis de tus compañeros.") : tr("Penalti a penalti: cuando te toque en el orden, tiras tú."),
      p: wp, badge: tr("Pasáis"), ok: {lab: tr("Pasáis"), txt: "", fx: {}}, ko: {lab: tr("Eliminados"), txt: "", fx: {}}});
    return list;
  };
  resolveShootout = function (f, choice) {
    var gk = isGK(), o = SHOOTOUT_OPTS(gk)[choice];
    if (!o || !o.so) return _res(f, choice);
    var st = SO.forced && SO.done(SO.forced) ? SO.forced : SO.simAll(SO.make(Object.assign(SO.playerCtx(f), {first: R() < 0.5 ? 1 : 0})));
    SO.forced = null;
    var r = SO.apply(f, st), p = S.p, sp = {a: r.a, b: r.b};
    var mine = st.log.filter(function (l) { return l.s === 0 && l.me; }), saves = gk ? st.log.filter(function (l) { return l.s === 1 && !l.ok && l.h === "parada"; }).length : 0;
    var fx = {}, rating = 0, chips = [], txt;
    if (gk) {
      if (saves) { fx.fame = Math.min(6, 2 * saves); rating += 0.35 * saves; }
      chips.push(["note", 0, trn(saves, "Paras {n} penalti", "Paras {n} penaltis")]);
      txt = saves ? trn(saves, "Detienes {n} lanzamiento en la tanda.", "Detienes {n} lanzamientos en la tanda.") : tr("No consigues detener ningún lanzamiento.");
    } else if (mine.length) {
      var miss = mine.filter(function (l) { return !l.ok; }).length;
      if (miss) { fx.mor = -4; rating -= 0.3; } else { fx.fame = 2; rating += 0.4; }
      chips.push(["note", 0, miss ? tr("Tu penalti: fallado") : tr("Tu penalti: dentro")]);
      txt = miss ? tr("Fallas tu penalti. El silencio se hace eterno.") : tr("Marcas tu penalti con sangre fría.");
      if (miss && f.isNat && f.imp >= 1) p.flags.natVillain = S.yr;
    } else { txt = tr("La tanda se decide antes de que te toque tirar."); chips.push(["note", 0, tr("No llegas a tirar")]); }
    chips.push(["note", 0, SO.dots(st, 0) + " · " + SO.dots(st, 1)]);
    f.mr += rating;
    chips = chips.concat(applyFx(fx));
    txt += " " + (r.win ? (gk ? tr("La tanda termina {a}-{b}: ¡clasificados!", sp) : tr("La tanda termina {a}-{b}: ¡pasáis vosotros!", sp)) : (gk ? tr("La tanda termina {a}-{b}: eliminados.", sp) : tr("La tanda termina {a}-{b}: quedáis fuera.", sp)));
    return {txt: txt, good: r.win, choice: o.t, chips: chips};
  };
})();

/* ---------- modo míster: opción 0 «ordenar lanzadores y vivir la tanda» ---------- */
(function () {
  var h = MPH.mso, _opts = h.opts, _apply = h.apply, _card = h.card, _head = h.head;
  h.head = function (x) {
    var d = _head(x);
    d.text = tr("Empate tras la prórroga. Ordena a tus lanzadores en la pizarra y vive la tanda penalti a penalti, o decide solo quién tira el quinto.");
    return d;
  };
  h.opts = function (x) {
    var f = S.cur.pm[x.fi], wp = 0.5;
    try { wp = SO.winProb(SO.mgrCtx(f, x.ord), 120); } catch (e) { wp = 0.5; }
    return [{t: tr("Ordenar lanzadores y vivir la tanda"), d: tr("Pizarra táctica: técnica, sangre fría y fatiga de cada uno. Luego, penalti a penalti."), so: "mgr", p: wp, badge: tr("Pasáis"),
      ok: {lab: tr("Pasáis"), txt: "", fx: {}}, ko: {lab: tr("Eliminados"), txt: "", fx: {}}}].concat(_opts(x));
  };
  h.apply = function (x, o, res) {
    if (!o.so) return _apply(x, o, res);
    var f = S.cur.pm[x.fi];
    var st = SO.forced && SO.done(SO.forced) ? SO.forced : SO.simAll(SO.make(Object.assign(SO.mgrCtx(f, x.ord), {first: R() < 0.5 ? 1 : 0})));
    SO.forced = null;
    var r = SO.apply(f, st), chips = [["note", 0, tr("Tanda {a}-{b}", {a: r.a, b: r.b})]], hero = null, goat = null;
    st.log.forEach(function (l, i) {
      if (l.s !== 0) return;
      var t = st.us.filter(function (u) { return u.n === l.n; })[0], p = t && t.id != null ? mPl(t.id) : null;
      if (!p) return;
      if (l.kind && l.ok) { p.mor = clamp(p.mor + 5, 0, 100); hero = p; }
      if (!l.ok) { p.mor = clamp(p.mor - (l.kind ? 8 : 4), 0, 100); goat = p; }
    });
    if (hero) chips.push(["note", 0, tr("{name}, decisivo", {name: plShort(hero)})]);
    if (goat) chips.push(["note", 0, tr("{name} falla", {name: plShort(goat)})]);
    x.so = {a: r.a, b: r.b, taken: true, full: true, dots: SO.dots(st, 0) + " · " + SO.dots(st, 1), n: st.log.length};
    return chips;
  };
  h.card = function (x, o, res, chips, head) {
    if (!o.so) return _card(x, o, res, chips, head);
    var r = x.so, good = r.a > r.b;
    return {t: "moment", tipo: "mgr", title: tr("Tanda de penaltis"), ctx: head.ctxTxt, choice: tr("Tanda en directo con tu orden de lanzadores"),
      txt: tr("{n} lanzamientos: {dots}.", {n: r.n, dots: r.dots}) + " " + (good ? tr("Termina {a}-{b}: ¡pasáis!", {a: r.a, b: r.b}) : tr("Termina {a}-{b}: eliminados.", {a: r.a, b: r.b})), chips: chips, good: good, y: S.yr};
  };
})();
/* que la descripción de la opción lleve la marca de «tanda en directo» hasta la interfaz */
(function () { var _d = descOpt; descOpt = function (o, prev) { var d = _d(o, prev); if (o.so) d.so = o.so; return d; }; })();
