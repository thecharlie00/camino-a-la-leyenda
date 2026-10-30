/* La web publicada no puede enlazar archivos locales que el build no copia (GOAT Ladder, privacidad, imágenes). */
const fs = require("fs"), path = require("path"), assert = require("assert");
const dist = path.join(__dirname, "../dist"), bad = [];
function walk(dir) { return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]); }
for (const file of walk(dist).filter(f => f.endsWith(".html"))) {
  const rel = path.relative(dist, file);
  if (rel.startsWith("android" + path.sep) || rel.endsWith("juego.html")) continue;
  const html = fs.readFileSync(file, "utf8");
  for (const [, ref] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    if (/^(https?:|\/\/|data:|#|mailto:|javascript:)/.test(ref)) continue;
    let target = path.normalize(path.join(path.dirname(file), ref.split(/[?#]/)[0]));
    if (ref.endsWith("/") || (fs.existsSync(target) && fs.statSync(target).isDirectory())) target = path.join(target, "index.html");
    if (!fs.existsSync(target)) bad.push(rel + " → " + ref);
  }
}
assert.deepStrictEqual(bad, [], "Enlaces rotos en la web:\n" + bad.join("\n"));
for (const page of ["goat-ladder/index.html", "en/goat-ladder/index.html", "privacidad/index.html", "goat-ladder.js"]) assert.ok(fs.existsSync(path.join(dist, page)), page);
console.log("Web links passed: every local script, style, image and page link exists in dist.");
