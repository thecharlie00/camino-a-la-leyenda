/* Modo Épocas fase 9: partido en 3D y minijuegos con el aspecto y las reglas de su año; sin Épocas no cambia nada. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM, VirtualConsole } from 'jsdom';

const html = readFileSync('dist/android/jugar/juego.html', 'utf8');
const errors = [];
const virtualConsole = new VirtualConsole();
virtualConsole.on('jsdomError', (error) => errors.push(`jsdom: ${error.message}`));
const dom = new JSDOM(html, {
  url: 'https://eras-scene.local/', runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole,
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
while (!(window.UIX && window.eraStartCareer && window.eraScene3D && window.Pitch3D)) {
  if (Date.now() - start > 30000) throw new Error('game did not boot');
  await new Promise((resolve) => setTimeout(resolve, 20));
}
const J = (x) => JSON.parse(JSON.stringify(x));
const ev = (code) => J(window.eval(code));
assert.equal(ev('eraScene3D()'), null, 'no era, no changes');
const mountEra = () => ev("(function(){ var o = {}; var el = document.createElement('div'); document.body.appendChild(el); try { Pitch3D.mount(el, o); } catch (e) {} var r = o.era; try { Pitch3D.destroy && Pitch3D.destroy(); } catch (e) {} return r; })()");
assert.equal(mountEra(), null, 'a modern match keeps the normal 3D scene');

ev("ERA_CREATE_CONTEXT = null; eraStartCareer('manager', 1975, {firstName: 'Tv', lastName: 'Test', clubName: 'Liverpool'}); 0");
let sc = ev('eraScene3D()');
assert.equal(sc.tv, 'grainy'); assert.equal(sc.numbers, true); assert.equal(sc.staticBoards, true);
assert.deepEqual(sc.ref, [0.04, 0.045, 0.05], 'referee in black in 1975');
assert.ok(sc.ball[0][0] > sc.ball[0][2], 'brown leather ball'); assert.ok(sc.ballDur > 1);
assert.ok(sc.grassMix[3] > 0, 'muddy pitch');
assert.ok(mountEra(), 'the 3D match receives the era scene');
const lines = ev('eraSceneLines(1975).join(" ")');
assert.match(lines, /negro/); assert.match(lines, /portero no puede moverse/);
assert.doesNotMatch(ev("document.createElement('div').innerHTML = '', (function(){ UIX.actions['era-rules'](); var t = document.getElementById('era-overlay').textContent; document.getElementById('era-overlay').remove(); return t; })()"), /aún son referencias/);

/* minijuego en una carrera de 1975: filtro de televisión mientras dura */
window.Minigame.penalty({skill: 80, gk: 70, press: false}, () => {});
assert.ok(window.document.body.classList.contains('era-mg-grainy'), 'TV filter during the minigame');

ev("ERA_CREATE_CONTEXT = null; eraStartCareer('manager', 2005, {firstName: 'Tv', lastName: 'Test', clubName: 'Liverpool'}); 0");
sc = ev('eraScene3D()');
assert.notDeepEqual(sc.ref, [0.04, 0.045, 0.05], 'coloured referee shirts after 1994');
assert.equal(sc.ball, undefined, 'modern ball model from the 2000s');
assert.doesNotMatch(ev('eraSceneLines(2005).join(" ")'), /portero no puede moverse/);
assert.deepEqual(errors.filter((e) => !/toDataURL|getContext|WebGL/i.test(e)), []);
console.log('eras-scene ok');
window.close();
