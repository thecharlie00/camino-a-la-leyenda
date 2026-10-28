import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const output = process.argv[2] || 'dist';
const gamePage = join(output, 'jugar', 'juego.html');
const webPage = join(output, 'index.html');
const engine = join(output, 'camino-engine.js');
const siteRuntime = join(output, 'site.js');
const translatedPage = join(output, 'en', 'index.html');

for (const file of [gamePage, webPage, engine, siteRuntime, translatedPage]) {
  assert.ok(existsSync(file), `Missing build output: ${file}`);
}

const html = readFileSync(gamePage, 'utf8');
assert.match(html, /<div id="root"><\/div>/, 'Game page must mount the React app');
assert.match(html, /<script[^>]+type="module"[^>]+src=/, 'Game page must load the Vite app bundle');
assert.match(readFileSync(engine, 'utf8'), /__camBoot/, 'Legacy game engine must be included');

const assets = join(output, 'assets');
assert.ok(existsSync(assets), 'Vite assets directory is missing');
assert.ok(readdirSync(assets).some((name) => name.endsWith('.js')), 'No JavaScript bundle was emitted');
assert.ok(readdirSync(assets).some((name) => name.endsWith('.css')), 'No CSS bundle was emitted');
assert.ok(statSync(gamePage).size > 100, 'Game HTML output is unexpectedly small');

console.log(`Build smoke test passed: ${output}`);
