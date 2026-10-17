/* bolas.js — física y balance del campo 2D («las bolitas»), versión 4.2.
   Funciones puras, sin DOM ni estado global: las usa pitch.js y se prueban en Node (test/bolas42.js).
   - calculateAttributeImpact: curva sigmoide con rendimientos decrecientes y castigo por cansancio.
   - slotTarget / applyTacticalOffsets: destino de cada jugador según la línea, la amplitud y la presión.
   - steer: movimiento con llegada suave, radio de giro, tope de velocidad, zona de reposo y límites del campo.
   - sepForce: separación entre bolitas (también si dos caen en el mismo punto exacto).
   - ballFree: balón suelto con gravedad, botes, rozamiento y parada exacta.
   - passError, tackleReach, stealReach, reaction, icptChance: lo que aportan pase, entrada y colocación. */
var Bolas = (function () {
  var LEN = 105, WID = 68, MIDY = 34, GRAV = 9.8;
  var VMAX_CAP = 10.2;            /* nadie corre más de 10,2 m/s, ni con esprint de remate */
  var ROLL_FRIC = 3.4;            /* m/s² rodando */
  var STOP_V = 0.05;              /* por debajo, el balón se para del todo */
  var REST_IN = 0.3, REST_OUT = 0.65;
  var B_PL = {x0: -2, x1: LEN + 2, y0: 0.3, y1: WID - 0.3};
  var B_BALL = {x0: -6, x1: LEN + 6, y0: -4, y1: WID + 4};
  var BLK_LINE_MIN = [8, 12, 17, 23, 31], BLK_LINE_MAX = [19, 27, 36, 44, 52], BLK_SPAN = [0.42, 0.5, 0.56, 0.6, 0.64];
  var PRESS_R = [10, 14, 18, 24, 32];
  var WIDE = {LD: 1, LI: 1, MD: 1, MI: 1, ED: 1, EI: 1}, BACK = {LD: 1, LI: 1, DFC: 1};

  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function fin(x) { return typeof x === "number" && isFinite(x); }
  function sig(x) { return 1 / (1 + Math.exp(-x)); }

  /* curva normalizada: 1 → 0 y 99 → 1, centrada en 62; sube rápido en la zona media y se aplana arriba */
  var C_MID = 62, C_K = 14, S0 = sig((1 - C_MID) / C_K), S1 = sig((99 - C_MID) / C_K);
  function curve(r) { r = clamp(fin(r) ? r : 60, 1, 99); return (sig((r - C_MID) / C_K) - S0) / (S1 - S0); }
  /* cansancio: nada por encima del 90 %; por debajo baja de forma no lineal hasta −32 % con el depósito vacío */
  function fatigue(st, o) {
    st = clamp(fin(st) ? st : 1, 0, 1);
    var th = o && o.th != null ? o.th : 0.9, fd = o && o.fat != null ? o.fat : 0.32;
    return st >= th ? 1 : 1 - fd * Math.pow((th - st) / th, 1.3);
  }
  /* valor físico = base × curva del atributo (entre lo y hi) × cansancio */
  function calculateAttributeImpact(baseValue, statRating, stamina, o) {
    o = o || {};
    var lo = o.lo != null ? o.lo : 0.8, hi = o.hi != null ? o.hi : 1.16;
    var b = fin(baseValue) ? baseValue : 0;
    return b * (lo + (hi - lo) * curve(statRating)) * fatigue(stamina, o);
  }

  /* ---------- táctica ---------- */
  /* tac: {blk −2..2, press, ret, width 0..2, pass 0..2}; att: si tiene el balón; bu: balón en metros desde la propia portería */
  function tacOffsets(tac, att, bu, retreat) {
    var blk = clamp(tac.blk | 0, -2, 2), Ld, span, wk;
    if (att) { Ld = clamp(bu - 36, 13, 50) + blk * 2.5; span = 0.95; wk = [0.8, 1, 1.12][clamp(tac.width | 0, 0, 2)]; }
    else {
      Ld = clamp(bu - (25 - blk * 2.5), BLK_LINE_MIN[blk + 2], BLK_LINE_MAX[blk + 2]);
      span = BLK_SPAN[blk + 2]; wk = blk <= -2 ? 0.6 : 0.72;
      if (retreat || (tac.ret && bu < 45)) { Ld = Math.min(Ld, 15); span = Math.min(span, 0.46); }
    }
    return {Ld: Ld, span: span, wk: wk};
  }
  function pressRadius(tac) { return PRESS_R[clamp(tac.blk | 0, -2, 2) + 2] + (tac.press ? 6 : 0); }
  /* destino de un jugador de campo en coordenadas de su equipo (u = metros desde su portería) */
  function slotTarget(hu, hy, pos, off, tac, att, by, offU) {
    var u = off.Ld + (hu - 21) * off.span, oy = hy - MIDY, w = tac.width | 0;
    by = fin(by) ? by : MIDY;
    if (att) {
      if (WIDE[pos] && w === 2 && hu > 40) oy = (oy > 0 ? 1 : -1) * 31;
      else if (WIDE[pos] && w === 0) oy *= 0.62;
      else oy *= off.wk;
      if (w === 0 || tac.pass === 0) oy += (by - MIDY) * 0.22;
      if (tac.pass === 2 && hu > 60) u += 4;
      if (!BACK[pos] && fin(offU)) u = Math.min(u, offU);
    } else oy = oy * off.wk + (by - MIDY) * 0.36;
    return {u: clamp(u, 3, LEN - 3), y: clamp(MIDY + oy, 0.8, WID - 0.8)};
  }
  function gkTarget(att, bu, by, blk) {
    var gu = att ? clamp(10 + (bu - 50) * 0.18, 4, 22) : clamp(3 + Math.max(0, bu - 30) * 0.11 + (blk >= 1 ? 2.5 : 0), 1.2, 15);
    return {u: gu, y: MIDY + clamp(((fin(by) ? by : MIDY) - MIDY) * 0.3, -5, 5)};
  }
  /* formationPositions: [{pos, hu, hy}] en metros (hu desde la propia portería);
     tacticalSliders: {blk, width, pass, press, ret, att, bu, by, offU}. Devuelve [{u, y}] dentro del campo. */
  function applyTacticalOffsets(formationPositions, tacticalSliders) {
    var t = tacticalSliders || {}, tac = {blk: t.blk || 0, width: t.width == null ? 1 : t.width, pass: t.pass == null ? 1 : t.pass, press: !!t.press, ret: !!t.ret};
    var bu = fin(t.bu) ? t.bu : 52.5, off = tacOffsets(tac, !!t.att, bu, false);
    return (formationPositions || []).map(function (f) {
      if (!f) return null;
      return f.pos === "POR" ? gkTarget(!!t.att, bu, t.by, tac.blk) : slotTarget(f.hu, f.hy, f.pos, off, tac, !!t.att, t.by, t.offU);
    });
  }

  /* ---------- movimiento ---------- */
  /* p: {x, y, vx, vy, rest}; prm: {vmax, acc, agi, mass, b: límites}. Devuelve false si tuvo que reparar un NaN. */
  function steer(p, tx, ty, sdt, prm) {
    var ok = true, bd = prm.b || B_PL;
    if (!fin(p.x) || !fin(p.y)) { p.x = fin(p.hx) ? p.hx : LEN / 2; p.y = fin(p.hyy) ? p.hyy : MIDY; ok = false; }
    if (!fin(p.vx) || !fin(p.vy)) { p.vx = 0; p.vy = 0; ok = false; }
    if (!fin(tx) || !fin(ty)) { tx = p.x; ty = p.y; ok = false; }
    if (!(sdt > 0)) { keepIn(p, bd); return ok; }
    sdt = Math.min(sdt, 0.1);
    tx = clamp(tx, bd.x0, bd.x1); ty = clamp(ty, bd.y0, bd.y1);
    var vmax = Math.min(VMAX_CAP, fin(prm.vmax) ? prm.vmax : 6), acc = fin(prm.acc) && prm.acc > 0 ? prm.acc : 5, agi = prm.agi || 1, mass = prm.mass || 1;
    var dx = tx - p.x, dy = ty - p.y, dist = Math.sqrt(dx * dx + dy * dy), spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    /* zona de reposo con histéresis: al llegar se queda quieto y no tiembla sobre el punto */
    if (p.rest && dist > REST_OUT) p.rest = false;
    if (!p.rest && dist < REST_IN && spd < 0.9) p.rest = true;
    var ax, ay;
    if (p.rest) {
      var dmp = Math.max(0, 1 - 9 * sdt); p.vx *= dmp; p.vy *= dmp;
      if (Math.abs(p.vx) + Math.abs(p.vy) < 0.02) { p.vx = 0; p.vy = 0; }
    } else {
      /* llegada: v = √(2·a·d), así frena antes del punto y no se pasa */
      var want = dist > 0.05 ? Math.min(vmax, Math.sqrt(2 * acc * 0.75 * dist)) : 0;
      var wx = dist > 0.05 ? dx / dist * want : 0, wy = dist > 0.05 ? dy / dist * want : 0;
      ax = wx - p.vx; ay = wy - p.vy;
      if (spd > 0.6) {
        var ux = p.vx / spd, uy = p.vy / spd, al = ax * ux + ay * uy, ap = -ax * uy + ay * ux;
        var lat = acc * 1.15 * agi / (1 + spd * 0.2 * mass);
        al = clamp(al, -acc * 1.5 * sdt, acc * sdt); ap = clamp(ap, -lat * sdt, lat * sdt);
        ax = al * ux - ap * uy; ay = al * uy + ap * ux;
      } else {
        var am = Math.sqrt(ax * ax + ay * ay), lim = acc * sdt;
        if (am > lim) { ax *= lim / am; ay *= lim / am; }
      }
      p.vx += ax; p.vy += ay;
      var s2 = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (s2 > VMAX_CAP) { p.vx *= VMAX_CAP / s2; p.vy *= VMAX_CAP / s2; }
    }
    p.x += p.vx * sdt; p.y += p.vy * sdt;
    keepIn(p, bd);
    return ok;
  }
  /* nunca fuera de los límites: si choca con el borde, pierde la velocidad hacia fuera */
  function keepIn(p, bd) {
    if (p.x < bd.x0) { p.x = bd.x0; if (p.vx < 0) p.vx = 0; } else if (p.x > bd.x1) { p.x = bd.x1; if (p.vx > 0) p.vx = 0; }
    if (p.y < bd.y0) { p.y = bd.y0; if (p.vy < 0) p.vy = 0; } else if (p.y > bd.y1) { p.y = bd.y1; if (p.vy > 0) p.vy = 0; }
  }

  /* separación de Reynolds: fuerza de empuje dentro del radio R (peso 1 compañeros, wOpp rivales).
     Si dos bolitas coinciden en el mismo punto, se separan en una dirección fija por pareja (opuesta para cada una). */
  function pairDir(ka, kb) {
    var lo = Math.min(ka, kb), hi = Math.max(ka, kb), a = (lo * 2.39996 + hi * 0.7071) % (Math.PI * 2);
    if (ka > kb) a += Math.PI;
    return a;
  }
  function sepForce(p, T, s, o) {
    o = o || {};
    var R = o.R || 2.3, wOpp = o.wOpp == null ? 0.45 : o.wOpp, lim = o.lim || 1.6, out = {x: 0, y: 0}, near = 0;
    for (var t = 0; t < T.length; t++) {
      if (t !== s && o.skipOpp) continue;
      var w = t === s ? 1 : wOpp, L = T[t];
      for (var j = 0; j < L.length; j++) {
        var q = L[j]; if (!q || q === p || q.gone || q.off) continue;
        var dx = p.x - q.x, dy = p.y - q.y, d2 = dx * dx + dy * dy;
        if (d2 >= R * R) continue;
        /* empuje lineal en todo el radio y un núcleo duro por debajo de 1,2 m para que nadie se monte encima */
        var d = Math.sqrt(d2), f = ((R - d) / R + (d < 1.2 ? (1.2 - d) * 1.6 : 0)) * w; if (t === s) near++;
        if (d < 0.02) { var a = pairDir(p._k || 0, q._k == null ? j + t * 16 : q._k); out.x += Math.cos(a) * f; out.y += Math.sin(a) * f; }
        else { out.x += dx / d * f; out.y += dy / d * f; }
      }
    }
    var m = Math.sqrt(out.x * out.x + out.y * out.y);
    /* en un montón (varios compañeros a la vez) el empuje máximo crece para que el grupo se abra */
    if (near > 1) lim = Math.min(lim * 2, lim * (1 + 0.22 * (near - 1)));
    if (m > 0) { var k = Math.min(lim, m * 1.8) / m; out.x *= k; out.y *= k; }
    return out;
  }

  /* ---------- balón suelto ---------- */
  function ballFree(b, sdt) {
    if (!fin(b.x) || !fin(b.y)) { b.x = fin(b.px) ? b.px : LEN / 2; b.y = fin(b.py) ? b.py : MIDY; b.vx = 0; b.vy = 0; b.z = 0; b.vz = 0; }
    if (!fin(b.vx) || !fin(b.vy)) { b.vx = 0; b.vy = 0; }
    if (!fin(b.z) || !fin(b.vz)) { b.z = 0; b.vz = 0; }
    if (!(sdt > 0)) return;
    if (b.z > 0 || b.vz > 0) {
      b.vz -= GRAV * sdt; b.z += b.vz * sdt;
      var dr = 1 - 0.1 * sdt; b.vx *= dr; b.vy *= dr;
      if (b.spin) { var svx = b.vx; b.vx -= b.vy * b.spin * sdt; b.vy += svx * b.spin * sdt; b.spin *= 1 - 0.9 * sdt; }
      if (b.z <= 0) {
        b.z = 0;
        if (b.vz < -1.4) { b.vz = -b.vz * 0.48; b.vx *= 0.82; b.vy *= 0.82; } else b.vz = 0;
      }
    } else {
      b.z = 0; b.vz = 0;
      var sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
      if (sp > 0) {
        /* rozamiento de Coulomb: integra la parada dentro del paso para no pasarse ni dejar restos */
        var dv = ROLL_FRIC * sdt;
        if (sp <= dv || sp < STOP_V) { var tt = sp / ROLL_FRIC; b.x += b.vx * tt * 0.5; b.y += b.vy * tt * 0.5; b.vx = 0; b.vy = 0; clampBall(b); return; }
        var ns = (sp - dv) / sp, mvx = b.vx * (1 + ns) * 0.5, mvy = b.vy * (1 + ns) * 0.5;
        b.vx *= ns; b.vy *= ns; b.x += mvx * sdt; b.y += mvy * sdt; clampBall(b); return;
      }
    }
    b.x += b.vx * sdt; b.y += b.vy * sdt;
    clampBall(b);
  }
  function clampBall(b) {
    if (b.x < B_BALL.x0 || b.x > B_BALL.x1) { b.x = clamp(b.x, B_BALL.x0, B_BALL.x1); b.vx = 0; b.vy = 0; }
    if (b.y < B_BALL.y0 || b.y > B_BALL.y1) { b.y = clamp(b.y, B_BALL.y0, B_BALL.y1); b.vx = 0; b.vy = 0; }
  }

  /* ---------- pase, entrada y colocación ---------- */
  function gauss(rnd) { var u = 1 - rnd(), v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  /* cono de error del pase: ángulo (rad) y peso (fracción de la distancia, + largo / − corto) */
  function passSigma(pas, st, dist, press) {
    var qn = curve(pas), tired = 1 - fatigue(st);
    var sa = (0.012 + 0.07 * Math.pow(1 - qn, 1.2) + 0.12 * tired + 0.025 * clamp(press || 0, 0, 1)) * (0.8 + clamp(dist || 0, 0, 60) / 60);
    var sl = 0.02 + 0.1 * (1 - qn) + 0.15 * tired;
    return {a: sa, l: sl};
  }
  function passError(pas, st, dist, press, rnd) {
    rnd = rnd || Math.random;
    var s = passSigma(pas, st, dist, press);
    return {a: clamp(gauss(rnd), -2.2, 2.2) * s.a, l: clamp(gauss(rnd), -2.2, 2.2) * s.l};
  }
  /* alcance para cortar un pase y para robar en el uno contra uno (m) */
  function tackleReach(ent, agi) { return 1.0 + 0.9 * curve(ent) + 0.4 * ((agi || 1) - 0.95); }
  function stealReach(ent, st) { return (0.95 + 0.7 * curve(ent)) * (0.85 + 0.15 * clamp(fin(st) ? st : 1, 0, 1)); }
  /* retardo de reacción del defensor (s): mejor colocación, menos retardo; el cansancio lo alarga */
  function reaction(col, st) { return 0.3 - 0.16 * curve(col) + 0.1 * (1 - fatigue(st)); }
  /* probabilidad de cortar un pase raso cuando pasa a su alcance */
  function icptChance(ent, agi, st, pas) {
    return clamp(0.3 * (0.75 + 0.5 * curve(ent)) * (0.85 + 0.15 * ((agi || 1) / 0.96)) * (0.6 + 0.4 * clamp(fin(st) ? st : 1, 0, 1)) * (1.25 - 0.5 * curve(pas)), 0.02, 0.6);
  }

  return {LEN: LEN, WID: WID, VMAX_CAP: VMAX_CAP, ROLL_FRIC: ROLL_FRIC, B_PL: B_PL, B_BALL: B_BALL,
    curve: curve, fatigue: fatigue, calculateAttributeImpact: calculateAttributeImpact,
    tacOffsets: tacOffsets, pressRadius: pressRadius, slotTarget: slotTarget, gkTarget: gkTarget, applyTacticalOffsets: applyTacticalOffsets,
    steer: steer, sepForce: sepForce, ballFree: ballFree,
    passSigma: passSigma, passError: passError, tackleReach: tackleReach, stealReach: stealReach, reaction: reaction, icptChance: icptChance};
})();
