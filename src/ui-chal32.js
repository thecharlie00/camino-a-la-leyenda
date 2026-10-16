/* ui-chal32.js — versión 3.2: desafíos con medallas, rivalidades, crisis, diario de la carrera y récords. */
(function () {
  if (typeof UIX === "undefined" || typeof CHAL === "undefined") return;
  var U = UIX, h = U.h, MKEY = "camino.medals";
  function medals() { try { return JSON.parse(localStorage.getItem(MKEY) || "{}") || {}; } catch (e) { return {}; } }
  var RANK = {gold: 3, silver: 2, bronze: 1};

  /* ---------- creación: elegir desafío ---------- */
  U.chalCreate = function (c) {
    var md = medals(), s = '<p class="lead">' + tr("Escenarios cerrados con objetivo y medallas. Elige uno y la liga; el club te lo damos nosotros.") + '</p><div class="list">';
    s += Object.keys(CHAL).map(function (k) {
      var x = CHAL[k], m = md[k];
      return '<button class="pickrow" data-a="cset" data-k="chal" data-v="' + k + '" aria-pressed="' + (c.chal === k) + '"><span class="presic" aria-hidden="true">' + x.ic + '</span><div class="grow"><b>' + h(tr(x.n)) + "</b><small>" + h(tr(x.d)) + "</small><small>" + h(tr(x.goal)) + "</small></div>" + (m ? '<span class="chmd" title="' + h(tr(MEDAL_N[m])) + '">' + MEDAL_IC[m] + "</span>" : "") + "</button>";
    }).join("") + "</div>";
    if (c.chal) {
      if (c.lg == null) c.lg = W.lgIdx.ESP1;
      s += U.leagueField(c);
      c.club = chalClub(c.chal, +c.lg);
      s += '<div class="pickrow" aria-pressed="true">' + U.crest(c.club, true) + '<div class="grow"><b>' + h(W.clubs[c.club].n) + "</b><small>" + h(tr("Tu club en este desafío")) + "</small></div></div>";
    } else c.club = -1;
    return s;
  };

  /* ---------- tarjetas en el inicio del míster ---------- */
  U.add("clubTop", function () {
    if (!S || S.mode !== "mgr" || !S.m) return "";
    var o = "";
    if (S.ch) {
      var x = CHAL[S.ch.k], r = S.ch.res;
      o += '<section class="card chcard"><div class="head"><span class="tag hot"><span class="dot"></span>' + tr("Desafío") + '</span><span class="eyebrow">' + h(tr(x.n)) + "</span></div>" +
        (r ? '<p class="chres">' + (r.medal ? MEDAL_IC[r.medal] + " " + tr("Superado: medalla de {m}.", {m: h(medalW(r.medal))}) : tr("No superado. La partida sigue: puedes intentarlo de nuevo en otra.")) + "</p>"
          : '<p class="muted" style="margin:6px 0 0;font-size:13.5px">' + h(tr(x.goal)) + "</p>" + (S.ch.k === "cant" ? '<p class="muted" style="margin:4px 0 0;font-size:13px">' + tr("Temporada {n} de 3. El mercado de fichajes está cerrado para ti.", {n: Math.min(3, S.m.seasons.length - S.ch.n0 + 1)}) + "</p>" : "")) + "</section>";
    }
    var cr = S.m.crisis || 0;
    if (cr && S.m.club >= 0) o += '<section class="card crcard lv' + cr + '"><div class="presrow"><span class="presic" aria-hidden="true">' + (cr >= 3 ? "🚨" : cr === 2 ? "⚠️" : "😬") + '</span><div class="grow"><b>' + tr("Crisis de nivel {n} de 3", {n: cr}) + "</b><small>" + (cr >= 2 ? tr("La directiva aprieta y el vestuario está tocado. Dos buenos resultados seguidos la rebajan.") : tr("Malas sensaciones. Si sigues perdiendo, irá a más.")) + "</small></div></div></section>";
    return o;
  });
  /* medallas guardadas en el dispositivo (sirven para todas las partidas) */
  U.add("after", function () {
    if (!S || !S.ch || !S.ch.res || S.ch.saved) return;
    S.ch.saved = 1;
    if (S.ch.res.medal) { var md = medals(), k = S.ch.k, m = S.ch.res.medal; if (!md[k] || RANK[m] > RANK[md[k]]) { md[k] = m; try { localStorage.setItem(MKEY, JSON.stringify(md)); } catch (e) {} } U.confetti(m === "gold"); }
    U.persist();
  });

  /* ---------- clasificación: rivalidades y récords ---------- */
  function recRow(lab, x) { return x ? "<div><span>" + h(lab) + "</span><span>" + x[0] + " · " + h(clubName(x[1])) + " (" + h(seasonLabel(x[2])) + ")</span></div>" : ""; }
  U.add("comp", function () {
    if (!S || !S.L) return "";
    var o = "", me = U.myClub(), li = me >= 0 ? S.cl[me] : -1;
    if (S.mode === "mgr" && S.m && typeof rvTop === "function") {
      var top = rvTop(3);
      if (top.length) o += '<section class="card"><h3>' + tr("Tus rivalidades") + '</h3><div class="kvlist" style="margin-top:6px">' + top.map(function (c) { var v = rvOf()[c], f = v >= 8 ? "🔥🔥🔥" : v >= 5 ? "🔥🔥" : "🔥"; return "<div><span>" + U.crest(c) + " " + h(clubName(c)) + "</span><span>" + f + "</span></div>"; }).join("") + '</div><p class="muted" style="font-size:12.5px;margin:6px 0 0">' + tr("Crecen con derbis, finales, expulsiones y derrotas. Ganar a un gran rival alegra a la afición; perder, la enfada.") + "</p></section>";
    }
    var R = li >= 0 ? recOf(li) : null;
    if (R) o += '<section class="card"><h3>' + tr("Récords de {lg}", {lg: h(lgName(li))}) + '</h3><div class="kvlist" style="margin-top:6px">' + recRow(tr("Más puntos"), R.pts) + recRow(tr("Más goles a favor"), R.gf) + recRow(tr("Menos goles en contra"), R.ga) + '</div><p class="muted" style="font-size:12.5px;margin:6px 0 0">' + tr("Desde que empezó tu partida.") + "</p></section>";
    return o;
  });

  /* ---------- diario ---------- */
  function cn(c) { return c != null && c >= 0 && W.clubs[c] ? clubName(c) : "—"; }
  function line(d) {
    var a = d.a || {};
    switch (d.k) {
      case "mjob": return ["✍️", tr("Firmas como entrenador del {club}.", {club: cn(a.c)})];
      case "msacked": return ["🚪", tr("Te destituyen en el {club}.", {club: cn(a.c)})];
      case "season": return ["📅", tr("Terminas {pos} en {lg} con el {club}.", {pos: ord(a.pos), lg: lgName(a.lg), club: cn(a.c)})];
      case "mtx": return ["🔁", a.inn ? tr("Fichas a {n} del {club}{fee}.", {n: a.n, club: cn(a.c), fee: a.fee ? " · " + fmtMoney(a.fee) : ""}) : tr("{n} se va al {club}{fee}.", {n: a.n, club: cn(a.c), fee: a.fee ? " · " + fmtMoney(a.fee) : ""})];
      case "tx": return ["🔁", a.loan ? tr("Te vas cedido al {club}.", {club: cn(a.c)}) : tr("Fichas por el {club}{fee}.", {club: cn(a.c), fee: a.fee ? " · " + fmtMoney(a.fee) : ""})];
      case "award": return ["🏅", a.tk ? tr(a.tk, trParams(a.tp)) : trComp(a.n)];
      case "tro": return ["🏆", tr("Campeón: {n}.", {n: trComp(String(a.n || ""))})];
      case "retire": return ["👋", tr("Te retiras.")];
      case "dec": return ["🗳️", a.ti + (a.ch ? " — " + a.ch : "")];
      case "match": return [a.a > a.b ? "⚽" : "😣", tr("{a}-{b} ante el {club}", {a: a.a, b: a.b, club: cn(a.c)}) + (a.fin ? " · " + tr("final") : "")];
      case "pmatch": return ["⚽", (a.g >= 3 ? tr("{n} goles tuyos", {n: a.g}) + " · " : "") + tr("{a}-{b} ante el {club}", {a: a.a, b: a.b, club: a.nat ? natName(a.c) : cn(a.c)}) + (a.fin ? " · " + tr("final") : "")];
      case "rv": return ["🔥", tr("Nace la rivalidad con el {club}.", {club: cn(a.c)})];
      case "crisis": return ["⚠️", tr("El club entra en crisis.")];
      case "chal": return [a.m ? MEDAL_IC[a.m] : "❌", a.m ? tr("Desafío «{n}»: medalla de {m}.", {n: tr(CHAL[a.k].n), m: medalW(a.m)}) : tr("Desafío «{n}» no superado.", {n: tr(CHAL[a.k].n)})];
      case "ach": var A = (typeof ACH_P !== "undefined" ? ACH_P.concat(ACH_M) : []).filter(function (x) { return x[0] === a.id; })[0]; return A ? [A[1], tr("Logro: {n}", {n: tr(A[2])})] : null;
    }
    return null;
  }
  function myRecs() {
    var o = [];
    if (S.mode === "mgr") {
      var R = S.m.recs || {}, best = null;
      S.m.seasons.forEach(function (r) { var p = r.w * 3 + r.d; if (!best || p > best[0]) best = [p, r]; });
      if (R.win) o.push([tr("Mayor goleada"), R.win[0] + "-" + R.win[1] + " · " + h(cn(R.win[2])) + " (" + h(seasonLabel(R.win[3])) + ")"]);
      if (R.best) o.push([tr("Racha sin perder"), trn(R.best, "{n} partido", "{n} partidos")]);
      if (best) o.push([tr("Mejor temporada"), tr("{p} puntos", {p: best[0]}) + " · " + h(cn(best[1].club)) + " (" + h(seasonLabel(best[1].y)) + ")"]);
    } else if (S.p) {
      var bg = null, ba = null;
      S.p.seasons.forEach(function (r) { if (!bg || r.g > bg.g) bg = r; if (!ba || r.a > ba.a) ba = r; });
      if (bg && bg.g) o.push([tr("Más goles en una temporada"), bg.g + " · " + h(seasonLabel(bg.y))]);
      if (ba && ba.a) o.push([tr("Más asistencias en una temporada"), ba.a + " · " + h(seasonLabel(ba.y))]);
      if (S.p.intl.caps) o.push([tr("Con tu selección"), trn(S.p.intl.caps, "{n} partido", "{n} partidos") + " · " + trn(S.p.intl.g, "{n} gol", "{n} goles")]);
    }
    return o;
  }
  U.sheets.diary = function () {
    var l = (S.diary || []).slice().reverse(), by = {}, order = [];
    l.forEach(function (d) { var x = line(d); if (!x) return; var k = d.y; if (!by[k]) { by[k] = []; order.push(k); } by[k].push(x); });
    var rc = myRecs();
    var s = "<h2>" + tr("Diario de tu carrera") + '</h2><div class="stack">';
    if (rc.length) s += '<div><div class="lbl">' + tr("Tus récords") + '</div><div class="kvlist">' + rc.map(function (r) { return "<div><span>" + h(r[0]) + "</span><span>" + r[1] + "</span></div>"; }).join("") + "</div></div>";
    s += order.length ? order.map(function (y) { return '<div><div class="lbl">' + h(seasonLabel(y)) + '</div><ul class="dlist">' + by[y].map(function (x) { return '<li><span aria-hidden="true">' + x[0] + "</span><span>" + h(x[1]) + "</span></li>"; }).join("") + "</ul></div>"; }).join("")
      : '<p class="empty">' + tr("Aquí irán apareciendo tus fichajes, títulos, partidos señalados y decisiones importantes.") + "</p>";
    return s + '<button class="btn wide" data-a="close">' + tr("Cerrar") + "</button></div>";
  };
  U.actions.diary = function () { U.open("diary"); };
})();
