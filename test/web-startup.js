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
  assert.deepEqual(errors, [], `Unexpected web startup errors: ${errors.join('\n')}`);
  console.log('Web startup passed: loading screen appears, game boots, splash is replaced.');
} finally {
  window.close();
}
