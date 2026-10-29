import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM, VirtualConsole } from 'jsdom';

const html = readFileSync('dist/android/jugar/juego.html', 'utf8');
const errors = [];
const virtualConsole = new VirtualConsole();
virtualConsole.on('jsdomError', (error) => errors.push(`jsdom: ${error.message}`));
virtualConsole.on('error', (...args) => errors.push(`console: ${args.join(' ')}`));

const dom = new JSDOM(html, {
  url: 'https://game-smoke.local/',
  runScripts: 'dangerously',
  resources: 'usable',
  pretendToBeVisual: true,
  virtualConsole,
  beforeParse(window) {
    window.matchMedia = () => ({matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}});
    window.scrollTo = () => {};
    window.requestAnimationFrame = (callback) => setTimeout(() => callback(Date.now()), 16);
    window.cancelAnimationFrame = clearTimeout;
    window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
    window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
    window.HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,';
    window.HTMLCanvasElement.prototype.getContext = function () {
      const methods = {
        measureText: (text) => ({width: String(text).length * 6}),
        createLinearGradient: () => ({addColorStop() {}}),
        createRadialGradient: () => ({addColorStop() {}}),
        getImageData: () => ({data: new Uint8ClampedArray(4)}),
        createPattern: () => null
      };
      return new Proxy(methods, {get: (target, key) => key in target ? target[key] : () => {}});
    };
    window.addEventListener('error', (event) => errors.push(`window: ${event.error?.stack || event.message}`));
  }
});

const {window} = dom;
assert.ok(window.document.querySelector('.boot-screen'), 'loading screen should be visible while the game modules are booting');
const waitFor = async (predicate, description) => {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > 30000) throw new Error(`Timed out waiting for ${description}`);
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
};
const click = (selector) => {
  const button = window.document.querySelector(selector);
  assert.ok(button, `Missing interactive element ${selector}`);
  button.click();
};

try {
  await waitFor(() => window.UIX && window.UIX.ui().view === 'lang' &&
    window.document.querySelectorAll('script[id^="camino-module-"]').length === 0, 'game boot');
  const app = window.document.getElementById('app');
  assert.match(app.textContent, /Español/);
  assert.equal(window.I18N_LOADED.en, undefined, 'non-selected dictionaries should not execute at launch');

  click('[data-a="setlang"][data-v="es"]');
  assert.equal(window.UIX.ui().view, 'home');
  for (const [language, expected] of [['en', 'New game'], ['de', 'Neues Spiel'], ['it', 'Nuova partita'], ['fr', 'Nouvelle partie']]) {
    click('[data-a="golang"]');
    click(`[data-a="setlang"][data-v="${language}"]`);
    assert.equal(window.tr('Nueva partida'), expected);
    assert.equal(window.I18N_LOADED[language], true);
    assert.equal(window.document.getElementById(`camino-i18n-${language}`), null, `${language} payload should be released after loading`);
  }
  assert.ok(app.textContent.includes('Joueur, entraîneur ou ton propre club'));

  window.FEM = true;
  window.tr('Jugadora');
  assert.equal(window.I18N_F_LOADED, true, 'female translations should load when first needed');
  assert.equal(window.document.getElementById('camino-i18n-fem'), null);
  window.FEM = false;
  click('[data-a="golang"]');
  click('[data-a="setlang"][data-v="es"]');

  const models = window.Pitch3DAssets.loadEmbedded();
  assert.ok(models.ok >= 12, `Expected all embedded GLB assets to parse, got ${models.ok}`);
  assert.equal(models.errors.length, 0, `Invalid embedded GLB assets: ${models.errors.join(', ')}`);
  assert.equal(window.document.getElementById('pitch3d-asset-pack'), null, 'parsed model payload should be released');

  window.localStorage.setItem('camino.slots', '[]');
  click('[data-a="era-open"]');
  assert.equal(window.document.querySelectorAll('[data-era-field="pack"] option').length, 6);
  assert.equal(window.document.querySelectorAll('[data-era-field="year"] option').length, 10);
  click('[data-era-act="start"]');
  assert.equal(window.S.era.active, true);
  assert.equal(window.S.yr, 1992);
  assert.equal(window.EraStore.save(), true);
  assert.equal(window.localStorage.getItem('camino.slots'), '[]', 'Era saves must not touch modern saves');
  assert.ok(window.localStorage.getItem('camino.eras.v1.index'));
  click('[data-a="era-exit"]');
  assert.equal(window.S, null);
  assert.equal(window.UIX.ui().view, 'home');

  click('[data-a="newgame"]');
  click('[data-a="pickmode"][data-v="p"]');
  for (const [selector, value] of [['#fn', 'Smoke'], ['#ln', 'Jugador']]) {
    const input = window.document.querySelector(selector);
    input.value = value;
    input.dispatchEvent(new window.Event('input', {bubbles: true}));
  }
  click('[data-a="cnext"]');
  click('[data-a="cnext"]');
  click('[data-a="cnext"]');
  click('[data-a="cclub"]');
  click('[data-a="cnext"]');
  assert.ok(window.S.p, 'modern player career should start through the existing creation flow');
  assert.equal(window.S.era, undefined, 'modern careers must not inherit Era Mode state');
  assert.ok(window.localStorage.getItem('camino.slots') !== '[]', 'modern save index should continue to work');

  const skipTutorial = window.document.querySelector('[data-a="tutoff"]');
  if (skipTutorial) skipTutorial.click();
  const skipFamily = window.document.querySelector('[data-a="famnone"]');
  if (skipFamily) skipFamily.click();
  const firstDecision = window.document.querySelector('[data-a="choose"]');
  assert.ok(firstDecision, 'a new player career should present its first decision');
  firstDecision.click();
  assert.ok(window.S, 'resolving a career decision should keep the save active');
  click('[data-a="menu"]');
  click('[data-a="home"]');
  click('[data-a="newgame"]');
  click('[data-a="pickmode"][data-v="mgr"]');
  for (const [selector, value] of [['#fn', 'Smoke'], ['#ln', 'Manager']]) {
    const input = window.document.querySelector(selector);
    input.value = value;
    input.dispatchEvent(new window.Event('input', {bubbles: true}));
  }
  click('[data-a="cnext"]');
  click('[data-a="cnext"]');
  click('[data-a="cclub"]');
  click('[data-a="cnext"]');
  await waitFor(() => window.S?.m && window.UIX.ui().view === 'game', 'manager career creation');
  assert.ok(window.S.m.club >= 0, 'manager creation should assign the selected club');
  assert.equal(window.S.era, undefined, 'modern manager careers must remain outside Era Mode');

  click('[data-a="menu"]');
  click('[data-a="home"]');
  click('[data-a="newgame"]');
  click('[data-a="pickmode"][data-v="club"]');
  const clubName = window.document.querySelector('#cn');
  clubName.value = 'Club Smoke';
  clubName.dispatchEvent(new window.Event('input', {bubbles: true}));
  click('[data-a="cnext"]');
  click('[data-a="cnext"]');
  click('[data-a="cnext"]');
  for (const [selector, value] of [['#fn', 'Smoke'], ['#ln', 'President']]) {
    const input = window.document.querySelector(selector);
    input.value = value;
    input.dispatchEvent(new window.Event('input', {bubbles: true}));
  }
  click('[data-a="cnext"]');
  await waitFor(() => window.S?.custom && window.UIX.ui().view === 'draft', 'custom club creation');
  assert.equal(window.S.custom.n, 'Club Smoke');
  click('[data-a="startclub"]');
  assert.equal(window.UIX.ui().view, 'game', 'custom club roster draft should start a season');
  assert.ok(window.S.m.sq.length >= 18, 'custom club should have a generated squad');
  assert.deepEqual(errors, [], `Unexpected runtime errors: ${errors.join('\n')}`);
  console.log('Runtime smoke passed: boot, five locales, GLB assets, Era isolation, player decisions, manager and custom-club creation.');
} finally {
  window.close();
}
