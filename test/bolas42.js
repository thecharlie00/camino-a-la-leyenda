/* 4.2: pruebas unitarias del módulo de física y balance del campo 2D (src/bolas.js), sin navegador.
   Uso: node test/bolas42.js */
const fs = require("fs"), path = require("path"), vm = require("vm");
const ctx = {Math: Math};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../src/bolas.js"), "utf8") + "\nthis.Bolas = Bolas;", ctx);
const B = ctx.Bolas;
const fails = [], notes = [];
let seed = 12345;
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const ok = (c, m) => { if (!c) fails.push(m); };
const fin = v => typeof v === "number" && isFinite(v);
const DT = 1 / 30;

/* jugadores con los parámetros que usa pitch.js */
function mk(x, y, k) { return {x, y, vx: 0, vy: 0, _k: k}; }
function prm(fz, st) { const pace = B.calculateAttributeImpact(1, fz, 1), fat = B.fatigue(st == null ? 1 : st); return {vmax: (2.2 + 6.2 * 1) * pace * fat, acc: 5.6 * pace * (0.6 + 0.4 * fat), agi: 1, mass: 1}; }

function test_attribute_impact() {
  const c = r => B.calculateAttributeImpact(1, r, 1);
  let mono = true; for (let r = 1; r < 99; r++) if (c(r + 1) < c(r) - 1e-12) mono = false;
  ok(mono, "la curva de atributo no es creciente");
  ok(Math.abs(c(1) - 0.8) < 1e-9 && Math.abs(c(99) - 1.16) < 1e-9, "extremos de la curva fuera de 0,80-1,16");
  const g1 = c(80) - c(60), g2 = c(99) - c(80);
  notes.push("ritmo 40/60/80/99 → " + [40, 60, 80, 99].map(r => c(r).toFixed(3)).join(" / ") + " · ganancia 60→80 " + g1.toFixed(3) + " vs 80→99 " + g2.toFixed(3));
  ok(g2 < g1, "sin rendimientos decrecientes por arriba");
  let fm = true; for (let s = 0; s < 1; s += 0.05) if (B.fatigue(s + 0.05) < B.fatigue(s) - 1e-12) fm = false;
  ok(fm, "el cansancio no es monótono");
  ok(B.fatigue(1) === 1 && B.fatigue(0.95) === 1 && B.fatigue(0) > 0.6 && B.fatigue(0) < 0.75, "rango del castigo por cansancio");
  ok(B.calculateAttributeImpact(1, 70, 0.4) < B.calculateAttributeImpact(1, 70, 0.8), "el cansancio no resta");
  [NaN, undefined, null, Infinity, -50, 500].forEach(v => { ok(fin(B.calculateAttributeImpact(1, v, v)), "NaN con entrada " + v); });
}

/* nadie se escapa del campo ni hay NaN, ni con objetivos absurdos ni pasos raros */
function test_pitch_boundary_containment() {
  const P = [], bd = B.B_PL;
  for (let i = 0; i < 22; i++) P.push(mk(rnd() * 105, rnd() * 68, i));
  const bad = [NaN, Infinity, -Infinity, 1e9, -1e9, undefined];
  let esc = 0, nan = 0;
  for (let t = 0; t < 3000; t++) {
    P.forEach((p, i) => {
      const tx = t % 97 === i ? bad[t % bad.length] : (rnd() - 0.5) * 600, ty = (rnd() - 0.5) * 400;
      const dt = t % 211 === 0 ? [0, -1, 5, NaN][t % 4] : DT;
      if (t === 1500 && i === 3) { p.x = NaN; p.vy = Infinity; }
      B.steer(p, tx, ty, dt, prm(20 + rnd() * 79, rnd()));
      if (!fin(p.x) || !fin(p.y) || !fin(p.vx) || !fin(p.vy)) nan++;
      if (p.x < bd.x0 || p.x > bd.x1 || p.y < bd.y0 || p.y > bd.y1) esc++;
      if (Math.hypot(p.vx, p.vy) > B.VMAX_CAP + 1e-9) esc++;
    });
  }
  const b = {x: 50, y: 30, z: 0, vx: 400, vy: -300, vz: 0, spin: 0};
  for (let t = 0; t < 600; t++) { B.ballFree(b, DT); if (!fin(b.x + b.y + b.z)) nan++; if (b.x < B.B_BALL.x0 || b.x > B.B_BALL.x1 || b.y < B.B_BALL.y0 || b.y > B.B_BALL.y1) esc++; }
  const b2 = {x: NaN, y: 3, z: NaN, vx: NaN, vy: 0, vz: 1, px: 40, py: 20}; B.ballFree(b2, DT);
  ok(fin(b2.x) && fin(b2.z) && b2.vx === 0, "balón con NaN no se repara");
  notes.push("contención: 66.000 pasos de jugador, salidas " + esc + ", NaN " + nan);
  ok(esc === 0, "alguien se sale del campo o pasa el tope de velocidad");
  ok(nan === 0, "aparecen NaN");
}

/* bolitas amontonadas (incluso en el mismo punto exacto) se separan en N ticks */
function test_separation_force_no_clumping() {
  const N = 60;
  [[6, 0], [11, 0.8]].forEach(([n, spread]) => {
    const T = [[], []];
    for (let i = 0; i < n; i++) T[0].push(mk(50 + (rnd() - 0.5) * spread, 34 + (rnd() - 0.5) * spread, i));
    let t = 0, minD = 0;
    for (; t < 300; t++) {
      const f = T[0].map(p => B.sepForce(p, T, 0, {R: 2.3}));
      T[0].forEach((p, i) => B.steer(p, 50 + f[i].x, 34 + f[i].y, DT, prm(70)));
      minD = 99; for (let a = 0; a < n; a++) for (let c = a + 1; c < n; c++) minD = Math.min(minD, Math.hypot(T[0][a].x - T[0][c].x, T[0][a].y - T[0][c].y));
      if (minD >= 1.0) break;
    }
    notes.push(n + " bolitas " + (spread ? "en " + spread + " m" : "en el mismo punto") + ": separadas a ≥1 m en " + t + " ticks (" + (t / 30).toFixed(1) + " s)");
    ok(minD >= 1.0 && t <= N, "las bolitas no se separan en " + N + " ticks (" + n + ", mín " + minD.toFixed(2) + ")");
  });
  /* dos en el mismo punto: empujes opuestos */
  const a = mk(10, 10, 3), c = mk(10, 10, 7), T = [[a, c], []];
  const fa = B.sepForce(a, T, 0), fc = B.sepForce(c, T, 0);
  ok(Math.hypot(fa.x, fa.y) > 0.5 && Math.abs(fa.x + fc.x) < 1e-9 && Math.abs(fa.y + fc.y) < 1e-9, "dos bolitas en el mismo punto no se empujan en sentidos opuestos");
}

/* el balón frena con naturalidad y se para del todo, sin restos de coma flotante */
function test_ball_friction_and_stop() {
  [4, 12, 25].forEach(v0 => {
    [1 / 30, 1 / 60, 1 / 120].forEach(dt => {
      const b = {x: 10, y: 34, z: 0, vx: v0, vy: 0, vz: 0, spin: 0};
      let t = 0, back = false, last = b.x;
      while ((b.vx !== 0 || b.vy !== 0) && t < 20) { B.ballFree(b, dt); t += dt; if (b.x < last - 1e-12) back = true; last = b.x; }
      const dist = b.x - 10, ana = v0 * v0 / (2 * B.ROLL_FRIC), tA = v0 / B.ROLL_FRIC;
      if (dt === 1 / 30) notes.push("balón a " + v0 + " m/s: recorre " + dist.toFixed(2) + " m (teórico " + ana.toFixed(2) + "), se para en " + t.toFixed(2) + " s (teórico " + tA.toFixed(2) + ")");
      ok(b.vx === 0 && b.vy === 0, "el balón no queda a velocidad cero exacta");
      ok(Math.abs(dist - ana) / ana < 0.02, "distancia de frenada fuera del 2 % (" + v0 + " m/s, paso " + dt.toFixed(4) + ")");
      ok(Math.abs(t - tA) < dt * 1.5 + 1e-9, "tiempo de parada incorrecto");
      ok(!back, "el balón retrocede al frenar");
      const x0 = b.x; for (let i = 0; i < 300; i++) B.ballFree(b, dt);
      ok(b.x === x0, "el balón parado se arrastra");
    });
  });
  /* bote: acaba en el suelo y parado */
  const b = {x: 30, y: 34, z: 0, vx: 8, vy: 2, vz: 9, spin: 0.6};
  for (let i = 0; i < 900; i++) B.ballFree(b, DT);
  ok(b.z === 0 && b.vz === 0 && b.vx === 0 && b.vy === 0, "el balón bombeado no se queda quieto en el suelo");
}

/* llega al punto sin pasarse ni temblar */
function test_arrive_no_jitter() {
  const p = mk(0.5, 34, 0); let flips = 0, lastS = 0, over = 0;
  for (let t = 0; t < 360; t++) {
    B.steer(p, 30, 34, DT, prm(80));
    const s = Math.sign(Math.round(p.vx * 100)); if (s && lastS && s !== lastS) flips++; if (s) lastS = s;
    if (p.x > 30.4) over = Math.max(over, p.x - 30);
  }
  notes.push("llegada a 30 m: final " + p.x.toFixed(2) + " m, velocidad " + Math.hypot(p.vx, p.vy).toFixed(3) + ", cambios de sentido " + flips + ", se pasa " + over.toFixed(2) + " m");
  ok(Math.abs(p.x - 30) < 0.35 && p.vx === 0 && p.vy === 0, "no se queda quieto en el destino");
  ok(flips <= 1 && over < 0.4, "tiembla o se pasa del destino");
  /* objetivo que oscila 0,2 m (como el fuera de juego): no debe moverse */
  let moved = 0; for (let t = 0; t < 300; t++) { const x0 = p.x; B.steer(p, 30 + (t % 2 ? 0.2 : -0.2), 34, DT, prm(80)); moved += Math.abs(p.x - x0); }
  notes.push("objetivo que oscila ±0,2 m durante 10 s: recorre " + moved.toFixed(3) + " m");
  ok(moved < 0.05, "tiembla con un objetivo que oscila");
}

/* el rápido se escapa del lento, pero sin teletransportes */
function test_pace_pull_away() {
  const f = mk(0, 20, 0), s = mk(0, 40, 1);
  let tf = 0, ts = 0, vmaxSeen = 0;
  for (let t = 1; t <= 300 && (!tf || !ts); t++) {
    B.steer(f, 60, 20, DT, prm(90)); B.steer(s, 60, 40, DT, prm(40));
    vmaxSeen = Math.max(vmaxSeen, Math.hypot(f.vx, f.vy));
    if (!tf && f.x >= 30) tf = t / 30; if (!ts && s.x >= 30) ts = t / 30;
  }
  const lead = (ts - tf) * 8;
  notes.push("30 m: ritmo 90 en " + tf.toFixed(2) + " s, ritmo 40 en " + ts.toFixed(2) + " s (≈" + lead.toFixed(1) + " m de ventaja) · punta " + vmaxSeen.toFixed(2) + " m/s");
  ok(ts - tf > 0.25 && ts - tf < 1.2, "la diferencia de ritmo no se nota o es exagerada");
  ok(vmaxSeen <= B.VMAX_CAP, "supera el tope de velocidad");
}

/* tácticas: coherentes, dentro del campo y con contrapartida */
function test_tactical_offsets() {
  const F = [["POR", 0.045, 0.5], ["LD", 0.24, 0.84], ["DFC", 0.2, 0.36], ["DFC", 0.2, 0.64], ["LI", 0.24, 0.16], ["MC", 0.46, 0.3], ["MCD", 0.36, 0.5], ["MC", 0.46, 0.7], ["ED", 0.72, 0.85], ["DC", 0.8, 0.5], ["EI", 0.72, 0.15]]
    .map(([pos, u, y]) => ({pos, hu: u * 105, hy: y * 68}));
  let inside = true, order = true;
  const lineOf = (blk, att, bu) => { const r = B.applyTacticalOffsets(F, {blk, att, bu}); return (r[2].u + r[3].u) / 2; };
  for (const blk of [-2, -1, 0, 1, 2]) for (const width of [0, 1, 2]) for (const pass of [0, 1, 2]) for (const att of [false, true]) for (const bu of [5, 30, 52, 80, 100]) {
    const r = B.applyTacticalOffsets(F, {blk, width, pass, att, bu, by: 34, offU: 90, press: blk > 0});
    r.forEach(q => { if (!(q.u >= 1 && q.u <= 104 && q.y >= 0.8 && q.y <= 67.2)) inside = false; });
    const def = (r[2].u + r[3].u) / 2, mid = (r[5].u + r[6].u + r[7].u) / 3, fw = r[9].u;
    if (!(r[0].u < def && def < mid && mid < fw)) order = false;
  }
  ok(inside, "un destino táctico cae fuera del campo");
  ok(order, "las líneas se cruzan (portero, defensa, medio, delantero)");
  const lines = [-2, -1, 0, 1, 2].map(b => lineOf(b, false, 60));
  notes.push("línea defensiva con el balón en el medio campo rival, de «encerrarse» a «presión alta»: " + lines.map(v => v.toFixed(1)).join(" / ") + " m · radio de presión " + [-2, -1, 0, 1, 2].map(b => B.pressRadius({blk: b, press: b === 2})).join("/") + " m");
  ok(lines.every((v, i) => i === 0 || v > lines[i - 1]), "subir el bloque no adelanta la línea");
  const space = 105 - 52.5 - lines[4], spaceLow = 105 - 52.5 - lines[0];
  ok(lines[4] - lines[0] > 15, "poca diferencia entre bloque bajo y alto");
  const wide = B.applyTacticalOffsets(F, {width: 2, att: true, bu: 60}), narrow = B.applyTacticalOffsets(F, {width: 0, att: true, bu: 60});
  ok(Math.abs(wide[8].y - wide[10].y) > Math.abs(narrow[8].y - narrow[10].y) + 10, "la amplitud no abre a los extremos");
  ok(B.applyTacticalOffsets(null, {}).length === 0 && B.applyTacticalOffsets([null], {})[0] === null, "applyTacticalOffsets no tolera entradas vacías");
  void space; void spaceLow;
}

/* pase, entrada y colocación: se notan y nadie queda perfecto */
function test_pass_tackle_position() {
  const err = (pas, st) => { let s = 0; seed = 777; for (let i = 0; i < 4000; i++) { const e = B.passError(pas, st, 25, 0.3, rnd); s += Math.hypot(25 * Math.sin(e.a), 25 * e.l); } return s / 4000; };
  const e40 = err(40, 1), e70 = err(70, 1), e95 = err(95, 1), e70t = err(70, 0.45);
  notes.push("error medio de un pase de 25 m: pase 40 → " + e40.toFixed(2) + " m · 70 → " + e70.toFixed(2) + " m · 95 → " + e95.toFixed(2) + " m · 70 cansado → " + e70t.toFixed(2) + " m");
  ok(e40 > e70 && e70 > e95, "el pase no mejora con el atributo");
  ok(e95 > 0.2, "un pase de 99 sale perfecto (sin error)");
  ok(e70t > e70 * 1.2, "el cansancio no empeora el pase");
  const r = [30, 60, 90].map(v => B.tackleReach(v, 1)), q = [30, 60, 90].map(v => B.reaction(v, 1));
  const ic = [[40, 40], [90, 40], [40, 90]].map(([e, p]) => B.icptChance(e, 1, 1, p));
  notes.push("alcance de corte 30/60/90: " + r.map(v => v.toFixed(2)).join("/") + " m · reacción colocación 30/60/90: " + q.map(v => v.toFixed(2)).join("/") + " s · corte (entrada, pase del rival) 40-40 " + ic[0].toFixed(2) + ", 90-40 " + ic[1].toFixed(2) + ", 40-90 " + ic[2].toFixed(2));
  ok(r[0] < r[1] && r[1] < r[2] && r[2] < 2.1, "alcance de entrada incoherente");
  ok(q[0] > q[1] && q[1] > q[2] && q[2] > 0.1, "reacción por colocación incoherente");
  ok(ic[1] > ic[0] && ic[2] < ic[0], "la probabilidad de corte no responde a entrada y pase");
}

[test_attribute_impact, test_pitch_boundary_containment, test_separation_force_no_clumping, test_ball_friction_and_stop, test_arrive_no_jitter, test_pace_pull_away, test_tactical_offsets, test_pass_tackle_position]
  .forEach(fn => { const n = fails.length; try { fn(); } catch (e) { fails.push(fn.name + ": " + e.message); } console.log((fails.length === n ? "✓ " : "✗ ") + fn.name); });
console.log(notes.join("\n"));
console.log(fails.length ? "ERRORES: " + fails.join(" | ") : "SIN ERRORES");
process.exitCode = fails.length ? 1 : 0;
