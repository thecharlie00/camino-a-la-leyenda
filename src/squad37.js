/* squad37.js — versatilidad de posiciones y media física (versión 3.7).
   Posiciones: cada jugador tiene su posición natural y hasta dos secundarias afines (deterministas, se guardan en p.pos2).
     Natural 0 · Secundaria −2 · Emergencia −6/−9/−12 · Incompatible −25 y baja la moral si juega ahí.
     (Penalización en puntos de media, la misma escala que ya usaba el motor: un 70 de secundario rinde como 68.)
   Media física (PHY, 1-99) = resistencia × 0,4 + condición actual × 0,4 + fuerza/ritmo × 0,2.
     La resistencia también reduce el cansancio de cada partido. */
var POS_LV_NAMES = [N_("Natural"), N_("Secundaria"), N_("Emergencia"), N_("Incompatible")];
var PHY_RES_POS = {POR: -12, LD: 6, LI: 6, DFC: 0, MCD: 5, MC: 6, MD: 5, MI: 5, MCO: 2, ED: 3, EI: 3, DC: -2};
var PHY_FZA_POS = {POR: -6, LD: 4, LI: 4, DFC: 6, MCD: 3, MC: 0, MD: 2, MI: 2, MCO: -2, ED: 6, EI: 6, DC: 5};

function sq37Hash(p, salt) { return hashStr(salt + "|" + p.id + "|" + (p.ln || "") + "|" + (p.fn || "")); }
/* posiciones secundarias (se calculan una vez y quedan en la partida) */
function plPos2(p) {
  if (!p) return [];
  if (Array.isArray(p.pos2)) return p.pos2;
  var near = (POS_NEAR[p.pos] || []).slice(), h = sq37Hash(p, "pos2"), out = [];
  if (p.pos !== "POR" && near.length) {
    var n = h % 100 < 15 ? 0 : h % 100 < 62 ? 1 : 2;
    for (var i = 0; i < n && near.length; i++) {
      /* la primera afín es la más probable */
      var k = ((h >>> (8 + i * 5)) % 7) < 4 ? 0 : (h >>> (12 + i * 3)) % near.length;
      out.push(near.splice(k, 1)[0]);
    }
  }
  p.pos2 = out;
  return out;
}
/* nivel de familiaridad: 0 natural, 1 secundaria, 2 emergencia, 3 incompatible */
function posLv(p, sp) {
  if (!p || !sp || p.pos === sp) return 0;
  if (p.pos === "POR" || sp === "POR") return 3;
  if (plPos2(p).indexOf(sp) >= 0) return 1;
  return 2;
}
(function () {
  var _pf = posFit;
  /* posFit(pp, sp, p): con el jugador, tiene en cuenta sus secundarias */
  posFit = function (pp, sp, p) {
    if (!p || pp === sp) return _pf(pp, sp);
    var lv = posLv(p, sp);
    if (lv === 1) return 2;
    if (lv === 3) return 25;
    var b = _pf(pp, sp);
    return b <= 3 ? 6 : b <= 7 ? 9 : 12;
  };
  /* compatible para la lista de un hueco: natural, secundaria o emergencia cercana (misma línea) */
  var _ok = posOk;
  posOk = function (pp, sp, p) { if (!p) return _ok(pp, sp); return posFit(pp, sp, p) <= 9; };
  if (typeof mSlotEff === "function") {
    mSlotEff = function (p, slot) { return p.ovr - posFit(p.pos, slot, p) + clamp((p.mor - 60) / 28 + (p.form - 50) / 30, -2.5, 1.8) - Math.max(0, 55 - p.fit) / 6; };
  }
})();

/* ---------- media física ---------- */
function plRes(p) {
  if (!p) return 50;
  var h = sq37Hash(p, "res"), base = 56 + (h % 28) + (PHY_RES_POS[p.pos] || 0) + ((p.ovr || 60) - 65) * 0.3;
  base -= Math.max(0, (p.age || 25) - 30) * 2.5;
  if ((p.age || 25) <= 19) base -= 3;
  return Math.round(clamp(base, 25, 97));
}
function plFza(p) {
  if (!p) return 50;
  var h = sq37Hash(p, "fza"), base = 54 + (h % 30) + (PHY_FZA_POS[p.pos] || 0) + ((p.ovr || 60) - 65) * 0.35;
  base -= Math.max(0, (p.age || 25) - 29) * 2;
  return Math.round(clamp(base, 25, 97));
}
function plPhy(p) {
  if (!p) return 0;
  var fit = p.fit != null ? p.fit : 90;
  return Math.round(clamp(plRes(p) * 0.4 + fit * 0.4 + plFza(p) * 0.2, 1, 99));
}
/* 0 fresco (80-99), 1 fatiga moderada (60-79), 2 agotado (<60) */
function phyLv(v) { return v >= 80 ? 0 : v >= 60 ? 1 : 2; }

(function () {
  if (typeof mgrFinish !== "function") return;
  var _f = mgrFinish;
  mgrFinish = function (f) {
    var m = S && S.m, before = {}, slotOf = {};
    if (m && m.sq) {
      m.sq.forEach(function (p) { before[p.id] = p.fit; });
      var slots = (typeof FORMATIONS !== "undefined" && FORMATIONS[m.form]) || [];
      (m.xi || []).forEach(function (id, i) { if (id != null) slotOf[id] = slots[i]; });
    }
    var r = _f.apply(this, arguments);
    if (m && m.sq) {
      m.sq.forEach(function (p) {
        var b = before[p.id];
        /* la resistencia reduce el cansancio del partido (50 → igual, 90 → −16 %, 30 → +8 %) */
        if (b != null && p.fit < b) p.fit = clamp(b - (b - p.fit) * (1.2 - plRes(p) / 250), 0, 100);
        /* jugar en una posición incompatible le sienta mal */
        if (slotOf[p.id] && posLv(p, slotOf[p.id]) === 3 && b != null && p.fit < b) p.mor = clamp(p.mor - 3, 0, 100);
      });
    }
    return r;
  };
})();
