/* draw.js — sorteos en directo (motor).
   Los emparejamientos los decide siempre el motor de competiciones (mkGroups, mkSwiss, koRoundDone, buildKOFromTable,
   uclR16Fill…). Este módulo solo detecta, justo después, que se han decidido los de una competición en la que está tu
   equipo y crea una decisión pendiente «draw» que la interfaz representa como una ceremonia: así el sorteo nunca
   contradice el calendario real.
   x = {k: "draw", id, ck, cn, typ: "grp"|"lp"|"ko", rn, nat, me, fix, pots: [[t…]…], pl: [nombres de bombo],
        seq: [[bombo, equipo, casilla]…], res: grupos | cruces | rivales, rx: {hl, bd, txt, posts}}
   Antes del siguiente partido del usuario, la carrera se detiene una vez para que el sorteo se vea antes de jugarlo. */

function drawRt(c, t) { return c && c.nat ? S.nr[t] : S.cr[t]; }
function drawTeamName(c, t) { return c && c.nat ? natName(t) : clubName(t); }
/* tu equipo en esa competición (o -1 si el sorteo no te afecta) */
function drawMe(c) {
  if (!S || !c) return -1;
  if (S.mode === "mgr") return !c.nat && S.m && S.m.club >= 0 ? S.m.club : -1;
  var p = S.p;
  if (!p) return -1;
  if (c.nat) return p.inat >= 0 && S.cur && S.cur.summer && S.sq && S.sq[c.k] ? p.inat : -1;
  if (S.cur && S.cur.summer && S.sq && S.sq.any) return -1;
  return p.club;
}
function drawSkipComp(c) {
  if (!c || c.typ === "lite" || c.typ === "nq" || c.done) return true;
  var k = String(c.k);
  return k === "USC" || k === "REC" || k === "ICC" || k === "NL" || k === "NLB" || k.indexOf("SC:") === 0;
}
/* fase de grupos o de liga sin empezar (o empezando esta misma semana, antes de tu partido) */
function drawFresh(c) { return c.md === 0 || !!(c.mdW && c.mdW[0] >= S.w); }
function drawLow(s) { return typeof LANG !== "undefined" && LANG === "es" ? String(s).toLowerCase() : s; }

/* ---------- detección ---------- */
function drawScanComp(c) {
  if (drawSkipComp(c)) return;
  var me = drawMe(c);
  if (me < 0) return;
  S.drw = S.drw || [];
  var x = null, key;
  if (c.typ === "grp" && !c.ko && drawFresh(c) && c.g && c.g.some(function (g) { return g.indexOf(me) >= 0; })) {
    key = c.k + ":g";
    if (S.drw.indexOf(key) < 0) x = drawBuildGroups(c, me);
  } else if (c.typ === "swiss" && !c.ko && drawFresh(c) && c.teams.indexOf(me) >= 0) {
    key = c.k + ":lp";
    if (S.drw.indexOf(key) < 0) x = drawBuildLP(c, me);
  } else if (c.ko && c.ko.r[c.ko.ri]) {
    var ri = c.ko.ri, rd = c.ko.r[ri];
    key = c.k + ":r" + ri;
    if (S.drw.indexOf(key) >= 0) return;
    var real = rd.ties.filter(function (t) { return t.a >= 0 && t.b >= 0; });
    if (real.length < 2 || (!c.nat && real.length > (c.dom ? 4 : 8))) return;
    if (!real.some(function (t) { return t.w < 0 && (t.a === me || t.b === me); })) return;
    if (real.some(function (t) { return t.s && t.s.length; })) return;
    x = drawBuildKO(c, me, ri, real);
  }
  if (!x) return;
  S.drw.push(key);
  if (S.drw.length > 30) S.drw = S.drw.slice(-30);
  x.id = key + ":" + S.yr;
  drawAnalyze(c, x);
  if (S.mode === "mgr") x.ui = true;
  x.s = Math.floor(Math.random() * 1e9);
  S.pend.push(x);
}
function drawScanAll() { if (S && S.C) Object.keys(S.C).forEach(function (k) { drawScanComp(S.C[k]); }); }
function drawBase(c, me, typ) {
  return {k: "draw", ck: c.k, cn: c.n, typ: typ, nat: !!c.nat, me: me, lvl: c.lvl || 1, dom: !!c.dom};
}
/* grupos: el motor ya repartió por bombos (bombo p → posición p de cada grupo) */
function drawBuildGroups(c, me) {
  var x = drawBase(c, me, "grp"), per = c.g[0].length, ng = c.g.length;
  x.rn = N_("Fase de grupos");
  x.pots = []; x.pl = []; x.seq = [];
  for (var p = 0; p < per; p++) {
    var pot = [];
    for (var gi = 0; gi < ng; gi++) { if (c.g[gi][p] != null) { pot.push(c.g[gi][p]); x.seq.push([p, c.g[gi][p], gi]); } }
    x.pots.push(pot.slice().sort(function () { return Math.random() - 0.5; }));
    x.pl.push(p + 1);
  }
  x.res = c.g.map(function (g) { return g.slice(); });
  return x;
}
/* fase de liga suiza: bombos por nivel y tus ocho rivales del calendario real */
function drawBuildLP(c, me) {
  var x = drawBase(c, me, "lp"), N = c.teams.length, np = 4, sz = Math.ceil(N / np), mi = c.teams.indexOf(me);
  var sorted = c.teams.slice().sort(function (a, b) { return S.cr[b] - S.cr[a]; });
  x.rn = N_("Fase de liga");
  x.pots = []; x.pl = [];
  for (var p = 0; p < np; p++) { x.pots.push(sorted.slice(p * sz, p * sz + sz)); x.pl.push(p + 1); }
  var potOf = function (t) { for (var i = 0; i < x.pots.length; i++) if (x.pots[i].indexOf(t) >= 0) return i; return 0; };
  x.mp = potOf(me);
  var opp = [];
  c.sched.forEach(function (pairs) {
    pairs.forEach(function (pr) { if (pr[0] === mi) opp.push({t: c.teams[pr[1]], h: 1}); else if (pr[1] === mi) opp.push({t: c.teams[pr[0]], h: 0}); });
  });
  opp.sort(function (a, b) { return potOf(a.t) - potOf(b.t); });
  x.res = opp.map(function (o) { return [o.t, o.h]; });
  x.seq = opp.map(function (o, i) { return [potOf(o.t), o.t, i]; });
  x.pots = x.pots.map(function (pt) { return pt.filter(function (t) { return t !== me; }).sort(function () { return Math.random() - 0.5; }); });
  return x;
}
/* eliminatoria: cabezas de serie (fase previa) o bombo único (copas por sorteo puro) */
function drawBuildKO(c, me, ri, ties) {
  var x = drawBase(c, me, "ko"), rd = c.ko.r[ri];
  x.rn = rd.n;
  var random = rd.draw === "random" || (c.dom && ri === 0);
  var seeded = !random && (ri === 0 || !!(c.ko.top8 && ri === 1));
  x.fix = !random && !seeded;
  var order = ties.slice().sort(function () { return Math.random() - 0.5; });
  /* tu cruce nunca sale el primero: un poco de suspense */
  var mine = order.filter(function (t) { return t.a === me || t.b === me; })[0];
  if (order.length > 2 && order[0] === mine) { order.splice(0, 1); order.splice(1 + Math.floor(Math.random() * (order.length - 1)), 0, mine); }
  x.res = order.map(function (t) { return [t.a, t.b]; });
  x.seq = [];
  if (seeded) {
    x.pots = [order.map(function (t) { return t.b; }), order.map(function (t) { return t.a; })];
    x.pl = [N_("Cabezas de serie"), N_("Sin cabeza de serie")];
    order.forEach(function (t, i) { x.seq.push([1, t.a, i * 2]); x.seq.push([0, t.b, i * 2 + 1]); });
  } else {
    var all = []; order.forEach(function (t) { all.push(t.a, t.b); });
    x.pots = [all];
    x.pl = [x.fix ? N_("Clasificados") : N_("Bombo único")];
    order.forEach(function (t, i) { x.seq.push([0, t.a, i * 2]); x.seq.push([0, t.b, i * 2 + 1]); });
  }
  x.pots = x.pots.map(function (pt) { return pt.slice().sort(function () { return Math.random() - 0.5; }); });
  return x;
}

/* ---------- lectura del sorteo: titulares, directiva y redes ---------- */
function drawExClubs() {
  var out = [];
  if (S.mode === "mgr") {
    (S.m.spells || []).forEach(function (s) { if (s.club !== S.m.club && out.indexOf(s.club) < 0) out.push(s.club); });
    if (S.m.exClub != null && S.m.exClub >= 0 && S.m.exClub !== S.m.club && out.indexOf(S.m.exClub) < 0) out.push(S.m.exClub);
  } else {
    (S.p.seasons || []).forEach(function (r) { (r.clubs || [r.club]).forEach(function (cl) { if (cl !== S.p.club && out.indexOf(cl) < 0) out.push(cl); }); });
    if (S.p.ss && S.p.ss.clubs) S.p.ss.clubs.forEach(function (cl) { if (cl !== S.p.club && out.indexOf(cl) < 0) out.push(cl); });
  }
  return out;
}
/* rivales directos del usuario según el tipo de sorteo */
function drawRivals(x) {
  if (x.typ === "grp") { for (var i = 0; i < x.res.length; i++) if (x.res[i].indexOf(x.me) >= 0) return x.res[i].filter(function (t) { return t !== x.me; }); return []; }
  if (x.typ === "lp") return x.res.map(function (r) { return r[0]; });
  for (var j = 0; j < x.res.length; j++) { var t = x.res[j]; if (t[0] === x.me) return [t[1]]; if (t[1] === x.me) return [t[0]]; }
  return [];
}
function drawAnalyze(c, x) {
  var me = x.me, rm = drawRt(c, me), riv = drawRivals(x), hl = [], tone = 0, rnd = drawLow(tr(x.rn));
  var best = riv.slice().sort(function (a, b) { return drawRt(c, b) - drawRt(c, a); });
  var tp = {team: drawTeamName(c, me), opp: best.length ? drawTeamName(c, best[0]) : "", comp: trComp(c.n), round: rnd};
  var pct = 50;
  if (x.typ === "grp") {
    var sums = x.res.map(function (g) { var s = 0; g.forEach(function (t) { s += drawRt(c, t); }); return s / Math.max(1, g.length); });
    var gi = 0; x.res.forEach(function (g, i) { if (g.indexOf(me) >= 0) gi = i; });
    var maxS = Math.max.apply(null, sums), avgO = 0;
    riv.forEach(function (t) { avgO += drawRt(c, t); }); avgO /= Math.max(1, riv.length);
    x.gi = gi;
    tp.group = String.fromCharCode(65 + gi);
    var stronger = riv.filter(function (t) { return drawRt(c, t) > rm + 1; }).length;
    if (sums[gi] >= maxS - 0.01 && x.res.length > 1) { tone = -1; hl.push({tk: N_("¡Grupo de la muerte para {team}!"), tp: tp, t: -1}); }
    else if (riv.every(function (t) { return drawRt(c, t) < rm - 2.5; })) { tone = 1; hl.push({tk: N_("Grupo asequible: {team} parte como favorito del grupo {group}"), tp: tp, t: 1}); }
    else if (stronger >= 1 && avgO > rm) { tone = -1; hl.push({tk: N_("Grupo con trampa: {opp} manda en el grupo {group}"), tp: tp, t: -1}); }
    else hl.push({tk: N_("Grupo {group} equilibrado: todo por decidir"), tp: tp, t: 0});
    var rank = riv.filter(function (t) { return drawRt(c, t) > rm; }).length;
    pct = [86, 64, 38, 18, 10][Math.min(4, rank)];
  } else if (x.typ === "lp") {
    var all = 0; c.teams.forEach(function (t) { all += drawRt(c, t); }); all /= c.teams.length;
    var ao = 0; riv.forEach(function (t) { ao += drawRt(c, t); }); ao /= Math.max(1, riv.length);
    tp.opp2 = best[1] != null ? drawTeamName(c, best[1]) : tp.opp;
    tp.n = Math.round(ao);
    if (ao > all + 1.5) { tone = -1; hl.push({tk: N_("Fase de liga de alto voltaje: {opp} y {opp2} en el camino de {team}"), tp: tp, t: -1}); }
    else if (ao < all - 1.5) { tone = 1; hl.push({tk: N_("Calendario amable para {team} en la fase de liga"), tp: tp, t: 1}); }
    else hl.push({tk: N_("Ni sustos ni regalos: el plato fuerte para {team} será {opp}"), tp: tp, t: 0});
    pct = Math.round(clamp(sigmoid((rm - ao) * 0.22 + 0.4) * 100, 5, 97));
  } else {
    var opp = riv[0], d = opp != null ? drawRt(c, opp) - rm : 0;
    if (d >= 3.5) { tone = -1; hl.push({tk: N_("Hueso en {round}: {team} se cruza con {opp}"), tp: tp, t: -1}); }
    else if (d <= -3.5) { tone = 1; hl.push({tk: N_("Cruce asequible para {round}: {team} – {opp}"), tp: tp, t: 1}); }
    else hl.push({tk: N_("Cruce igualado en {round}: {team} – {opp}"), tp: tp, t: 0});
    pct = Math.round(clamp(sigmoid(-d * 0.2) * 100, 4, 96));
  }
  tp.n = tp.n != null ? tp.n : pct;
  tp.pct = pct;
  /* derbis, ex y duelos fratricidas */
  var exs = c.nat ? [] : drawExClubs(), derby = -1, ex = -1, frat = -1;
  riv.forEach(function (t) {
    if (!c.nat && derby < 0 && W.derby && W.derby[me + "-" + t]) derby = t;
    if (ex < 0 && exs.indexOf(t) >= 0) ex = t;
    if (!c.nat && !c.dom && frat < 0 && W.clubs[t] && W.clubs[me] && W.clubs[t].ci === W.clubs[me].ci) frat = t;
  });
  if (derby >= 0) hl.unshift({tk: N_("¡Derbi en el sorteo! {team} y {rival}, cara a cara"), tp: Object.assign({}, tp, {rival: drawTeamName(c, derby)}), t: 0});
  if (ex >= 0) hl.push({tk: N_("Reencuentro con tu ex: {rival} en el camino"), tp: Object.assign({}, tp, {rival: drawTeamName(c, ex)}), t: 0});
  if (frat >= 0 && derby !== frat) hl.push({tk: N_("Duelo fratricida: {team} y {rival} chocan en {comp}"), tp: Object.assign({}, tp, {rival: drawTeamName(c, frat)}), t: 0});
  hl = hl.slice(0, 3);
  /* directiva (míster) o vestuario (jugador) */
  var mgr = S.mode === "mgr", bd = 0, txt;
  if (mgr) {
    bd = tone > 0 ? 2 : tone < 0 ? -2 : 0;
    if (derby >= 0) bd += 1;
    txt = tone > 0 ? N_("La directiva sale sonriendo del sorteo: «Hay que aprovecharlo».") : tone < 0 ? N_("Caras largas en el palco: «No nos ha sonreído la suerte».") : N_("La directiva, prudente: «A estas alturas no hay rivales fáciles».");
  } else txt = tone > 0 ? N_("En el vestuario hay buen ambiente: «Es un sorteo para soñar».") : tone < 0 ? N_("Tu entrenador lo tiene claro: «Toca competir al máximo».") : N_("Tus compañeros, concentrados: «Iremos partido a partido».");
  /* redes: las cuentas se eligen ya para que la ceremonia enseñe lo mismo que quedará publicado */
  var posts = [], au = function (by) { return typeof socAuthor === "function" && typeof SOCIAL_ACCOUNTS !== "undefined" ? socAuthor(by) : {n: "Hincha", hd: "hincha", av: "🙂", fan: 1}; };
  var ptp = Object.assign({}, tp, {rival: derby >= 0 ? drawTeamName(c, derby) : ex >= 0 ? drawTeamName(c, ex) : tp.opp});
  var pressT = x.typ === "grp" ? N_("🗞️ SORTEO {comp} | {team} cae en el grupo {group} y su rival más fuerte será {opp}.") :
    x.typ === "lp" ? N_("🗞️ SORTEO {comp} | {team} se medirá a {opp}, {opp2} y seis rivales más en la fase de liga.") :
    N_("🗞️ SORTEO {comp} | {round}: {team} – {opp}. Ya hay cruce.");
  posts.push({au: au("press"), tk: pressT, tp: ptp, m: 0});
  var memeT = derby >= 0 ? N_("Semana de derbi en {comp}. Que alguien prepare las palomitas 🍿🔥") :
    tone < 0 ? N_("La afición de {team} al ver el sorteo: 💀💀💀") : tone > 0 ? N_("La afición de {team} viendo el sorteo: 🥳🍿") : N_("Sorteo de {comp}: {team} y {opp}. Esto va a estar muy reñido 👀");
  posts.push({au: au("meme"), tk: memeT, tp: ptp, m: tone});
  if (ex >= 0) posts.push({au: au("fan"), tk: N_("{rival} otra vez en tu camino, {self}. El fútbol siempre vuelve a casa 👀"), tp: Object.assign({}, ptp, {self: typeof socSelfName === "function" ? socSelfName() : ""}), m: 0});
  else {
    var statT = x.typ === "grp" ? N_("📊 Probabilidad de que {team} pase de la fase de grupos: {pct} %.") : x.typ === "lp" ? N_("📊 Nivel medio de los rivales de {team} en la fase de liga: {n}.") : N_("📊 Probabilidad de que {team} supere el cruce ante {opp}: {pct} %.");
    posts.push({au: au("stats"), tk: statT, tp: ptp, m: 0});
  }
  x.rx = {hl: hl, tone: tone, bd: bd, txt: txt, posts: posts};
  return x;
}

/* ---------- resolución ---------- */
function drawSummary(x) {
  var c = {nat: x.nat}, riv = drawRivals(x);
  if (x.typ === "grp") return tr("Grupo {group}: {teams}", {group: String.fromCharCode(65 + (x.gi || 0)), teams: riv.map(function (t) { return drawTeamName(c, t); }).join(", ")});
  if (x.typ === "lp") return tr("Rivales: {teams}", {teams: riv.map(function (t) { return drawTeamName(c, t); }).join(", ")});
  return riv.length ? tr("Rival: {team}", {team: drawTeamName(c, riv[0])}) : "";
}
function drawTitle(x) {
  if (x.typ === "grp") return tr("Sorteo de la fase de grupos");
  if (x.typ === "lp") return tr("Sorteo de la fase de liga");
  return x.fix ? tr("Cuadro de {round}", {round: drawLow(tr(x.rn))}) : tr("Sorteo de {round}", {round: drawLow(tr(x.rn))});
}
function drawApply(x) {
  var chips = [];
  if (S.mode === "mgr" && x.rx && x.rx.bd) chips = mgrFx({board: x.rx.bd});
  if (x.rx && typeof socPostRaw === "function") x.rx.posts.forEach(function (p) {
    var post = socPostRaw({by: "fan", tk: p.tk, tp: p.tp, mood: p.m || 0});
    if (post && p.au) post.au = p.au;
  });
  return chips;
}
function drawCard(x, chips) {
  var h0 = x.rx && x.rx.hl[0];
  return {t: "decision", tipo: S.mode === "mgr" ? "mgr" : "real", cat: trComp(x.cn), title: drawTitle(x), choice: drawSummary(x),
    txt: h0 ? tr(h0.tk, h0.tp) : "", chips: chips || [], y: S.yr, good: x.rx && x.rx.tone ? x.rx.tone > 0 : null};
}
function drawDesc(x) {
  return {tag: "hot", tagTxt: tr("Sorteo en directo"), cls: "hotc", cat: trComp(x.cn), title: drawTitle(x),
    text: tr("Las bolas ya están en los bombos y tu equipo espera rival."), opts: [descOpt({t: tr("Ver el sorteo"), ok: {txt: ""}}, function () { return []; })]};
}
EX_PEND.draw = {
  desc: drawDesc,
  resolve: function (x) { S.pend.shift(); return drawCard(x, drawApply(x)); }
};
if (typeof MPH !== "undefined") MPH.draw = {
  fixed: true,
  head: function (x) { var d = drawDesc(x); return {tag: d.tag, tagTxt: d.tagTxt, cls: d.cls, cat: d.cat, title: d.title, text: d.text}; },
  opts: function () { return [{t: tr("Ver el sorteo"), ok: {txt: ""}}]; },
  apply: function (x) { return drawApply(x); },
  card: function (x, o, res, chips) { return drawCard(x, chips); }
};

/* ---------- ganchos ---------- */
(function () {
  /* tras cada resultado: ¿se acaba de decidir una ronda de una competición tuya? */
  var _rec = recordFixture;
  recordFixture = function (f) {
    var r = _rec.apply(this, arguments);
    try { if (f && (f.kind === "tb" || f.kind === "ko") && S.C && S.C[f.ck]) drawScanComp(S.C[f.ck]); } catch (e) { if (typeof console !== "undefined") console.error(e); }
    return r;
  };
  /* temporada nueva: lista de sorteos ya vistos a cero */
  var _setup = setupSeasonComps;
  setupSeasonComps = function () { var r = _setup.apply(this, arguments); S.drw = []; return r; };
  /* antes de tu siguiente partido, la carrera se para una vez si hay un sorteo sin ver */
  function hold(f) {
    if (!f || f.st != null) return false;
    try { drawScanAll(); } catch (e) { if (typeof console !== "undefined") console.error(e); }
    var any = false;
    S.pend.forEach(function (x) { if (x.k === "draw" && !x.held) { x.held = true; any = true; } });
    return any;
  }
  if (typeof playPlayerFixture === "function") {
    var _pp = playPlayerFixture;
    playPlayerFixture = function (f) { if (hold(f)) return "pause"; return _pp.apply(this, arguments); };
  }
  if (typeof mgrPlayFixture === "function") {
    var _mp = mgrPlayFixture;
    mgrPlayFixture = function (f) { if (hold(f)) return "pause"; return _mp.apply(this, arguments); };
  }
})();
