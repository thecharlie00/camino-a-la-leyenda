/* Modo Épocas: el calendario de cada año usa las competiciones que existían, con su nombre y formato de época
   (erascene/competitions.json). Construye temporadas clave y los torneos de selecciones de cada edición. */
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
while (!(window.UIX && window.eraStartCareer && window.EraComps)) {
  if (Date.now() - start > 30000) throw new Error('game did not boot');
  await new Promise((resolve) => setTimeout(resolve, 20));
}
const seasonOf = (year) => {
  window.eval(`ERA_CREATE_CONTEXT = null; eraStartCareer('manager', ${year}, {firstName: 'Era', lastName: 'Test', clubName: 'Real Madrid'});`);
  const comps = {};
  for (const [key, comp] of Object.entries(window.S.C)) if (!/^(CUP|SC):/.test(key)) comps[key] = {n: comp.n, typ: comp.typ, teams: (comp.teams || []).length, groups: comp.g ? comp.g.length : 0};
  return comps;
};
const playSeason = () => window.eval('for (let w = 0; w <= 45; w++) weekFixtures(w).forEach(f => { const r = simFixture(f); if (r) recordFixture(f, r); }); [S.C.UCL.win, S.C.UEL.win]');

let c = seasonOf(1975);
assert.equal(c.UCL.n, 'Copa de Europa'); assert.equal(c.UCL.typ, 'ko'); assert.equal(c.UCL.teams, 32, 'the European Cup is a 32-team knockout');
assert.equal(c.UEL.n, 'Copa UEFA'); assert.equal(c.UEL.teams, 64, 'the UEFA Cup had 64 teams');
assert.equal(c.UCWC?.n, 'Recopa de Europa', 'the Cup Winners\' Cup exists in 1975');
assert.equal(c.UECL, undefined, 'no Conference League in 1975'); assert.equal(c.SUD, undefined, 'no Copa Sudamericana in 1975');
assert.equal(c.ACL.n, 'Copa de Campeones de Asia');
const winners = playSeason();
assert.ok(winners.every((w) => w >= 0), 'the 1975 European competitions finish with a winner');
const holders = window.eval('const L = S.last.cont || {}; seasonEndWorld(); S.yr++; setupSeasonComps(); [S.C.USC && S.C.USC.ko.r[0].W.length, S.C.ICC && S.C.ICC.ko.r[0].W.length, S.C.USC && S.C.USC.ko.r[0].ties[0].b === S.last.cont.UCWC]');
assert.deepEqual(JSON.parse(JSON.stringify(holders)), [2, 2, true], 'in 1976 the Super Cup (vs the Cup Winners\' Cup holder) and the Intercontinental are two-legged');

c = seasonOf(1994);
assert.equal(c.UCL.n, 'Champions League'); assert.equal(c.UCL.typ, 'grp'); assert.equal(c.UCL.groups, 4); assert.equal(c.UCL.teams, 16);
assert.ok(c.UCWC && c.CCMB, 'Cup Winners\' Cup and Copa Conmebol exist in 1994');
assert.equal(c.NL, undefined, 'no Nations League before 2018');
c = seasonOf(1998);
assert.equal(c.UCL.groups, 6, '1997-98 and 1998-99 had six groups'); assert.ok(c.UCWC, 'the last Cup Winners\' Cup was 1998-99');
c = seasonOf(2005);
assert.equal(c.UCWC, undefined, 'no Cup Winners\' Cup after 1999'); assert.equal(c.UEL.n, 'Copa UEFA'); assert.ok(c.SUD, 'Copa Sudamericana since 2002');
assert.equal(c.CCMB, undefined);
c = seasonOf(2021);
assert.equal(c.UEL.n, 'Europa League'); assert.ok(c.UECL, 'Conference League since 2021-22'); assert.equal(c.UCL.typ, 'grp');
c = seasonOf(2025);
assert.equal(c.UCL.typ, 'swiss', 'the 36-team league phase from 2024-25');
for (const [year, key, size] of [[1970, 'WC', 16], [1978, 'WC', 16], [1982, 'WC', 24], [1994, 'WC', 24], [1998, 'WC', 32], [2022, 'WC', 32], [2026, 'WC', 48],
  [1976, 'EURO', 4], [1980, 'EURO', 8], [1996, 'EURO', 16], [2016, 'EURO', 24]]) {
  const t = window.natTournamentsOf(year).find((x) => x.k === key);
  assert.ok(t, `${key} ${year} must exist`); assert.equal(t.size, size, `${key} ${year} had ${size} teams`);
}
assert.equal(window.natTournamentsOf(1977).length, 0, 'no major national tournament in 1977');
assert.ok(!window.natTournamentsOf(2016).some((t) => t.k === 'NLF'), 'no Nations League finals before 2019');
assert.equal(errors.length, 0, errors.join('\n'));
console.log('Era competitions passed: 1975, 1994, 1998, 2005, 2021 and 2025 calendars, Super Cup and Intercontinental, and World Cup/Euro editions.');
window.close();
