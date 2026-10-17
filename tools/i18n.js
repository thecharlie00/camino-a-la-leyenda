#!/usr/bin/env node
/* Herramientas de traducción.
   node tools/i18n.js keys                → i18n/keys.json con todas las claves (texto castellano) y su contexto
   node tools/i18n.js leftovers <fichero> → textos castellanos que parecen visibles y siguen sin tr() (src/x.js o trozo de work/)
   node tools/i18n.js check               → cobertura y huecos {…} de cada idioma (i18n/<idioma>/*.json)
   node tools/i18n.js build               → genera src/lang-<idioma>.js */
const fs = require("fs"), path = require("path"), vm = require("vm");
const acorn = require("acorn"), walk = require("acorn-walk");
const ROOT = path.join(__dirname, ".."), SRC = path.join(ROOT, "src"), I18N = path.join(ROOT, "i18n"), WORK = path.join(ROOT, "work");
const LANGS = ["en", "de", "it", "fr"];
const CODE_FILES = ["i18n.js", "data.js", "engine-core.js", "engine-player.js", "events.js", "events-extra.js", "events-more.js", "trophies.js", "engine-manager.js", "events-manager.js", "events-manager-extra.js", "events-manager-more.js", "engine-modes.js", "press-data.js", "social-data.js", "engine-extra.js", "engine-market.js", "press-ctx.js", "draw.js", "shootout.js", "life.js", "mgr-plus.js", "market26.js", "pets.js", "achieve.js", "ach36.js", "week29.js", "club30.js", "nat31.js", "chal32.js", "story33.js", "edit35.js", "squad37.js", "crest.js", "faces.js", "minigame.js", "pitch.js", "ui.js", "ui-press.js", "ui-draw.js", "ui-shootout.js", "ui-life.js", "ui-pets.js", "ui-mgrplus.js", "ui-guide.js", "ui-steps.js", "ui-cups.js", "ui-week.js", "ui-club30.js", "ui-chal32.js", "ui-story33.js", "ui-35.js", "ui-37.js"];
const MARKERS = {tr: [0], N_: [0], trn: [1, 2], awd: [1], t: [0]};
const STATIC_EV = {EV: 1, MO: 1, MEV: 1, MMO: 1};

function parse(code) { return acorn.parse(code, {ecmaVersion: 2020, locations: true, allowHashBang: true}); }
function lineOf(code, n) { return code.split("\n")[n - 1] || ""; }

/* ---------- claves en el código ---------- */
function keysOf(code, file, out) {
  const ast = parse(code);
  walk.full(ast, (node) => {
    if (node.type !== "CallExpression" || node.callee.type !== "Identifier") return;
    const idx = MARKERS[node.callee.name];
    if (!idx) return;
    idx.forEach((i) => {
      const a = node.arguments[i];
      if (!a) return;
      if (a.type === "Literal" && typeof a.value === "string") add(out, a.value, file + ":" + a.loc.start.line, lineOf(code, a.loc.start.line), node.callee.name === "trn" ? (i === 1 ? "plural:singular" : "plural:plural") : null);
    });
  });
}
function add(out, key, where, ctx, note) {
  if (!key || !/[A-Za-zÀ-ÿ]/.test(key)) return;
  const e = out[key] || (out[key] = {w: [], ctx: ""});
  if (e.w.length < 4) e.w.push(where);
  if (!e.ctx && ctx) e.ctx = ctx.trim().slice(0, 220);
  if (note) e.note = note;
}
/* claves que solo existen al ejecutar: datos (países, ligas, copas…) y campos fijos de las decisiones */
function runtimeKeys(out) {
  const files = ["i18n.js", "data.js", "data-es.js", "data-f.js", "names.js", "real.js", "real-f.js", "engine-core.js", "engine-player.js", "events.js", "events-extra.js", "events-more.js", "trophies.js", "engine-manager.js", "events-manager.js", "events-manager-extra.js", "events-manager-more.js", "engine-modes.js", "press-data.js", "social-data.js", "engine-extra.js", "engine-market.js", "press-ctx.js", "draw.js", "shootout.js", "life.js", "mgr-plus.js", "market26.js", "pets.js", "achieve.js", "ach36.js", "week29.js", "club30.js", "nat31.js", "chal32.js", "story33.js", "edit35.js", "squad37.js", "crest.js", "faces.js", "minigame.js"].filter(f => fs.existsSync(path.join(SRC, f)));
  const ctx = {console, Math, Date, JSON};
  vm.createContext(ctx);
  vm.runInContext(files.map(f => fs.readFileSync(path.join(SRC, f), "utf8")).join("\n"), ctx);
  const G = ctx;
  vm.runInContext("buildWorld()", ctx);
  const W = vm.runInContext("W", ctx), DATA = vm.runInContext("DATA", ctx);
  W.ctry.forEach(c => add(out, c.n, "data:país", "País (nombre de la selección): " + c.n + " [" + c.code + "]"));
  W.lg.forEach(l => {
    add(out, l.n, "data:liga", "Nombre de liga (" + l.c + "). Si es un nombre propio comercial, déjalo igual.");
    if (l.cup) add(out, l.cup, "data:copa", "Copa nacional de " + l.c + ". Usa el nombre habitual en el idioma (p. ej. Copa del Rey → Copa del Rey / King's Cup).");
    if (l.sc) add(out, l.sc, "data:supercopa", "Supercopa nacional de " + l.c);
  });
  Object.keys(W.pos).forEach(k => add(out, W.pos[k].n, "data:posición", "Nombre completo de la posición " + k));
  (DATA.natTournaments || []).forEach(t => add(out, t.n, "data:torneo", "Torneo de selecciones"));
  /* una temporada de muestra para recoger competiciones y rondas */
  G.newCareer({fn: "A", ln: "B", nat: "ES", pos: "DC", foot: "Diestro", age: 17, talent: "joya", club: -1, ev: 1, seed: 7});
  const S = vm.runInContext("S", ctx);
  const comps = Object.keys(S.C).map(k => S.C[k]);
  for (let k = 0; k < 40000 && S.yr < 2028; k++) {
    G.cleanPend();
    if (S.pend.length) { const x = S.pend[0]; let ch = 0; if (x.k === "offers") ch = x.forced ? 0 : -1; G.resolvePending(ch); } else G.advance();
    Object.keys(G.S.C).forEach(c => { if (comps.indexOf(G.S.C[c]) < 0) comps.push(G.S.C[c]); });
  }
  comps.forEach(c => {
    const base = String(c.n).replace(/\s+\d{4}(\/\d{2})?$/, "");
    add(out, base, "data:competición", "Nombre de competición: " + c.n);
    if (c.s) add(out, String(c.s).replace(/\s+\d{4}$/, ""), "data:competición-corta", "Nombre corto de competición (para marcadores): " + c.s);
    if (c.sub) add(out, c.sub, "data:competición", "Subdivisión: " + c.sub);
    if (c.ko) c.ko.r.forEach(r => add(out, r.n, "data:ronda", "Ronda eliminatoria"));
  });
  ["EVENTS", "MOMENTS", "MEVENTS", "MGR_MOMENTS"].forEach(arr => {
    vm.runInContext(arr, ctx).forEach(e => {
      const es = e._es || {};
      if (es.title) add(out, es.title, "evento:" + e.id, "Título de la decisión «" + e.id + "»");
      if (es.cat) add(out, es.cat, "evento:" + e.id, "Categoría (etiqueta corta) de decisiones");
      if (es.ref) add(out, es.ref, "evento:" + e.id, "Recuadro «Pasó de verdad»: hecho real del fútbol");
    });
  });
}
function allKeys() {
  const out = {};
  CODE_FILES.forEach(f => { const p = path.join(SRC, f); if (fs.existsSync(p)) keysOf(fs.readFileSync(p, "utf8"), f, out); });
  runtimeKeys(out);
  return out;
}

/* ---------- textos que se han quedado sin tr() ---------- */
function looksSpanish(s) {
  if (s === "use strict") return false;
  let t = s.replace(/^[^<>]*>/, " ").replace(/<\/?[a-zA-Z][^>]*(>|$)/g, " ").replace(/\b[\w-]+=("[^"]*("|$)|'[^']*('|$))/g, " ")
    .replace(/&[a-z]+;|&#\d+;/g, " ").replace(/\{\w+\}/g, " ").trim();
  if (!t || !/[A-Za-zÀ-ÿ]{2,}/.test(t)) return false;
  if (/^[a-z][a-zA-Z0-9_]*$/.test(t)) return false;                    // identificadores
  if (/^[A-Z0-9_:\-.\/#% ]+$/.test(t) && !/[A-Z]{2,}\s+[A-Z]{3,}/.test(t)) return false;   // códigos
  if (/^#[0-9a-f]{3,8}$/i.test(t) || /^(hsl|rgb)a?\(/.test(t) || /^https?:/.test(t)) return false;
  if (/^[\s\d.,:;+\-−–·×%()\/'"|°º€$]+$/.test(t)) return false;
  if (/[:;]\s*[a-z-]+\s*:/.test(s) && /;/.test(s) && !/[áéíóúñ¿¡]/i.test(t)) return false;   // estilos CSS
  if (/[áéíóúñ¿¡]/i.test(t)) return true;
  if (/[A-Za-z]{3,}\s+[A-Za-z]{2,}/.test(t)) return true;
  if (/^[A-ZÁÉÍÓÚ][a-záéíóúñ]{2,}/.test(t)) return true;
  return false;
}
function leftovers(target) {
  /* trozo (work/<fichero>.partN.js): se rearma con los trozos originales para poder analizarlo */
  let code, from = 1, to = Infinity, label = target;
  const m = /([\w-]+\.js)\.part(\d+)\.js$/.exec(target);
  if (m) {
    const man = JSON.parse(fs.readFileSync(path.join(WORK, m[1] + ".manifest.json"), "utf8"));
    const k = +m[2], parts = man.parts.map((p, i) => i === k ? fs.readFileSync(path.join(WORK, p), "utf8") : fs.readFileSync(path.join(WORK, "orig", p), "utf8"));
    from = parts.slice(0, k).join("").split("\n").length;
    to = from + parts[k].split("\n").length - 1;
    code = parts.join("");
  } else code = fs.readFileSync(fs.existsSync(target) ? target : path.join(SRC, target), "utf8");
  const ast = parse(code), skip = new Set(), hits = [];
  walk.fullAncestor(ast, (node, anc) => {
    if (node.type !== "Literal" || typeof node.value !== "string") return;
    const parent = anc[anc.length - 2];
    if (!parent) return;
    if (parent.type === "Property" && parent.key === node) return;
    if (parent.type === "BinaryExpression" && /^[!=]==?$/.test(parent.operator)) return;
    if (parent.type === "SwitchCase") return;
    if (parent.type === "MemberExpression" && parent.property === node) return;
    for (let i = anc.length - 2; i >= 0; i--) {
      const a = anc[i];
      if (a.type === "CallExpression") {
        const cn = a.callee.type === "Identifier" ? a.callee.name : a.callee.type === "MemberExpression" && a.callee.property.name;
        if (MARKERS[cn] || cn === "trComp" || cn === "fillT") return;
        if (/^(log|error|warn|getItem|setItem|removeItem|getAttribute|setAttribute|querySelector|querySelectorAll|getElementById|closest|indexOf|split|replace|test|match|use|doc|addEventListener|createElement|classList|add|remove|toggle|hasOwnProperty)$/.test(cn)) return;
        if (cn && STATIC_EV[cn] && parent.type === "Property" && /^(title|cat|ref|id|tipo|ctx)$/.test(parent.key.name || parent.key.value)) return;
      }
      if (a.type === "NewExpression" && a.callee.name === "Error") return;
      if (a.type === "Property" && /^(k|id|t|tipo|ctx|cat|kind|ph|mode|draw|typ|ck|conf|code|pool|g|key)$/.test(a.key.name || a.key.value) && a.value === anc[i + 1] && /^[\w:-]+$/.test(node.value)) return;
    }
    const ln = node.loc.start.line;
    if (ln < from || ln > to) return;
    if (!looksSpanish(node.value)) return;
    hits.push((ln - from + 1) + ": " + JSON.stringify(node.value).slice(0, 120));
  });
  console.log(label + " · posibles textos sin traducir: " + hits.length);
  hits.forEach(h => console.log("  " + h));
}

/* ---------- traducciones ---------- */
function loadLang(l) {
  const dir = path.join(I18N, l), out = {};
  if (!fs.existsSync(dir)) return out;
  fs.readdirSync(dir).filter(f => f.endsWith(".json")).sort().forEach(f => {
    let j;
    try { j = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")); } catch (e) { console.log("JSON roto: " + l + "/" + f + " " + e.message); return; }
    Object.keys(j).forEach(k => { if (typeof j[k] === "string" && j[k].trim()) out[k] = j[k]; });
  });
  return out;
}
function holes(s) { return (s.match(/\{\w+\}/g) || []).sort().join(","); }
function check(verbose) {
  const keys = allKeys(), K = Object.keys(keys);
  fs.mkdirSync(I18N, {recursive: true});
  fs.writeFileSync(path.join(I18N, "keys.json"), JSON.stringify(keys, null, 1));
  console.log("claves:", K.length);
  LANGS.forEach(l => {
    const t = loadLang(l), miss = K.filter(k => !(k in t)), bad = K.filter(k => k in t && holes(k) !== holes(t[k]));
    const extra = Object.keys(t).filter(k => !keys[k]);
    console.log(l + ": " + (K.length - miss.length) + "/" + K.length + " traducidas · faltan " + miss.length + " · huecos distintos " + bad.length + " · sobran " + extra.length);
    if (verbose) { miss.slice(0, 25).forEach(k => console.log("   falta: " + k.slice(0, 100))); bad.slice(0, 25).forEach(k => console.log("   huecos: " + k.slice(0, 80) + " → " + t[k].slice(0, 80))); }
  });
  return keys;
}
function build() {
  const keys = allKeys();
  LANGS.forEach(l => {
    const t = loadLang(l), o = {};
    Object.keys(keys).sort().forEach(k => { if (t[k] && holes(k) === holes(t[k])) o[k] = t[k]; });
    fs.writeFileSync(path.join(SRC, "lang-" + l + ".js"), "/* traducción: " + l + " (generado por tools/i18n.js) */\nI18N." + l + " = " + JSON.stringify(o, null, 0).replace(/","/g, '",\n"') + ";\n");
    console.log("src/lang-" + l + ".js", Object.keys(o).length, "textos");
  });
  /* fútbol femenino: i18n/fem/<idioma>.json → src/lang-fem.js */
  let fem = "/* fútbol femenino: textos en femenino (generado por tools/i18n.js) */\n";
  ["es"].concat(LANGS).forEach(l => {
    const f = path.join(I18N, "fem", l + ".json");
    if (!fs.existsSync(f)) return;
    const t = JSON.parse(fs.readFileSync(f, "utf8")), o = {};
    Object.keys(t).sort().forEach(k => { if (keys[k] && t[k] && holes(k) === holes(t[k])) o[k] = t[k]; });
    fem += "I18N_F." + l + " = " + JSON.stringify(o, null, 0).replace(/","/g, '",\n"') + ";\n";
    console.log("fem " + l, Object.keys(o).length, "textos");
  });
  fs.writeFileSync(path.join(SRC, "lang-fem.js"), fem);
}

const cmd = process.argv[2];
if (cmd === "keys") { const k = allKeys(); fs.mkdirSync(I18N, {recursive: true}); fs.writeFileSync(path.join(I18N, "keys.json"), JSON.stringify(k, null, 1)); console.log("claves:", Object.keys(k).length); }
else if (cmd === "leftovers") leftovers(process.argv[3]);
else if (cmd === "check") check(process.argv.includes("-v"));
else if (cmd === "build") build();
else console.log("uso: node tools/i18n.js keys|leftovers <fichero>|check [-v]|build");
