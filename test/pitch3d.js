/* Smoke test aislado del partido 3D.
   Uso: CHROME_PATH="C:\...\chrome.exe" node test/pitch3d.js [carpeta de capturas]
   No necesita construir todo el juego: monta pitch3d.js sobre una página mínima y
   comprueba WebGL, roster, assets GLB, posesión, tiros, descanso, tarjetas, replay y destroy. */
const path = require("path");
const fs = require("fs");
let chromium;
try { ({ chromium } = require("playwright")); } catch (e) { ({ chromium } = require("playwright-core")); }
const OUT = process.argv[2] || path.join(require("os").tmpdir(), "pitch3d-shots");
fs.mkdirSync(OUT, { recursive: true });

const HOME = ["POR", "LD", "DFC", "DFC", "LI", "MCD", "MC", "MCO", "ED", "DC", "EI"];
const AWAY = ["POR", "LD", "DFC", "DFC", "LI", "MCD", "MC", "MCO", "ED", "DC", "EI"];
const ASSET_FILES = {
  male_lod1: "assets/players/male/male_lod1.glb", male_lod2: "assets/players/male/male_lod2.glb",
  female_lod1: "assets/players/female/female_lod1.glb", female_lod2: "assets/players/female/female_lod2.glb",
  goalkeeper_lod1: "assets/players/goalkeeper/goalkeeper_lod1.glb", goalkeeper_lod2: "assets/players/goalkeeper/goalkeeper_lod2.glb",
  ball_lod1: "assets/ball/ball_lod1.glb", goal_lod1: "assets/stadium/goal_lod1.glb",
  corner_flag_lod0: "assets/stadium/corner_flag_lod0.glb", ad_board_lod0: "assets/stadium/ad_board_lod0.glb",
  bench_lod0: "assets/stadium/bench_lod0.glb", barrier_lod0: "assets/stadium/barrier_lod0.glb"
};
function roster(prefix) {
  return HOME.map((pos, i) => ({ id: prefix + i, pos, nm: prefix + " " + i, ovr: 64 + (i * 7) % 25,
    age: 19 + (i * 3) % 16, st: 1, fza: 60 + (i * 5) % 33 }));
}

(async () => {
  const src = fs.readFileSync(path.join(__dirname, "../src/pitch3d.js"), "utf8");
  const assetsSrc = fs.readFileSync(path.join(__dirname, "../src/pitch3d-assets.js"), "utf8");
  const pack = {};
  for (const [id, rel] of Object.entries(ASSET_FILES)) pack[id] = fs.readFileSync(path.join(__dirname, "..", rel)).toString("base64");
  const pitchStub = '<script>var Pitch={mount:function(){},destroy:function(){},teams:function(){},state:function(){},' +
    'event:function(){},busy:function(){return 0;},reset:function(){},freeze:function(){},' +
    'clearMsg:function(){},replay:function(){return false;},active:function(){return false;},' +
    'sound:function(){return false;},debug:function(){return null;}};</script>';
  const noGlStub = pitchStub.replace("mount:function(){}", "mount:function(){window.__2dMounted=true;}")
    .replace("event:function(){}", "event:function(e){window.__2dEvents=(window.__2dEvents||[]);window.__2dEvents.push(e&&e.t);}")
    .replace("debug:function(){return null;}", "debug:function(){return {twoD:true};}");
  const packLine = "<script>var P3D_ASSET_PACK=" + JSON.stringify(pack) + ";</script>";
  const pageHtml = '<!doctype html><html><body style="margin:0;background:#07100e">' +
    '<div id="pitch" style="width:420px;height:260px;position:relative"></div>' +
    pitchStub + packLine +
    "<script>" + assetsSrc + "</script>" +
    "<script>" + src + "</script></body></html>";
  const pageNoAssets = pageHtml.replace(packLine, "<script>var P3D_ASSET_PACK={};</script>");
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
    window.P3.mount(document.getElementById("pitch"), { cols: ["#f5b326", "#5db8ff"], fem: true });
    window.P3.teams(home, away, [{}, {}]);
    window.P3.state({ own: 0, bx: 50, speed: 1, fem: true, tac: [{ ment: 2, line: 2, width: 1, pass: 1, tempo: 1 }, null] });
  }, { home: roster("h"), away: roster("a") });
  await p.waitForTimeout(700);

  const check = async (label, fn) => {
    const r = await p.evaluate(fn);
    if (!r || !r.ok) fail.push(label + (r && r.why ? ": " + r.why : "") + (r && r.info ? " · " + r.info : ""));
    else notes.push(label + (r.info ? " · " + r.info : ""));
    return r;
  };

  await check("entrada desde el túnel", () => {
    const d = Pitch3D.debug(), c = Pitch3D.cinema();
    return { ok: d.gl && !!c && c.type === "intro" && c.stage === "walkout" && d.sim.ballHidden && Pitch3D.busy() > 0,
      why: "sin secuencia inicial/balón visible", info: c ? c.stage + " · busy=" + Math.round(Pitch3D.busy()) + "ms" : "sin cine" };
  });
  await check("salida en fila y capitán al frente", () => {
    const d = Pitch3D.debug(), info = [];
    let ok = true;
    for (let s = 0; s < 2; s++) {
      const line = (d.players[s] || []).filter(Boolean), cap = line[9];
      const lane = 105 / 2 + (s ? 1.05 : -1.05);
      const xs = line.map(a => Math.abs(a.x - lane));
      const zs = line.map(a => a.z), minZ = Math.min(...zs), maxZ = Math.max(...zs);
      const frontOk = !!cap && cap.z >= maxZ - 0.35;
      const laneOk = Math.max(...xs) < 0.22;
      const depthOk = maxZ - minZ > 4;
      if (!frontOk || !laneOk || !depthOk) ok = false;
      info.push("equipo " + s + " x±" + Math.max(...xs).toFixed(2) + " z " + minZ.toFixed(1) + "–" + maxZ.toFixed(1));
    }
    return { ok, why: "la cola no sale en una fila con el capitán delante", info: info.join(" · ") };
  });
  await p.evaluate(() => Pitch3D.skipCinema());
  for (let i = 0; i < 30 && await p.evaluate(() => Pitch3D.busy() > 0); i++) await p.waitForTimeout(100);
  await p.waitForTimeout(300);
  await check("WebGL montado", () => {
    const d = Pitch3D.debug();
    return { ok: d.gl && document.querySelectorAll("canvas.lpitch3d").length === 1 && d.players[0].filter(Boolean).length === 11 && d.players[1].filter(Boolean).length === 11,
      why: "gl/canvas/roster", info: d.frames + " frames" };
  });
  await check("assets GLB cargados y skinned", () => {
    const d = Pitch3D.debug();
    return { ok: d.assets.state === "ready" && d.assets.lods === 6 && d.assets.statics === 6 &&
      d.assets.errors === 0 && d.assets.framePlayers > 0 && d.assets.frameTris > 0 && d.assets.frameBall === 1,
      why: "state/lods/statics/errors/frame/balón", info: d.assets.lods + " LODs, " + d.assets.statics +
        " static, " + d.assets.framePlayers + " jugadores, " + d.assets.frameTris + " tri, balón GLB" };
  });
  await check("árbitro y asistentes", () => {
    const d = Pitch3D.debug(), o = d.sim.officials;
    return { ok: !!o && o.length === 3 && o.every(a => isFinite(a.x) && isFinite(a.z)) &&
      o[1].z < 0 && o[2].z > 68 && d.assets.framePlayers >= 25,
      why: "oficiales/fuera de banda", info: o ? o.length + " oficiales, " + d.assets.framePlayers + " actores" : "sin oficiales" };
  });
  await check("malla skinned sin NaN ni desgarros", () => {
    const m = Pitch3D.debug().mesh;
    return { ok: m.verts > 0 && m.nan === 0 && m.bad === 0, why: "vértices/NaN/aristas",
      info: m.verts + " vértices, arista máx. " + m.maxEdge + " m" };
  });
  await check("variantes femeninas y portero", () => {
    const d = Pitch3D.debug(), all = [].concat(d.players[0], d.players[1]).filter(Boolean);
    const field = all.filter(a => !a.gk), gks = all.filter(a => a.gk);
    return { ok: field.length > 0 && gks.length > 0 && field.every(a => a.variant === "female") && gks.every(a => a.variant === "goalkeeper"),
      why: "variantes incorrectas", info: field.length + " campo + " + gks.length + " porteros" };
  });
  await p.evaluate(() => Pitch3D.state({ fem: false }));
  await p.waitForTimeout(120);
  await check("cambio a variante masculina", () => {
    const d = Pitch3D.debug(), all = [].concat(d.players[0], d.players[1]).filter(Boolean);
    return { ok: all.filter(a => !a.gk).every(a => a.variant === "male"), why: "no cambió a male" };
  });
  await p.evaluate(() => Pitch3D.state({ fem: true }));
  await p.waitForTimeout(120);
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

  /* Pase visual: debe salir del portador, volar con enrosque y terminar en
     un receptor del mismo bando sin tocar el marcador. */
  for (let i = 0; i < 30; i++) {
    const mode = await p.evaluate(() => Pitch3D.debug().ball.mode);
    if (mode === "held") break;
    await p.waitForTimeout(100);
  }
  const passBefore = await p.evaluate(() => { const d = Pitch3D.debug(); return { idx: d.ball.idx, side: d.ball.side }; });
  await p.evaluate((idx) => { window.__passIdx = idx; }, passBefore.idx);
  await p.evaluate(() => Pitch3D.event({ t: "pass", side: 0, who: 8 }));
  await p.waitForTimeout(120);
  await check("pase visual en juego abierto", () => {
    const d = Pitch3D.debug(), a = d.players[0][window.__passIdx];
    return { ok: d.ball.mode === "flight" && !!d.ball.next && d.ball.next.type === "held" && d.ball.next.side === 0 &&
      !!d.ball.fl && isFinite(d.ball.fl.curve) && Math.abs(d.ball.fl.curve) < 1.25 &&
      !!a && !!a.visualAnim && a.visualAnim.type === "pass",
      why: "sin vuelo/receptor/animación", info: d.ball.mode + " → " + (d.ball.next ? "held " + d.ball.next.idx : "sin next") };
  });
  await p.waitForTimeout(1900);
  await check("recepción de pase", () => {
    const d = Pitch3D.debug(), lp = d.sim.lastPass;
    return { ok: d.ball.mode === "held" && d.ball.side === 0 && isFinite(d.ball.x) && isFinite(d.ball.z) &&
      !!lp && lp.atEnd != null && lp.atEnd <= 1.75,
      why: "el pase no terminó o el receptor no estaba en el punto", info: d.ball.mode + " · jugador " + d.ball.idx +
        (lp ? " · llegada " + lp.atEnd + " m, curva " + lp.curve : "") };
  });
  await p.evaluate(() => Pitch3D.event({ t: "tackle", side: 0, who: 7 }));
  await p.waitForTimeout(90);
  await check("tackle visual sin gesto de portero", () => {
    const d = Pitch3D.debug(), a = d.players[0][7];
    return { ok: !!a && !!a.visualAnim && a.visualAnim.type === "tackle" && a.assetClipName !== "dive",
      why: "sin animación de robo o usando dive de portero", info: a ? "clip " + a.assetClipName : "sin jugador" };
  });

  await p.waitForTimeout(150);
  await check("locomoción con inclinación estable", () => {
    const d = Pitch3D.debug(), all = [].concat(d.players[0], d.players[1]).filter(Boolean);
    const bad = all.filter(a => !isFinite(a.lean) || !isFinite(a.bank) ||
      Math.abs(a.lean) > 0.08 || Math.abs(a.bank) > 0.06);
    const leaning = all.filter(a => Math.abs(a.lean) > 0.001 || Math.abs(a.bank) > 0.001).length;
    return { ok: !bad.length && leaning > 0, why: bad.length + " poses inválidas", info: leaning + " inclinados" };
  });
  await p.evaluate(() => { const d = Pitch3D.debug(); window.__beforePoss = { x: d.ball.x, z: d.ball.z }; });
  await p.evaluate(() => Pitch3D.state({ own: 1, bx: 22, speed: 1 }));
  await p.waitForTimeout(500);
  await check("cambio de posesión sin teleport", () => {
    const d = Pitch3D.debug(), bp = window.__beforePoss, move = Math.sqrt((d.ball.x - bp.x) ** 2 + (d.ball.z - bp.z) ** 2);
    return { ok: d.sim.own === 1 && d.ball.mode !== "flight" && move < 8, why: "own=" + d.sim.own + " mode=" + d.ball.mode + " move=" + move.toFixed(1) };
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
  let keeperDive = null;
  for (let i = 0; i < 24; i++) {
    keeperDive = await p.evaluate(() => {
      const d = Pitch3D.debug(), g = d.action && d.action.gk;
      return g && g.anim && g.anim.type === "dive" ? { anim: g.anim.type, clip: g.assetClipName } : null;
    });
    if (keeperDive && keeperDive.clip === "dive") break;
    await p.waitForTimeout(80);
  }
  if (keeperDive && keeperDive.anim === "dive" && keeperDive.clip === "dive")
    notes.push("estirada exclusiva del portero · dive");
  else fail.push("parada de portero: no usó dive " + JSON.stringify(keeperDive));
  for (let i = 0; i < 40 && await p.evaluate(() => Pitch3D.busy() > 0); i++) await p.waitForTimeout(100);

  /* Saque de puerta: preparación, scan, protección, carrera, impacto y
     recuperación. El balón no puede salir antes del impacto. */
  await p.evaluate(() => {
    Pitch3D.state({ speed: 3 });
    Pitch3D.event({ t: "miss", side: 0, who: 10, k: "shot", d: 16, ly: 2 });
  });
  for (let i = 0; i < 80; i++) {
    const g = await p.evaluate(() => Pitch3D.debug().goalkick);
    if (g && g.active) break;
    await p.waitForTimeout(50);
  }
  await check("saque de puerta en preparación", () => {
    const d = Pitch3D.debug(), g = d.goalkick;
    return { ok: !!g && g.active && !g.launched && d.ball.mode === "dead" &&
      g.phases.indexOf("prepare") >= 0 && g.pressure,
      why: "sin secuencia/balón muerto/presión", info: g ? g.phase + " · " + g.phases.join(">") : "sin acción" };
  });
  await p.evaluate(() => {
    const d = Pitch3D.debug();
    window.__gkBall = { x: d.ball.x, z: d.ball.z };
  });
  await p.waitForTimeout(260);
  await check("balón inmóvil antes del impacto", () => {
    const d = Pitch3D.debug(), g = d.goalkick, b = d.ball, spot = window.__gkBall;
    return { ok: !!g && !g.launched && b.mode === "dead" &&
      Math.abs(b.x - spot.x) < 0.01 && Math.abs(b.z - spot.z) < 0.01,
      why: "el balón se movió antes del golpeo", info: b.mode };
  });
  let gkLaunch = null;
  for (let i = 0; i < 80; i++) {
    const g = await p.evaluate(() => Pitch3D.debug().goalkick);
    if (g && g.launched) {
      gkLaunch = g;
      await p.evaluate((x) => { window.__gkLaunch = x; }, g);
      break;
    }
    await p.waitForTimeout(50);
  }
  await check("impacto sincroniza el lanzamiento", () => {
    const d = Pitch3D.debug(), g = window.__gkLaunch;
    return { ok: !!g && g.launchPhase === "impact" &&
      Math.abs(g.launchT - g.impactAt) <= 0.08 && d.ball.mode !== "dead",
      why: "fase/marca/balón", info: g ? g.launchPhase + " t=" + g.launchT + "/" + g.impactAt : "sin impacto" };
  });
  for (let i = 0; i < 80 && await p.evaluate(() => Pitch3D.busy() > 0); i++) await p.waitForTimeout(100);
  await check("secuencia de saque completa", () => {
    const g = Pitch3D.debug().goalkick;
    const order = ["prepare", "scan", "shield", "windup", "plant", "impact", "follow", "recover"];
    const okOrder = !!g && order.every((n, i) => g.phases[i] === n);
    return { ok: okOrder && g.launched && g.receiver >= 0 && g.minPressureDist >= 1.6, why: "fases/receptor/espaciado", info: g ? g.phases.join(">") + " · presión " + g.minPressureDist + " m" : "sin registro" };
  });
  await p.evaluate(() => Pitch3D.state({ speed: 1 }));

  await p.evaluate(() => Pitch3D.event({ t: "half" }));
  await p.waitForTimeout(150);
  await check("descanso en secuencia", () => {
    const c = Pitch3D.cinema(), d = Pitch3D.debug();
    return { ok: !!c && c.type === "half" && d.sim.half === 2 && d.sim.ballHidden && Pitch3D.busy() > 0,
      why: "sin salida al túnel", info: c ? c.stage : "sin cine" };
  });
  await p.evaluate(() => Pitch3D.skipCinema());
  for (let i = 0; i < 30 && await p.evaluate(() => Pitch3D.busy() > 0); i++) await p.waitForTimeout(100);
  await check("descanso y cambio de lado", () => {
    const d = Pitch3D.debug(), o = d.sim.officials;
    return { ok: d.sim.half === 2 && d.sim.attack[0] === -1 && d.sim.attack[1] === 1 &&
      !!o && o[1].z > 60 && o[2].z < 8, why: "half/attack/asistentes", info: JSON.stringify(d.sim.attack) + " · bandas " + (o ? o[1].z.toFixed(1) + "/" + o[2].z.toFixed(1) : "?") };
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
  await p.evaluate(() => Pitch3D.state({ score: [2, 1], min: 67 }));
  await p.waitForTimeout(80);
  await check("marcador de retransmisión", () => {
    const e = document.querySelector(".lpitch3d-score");
    return { ok: !!e && e.style.display !== "none" && /67/.test(e.textContent) && /2/.test(e.textContent) &&
      /1/.test(e.textContent), why: "marcador oculto o incompleto", info: e ? e.textContent : "sin marcador" };
  });
  await p.evaluate(() => Pitch3D.state({ wx: "rain" }));
  await p.waitForTimeout(160);
  await check("clima conectado al 3D", () => {
    const d = Pitch3D.debug();
    return { ok: d.sim.wx === "rain" && d.glError === 0 && d.mesh.nan === 0, why: "wx/gl/malla", info: d.sim.wx + " · " + d.mesh.verts + " vértices" };
  });
  await p.evaluate(() => Pitch3D.state({ wx: "sun" }));
  await p.evaluate(() => Pitch3D.event({ t: "end" }));
  await p.waitForTimeout(250);
  await check("despedida en secuencia", () => {
    const d = Pitch3D.debug(), c = Pitch3D.cinema();
    return { ok: d.sim.ended && !!c && c.type === "end" && d.sim.ballHidden && Pitch3D.busy() > 0,
      why: "sin salida final", info: (c ? c.stage : "sin cine") + " · ended=" + d.sim.ended +
        " ball=" + d.ball.mode + " action=" + (d.action ? d.action.type : "-") + " queue=" + d.sim.queue.length +
        " restart=" + (d.sim.restart ? d.sim.restart.type : "-") };
  });
  await p.evaluate(() => Pitch3D.skipCinema());
  await p.waitForTimeout(150);
  await p.evaluate(() => Pitch3D.state({ own: 1, bx: 20 }));
  await check("final congelado", () => {
    const d = Pitch3D.debug();
    return { ok: d.sim.ended && d.ball.mode === "dead" && Pitch3D.busy() === 0, why: "el final no congeló la simulación" };
  });
  await p.screenshot({ path: path.join(OUT, "pitch3d-smoke.png") });
  await p.evaluate(() => Pitch3D.destroy());
  await check("destroy", () => ({ ok: !document.querySelector("canvas.lpitch3d"), why: "canvas 3D sigue en el DOM" }));

  /* Cara o cruz: llamada, moneda, elección de campo y saque. Se fuerza el
     resultado en la página de prueba para poder recorrer la elección. */
  const pcoin = await ctx.newPage();
  pcoin.on("pageerror", e => errs.push("sorteo pageerror: " + e.message));
  pcoin.on("console", m => { if (m.type() === "error") errs.push("sorteo console: " + m.text()); });
  await pcoin.setContent(pageHtml);
  await pcoin.evaluate(({ home, away }) => {
    Pitch3D.mount(document.getElementById("pitch"), { cols: ["#f5b326", "#5db8ff"], fem: true, cinematics: true });
    Pitch3D.teams(home, away, [{}, {}]);
    Pitch3D.state({ own: 0, bx: 50, speed: 3, fem: true });
  }, { home: roster("h"), away: roster("a") });
  let coinStage = null;
  for (let i = 0; i < 40; i++) {
    coinStage = await pcoin.evaluate(() => Pitch3D.cinema() && Pitch3D.cinema().stage);
    if (coinStage === "coinCall") break;
    await pcoin.waitForTimeout(100);
  }
  const coinUi = await pcoin.evaluate(() => ({
    stage: Pitch3D.cinema() && Pitch3D.cinema().stage,
    call: !!document.querySelector("[data-p3d-coin='cara']"),
    overlay: (() => { const e = document.querySelector(".lpitch3d-coin"); return !!e && e.style.display !== "none"; })()
  }));
  if (coinUi.stage === "coinCall" && coinUi.call && coinUi.overlay) notes.push("cara o cruz · llamada disponible");
  else fail.push("cara o cruz: no apareció la llamada " + JSON.stringify(coinUi));
  const refState = await pcoin.evaluate(() => {
    const d = Pitch3D.debug(), r = d.sim.officials && d.sim.officials[0];
    return r ? { anim: r.anim && r.anim.type, clip: r.assetClipName } : null;
  });
  if (refState && refState.anim === null && refState.clip !== "celebrate")
    notes.push("árbitro sin gesto congelado · clip " + refState.clip);
  else fail.push("árbitro sin posesión de celebración: gesto de saludo congelado " + JSON.stringify(refState));
  await pcoin.evaluate(() => { Math.random = () => 0.1; });
  await pcoin.click("[data-p3d-coin='cara']");
  let choiceStage = null;
  for (let i = 0; i < 30; i++) {
    choiceStage = await pcoin.evaluate(() => Pitch3D.cinema() && Pitch3D.cinema().stage);
    if (choiceStage === "choose") break;
    await pcoin.waitForTimeout(100);
  }
  const choiceUi = await pcoin.evaluate(() => ({
    stage: Pitch3D.cinema() && Pitch3D.cinema().stage,
    coin: Pitch3D.cinema() && Pitch3D.cinema().coin,
    campo: !!document.querySelector("[data-p3d-choice='campo']"),
    pelota: !!document.querySelector("[data-p3d-choice='pelota']")
  }));
  if (choiceUi.stage === "choose" && choiceUi.coin && choiceUi.coin.winner === 0 && choiceUi.campo && choiceUi.pelota)
    notes.push("cara o cruz · gana el jugador y elige campo/pelota");
  else fail.push("cara o cruz: no llegó la elección " + JSON.stringify(choiceUi));
  await pcoin.click("[data-p3d-choice='campo']");
  let coinDone = null;
  for (let i = 0; i < 40; i++) {
    coinDone = await pcoin.evaluate(() => {
      const d = Pitch3D.debug(), c = Pitch3D.cinema();
      return { cinema: !!c, attack: d.sim.attack.slice(), hidden: d.sim.ballHidden, busy: Pitch3D.busy(), overlay: (() => { const e = document.querySelector(".lpitch3d-coin"); return !!e && e.style.display !== "none"; })() };
    });
    if (!coinDone.cinema && coinDone.busy === 0) break;
    await pcoin.waitForTimeout(100);
  }
  if (!coinDone.cinema && !coinDone.hidden && !coinDone.overlay && coinDone.attack[0] === -1 && coinDone.attack[1] === 1)
    notes.push("cara o cruz · campo elegido y saque listo");
  else fail.push("cara o cruz: no terminó la elección de campo " + JSON.stringify(coinDone));
  await pcoin.screenshot({ path: path.join(OUT, "pitch3d-coin.png") });
  await pcoin.close();

  /* Sin GLB: el render debe seguir funcionando con jugadores y balón procedurales. */
  const pfb = await ctx.newPage();
  pfb.on("pageerror", e => errs.push("fallback pageerror: " + e.message));
  pfb.on("console", m => { if (m.type() === "error") errs.push("fallback console: " + m.text()); });
  await pfb.setContent(pageNoAssets);
  await pfb.evaluate(({ home, away }) => {
    Pitch3D.mount(document.getElementById("pitch"), { cols: ["#f5b326", "#5db8ff"], fem: true, cinematics: false });
    Pitch3D.teams(home, away, [{}, {}]);
    Pitch3D.state({ own: 0, bx: 50, speed: 1, fem: true });
  }, { home: roster("h"), away: roster("a") });
  await pfb.waitForTimeout(600);
  const fb = await pfb.evaluate(() => {
    const d = Pitch3D.debug(), all = [].concat(d.players[0], d.players[1]).filter(Boolean);
    return { state: d.assets.state, framePlayers: d.assets.framePlayers, frameBall: d.assets.frameBall,
      frameTris: d.assets.frameTris, players: all.length, mesh: d.mesh, gl: d.gl };
  });
  if (fb.state === "failed" && fb.players === 22 && fb.framePlayers === 0 && fb.frameBall === 0 &&
    fb.frameTris === 0 && fb.gl && fb.mesh.verts > 0 && fb.mesh.nan === 0 && fb.mesh.bad === 0) {
    notes.push("fallback sin GLB · 22 procedurales, " + fb.mesh.verts + " vértices");
  } else fail.push("fallback sin GLB: " + JSON.stringify(fb));
  await pfb.evaluate(() => Pitch3D.event({ t: "tackle", side: 0, who: 7 }));
  await pfb.waitForTimeout(140);
  const fbt = await pfb.evaluate(() => {
    const d = Pitch3D.debug(), a = d.players[0][7];
    return { anim: a && a.visualAnim && a.visualAnim.type, mesh: d.mesh };
  });
  if (fbt.anim === "tackle" && fbt.mesh.nan === 0 && fbt.mesh.verts > 0)
    notes.push("barrida procedural sin GLB · " + fbt.mesh.verts + " vértices");
  else fail.push("barrida procedural sin GLB: " + JSON.stringify(fbt));
  await pfb.screenshot({ path: path.join(OUT, "pitch3d-fallback.png") });
  await pfb.close();

  /* Sin WebGL: el adaptador debe montar el campo 2D y no dejar un canvas 3D roto. */
  const png = await ctx.newPage();
  png.on("pageerror", e => errs.push("sin WebGL pageerror: " + e.message));
  png.on("console", m => { if (m.type() === "error") errs.push("sin WebGL console: " + m.text()); });
  await png.setContent(pageNoAssets.replace(pitchStub, noGlStub));
  await png.evaluate(({ home, away }) => {
    try { localStorage.setItem("camino.pitch3d", "1"); } catch (ignore) {}
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type) {
      if (type === "webgl" || type === "experimental-webgl") return null;
      return getContext.apply(this, arguments);
    };
    Pitch.mount(document.getElementById("pitch"), { cols: ["#f5b326", "#5db8ff"], fem: true });
    Pitch.teams(home, away, [{}, {}]);
    Pitch.state({ own: 0, bx: 50, speed: 1 });
  }, { home: roster("h"), away: roster("a") });
  await png.waitForTimeout(300);
  await png.evaluate(() => {
    Pitch.event({ t: "pass", side: 0, who: 1 });
    Pitch.event({ t: "tackle", side: 0, who: 2 });
    Pitch.event({ t: "goal", side: 0 });
  });
  const ng = await png.evaluate(() => ({
    twoD: !!window.__2dMounted,
    canvas3d: !!document.querySelector("canvas.lpitch3d"),
    toggle: !!document.querySelector(".p3dtoggle"),
    events: window.__2dEvents || [],
    debug: Pitch.debug()
  }));
  if (ng.twoD && !ng.canvas3d && ng.toggle && ng.debug && ng.debug.twoD &&
    ng.events.indexOf("pass") < 0 && ng.events.indexOf("tackle") < 0 && ng.events.indexOf("goal") >= 0) {
    notes.push("fallback sin WebGL · campo 2D sin eventos fantasma");
  } else fail.push("fallback sin WebGL: " + JSON.stringify(ng));
  await png.close();

  console.log(notes.join("\n"));
  console.log(errs.length || fail.length ? "ERRORES: " + errs.concat(fail).join(" | ") : "SIN ERRORES · " + notes.length + " comprobaciones");
  await browser.close();
  process.exit(errs.length || fail.length ? 1 : 0);
})();
