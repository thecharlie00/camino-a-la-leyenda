import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM, VirtualConsole } from 'jsdom';

const html = readFileSync('dist/jugar/juego.html', 'utf8');
const errors = [];
const virtualConsole = new VirtualConsole();
virtualConsole.on('jsdomError', (error) => errors.push(`jsdom: ${error.message}`));
virtualConsole.on('error', (...args) => errors.push(`console: ${args.join(' ')}`));

const dom = new JSDOM(html, {
  url: 'https://web-game-smoke.local/',
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
const waitFor = async (predicate, description) => {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > 30000) throw new Error(`Timed out waiting for ${description}`);
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
};

try {
  assert.ok(window.document.querySelector('.boot-screen'), 'loading screen must be visible before game startup');
  await waitFor(() => window.UIX && window.UIX.ui && window.UIX.ui().view === 'lang' &&
    window.document.querySelector('#app main'), 'web game startup');
  assert.equal(window.document.querySelector('.boot-screen'), null, 'loading screen should be replaced by the game UI');
  assert.match(window.document.getElementById('app').textContent, /Español/);
  window.document.querySelector('[data-a="setlang"][data-v="es"]')?.click();
  assert.equal(window.UIX.ui().view, 'home');
  assert.equal(window.document.querySelector('[data-a="era-open"]'), null,
    'Era Mode must not appear as a direct shortcut on the web home screen');
  const homeGroups = [...window.document.querySelectorAll('.home-group')];
  assert.equal(homeGroups.length, 2, 'secondary home actions must be grouped into two compact categories');
  assert.ok(homeGroups.every((group) => !group.open), 'secondary categories should stay collapsed until requested');
  assert.ok(homeGroups[0].querySelector('[data-a="import"]'), 'save import belongs in the saves and settings category');
  assert.ok(homeGroups[1].querySelector('[data-a="guide"]') && homeGroups[1].querySelector('[data-a="hof"]') && homeGroups[1].querySelector('[data-a="ach"]'),
    'guide, hall of fame and achievements belong together in the more category');
  assert.equal(homeGroups[1].querySelector('[data-a="goat"]'), null, 'GOAT Ladder must be removed from the More category');
  const goatEntry = window.document.querySelector('.home-mainhome-slot [data-a="goat"]');
  assert.ok(goatEntry, 'GOAT Ladder must have a direct button on the main menu');
  assert.equal(goatEntry.closest('.home-group'), null, 'the GOAT Ladder main-menu button must remain outside collapsed categories');
  assert.ok(window.document.querySelector('.home-main-actions [data-a="newgame"]'), 'new career remains a primary home action');
  window.document.querySelector('[data-a="newgame"]')?.click();
  assert.equal(window.UIX.ui().view, 'modes');
  assert.ok(window.document.querySelector('[data-a="era-open"]'),
    'Era Mode remains available in the web mode selector');
  assert.deepEqual(errors, [], `Unexpected web startup errors: ${errors.join('\n')}`);
  console.log('Web startup passed: loading screen, home without Era shortcut, selector access and startup.');
} finally {
  window.close();
}
