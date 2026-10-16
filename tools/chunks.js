#!/usr/bin/env node
/* Trocear ficheros grandes para que varias personas (o agentes) los traduzcan a la vez sin pisarse.
   node tools/chunks.js split <fichero> <n>     → work/<fichero>.part0.js … (+ copia original en work/orig)
   node tools/chunks.js check <work/…partK.js>  → comprueba la sintaxis del fichero con ESTE trozo editado y los demás originales
   node tools/chunks.js test <work/…partK.js>   → además ejecuta las simulaciones (o la prueba de interfaz si es ui.js)
   node tools/chunks.js join <fichero>          → une los trozos editados en src/<fichero> (comprobando sintaxis) */
const fs = require("fs"), path = require("path"), cp = require("child_process"), os = require("os");
const acorn = require("acorn");
const ROOT = path.join(__dirname, ".."), SRC = path.join(ROOT, "src"), WORK = path.join(ROOT, "work"), ORIG = path.join(WORK, "orig");
const BOUND = {
  "ui.js": /^  (function [\w$]+|\/\* -{5,}|var [\w$]+ = )/,
  def: /^(function [\w$]+|EV\(\{|MO\(\{|MEV\(\{|MMO\(\{|\/\* =+|\/\* -{5,}|var [\w$]+)/
};
function syntax(code, label) {
  try { acorn.parse(code, {ecmaVersion: 2020}); return true; }
  catch (e) { console.log("ERROR DE SINTAXIS en " + label + ": " + e.message); return false; }
}
function manifest(file) { return JSON.parse(fs.readFileSync(path.join(WORK, file + ".manifest.json"), "utf8")); }
function partInfo(p) {
  const m = /([\w-]+\.js)\.part(\d+)\.js$/.exec(p);
  if (!m) throw new Error("no es un trozo: " + p);
  return {file: m[1], k: +m[2]};
}
function assemble(file, k) {
  const man = manifest(file);
  return man.parts.map((p, i) => fs.readFileSync(path.join(i === k ? WORK : ORIG, p), "utf8")).join("");
}
const cmd = process.argv[2], arg = process.argv[3];
if (cmd === "split") {
  const n = +process.argv[4] || 2, code = fs.readFileSync(path.join(SRC, arg), "utf8"), lines = code.split("\n");
  const re = BOUND[arg] || BOUND.def, total = code.length, cuts = [];
  let acc = 0, next = 1;
  for (let i = 0; i < lines.length && next < n; i++) {
    if (acc >= total * next / n && re.test(lines[i])) { cuts.push(i); next++; }
    acc += lines[i].length + 1;
  }
  fs.mkdirSync(ORIG, {recursive: true});
  const parts = [], bounds = [0].concat(cuts, [lines.length]);
  for (let k = 0; k < bounds.length - 1; k++) {
    let txt = lines.slice(bounds[k], bounds[k + 1]).join("\n");
    if (k < bounds.length - 2) txt += "\n";
    const name = arg + ".part" + k + ".js";
    fs.writeFileSync(path.join(WORK, name), txt); fs.writeFileSync(path.join(ORIG, name), txt);
    parts.push(name);
    console.log(name, "líneas", bounds[k] + 1, "–", bounds[k + 1], "·", Math.round(txt.length / 1024) + " KB");
  }
  fs.writeFileSync(path.join(WORK, arg + ".manifest.json"), JSON.stringify({file: arg, parts: parts}, null, 1));
} else if (cmd === "check" || cmd === "test") {
  const {file, k} = partInfo(arg), code = assemble(file, k);
  if (!syntax(code, file + " (trozo " + k + ")")) process.exit(1);
  console.log("sintaxis correcta: " + file + " con el trozo " + k);
  if (cmd === "test") {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "camino-"));
    fs.readdirSync(SRC).forEach(f => fs.copyFileSync(path.join(SRC, f), path.join(tmp, f)));
    fs.writeFileSync(path.join(tmp, file), code);
    const env = Object.assign({}, process.env, {CAMINO_SRC: tmp});
    const run = (c) => { console.log("$ " + c); try { const out = cp.execSync(c, {cwd: ROOT, env: env, encoding: "utf8", timeout: 900000}); console.log(out.split("\n").filter(l => /Problemas|ERROR|Total|ERRORES|FALLO|error/i.test(l)).join("\n")); } catch (e) { console.log((e.stdout || "") + (e.stderr || "")); } };
    if (file === "ui.js") run("node tools/smoke.js " + tmp);
    else { run("node test/sim.js 1 --mgr"); run("node test/modes.js 1 3"); }
    fs.rmSync(tmp, {recursive: true, force: true});
  }
} else if (cmd === "join") {
  const man = manifest(arg), code = man.parts.map(p => fs.readFileSync(path.join(WORK, p), "utf8")).join("");
  if (!syntax(code, arg)) process.exit(1);
  fs.writeFileSync(path.join(SRC, arg), code);
  console.log("src/" + arg + " actualizado (" + Math.round(code.length / 1024) + " KB)");
} else console.log("uso: node tools/chunks.js split <fichero> <n> | check <trozo> | test <trozo> | join <fichero>");
