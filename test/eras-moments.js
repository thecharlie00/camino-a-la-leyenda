/* Modo Épocas fase 7: momentos de leyenda (objetivos, tandas, ayuda), Álbum de los 80 (cromos, repetidos)
   y recompensas que se entregan fuera del modo. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM, VirtualConsole } from 'jsdom';

const html = readFileSync('dist/android/jugar/juego.html', 'utf8');
const errors = [];
const virtualConsole = new VirtualConsole();
virtualConsole.on('jsdomError', (error) => errors.push(`jsdom: ${error.message}`));
const dom = new JSDOM(html, {
  url: 'https://eras-competitions.local/', runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole,
  beforeParse(window) {
    window.matchMedia = () => ({matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}});
    window.scrollTo = () => {};
    window.requestAnimationFrame = (callback) => setTimeout(() => callback(Date.now()), 16);
    window.cancelAnimationFrame = clearTimeout;
    window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
    window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
    window.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, {get: () => () => ({addColorStop() {}})});
    window.fetch = () => Promise.resolve({ok: true, status: 200, text: () => Promise.resolve('{"entries":[]}')});
  }
});
const {window} = dom;
const start = Date.now();
while (!(window.UIX && window.eraStartCareer && window.EraMoments && window.UIX.eraMomentsButtons)) {
  if (Date.now() - start > 30000) throw new Error('game did not boot');
  await new Promise((resolve) => setTimeout(resolve, 20));
}
const EM = window.EraMoments;
const J = (x) => JSON.parse(JSON.stringify(x));
assert.equal(EM.list.length, 18, 'three legend moments per decade');
for (const d of ['1970s', '1980s', '1990s', '2000s', '2010s', '2020s']) assert.equal(EM.list.filter((m) => m.decade === d).length, 3);
assert.equal(EM.allCards().length, 24, 'the 1980s album has four pages of six stickers');

/* tanda: reglas de cinco y muerte súbita */
const P = (a, b) => ({k: [a, b]});
assert.equal(EM.pensDecided(P([1, 1, 1], [0, 0, 0])), 0, '3-0 after three rounds is over');
assert.equal(EM.pensDecided(P([1, 1, 1, 1, 1], [1, 1, 1, 1, 1])), null, '5-5 goes to sudden death');
assert.equal(EM.pensDecided(P([1, 1, 1, 1, 1, 0], [1, 1, 1, 1, 1, 1])), 1, 'sudden death');
assert.equal(EM.pensDecided(P([1, 1, 0, 1], [1, 1, 1, 1])), null, 'still alive after four');

/* objetivos: recrear y reescribir desde perspectivas opuestas */
const m99 = EM.byId('m1999-cl-final');
let st = EM.initState(m99, 'recreate');
assert.deepEqual(J(st.s), [0, 1]); assert.equal(st.you, 0);
st.s = [2, 1]; st.add = [2, 0];
let res = J(EM.score(m99, st));
assert.equal(res.ok, true); assert.equal(res.stars, 4, 'main + noET + score2 + noDefend');
st = EM.initState(m99, 'rewrite'); st.s = [0, 1];
assert.equal(EM.score(m99, st).ok, true, 'rewriting: Bayern hold on');
const m89 = EM.byId('m1989-title-decider');
st = EM.initState(m89, 'recreate'); st.s = [1, 0];
assert.equal(EM.score(m89, st).ok, false, 'a one-goal win is not enough in 1989');
st.s = [2, 0]; assert.equal(EM.score(m89, st).ok, true);
st = EM.initState(m89, 'rewrite'); st.s = [1, 0]; assert.equal(EM.score(m89, st).ok, true, 'rewriting 1989: avoid a two-goal defeat');

/* recompensas: bloqueadas hasta completar los momentos de la década */
assert.ok(window.GXI.item('r70_socks'), 'retro pieces are in the catalogue');
window.localStorage.removeItem('camino.eras.meta'); window.EraMeta.reset();
const lock = () => J(window.GXI.lock(window.GXI.item('r70_socks')));
assert.equal(lock().k, 'era', 'locked before playing the 1970s moments');
assert.match(window.eraLockText(lock()), /70/);
for (const m of EM.list.filter((x) => x.decade === '1970s')) {
  const s = EM.initState(m, 'recreate');
  if (m.kind === 'match') s.s = [s.s[0] + 3, s.s[1]]; else s.pensWinner = 0;
  const got = J(EM.record(m, s, EM.score(m, s)));
  if (m === EM.list.filter((x) => x.decade === '1970s')[2]) assert.deepEqual(got.rewards, ['r70_socks']);
}
assert.equal(window.GXI.lock(window.GXI.item('r70_socks')), null, 'unlocked for every save');
assert.ok(JSON.parse(window.localStorage.getItem('camino.eras.meta')).rew.r70_socks, 'stored outside the careers');

/* álbum: los momentos de los 80 dan su cromo; los repetidos se cambian */
const m86 = EM.byId('m1986-ec-final'); st = EM.initState(m86, 'recreate'); st.pensWinner = 0;
assert.deepEqual(J(EM.record(m86, st, EM.score(m86, st))).cards, ['m_ec86']);
for (let i = 0; i < 5; i++) EM.addCard('c_ec');
assert.equal(EM.dupes(), 4);
assert.equal(EM.swap('c_cwc'), true); assert.equal(EM.dupes(), 0);
assert.equal(EM.swap('c_uefa'), false, 'no duplicates left');

/* cromos en una carrera de Épocas de los 80 y entrega de piezas en una carrera moderna */
window.eval("ERA_CREATE_CONTEXT = null; eraStartCareer('manager', 1985, {firstName: 'Album', lastName: 'Test', clubName: 'Liverpool'}); for (let w = 0; w <= 45; w++) weekFixtures(w).forEach(f => { const r = simFixture(f); if (r) recordFixture(f, r); }); seasonEndWorld();");
const cards = Object.values(JSON.parse(window.localStorage.getItem('camino.eras.meta')).cards).reduce((a, b) => a + b, 0);
assert.ok(cards >= 1 + 1 + 2, 'two stickers per 1980s season');
window.eval("S.era = null; UIX.render(true);");
assert.equal(window.eval("GXI.owned('r70_socks','p') || !S.p"), true, 'earned pieces are handed over outside the mode');

/* interfaz: un momento completo con los minijuegos simulados */
window.Minigame.penalty = (o, done) => setTimeout(() => done({p: 0.5, scored: true}), 0);
window.Minigame.freekick = window.Minigame.penalty;
window.Minigame.gkPenalty = (o, done) => setTimeout(() => done({saved: true, scored: false}), 0);
const click = (sel) => { const b = window.document.querySelector(sel); assert.ok(b, `missing ${sel}`); b.click(); };
const wait = () => new Promise((r) => setTimeout(r, 5));
const btn = window.document.createElement('button'); btn.setAttribute('data-mo-act', 'open'); window.document.body.appendChild(btn); btn.click();
assert.match(window.document.getElementById('era-overlay').textContent, /Momentos de leyenda/);
click('[data-mo-act="dec"][data-mo-v="2000s"]');
click('[data-mo-act="intro"][data-mo-v="m2005-cl-final|recreate"]');
assert.match(window.document.getElementById('era-overlay').textContent, /0-3/);
click('[data-mo-act="go"]');
for (let i = 0; i < 40 && !window.document.querySelector('[data-mo-act="list"]'); i++) {
  const b = window.document.querySelector('[data-mo-act="tac"][data-mo-v="att"], [data-mo-act="shoot"], [data-mo-act="kick"]');
  if (b) b.click();
  await wait();
}
assert.match(window.document.getElementById('era-overlay').textContent, /Resultado/, 'the moment reaches its result screen');
click('[data-mo-act="list"]'); click('[data-mo-act="dec"][data-mo-v="1980s"]'); click('[data-mo-act="intro"][data-mo-v="m1986-ec-final|rewrite"]'); click('[data-mo-act="go"]');
for (let i = 0; i < 30 && !window.document.querySelector('[data-mo-act="list"]'); i++) { const b = window.document.querySelector('[data-mo-act="kick"]'); if (b) b.click(); await wait(); }
assert.match(window.document.getElementById('era-overlay').textContent, /Resultado/);
click('[data-mo-act="list"]'); click('[data-mo-act="album"]');
assert.match(window.document.getElementById('era-overlay').textContent, /de 24 cromos/);
click('[data-mo-act="close"]');
assert.deepEqual(errors.filter((e) => !/toDataURL/.test(e)), []);
console.log('eras-moments ok');
window.close();
