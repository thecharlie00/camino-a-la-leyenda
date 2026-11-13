const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {JSDOM} = require('jsdom');
const dom = new JSDOM('<!doctype html><body></body>', {url: 'https://game.example/'});
const U = {
  actions: {}, sheets: {}, hooks: {}, current: '',
  h(value) { return String(value).replace(/[&<>"']/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c])); },
  add(name, render) { this.hooks[name] = render; },
  open(name) { this.current = name; },
  renderSheet() { this.last = this.sheets.jugadamaestra(); },
  persist() {}, ui() { return {}; },
};
const ctx = {window: dom.window, document: dom.window.document, localStorage: dom.window.localStorage, UIX: U,
  tr(s, args = {}) { return String(s).replace(/\{(\w+)\}/g, (_, k) => args[k] == null ? `{${k}}` : args[k]); }};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('legacy-game/src/jugada-maestra.js', 'utf8'), ctx, {filename: 'jugada-maestra.js'});
vm.runInContext(fs.readFileSync('legacy-game/src/ui-jugada-maestra.js', 'utf8'), ctx, {filename: 'ui-jugada-maestra.js'});
let html = U.sheets.jugadamaestra();
assert.equal((html.match(/class="jm-row"/g) || []).length, 30, 'menu renders every campaign challenge');
assert.equal((html.match(/class="jm-chapter"/g) || []).length, 5, 'menu groups the campaign into five chapters');
assert.equal((html.match(/ disabled/g) || []).length, 29, 'only the first challenge starts unlocked');
assert.match(U.hooks.mainhome(), /0\/30/);

// Saves from the original six-challenge release keep their medals and unlock the next challenge.
const done = Object.fromEntries(Array.from({length: 6}, (_, i) => [`jm-${String(i + 1).padStart(2, '0')}`, true]));
const medals = Object.fromEntries(Object.keys(done).map((id) => [id, 2]));
ctx.localStorage.setItem('camino.jugada-maestra.v1', JSON.stringify({v: 1, done, medals}));
html = U.sheets.jugadamaestra();
assert.match(U.hooks.mainhome(), /6\/30/);
const rows = [...html.matchAll(/<button class="jm-row" data-a="jmstart" data-v="([^"]+)"([^>]*)>/g)];
assert.equal(rows.length, 30);
assert.equal(rows[6][1], 'jm-07');
assert.ok(!rows[6][2].includes('disabled'), 'existing six-challenge progress unlocks challenge seven');
assert.ok(rows[7][2].includes('disabled'), 'future challenges remain sequentially locked');
U.actions.jmstart(null, 'jm-07');
assert.match(U.last, /Jugada 7 de 30/);
assert.match(U.last, /Capítulo 2:/);
console.log('Jugada Maestra UI tests passed: 30 entries, chapter grouping, sequential unlocks and six-level save continuity.');
