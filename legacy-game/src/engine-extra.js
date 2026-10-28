/* ===== PARCHE 2.0 =====
   Objetivos de temporada a elegir, ruedas de prensa, red social, partidos en directo del míster y motes de la afición.
   Se engancha al motor con unas pocas llamadas (ver engine-player.js / engine-manager.js). */

/* ============ OBJETIVOS DE TEMPORADA A ELEGIR ============
   Cada categoría ofrece tres metas. La dificultad que se enseña depende de tu media frente al nivel del club y de tu
   contrato (jugador) o de la media de la plantilla y tu prestigio (míster). Cuanto más difícil, mayor recompensa. */
var OBJ_LV = [N_("Fácil"), N_("Normal"), N_("Difícil"), N_("Muy difícil")];
var OBJ_MULT = [0.5, 1, 1.6, 2.2], OBJ_FAIL = [1.3, 1, 0.7, 0.45];
function objLevel(ratio) { return ratio < 0.8 ? 0 : ratio < 1.06 ? 1 : ratio < 1.32 ? 2 : 3; }
function objPosLevel(t, exp) { return t >= exp + 3 ? 0 : t >= exp ? 1 : t >= exp - 2 ? 2 : 3; }
function objLabel(o) { return o && o.lv != null ? tr(OBJ_LV[o.lv]) : ""; }

/* metas de posición en liga (mismo texto que antes) */
function objPosOpt(li, t, n, mgr) {
  var lg = W.lg[li], tk, tp = null;
  t = clamp(Math.round(t), 1, n);
  if (lg.upI >= 0 && t <= (lgUpN(li) || 3)) { tk = N_("Ascender (top {n})"); tp = {n: lgUpN(li) || 3}; t = lgUpN(li) || 3; }
  else if (t <= 1) { t = 1; tk = N_("Ganar la liga"); }
  else if (t <= Math.ceil(n / 2)) { tk = N_("Terminar entre los {n} primeros"); tp = {n: t}; }
  else if (lg.rel && t >= n - lg.rel) { t = n - lg.rel; tk = N_("Evitar el descenso"); }
  else { tk = N_("Terminar entre los {n} primeros"); tp = {n: t}; }
  return objT({k: "pos", v: t, main: !!mgr}, tk, tp);
}
function uniqObjs(list) {
  var seen = {}, out = [];
  list.forEach(function (o) { var key = o.k + ":" + o.v + ":" + (o.ck || ""); if (!seen[key]) { seen[key] = 1; out.push(o); } });
  return out;
}
/* jugador: tres categorías (partidos, aportación según posición, posición del equipo) */
function playerObjChoices() {
  var p = S.p, role = roleNow(), g = posGroup(), li = S.cl[p.club], cats = [];
  var str = clamp(1 + (p.ovr - S.cr[p.club]) * 0.03, 0.6, 1.5);
  var mk = function (base, fn) { return [0.7, 1, 1.35].map(function (q) { return fn(Math.max(1, Math.round(base * q))); }); };
  var appsB = {Estrella: 34, Titular: 28, "Rotación": 20, Suplente: 12, Promesa: 8, Reserva: 6}[role] || 15;
  cats.push({n: N_("Minutos"), list: mk(appsB, function (v) { v = Math.min(v, 42); var o = objT({k: "apps", v: v}, N_("Jugar {n} partidos"), {n: v}); o.lv = objLevel(v / (appsB * Math.min(1.2, str))); return o; })});
  var tier = {Estrella: 0, Titular: 1, "Rotación": 2, Suplente: 3, Promesa: 4, Reserva: 4}[role] || 2;
  if (g === "DEL") { var gv = [22, 14, 8, 4, 2][tier]; cats.push({n: N_("Goles"), list: mk(gv, function (v) { var o = objT({k: "g", v: v}, N_("Marcar {n} goles"), {n: v}); o.lv = objLevel(v / (gv * str)); return o; })}); }
  else if (g === "MED") { var mv = [18, 12, 7, 3, 2][tier]; cats.push({n: N_("Goles y asistencias"), list: mk(mv, function (v) { var o = objT({k: "ga", v: v}, N_("Sumar {n} goles + asistencias"), {n: v}); o.lv = objLevel(v / (mv * str)); return o; })}); }
  else if (g === "DEF") {
    var er = 6.6 + (p.ovr - S.cr[p.club]) * 0.03;
    cats.push({n: N_("Rendimiento"), list: [6.7, 6.9, 7.15].map(function (v) { var o = objT({k: "rt", v: v}, N_("Nota media de {rating} o más"), {rating: v}); o.lv = objLevel(1 + (v - er) * 2.2); return o; })});
  } else {
    var cv = [16, 12, 8, 3, 1][tier];
    cats.push({n: N_("Porterías a cero"), list: mk(cv, function (v) { var o = objT({k: "cs", v: v}, v === 1 ? N_("{n} portería a cero") : N_("{n} porterías a cero"), {n: v}); o.lv = objLevel(v / (cv * str)); return o; })});
  }
  if (li >= 0 && S.L && S.L[li]) {
    var L = S.L[li], exp = L.exp.indexOf(p.club) + 1, n = L.tm.length;
    var opts = uniqObjs([objPosOpt(li, exp + 3, n), objPosOpt(li, exp, n), objPosOpt(li, Math.max(1, exp - 2), n)]);
    opts.forEach(function (o) { o.lv = objPosLevel(o.v, exp); });
    cats.push({n: N_("Equipo"), list: opts});
  }
  cats.forEach(function (c) { c.list.forEach(function (o, i) { if (i > 0 && o.lv < c.list[i - 1].lv) o.lv = c.list[i - 1].lv; }); });
  return cats;
}
/* míster: liga, copa y competición continental, según la media de la plantilla y tu prestigio */
function mgrObjChoices() {
  var m = S.m, li = S.cl[m.club], L = S.L[li], n = L.tm.length, cats = [];
  var eff = mTeamRating(mBestXI(m.form)) + (m.rep - 50) * 0.04;
  var expR = 1 + L.tm.filter(function (c) { return c !== m.club && S.cr[c] > eff; }).length;
  var lo = uniqObjs([objPosOpt(li, expR + 3, n, true), objPosOpt(li, expR, n, true), objPosOpt(li, Math.max(1, expR - 2), n, true)]);
  lo.forEach(function (o) { o.lv = objPosLevel(o.v, expR); o.main = true; });
  cats.push({n: N_("Liga"), list: lo});
  var exp = L.exp.indexOf(m.club) + 1;
  var cup = S.C["CUP:" + W.clubs[m.club].c];
  var depthTk = ["", N_("Llegar a la final de {comp}"), N_("Llegar a semifinales de {comp}"), N_("Llegar a cuartos de {comp}")];
  if (cup && compHas(cup, m.club)) {
    var d = exp <= 2 ? 1 : exp <= 6 ? 2 : 3;
    var cl = [Math.min(3, d + 1), d, Math.max(0, d - 1)].map(function (v) {
      var o = v === 0 ? objT({k: "cup", ck: cup.k, v: 0}, N_("Ganar {comp}"), {comp: cup.n}) : objT({k: "cup", ck: cup.k, v: v}, depthTk[v], {comp: cup.n});
      o.lv = objPosLevel(v, d); return o;
    });
    cats.push({n: N_("Copa"), list: uniqObjs(cl)});
  }
  ["UCL", "LIB", "UEL", "ACL", "CAF", "CCC", "SUD", "UECL"].forEach(function (k) {
    var c = S.C[k];
    if (!c || !compHas(c, m.club)) return;
    var rank = c.teams && c.teams.length ? c.teams.slice().sort(byRating).indexOf(m.club) + 1 : 10;
    var base = rank <= 3 ? 2 : rank <= 8 ? 3 : 9;
    var steps = base >= 9 ? [9, 3, 2] : [Math.min(9, base + 1), base, Math.max(0, base - 1)];
    var tk = {9: N_("Superar la fase de liga de {comp}"), 3: N_("Llegar a cuartos de {comp}"), 2: N_("Llegar a semifinales de {comp}"), 1: N_("Llegar a la final de {comp}"), 0: N_("Ganar {comp}")};
    var cc = steps.map(function (v) { var o = objT({k: "cont", ck: k, v: v}, tk[v] || tk[3], {comp: c.n}); o.lv = objPosLevel(v === 9 ? 5 : v, base === 9 ? 5 : base); return o; });
    cats.push({n: N_("Europa y continente"), list: uniqObjs(cc)});
  });
  cats.forEach(function (c) { c.list.forEach(function (o, i) { if (i > 0 && o.lv < c.list[i - 1].lv) o.lv = c.list[i - 1].lv; }); });
  return cats;
}
/* pedir al jugador que elija (se deja puesta la opción normal por si acaso) */
function queueObjChoice() {
  var mgr = S.mode === "mgr", cats = mgr ? mgrObjChoices() : playerObjChoices();
  if (!cats.length) return;
  var sel = cats.map(function (c) { return Math.min(1, c.list.length - 1); });
  var objs = cats.map(function (c, i) { return c.list[sel[i]]; });
  if (mgr) S.m.objs = objs; else S.p.objs = objs;
  S.pend = S.pend.filter(function (x) { return x.k !== "objs"; });
  S.pend.push({k: "objs", cats: cats, sel: sel});
}
function confirmObjChoice() {
  var x = S.pend[0];
  if (!x || x.k !== "objs") return false;
  var objs = x.cats.map(function (c, i) { return c.list[x.sel[i]] || c.list[0]; });
  if (S.mode === "mgr") S.m.objs = objs; else S.p.objs = objs;
  S.pend.shift();
  socOnObjs(objs);
  return true;
}
/* recompensa o castigo de un objetivo al final de temporada (multiplicador por dificultad) */
function objMultOf(o, met) { var lv = o && o.lv != null ? o.lv : 1; return met ? OBJ_MULT[lv] : OBJ_FAIL[lv]; }

/* ============ MOTES DE LA AFICIÓN ============ */
var NICKS = {
  POR: [N_("El Gato"), N_("San {ln}"), N_("La Muralla"), N_("El Pulpo"), N_("Manos de Seda"), N_("El Candado")],
  DEF: [N_("El Muro"), N_("El Káiser"), N_("El Sheriff"), N_("La Roca"), N_("El Jefe"), N_("El Guardián")],
  MED: [N_("El Arquitecto"), N_("El Profesor"), N_("El Metrónomo"), N_("El Cerebro"), N_("El Mago"), N_("El Director de Orquesta")],
  DEL: [N_("El Killer"), N_("El Pistolero"), N_("El Matador"), N_("El Tanque"), N_("El Niño Maravilla"), N_("El Depredador")],
  RIT: [N_("El Rayo"), N_("El Correcaminos"), N_("La Bala")],
  REG: [N_("El Mago"), N_("El Bailarín"), N_("El Ilusionista")],
  TIR: [N_("El Cañonero"), N_("El Francotirador")],
  DT: [N_("El Profe"), N_("El Sabio"), N_("El Ingeniero"), N_("El Comandante"), N_("El Filósofo"), N_("El Alquimista"), N_("El Sargento"), N_("El Estratega")]
};
function nickFor(fn, ln, group, att) {
  var pool = (NICKS[group] || []).slice();
  if (att && NICKS[att]) pool = pool.concat(NICKS[att]);
  return pool[hashStr(fn + "|" + ln + "|" + group) % pool.length];
}
function maybeNickPlayer() {
  var p = S.p;
  if (p.nick || !p.seasons.length) return;
  var row = p.seasons[p.seasons.length - 1];
  var star = p.fame >= 32 || row.g >= 15 || (row.cs >= 15 && isGK()) || (row.rt >= 7.3 && row.apps >= 20) || p.seasons.length >= 5;
  if (!star) return;
  var at = attrs(), top = null, tv = -1;
  ["RIT", "REG", "TIR"].forEach(function (k) { if (at[k] != null && at[k] > tv) { tv = at[k]; top = k; } });
  var tk = nickFor(p.fn, p.ln, posGroup(), tv >= p.ovr + 4 ? top : null);
  p.nick = {tk: tk, tp: {ln: p.ln}, y: S.yr + 1};
  milestone(tr("La afición te bautiza: «{nick}»", {nick: tr(tk, {ln: p.ln})}));
  socPost("milestone", {name: p.fn + " " + p.ln, n: 0}, {by: "fan", mood: 1});
  socPostRaw({by: "meme", tk: N_("Ya es oficial: para la grada, {name} es «{nick}» 🔥"), tp: {name: p.fn + " " + p.ln, nick: tk, nickLn: p.ln}});
}
function maybeNickMgr() {
  var m = S.m;
  if (m.nick || !m.seasons || !m.seasons.length) return;
  if (m.rep < 45 && !m.trophies.length && m.seasons.length < 4) return;
  var tk = nickFor(m.fn, m.ln, "DT");
  m.nick = {tk: tk, tp: {ln: m.ln}, y: S.yr + 1};
  socPostRaw({by: "meme", tk: N_("Ya es oficial: para la grada, {name} es «{nick}» 🔥"), tp: {name: (m.fn ? m.fn + " " : "") + m.ln, nick: tk, nickLn: m.ln}});
}
function nickName(o) { return o && o.nick ? tr(o.nick.tk, o.nick.tp) : ""; }

/* ============ RUEDAS DE PRENSA ============ */
function pressLastOpp() {
  var log = S.blog || [];
  for (var i = log.length - 1; i >= 0; i--) if (!log[i].nat && log[i].o >= 0) return log[i].o;
  return -1;
}
function pressCtx() {
  var mgr = S.mode === "mgr", club = mgr ? S.m.club : S.p.club, ctx = [], log = (S.blog || []).filter(function (e) { return !e.nat; });
  if (club < 0) return ctx;
  var w = 0, l = 0, d = 0;
  log.forEach(function (e) {
    var gu = e.gu, gt = e.gt;
    if (gu > gt) w++; else if (gu < gt) l++; else d++;
    if (gu - gt >= 3) ctx.push("bigwin");
    if (gt - gu >= 3) ctx.push("bigloss");
    if (W.derby[club + "-" + e.o]) ctx.push("derby");
    if (e.r && /Final/.test(e.r)) ctx.push("final");
  });
  if (log.length) ctx.push(w > l ? "win" : l > w ? "loss" : "draw");
  if (l >= w + 3) ctx.push("crisis");
  var li = S.cl[club], pos = posInLeague(club), n = S.L && S.L[li] ? S.L[li].tm.length : 20;
  if (S.bi >= 2 && pos > 0 && pos <= 2) ctx.push("title");
  if (S.bi >= 2 && pos >= n - 3) ctx.push("relegation");
  if (mgr ? S.m.sq.filter(function (p) { return p.inj > 0 && (p.role === "C" || p.role === "I"); }).length >= 2 : !!(S.p.inj && S.p.injT > S.tw)) ctx.push("injury");
  if (!mgr && (S.p.flags.wantOut || (S.p.con && S.p.con.yrs <= 1))) ctx.push("rumour");
  if (mgr && S.m.board < 40) ctx.push("crisis");
  if ((!mgr && S.p.flags.recentRed) || chance(0.12)) ctx.push("controversy");
  return ctx;
}
function pressParams() {
  var mgr = S.mode === "mgr", club = mgr ? S.m.club : S.p.club, opp = pressLastOpp(), li = S.cl[club];
  var o = {club: clubName(club), opp: opp >= 0 ? clubName(opp) : tr("rival"), lg: li >= 0 ? lgName(li) : "", coach: opp >= 0 ? coachName(opp) : tr("su entrenador")};
  if (mgr) { var st = S.m.sq.filter(function (p) { return !p.loanOut; }).sort(function (a, b) { return b.ovr - a.ovr; })[0]; o.player = st ? plShort(st) : ""; }
  return o;
}
function pressPick(mgr, ctx) {
  var pool = typeof PRESS !== "undefined" ? (mgr ? PRESS.mgr : PRESS.ply) : [];
  var used = S.pressUsed || (S.pressUsed = []);
  var score = function (q) { var s = 0; q.ctx.forEach(function (c) { if (ctx.indexOf(c) >= 0) s += 3; if (c === "any") s += 0.5; }); if (used.indexOf(q.id) >= 0) s -= 5; return s + R(); };
  var list = pool.slice().sort(function (a, b) { return score(b) - score(a); }).slice(0, 3);
  list.forEach(function (q) { used.push(q.id); });
  if (used.length > 60) S.pressUsed = used.slice(-60);
  return list.map(function (q) { return q.id; });
}
function maybePress() {
  if (typeof PRESS === "undefined" || S.pend.some(function (x) { return x.k === "ppress" || x.k === "mpress"; })) return;
  var mgr = S.mode === "mgr";
  if (mgr && S.m.club < 0) return;
  var ctx = pressCtx(), hot = ctx.filter(function (c) { return c !== "win" && c !== "draw" && c !== "loss"; }).length;
  var pr = (hot ? 0.55 : 0.18) * [0.6, 1, 1.25][S.set.ev];
  if (!chance(pr)) return;
  var qs = pressPick(mgr, ctx.concat(["any"]));
  if (qs.length < 3) return;
  var x = {k: mgr ? "mpress" : "ppress", ctx: ctx, qs: qs, tp: pressParams(), s: ri(1, 999999999)};
  S.pend.push(x);
}
function pressQ(mgr, id) { var pool = mgr ? PRESS.mgr : PRESS.ply; for (var i = 0; i < pool.length; i++) if (pool[i].id === id) return pool[i]; return null; }
function pressCtxText(ctx) {
  if (ctx.indexOf("controversy") >= 0) return tr("La polémica del último partido sigue dando que hablar.");
  if (ctx.indexOf("final") >= 0) return tr("Se viene una final y los periodistas quieren titulares.");
  if (ctx.indexOf("derby") >= 0) return tr("Semana de derbi: la sala de prensa está llena.");
  if (ctx.indexOf("crisis") >= 0) return tr("Los malos resultados han encendido las alarmas.");
  if (ctx.indexOf("title") >= 0) return tr("Estáis en la pelea por el título y todo el mundo quiere oíros.");
  if (ctx.indexOf("relegation") >= 0) return tr("La zona de descenso aprieta y la prensa huele sangre.");
  if (ctx.indexOf("bigwin") >= 0) return tr("Tras la goleada, todos quieren hablar contigo.");
  if (ctx.indexOf("bigloss") >= 0) return tr("Tras la goleada encajada, toca dar la cara.");
  return tr("Los periodistas te esperan en la sala de prensa.");
}
/* decisiones de la rueda de prensa: ir o no, y tres preguntas con cuatro respuestas (el efecto no se ve hasta responder) */
function pressAskDesc(x) {
  var mgr = x.k === "mpress";
  return {scene: "press", tag: "real", tagTxt: tr("Rueda de prensa"), cls: "", cat: tr("Prensa"), title: tr("¿Vas a la rueda de prensa?"), text: pressCtxText(x.ctx) + " " + tr("Si vas, te harán tres preguntas."),
    opts: pressAskOpts(x, mgr).map(function (o) { return descOpt(o, function (u) { return mgr ? mgrPreview(u, null) : fxPreview(u.fx, u.n); }); })};
}
function pressAskOpts(x, mgr) {
  return [
    {t: tr("Ir a la rueda de prensa"), d: tr("Tres preguntas. Cada respuesta tiene consecuencias."), ok: {txt: tr("Te sientas ante los micrófonos."), fx: {}}},
    {t: tr("No ir"), d: tr("La afición y el vestuario lo notarán."), ok: {txt: tr("Mandas a un portavoz. A la afición no le gusta nada."), fx: mgr ? {fans: -4, sqMor: -2} : {fans: -4, mor: -3}}}
  ];
}
function pressQDesc(x) {
  var mgr = x.k === "mpq", q = pressQ(mgr, x.q), tp = x.tp || {};
  if (!q) return null;
  return {scene: "press", sceneQ: x, tag: "hot", tagTxt: tr("Rueda de prensa"), cls: "hotc", cat: tr("Pregunta {n} de 3", {n: x.n}), title: tr(q.q, tp), text: tr("Todas las cámaras te enfocan. ¿Qué respondes?"),
    opts: q.a.map(function (a) { var o = {t: tr(a.t, tp), ref: a.ref ? tr(a.ref) : null, blind: true, ok: {txt: tr("«{answer}»", {answer: tr(a.t, tp)}), fx: a.fx}}; var d = descOpt(o, function () { return []; }); d.blind = true; return d; })};
}
function pressResolve(x, choice) {
  var mgr = x.k === "mpress" || x.k === "mpq", chips = [], card;
  if (x.k === "ppress" || x.k === "mpress") {
    var o = pressAskOpts(x, mgr)[choice];
    if (!o) return null;
    S.pend.shift();
    if (choice === 0) {
      var items = x.qs.map(function (id, i) { return {k: mgr ? "mpq" : "ppq", q: id, n: i + 1, tp: x.tp, s: ri(1, 999999999), ui: mgr}; });
      S.pend = items.concat(S.pend);
      return null;
    }
    chips = mgr ? mgrFx(o.ok.fx) : applyFx(o.ok.fx);
    card = {t: "decision", tipo: mgr ? "mgr" : "real", cat: tr("Prensa"), title: tr("Rueda de prensa"), choice: o.t, txt: o.ok.txt, chips: chips, y: S.yr};
    socPostRaw({by: "press", tk: N_("{name} no se presenta en la sala de prensa. Silencio que dice mucho. 🎙️❌"), tp: {name: socSelfName()}});
    if (mgr) feed(card);
    return card;
  }
  var q = pressQ(mgr, x.q), a = q && q.a[choice];
  if (!a) return null;
  S.pend.shift();
  chips = mgr ? mgrFx(a.fx || {}) : applyFx(a.fx || {});
  card = {t: "decision", tipo: mgr ? "mgr" : "real", cat: tr("Rueda de prensa"), title: tr(q.q, x.tp || {}), choice: tr(a.t, x.tp || {}), txt: a.ref ? tr(a.ref) : "", chips: chips, y: S.yr};
  if (x.n === 3 || chance(0.5)) { var spb = chance(0.5) ? "press" : "fan", spt = pick(SOCIAL_T.press || [{t: N_("«{quote}»")}]); socPostRaw({by: socAcc(spt.by) ? spt.by : spb, tk: spt.t, tp: {name: socSelfName(), club: socBase().club, quote: a.t, quoteTp: x.tp || {}}, mood: 0}); }
  if (mgr) feed(card);
  return card;
}
var EX_PEND = {
  ppress: {desc: pressAskDesc, resolve: pressResolve},
  ppq: {desc: pressQDesc, resolve: pressResolve}
};

/* ============ RED SOCIAL ============
   S.soc = {posts, prof: {name, handle, bio, av, col}, seen}
   Los mensajes guardan la plantilla (tk) y sus datos (tp) para mostrarse en el idioma actual. */
var SOC_AV = ["⚽", "🦁", "🐺", "🦅", "🔥", "⭐", "👑", "🐐", "⚡", "🧤", "🎯", "🚀", "🌟", "🐉", "🦈", "🛡️"];
var SOC_COL = ["#1d9bf0", "#e0245e", "#17bf63", "#ffad1f", "#794bc4", "#f45d22", "#0f1419", "#c8102e", "#004d98", "#00a650"];
function socSlug(s) { return String(s || "").normalize ? String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]/g, "") : String(s).replace(/[^A-Za-z0-9]/g, ""); }
function socSelfName() { if (S.mode === "mgr") return (S.m.fn ? S.m.fn + " " : "") + S.m.ln; return S.p.fn + " " + S.p.ln; }
function socInit() {
  if (S.soc) return S.soc;
  var nm = socSelfName();
  S.soc = {posts: [], seen: 0, prof: {name: nm, handle: (socSlug(nm) || "crack").slice(0, 15), bio: "", av: "⚽", col: "#1d9bf0"}};
  return S.soc;
}
/* seguidores en miles: el jugador ya los tiene (p.fol); el míster, según prestigio y títulos */
function socFollowers() {
  if (S.mode !== "mgr") return S.p.fol || 0;
  var m = S.m;
  return Math.max(0.3, Math.pow(Math.max(5, m.rep), 1.7) / 18 + m.trophies.length * 25 + (S.soc && S.soc.bonus || 0));
}
function socAcc(id) { if (typeof SOCIAL_ACCOUNTS === "undefined") return null; for (var i = 0; i < SOCIAL_ACCOUNTS.length; i++) if (SOCIAL_ACCOUNTS[i].id === id) return SOCIAL_ACCOUNTS[i]; return null; }
function socKind(k) { return typeof SOCIAL_ACCOUNTS === "undefined" ? [] : SOCIAL_ACCOUNTS.filter(function (a) { return a.kind === k; }); }
function socRnd(arr) { return arr && arr.length ? arr[Math.floor(Math.random() * arr.length)] : null; }
/* autor del mensaje según el tipo */
function socAuthor(by) {
  var a = socAcc(by);
  if (a) return {id: a.id};
  var fanNm = function () { var n = socRnd(typeof SOCIAL_FAN_NAMES !== "undefined" ? SOCIAL_FAN_NAMES : []) || tr("Hincha"); return {n: n, hd: (socSlug(n) || "hincha").slice(0, 14) + Math.floor(Math.random() * 99), av: socRnd(["🙂", "😎", "🤓", "😤", "🥲", "🤩", "😡", "🧢", "🎮", "📣"]), fan: 1}; };
  switch (by) {
    case "fan": if (Math.random() < 0.15) { var sm = socRnd(socKind("streamer")); if (sm) return {id: sm.id}; } return fanNm();
    case "hater": case "rival": var f = fanNm(); f.hater = 1; return f;
    case "press": var pr = socRnd(socKind("media").concat(socKind("insider"), socKind("pundit"), socKind("commentator"))); return pr ? {id: pr.id} : fanNm();
    case "stats": var st = socRnd(socKind("stats")); return st ? {id: st.id} : fanNm();
    case "meme": var me = socRnd(Math.random() < 0.25 && socKind("streamer").length ? socKind("streamer") : socKind("meme")); return me ? {id: me.id} : fanNm();
    case "teammate": var tm = socTeammate(); return tm ? {n: tm, hd: socSlug(tm).slice(0, 15), av: "🏃", tm: 1} : fanNm();
    case "club": var club = S.mode === "mgr" ? S.m.club : S.p.club; return club >= 0 ? {n: clubName(club), hd: socSlug(W.clubs[club].ab || clubName(club)) + "_oficial", av: "🛡️", club: club} : fanNm();
    case "self": return {self: 1};
  }
  return fanNm();
}
function socTeammate() {
  if (S.mode === "mgr") { var l = S.m.sq.filter(function (p) { return !p.loanOut; }); var q = socRnd(l); return q ? q.fn + " " + q.ln : null; }
  var rc = realClub(S.p.club);
  if (rc && rc.p.length) { var r = socRnd(rc.p); return (r[0] ? r[0] + " " : "") + r[1]; }
  var nm = mName(W.clubs[S.p.club].ci); return nm.fn + " " + nm.ln;
}
function socPostRaw(o) {
  if (!S || typeof SOCIAL_T === "undefined") return null;
  var soc = socInit(), fol = socFollowers(), au = socAuthor(o.by || "fan");
  var base = au.id ? 3 + Math.random() * 40 : 0.02 + Math.random() * 0.6;
  soc.seq = (+soc.seq || 0) + 1;
  var post = {id: soc.seq, au: au, tk: o.tk, tp: o.tp || {}, y: S.yr, bi: S.bi, ph: S.ph, m: o.mood || 0,
    lk: Math.round((base + fol * 0.02) * 1000 * (0.4 + Math.random())), rt: 0};
  post.rt = Math.round(post.lk * (0.08 + Math.random() * 0.2));
  soc.posts.unshift(post);
  if (soc.posts.length > 160) soc.posts.length = 160;
  return post;
}
/* la plantilla solo vale si el disparador trae todos sus huecos ({opp}, {min}…) */
function socFits(tk, tp) { var m = String(tk).match(/\{[A-Za-z_]+\}/g) || []; for (var i = 0; i < m.length; i++) if (!tp || tp[m[i].slice(1, -1)] == null) return false; return true; }
/* elegir plantilla del disparador; los de la afición según su humor */
function socPost(trig, tp, opt) {
  if (typeof SOCIAL_T === "undefined" || !SOCIAL_T[trig]) return null;
  opt = opt || {};
  var list = SOCIAL_T[trig].filter(function (t) { return socFits(t.t, tp) && (opt.by ? t.by === opt.by : true) && (opt.mood == null || t.mood == null || t.mood === opt.mood) && (!opt.acc || socAcc(t.by) || t.by === "press" || t.by === "club"); });
  if (!list.length) list = SOCIAL_T[trig].filter(function (t) { return socFits(t.t, tp); });
  if (!list.length) list = SOCIAL_T[trig];
  /* las cuentas con nombre propio no tapan a la afición: como mucho un 40 % de los mensajes */
  if (!opt.by && !opt.acc) {
    var named = list.filter(function (t) { return socAcc(t.by); }), gen = list.filter(function (t) { return !socAcc(t.by); });
    if (named.length && gen.length) list = Math.random() < Math.min(0.4, named.length / list.length) ? named : gen;
  }
  var t = socRnd(list);
  return socPostRaw({by: t.by, tk: t.t, tp: tp, mood: t.mood || 0});
}
/* publicaciones prefabricadas del usuario: mismas categorías para futbolista y míster,
   con consecuencias coherentes con cada carrera. */
var SOC_CUSTOM_OPTIONS = [
  {k: "grateful", ico: "🙏", n: N_("Agradecer"), post: N_("Gracias por el apoyo. Cada día toca trabajar un poco más. 🙌"), reply: N_("Gracias, {target}. Se agradece que estés ahí; seguiremos trabajando. 🙌"), mood: 1,
    player: {fame: 1, fol: 20, fans: 1}, manager: {rep: 1, fans: 1}},
  {k: "team", ico: "🤝", n: N_("Apoyar al equipo"), post: N_("El mérito es de todo el equipo. Seguimos juntos. 🤝"), reply: N_("Gracias, {target}. El mérito es de todo el equipo; seguimos juntos. 🤝"), mood: 1,
    player: {mor: 1, coach: 1, fans: 1}, manager: {sqMor: 2, chem: 1, fans: 1}},
  {k: "ambition", ico: "🎯", n: N_("Mostrar ambición"), post: N_("Seguimos creciendo. Lo mejor todavía está por venir. 🎯"), reply: N_("Gracias, {target}. Seguimos creciendo y no vamos a conformarnos. 🎯"), mood: 1,
    player: {fame: 2, fol: 50}, manager: {rep: 2, fans: 1}},
  {k: "calm", ico: "🧠", n: N_("Mantener la calma"), post: N_("Respeto todas las opiniones; yo prefiero responder con trabajo. 🧠"), reply: N_("Te leo, {target}. Respeto tu opinión; prefiero contestar con trabajo. 🧠"), mood: 0,
    player: {prof: 1, coach: 1}, manager: {rep: 1, board: 1}},
  {k: "bold", ico: "🔥", n: N_("Responder con carácter"), post: N_("Que hablen. Nosotros seguimos a lo nuestro. 🔥"), reply: N_("Te respeto, {target}; nosotros responderemos donde toca: en el campo. 🔥"), mood: 1,
    player: {fame: 2, fol: 60, fans: 1, coach: -1}, manager: {rep: 2, fans: 2, board: -1}},
  {k: "aggressive", ico: "💥", n: N_("Ser agresivo"), post: N_("No me busques excusas: si tienes algo que decir, dilo de frente. En el campo responderemos. 💥"), reply: N_("Sigue hablando, {target}. En el campo se verá quién tiene razón. 💥"), mood: 1,
    player: {fame: 3, fol: 90, fans: -1, coach: -2, prof: -1}, manager: {rep: 3, fans: 1, board: -3, sqMor: -1}},
  {k: "sarcastic", ico: "😏", n: N_("Tirar de sarcasmo"), post: N_("Qué comentario tan inesperado. Voy a guardarlo junto a las críticas que sí me quitan el sueño. 😏"), reply: N_("¿En serio, {target}? Y yo que pensaba que hoy ya había gastado mi cuota de sarcasmo. 😏"), mood: 0,
    player: {fame: 1, fol: 55, fans: 1, coach: -1, prof: -1}, manager: {rep: 1, fans: 1, board: -1, chem: -1}},
  {k: "accountability", ico: "🙏", n: N_("Asumir el resultado"), post: N_("No salió como queríamos. Lo asumo y trabajaré para mejorar. 🙏"), reply: N_("Tienes razón, {target}. No salió bien; asumo mi parte y trabajaré más. 🙏"), mood: 0,
    player: {prof: 1, coach: 2, fans: 1}, manager: {board: 2, sqMor: 1, rep: 1}}
];
function socCustomPeriod() {
  var clock = S.bi != null ? S.bi : S.tw != null ? S.tw : S.w != null ? S.w : 0;
  return String(S.yr) + "|" + String(clock);
}
function socCustomFx(key) {
  for (var i = 0; i < SOC_CUSTOM_OPTIONS.length; i++) if (SOC_CUSTOM_OPTIONS[i].k === key) return S.mode === "mgr" ? SOC_CUSTOM_OPTIONS[i].manager : SOC_CUSTOM_OPTIONS[i].player;
  return null;
}
function socCustomSend(key, target) {
  if (!S || typeof SOCIAL_T === "undefined") return {ok: false};
  var option = null;
  for (var i = 0; i < SOC_CUSTOM_OPTIONS.length; i++) if (SOC_CUSTOM_OPTIONS[i].k === key) { option = SOC_CUSTOM_OPTIONS[i]; break; }
  if (!option) return {ok: false};
  var soc = socInit(), period = socCustomPeriod();
  if (soc.customPeriod === period) return {ok: false, limit: true};
  var replyMeta = target && typeof target === "object" ? target : null;
  target = String(replyMeta ? replyMeta.target : target || "").replace(/[<>]/g, "").trim().slice(0, 40);
  var fx = S.mode === "mgr" ? option.manager : option.player;
  if (S.mode === "mgr") mgrFx(fx);
  else applyFx(fx);
  var isReply = !!target, tp = isReply ? {target: target} : {};
  var post = socPostRaw({by: "self", tk: isReply ? option.reply : option.post, tp: tp, mood: option.mood});
  if (!post) return {ok: false};
  if (isReply) post.replyTo = {id: replyMeta && replyMeta.id || null, target: target, text: String(replyMeta && replyMeta.text || "").slice(0, 180)};
  soc.customPeriod = period;
  return {ok: true, fx: fx, reply: isReply};
}
/* fichajes: a veces el «here we go» clásico, a veces otro periodista o medio */
function socProBy() { return Math.random() < 0.35 ? {by: "romano"} : {acc: 1}; }
function socFans() { return S.mode === "mgr" ? S.m.fans : S.p.fans; }
function socBase() {
  var mgr = S.mode === "mgr", club = mgr ? S.m.club : S.p.club, li = club >= 0 ? S.cl[club] : -1;
  return {name: socSelfName(), club: club >= 0 ? clubName(club) : "", lg: li >= 0 ? lgName(li) : "", year: S.yr + 1};
}
function socOtherLeagueNews() {
  var mgr = S.mode === "mgr", club = mgr ? S.m.club : S.p.club, mine = club >= 0 ? S.cl[club] : -1;
  var tops = W.lg.map(function (l, i) { return i; }).filter(function (i) { return W.lg[i].t === 1 && i !== mine && S.L && S.L[i] && W.lg[i].gs >= 1.2; });
  var li = socRnd(tops); if (li == null) return;
  var lead = S.L[li].tm.slice().sort(function (a, b) { return posInLeague(a) - posInLeague(b); })[0];
  var rv = socRnd(S.rv || []);
  socPost("league_news", Object.assign(socBase(), {club: clubName(lead), lg: lgName(li), player: rv ? rv.n : clubName(lead)}));
}
function socFollowersMilestone() {
  var soc = socInit(), f = socFollowers(), marks = [10, 50, 100, 500, 1000, 5000, 10000, 50000];
  var hit = marks.filter(function (k) { return f >= k && (soc.fm || 0) < k; }).pop();
  if (hit) { soc.fm = hit; socPost("followers", Object.assign(socBase(), {n: fmtFol(hit)})); }
}
/* reacciones a lo que pasa en el juego (se engancha a feed) */
function socOnFeed(c) {
  if (!S || typeof SOCIAL_T === "undefined") return;
  var b = socBase(), mgr = S.mode === "mgr";
  switch (c.t) {
    case "block": case "mblock":
      var club = mgr ? S.m.club : S.p.club, log = (c.log || []).filter(function (e) { return !e.nat; }), n = 0;
      log.slice().sort(function (a, b2) { return Math.abs(b2.gu - b2.gt) - Math.abs(a.gu - a.gt); }).forEach(function (e) {
        if (n >= 4) return;
        var tp = Object.assign({}, b, {opp: clubName(e.o), score: e.gu + "-" + e.gt, goals: e.g || 0, min: 3 + Math.floor(Math.random() * 87)}), derby = W.derby[club + "-" + e.o];
        var trig = e.gu > e.gt ? (derby ? "derby_win" : e.gu - e.gt >= 3 ? "bigwin" : "win") : e.gu < e.gt ? (derby ? "derby_loss" : e.gt - e.gu >= 3 ? "bigloss" : "loss") : "draw";
        if (n < 2 || trig !== "win" && trig !== "draw" && trig !== "loss") { socPost(trig, tp, {mood: e.gu >= e.gt ? 1 : -1}); n++; }
        if (!mgr) {
          if (e.g >= 3) socPost("hattrick", tp); else if (e.g >= 1 && chance(0.6)) socPost("goal_me", tp);
          if (e.a >= 1 && chance(0.25)) socPost("assist", tp);
          if (e.rt >= 8.5 && chance(0.6)) socPost("motm", tp);
          if (e.rt && e.rt <= 5.4 && chance(0.6)) socPost("bad_game", tp, {mood: -1});
          if (e.red) socPost("redcard", tp);
        }
      });
      var fans = socFans();
      if (fans < 38) { socPost("fans_low", b, {mood: -1}); if (fans < 25) socPost("fans_low", b, {mood: -1}); }
      else if (fans > 68) socPost("fans_high", b, {mood: 1});
      if (!mgr && S.p.inj && S.p.injT > S.tw && S.soc && S.soc.injPosted !== S.p.injT) { S.soc.injPosted = S.p.injT; socPost("injury", b); }
      if (chance(0.7)) socOtherLeagueNews();
      if (chance(0.25)) socPost("meme", b);
      socFollowersMilestone();
      break;
    case "transfer":
      socPost(c.loan ? "loan" : "signing", Object.assign({}, b, {club: clubName(c.to), from: clubName(c.from), to: clubName(c.to), fee: c.fee ? fmtMoney(c.fee) : tr("libre"), year: S.yr + 1 + (c.yrs || 1)}), c.loan ? null : socProBy());
      socPost("signing", Object.assign({}, b, {club: clubName(c.to), from: clubName(c.from), to: clubName(c.to), fee: c.fee ? fmtMoney(c.fee) : tr("libre"), year: S.yr + 1 + (c.yrs || 1)}), {by: "fan"});
      break;
    case "mtransfer":
      var tp2 = Object.assign({}, b, {name: c.n, player: c.n, from: clubName(c.from), to: clubName(c.to), club: clubName(c.to), fee: c.fee ? fmtMoney(c.fee) : tr("libre"), year: S.yr + 1 + (c.yrs || 1)});
      if (c.inn) socPost("signing", tp2, socProBy()); else if (chance(0.7)) socPost("sold", tp2);
      break;
    case "seasonEnd": case "mseasonEnd":
      if (c.pos === 1) socPost("trophy", Object.assign({}, b, {trophy: lgName(c.lg)})); else if (c.pos === 2) socPost("title_lost", b);
      break;
    case "awards":
      if (c.won && c.won.length) { var bdo = c.won.some(function (a) { return a.k === "bdo"; }); socPost(bdo ? "bdo" : "award", Object.assign({}, b, {trophy: awardName(c.won[0])})); }
      break;
    case "retire": case "mretire": socPost("retire", b); break;
    case "msacked": socPost("sacked", b); break;
    case "mjob": case "mstart": case "mfound": socPost("hired", b); break;
    case "season": if (S.p && chance(0.5)) socPost("birthday", Object.assign({}, b, {n: S.p.age})); break;
    case "decision":
      if (c.choice && !/\{[A-Za-z_]+\}/.test(c.choice) && c.cat !== tr("Rueda de prensa") && c.cat !== tr("Prensa") && chance(0.3)) socPost("decision", Object.assign({}, b, {choice: c.choice}));
      break;
  }
}
function socOnObjs(objs) {
  if (!objs || !objs.length || typeof SOCIAL_T === "undefined") return;
  var hard = objs.filter(function (o) { return o.lv >= 2; }).length;
  if (hard >= 2) socPostRaw({by: "press", tk: N_("{name} se marca objetivos muy ambiciosos esta temporada. ¿Valentía o exceso de confianza? 🤔"), tp: {name: socSelfName()}});
}
(function () {
  var base = feed;
  feed = function (card) { base(card); try { socOnFeed(card); } catch (e) { if (typeof console !== "undefined") console.error(e); } };
})();

/* ============ PARTIDO EN DIRECTO (míster, modo intenso) ============
   Se simula minuto a minuto con el mismo modelo de goles que el resto del juego; puedes cambiar la mentalidad,
   el sistema y hacer hasta cinco cambios. Al terminar, el resultado pasa al partido real. */
function liveWanted(f) { return S.mode === "mgr" && S.set.ev === 2 && !S.cur.noLive && !f.isNat && !S.noLiveAuto; }
function liveStart(fi) {
  var f = S.cur.pm[fi];
  S.live = {fi: fi, min: 0, add: ri(1, 5), gu: 0, gt: 0, gmu: [], gmt: [], sc: [], ev: [], subs: [], left: 5, ment: f.ment, form: S.m.form,
    xi: f.xi.slice(), bench: (f.bench || []).slice(), shots: [0, 0], on: [0, 0], poss: [0, 0], half: false, done: false, red: null, yc: {},
    mo: 50, bx: 50, own: 0, big: [0, 0], gl: [], ch: [], oxi: liveOppXI(f.opp),
    /* estado continuo de la jugada: la pelota no salta de un área a otra entre minutos */
    phase: "build", ko0: 0, rest: null, lastX: 50, lastOwn: 0, seq: 0};
  return S.live;
}
/* once rival con nombres (reales si el club los tiene) */
function liveOppXI(c) {
  var rc = typeof realClub === "function" ? realClub(c) : null, out = [];
  if (rc && rc.p && rc.p.length >= 11) {
    var gk = rc.p.filter(function (r) { return r[2] === "POR"; }).sort(function (a, b) { return b[4] - a[4]; })[0];
    var fld = rc.p.filter(function (r) { return r[2] !== "POR"; }).sort(function (a, b) { return b[4] - a[4]; }).slice(0, 10);
    if (gk) out.push({n: gk[1], g: "POR"});
    fld.forEach(function (r) { out.push({n: r[1], g: W.pos[r[2]] ? W.pos[r[2]].g : "MED"}); });
  }
  if (out.length < 11) {
    out = [];
    ["POR", "DEF", "DEF", "DEF", "DEF", "MED", "MED", "MED", "DEL", "DEL", "DEL"].forEach(function (g) { var nm = mName(W.clubs[c].ci); out.push({n: nm.ln, g: g}); });
  }
  return out;
}
function liveOppPick(L, att) {
  var w = {POR: 0.01, DEF: att ? 0.25 : 1, MED: 1, DEL: att ? 3 : 1};
  var l = (L.oxi || []).filter(function (x) { return x.g !== "POR" && !x.off; });
  var x = wpick(l, function (q) { return w[q.g] || 1; });
  if (att) L._ox = x ? L.oxi.indexOf(x) : -1;
  return x ? x.n : clubName(S.cur.pm[L.fi].opp);
}
function liveMyGK(L) { for (var i = 0; i < L.xi.length; i++) { var p = mPl(L.xi[i]); if (p && p.pos === "POR") return plShort(p); } return tr("vuestro portero"); }
function liveAssist(L, sid) {
  var on = L.xi.map(mPl).filter(function (p) { return p && p.id !== sid && p.id !== L.red && p.pos !== "POR"; });
  var a = wpick(on, function (q) { return (AST_SHARE[q.pos] || 0.02) + 0.01; });
  return a ? plShort(a) : "";
}
var LIVE_COM = {
  buildUs: [N_("{a} conduce por la banda y busca el desmarque."), N_("Combinación rápida entre {a} y {b} en tres cuartos."), N_("{a} filtra un pase entre líneas…"), N_("Llegáis por la derecha: {a} pone el balón al área."), N_("Presión alta del {club}: {a} roba en campo rival.")],
  buildThem: [N_("El {opp} mueve el balón con paciencia."), N_("{x} se escapa por su banda…"), N_("Presión del {opp}: os cuesta salir jugando."), N_("{x} recibe de espaldas y gira. Peligro."), N_("Contra del {opp} conducida por {x}.")],
  idle: [N_("Fase de tanteo en el centro del campo."), N_("{a} pide calma y baja el balón al césped."), N_("La grada aprieta: ¡vamos, {club}!"), N_("Balón dividido en el medio; falta de {x}."), N_("Saque de esquina para el {club}… despeja la defensa."), N_("El {opp} junta líneas y espera."), N_("{a} protesta una falta que no ve el árbitro."), N_("Partido trabado, con muchas interrupciones.")],
  goalUs: [N_("¡GOOOL! {s} la mete tras un pase de {a}. ¡{g1}-{g2}!"), N_("¡GOLAZO de {s}! Disparo desde fuera del área que se cuela por la escuadra. {g1}-{g2}."), N_("¡Gol! {s} remata de cabeza un centro de {a}. {g1}-{g2}."), N_("¡GOL del {club}! {s} define con frialdad ante el portero. {g1}-{g2}.")],
  goalUsSolo: [N_("¡GOOOL! {s} se va de dos y la cruza. ¡{g1}-{g2}!"), N_("¡Gol de {s}! Aprovecha un rechace dentro del área. {g1}-{g2}.")],
  goalThem: [N_("Gol del {opp}. {x} no perdona. {g1}-{g2}."), N_("{x} bate a {k} por bajo. {g1}-{g2}."), N_("Jarro de agua fría: cabezazo de {x} y gol del {opp}. {g1}-{g2}.")],
  saveUs: [N_("¡Paradón del portero del {opp} a tiro de {s}!"), N_("{s} prueba desde lejos: atrapa el portero."), N_("Remate de {s} al centro, sin problemas para el portero.")],
  saveThem: [N_("¡Paradón de {k}! Evita el gol de {x}."), N_("{x} chuta, pero {k} está atento."), N_("{k} se estira y saca el disparo de {x} a córner.")],
  missUs: [N_("¡Uy! {s} la manda rozando el palo."), N_("{s} se queda solo… ¡y la tira fuera!"), N_("Volea de {s} que se marcha por encima del larguero.")],
  missThem: [N_("{x} perdona: tiro desviado."), N_("El {opp} avisa: remate de {x} por encima."), N_("Disparo lejano de {x}, muy desviado.")],
  postUs: [N_("¡AL PALO! {s} estuvo a centímetros del gol.")],
  postThem: [N_("¡Palo del {opp}! {x} casi marca.")]
};
function liveSay(list, tp) { return tr(list[Math.floor(R() * list.length)], tp); }
function liveRating(L) {
  var f = S.cur.pm[L.fi], tr0 = mTeamRating(L.xi, L.form) + mBuffs();
  /* cansancio: a partir del 60' baja el nivel de los que no han salido del banquillo */
  var fresh = {}; L.subs.forEach(function (s) { fresh[s["in"]] = 1; });
  var tired = L.min > 60 ? L.xi.filter(function (id) { return id != null && !fresh[id]; }).length / 11 * (L.min - 60) * 0.03 : 0;
  if (L.red) tr0 -= 4.5;
  return tr0 - tired - (f.tr0Adj || 0);
}
function liveLambdas(L) {
  var f = S.cur.pm[L.fi], keep = f.tr;
  f.tr = liveRating(L);
  var lam = mLambdas(f, L.ment);
  f.tr = keep;
  return lam;
}
function liveScorer(L) {
  var on = L.xi.map(mPl).filter(function (p) { return p && p.id !== L.red; });
  var p = wpick(on, function (q) { return ((GOAL_SHARE[q.pos] || 0.01) + 0.004) * Math.max(0.3, 1 + (q.ovr - 70) * 0.04); });
  return p || on[0];
}
/* --- posesión continua -------------------------------------------------------
   L.bx es la posición física del balón desde nuestra portería (0) a la rival (100).
   L.own dice quién tiene la posesión (0 = nosotros, 1 = rival). Al perderla NO se
   mueve el balón: solo cambia el equipo que ataca, y el nuevo equipo construye
   desde donde robó. Los saques de centro y de puerta son las únicas reanudaciones
   que colocan el balón en una posición fija. */
function liveProg(L) { return L.own === 0 ? L.bx : 100 - L.bx; }
function liveAtkDist(L) { return (100 - liveProg(L)) * 105 / 100; }
function liveAdvance(L, adv) { L.bx = clamp(L.bx + (L.own === 0 ? adv : -adv), 4, 96); }
function liveShotX(us, d) { return us === 1 ? 100 - d * 100 / 105 : d * 100 / 105; }
function liveShotKind(d) { return d <= 13 ? "oneone" : d >= 18 ? "long" : "volley"; }
function liveRestart(L, own, bx) { L.own = own; L.bx = clamp(bx, 4, 96); L.phase = "build"; L.seq++; }
/* un tiro: el origen ya lo ha fijado liveStep con la distancia real del balón */
function liveShot(L, out, us, big, d, sh, tp, hs) {
  var idx = us === 1 ? 0 : 1;
  L.shots[idx]++;
  if (big) L.big[idx]++;
  var xn = us === 0 ? liveOppPick(L, true) : null, ox = L._ox;
  var sn = us === 1 ? (sh ? plShort(sh) : clubName(S.m.club)) : xn;
  var xs = typeof mxShotXG === "function" ? mxShotXG(L, us, sh, big, d) : {xg: big ? 0.36 : 0.12, d: d, y: 0, zn: 0};
  if (xs.d == null) xs.d = d;
  var x = R(), mk = typeof mxMissKind === "function" ? mxMissKind(x, xs.xg) : null;
  var res = x < xs.xg ? "goal" : mk || (x < 0.55 ? "save" : x < 0.62 ? "post" : "miss");
  var e = {t: res, us: us, xg: xs.xg, zn: xs.zn, d: xs.d, ly: xs.y, k: liveShotKind(d), big: !!big};
  if (us === 0) e.ox = ox;
  /* los tiros lejanos siempre llevan asistencia para que el texto no diga que se asiste a sí mismo */
  var as = us === 1 && (d >= 18 || !chance(0.25)) ? liveAssist(L, sh && sh.id) : "";
  /* construcción previa: ayuda a que el campo 2D/3D no empiece el tiro de la nada */
  if (chance(us === 1 ? 0.5 : 0.45)) {
    out.push({t: "com", us: us, txt: liveSay(us === 1 ? LIVE_COM.buildUs : LIVE_COM.buildThem,
      us === 1 ? tp({a: as || sn, b: sn}) : tp({x: liveOppPick(L, false)}))});
  }
  var pref = big ? tr("¡Ocasión clarísima!") + " " : "";
  if (res === "goal") {
    if (us === 1) { L.gu++; L.gmu.push(L.min); L.on[0]++; if (sh) L.sc.push(sh.id); }
    else { L.gt++; L.gmt.push(L.min); L.on[1]++; }
    L.gl.push({us: us, n: sn, min: L.min});
    var gl = us === 1 ? (as ? LIVE_COM.goalUs : LIVE_COM.goalUsSolo) : LIVE_COM.goalThem;
    e.txt = pref + liveSay(gl, us === 1 ? tp({s: sn, a: as || sn}) : tp({x: sn}));
    L.ch.push({us: us, min: L.min, k: "goal"});
    /* tras el gol saca de centro el equipo que lo encajó */
    L.bx = 50; L.own = us === 1 ? 1 : 0; L.phase = "kickoff";
    L.mo = clamp(L.mo + (us === 1 ? 10 : -10), 18, 82);
  } else {
    if (res === "save") { L.on[idx]++; e.txt = pref + liveSay(us === 1 ? LIVE_COM.saveUs : LIVE_COM.saveThem, us === 1 ? tp({s: sn}) : tp({x: sn})); }
    else if (res === "post") { e.txt = liveSay(us === 1 ? LIVE_COM.postUs : LIVE_COM.postThem, us === 1 ? tp({s: sn}) : tp({x: sn})); }
    else { e.txt = liveSay(us === 1 ? LIVE_COM.missUs : LIVE_COM.missThem, us === 1 ? tp({s: sn}) : tp({x: sn})); }
    L.ch.push({us: us, min: L.min, k: res === "save" ? (big ? "big" : "shot") : (res === "post" ? "big" : (big ? "big" : "shot"))});
    /* la pelota sigue cerca de la portería: saque de puerta, rechace o córner */
    if (res === "save") liveRestart(L, us === 1 ? 1 : 0, us === 1 ? 91 : 9);
    else if (res === "post") liveRestart(L, us === 1 ? 1 : 0, us === 1 ? 89 : 11);
    else liveRestart(L, us === 1 ? 1 : 0, us === 1 ? 94 : 6);
    L.mo = clamp(L.mo + (us === 1 ? 3 : -3), 18, 82);
  }
  out.push(e);
  L.seq++;
  return e;
}
/* un minuto: devuelve los acontecimientos para el comentario */
function liveStep() {
  var L = S.live, f = S.cur.pm[L.fi];
  if (!L || L.done) return [];
  L.min++;
  if (L.mo == null) { L.mo = 50; L.bx = 50; L.big = [0, 0]; L.gl = []; L.ch = []; L.oxi = liveOppXI(f.opp); }
  if (L.phase == null) L.phase = "build";
  if (L.ko0 == null) L.ko0 = 0;
  var out = [], lam = liveLambdas(L), opp = clubName(f.opp), club = clubName(S.m.club);
  var any = false, shot = false, ko = false;
  var hs = function () { return f.home ? [L.gu, L.gt] : [L.gt, L.gu]; };
  var tp = function (o) { var x = Object.assign({club: club, opp: opp, k: liveMyGK(L)}, o || {}); var q = hs(); x.g1 = q[0]; x.g2 = q[1]; return x; };
  /* la barra de posesión se mueve despacio, no decide la posesión de cada minuto */
  var share = lam[0] / ((lam[0] + lam[1]) || 1) + ({bus: -0.12, 0: -0.05, 1: 0, 2: 0.04, press: 0.07}[L.ment] || 0) + (L.red ? -0.08 : 0) + (L.ored ? 0.07 * L.ored : 0) + (typeof liveTacShare === "function" ? liveTacShare(L) : 0);
  L.mo = clamp(L.mo * 0.7 + (share * 100 + gauss() * 10) * 0.3, 18, 82);
  /* saques de centro: solo aquí (y en los goles) se coloca el balón en el centro */
  if (L.min === 1) {
    L.bx = 50; L.own = L.ko0 ? 1 : 0; L.phase = "kickoff"; ko = true;
    out.push({t: "com", txt: tr("¡Arranca el partido! {us} contra {opp}.", {us: club, opp: opp})});
  } else if (L.min === 46 && L.half) {
    L.bx = 50; L.own = L.ko0 ? 0 : 1; L.phase = "kickoff"; ko = true;
    out.push({t: "com", txt: tr("Comienza la segunda parte.")});
  }
  L.poss[L.own]++;
  var own = L.own;
  var prog = liveProg(L);
  /* pérdida: el balón se queda donde está; el que roba ataca hacia la otra portería */
  var att = own === 0 ? liveRating(L) : (f.or || 70);
  var def = own === 0 ? (f.or || 70) : liveRating(L);
  var edge = (att - def) / 10;
  var pTurn = clamp(0.13 + prog / 100 * 0.11 - edge * 0.045
    + (own === 1 && L.ored ? 0.035 : 0)
    + (own === 0 && L.red ? 0.035 : 0)
    + (own === 0 ? (L.mom || 0) / 100 * 0.025 : -(L.mom || 0) / 100 * 0.025), 0.05, 0.30);
  if (own === 0 && L.tac) {
    if (L.tac.tempo === 2) pTurn += 0.02;
    if (L.tac.pass === 2) pTurn -= 0.012;
    if (L.tac.pass === 0) pTurn += 0.012;
  }
  if (own === 1) {
    if (L.ment === "press") pTurn += 0.025;
    if (L.ment === "bus") pTurn -= 0.02;
  }
  if (chance(pTurn)) {
    L.own = 1 - own; L.phase = "counter";
    liveAdvance(L, 5 + R() * 9);
    if (chance(0.35)) {
      any = true;
      out.push({t: "com", us: L.own === 0 ? 1 : 0, txt: liveSay(L.own === 0 ? LIVE_COM.buildUs : LIVE_COM.buildThem,
        L.own === 0 ? tp({a: liveAssist(L), b: club}) : tp({x: liveOppPick(L, false)}))});
    }
  } else {
    /* construcción continua: pocos metros por minuto, sin cruzar el campo de golpe */
    var adv = 7 + R() * 8;
    if (prog < 25) adv += 1.5;
    if (own === 0 && L.tac && L.tac.tempo === 2) adv += 1.2;
    if (own === 1 && L.ment === "press") adv += 0.8;
    liveAdvance(L, adv);
    L.phase = "build";
    prog = liveProg(L);
    var near = clamp((prog - 62) / 38, 0, 1);
    var pShot = clamp(((own === 0 ? lam[0] : lam[1]) / 90) * (8 + 20 * near), 0.035, 0.62);
    if (own === 0 && L.tac) { if (L.tac.tempo === 2) pShot += 0.02; else if (L.tac.tempo === 0) pShot -= 0.015; }
    if (own === 1 && L.ment === "press") pShot += 0.015;
    if (prog >= 90) pShot = Math.max(pShot, 0.78);
    if (!ko && L.min > 1 && prog >= 64 && chance(pShot)) {
      any = true; shot = true;
      var us = own === 0 ? 1 : 0;
      var sh = us === 1 ? liveScorer(L) : null;
      var big = typeof mxBig === "function" ? mxBig(L, us, sh) : chance(0.35);
      if (big && prog < 70) big = false;
      var dist = liveAtkDist(L);
      var d = big ? 6 + R() * 7 : clamp(dist + (R() - 0.5) * 2, 6, 30);
      d = Math.round(d * 10) / 10;
      /* el origen del tiro sale de la posición física actual: nunca desde nuestro campo */
      L.bx = liveShotX(us, d);
      liveShot(L, out, us, big, d, sh, tp, hs);
    }
  }
  if (!shot && chance(0.025)) {
    var cand = L.xi.filter(function (id) { return id != null && id !== L.red; }), pid = pick(cand), p = mPl(pid);
    if (p) {
      any = true;
      if (L.yc[pid]) { L.red = pid; out.push({t: "red", us: 1, pid: pid, k: "foul", txt: tr("Falta de {name}, que ya tenía amarilla: segunda amarilla y roja. Os quedáis con diez.", {name: plShort(p)})}); }
      else if (chance(0.04)) { L.red = pid; out.push({t: "red", us: 1, pid: pid, k: "foul", txt: tr("¡Entrada durísima de {name}! Roja directa: os quedáis con diez.", {name: plShort(p)})}); }
      else { L.yc[pid] = 1; out.push({t: "yellow", us: 1, pid: pid, k: "foul", txt: tr("Falta de {name} cortando la jugada: amarilla.", {name: plShort(p)})}); }
    }
  }
  /* tarjetas del rival: siempre tras una falta */
  var oc = (L.oxi || []).map(function (x, i) { return i; }).filter(function (i) { return L.oxi[i].g !== "POR" && !L.oxi[i].off; });
  if (!shot && chance(0.022) && oc.length && (L.ored || 0) < 2) {
    L.oyc = L.oyc || {};
    var oi = pick(oc), on = L.oxi[oi].n;
    any = true;
    if (L.oyc[oi]) { L.ored = (L.ored || 0) + 1; L.oxi[oi].off = true; out.push({t: "red", us: 0, ox: oi, k: "foul", txt: tr("Falta de {x}, que ya tenía amarilla: roja y el rival se queda con diez.", {x: on})}); }
    else { L.oyc[oi] = 1; out.push({t: "yellow", us: 0, ox: oi, k: "foul", txt: tr("Falta de {x} para frenar el contragolpe: amarilla.", {x: on})}); }
  }
  if (!shot && chance(0.0025)) {
    var hurt = mPl(pick(L.xi.filter(function (id) { return id != null && id !== L.red; })));
    if (hurt) { any = true; L.hurt = hurt.id; out.push({t: "inj", us: 1, txt: tr("{name} se duele y pide el cambio.", {name: plShort(hurt)})}); }
  }
  /* comentario de ambiente en los minutos sin ocasiones */
  if (!any && L.min > 1 && chance(0.22)) {
    var me = L.xi.map(mPl).filter(function (q) { return q && q.id !== L.red; }), a1 = me.length ? plShort(pick(me)) : club;
    out.push({t: "com", us: L.own === 0 ? 1 : 0, txt: liveSay(L.own === 0 && chance(0.6) ? LIVE_COM.buildUs : LIVE_COM.idle, tp({a: a1, b: me.length ? plShort(pick(me)) : club, x: liveOppPick(L, false)}))});
  }
  if (L.min === 45 && !L.half) {
    L.half = true; L.bx = 50; L.own = L.ko0 ? 0 : 1; L.phase = "kickoff";
    out.push({t: "half", txt: tr("Descanso: {a}-{b}.", {a: hs()[0], b: hs()[1]})});
  }
  if (L.min >= 90 + L.add) { L.done = true; L.phase = "full"; out.push({t: "end", txt: tr("¡Final del partido! {a}-{b}.", {a: hs()[0], b: hs()[1]})}); }
  else if (L.min === 90) out.push({t: "com", txt: trn(L.add, "El cuarto árbitro indica {n} minuto de descuento.", "El cuarto árbitro indica {n} minutos de descuento.")});
  /* Eventos visuales para animaciones 3D: no alteran el resultado ni la
     calibración. Se elige el jugador que realmente puede animarse en cada
     bando: pid para el equipo local y ox para el rival. */
  if (L.lastOwn != null && L.lastOwn !== L.own && !shot) {
    if (L.own === 0) {
      var lc2 = L.xi.filter(function (id) { var p = id == null ? null : mPl(id); return id != null && id !== L.red && p && p.pos !== "POR"; });
      if (lc2.length) {
        var lp2 = lc2[Math.floor(Math.random() * lc2.length)];
        out.push({t: "tackle", us: 1, pid: lp2, k: "tackle", txt: ""});
      }
    } else {
      var oc2 = (L.oxi || []).map(function (x, i) { return i; }).filter(function (i) { return L.oxi[i] && L.oxi[i].g !== "POR" && !L.oxi[i].off; });
      if (oc2.length) {
        var oi2 = oc2[Math.floor(Math.random() * oc2.length)];
        out.push({t: "tackle", us: 0, ox: oi2, k: "tackle", txt: ""});
      }
    }
  }
  if (!shot && chance(0.72)) {
    if (L.own === 0) {
      var lpass = L.xi.filter(function (id) { var p = id == null ? null : mPl(id); return id != null && id !== L.red && p && p.pos !== "POR"; });
      if (lpass.length) {
        var lpid = lpass[Math.floor(Math.random() * lpass.length)];
        out.push({t: "pass", us: 1, pid: lpid, k: "pass", txt: ""});
      }
    } else {
      var opass = (L.oxi || []).map(function (x, i) { return i; }).filter(function (i) { return L.oxi[i] && L.oxi[i].g !== "POR" && !L.oxi[i].off; });
      if (opass.length) {
        var oidx = opass[Math.floor(Math.random() * opass.length)];
        out.push({t: "pass", us: 0, ox: oidx, k: "pass", txt: ""});
      }
    }
  }
  L.lastX = L.bx; L.lastOwn = L.own;
  out.forEach(function (e) { e.min = L.min; });
  /* El feed visual recibe los hechos en orden; el historial se guarda del más
     nuevo al más viejo. Los eventos pass/tackle son solo para animar el 3D:
     no deben crear filas vacías en el comentario. */
  L.ev = out.filter(function (e) { return e.t !== "pass" && e.t !== "tackle"; })
    .slice().reverse().concat(L.ev).slice(0, 80);
  return out;
}
function liveSub(outId, inId) {
  var L = S.live;
  if (!L || L.left <= 0 || L.done) return false;
  var i = L.xi.indexOf(outId), j = L.bench.indexOf(inId);
  if (i < 0 || j < 0 || outId === L.red) return false;
  var sl = (FORMATIONS[L.form] || [])[i], pin = mPl(inId);
  if (sl && pin && !posOk(pin.pos, sl, pin)) return false;
  L.xi[i] = inId; L.bench.splice(j, 1); L.left--;
  L.subs.push({out: outId, "in": inId, min: Math.max(1, L.min)});
  if (L.hurt === outId) L.hurt = null;
  L.ev.unshift({t: "sub", min: L.min, txt: tr("Cambio: entra {a}, sale {b}.", {a: plShort(mPl(inId)), b: plShort(mPl(outId))})});
  return true;
}
function liveSet(k, v) {
  var L = S.live; if (!L || L.done) return;
  L.tchg = (L.tchg || 0) + 1;
  if (k === "ment") { L.ment = v; L.ev.unshift({t: "tac", min: L.min, txt: tr("Cambias la mentalidad: {m}.", {m: liveMentName(v)})}); }
  if (k === "form" && FORMATIONS[v]) { L.form = v; L.ev.unshift({t: "tac", min: L.min, txt: tr("Cambias al {f}.", {f: v})}); }
}
function liveMentName(v) { return {bus: tr("Encerrarse"), 0: tr("Defensiva"), 1: tr("Equilibrada"), 2: tr("Ofensiva"), press: tr("Presión alta")}[v] || ""; }
/* simular lo que queda de golpe */
function liveSimRest() { var g = 0; while (S.live && !S.live.done && g++ < 200) liveStep(); }
/* pasar el resultado al partido real */
function liveFinish() {
  var L = S.live; if (!L) return;
  if (!L.done) liveSimRest();
  var f = S.cur.pm[L.fi];
  f.gu = L.gu; f.gt = L.gt; f.gmu = L.gmu.map(function (x) { return Math.min(90, x); }); f.gmt = L.gmt.map(function (x) { return Math.min(90, x); });
  f.forced = L.sc.slice(); f.mg = 0; f.ment = L.ment;
  f.liveSubs = L.subs.slice();
  if (L.red != null) { f.redId = L.red; f.redMin = 60; }
  f.liveDone = true; f.st = 1;
  S.live = null;
  S.pend = S.pend.filter(function (x) { return !(x.k === "mlivew" && x.fi === L.fi); });
}
/* decisiones: ver o simular, y el aviso de partido en curso */
if (typeof MPH !== "undefined") {
  MPH.mlive = {
    fixed: true,
    head: function (x) { var f = S.cur.pm[x.fi];
      return {tag: "hot", tagTxt: tr("En directo"), cls: "hotc", hot: true, cat: compShort(f) + (roundLabel(f) ? " · " + roundLabel(f) : ""), ctxTxt: mgrMomLabel(f), title: tr("¿Ves el partido o lo simulas?"),
        text: tr("{us} contra {opp}. Si lo ves, podrás cambiar la mentalidad, el sistema y hacer hasta cinco cambios durante el partido.", {us: clubName(S.m.club), opp: clubName(f.opp)})}; },
    opts: function (x) { return [
      {t: tr("Ver el partido"), d: tr("Minuto a minuto, con cambios tácticos."), ok: {txt: tr("Bajas al banquillo. Empieza el partido."), then: function () { var f = S.cur.pm[x.fi]; f.live = true; liveStart(x.fi); S.liveReq = x.fi; S.pend.unshift(mp("mlivew", {fi: x.fi, ui: true})); }}},
      {t: tr("Simular el partido"), ok: {txt: tr("Lo sigues desde la grada.")}},
      {t: tr("Simular el resto del tramo"), d: tr("No te volveremos a preguntar hasta el próximo tramo."), ok: {txt: tr("Dejas que el equipo juegue."), then: function () { S.cur.noLive = true; }}}
    ]; },
    apply: function () { return []; },
    card: function () { return null; }
  };
  MPH.mlivew = {
    fixed: true,
    head: function (x) { var f = S.cur.pm[x.fi], L = S.live;
      return {tag: "hot", tagTxt: tr("En directo"), cls: "hotc", hot: true, cat: compShort(f), ctxTxt: mgrMomLabel(f), title: tr("Partido en curso"),
        text: L ? tr("Minuto {min}: {a}-{b} contra el {opp}.", {min: L.min, a: L.gu, b: L.gt, opp: clubName(f.opp)}) : ""}; },
    opts: function (x) { return [
      {t: tr("Volver al partido"), ok: {txt: "", then: function () { S.liveReq = x.fi; S.pend.unshift(mp("mlivew", {fi: x.fi, ui: true})); }}},
      {t: tr("Simular lo que queda"), ok: {txt: tr("Simulas el resto del partido."), then: function () { if (!S.live) liveStart(x.fi); liveFinish(); }}}
    ]; },
    apply: function () { return []; },
    card: function () { return null; }
  };
  MPH.mpress = {
    head: function (x) { var d = pressAskDesc(x); return {tag: d.tag, tagTxt: d.tagTxt, cls: d.cls, cat: d.cat, title: d.title, text: d.text}; },
    opts: function (x) { return pressAskOpts(x, true); },
    apply: function (x, o) { var i = pressAskOpts(x, true).map(function (z) { return z.t; }).indexOf(o.t); S.pend.unshift(x); pressResolve(x, i); return []; },
    card: function () { return null; }
  };
  MPH.mpq = {
    head: function (x) { var d = pressQDesc(x); return {tag: d.tag, tagTxt: d.tagTxt, cls: d.cls, cat: d.cat, title: d.title, text: d.text}; },
    opts: function (x) { var q = pressQ(true, x.q), tp = x.tp || {}; return q.a.map(function (a) { return {t: tr(a.t, tp), ref: a.ref ? tr(a.ref) : null, blind: true, ok: {txt: tr("«{answer}»", {answer: tr(a.t, tp)}), fx: a.fx}}; }); },
    apply: function (x, o) { var q = pressQ(true, x.q), tp = x.tp || {}, i = q.a.map(function (a) { return tr(a.t, tp); }).indexOf(o.t); S.pend.unshift(x); pressResolve(x, i); return []; },
    card: function () { return null; }
  };
}

/* objetivos: la interfaz deja elegir uno por categoría; los automatismos (y las pruebas) confirman la selección actual */
function objsDesc(x) {
  return {tag: "real", tagTxt: tr("Objetivos"), cls: "", cat: tr("Temporada {season}", {season: seasonLabel(S.yr)}), title: tr("Elige tus objetivos de la temporada"),
    text: tr("Cuanto más difícil, mayor recompensa si lo cumples."), opts: [descOpt({t: tr("Confirmar objetivos"), ok: {txt: ""}}, function () { return []; })]};
}
EX_PEND.objs = {desc: objsDesc, resolve: function () { confirmObjChoice(); return null; }};
if (typeof MPH !== "undefined") MPH.objs = {
  fixed: true,
  head: function (x) { var d = objsDesc(x); return {tag: d.tag, tagTxt: d.tagTxt, cls: d.cls, cat: d.cat, title: d.title, text: d.text}; },
  opts: function () { return [{t: tr("Confirmar objetivos"), ok: {txt: ""}}]; },
  apply: function (x) { S.pend.unshift(x); confirmObjChoice(); return []; },
  card: function () { return null; }
};

/* ============ PARCHE 2.5 · TÁCTICA EN DIRECTO (motor de puntos y texto) ============
   Línea defensiva, amplitud, estilo de pase y ritmo: viven en S.live.tac (y en el partido, f.tac).
   Efecto pequeño y compensado en el motor (ninguna opción domina): lo que ganas en ocasiones lo das atrás,
   o lo pagas en cansancio. Además se etiqueta cada comentario con un "tipo de jugada" (e.k) para que
   el campo 2D (pitch.js) dibuje exactamente lo que cuenta el texto. */
var LIVE_TAC = {
  line: {n: N_("Línea defensiva"), o: [N_("Baja"), N_("Media"), N_("Alta")]},
  width: {n: N_("Amplitud"), o: [N_("Por dentro"), N_("Equilibrada"), N_("Por bandas")]},
  pass: {n: N_("Estilo de pase"), o: [N_("Combinativo"), N_("Mixto"), N_("Directo")]},
  tempo: {n: N_("Ritmo"), o: [N_("Lento"), N_("Normal"), N_("Alto")]}
};
/* [factor ocasiones a favor, factor ocasiones en contra, posesión] por opción (0, 1, 2) */
var LIVE_TAC_FX = {
  line: [[0.93, 0.9, -0.03], [1, 1, 0], [1.07, 1.08, 0.03]],
  width: [[0.98, 0.97, 0.02], [1, 1, 0], [1.04, 1.03, -0.01]],
  pass: [[0.97, 0.95, 0.05], [1, 1, 0], [1.05, 1.04, -0.06]],
  tempo: [[0.93, 0.94, 0.03], [1, 1, 0], [1.07, 1.05, 0]]
};
function liveTac(L) {
  if (!L) return {line: 1, width: 1, pass: 1, tempo: 1};
  if (!L.tac) { var f = S.cur && S.cur.pm ? S.cur.pm[L.fi] : null, b = (f && f.tac) || {}; L.tac = {line: b.line != null ? b.line : 1, width: b.width != null ? b.width : 1, pass: b.pass != null ? b.pass : 1, tempo: b.tempo != null ? b.tempo : 1}; }
  return L.tac;
}
function liveTacMul(L) {
  var t = liveTac(L), a = 1, b = 1, sh = 0;
  Object.keys(LIVE_TAC_FX).forEach(function (k) { var x = LIVE_TAC_FX[k][t[k]] || LIVE_TAC_FX[k][1]; a *= x[0]; b *= x[1]; sh += x[2]; });
  return [a, b, sh];
}
function liveTacShare(L) { return liveTacMul(L)[2]; }
/* táctica (solo visual) del rival: estable por club */
/* energía (0..1) de un jugador tuyo en el campo y del rival, para el anillo de cansancio */
/* tipo de jugada de cada plantilla de comentario (para el campo 2D) */
var LIVE_KIND = {
  "{a} conduce por la banda y busca el desmarque.": "wing", "Combinación rápida entre {a} y {b} en tres cuartos.": "combo", "{a} filtra un pase entre líneas…": "through",
  "Llegáis por la derecha: {a} pone el balón al área.": "cross", "Presión alta del {club}: {a} roba en campo rival.": "press",
  "El {opp} mueve el balón con paciencia.": "slow", "{x} se escapa por su banda…": "wing", "Presión del {opp}: os cuesta salir jugando.": "press",
  "{x} recibe de espaldas y gira. Peligro.": "turn", "Contra del {opp} conducida por {x}.": "counter",
  "Fase de tanteo en el centro del campo.": "slow", "{a} pide calma y baja el balón al césped.": "slow", "Balón dividido en el medio; falta de {x}.": "foul",
  "Saque de esquina para el {club}… despeja la defensa.": "corner", "El {opp} junta líneas y espera.": "block", "Partido trabado, con muchas interrupciones.": "foul",
  "¡GOOOL! {s} la mete tras un pase de {a}. ¡{g1}-{g2}!": "pass", "¡GOLAZO de {s}! Disparo desde fuera del área que se cuela por la escuadra. {g1}-{g2}.": "long",
  "¡Gol! {s} remata de cabeza un centro de {a}. {g1}-{g2}.": "head", "¡GOL del {club}! {s} define con frialdad ante el portero. {g1}-{g2}.": "oneone",
  "¡GOOOL! {s} se va de dos y la cruza. ¡{g1}-{g2}!": "dribble", "¡Gol de {s}! Aprovecha un rechace dentro del área. {g1}-{g2}.": "rebound",
  "Gol del {opp}. {x} no perdona. {g1}-{g2}.": "pass", "{x} bate a {k} por bajo. {g1}-{g2}.": "oneone", "Jarro de agua fría: cabezazo de {x} y gol del {opp}. {g1}-{g2}.": "head",
  "¡Paradón del portero del {opp} a tiro de {s}!": "pass", "{s} prueba desde lejos: atrapa el portero.": "long", "Remate de {s} al centro, sin problemas para el portero.": "pass",
  "¡Paradón de {k}! Evita el gol de {x}.": "pass", "{x} chuta, pero {k} está atento.": "pass", "{k} se estira y saca el disparo de {x} a córner.": "corner",
  "¡Uy! {s} la manda rozando el palo.": "pass", "{s} se queda solo… ¡y la tira fuera!": "oneone", "Volea de {s} que se marcha por encima del larguero.": "volley",
  "{x} perdona: tiro desviado.": "pass", "El {opp} avisa: remate de {x} por encima.": "head", "Disparo lejano de {x}, muy desviado.": "long"
};
var LIVE_TAC_COM = {
  long: N_("{a} busca en largo a {b}."), tri: N_("Triangulación de {a} y {b} por dentro."), wide: N_("{a} abre a la banda y {b} pega la raya."),
  slow: N_("{a} toca y toca: el {club} duerme el partido."), fast: N_("¡Ritmo alto! Juego a un toque entre {a} y {b}."),
  press: N_("Presión tras pérdida: {a} recupera arriba."), block: N_("El {club} se repliega en bloque bajo y cierra espacios."),
  offThem: N_("¡Fuera de juego de {x}! Vuestra defensa sube a la vez."), offUs: N_("Fuera de juego de {a}: arrancó antes de tiempo.")
};
var LIVE_SAYLOG = [];
(function () {
  var _say = liveSay;
  liveSay = function (list, tp) {
    /* si hay un tiro en curso, solo valen los textos que encajan con su distancia (lejano, mano a mano, cabezazo…) */
    var idx = list.map(function (x, j) { return j; });
    if (typeof MX_CUR !== "undefined" && MX_CUR && typeof mxTextOk === "function") { var ok = idx.filter(function (j) { return mxTextOk(LIVE_KIND[list[j]], MX_CUR); }); if (ok.length) idx = ok; }
    var i = idx[Math.floor(R() * idx.length)], txt = tr(list[i], tp);
    LIVE_SAYLOG.push({k: LIVE_KIND[list[i]] || null, txt: txt});
    return txt;
  };
  liveSay._orig = _say;
  var _start = liveStart;
  liveStart = function (fi) { var L = _start.apply(this, arguments); liveTac(L); return L; };
  var _lam = liveLambdas;
  liveLambdas = function (L) { var lam = _lam.apply(this, arguments), m = liveTacMul(L); return [lam[0] * m[0], lam[1] * m[1]].concat(lam.slice(2)); };
  var _rat = liveRating;
  liveRating = function (L) {
    var r = _rat.apply(this, arguments), t = liveTac(L);
    if (t.tempo === 2) r -= Math.max(0, L.min - 50) * 0.012;
    if (t.line === 2) r -= Math.max(0, L.min - 55) * 0.01;
    if (t.tempo === 0 && L.min > 60) r += 0.3;
    return r;
  };
  var _set = liveSet;
  liveSet = function (k, v) {
    var L = S.live;
    if (L && !L.done && LIVE_TAC[k]) {
      v = clamp(Math.round(+v || 0), 0, 2);
      var t = liveTac(L); if (t[k] === v) return;
      t[k] = v;
      var f = S.cur.pm[L.fi]; if (f) f.tac = {line: t.line, width: t.width, pass: t.pass, tempo: t.tempo};
      L.ev.unshift({t: "tac", min: L.min, txt: tr("Cambias «{k}»: {o}.", {k: tr(LIVE_TAC[k].n), o: tr(LIVE_TAC[k].o[v])})});
      return;
    }
    return _set.apply(this, arguments);
  };
  var _step = liveStep;
  liveStep = function () {
    LIVE_SAYLOG = [];
    var out = _step.apply(this, arguments), L = S.live;
    /* etiqueta cada acontecimiento con su tipo de jugada */
    out.forEach(function (e) {
      if (!e.txt) return;
      for (var i = 0; i < LIVE_SAYLOG.length; i++) {
        var g = LIVE_SAYLOG[i], tx = e.txt;
        if (g.txt && tx.length >= g.txt.length && tx.lastIndexOf(g.txt) === tx.length - g.txt.length) { if (g.k) e.k = g.k; LIVE_SAYLOG.splice(i, 1); break; }
      }
    });
    LIVE_SAYLOG = [];
    if (!L || L.done || !out.length && L.min < 2) return out;
    if (out.some(function (e) { return /^(goal|save|miss|post|half|end|red|inj)$/.test(e.t); })) return out;
    /* acontecimientos que salen de la táctica: fueras de juego y jugadas típicas */
    var t = liveTac(L), f = S.cur.pm[L.fi], club = clubName(S.m.club);
    var me = L.xi.map(mPl).filter(function (q) { return q && q.id !== L.red && q.pos !== "POR"; });
    var nm = function () { return me.length ? plShort(pick(me)) : club; };
    var add = null;
    if (L.own === 1 && chance(t.line === 2 ? 0.07 : t.line === 1 ? 0.012 : 0.003)) {
      var xn = liveOppPick(L, true);
      add = {t: "offside", us: 0, ox: L._ox, k: "offside", txt: tr(LIVE_TAC_COM.offThem, {x: xn})};
    } else if (L.own === 0 && chance(0.006 + (t.pass === 2 ? 0.025 : 0) + (t.tempo === 2 ? 0.012 : 0))) {
      var sp = me.filter(function (q) { return /DC|ED|EI|MCO/.test(q.pos); }), sh = sp.length ? pick(sp) : null;
      add = {t: "offside", us: 1, pid: sh ? sh.id : null, k: "offside", txt: tr(LIVE_TAC_COM.offUs, {a: sh ? plShort(sh) : nm()})};
    } else if (!out.some(function (e) { return e.t === "com"; }) && chance(0.13)) {
      var opts = [];
      if (L.own === 0) {
        if (t.pass === 2) opts.push("long", "long");
        if (t.width === 0 || t.pass === 0) opts.push("tri");
        if (t.width === 2) opts.push("wide", "wide");
        if (t.tempo === 0) opts.push("slow");
        if (t.tempo === 2) opts.push("fast");
        if (t.line === 2 || L.ment === "press") opts.push("press");
      } else if (t.line === 0 || L.ment === "bus") opts.push("block", "block");
      if (opts.length) {
        var k = pick(opts), a = nm(), b = nm();
        add = {t: "com", us: k === "block" ? 0 : 1, k: k, txt: tr(LIVE_TAC_COM[k], {a: a, b: b, club: club})};
      }
    }
    if (add) { add.min = L.min; out.push(add); L.ev.unshift(add); }
    return out;
  };
})();
