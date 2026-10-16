/* ===== IDIOMAS =====
   Estilo gettext: el texto en castellano es la clave. tr("Fichas por el {club}", {club: …}) busca la
   traducción del idioma activo, rellena los huecos {…} y, si falta, deja el castellano.
   - trn(n, "singular", "plural", {…}) elige la forma según n (el hueco {n} se rellena solo).
   - N_("…") solo marca un texto para el extractor; se traduce después con tr(variable).
   - onLang(fn) ejecuta fn ahora y cada vez que cambia el idioma (tablas con textos). */
var LANGS = [["es", "Español"], ["en", "English"], ["de", "Deutsch"], ["it", "Italiano"], ["fr", "Français"]];
var I18N = {en: {}, de: {}, it: {}, fr: {}};
var LANG = "es";
var LANG_HOOKS = [];
/* fútbol femenino: FEM se activa con la partida (S.g === "f"); I18N_F guarda las versiones en femenino de los textos */
var FEM = false;
var I18N_F = {es: {}, en: {}, de: {}, it: {}, fr: {}};
function N_(s) { return s; }
function onLang(fn) { LANG_HOOKS.push(fn); fn(); }
function fillT(t, p) {
  if (p == null) return t;
  if (typeof p !== "object") p = {0: p};
  return t.replace(/\{(\w+)\}/g, function (m, k) { var v = p[k]; return v == null ? m : String(v); });
}
/* francés: «de Arsenal» → «d'Arsenal», «le Inter» → «l'Inter» (solo ante nombres propios) */
var FR_ELIDE = /(^|[^\wÀ-ÿ'’])(le|de|du|au|que) (?=[AEIOUYÀÂÉÈÊÎÔÛ])/g;
function frElide(t) {
  return t.replace(FR_ELIDE, function (m, pre, a) { return pre + {le: "l'", de: "d'", du: "de l'", au: "à l'", que: "qu'"}[a]; });
}
function tr(s, p) {
  if (s == null) return "";
  s = String(s);
  var t = null;
  if (FEM) { var f = I18N_F[LANG]; t = f ? f[s] : null; }
  if (typeof t !== "string" || !t) { var d = LANG !== "es" ? I18N[LANG] : null; t = d ? d[s] : null; }
  if (typeof t !== "string" || !t) t = s;
  if (p != null) t = fillT(t, p);
  if (LANG === "fr") t = frElide(t);
  return t;
}
function trn(n, a, b, p) {
  p = p ? Object.assign({}, p) : {};
  if (p.n == null) p.n = n;
  return tr(Number(n) === 1 ? a : b, p);
}
/* traduce cada parámetro que sea un nombre guardado en castellano (competición, liga, país…) */
function trParams(p) {
  if (!p) return p;
  var o = {};
  Object.keys(p).forEach(function (k) { var v = p[k]; o[k] = typeof v === "string" ? trComp(v) : v; });
  return o;
}
function savedLang() {
  try { var l = localStorage.getItem("camino.lang"); return l && (l === "es" || I18N[l]) ? l : null; } catch (e) { return null; }
}
function setLang(l) {
  if (l !== "es" && !I18N[l]) l = "es";
  LANG = l;
  try { localStorage.setItem("camino.lang", l); } catch (e) {}
  if (typeof document !== "undefined" && document.documentElement) { document.documentElement.lang = l; document.title = tr("Fútbol: Camino a la Leyenda"); }
  LANG_HOOKS.forEach(function (f) { f(); });
}
/* textos fijos de decisiones y momentos (title, cat, ref): se guardan en castellano y se leen traducidos */
function i18nFields(o) {
  ["title", "cat", "ref"].forEach(function (k) {
    var v = o[k];
    if (typeof v !== "string") return;
    Object.defineProperty(o, k, {get: function () { return tr(v); }, enumerable: true, configurable: true});
    (o._es = o._es || {})[k] = v;
  });
  return o;
}

/* ---------- nombres guardados en castellano ---------- */
/* competición o trofeo: "Mundial 2030" → traduce "Mundial" y conserva el año */
function trComp(n) {
  if (n == null || n === "") return "";
  n = String(n);
  var m = /^(.*\S)\s+(\d{4}(?:\/\d{2})?)$/.exec(n);
  return m ? femComp(m[1]) + " " + m[2] : femComp(n);
}
function lgName(li) { return li >= 0 && W.lg && W.lg[li] ? femComp(W.lg[li].n) : ""; }

/* ---------- competiciones en el fútbol femenino ----------
   FEM_COMP: nombres de competición (se rellena al crear el mundo). FEM_NAMES: nombre real de la versión femenina.
   El resto se forma con «femenina» en cada idioma. Las categorías españolas bajan un nombre:
   2.ª → Primera Federación, Primera Fed. → Segunda Fed., Segunda → Tercera, Tercera → Primera Nacional. */
var FEM_COMP = {};
["Champions League", "Champions", "Europa League", "Conference League", "Conference", "Copa Libertadores", "Libertadores", "Copa Sudamericana", "Sudamericana",
  "AFC Champions League Elite", "AFC Champions", "CAF Champions League", "CAF Champions", "Concacaf Champions Cup", "Concachampions", "Supercopa de Europa",
  "Supercopa UEFA", "Recopa Sudamericana", "Recopa", "Copa Intercontinental", "Intercontinental", "UEFA Nations League", "Nations League", "Mundial de Clubes", "Supercopa"
].forEach(function (k) { FEM_COMP[k] = 1; });
var FEM_NAMES = {
  "Premier League": "Women's Super League", "EFL Championship": "Women's Super League 2", "EFL League One": "Women's National League",
  "LaLiga EA Sports": "Liga F", "LaLiga Hypermotion": "Primera Federación", "Serie A": "Serie A Femminile", "Serie B": "Serie B Femminile",
  "Bundesliga": "Frauen-Bundesliga", "2. Bundesliga": "2. Frauen-Bundesliga", "Ligue 1": "Première Ligue", "Ligue 2": "Seconde Ligue",
  "Liga Portugal": "Liga BPI", "Eredivisie": "Eredivisie Vrouwen", "Scottish Premiership": "Scottish Women's Premier League", "Eliteserien": "Toppserien",
  "Allsvenskan": "Damallsvenskan", "Superliga danesa": "Kvindeligaen", "Bundesliga austriaca": "ÖFB Frauen-Bundesliga", "MLS": "NWSL", "Liga MX": "Liga MX Femenil",
  "A-League": "A-League Women", "J1 League": "WE League", "K League 1": "WK League", "Brasileirão Série A": "Brasileirão Feminino",
  "Chinese Super League": "Chinese Women's Super League", "Saudi Pro League": "Saudi Women's Premier League",
  "Copa del Rey": "Copa de la Reina", "FA Cup": "Women's FA Cup", "DFB-Pokal": "DFB-Pokal Frauen", "Coupe de France": "Coupe de France féminine",
  "Coppa Italia": "Coppa Italia Femminile", "US Open Cup": "NWSL Challenge Cup", "Juegos Olímpicos": null,
  "Europa League": "Women's Europa Cup", "Copa Intercontinental": "FIFA Women's Champions Cup", "Intercontinental": "Women's Champions Cup"
};
var FEM_DIV = {"Primera Federación": "Segunda Federación", "Segunda Federación": "Tercera Federación", "Tercera Federación": "Primera Nacional"};
function femSuffix(x) {
  switch (LANG) {
    case "en": return /women/i.test(x) ? x : "Women's " + x;
    case "de": return /^[A-ZÄÖÜ]{2,4}$/.test(x) ? "Frauen-" + x : x + " der Frauen";
    case "it": return x + (/[ic]i$/.test(x.split(" ")[0]) ? " femminili" : " femminile");
    case "fr": return x + (/^(Mondial|Championnat|Tournoi|Trophée|Ballon|Jeux)/.test(x) ? (/^Jeux/.test(x) ? " féminins" : " féminin") : " féminine");
    default: return x + (/^(Mundial|Campeonato|Torneo|Brasileirão|Trofeo|Balón)/.test(x) ? " Femenino" : " Femenina");
  }
}
function femComp(n) {
  if (!FEM) return tr(n);
  var dm = /^(Primera|Segunda|Tercera) Federación/.exec(n);
  if (dm) { var t0 = tr(n); return t0.replace(dm[0], FEM_DIV[dm[0]]); }
  if (!FEM_COMP[n]) return tr(n);
  if (Object.prototype.hasOwnProperty.call(FEM_NAMES, n)) return FEM_NAMES[n] == null ? tr(n) : FEM_NAMES[n];
  return femSuffix(tr(n));
}
/* activa o desactiva el modo femenino; los textos precalculados (onLang) se rehacen */
function setFem(on) {
  on = !!on;
  if (on === FEM) return;
  FEM = on;
  LANG_HOOKS.forEach(function (f) { f(); });
}
function posName(c) { return W.pos && W.pos[c] ? tr(W.pos[c].n) : c; }
var POS_AB = {
  en: {POR: "GK", LD: "RB", DFC: "CB", LI: "LB", MCD: "CDM", MC: "CM", MD: "RM", MI: "LM", MCO: "CAM", ED: "RW", EI: "LW", DC: "ST"},
  de: {POR: "TW", LD: "RV", DFC: "IV", LI: "LV", MCD: "ZDM", MC: "ZM", MD: "RM", MI: "LM", MCO: "ZOM", ED: "RF", EI: "LF", DC: "ST"},
  it: {POR: "POR", LD: "TD", DFC: "DC", LI: "TS", MCD: "CDC", MC: "CC", MD: "ED", MI: "ES", MCO: "COC", ED: "AD", EI: "AS", DC: "ATT"},
  fr: {POR: "GB", LD: "DD", DFC: "DC", LI: "DG", MCD: "MDC", MC: "MC", MD: "MD", MI: "MG", MCO: "MOC", ED: "AD", EI: "AG", DC: "BU"}
};
function posAb(c) { var m = POS_AB[LANG]; return (m && m[c]) || c; }
var ATT_AB = {
  en: {RIT: "PAC", TIR: "SHO", PAS: "PAS", REG: "DRI", DEF: "DEF", FIS: "PHY", EST: "DIV", PAR: "HAN", SAQ: "KIC", REF: "REF", VEL: "SPD", COL: "POS"},
  de: {RIT: "TEM", TIR: "SCH", PAS: "PAS", REG: "DRI", DEF: "DEF", FIS: "PHY", EST: "HEC", PAR: "BAL", SAQ: "ABS", REF: "REF", VEL: "GES", COL: "STE"},
  it: {RIT: "VEL", TIR: "TIR", PAS: "PAS", REG: "DRI", DEF: "DIF", FIS: "FIS", EST: "TUF", PAR: "PRE", SAQ: "RIN", REF: "RIF", VEL: "VEL", COL: "PIA"},
  fr: {RIT: "VIT", TIR: "TIR", PAS: "PAS", REG: "DRI", DEF: "DEF", FIS: "PHY", EST: "PLO", PAR: "JMA", SAQ: "JPI", REF: "REF", VEL: "VIT", COL: "PLA"}
};
function attAb(k) { var m = ATT_AB[LANG]; return (m && m[k]) || k; }
/* nombre de premio: los nuevos guardan plantilla y parámetros; los antiguos solo el texto */
function awd(k, tk, tp, y) { return {k: k, n: fillT(tk, tp), tk: tk, tp: tp || null, y: y}; }
function awardName(a) { return a && a.tk ? tr(a.tk, trParams(a.tp)) : trComp(a ? a.n : ""); }

/* minúsculas dentro de una frase (en alemán los sustantivos van con mayúscula) */
function lcT(s) { s = String(s == null ? "" : s); return LANG === "de" ? s : s.toLowerCase(); }

/* objetivos: guardan plantilla y parámetros para mostrarse en el idioma actual */
function objT(o, tk, tp) {
  var q = {};
  if (tp) Object.keys(tp).forEach(function (k) { q[k] = typeof tp[k] === "number" && tp[k] % 1 ? fmtDec(tp[k], 1) : tp[k]; });
  o.tk = tk; o.tp = tp || null; o.n = tr(tk, trParams(q)); return o;
}
function objName(o) {
  if (!o || !o.tk) return o ? o.n : "";
  var q = {};
  if (o.tp) Object.keys(o.tp).forEach(function (k) { var v = o.tp[k]; q[k] = typeof v === "number" && v % 1 ? fmtDec(v, 1) : v; });
  return tr(o.tk, trParams(q));
}

/* ---------- números ---------- */
function fmtDec(x, n) { var s = Number(x).toFixed(n == null ? 1 : n); return LANG === "en" ? s : s.replace(".", ","); }
function ord(n) {
  n = Math.round(n);
  if (LANG === "en") { var t = n % 100, u = n % 10; return n + (t >= 11 && t <= 13 ? "th" : u === 1 ? "st" : u === 2 ? "nd" : u === 3 ? "rd" : "th"); }
  if (LANG === "de") return n + ".";
  if (LANG === "fr") return n + (n === 1 ? "er" : "e");
  return n + "º";
}
/* fútbol femenino: sueldos, traspasos y presupuestos a su escala real (≈ 4 % del masculino) */
var MONEY_F = 0.04;
function fmtMoney(x) {
  var s = x < 0 ? "−" : ""; x = Math.abs(x) * (FEM ? MONEY_F : 1);
  var M = x >= 1e6, v;
  if (LANG === "en") return s + "€" + (M ? fmtDec(x / 1e6, x >= 1e8 ? 0 : 1) + "M" : x >= 1e3 ? Math.round(x / 1e3) + "k" : Math.round(x));
  if (M) { v = fmtDec(x / 1e6, x >= 1e8 ? 0 : 1); return s + v + " M€"; }
  if (x >= 1e3) return s + Math.round(x / 1e3) + " k€";
  return s + Math.round(x) + " €";
}
/* dinero exacto para negociar: dos decimales en millones (1,82 M€) */
function fmtMoney2(x) {
  var s = x < 0 ? "−" : ""; x = Math.abs(x) * (FEM ? MONEY_F : 1);
  if (x >= 1e6) return LANG === "en" ? s + "€" + fmtDec(x / 1e6, 2) + "M" : s + fmtDec(x / 1e6, 2) + " M€";
  return fmtMoney(s ? -x : x);
}
function fmtFol(k) { return k >= 1000 ? fmtDec(k / 1000, 1) + (LANG === "en" ? "M" : LANG === "de" ? " Mio." : " M") : Math.round(k) + (LANG === "en" ? "k" : LANG === "de" ? " Tsd." : " k"); }
