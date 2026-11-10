/* Pruebas de la página GOAT LADDER publicada: enlaces desde la app React y
   comportamiento del tablero (reintento, timeout, filtros y pintado real).
   Se ejecutan sin navegador:  node test/goat-page.js  */
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
/* el tablero corta a los 15 s: en la prueba se acorta para no esperar */
window.setTimeout = (callback, delay, ...args) => nativeSetTimeout(callback, delay === 15000 ? 5 : delay, ...args);

const CALLS = [
  {url: 'https://api.example.test/api/goat-ladder/careers?mode=player&timeframe=all-time&metric=appearances',
    body: {entries: [{game_mode: 'player', title: 'Career test', display_name: 'Test Player', current_club: 'Ribera',
      started_season: 2025, latest_season: 2026, metrics: {appearances: 40, goals: 18}, history: []}]}},
  {url: 'https://api.example.test/api/goat-ladder/careers?mode=player&timeframe=7d&metric=appearances',
    body: {entries: []}},
  {url: 'https://api.example.test/api/goat-ladder?mode=player&timeframe=7d',
    body: {entries: [{event_type: 'match', game_mode: 'player', goat_score: 80, title: 'Achievement test',
      display_name: 'Test Player', club_name: 'Ribera', competition_name: 'League', metrics: {goals: 3}}]}}
];

/* Mock por escenario: "down" corta la red, "hang" no responde y "up" sirve JSON. */
const calls = [];
let scenario = 'down';
let attempts = 0;
const answerFor = (url) => {
  const match = CALLS.find((item) => item.url === url);
  if (match) return match.body;
  if (url.includes('timeframe=all-time')) return CALLS[0].body;
  if (url.includes('/careers?')) return CALLS[1].body;
  return CALLS[2].body;
};
window.fetch = (url, init) => {
  calls.push(String(url));
  attempts += 1;
  if (scenario === 'down') return Promise.reject(new TypeError('network unavailable'));
  if (scenario === 'hang') {
    /* como el fetch real: al abortar por tiempo, la promesa se rechaza */
    return new Promise((_, reject) => {
      const signal = init && init.signal;
      if (signal) signal.addEventListener('abort', () => {
        const error = new Error('The operation was aborted.');
        error.name = 'AbortError';
        reject(error);
      });
    });
  }
  const body = answerFor(String(url));
  return Promise.resolve({ok: true, status: 200, json: () => Promise.resolve(body)});
};
window.eval(script);

const pause = () => new Promise((resolve) => window.setTimeout(resolve, 0));
const wait = (ms) => new Promise((resolve) => nativeSetTimeout(resolve, ms));
const errorBox = () => window.document.querySelector('#goat-entries .goat-error-state');
const retryButton = () => window.document.querySelector('#goat-entries [data-goat-retry]') ||
  window.document.getElementById('goat-retry');

/* El primer intento cae y se reintenta solo; si la red sigue caída, se avisa. */
await wait(600);
assert.ok(errorBox(), 'a network failure must be explained');
assert.match(errorBox().textContent, /No se pudo conectar con el ranking/);
assert.ok(retryButton(), 'failed requests should expose retry');
assert.equal(attempts, 2, 'a single network failure should be retried once before giving up');

scenario = 'up';
const before = calls.length;
retryButton().click();
await pause();
await pause();
assert.equal(calls.length, before + 1, 'retry should actually issue a new request');
assert.match(calls[before], /\/api\/goat-ladder\/careers\?/);
assert.match(new URL(calls[before]).searchParams.get('metric'), /appearances/);
assert.match(window.document.getElementById('goat-entries').textContent, /Test Player/);
assert.equal(errorBox(), null, 'the error state should clear once data arrives');

window.document.querySelector('[data-period="7d"]').click();
await pause();
await pause();
assert.equal(new URL(calls.at(-1)).searchParams.get('timeframe'), '7d', 'time filters should reload the selected period');
assert.match(window.document.getElementById('goat-entries').textContent, /Aún no hay carreras/);

window.document.querySelector('[data-board="achievements"]').click();
await pause();
await pause();
assert.match(calls.at(-1), /\/api\/goat-ladder\?/, 'achievements use their own endpoint');
assert.match(window.document.getElementById('goat-entries').textContent, /Achievement test/);

scenario = 'hang';
window.document.querySelector('[data-period="30d"]').click();
await wait(80);
assert.match(errorBox().textContent, /demasiado/);
assert.ok(retryButton(), 'timed-out requests should expose retry');

scenario = 'up';
retryButton().click();
await pause();
await pause();
assert.match(window.document.getElementById('goat-entries').textContent, /Achievement test/);

dom.window.close();
console.log('GOAT Ladder page passed: retry, timeout, live API rendering, timeframe and board filters.');
