import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const html = readFileSync('goat-ladder/index.html', 'utf8');
const script = readFileSync('goat-ladder.js', 'utf8');
const appSource = readFileSync('src/App.tsx', 'utf8');
const headerSource = readFileSync('src/components/Header.tsx', 'utf8');
assert.match(headerSource, /const goatLadderHref = lang === 'es' \? '\/goat-ladder\/' : `\/\$\{lang\}\/goat-ladder\/`;/,
  'The React app should link to the canonical GOAT page for the selected language');
assert.match(headerSource, /href=\{goatLadderHref\}/);
assert.doesNotMatch(headerSource, /setActiveView\('goat'\)/,
  'The GOAT navigation must not open the disconnected local demo');
assert.doesNotMatch(appSource, /GoatLadderView/,
  'The React app must not render the old fake GOAT leaderboard');
const dom = new JSDOM(html, {runScripts: 'outside-only', url: 'https://example.test/goat-ladder/'});
const {window} = dom;
window.GOAT_API_URL = 'https://api.example.test';
window.console.error = () => {};
const nativeSetTimeout = window.setTimeout.bind(window);
window.setTimeout = (callback, delay, ...args) => nativeSetTimeout(callback, delay === 15000 ? 5 : delay, ...args);
const calls = [];
let requestCount = 0;
window.fetch = (url, options) => {
  calls.push({url, options});
  requestCount++;
  if (requestCount === 1) return Promise.reject(new TypeError('network unavailable'));
  if (requestCount === 5) return new Promise(() => {});
  const parsed = new URL(url);
  if (parsed.pathname.endsWith('/careers') && parsed.searchParams.get('timeframe') === '7d') {
    return Promise.resolve({ok: true, status: 200, json: () => Promise.resolve({entries: []})});
  }
  if (parsed.pathname.endsWith('/careers')) {
    return Promise.resolve({ok: true, status: 200, json: () => Promise.resolve({entries: [{
      game_mode: 'player', title: 'Career test', display_name: 'Test Player', current_club: 'Ribera',
      started_season: 2025, latest_season: 2026, metrics: {appearances: 40, goals: 18}, history: []
    }]})});
  }
  return Promise.resolve({ok: true, status: 200, json: () => Promise.resolve({entries: [{
    event_type: 'match', game_mode: 'player', goat_score: 80, title: 'Achievement test',
    display_name: 'Test Player', club_name: 'Ribera', competition_name: 'League', metrics: {goals: 3}
  }]})});
};
window.eval(script);
const pause = () => new Promise((resolve) => window.setTimeout(resolve, 0));

await pause();
assert.match(window.document.getElementById('goat-status').textContent, /No se pudo cargar/);
assert.equal(window.document.getElementById('goat-retry').hidden, false, 'failed requests should expose retry');
window.document.getElementById('goat-retry').click();
await pause();
assert.equal(calls.length, 2, 'retry should actually issue a second request');
assert.match(calls[0].url, /\/api\/goat-ladder\/careers\?/);
assert.equal(new URL(calls[1].url).searchParams.get('metric'), 'appearances');
assert.match(window.document.getElementById('goat-entries').textContent, /Test Player/);
assert.equal(window.document.getElementById('goat-retry').hidden, true);

window.document.querySelector('[data-period="7d"]').click();
await pause();
assert.equal(new URL(calls[2].url).searchParams.get('timeframe'), '7d', 'time filters should reload the selected period');
assert.match(window.document.getElementById('goat-status').textContent, /Aún no hay carreras/);

window.document.querySelector('[data-board="achievements"]').click();
await pause();
assert.match(calls[3].url, /\/api\/goat-ladder\?/);
assert.match(window.document.getElementById('goat-entries').textContent, /Achievement test/);

window.document.querySelector('[data-period="30d"]').click();
await new Promise((resolve) => nativeSetTimeout(resolve, 15));
assert.match(window.document.getElementById('goat-status').textContent, /demasiado/);
assert.equal(window.document.getElementById('goat-retry').hidden, false, 'timed-out requests should expose retry');
window.document.getElementById('goat-retry').click();
await pause();
assert.match(window.document.getElementById('goat-entries').textContent, /Achievement test/);

dom.window.close();
console.log('GOAT Ladder page passed: retry, timeout, live API rendering, timeframe and board filters.');
