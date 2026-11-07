/* Google Play Juegos: los logros desbloqueados se envían una vez a Play con su misma clave; el paquete de Play Console está al día. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM, VirtualConsole } from 'jsdom';

const html = readFileSync('dist/android/jugar/juego.html', 'utf8');
const errors = [];
const virtualConsole = new VirtualConsole();
virtualConsole.on('jsdomError', (error) => errors.push(`jsdom: ${error.message}`));
const dom = new JSDOM(html, {
  url: 'https://pgs.local/', runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole,
  beforeParse(window) {
    window.matchMedia = () => ({matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}});
    window.scrollTo = () => {};
    window.requestAnimationFrame = (callback) => setTimeout(() => callback(Date.now()), 16);
    window.cancelAnimationFrame = clearTimeout;
    window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
    window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
    window.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, {get: () => () => ({addColorStop() {}})});
    /* puente de Android simulado con Play Juegos con sesión iniciada */
    window.__pgs = [];
    window.AndroidBridge = {pgsState: () => window.__pgsState || 'in', pgsUnlock: (k) => { if ((window.__pgsState || 'in') !== 'in') return false; window.__pgs.push(k); return true; }, pgsShow: () => { window.__pgsShown = (window.__pgsShown || 0) + 1; }};
    window.fetch = () => Promise.resolve({ok: true, status: 200, text: () => Promise.resolve('{"entries":[]}')});
  }
});
const {window} = dom;
const start = Date.now();
while (!(window.UIX && window.PGS && window.UIX.sheets && window.UIX.sheets.ach && window.newCareer)) {
  if (Date.now() - start > 30000) throw new Error('game did not boot');
  await new Promise((resolve) => setTimeout(resolve, 20));
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
/* sin sesión no se envía nada y se reintenta después */
window.__pgsState = 'out';
window.eval("newCareer({fn: 'Pgs', ln: 'Test', nat: 'ES', pos: 'DC', foot: 'Diestro', age: 17, talent: 'joya', club: -1, ev: 2}); S.ach = S.ach || {}; S.ach.p_debut = S.yr; S.ach.p_g1 = S.yr; UIX.render(true);");
await wait(100);
assert.equal(window.PGS.sync(), 0);
assert.deepEqual([...window.__pgs], []);
/* con sesión: cada logro desbloqueado se envía una sola vez, con su misma clave */
window.__pgsState = 'in';
assert.equal(window.PGS.sync(), 2);
assert.deepEqual([...window.__pgs].sort(), ['p_debut', 'p_g1']);
assert.equal(window.PGS.sync(), 0, 'already sent');
window.eval("S.ach.p_g10 = S.yr;");
window.pgsSync();
assert.deepEqual([...window.__pgs].sort(), ['p_debut', 'p_g1', 'p_g10']);
assert.ok(JSON.parse(window.localStorage.getItem('camino.pgs.sent')).p_g10, 'remembered across sessions');
/* botón en la pantalla de trofeos */
assert.match(window.UIX.sheets.ach(), /data-a="pgsshow"/);
window.UIX.actions.pgsshow();
assert.equal(window.__pgsShown, 1);
window.__pgsState = 'off';
assert.doesNotMatch(window.UIX.sheets.ach(), /data-a="pgsshow"/, 'hidden when Play Games is not configured');
/* un logro solo se anuncia la primera vez en el dispositivo: en otras partidas se desbloquea sin aviso */
window.localStorage.setItem('camino.achG', JSON.stringify({gx_seen_test: {ts: 1}}));
assert.equal(window.achSeenEver('gx_seen_test'), true);
assert.equal(window.achSeenEver('gx_new_test'), false);
window.eval("GX.st().q.length = 0; GX.unlocked([['gx_seen_test'], ['gx_new_test']], false);");
assert.deepEqual([...window.eval('GX.st().q')], ['gx_new_test'], 'repeated achievements are not queued for a notice');
window.eval('GX.st().q.length = 0;');
/* los logros del juego y el paquete de Play Console coinciden */
const master = JSON.parse(readFileSync('store/play-games/logros.json', 'utf8')).achievements;
const ids = window.eval("(function(){ var o = {}; [ACH_P, ACH_M, ACH_ERA, achX('p'), achX('m'), GX.rows('p'), GX.rows('m'), [GX.platRow('p'), GX.platRow('m')]].forEach(function (l) { l.forEach(function (a) { o[a[0]] = 1; }); }); return Object.keys(o); })()");
const keys = new Set(master.map((a) => a.key));
const missing = [...ids].filter((id) => !keys.has(id));
assert.deepEqual(missing, [], 'every game achievement is in store/play-games/logros.json (run tools/pgs-export.cjs + tools/pgs_bundle.py)');
assert.ok(master.reduce((n, a) => n + a.points, 0) <= 2000);
assert.equal(new Set(master.map((a) => a.name.toLowerCase())).size, master.length, 'unique names');
assert.ok(master.every((a) => !a.name.includes(',') && !a.description.includes(',')), 'no commas for Play Console');
assert.deepEqual(errors.filter((e) => !/toDataURL|getContext/i.test(e)), []);
console.log('pgs ok');
window.close();
