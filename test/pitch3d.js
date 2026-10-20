/* Smoke test aislado del partido 3D.
   Uso: CHROME_PATH="C:\...\chrome.exe" node test/pitch3d.js [carpeta de capturas]
   No necesita construir todo el juego: monta pitch3d.js sobre una página mínima y
   comprueba WebGL, roster, posesión, tiros, descanso, tarjetas, replay y destroy. */
const path = require("path");
const fs = require("fs");
let chromium;
try { ({ chromium } = require("playwright")); } catch (e) { ({ chromium } = require("playwright-core")); }
const OUT = process.argv[2] || path.join(require("os").tmpdir(), "pitch3d-shots");
fs.mkdirSync(OUT, { recursive: true });

const HOME = ["POR", "LD", "DFC", "DFC", "LI", "MCD", "MC", "MCO", "ED", "DC", "EI"];
const AWAY = ["POR", "LD", "DFC", "DFC", "LI", "MCD", "MC", "MCO", "ED", "DC", "EI"];
function roster(prefix) {
  return HOME.map((pos, i) => ({ id: prefix + i, pos, nm: prefix + " " + i, ovr: 64 + (i * 7) % 25,
    age: 19 + (i * 3) % 16, st: 1, fza: 60 + (i * 5) % 33 }));
}

(async () => {
  const src = fs.readFileSync(path.join(__dirname, "../src/pitch3d.js"), "utf8");
  const pageHtml = '<!doctype html><html><body style="margin:0;background:#07100e">' +
    '<div id="pitch" style="width:420px;height:260px;position:relative"></div>' +
    '<script>var Pitch={mount:function(){},destroy:function(){},teams:function(){},state:function(){},' +
    'event:function(){},busy:function(){return 0;},reset:function(){},freeze:function(){},' +
    'clearMsg:function(){},replay:function(){return false;},active:function(){return false;},' +
    'sound:function(){return false;},debug:function(){return null;}};</script>' +
    "<script>" + src + "</script></body></html>";
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || undefined,
    headless: true,
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl", "--enable-unsafe-swiftshader", "--allow-file-access-from-files"]
  });
  const ctx = await browser.newContext({ viewport: { width: 480, height: 340 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  const errs = [], fail = [], notes = [];
  p.on("pageerror", e => errs.push("pageerror: " + e.message));
  p.on("console", m => { if (m.type() === "error") errs.push("console: " + m.text()); });
  await p.setContent(pageHtml);
  await p.evaluate(({ home, away }) => {
    window.P3 = Pitch3D;
    window.P3.mount(document.getElementById("pitch"), { cols: ["#f5b326", "#5db8ff"] });
    window.P3.teams(home, away, [{}, {}]);
    window.P3.state({ own: 0, bx: 50, speed: 1, tac: [{ ment: 2, line: 2, width: 1, pass: 1, tempo: 1 }, null] });
  }, { home: roster("h"), away: roster("a") });
  await p.waitForTimeout(700);

  const check = async (label, fn) => {
    const r = await p.evaluate(fn);
    if (!r || !r.ok) fail.push(label + (r && r.why ? ": " + r.why : ""));
    else notes.push(label + (r.info ? " · " + r.info : ""));
    return r;
  };

  await check("WebGL montado", () => {
    const d = Pitch3D.debug();
    return { ok: d.gl && document.querySelectorAll("canvas.lpitch3d").length === 1 && d.players[0].filter(Boolean).length === 11 && d.players[1].filter(Boolean).length === 11,
      why: "gl/canvas/roster", info: d.frames + " frames" };
  });
  await check("sin error de WebGL", () => {
    const d = Pitch3D.debug();
    return { ok: d.glError === 0, why: "glError=" + d.glError };
  });
  await check("balón y jugadores finitos", () => {
    const d = Pitch3D.debug(), all = [].concat(d.players[0], d.players[1]).filter(Boolean);
    const bad = all.filter(a => !isFinite(a.x) || !isFinite(a.z) || a.x < 0 || a.x > 105 || a.z < 0 || a.z > 68);
    return { ok: isFinite(d.ball.x) && isFinite(d.ball.y) && isFinite(d.ball.z) && !bad.length, why: bad.length + " fuera de rango" };
  });
  await check("saque inicial", () => {
    const d = Pitch3D.debug();
    return { ok: d.sim.started && d.ball.mode !== "dead", why: "started/balón", info: "own=" + d.sim.own + " " + d.ball.mode };
  });
  await p.waitForTimeout(900);
  const beforeX = await p.evaluate(() => Pitch3D.debug().ball.x);
  await p.evaluate(() => Pitch3D.state({ own: 0, bx: 82, speed: 1 }));
  await p.waitForTimeout(900);
  const afterAdvance = await p.evaluate(() => { const d = Pitch3D.debug(); return { x: d.ball.x, mode: d.ball.mode }; });
  if (afterAdvance.x > beforeX + 2 || afterAdvance.mode === "flight") notes.push("posesión y avance · " + beforeX.toFixed(1) + "→" + afterAdvance.x.toFixed(1) + " " + afterAdvance.mode);
  else fail.push("posesión y avance: el balón no avanzó");
  await p.evaluate(() => Pitch3D.state({ own: 1, bx: 22, speed: 1 }));
  await p.waitForTimeout(500);
  await check("cambio de posesión", () => {
    const d = Pitch3D.debug();
    return { ok: d.sim.own === 1, why: "own=" + d.sim.own };
  });

  // Tiro a gol: debe ocupar busy y terminar solo.
  await p.evaluate(() => Pitch3D.event({ t: "goal", side: 1, who: 9, k: "shot", d: 13, ly: 1 }));
  await p.waitForTimeout(250);
  await check("acción de gol", () => {
    const d = Pitch3D.debug(), b = Pitch3D.busy();
    return { ok: d.action && d.action.type === "shot" && b > 0, why: "sin acción/busy", info: "busy=" + Math.round(b) + "ms" };
  });
  for (let i = 0; i < 40 && await p.evaluate(() => Pitch3D.busy() > 0); i++) await p.waitForTimeout(100);
  await p.waitForTimeout(800);
  await check("gol resuelto y saque", () => {
    const d = Pitch3D.debug();
    return { ok: !d.action && d.sim.own === 0, why: "acción/own", info: d.ball.mode + " own=" + d.sim.own };
  });
  await p.evaluate(() => Pitch3D.event({ t: "save", side: 0, who: 8, k: "shot", d: 18, ly: -3 }));
  await p.waitForTimeout(200);
  await check("parada", () => { const d = Pitch3D.debug(); return { ok: d.action && d.action.res === "save", why: "sin acción save" }; });
  for (let i = 0; i < 40 && await p.evaluate(() => Pitch3D.busy() > 0); i++) await p.waitForTimeout(100);
  await p.evaluate(() => Pitch3D.event({ t: "half" }));
  await p.waitForTimeout(150);
  await check("descanso y cambio de lado", () => {
    const d = Pitch3D.debug();
    return { ok: d.sim.half === 2 && d.sim.attack[0] === -1 && d.sim.attack[1] === 1, why: "half/attack", info: JSON.stringify(d.sim.attack) };
  });
  await p.evaluate(() => Pitch3D.event({ t: "red", side: 1, who: 4 }));
  await p.waitForTimeout(200);
  await check("tarjeta roja", () => {
    const d = Pitch3D.debug();
    return { ok: d.action && d.action.type === "card", why: "sin acción card" };
  });
  for (let i = 0; i < 20 && await p.evaluate(() => Pitch3D.busy() > 0); i++) await p.waitForTimeout(100);
  await check("jugador expulsado fuera del campo", () => {
    const d = Pitch3D.debug(), a = d.players[1] && d.players[1][4];
    return { ok: !!a && a.sentOff && a.gone, why: "el expulsado sigue activo" };
  });
  await p.evaluate(() => Pitch3D.freeze(false));
  for (let i = 0; i < 30 && await p.evaluate(() => Pitch3D.busy() > 0); i++) await p.waitForTimeout(100);
  const replay = await p.evaluate(() => Pitch3D.replay());
  await p.waitForTimeout(300);
  const replayState = await p.evaluate(() => { const d = Pitch3D.debug(); return { active: !!d.sim.replay, frames: d.sim.replay ? d.sim.replay.frames.length : 0 }; });
  if (replay && replayState.active && replayState.frames > 3) notes.push("replay · " + replayState.frames + " frames");
  else fail.push("replay: no arrancó");
  await p.waitForTimeout(3800);
  await check("replay termina", () => { const d = Pitch3D.debug(); return { ok: !d.sim.replay, why: "replay activo" }; });
  await p.evaluate(() => Pitch3D.reset());
  await p.waitForTimeout(300);
  await check("reset", () => { const d = Pitch3D.debug(); return { ok: d.sim.half === 1 && d.sim.started && isFinite(d.ball.x) && isFinite(d.ball.z), why: "reset incompleto", info: d.ball.mode }; });
  await p.evaluate(() => Pitch3D.event({ t: "end" }));
  await p.waitForTimeout(250);
  await p.evaluate(() => Pitch3D.state({ own: 1, bx: 20 }));
  await check("final congelado", () => {
    const d = Pitch3D.debug();
    return { ok: d.sim.ended && d.ball.mode === "dead" && Pitch3D.busy() === 0, why: "el final no congeló la simulación" };
  });
  await p.screenshot({ path: path.join(OUT, "pitch3d-smoke.png") });
  await p.evaluate(() => Pitch3D.destroy());
  await check("destroy", () => ({ ok: !document.querySelector("canvas.lpitch3d"), why: "canvas 3D sigue en el DOM" }));

  console.log(notes.join("\n"));
  console.log(errs.length || fail.length ? "ERRORES: " + errs.concat(fail).join(" | ") : "SIN ERRORES · " + notes.length + " comprobaciones");
  await browser.close();
  process.exit(errs.length || fail.length ? 1 : 0);
})();
