const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const {readFileSync} = require('node:fs');
const {JSDOM, VirtualConsole} = require('jsdom');

/* Jugada Maestra dentro del partido: motor, ajustes, pausa y panel.
   Comprueba que apagada reproduce el partido anterior (digest fijado con el motor
   previo a la integración), que encendida se sella y se resuelve una sola vez, que
   el resultado es el evento real de partido y que el panel pausa y reanuda. */

const html = readFileSync('dist/jugar/juego.html', 'utf8');
const errors = [];
const virtualConsole = new VirtualConsole();
virtualConsole.on('jsdomError', (error) => { if (!/Not implemented/.test(error.message)) errors.push(`jsdom: ${error.message}`); });
virtualConsole.on('error', (message) => errors.push(`console: ${message}`));

const dom = new JSDOM(html, {
  url: 'https://jm-match.local/',
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  virtualConsole,
  beforeParse(window) {
    window.matchMedia = () => ({matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}});
    window.scrollTo = () => {};
    window.requestAnimationFrame = (callback) => setTimeout(() => callback(Date.now()), 8);
    window.cancelAnimationFrame = clearTimeout;
    window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
    window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
    window.HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,';
    window.HTMLCanvasElement.prototype.getContext = function () {
      const methods = {
        measureText: () => ({width: 10}), createLinearGradient: () => ({addColorStop() {}}),
        createRadialGradient: () => ({addColorStop() {}}), getImageData: () => ({data: new Uint8ClampedArray(4)}),
        createPattern: () => null,
      };
      return new Proxy(methods, {get: (target, key) => (key in target ? target[key] : () => {})});
    };
    window.fetch = () => Promise.resolve({ok: true, status: 200, text: () => Promise.resolve('{"entries":[]}')});
  },
});

const {window} = dom;
const {document} = window;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function waitFor(predicate, description, timeout = 30000) {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeout) throw new Error(`Timed out waiting for ${description}`);
    await wait(40);
  }
}
const digest = (value) => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 24);
const clubIndexes = () => window.W.clubs.map((club, index) => (club && club.lg0 != null && index > 0 ? index : -1)).filter((index) => index >= 0);

/* deja una carrera de míster con el primer partido en directo preparado (sin abrirlo) */
function prepareCareer({jm, seed = 424242, clubOffset = 0, rng = 777001}) {
  const clubs = clubIndexes();
  window.newManagerCareer({seed, fn: 'JM', ln: 'Mgr', nat: 'ES', age: 40, diff: 1, ev: 2, jm, club: clubs[Math.min(clubOffset, clubs.length - 1)], g: 'm'});
  const S = window.S;
  S.pend = [];
  S.rng = rng;
  window.mgrStartBlock();
  let guard = 0;
  while (guard++ < 60 && (!S.pend.length || S.pend[0].k !== 'mlive')) { S.pend = []; window.mgrContinue(); }
  assert.equal(S.pend[0] && S.pend[0].k, 'mlive', 'the first live match should be waiting');
  return {S, fi: S.cur.pi};
}
/* abre un bloque de partidos como hace el motor, sin simularlo */
function openBlock(S) {
  S.blog = []; S.bnews = []; S.momN = 0; S.ph = 'blk';
  S.bst = {apps: 0, min: 0, rs: 0, rn: 0, lgApps: 0, lgRs: 0, tm: 0, ovr0: S.p.ovr};
}
/* primer partido del calendario del club, con un gol del equipo dentro de la ventana jugada */
function nextPlayerFixture(S) {
  openBlock(S);
  let found = null;
  for (let w = S.w; w < S.w + 10 && !found; w++) {
    S.cur = {w, end: w, prep: false, pm: [], pi: 0, called: false, summer: false};
    window.prepWeek(w);
    if (S.cur.pm.length) found = S.cur.pm[0];
  }
  assert.ok(found, 'the player club has a fixture');
  window.prePlayer(found);
  found.role = 'start'; found.min = 90; found.gu = 2; found.gt = 1; found.gmu = [22, 64]; found.gmt = [40]; found.st = 1;
  S.cur.pi = 0;
  return found;
}

function startLive(opts) {
  const prep = prepareCareer(opts);
  window.liveStart(prep.fi);
  return {...prep, L: window.S.live};
}

function playOut(L) {
  const events = [];
  let guard = 0;
  while (!L.done && guard++ < 200) {
    window.liveStep().forEach((e) => events.push([e.t, e.us == null ? '' : e.us, e.min]));
  }
  return {score: [L.gu, L.gt], shots: L.shots, on: L.on, big: L.big, gl: L.gl.map((g) => [g.us, g.min]), ev: events};
}

(async () => {
  try {
    await waitFor(() => window.UIX && window.newManagerCareer && window.mxShot && window.Sfx && window.UIX.jmMatch, 'game boot', 60000);
    await wait(400);

    /* ---- 1. el interruptor existe antes de la carrera y en el menú ---- */
    window.localStorage.setItem('camino.slots', '[]');
    await waitFor(() => document.querySelector('[data-a="setlang"]') || document.querySelector('[data-a="newgame"]'), 'language or main menu');
    if (document.querySelector('[data-a="setlang"]')) document.querySelector('[data-a="setlang"][data-v="es"]').click();
    await waitFor(() => document.querySelector('[data-a="newgame"]'), 'main menu');
    document.querySelector('[data-a="newgame"]').click();
    document.querySelector('[data-a="pickmode"][data-v="mgr"]').click();
    for (const [selector, value] of [['#fn', 'Switch'], ['#ln', 'Tester']]) {
      const input = document.querySelector(selector);
      input.value = value;
      input.dispatchEvent(new window.Event('input', {bubbles: true}));
    }
    document.querySelector('[data-a="cnext"]').click();
    assert.equal(document.querySelector('[data-a="cset"][data-k="jm"]'), null, 'Master Play is only offered on an intense pace');
    document.querySelector('[data-a="cset"][data-k="ev"][data-v="2"]').click();
    const jmFieldWrap = document.querySelector('[data-a="cset"][data-k="jm"]');
    assert.ok(jmFieldWrap, 'the creation form offers Master Play when live matches are possible');
    assert.match(jmFieldWrap.parentElement.parentElement.textContent, /Jugada Maestra en el partido/, 'the switch is labelled in the creation form');
    assert.equal(jmFieldWrap.getAttribute('aria-pressed'), 'true', 'the switch starts off');
    assert.equal(document.querySelector('[data-a="cset"][data-k="jm"][data-v="1"]').getAttribute('aria-pressed'), 'false', 'Master Play is opt-in');
    document.querySelector('[data-a="cset"][data-k="jm"][data-v="1"]').click();
    assert.equal(document.querySelector('[data-a="cset"][data-k="jm"][data-v="1"]').getAttribute('aria-pressed'), 'true', 'the switch reflects the choice');
    document.querySelector('[data-a="cnext"]').click();
    document.querySelector('[data-a="cclub"]').click();
    document.querySelector('[data-a="cnext"]').click();
    await waitFor(() => window.UIX.ui().view === 'game', 'manager career creation');
    assert.equal(window.S.set.jm, 1, 'the creation choice reaches the career');
    assert.equal(window.S.set.ev, 2, 'live pace is kept');
    document.querySelector('[data-a="menu"]').click();
    const menuJm = document.querySelector('[data-a="setjm"][data-v="1"]');
    assert.ok(menuJm, 'the in-career menu exposes the same switch');
    assert.equal(menuJm.getAttribute('aria-pressed'), 'true', 'the menu shows the current choice');
    document.querySelector('[data-a="setjm"][data-v="0"]').click();
    assert.equal(window.S.set.jm, 0, 'the menu switch is disabled and persisted');
    document.querySelector('[data-a="setjm"][data-v="1"]').click();
    assert.equal(window.S.set.jm, 1, 'the menu switch can enable it again');
    document.querySelector('[data-a="setev"][data-v="1"]').click();
    assert.equal(document.querySelector('[data-a="setjm"]'), null, 'with a calm pace the switch is not offered because there are no live matches');

    /* ---- 2. apagada: mismo partido que antes de la integración ---- */
    const off = startLive({jm: 0});
    assert.equal(off.S.set.jm, 0, 'Master Play must be off unless the user enables it');
    const offPayload = playOut(off.L);
    assert.equal(digest(offPayload), 'd8a408519fedd721b7cffdcc', 'with Master Play off the live match must reproduce the previous engine');
    assert.ok(!offPayload.ev.some((e) => e[0] === 'jm'), 'with Master Play off the match is never interrupted');
    assert.equal(window.jmLiveOn(), false, 'the engine switch is off for the career');
    assert.equal(off.S.live.jm, undefined, 'no chance is ever sealed when the option is off');
    window.liveFinish();
    const off2 = startLive({jm: 0, seed: 11, clubOffset: 40});
    assert.equal(digest(playOut(off2.L)), 'd142b895226eb8209796fe70', 'the off switch must keep the previous balance in a second sample');
    window.liveFinish();

    /* ---- 3. el ajuste viaja en la partida y las partidas antiguas lo reciben apagado ---- */
    const on = startLive({jm: 1});
    assert.equal(on.S.set.jm, 1, 'the manager career should keep the chosen setting');
    const save = JSON.parse(window.serialize());
    delete save.set.jm;
    window.restore(JSON.stringify(save));
    assert.deepEqual({...window.S.set}, {ev: 2, jm: 0}, 'old saves get the new setting disabled and keep their pace');
    const legacy = JSON.parse(window.serialize());
    legacy.set = {ev: 2};
    window.restore(JSON.stringify(legacy));
    assert.equal(window.S.set.jm, 0, 'a save without the key must not inherit an enabled feature');
    const ancient = JSON.parse(window.serialize());
    delete ancient.set;
    window.restore(JSON.stringify(ancient));
    assert.deepEqual({...window.S.set}, {ev: 1, jm: 0}, 'saves without settings fall back to the previous defaults');

    /* ---- 4. encendida: la ocasión se sella y se resuelve una sola vez ---- */
    const jmRun = startLive({jm: 1});
    const {S, L} = jmRun;
    const shotsBefore = L.shots[0];
    let steps = 0;
    while (!(L.jm && !L.jm.done) && !L.done && steps++ < 60) window.liveStep();
    assert.ok(L.jm, 'an eligible chance should open a Master Play moment');
    assert.equal(L.jm.st.match, true, 'the moment uses the match engine of Master Play');
    assert.equal(L.jm.st.xg, L.jm.xg, 'the moment is anchored on the chance xG');
    assert.ok(Number.isInteger(L.jm.seed) && L.jm.seed >= 0, 'the chance keeps a sealed 32-bit seed');
    assert.equal(L.shots[0], shotsBefore + 1, 'the chance counts as the shot the model had already decided');
    assert.ok(L.jm.min >= 8 && L.jm.min <= 88, 'moments only appear inside the match window');
    assert.ok(!L.ev.some((e) => e.t === 'jm'), 'a simulated chance must not announce a pause that nobody sees');
    const goalBefore = L.gu, onBefore = L.on[0], jmMin = L.jm.min;

    /* un trazo directo a puerta resuelve la jugada y no se puede repetir */
    let res = null;
    for (let i = 0; i < 4 && !L.jm.done; i++) res = window.jmLiveResolve(94, 50);
    assert.ok(L.jm.done, 'the play must end after the drawn actions');
    assert.ok(['goal', 'save', 'post', 'miss', 'block', 'lost'].includes(L.jm.res), `unexpected outcome ${L.jm.res}`);
    assert.equal(L.gu - goalBefore, L.jm.res === 'goal' ? 1 : 0, 'only a goal changes the scoreline');
    if (L.jm.res === 'goal' || L.jm.res === 'save') assert.equal(L.on[0], onBefore + 1, 'shots on target follow the outcome');
    else assert.equal(L.on[0], onBefore, 'a block or a loss is not a shot on target');
    assert.ok(L.ev.some((e) => e.min === jmMin && e.t !== 'jm'), 'the outcome becomes a real match event');
    if (L.jm.res === 'goal') assert.ok(L.gl.some((g) => g.us === 1 && g.min === jmMin), 'the goal enters the match goalscorer list');
    const evCount = L.ev.length;
    assert.equal(window.jmLiveResolve(94, 50), null, 'a resolved chance cannot be replayed');
    assert.equal(L.ev.length, evCount, 'a resolved chance cannot add events');

    /* el partido sigue y nunca hay más de dos momentos por partido */
    for (let i = 0; i < 200 && !L.done; i++) window.liveStep();
    assert.ok(L.jmN >= 1 && L.jmN <= 2, `at most two moments per match (got ${L.jmN})`);
    window.liveFinish();
    const fixture = window.S.cur.pm[jmRun.fi];
    assert.equal(fixture.st, 1, 'the live result goes back into the real fixture');
    assert.ok(Array.isArray(fixture.liveSubs), 'the live match still closes normally');

    /* ---- 4b. un gol de la jugada entra en marcador, estadísticas y goleadores ---- */
    const goals = startLive({jm: 1});
    let goalGuard = 0;
    while (!(goals.L.jm && !goals.L.jm.done) && !goals.L.done && goalGuard++ < 80) window.liveStep();
    assert.ok(goals.L.jm, 'a chance opens to check the goal bookkeeping');
    const gMin = goals.L.jm.min, gScore = goals.L.gu, gOn = goals.L.on[0], gSc = goals.L.sc.length, gCh = goals.L.ch.length;
    window.jmLiveApply(goals.L, 'goal');
    assert.equal(goals.L.gu, gScore + 1, 'a goal from the chance counts on the scoreboard');
    assert.equal(goals.L.on[0], gOn + 1, 'a goal from the chance counts as a shot on target');
    assert.equal(goals.L.gl.filter((x) => x.us === 1 && x.min === gMin).length, 1, 'the goal gets its scorer and minute');
    assert.equal(goals.L.ch.length, gCh + 1, 'the goal enters the match timeline');
    assert.ok(goals.L.ev.some((e) => e.t === 'goal' && e.min === gMin), 'the goal becomes a real match event');
    assert.ok(goals.L.sc.length >= gSc, 'the scorer list keeps the players who scored');
    let blockGuard = 0;
    while (!(goals.L.jm && !goals.L.jm.done) && !goals.L.done && blockGuard++ < 90) window.liveStep();
    if (goals.L.jm && !goals.L.jm.done) {
      const bScore = goals.L.gu;
      window.jmLiveApply(goals.L, 'block');
      assert.equal(goals.L.gu, bScore, 'a block never changes the scoreline');
      assert.equal(goals.L.own, 1, 'a block hands the ball back to the opposition');
    }
    window.liveFinish();
    const played = window.S.cur.pm[goals.fi];
    assert.equal(played.st, 1, 'the match closes with the goals from Master Play');
    assert.equal(played.gu, goals.L.gu, 'the live score goes back into the real fixture');
    assert.equal(played.forced.length, Math.min(goals.L.gl.filter((g) => g.us === 1).length, goals.L.sc.length), 'goals from Master Play credit their scorers like any other goal');

    /* ---- 5. misma semilla + mismas entradas, misma jugada y mismo desenlace ---- */
    const detPrep = prepareCareer({jm: 1});
    const preSave = window.serialize();
    const detFi = detPrep.fi;
    window.liveStart(detFi);
    let detGuard = 0;
    while (!(window.S.live.jm && !window.S.live.jm.done) && !window.S.live.done && detGuard++ < 80) window.liveStep();
    const seenSeed = window.S.live.jm.seed;
    const seenState = JSON.stringify(window.S.live.jm.st);
    for (let i = 0; i < 4 && !window.S.live.jm.done; i++) window.jmLiveResolve(94, 50);
    const seenOutcome = window.S.live.jm.res;
    window.liveFinish();
    window.restore(preSave);
    window.liveStart(detFi);
    let replay = 0;
    while (!(window.S.live.jm && !window.S.live.jm.done) && !window.S.live.done && replay++ < 80) window.liveStep();
    assert.equal(window.S.live.jm.seed, seenSeed, 'the sealed seed is reproducible from the save');
    assert.equal(JSON.stringify(window.S.live.jm.st), seenState, 'seed + inputs give the same play');
    for (let i = 0; i < 4 && !window.S.live.jm.done; i++) window.jmLiveResolve(94, 50);
    assert.equal(window.S.live.jm.res, seenOutcome, 'the same inputs resolve the same way');
    window.liveFinish();

    /* sin dibujar, el equipo resuelve la ocasión con su semilla */
    const auto = startLive({jm: 1});
    let autoGuard = 0;
    while (!(auto.L.jm && !auto.L.jm.done) && !auto.L.done && autoGuard++ < 80) window.liveStep();
    window.jmLiveAuto();
    assert.ok(auto.L.jm.done && auto.L.jm.res, 'the team can resolve the play without drawing');
    window.liveFinish();

    /* ---- 5b. la ocasión sellada sobrevive al guardado y a reabrir la app ---- */
    const frozen = startLive({jm: 1});
    frozen.L.min = 30;
    let frozenGuard = 0;
    while (!(frozen.L.jm && !frozen.L.jm.done) && !frozen.L.done && frozenGuard++ < 80) window.liveStep();
    assert.ok(frozen.L.jm, 'a chance opens to test the save');
    const sealedSeed = frozen.L.jm.seed, sealedState = JSON.stringify(frozen.L.jm.st);
    const sealedSave = window.serialize();
    document.getElementById('live')?.remove();
    window.restore(sealedSave);
    assert.equal(window.S.set.jm, 1, 'the switch survives the save');
    assert.equal(window.S.live.jm.seed, sealedSeed, 'the sealed seed is stored in the save');
    assert.equal(JSON.stringify(window.S.live.jm.st), sealedState, 'the drawn state is stored in the save');
    window.UIX.openLive();
    await waitFor(() => document.getElementById('jml-ov'), 'panel reopened from a save');
    assert.match(document.getElementById('jml-ov').textContent, /Jugada Maestra/, 'the saved chance reopens its panel');
    const autoSaved = document.querySelector('[data-jml="auto"]');
    assert.ok(autoSaved, 'the saved chance can still be resolved');
    autoSaved.click();
    await wait(80);
    const backSaved = document.querySelector('[data-jml="back"]');
    assert.ok(backSaved, 'the saved chance resolves exactly once');
    backSaved.click();
    await waitFor(() => !document.getElementById('jml-ov'), 'panel closed after the saved chance');
    window.liveFinish();
    document.getElementById('live')?.remove();

    /* ---- 5c. carrera de jugador/a: opt-in, pausa, resolución única y paridad ---- */
    window.localStorage.setItem('camino.slots', '[]');
    /* el interruptor también está antes de la carrera y guarda la elección */
    window.UIX.startCreate('p');
    await wait(80);
    window.UIX.ui().cr.step = 2;
    window.UIX.render(true);
    await wait(80);
    const jmYes = document.querySelector('[data-a="cset"][data-k="jm"][data-v="1"]');
    assert.ok(jmYes, 'the player creation form offers Master Play before the career');
    jmYes.click();
    await wait(80);
    assert.equal(window.UIX.ui().cr.jm, 1, 'the creation form stores the Master Play choice');
    window.UIX.ui().cr = null; window.UIX.ui().view = 'home'; window.UIX.render(true);
    await wait(80);
    const mkPlayer = (jm) => window.newCareer({seed: 424242, fn: 'Player', ln: 'Tester', nat: 'ES', pos: 'DC', foot: 'Diestro', age: 18, talent: 'joya', club: clubIndexes()[0], ev: 2, g: 'm', jm});
    mkPlayer(undefined);
    assert.equal(window.S.set.jm, 0, 'player careers keep Master Play off unless it is chosen');
    mkPlayer(1);
    const PS = window.S;
    assert.equal(PS.set.jm, 1, 'the player career stores the opt-in');
    PS.pend = [];
    const pFix = nextPlayerFixture(PS);
    assert.equal(window.playPlayerFixture(pFix), 'pause', 'an eligible player match pauses on the chance');
    const pay = pFix.jm;
    assert.ok(pay && pay.seed && pay.min && pay.xg >= 0.04, 'the player chance is sealed with its seed, minute and quality');
    assert.equal(PS.pend.filter((x) => x.k === 'jmm').length, 1, 'the chance waits as a single pending moment');
    assert.equal(pFix.gu, 2, 'the pause does not add a goal by itself');
    window.UIX.ui().view = 'game';
    window.UIX.render(true);
    await wait(120);
    assert.match(document.body.textContent, /Momento clave/, 'the player card announces the key moment');
    const playBtn = document.querySelector('[data-a="jmplay"]');
    assert.ok(playBtn, 'the player card offers to play the move');
    playBtn.click();
    await wait(200);
    const overlay = document.getElementById('jml-ov');
    assert.ok(overlay, 'the move opens for the player career');
    assert.ok(overlay.querySelector('svg.jm-field[data-jm="live"]'), 'the player move draws the pitch');
    assert.match(overlay.textContent, /Ocasión para/, 'the header names the player chance');
    for (let i = 0; i < 4 && !pFix.jm.done; i++) {
      const shot = overlay.querySelector('[data-jml="shot"]');
      if (!shot) break;
      shot.click();
      await wait(60);
    }
    assert.ok(pFix.jm.done, 'the player move resolves once');
    const sealed = JSON.stringify({res: pFix.jm.res, st: pFix.jm.st && pFix.jm.st.done, min: pFix.jm.min});
    assert.ok(!overlay.querySelector('[data-jml="shot"]'), 'a resolved player move cannot be replayed');
    const backBtn = overlay.querySelector('[data-jml="back"]');
    assert.ok(backBtn, 'the player move returns to the match');
    backBtn.click();
    await wait(250);
    assert.equal(document.getElementById('jml-ov'), null, 'the player move closes');
    assert.equal(PS.pend.filter((x) => x.k === 'jmm').length, 0, 'the pending moment is cleared');
    assert.equal(JSON.stringify({res: pFix.jm.res, st: pFix.jm.st && pFix.jm.st.done, min: pFix.jm.min}), sealed, 'the sealed result never changes');
    const jmGoals = pFix.jm.res === 'goal' ? 1 : 0;
    assert.equal(pFix.gu, 2, 'the chance never invents a goal for the team');
    const moment = window.S.feed.find((e) => e.t === 'moment' && e.tipo === 'real');
    assert.ok(moment, 'the move leaves a real match event in the feed');
    assert.match(String(moment.txt), /Gol|portero|defensa|palo|fuera|Pérdida/, 'the match event narrates the move outcome');
    assert.equal(window.playPlayerFixture(pFix), 'ok', 'the player match finishes after the move');
    assert.equal(pFix.mg, jmGoals, 'only a won move counts as the player goal');
    assert.equal(PS.p.ss.g, jmGoals, 'the player goal lands in the season stats');
    /* la pausa sobrevive al guardado y también se puede dejar al equipo */
    const pFix3 = nextPlayerFixture(PS);
    assert.equal(window.playPlayerFixture(pFix3), 'pause', 'a second player match pauses on its chance');
    const paySeed = pFix3.jm.seed;
    window.restore(window.serialize());
    const S3 = window.S, restored3 = S3.cur.pm[S3.cur.pi];
    assert.equal(restored3.jm.seed, paySeed, 'the sealed seed and the pause survive a save and load');
    assert.equal(S3.pend.filter((x) => x.k === 'jmm').length, 1, 'the saved pause waits as a pending moment');
    window.UIX.ui().view = 'game'; window.UIX.render(true);
    await wait(150);
    document.querySelector('[data-a="jmauto"]').click();
    await wait(150);
    assert.ok(restored3.jm.done, 'the team can resolve the saved chance');
    assert.equal(S3.pend.filter((x) => x.k === 'jmm').length, 0, 'the saved chance clears its pending moment');

    /* apagada, la misma carrera no pausa ni produce eventos de jugada maestra */
    mkPlayer(undefined);
    assert.equal(window.S.set.jm, 0, 'the switch can stay off');
    const S2 = window.S;
    S2.pend = [];
    const fixture2 = nextPlayerFixture(S2);
    assert.equal(window.playPlayerFixture(fixture2), 'ok', 'with Master Play off the player match plays out as before, without pausing');
    assert.equal(fixture2.jm, undefined, 'with Master Play off no chance is sealed');
    assert.equal(S2.pend.filter((x) => x.k === 'jmm').length, 0, 'with Master Play off nothing pauses');

    /* ---- 6. el panel: pausa clara, acciones y vuelta al partido ---- */
    const ui = startLive({jm: 1});
    ui.L.min = 20; ui.L.bx = 92; ui.L.own = 0;
    window.UIX.openLive();
    await waitFor(() => document.getElementById('live'), 'live view');
    const speed = document.querySelector('[data-a="lspeed"][data-v="3"]');
    if (speed) speed.click();
    await waitFor(() => document.getElementById('jml-ov'), 'Master Play panel', 40000);
    const panel = document.getElementById('jml-ov');
    assert.match(panel.textContent, /Jugada Maestra/, 'the panel identifies the feature');
    assert.match(panel.textContent, /pausa/, 'the panel states that the match is paused');
    assert.ok(ui.L.ev.some((e) => e.t === 'jm'), 'the live commentary announces the pause');
    assert.ok(ui.L.ev.filter((e) => e.t === 'jm').length === 1, 'the pause is announced once');
    assert.ok(panel.querySelector('svg.jm-field[data-jm="live"]'), 'the panel draws the match pitch');
    assert.ok(panel.querySelector('[data-jml="shot"]'), 'the panel offers a shot action');
    assert.ok(panel.querySelector('[data-jml="auto"]'), 'the panel offers an assisted resolution');
    const pass = panel.querySelector('[data-jml="pass"]:not([disabled])');
    if (pass) { pass.click(); await wait(60); }
    assert.ok(ui.L.jm.st.turn >= 0, 'the assisted pass advances the play');
    for (let i = 0; i < 4 && !ui.L.jm.done; i++) {
      const shot = document.querySelector('[data-jml="shot"]');
      if (!shot) break;
      shot.click();
      await wait(60);
    }
    assert.ok(ui.L.jm.done, 'the panel resolves the play');
    const back = document.querySelector('[data-jml="back"]');
    assert.ok(back, 'the panel offers a way back to the match');
    back.click();
    await waitFor(() => !document.getElementById('jml-ov'), 'panel close');
    assert.ok(document.getElementById('live'), 'the live match stays open');
    const minAfter = ui.L.min;
    await wait(500);
    assert.ok(ui.L.min >= minAfter, 'the match resumes after the panel');
    window.liveFinish();
    window.UIX.closeLive ? window.UIX.closeLive() : document.getElementById('live')?.remove();

    assert.deepEqual(errors, [], `no runtime errors: ${errors.join(' | ')}`);
    console.log('Jugada Maestra match tests passed: opt-in switch, live parity when off, sealed single resolution, stats and goal events, deterministic replay, pause panel and resume, and the player career with and without the switch.');
    process.exit(0);
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    process.exit(1);
  }
})();
