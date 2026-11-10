/* Modo Épocas fase 8: estrellas de cada década, mecánica de época, leyenda rival, dinastía y desafíos (también el diario). */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM, VirtualConsole } from 'jsdom';

const html = readFileSync('dist/android/jugar/juego.html', 'utf8');
const errors = [];
const virtualConsole = new VirtualConsole();
virtualConsole.on('jsdomError', (error) => errors.push(`jsdom: ${error.message}`));
const dom = new JSDOM(html, {
  url: 'https://eras-legends.local/', runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole,
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
while (!(window.UIX && window.eraStartCareer && window.EraLegends && window.UIX.eraBookExtra)) {
  if (Date.now() - start > 30000) throw new Error('game did not boot');
  await new Promise((resolve) => setTimeout(resolve, 20));
}
const EL = window.EraLegends;
const J = (x) => JSON.parse(JSON.stringify(x));
const ev = (code) => J(window.eval(code));

/* estrellas: nombres versionados en la plantilla de su club y en su década */
ev("ERA_CREATE_CONTEXT = null; eraStartCareer('manager', 1985, {firstName: 'Leg', lastName: 'Test', clubName: 'Napoli'}); 0");
const star = ev("S.m.sq.filter(p => p.rid && p.rid.indexOf('era*') === 0).map(p => p.fn + ' ' + p.ln)");
assert.deepEqual(star, ['Diego Maradonna'], 'the decade star joins his club in 1985');
assert.ok(EL.starsAt(1985).every((s) => s.ln !== 'Maradona'));
assert.match(EL.starsLine(1985, 'Napoli'), /Maradonna/);

/* mecánica: más ventaja local y menos goles con la cesión permitida */
let sig = ev('EraLegends.signature(1985)');
assert.equal(sig.home, 0.17); assert.equal(sig.thin, 0.93); assert.equal(sig.backPass, true);
sig = ev('EraLegends.signature(1995)'); assert.equal(sig.backPass, false, 'back-pass banned since 1992');
assert.ok(EL.signatureLines(1985).length === 2);
const goals = (era) => ev(`(function(){ var keep = S.era.active; S.era.active = ${era}; var n = 0, h = 0; for (var i = 0; i < 6000; i++) { var g = simGoals(80, 80, 1); n += g[0] + g[1]; h += g[0] - g[1]; } S.era.active = keep; return [n / 6000, h / 6000]; })()`);
const g85 = goals(true), gNow = goals(false);
assert.ok(g85[0] < gNow[0], `fewer goals in 1985 (${g85[0]} vs ${gNow[0]})`);
assert.ok(g85[1] > gNow[1], 'home advantage is larger in 1985');

/* leyenda rival */
const rival = ev('S.era.rival || EraLegends.pickRival()');
assert.ok(rival && rival.name && rival.club !== 'Napoli', 'a rival legend from another club');

/* desafío histórico: club fijo y meta comprobada con la historia de la partida */
window.UIX.startCreate('mgr', {era: {year: 1977, packId: '1970s', challenge: 'ch-forest'}});
assert.equal(ev('UIX.ui().cr.club'), ev("W.cName['Nottingham Forest']"), 'the challenge club is preset');
ev("eraStartFromCreateNow({kind: 'mgr', fn: 'Chal', ln: 'Lenge', nat: 'ENG', age: 40, diff: 1, ev: 1, club: W.cName['Real Madrid'], era: {year: 1977, challenge: 'ch-forest'}}); 0");
assert.equal(ev('W.clubs[S.m.club].n'), 'Nottingham Forest', 'the challenge club cannot be swapped');
assert.equal(ev('S.era.challenge.id'), 'ch-forest');
ev("histPush('UCL', S.yr, S.m.club); 0");
assert.equal(ev('S.era.challenge.done'), 1977);
assert.ok(JSON.parse(window.localStorage.getItem('camino.eras.meta')).ch['ch-forest']);
assert.match(window.UIX.eraBookExtra(false), /conseguido/);

/* desafío diario: misma semilla, mismo reto, sin conexión */
const d1 = J(EL.daily('2026-10-30')), d2 = J(EL.daily('2026-10-30')), d3 = J(EL.daily('2026-10-31'));
assert.deepEqual(d1, d2);
assert.notDeepEqual(d1, d3);
assert.ok(ev(`eraClubExists(${JSON.stringify(d1.club)}, ${d1.year})`), 'the daily club exists in its year');
assert.deepEqual(J(EL.challengeById(d1.id)), d1);

/* dinastía: el hijo hereda apellido e historia */
const dyn = ev('EraLegends.dynastyFrom()');
assert.equal(dyn.gen, 2); assert.equal(dyn.ln, 'Lenge'); assert.ok(dyn.hist.UCL);
ev(`eraStartFromCreateNow({kind: 'p', fn: 'Hijo', ln: 'Lenge', nat: 'ENG', pos: 'DC', foot: 'Diestro', age: 17, talent: 'promesa', ev: 1, club: -1, era: {year: ${dyn.year}, dynasty: ${JSON.stringify(dyn)}}}); 0`);
assert.equal(ev('S.era.dynasty.gen'), 2);
assert.ok(ev('S.hist.UCL.some(e => e[0] === 1977)'), 'the changed history carries over');
assert.match(window.UIX.eraBookExtra(false), /generación 2/);
assert.deepEqual(errors.filter((e) => !/toDataURL/.test(e)), []);
console.log('eras-legends ok');
window.close();
