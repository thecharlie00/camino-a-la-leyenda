/* match41.js — motor de partido en directo, versión 4.1: xG, duelos, cansancio por minuto, momentum,
   rejilla de 18 zonas, clima y estados del partido. Se monta encima del motor de puntos que ya existía
   (engine-extra.js · liveStep), sin cambiar su ritmo de ocasiones: las fórmulas están centradas para que
   la media de goles siga siendo la misma y solo cambie QUIÉN y CÓMO genera el peligro.

   ARQUITECTURA
   · Bucle: un "tick" = un minuto (liveStep). La interfaz lo llama con setInterval según la velocidad (⏸ ▶ ▶▶ ▶▶▶);
     «Simular lo que queda» lo llama en bucle. Este módulo envuelve liveStep: antes del tick ajusta las tasas
     (momentum y cansancio) y después actualiza estado, resistencia, zonas y momentum.
   · Estados (FSM): KICKOFF → OPEN_PLAY ⇄ SET_PIECE → HALF_TIME → KICKOFF → … → FULL_TIME.
   · Rejilla espacial: 6 columnas (de vuestra portería a la rival) × 3 carriles (izquierda, centro, derecha) = 18 zonas.

   ESQUEMAS (S.live = L)
   · L.xg [nuestro, rival]  · L.mom −100…100 (positivo = a vuestro favor)  · L.st estado  · L.wx clima
   · L.fit {id: resistencia actual 0-100}  · L.fit0 {id: resistencia al entrar}  · L.zn [18] minutos con el balón en cada zona
   · Evento (L.ev[i]): {t, min, us, pid|ox, txt, k, xg?, zn?, st} — t: goal|save|post|miss|com|yellow|red|inj|sub|tac|half|end
   · Tiro: {xg, d (metros), ang (radianes), press 0-1, fin (diferencia de definición)} */
var MX_ST = {KICKOFF: N_("Saque de centro"), OPEN_PLAY: N_("Juego abierto"), SET_PIECE: N_("Balón parado"), HALF_TIME: N_("Descanso"), FULL_TIME: N_("Final")};
var MX_WX = [["sun", "☀️", N_("Despejado"), 1], ["mild", "⛅", N_("Nublado"), 1], ["rain", "🌧️", N_("Lluvia"), 1.06], ["heat", "🥵", N_("Calor"), 1.16], ["cold", "❄️", N_("Frío"), 0.95]];
/* trabajo por posición: cuánto corre cada demarcación */
var MX_WR = {POR: 0.3, LD: 1.15, LI: 1.15, DFC: 0.85, MCD: 1.12, MC: 1.15, MD: 1.1, MI: 1.1, MCO: 1, ED: 1.1, EI: 1.1, DC: 0.95};
var MX_FIN = {DC: 4, ED: 2, EI: 2, MCO: 2, MD: 0, MI: 0, MC: 0, MCD: -3, LD: -4, LI: -4, DFC: -6, POR: -15};

function mxSig(z) { return 1 / (1 + Math.exp(-z)); }
/* duelo atacante contra defensor: probabilidad de éxito con ruido gaussiano.
   att y def son niveles relativos (0 = media); ctx suma o resta por táctica, momentum… */
function resolveAction(att, def, ctx) { return clamp(mxSig((att - def) / 7 + (ctx || 0) + gauss() * 0.35), 0.03, 0.97); }

function mxOn(L) { return L.xi.map(mPl).filter(function (p) { return p && p.id !== L.red; }); }
function mxTeamAvg(L) { var on = mxOn(L); return on.length ? on.reduce(function (s, p) { return s + p.ovr; }, 0) / on.length : 65; }
function mxFit(L, p) { return L.fit && L.fit[p.id] != null ? L.fit[p.id] : p.fit; }
/* calidad de vuestra defensa respecto a la media del equipo, restando el cansancio del partido */
function mxDefRel(L) {
  var slots = FORMATIONS[L.form] || [], avg = mxTeamAvg(L), d = [];
  L.xi.forEach(function (id, i) { var p = mPl(id), g = slots[i]; if (!p || id === L.red || !g) return; if (/^(POR|DFC|LD|LI|MCD)$/.test(g)) d.push(p.ovr - avg - mxDrop(L, p) * 0.12); });
  return d.length ? d.reduce(function (s, x) { return s + x; }, 0) / d.length : 0;
}
function mxDrop(L, p) { var f0 = L.fit0 && L.fit0[p.id] != null ? L.fit0[p.id] : p.fit; return Math.max(0, f0 - mxFit(L, p)); }
function mxMentCtx(L, us) {
  var m = String(L.ment);
  if (us) return {bus: -0.25, 0: -0.1, 1: 0, 2: 0.1, press: 0.15}[m] || 0;
  return {bus: -0.2, 0: -0.1, 1: 0, 2: 0.08, press: 0.12}[m] || 0;
}
/* ¿es ocasión clarísima? (media ≈ 35 %, como antes) */
function mxBig(L, us, sh) {
  var mom = (L.mom || 0) / 250 * (us ? 1 : -1), p;
  if (us) p = resolveAction(sh ? sh.ovr - mxTeamAvg(L) + (MX_FIN[sh.pos] || 0) * 0.5 : 0, 0, mxMentCtx(L, true) + mom);
  else p = resolveAction(0, mxDefRel(L), mxMentCtx(L, false) + mom);
  return R() < p * 0.66;
}
/* contexto del tiro y xG (regresión logística calibrada: media 0,36 en clarísimas y 0,12 en el resto) */
function mxShot(L, us, sh, big) {
  var d = big ? 6 + R() * 7 : 12 + 18 * Math.pow(R(), 1.3), y = (R() - 0.5) * (big ? 10 : 26), g = 3.66;
  var ang = Math.atan2(7.32 * d, d * d + y * y - g * g); if (ang < 0) ang += Math.PI;
  var press = us ? mxSig(gauss() * 0.9 - (L.ored ? 0.3 : 0)) : mxSig(gauss() * 0.9 + mxDefRel(L) / 4 + (String(L.ment) === "bus" ? 0.25 : 0));
  var fin = us && sh ? clamp(sh.ovr - mxTeamAvg(L) + (MX_FIN[sh.pos] || 0) - 1.5, -15, 15) : gauss() * 4;
  if (us && sh) fin -= mxDrop(L, sh) * 0.1;
  var z = (big ? -0.70 : -0.57) + 1.6 * ang - 0.11 * d - 1.1 * (press - 0.5) + 0.045 * fin;
  var xg = clamp(mxSig(z), 0.01, 0.85);
  /* zona del tiro en la rejilla (columna 5 o 0 según quién ataca; carril por la posición lateral) */
  var lane = y < -4 ? 0 : y > 4 ? 2 : 1, col = us ? (d < 17 ? 5 : 4) : (d < 17 ? 0 : 1);
  return {xg: Math.round(xg * 100) / 100, d: Math.round(d), y: Math.round(y * 10) / 10, big: !!big, ang: ang, press: press, fin: fin, zn: lane * 6 + col};
}
/* cansancio por minuto: trabajo de la posición × intensidad táctica × clima × resistencia */
function mxDecay(L, p, slot) {
  var m = String(L.ment), pf = {bus: 0.86, 0: 0.93, 1: 1, 2: 1.08, press: 1.3}[m] || 1;
  var tac = L.tac || {};
  if (tac.tempo === 2) pf += 0.08; else if (tac.tempo === 0) pf -= 0.06;
  if (tac.line === 2) pf += 0.04;
  var wx = (MX_WX.filter(function (w) { return w[0] === L.wx; })[0] || MX_WX[0])[3];
  var res = typeof plRes === "function" ? plRes(p) : 60;
  return 0.24 * (MX_WR[slot || p.pos] || 1) * pf * wx * (1.2 - res / 250) * (0.85 + R() * 0.3);
}
function mxTired(L) {
  var on = mxOn(L); if (!on.length) return 0;
  return on.reduce(function (s, p) { return s + Math.max(0, mxDrop(L, p) - 8); }, 0) / on.length * 0.07;
}
function mxInit(L) {
  if (L.fit) return;
  var f = S.cur.pm[L.fi];
  L.fit = {}; L.fit0 = {};
  L.xi.concat(L.bench || []).forEach(function (id) { var p = mPl(id); if (p) { L.fit[id] = p.fit; L.fit0[id] = p.fit; } });
  L.xg = [0, 0]; L.mom = 0; L.st = "KICKOFF"; L.zn = []; for (var i = 0; i < 18; i++) L.zn.push(0);
  var h = typeof hashStr === "function" ? hashStr(S.yr + "|" + S.tw + "|" + L.fi + "|" + (f ? f.opp : 0)) : 0, mo = (7 + Math.floor((S.tw || 0) / 4.35)) % 12; /* mes aproximado: la temporada arranca en agosto */
  var w = [30, 28, 20, 10, 12];
  if (mo >= 6 && mo <= 8) w = [40, 20, 8, 30, 2]; else if (mo === 11 || mo <= 1) w = [22, 30, 26, 0, 22];
  var t = w.reduce(function (s, x) { return s + x; }, 0), x = h % t;
  for (var k = 0; k < w.length; k++) { x -= w[k]; if (x < 0) { L.wx = MX_WX[k][0]; break; } }
  if (!L.wx) L.wx = "sun";
}
(function () {
  if (typeof liveStep !== "function") return;
  /* nivel en directo: el cansancio sale de lo que ha corrido cada uno, no de un reloj fijo */
  liveRating = function (L) {
    var f = S.cur.pm[L.fi], tr0 = mTeamRating(L.xi, L.form) + mBuffs();
    if (L.red) tr0 -= 4.5;
    return tr0 - (L.fit ? mxTired(L) : 0) - (f.tr0Adj || 0);
  };
  var _lam = liveLambdas;
  liveLambdas = function (L) {
    var lam = _lam.apply(this, arguments).slice(), m = clamp((L.mom || 0) / 600, -0.16, 0.16);
    lam[0] *= 1 + m; lam[1] *= 1 - m;
    return lam;
  };
  var _start = liveStart;
  liveStart = function () { var L = _start.apply(this, arguments); if (L) mxInit(L); return L; };
  var _step = liveStep;
  liveStep = function () {
    MX_CUR = null;
    var L = S.live; if (!L || L.done) return _step.apply(this, arguments);
    mxInit(L);
    var out = _step.apply(this, arguments) || [];
    var slots = FORMATIONS[L.form] || [];
    /* resistencia de los que están en el campo */
    L.xi.forEach(function (id, i) { var p = mPl(id); if (!p || id === L.red) return; if (L.fit[id] == null) { L.fit[id] = p.fit; L.fit0[id] = p.fit; } L.fit[id] = clamp(L.fit[id] - mxDecay(L, p, slots[i]), 5, 100); });
    /* zonas: dónde ha estado el balón este minuto */
    var col = clamp(Math.floor((L.bx == null ? 50 : L.bx) / 100 * 6), 0, 5), tac = L.tac || {};
    var wide = tac.width === 2 ? 0.62 : tac.width === 0 ? 0.3 : 0.45, lane = R() < wide ? (R() < 0.5 ? 0 : 2) : 1;
    L.zn[lane * 6 + col]++;
    /* momentum: se va apagando y lo empujan las ocasiones */
    L.mom *= 0.9;
    var st = "OPEN_PLAY";
    out.forEach(function (e) {
      var s = e.us === 1 ? 1 : e.us === 0 ? -1 : 0;
      if (e.t === "goal") { L.mom += 26 * s; st = "KICKOFF"; }
      else if (e.t === "save" || e.t === "post") L.mom += (e.xg != null && e.xg >= 0.3 ? 11 : 6) * s;
      else if (e.t === "miss") L.mom += 4 * s;
      else if (e.t === "yellow" || e.t === "red") { L.mom -= 3 * s; if (st !== "KICKOFF") st = "SET_PIECE"; }
      else if (e.t === "half") st = "HALF_TIME";
      else if (e.t === "end") st = "FULL_TIME";
      if (e.zn != null) L.zn[e.zn]++;
    });
    if (st === "OPEN_PLAY" && L.st === "HALF_TIME") st = "KICKOFF";
    L.mom = clamp(L.mom + (L.own === 0 ? 0.8 : -0.8), -100, 100);
    L.st = st;
    out.forEach(function (e) {
      e.st = st;
      /* si no había ningún texto que encajara, se ajusta la distancia del dibujo al texto elegido */
      if (e.d != null && e.k && !mxTextOk(e.k, e)) e.d = e.k === "long" ? Math.max(e.d, 19) : Math.min(e.d, 12);
    });
    return out;
  };
  var _fin = liveFinish;
  liveFinish = function () {
    var L = S.live, f = L ? S.cur.pm[L.fi] : null;
    if (L && !L.done) liveSimRest();
    if (L && f) {
      if (L.xg) f.xg = [Math.round(L.xg[0] * 100) / 100, Math.round(L.xg[1] * 100) / 100];
    }
    return _fin.apply(this, arguments);
  };
})();
/* el xG de cada tiro lo pone el modelo; se acumula por equipo */
function mxShotXG(L, us, sh, big) {
  var s = typeof mxShot === "function" ? mxShot(L, us, sh, big) : {xg: big ? 0.36 : 0.12};
  if (L.xg) L.xg[us ? 0 : 1] += s.xg;
  MX_CUR = s; /* el comentario de este tiro se elige según su distancia */
  return s;
}
/* reparto del resto de un tiro que no es gol (mismas proporciones que el motor original) */
/* tiro en curso: liveSay solo elige textos que encajen con su distancia (y el campo 2D chuta desde ahí) */
var MX_CUR = null;
var MX_KIND_OK = {
  long: function (c) { return c.d >= 18; }, oneone: function (c) { return c.d <= 13; }, rebound: function (c) { return c.d <= 12; },
  head: function (c) { return c.d <= 12; }, volley: function (c) { return c.d >= 9 && c.d <= 20; }, dribble: function (c) { return c.d <= 18; }
};
function mxTextOk(kind, c) { var f = kind && MX_KIND_OK[kind]; return !f || f(c); }
function mxMissKind(x, xg) { var r = (x - xg) / Math.max(0.01, 1 - xg); return r < 0.49 ? "save" : r < 0.57 ? "post" : "miss"; }
