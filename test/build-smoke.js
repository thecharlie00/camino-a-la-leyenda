import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const output = process.argv[2] || 'dist';
const gamePage = join(output, 'jugar', 'juego.html');
const webPage = join(output, 'index.html');
const siteRuntime = join(output, 'site.js');
const translatedPage = join(output, 'en', 'index.html');

for (const file of [gamePage, webPage, siteRuntime, translatedPage]) {
  assert.ok(existsSync(file), `Missing build output: ${file}`);
}

const html = readFileSync(gamePage, 'utf8');
assert.match(html, /var BUILD = \{v: "5\.8", code: 58,/, 'Game bundle must match app version 5.8 (58)');
const packMatch = html.match(/var P3D_ASSET_PACK = (\{[^;]+\});/);
assert.ok(packMatch, 'Embedded 3D model pack is missing');
const modelPack = JSON.parse(packMatch[1]);
for (const model of ['male_lod1', 'female_lod1', 'goalkeeper_lod1', 'ball_lod1']) {
  assert.ok(modelPack[model]?.length > 1000, `Missing or empty 3D model: ${model}`);
}
assert.match(html, /var Pitch3D = \(function \(\)/, '3D match renderer is missing');
assert.match(html, /var PetWorld = \(function \(\)/, '3D pet world is missing');
assert.match(html, /var PetAudio = \(function \(\)/, 'Pet audio system is missing');
assert.match(html, /var Music = \(function \(\)/, 'Background music system is missing');
assert.match(html, /data-a="bgm"/, 'Background music control is missing');
assert.doesNotMatch(html, /<script\s+[^>]*src=/i, 'Game must be self-contained for WebView/offline use');
assert.ok(!existsSync(join(output, 'camino-engine.js')), 'Stale v5.2 engine bundle must not be published');

const assets = join(output, 'assets');
assert.ok(existsSync(assets), 'Vite assets directory is missing');
assert.ok(readdirSync(assets).some((name) => name.endsWith('.css')), 'No website CSS bundle was emitted');
assert.ok(statSync(gamePage).size > 1_000_000, 'Self-contained 3D game bundle is unexpectedly small');

console.log(`Build smoke test passed: v5.8 (58), music, 3D players, 3D pet, ${Math.round(statSync(gamePage).size / 1024)} KB`);
