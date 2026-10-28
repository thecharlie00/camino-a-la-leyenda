import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';

const output = process.argv[2] || 'dist';
const gamePage = join(output, 'jugar', 'juego.html');
const webPage = join(output, 'index.html');
const siteRuntime = join(output, 'site.js');
const translatedPage = join(output, 'en', 'index.html');

for (const file of [gamePage, webPage, siteRuntime, translatedPage]) {
  assert.ok(existsSync(file), `Missing build output: ${file}`);
}

const html = readFileSync(gamePage, 'utf8');
assert.match(html, /var BUILD = \{v: "5\.9", code: 59,/, 'Game bundle must match app version 5.9 (59)');
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
assert.match(html, /var LIFE_KIT_CATALOG = \[\]/, 'Expanded wearable kit catalog is missing');
const lifeSource = readFileSync('legacy-game/src/life.js', 'utf8');
const catalogStart = lifeSource.indexOf('var LIFE_KIT_PATTERNS = [');
const catalogEnd = lifeSource.indexOf('var LIFE_COS_DEF =', catalogStart);
assert.ok(catalogStart >= 0 && catalogEnd > catalogStart, 'Kit catalog source block is missing');
const catalogContext = { N_: (text) => text, LIFE_COS: { shirt: [] } };
runInNewContext(lifeSource.slice(catalogStart, catalogEnd), catalogContext);
assert.equal(catalogContext.LIFE_KIT_CATALOG.length, 260, 'Expected 260 unlockable shirt designs');
assert.equal(catalogContext.LIFE_COS.shirt.length, 260, 'All 260 kits should be selectable in the wardrobe');
assert.match(html, /function lifeAttBonus\(\)/, 'Wearable kit stat bonuses are missing');
assert.match(html, /SOC_CUSTOM_OPTIONS = \[/, 'Career-aware social post options are missing');
assert.match(html, /socCustomSend\(key, target\)/, 'Social posting and reply simulation is missing');
assert.match(html, /reply \? socState\.replyPeriod === period/, 'A previous post must not disable replying to a comment');
assert.match(html, /soc\.replyPeriod = period/, 'Reply cooldown must be tracked separately from custom posts');
assert.match(html, /p_assist100/, 'Expanded player achievements are missing');
assert.match(html, /m_bigbudget/, 'Expanded manager achievements are missing');
assert.match(html, /MYS1/, 'Post-migration league expansion is missing');
assert.match(html, /mx_minutos_cantera/, 'Post-migration manager decisions are missing');
assert.match(html, /var PLAYER_DECISION_THEMES = \[/, 'Post-migration player decisions are missing');
assert.match(html, /shirtPattern/, 'Custom kit patterns are not connected to the 3D player rig');
assert.doesNotMatch(html, /<script\s+[^>]*src=/i, 'Game must be self-contained for WebView/offline use');
assert.ok(!existsSync(join(output, 'camino-engine.js')), 'Stale v5.2 engine bundle must not be published');

const assets = join(output, 'assets');
assert.ok(existsSync(assets), 'Vite assets directory is missing');
assert.ok(readdirSync(assets).some((name) => name.endsWith('.css')), 'No website CSS bundle was emitted');
assert.ok(statSync(gamePage).size > 1_000_000, 'Self-contained 3D game bundle is unexpectedly small');

console.log(`Build smoke test passed: v5.9 (59), music, 3D players, 3D pet, ${Math.round(statSync(gamePage).size / 1024)} KB`);
