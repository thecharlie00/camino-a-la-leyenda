const assert = require('node:assert/strict');
const fs = require('node:fs');
const {JSDOM} = require('jsdom');

const siteJs = fs.readFileSync('site.js', 'utf8');
const urls = {
  abscloud: 'https://abscloud.org/1/88abf9d555a4a30b9f834a14f05cfd91',
  bauval14: 'https://bauval.org/14/658905d412d2a8d77d2857f1d878c9e6',
  banner: 'https://bauval.org/22/b4c1dc5f8033cebc60622af9c1b9e516',
};

function boot({game = false, width = 1024} = {}) {
  const dom = new JSDOM(`<!doctype html><html lang="es"><body${game ? ' class="play"' : ''}>
    <button data-consent>Cookies</button>
    ${game ? '' : '<span hidden data-network-ads></span>'}
    <div data-bauval-banner></div>
  </body></html>`, {url: 'https://futbolroadtolegend.com/', runScripts: 'outside-only'});
  Object.defineProperty(dom.window, 'innerWidth', {value: width, configurable: true});
  dom.window.eval(siteJs);
  return dom;
}

const home = boot();
const homeDoc = home.window.document;
assert.ok(homeDoc.querySelector('.site-consent'), 'first visit should ask for consent');
assert.equal(homeDoc.querySelectorAll('script[src*="abscloud.org"],script[src*="bauval.org"]').length, 0,
  'ad vendors must not load before consent');
homeDoc.querySelector('[data-consent-choice="no"]').click();
assert.equal(JSON.parse(home.window.localStorage.getItem('camino.webconsent.v1')).ads, false);
assert.equal(homeDoc.querySelectorAll('script[src*="abscloud.org"],script[src*="bauval.org"],script[src*="googletagmanager.com"]').length, 0,
  'rejecting optional services must block ads and analytics');
homeDoc.querySelector('[data-consent]').click();
homeDoc.querySelector('[data-consent-choice="yes"]').click();
assert.equal(homeDoc.querySelectorAll(`script[src="${urls.abscloud}"]`).length, 1);
assert.equal(homeDoc.querySelectorAll(`script[src="${urls.bauval14}"]`).length, 1);
assert.equal(homeDoc.querySelectorAll(`script[src="${urls.banner}"]`).length, 1);
assert.equal(homeDoc.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]').length, 1);
home.window.close();

const game = boot({game: true});
const gameDoc = game.window.document;
gameDoc.querySelector('[data-consent-choice="yes"]').click();
assert.equal(gameDoc.querySelectorAll(`script[src="${urls.abscloud}"],script[src="${urls.bauval14}"]`).length, 0,
  'popup-capable site tags must not be loaded on the web-game page');
assert.equal(gameDoc.querySelectorAll(`script[src="${urls.banner}"]`).length, 1,
  'the non-interruptive banner can load outside the game after consent');
game.window.close();

const phone = boot({width: 390});
phone.window.document.querySelector('[data-consent-choice="yes"]').click();
assert.equal(phone.window.document.querySelectorAll(`script[src="${urls.banner}"]`).length, 0,
  'fixed 728x90 banner must not load into a narrow mobile layout');
phone.window.close();

console.log('Web ad scripts stay consent-gated; pop-capable tags never load on the game page.');
