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
  const uiSrc = fs.readFileSync(path.join(__dirname, "../src/ui.js"), "utf8");
  const assetsSrc = fs.readFileSync(path.join(__dirname, "../src/pitch3d-assets.js"), "utf8");
  const bolasSrc = fs.readFileSync(path.join(__dirname, "../src/bolas.js"), "utf8");
  const pitchSrc = fs.readFileSync(path.join(__dirname, "../src/pitch.js"), "utf8");
  const pack = {};
  for (const [id, rel] of Object.entries(ASSET_FILES)) pack[id] = fs.readFileSync(path.join(__dirname, "..", rel)).toString("base64");
  const pitchStub = '<script>var Pitch={mount:function(){},destroy:function(){},teams:function(){},state:function(){},' +
    'event:function(){},busy:function(){return 0;},reset:function(){},freeze:function(){},' +
    'clearMsg:function(){},replay:function(){return false;},active:function(){return false;},' +
    'sound:function(){return false;},debug:function(){return null;}};</script>';
  const noGlStub = pitchStub.replace("mount:function(){}", "mount:function(el,o){window.__2dMounted=true;window.__2dMounts=(window.__2dMounts||[]);window.__2dMounts.push(o||{});}")
    .replace("event:function(){}", "event:function(e){window.__2dEvents=(window.__2dEvents||[]);window.__2dEvents.push(e&&e.t);}")
    .replace("debug:function(){return null;}", "debug:function(){return {twoD:true};},cinema:function(){return window.__introActive===false?null:{type:'intro',stage:'walkout'};}");
  const packLine = "<script>var P3D_ASSET_PACK=" + JSON.stringify(pack) + ";</script>";
  const pageHtml = '<!doctype html><html><body style="margin:0;background:#07100e">' +
    '<div id="pitch" style="width:420px;height:260px;position:relative"></div>' +
    pitchStub + packLine +
    "<script>" + assetsSrc + "</script>" +
    "<script>" + src + "</script></body></html>";
  const pageNoAssets = pageHtml.replace(packLine, "<script>var P3D_ASSET_PACK={};</script>");
  /* Página del sorteo con el motor de audio real para comprobar que el 3D
     alimenta el mismo PitchAudio que usa el campo 2D. */
  const pageAudio = pageHtml.replace(pitchStub, pitchStub + "<script>" + bolasSrc + "</script><script>" + pitchSrc + "</script>");
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
  for (let i = 0; i < 100 && await p.evaluate(() => Pitch3D.busy() > 0); i++) await p.waitForTimeout(100);
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
  /* la entrada la hace un jugador junto al balón (nunca uno lejano al azar) */
  const tw = await p.evaluate(() => { const d = Pitch3D.debug(); let best = -1, bd = 1e9; window.__tw = 0;
    d.players[0].forEach((a, i) => { if (!a || a.gk) return; const q = Math.hypot(a.x - d.ball.x, a.z - d.ball.z); if (q < bd) { bd = q; best = i; } }); window.__tw = best; return best; });
  await p.evaluate((w) => Pitch3D.event({ t: "tackle", side: 0, who: w }), tw);
  await p.waitForTimeout(90);
  await check("tackle visual sin gesto de portero", () => {
    const d = Pitch3D.debug(), a = d.players[0][window.__tw];
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
  for (let i = 0; i < 120 && await p.evaluate(() => Pitch3D.busy() > 0); i++) await p.waitForTimeout(100);
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
  for (let i = 0; i < 100 && await p.evaluate(() => Pitch3D.busy() > 0); i++) await p.waitForTimeout(100);

  /* Saque de puerta: preparación, scan, carrera, impacto y recuperación.
     Ningún rival puede acercarse al portero y el balón no sale antes. */
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
      g.phases.indexOf("prepare") >= 0 && !g.pressure && g.minPressureDist > 6,
      why: "sin secuencia/balón muerto/sin presión", info: g ? g.phase + " · " + g.phases.join(">") + " · rival a " + g.minPressureDist + " m" : "sin acción" };
  });
  await check("rivales fuera del área y lejos del portero", () => {
    const d = Pitch3D.debug(), g = d.goalkick;
    if (!g || !g.active) return {ok: false, why: "sin saque de puerta"};
    const side = g.side, dir = d.sim.attack[side], own = dir > 0 ? 0 : 105;
    let inside = 0, minD = 99;
    const gk = (d.players[side] || []).filter(a => a && a.gk)[0];
    (d.players[1 - side] || []).forEach(a => {
      if (!a || a.gk || a.gone || a.sentOff) return;
      const depth = (a.x - own) * dir;
      if (depth >= -0.5 && depth < 16.5 && Math.abs(a.z - 34) < 20.16) inside++;
      if (gk) minD = Math.min(minD, Math.hypot(a.x - gk.x, a.z - gk.z));
    });
    return {ok: inside === 0 && minD >= 13.0 && g.opponentsOutside === true && g.playersInsideArea === 0,
      why: "algún rival invade el área o se acerca al portero",
      info: "dentro=" + inside + " · rival más cerca " + minD.toFixed(2) + " m" + (gk ? "" : " (sin portero)")};
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
    const order = ["prepare", "scan", "windup", "plant", "impact", "follow", "recover"];
    const okOrder = !!g && order.every((n, i) => g.phases[i] === n);
    return { ok: okOrder && g.launched && g.receiver >= 0 && !g.pressure && g.minPressureDist >= 12.5 &&
      g.opponentsOutside === true && g.playersInsideArea === 0,
      why: "fases/receptor/sin presión", info: g ? g.phases.join(">") + " · rival más cerca " + g.minPressureDist + " m" : "sin registro" };
  });
  await p.evaluate(() => Pitch3D.state({ speed: 1 }));

  /* Córner: nadie rival dentro de 9,15 m, rematador en el área y centro al
     punto de remate (no pase corto al compañero más cercano). */
  await p.evaluate(() => Pitch3D.event({ t: "corner", side: 0 }));
  await p.waitForTimeout(120);
  await check("córner colocado y sin rivales cerca", () => {
    const d = Pitch3D.debug(), r = d.sim.restart, sp = d.setPiece, b = d.ball;
    let near = 99;
    (d.players[1] || []).forEach(a => { if (a && !a.gk) near = Math.min(near, Math.hypot(a.x - b.x, a.z - b.z)); });
    return { ok: !!r && r.type === "corner" && !!sp && sp.target >= 0 && near >= 9.0,
      why: "sin formación de córner/espaciado", info: r ? r.type + " · objetivo " + sp.target + " · rival a " + near.toFixed(2) + " m" : "sin restart" };
  });
  /* los jugadores trotan a sus puestos antes del saque */
  for (let i = 0; i < 60 && !(await p.evaluate(() => { const sp = Pitch3D.debug().setPiece; return !!sp && sp.launched; })); i++) await p.waitForTimeout(100);
  await p.waitForTimeout(300);
  await check("córner lanzado al área", () => {
    const sp = Pitch3D.debug().setPiece;
    return { ok: !!sp && sp.launched && sp.receiver >= 0 && sp.flightDur > 0,
      why: "el córner no se lanzó al área", info: sp ? "receptor " + sp.receiver + " · " + sp.flightDur + " s" : "sin registro" };
  });

  /* Falta: barrera reglamentaria y saque dirigido, no pase al más cercano. */
  await p.evaluate(() => Pitch3D.event({ t: "free", side: 1, x: 25, z: 34 }));
  await p.waitForTimeout(120);
  await check("falta con barrera a 9,15 m", () => {
    const d = Pitch3D.debug(), r = d.sim.restart, sp = d.setPiece;
    return { ok: !!r && r.type === "free" && !!sp && sp.target >= 0 &&
      Math.abs(sp.wallDist - 9.15) <= 0.25,
      why: "sin barrera/distancia de falta", info: sp ? "barrera " + sp.wallDist + " m · objetivo " + sp.target : "sin restart" };
  });
  for (let i = 0; i < 60 && !(await p.evaluate(() => { const sp = Pitch3D.debug().setPiece; return !!sp && sp.launched; })); i++) await p.waitForTimeout(100);
  await p.waitForTimeout(200);
  await check("falta lanzada", () => {
    const sp = Pitch3D.debug().setPiece;
    return { ok: !!sp && sp.launched && sp.receiver >= 0, why: "la falta no se lanzó", info: sp ? sp.type : "sin registro" };
  });

  /* Penalti: solo sacador y portero dentro del área; después, tiro real. */
  await p.evaluate(() => Pitch3D.event({ t: "penalty", side: 0, res: "save", who: 9 }));
  await p.waitForTimeout(120);
  await check("penalti colocado", () => {
    const d = Pitch3D.debug(), r = d.sim.restart, taker = r && r.idx >= 0 ? d.players[0][r.idx] : null;
    let inside = 0;
    (d.players[0] || []).concat(d.players[1] || []).forEach(a => {
      if (!a || a === taker || a.gk) return;
      if (a.x > 88.5) inside++;
    });
    return { ok: !!r && r.type === "penalty" && r.res === "save" && !!taker && inside === 0,
      why: "jugadores dentro del área en el penalti", info: r ? "punto " + r.spotX + " · dentro " + inside : "sin restart" };
  });
  let penAction = null;
  for (let i = 0; i < 120; i++) {
    penAction = await p.evaluate(() => {
      const a = Pitch3D.debug().action;
      return a && a.type === "shot" && a.kind === "penalty" ? { kind: a.kind, shooter: a.shooter ? a.shooter.slot : -1 } : null;
    });
    if (penAction) break;
    await p.waitForTimeout(60);
  }
  if (penAction) notes.push("penalti ejecutado · tiro de jugador " + penAction.shooter);
  else fail.push("penalti: no se ejecutó el tiro");
  for (let i = 0; i < 100 && await p.evaluate(() => Pitch3D.busy() > 0); i++) await p.waitForTimeout(100);

  await p.evaluate(() => Pitch3D.event({ t: "half" }));
  await p.waitForTimeout(150);
  await check("descanso en secuencia", () => {
    const c = Pitch3D.cinema(), d = Pitch3D.debug();
    return { ok: !!c && c.type === "half" && d.sim.half === 2 && d.sim.ballHidden && Pitch3D.busy() > 0,
      why: "sin salida al túnel", info: c ? c.stage : "sin cine" };
  });
  await p.evaluate(() => Pitch3D.skipCinema());
  for (let i = 0; i < 100 && await p.evaluate(() => Pitch3D.busy() > 0); i++) await p.waitForTimeout(100);
  await check("descanso y cambio de lado", () => {
    const d = Pitch3D.debug(), o = d.sim.officials;
    return { ok: d.sim.half === 2 && d.sim.attack[0] === -1 && d.sim.attack[1] === 1 &&
      !!o && o[1].z > 60 && o[2].z < 8, why: "half/attack/asistentes", info: JSON.stringify(d.sim.attack) + " · bandas " + (o ? o[1].z.toFixed(1) + "/" + o[2].z.toFixed(1) : "?") };
  });
  await p.evaluate(() => Pitch3D.event({ t: "red", side: 1, who: 4 }));
  /* con renderizado por software los fotogramas son largos: se espera al gesto */
  /* antes de la tarjeta se ve la falta (persecución, entrada y pitido) */
  for (let i = 0; i < 80; i++) {
    await p.waitForTimeout(100);
    if (await p.evaluate(() => { const d = Pitch3D.debug(), r = d.sim.officials && d.sim.officials[0]; return !!(r && r.anim && r.anim.type === "card"); })) break;
  }
  await check("tarjeta roja y gesto del árbitro", () => {
    const d = Pitch3D.debug(), r = d.sim.officials && d.sim.officials[0];
    const anim = r && r.anim;
    return { ok: !!d.action && d.action.type === "card" && d.action.res === "red" &&
      !!anim && anim.type === "card" && anim.res === "red" && d.card && d.card.visible,
      why: "sin tarjeta visible del árbitro", info: anim ? anim.type + "/" + anim.res : "sin anim" };
  });
  for (let i = 0; i < 100 && await p.evaluate(() => Pitch3D.busy() > 0); i++) await p.waitForTimeout(100);
  await check("jugador expulsado fuera del campo", () => {
    const d = Pitch3D.debug(), a = d.players[1] && d.players[1][4];
    return { ok: !!a && a.sentOff && a.gone, why: "el expulsado sigue activo" };
  });
  /* la falta se saca desde donde se cometió (puede ser cerca del área) */
  await check("falta después de la tarjeta", () => {
    const sp = Pitch3D.debug().setPiece;
    return { ok: !!sp && sp.type === "free",
      why: "la tarjeta no dejó una reanudación normal", info: sp ? sp.type + "/" + sp.cross : "sin set piece" };
  });
  await p.evaluate(() => Pitch3D.freeze(false));
  for (let i = 0; i < 100 && await p.evaluate(() => Pitch3D.busy() > 0); i++) await p.waitForTimeout(100);
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
  await p.evaluate(() => {
    Pitch3D.event({ t: "goal", side: 0, who: 9, k: "shot", d: 12, ly: 2 });
    Pitch3D.state({ score: [3, 1], min: 68 });
  });
  await p.waitForTimeout(120);
  await check("gol pendiente no adelanta el HUD", () => {
    const d = Pitch3D.debug(), e = document.querySelector(".lpitch3d-score");
    const vals = e ? Array.from(e.querySelectorAll("b")).map(b => b.textContent).slice(0, 2) : [];
    return { ok: d.sim.scorePending > 0 && vals[0] === "2" && vals[1] === "1",
      why: "el marcador 3D se adelantó al vuelo", info: "HUD " + vals.join("-") + " · pendientes " + d.sim.scorePending };
  });
  for (let i = 0; i < 100 && await p.evaluate(() => Pitch3D.busy() > 0); i++) await p.waitForTimeout(80);
  await p.waitForTimeout(120);
  await check("gol confirmado al cruzar la línea", () => {
    const d = Pitch3D.debug(), e = document.querySelector(".lpitch3d-score");
    const vals = e ? Array.from(e.querySelectorAll("b")).map(b => b.textContent).slice(0, 2) : [];
    return { ok: d.sim.scorePending === 0 && vals[0] === "3" && vals[1] === "1",
      why: "el HUD no confirmó el gol", info: "HUD " + vals.join("-") + " · canónico " + d.sim.scoreTarget.join("-") };
  });
  await p.evaluate(() => Pitch3D.state({ wx: "rain" }));
  await p.waitForTimeout(160);
  await check("clima conectado al 3D", () => {
    const d = Pitch3D.debug(), w = d.weather;
    return { ok: d.sim.wx === "rain" && !!w && w.key === "rain" && w.fatigue === 1.06 && w.friction > 0.55 &&
      d.glError === 0 && d.mesh.nan === 0, why: "wx/etiqueta/física/gl/malla", info: d.sim.wx + " · " + d.mesh.verts + " vértices" };
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
  await pcoin.setContent(pageAudio);
  await pcoin.evaluate(({ home, away }) => {
    Pitch3D.mount(document.getElementById("pitch"), { cols: ["#f5b326", "#5db8ff"], fem: true, cinematics: true });
    Pitch3D.teams(home, away, [{}, {}]);
    Pitch3D.state({ own: 0, bx: 50, speed: 3, fem: true, wx: "rain",
      toss: { myName: "Mi Club", oppName: "Rival FC", myLevel: 78, oppLevel: 83, style: "press" } });
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
  const coinAudio = await pcoin.evaluate(() => {
    const a = window.PitchAudio;
    return { api: !!a, sound: Pitch3D.sound(), state: a && a.state ? a.state() : null };
  });
  if (coinAudio.api && coinAudio.sound && coinAudio.state && coinAudio.state.active &&
    coinAudio.state.calls > 0 && /^(exc|kick|whistle|cheer|ooh)$/.test(coinAudio.state.lastCue))
    notes.push("3D · audio compartido activo y alimentado (" + coinAudio.state.lastCue + ")");
  else fail.push("3D: el audio compartido no está activo " + JSON.stringify(coinAudio));
  const coinTimer = await pcoin.evaluate(() => {
    const e = document.querySelector("[data-p3d-timer]");
    return { stage: Pitch3D.cinema() && Pitch3D.cinema().stage, text: e ? e.textContent : "" };
  });
  if (coinTimer.stage === "coinCall" && /^(10|9) s$/.test(coinTimer.text)) notes.push("cara o cruz · temporizador visible " + coinTimer.text);
  else fail.push("cara o cruz: falta el temporizador " + JSON.stringify(coinTimer));
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
  const chooseTimer = await pcoin.evaluate(() => {
    const e = document.querySelector("[data-p3d-timer]");
    return { stage: Pitch3D.cinema() && Pitch3D.cinema().stage, text: e ? e.textContent : "" };
  });
  if (chooseTimer.stage === "choose" && /^(20|19) s$/.test(chooseTimer.text)) notes.push("sorteo · espera de 20 s visible al ganar · " + chooseTimer.text);
  else fail.push("sorteo: falta la espera de 20 s al ganar " + JSON.stringify(chooseTimer));
  const tossUi = await pcoin.evaluate(() => {
    const meta = document.querySelector("[data-p3d-toss-meta='1']");
    return { campoPro: document.querySelectorAll("[data-p3d-pro='campo']").length,
      campoCon: document.querySelectorAll("[data-p3d-con='campo']").length,
      pelotaPro: document.querySelectorAll("[data-p3d-pro='pelota']").length,
      pelotaCon: document.querySelectorAll("[data-p3d-con='pelota']").length,
      meta: meta ? meta.textContent : "" };
  });
  if (tossUi.campoPro > 0 && tossUi.campoCon > 0 && tossUi.pelotaPro > 0 && tossUi.pelotaCon > 0 &&
    /Rival FC/.test(tossUi.meta) && /Presi/.test(tossUi.meta) && /Lluvia/.test(tossUi.meta) && /Fatiga|1,06/.test(tossUi.meta))
    notes.push("sorteo · pros/contras, estilo y clima visibles");
  else fail.push("sorteo: faltan pros/contras o contexto " + JSON.stringify(tossUi));
  await pcoin.click("[data-p3d-choice='campo']");
  await pcoin.waitForTimeout(160);
  const choiceResult = await pcoin.evaluate(() => {
    const e = document.querySelector("[data-p3d-choice-result]");
    return { choice: e && e.getAttribute("data-p3d-choice-result"), text: e ? e.textContent : "" };
  });
  if (choiceResult.choice === "campo" && /Conservas el saque/.test(choiceResult.text))
    notes.push("sorteo · consecuencia explícita del campo");
  else fail.push("sorteo: no explicó la consecuencia " + JSON.stringify(choiceResult));
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

  /* Si gana el rival, decide según nivel/estilo/clima y la UI explica el porqué. */
  const prival = await ctx.newPage();
  prival.on("pageerror", e => errs.push("rival pageerror: " + e.message));
  prival.on("console", m => { if (m.type() === "error") errs.push("rival console: " + m.text()); });
  await prival.setContent(pageHtml);
  await prival.evaluate(({ home, away }) => {
    Pitch3D.mount(document.getElementById("pitch"), { cols: ["#f5b326", "#5db8ff"], fem: true, cinematics: true });
    Pitch3D.teams(home, away, [{}, {}]);
    Pitch3D.state({ own: 0, bx: 50, speed: 3, fem: true, wx: "sun",
      toss: { myName: "Mi Club", oppName: "Rival FC", myLevel: 78, oppLevel: 84, style: "balanced" } });
  }, { home: roster("h"), away: roster("a") });
  let rStage = null;
  for (let i = 0; i < 40; i++) {
    rStage = await prival.evaluate(() => Pitch3D.cinema() && Pitch3D.cinema().stage);
    if (rStage === "coinCall") break;
    await prival.waitForTimeout(100);
  }
  await prival.evaluate(() => { Math.random = () => 0.9; });
  await prival.click("[data-p3d-coin='cara']");
  let rivalPlan = null;
  for (let i = 0; i < 30; i++) {
    rivalPlan = await prival.evaluate(() => {
      const c = Pitch3D.cinema(), e = document.querySelector("[data-p3d-rival-why]");
      return c ? { stage: c.stage, choice: c.coin && c.coin.choice, why: e ? e.textContent : "" } : null;
    });
    if (rivalPlan && rivalPlan.stage === "rivalChoice") break;
    await prival.waitForTimeout(100);
  }
  if (rivalPlan && rivalPlan.choice === "pelota" && rivalPlan.why.length > 8)
    notes.push("sorteo rival · decide pelota y explica su motivo");
  else fail.push("sorteo rival: decisión/motivo incompletos " + JSON.stringify(rivalPlan));
  let rivalDone = null;
  for (let i = 0; i < 60; i++) {
    rivalDone = await prival.evaluate(() => {
      const d = Pitch3D.debug(), c = Pitch3D.cinema(), e = document.querySelector("[data-p3d-choice-result]");
      return { cinema: !!c, attack: d.sim.attack.slice(), result: e ? e.getAttribute("data-p3d-choice-result") : "",
        text: e ? e.textContent : "", busy: Pitch3D.busy() };
    });
    if (rivalDone.result) break;
    await prival.waitForTimeout(100);
  }
  if (rivalDone && rivalDone.attack[0] === 1 && rivalDone.attack[1] === -1 &&
    rivalDone.result === "pelota" && /No cambiamos de lado/.test(rivalDone.text))
    notes.push("sorteo rival · consecuencia de pelota aplicada sin tocar el saque");
  else fail.push("sorteo rival: no aplicó/explicó pelota " + JSON.stringify(rivalDone));
  await prival.screenshot({ path: path.join(OUT, "pitch3d-coin-rival.png") });
  await prival.close();

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
  /* la barrida la hace el defensor (bando sin balón) más cercano */
  await pfb.evaluate(() => { const d = Pitch3D.debug(), sd = d.ball.mode === "held" ? 1 - d.ball.side : 1 - d.sim.own; let best = 7, bd = 1e9;
    d.players[sd].forEach((a, i) => { if (!a || a.gk) return; const q = Math.hypot(a.x - d.ball.x, a.z - d.ball.z); if (q < bd) { bd = q; best = i; } });
    window.__tw = best; window.__ts = sd; Pitch3D.event({ t: "tackle", side: sd, who: best }); });
  await pfb.waitForTimeout(140);
  const fbt = await pfb.evaluate(() => {
    const d = Pitch3D.debug(), a = d.players[window.__ts][window.__tw];
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
    Pitch.cinema();
    window.__introActive = false;
    document.querySelector(".p3dtoggle").click();
  });
  await png.waitForTimeout(250);
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
    mounts: window.__2dMounts || [],
    debug: Pitch.debug()
  }));
  if (ng.twoD && !ng.canvas3d && ng.toggle && ng.debug && ng.debug.twoD &&
    ng.mounts.length > 1 && ng.mounts[1].cinematics === false &&
    ng.events.indexOf("pass") < 0 && ng.events.indexOf("tackle") < 0 && ng.events.indexOf("goal") >= 0) {
    notes.push("fallback sin WebGL · campo 2D sin eventos fantasma y sin repetir la entrada");
  } else fail.push("fallback sin WebGL: " + JSON.stringify(ng));
  await png.close();

  /* Ceremonia 2D real (sin WebGL): túnel, sorteo, temporizador, elección y saque. */
  const page2d = '<!doctype html><html><head><style>body{margin:0;background:#07100e}.lpitch{display:block}</style></head><body>' +
    '<div id="pitch2d" style="width:420px;height:260px;position:relative"></div>' +
    '<script>function tr(s,p){s=String(s);if(p)for(var k in p)s=s.split("{"+k+"}").join(String(p[k]));return s;}</script>' +
    "<script>" + bolasSrc + "</script><script>" + pitchSrc + "</script></body></html>";
  const p2d = await ctx.newPage();
  p2d.on("pageerror", e => errs.push("2D pageerror: " + e.message));
  p2d.on("console", m => { if (m.type() === "error") errs.push("2D console: " + m.text()); });
  await p2d.setContent(page2d);
  await p2d.evaluate(({ home, away }) => {
    Pitch.mount(document.getElementById("pitch2d"), { cols: ["#f5b326", "#5db8ff"], fem: true, cinematics: true });
    Pitch.state({ own: 0, bx: 50, speed: 3, wx: "rain",
      toss: { myName: "Mi Club", oppName: "Rival FC", myLevel: 78, oppLevel: 73, style: "press",
        wx: { key: "rain", icon: "🌧", name: "Lluvia", effect: "Balón vivo y césped resbaladizo", mul: 0.94 } } });
    Pitch.teams(home, away, [{}, {}]);
  }, { home: roster("h"), away: roster("a") });
  await p2d.waitForTimeout(250);
  const twoStart = await p2d.evaluate(() => {
    const c = Pitch.cinema(), tunnel = document.querySelector(".l2d-tunnel");
    return { cinema: !!c, stage: c && c.stage, busy: Pitch.busy(), tunnel: !!tunnel && tunnel.style.display !== "none",
      meta: (document.querySelector("[data-p2d-toss-meta]") || {}).textContent || "" };
  });
  if (twoStart.cinema && twoStart.stage === "walkout" && twoStart.busy > 0 && twoStart.tunnel && /Rival FC/.test(twoStart.meta))
    notes.push("2D · salida del túnel y datos del sorteo");
  else fail.push("2D: no arrancó la salida/datos " + JSON.stringify(twoStart));
  /* Muestrea la fila al final de la salida y el saludo en plena entrada. */
  await p2d.evaluate(() => {
    window.__p2dWatch = {};
    function snap() {
      const c = Pitch.cinema(), d = Pitch.debug();
      if (!c || !d) return;
      const take = () => [0, 1].map(s => (d.T[s] || []).map(p => p ? {
        x: +p.x.toFixed(2), y: +p.y.toFixed(2), greet: +(p.greet || 0).toFixed(2)
      } : null));
      if (c.stage === "walkout" && c.stageT > 3.95 && !window.__p2dWatch.row) window.__p2dWatch.row = take();
      if (c.stage === "greet" && c.stageT > 1.35 && c.stageT < 2.2 && !window.__p2dWatch.greet) window.__p2dWatch.greet = take();
    }
    (function watch() {
      snap();
      if (!window.__p2dWatch.row || !window.__p2dWatch.greet) requestAnimationFrame(watch);
    })();
  });
  const twoAudio = await p2d.evaluate(() => ({
    api: !!window.PitchAudio, sound: Pitch.sound(), state: window.PitchAudio ? PitchAudio.state() : null
  }));
  if (twoAudio.api && twoAudio.sound && twoAudio.state && twoAudio.state.active)
    notes.push("2D · audio compartido activo");
  else fail.push("2D: el audio compartido no está activo " + JSON.stringify(twoAudio));
  let twoStage = null;
  for (let i = 0; i < 60; i++) {
    twoStage = await p2d.evaluate(() => {
      const c = Pitch.cinema(), e = document.querySelector("[data-p2d-timer] b");
      return { stage: c && c.stage, timer: e ? e.textContent : "" };
    });
    if (twoStage.stage === "coinCall") break;
    await p2d.waitForTimeout(100);
  }
  const twoCall = await p2d.evaluate(() => {
    const t = document.querySelector("[data-p2d-timer] b"), meta = document.querySelector("[data-p2d-toss-meta]");
    return { stage: Pitch.cinema() && Pitch.cinema().stage,
      cara: !!document.querySelector("[data-p2d-coin='cara']"),
      cruz: !!document.querySelector("[data-p2d-coin='cruz']"),
      timer: t ? t.textContent : "", meta: meta ? meta.textContent : "" };
  });
  if (twoCall.stage === "coinCall" && twoCall.cara && twoCall.cruz && /^(10|9) s$/.test(twoCall.timer) &&
    /Lluvia/.test(twoCall.meta) && /Fatiga/.test(twoCall.meta) && /Presi/.test(twoCall.meta))
    notes.push("2D · llamada, temporizador y clima visibles");
  else fail.push("2D: llamada/temporizador/datos incompletos " + JSON.stringify(twoCall));
  const twoMotion = await p2d.evaluate(() => window.__p2dWatch || {});
  let rowOk = !!(twoMotion.row && twoMotion.row.every(line => line && line.length === 11));
  let greetOk = !!(twoMotion.greet && twoMotion.greet.every(line => line && line.length === 11));
  if (rowOk) {
    for (let s = 0; s < 2; s++) {
      const line = twoMotion.row[s].filter(Boolean), cap = twoMotion.row[s][9], lane = 105 / 2 + (s ? 2.35 : -2.35);
      const ys = line.map(p => p.y), maxY = Math.max(...ys), minY = Math.min(...ys);
      if (!cap || Math.abs(cap.x - lane) > 0.7 || cap.y < maxY - 0.8 || maxY - minY < 10) rowOk = false;
    }
  }
  if (greetOk) {
    for (let s = 0; s < 2; s++) {
      const line = twoMotion.greet[s].filter(Boolean), cap = twoMotion.greet[s][9], lane = 105 / 2 + (s ? 2.35 : -2.35);
      if (!cap || !line.every(p => p.greet > 0.35) || Math.abs(cap.y - 34) > 4 || Math.abs(cap.x - lane) < 1.1) greetOk = false;
    }
  }
  if (rowOk && greetOk) notes.push("2D · fila con capitán al frente y saludo en la entrada");
  else fail.push("2D: la salida/saludo no replica la puesta en escena " + JSON.stringify(twoMotion));
  const coin1 = await p2d.evaluate(() => Pitch.debug().coinVisual);
  await p2d.waitForTimeout(220);
  const coin2 = await p2d.evaluate(() => Pitch.debug().coinVisual);
  if (coin1 && coin1.visible && coin1.radius >= 10 && coin2 && coin2.visible && coin2.angle > coin1.angle + 0.05 &&
    coin2.spin >= 0 && coin2.spin <= 1)
    notes.push("2D · moneda animada visible sobre el círculo central");
  else fail.push("2D: la moneda no está visible o no gira " + JSON.stringify({ coin1, coin2 }));
  await p2d.screenshot({ path: path.join(OUT, "pitch2d-coin-call.png") });
  await p2d.evaluate(() => { Math.random = () => 0; });
  await p2d.click("[data-p2d-coin='cara']");
  await p2d.evaluate(() => { Math.random = () => 0.5; });
  let twoChoose = null;
  for (let i = 0; i < 40; i++) {
    twoChoose = await p2d.evaluate(() => {
      const c = Pitch.cinema(), t = document.querySelector("[data-p2d-timer] b");
      return { stage: c && c.stage, winner: c && c.coin && c.coin.winner, timer: t ? t.textContent : "",
        campo: !!document.querySelector("[data-p2d-choice='campo']"), pelota: !!document.querySelector("[data-p2d-choice='pelota']"),
        pros: document.querySelectorAll("[data-p2d-pro]").length, cons: document.querySelectorAll("[data-p2d-con]").length };
    });
    if (twoChoose.stage === "choose") break;
    await p2d.waitForTimeout(100);
  }
  if (twoChoose.stage === "choose" && twoChoose.winner === 0 && twoChoose.campo && twoChoose.pelota &&
    /^(20|19) s$/.test(twoChoose.timer) && twoChoose.pros > 0 && twoChoose.cons > 0)
    notes.push("2D · gana el jugador, espera de 20 s, pros/contras y elección");
  else fail.push("2D: elección/temporizador/pros-contras " + JSON.stringify(twoChoose));
  const flipBefore = await p2d.evaluate(() => Pitch.debug().flip);
  await p2d.click("[data-p2d-choice='campo']");
  await p2d.waitForTimeout(120);
  const twoResult = await p2d.evaluate(() => {
    const e = document.querySelector("[data-p2d-choice-result]");
    return { stage: Pitch.cinema() && Pitch.cinema().stage, flip: Pitch.debug().flip,
      result: e && e.getAttribute("data-p2d-choice-result"), text: e ? e.textContent : "" };
  });
  if (twoResult.stage === "choiceResult" && twoResult.flip !== flipBefore && twoResult.result === "campo" && /Cambiamos de lado/.test(twoResult.text))
    notes.push("2D · campo aplicado y explicado");
  else fail.push("2D: no aplicó/explicó campo " + JSON.stringify(twoResult));
  let twoDone = null;
  for (let i = 0; i < 50; i++) {
    twoDone = await p2d.evaluate(() => {
      const c = Pitch.cinema(), d = Pitch.debug(), e = document.querySelector(".l2d-coin");
      return { cinema: !!c, busy: Pitch.busy(), ball: d.ball.m, tunnel: d.tunnelEl && d.tunnelEl.style.display,
        overlay: e ? e.style.display : "none" };
    });
    if (!twoDone.cinema && twoDone.busy === 0) break;
    await p2d.waitForTimeout(100);
  }
  if (!twoDone.cinema && !twoDone.busy && (twoDone.ball === 0 || twoDone.ball === 1) && twoDone.tunnel === "none" && twoDone.overlay === "none")
    notes.push("2D · sorteo terminado y saque listo");
  else fail.push("2D: no terminó el sorteo/saque " + JSON.stringify(twoDone));
  await p2d.screenshot({ path: path.join(OUT, "pitch2d-coin.png") });
  await p2d.close();

  /* Cambio 3D→2D durante la salida: el 2D debe retomar la ceremonia, no saltarse el sorteo. */
  const pageSwitch = '<!doctype html><html><head><style>body{margin:0;background:#07100e}.lpitch{display:block}</style></head><body>' +
    '<div id="pitchsw" style="width:420px;height:260px;position:relative"></div>' +
    '<script>function tr(s,p){s=String(s);if(p)for(var k in p)s=s.split("{"+k+"}").join(String(p[k]));return s;}</script>' +
    '<script>' + bolasSrc + '</script><script>' + pitchSrc + '</script>' +
    packLine + '<script>' + assetsSrc + '</script><script>' + src + '</script></body></html>';
  const psw = await ctx.newPage();
  psw.on("pageerror", e => errs.push("cambio 3D/2D pageerror: " + e.message));
  psw.on("console", m => { if (m.type() === "error") errs.push("cambio 3D/2D console: " + m.text()); });
  await psw.setContent(pageSwitch);
  await psw.evaluate(({ home, away }) => {
    try { localStorage.setItem("camino.pitch3d", "1"); } catch (ignore) {}
    Pitch.mount(document.getElementById("pitchsw"), { cols: ["#f5b326", "#5db8ff"], fem: true, cinematics: true });
    Pitch.teams(home, away, [{}, {}]);
    Pitch.state({ own: 0, bx: 50, speed: 3, fem: true, wx: "rain",
      toss: { myName: "Mi Club", oppName: "Rival FC", myLevel: 78, oppLevel: 73, style: "press" } });
  }, { home: roster("h"), away: roster("a") });
  let beforeSwitch = null;
  for (let i = 0; i < 40; i++) {
    beforeSwitch = await psw.evaluate(() => {
      const c = typeof Pitch3D !== "undefined" ? Pitch3D.cinema() : null;
      return { three: !!document.querySelector("canvas.lpitch3d"), cinema: !!c, type: c && c.type, stage: c && c.stage,
        audio: window.PitchAudio ? PitchAudio.state() : null, sound: Pitch.sound() };
    });
    if (beforeSwitch.three && beforeSwitch.cinema) break;
    if (!beforeSwitch.three && i === 3) await psw.click(".p3dtoggle");
    await psw.waitForTimeout(100);
  }
  await psw.click(".p3dtoggle");
  await psw.waitForTimeout(300);
  const afterSwitch = await psw.evaluate(() => {
    const c = Pitch.cinema(), t = document.querySelector(".l2d-tunnel");
    return { two: !!document.querySelector("canvas.lpitch"), three: !!document.querySelector("canvas.lpitch3d"),
      cinema: !!c, stage: c && c.stage, busy: Pitch.busy(), tunnel: !!t && t.style.display !== "none",
      audio: window.PitchAudio ? PitchAudio.state() : null, sound: Pitch.sound() };
  });
  let switchCoin = null;
  for (let i = 0; i < 60; i++) {
    switchCoin = await psw.evaluate(() => {
      const c = Pitch.cinema(), t = document.querySelector("[data-p2d-timer] b");
      return { stage: c && c.stage, timer: t ? t.textContent : "",
        cara: !!document.querySelector("[data-p2d-coin='cara']"), cruz: !!document.querySelector("[data-p2d-coin='cruz']") };
    });
    if (switchCoin.stage === "coinCall") break;
    await psw.waitForTimeout(100);
  }
  if (beforeSwitch.three && beforeSwitch.cinema && beforeSwitch.type === "intro" &&
    beforeSwitch.audio && beforeSwitch.audio.active &&
    afterSwitch.two && !afterSwitch.three && afterSwitch.cinema && afterSwitch.busy > 0 &&
    afterSwitch.audio && afterSwitch.audio.active && afterSwitch.sound &&
    switchCoin.stage === "coinCall" && switchCoin.cara && switchCoin.cruz && /^(10|9) s$/.test(switchCoin.timer))
    notes.push("cambio 3D→2D en la salida · continúa el túnel, el sorteo y el audio");
  else fail.push("cambio 3D→2D en la salida: " + JSON.stringify({ beforeSwitch, afterSwitch, switchCoin }));
  await psw.screenshot({ path: path.join(OUT, "pitch-switch-2d.png") });
  await psw.close();

  /* Guardas del puente UI→3D: el orden debe ser [local, visitante], y el
     sorteo/clima deben viajar en el estado que consume el HUD. */
  const uiBridge = /var hs = f\.home \? \[L\.gu, L\.gt\] : \[L\.gt, L\.gu\]/.test(uiSrc) &&
    /toss: liveTossInfo\(L, f\)/.test(uiSrc) && /class="lwx"/.test(uiSrc) && /data-wx/.test(uiSrc);
  if (uiBridge) notes.push("puente UI→3D · marcador local/visitante, sorteo y clima");
  else fail.push("puente UI→3D incompleto: orden, toss o franja de clima");

  console.log(notes.join("\n"));
  console.log(errs.length || fail.length ? "ERRORES: " + errs.concat(fail).join(" | ") : "SIN ERRORES · " + notes.length + " comprobaciones");
  await browser.close();
  process.exit(errs.length || fail.length ? 1 : 0);
})();
