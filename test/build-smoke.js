import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext, Script } from 'node:vm';

const output = process.argv[2] || 'dist';
const webGamePage = join(output, 'jugar', 'juego.html');
const androidGamePage = join(output, 'android', 'jugar', 'juego.html');
const webPage = join(output, 'index.html');
const siteRuntime = join(output, 'site.js');
const translatedPage = join(output, 'en', 'index.html');
for (const file of [webGamePage, androidGamePage, webPage, siteRuntime, translatedPage]) {
  assert.ok(existsSync(file), `Missing build output: ${file}`);
}
const playStoreFeedPath = join(output, 'play-store-version.json');
assert.ok(existsSync(playStoreFeedPath), 'Play Store update feed must ship with the static site');
const playStoreFeed = JSON.parse(readFileSync(playStoreFeedPath, 'utf8'));
assert.equal(playStoreFeed.packageName, 'com.caminoleyenda.app');
assert.ok(Number.isInteger(playStoreFeed.versionCode) && playStoreFeed.versionCode > 0);

const html = readFileSync(webGamePage, 'utf8');
const androidHtml = readFileSync(androidGamePage, 'utf8');
const gameSourceMatch = html.match(/<script type="text\/plain" id="web-game-source">([\s\S]*?)<\/script>/);
assert.ok(gameSourceMatch, 'Web game source payload is missing');
const gameSource = gameSourceMatch[1];
new Script(gameSource, {filename: 'web-game.js'});
const webBootstrapMatch = html.match(/<script>\s*([\s\S]*?)<\/script>/);
assert.ok(webBootstrapMatch, 'Web startup bootstrap is missing');
new Script(webBootstrapMatch[1], {filename: 'web-game-bootstrap.js'});
assert.match(webBootstrapMatch[1], /requestAnimationFrame/);
assert.match(html, /class="boot-screen"[\s\S]*?data-boot-status/, 'Web page must show a loading screen before the game starts');
assert.match(gameSource, /var BUILD = \{v: "5\.16", code: 66,/);
assert.match(gameSource, /var GOAT_WEB_BUILD = false;/);
assert.match(gameSource, /var GOAT_API_URL = "https:\/\/camino-goat-ladder\.httpscamino-goat-ladderworkersdev\.workers\.dev";/);
assert.match(gameSource, /UIX\.add\("mainhome"/);
assert.match(gameSource, /UIX\.add\("modes"[\s\S]*?data-a="era-open"/);
assert.match(gameSource, /S\.ntfHistory/);
assert.match(gameSource, /rows\.push\(\["ntfcenter"/);
assert.match(gameSource, /function openNtfCenter\(\)/);
assert.match(gameSource, /MAX_NTF_HISTORY = 60/);
assert.match(androidHtml, /ntf-history-list/);
for (const translation of ['Notifications', 'Benachrichtigungen', 'Notifiche', 'Alertes de match']) {
  assert.ok(gameSource.includes(translation), `Missing localized notifications UI text: ${translation}`);
}
assert.match(gameSource, /var WEB_BUILD = true;/);
assert.match(gameSource, /var NO_ADS = true;/);
assert.doesNotMatch(html, /camino-module-\d+/, 'Web build must retain its existing monolithic startup');
assert.match(androidHtml, /class="boot-screen"[\s\S]*?data-boot-status/, 'Android page must show the shared loading screen');
assert.match(androidHtml, /boot-track/, 'Android loading screen should include the progress animation');

const webPackMatch = gameSource.match(/var P3D_ASSET_PACK = (\{[^;]+\});/);
assert.ok(webPackMatch, 'Web build must retain its existing embedded 3D asset pack');
const modelPack = JSON.parse(webPackMatch[1]);
for (const model of ['male_lod1', 'female_lod1', 'goalkeeper_lod1', 'ball_lod1']) {
  assert.ok(modelPack[model]?.length > 1000, `Missing web model: ${model}`);
}
for (const language of ['en', 'de', 'it', 'fr']) {
  assert.match(gameSource, new RegExp(`I18N\\.${language} = \\{`), `Web ${language} translations must remain inline`);
}

const loaderMatch = androidHtml.match(/<script>\s*([\s\S]*?)<\/script>/);
assert.ok(loaderMatch, 'Android game loader script is missing');
new Script(loaderMatch[1], {filename: 'android-game-loader.js'});
assert.ok(Buffer.byteLength(loaderMatch[1]) < 5000, 'Android must execute only a tiny scheduler synchronously');
const moduleMatches = [...androidHtml.matchAll(/<script type="text\/plain" id="camino-module-\d+">([\s\S]*?)<\/script>/g)];
assert.ok(moduleMatches.length >= 100, `Expected Android game to be split into launch modules, got ${moduleMatches.length}`);
const largestModule = Math.max(...moduleMatches.map((match) => Buffer.byteLength(match[1])));
assert.ok(largestModule <= 300_000, `Android startup task is too large (${largestModule} bytes); split the module`);
const androidSource = moduleMatches.map((match) => match[1]).join('\n');
new Script(androidSource, {filename: 'android-game-modules.js'});
assert.match(androidSource, /var BUILD = \{v: "5\.16", code: 66,/);
assert.match(androidSource, /var GOAT_WEB_BUILD = false;/);
assert.match(androidSource, /var GOAT_API_URL = "https:\/\/camino-goat-ladder\.httpscamino-goat-ladderworkersdev\.workers\.dev";/);
assert.match(androidSource, /UIX\.add\("mainhome"/);
assert.match(androidSource, /UIX\.add\("modes"[\s\S]*?data-a="era-open"/);
assert.match(androidSource, /var ERAS_MODE = true;/, 'Era Mode feature flag must be embedded for Android');
assert.doesNotMatch(androidSource, /I18N\.(en|de|it|fr) = \{"%/, 'Android locale catalogs must stay out of executable startup code');
assert.match(androidHtml, /<template id="pitch3d-asset-pack">/, 'Android models must be deferred in a template');
for (const language of ['en', 'de', 'it', 'fr', 'fem']) {
  assert.match(androidHtml, new RegExp(`id="camino-i18n-${language}"`), `Missing Android lazy locale ${language}`);
}
assert.match(androidHtml, /function ensureI18n\(lang\)/);
assert.match(androidHtml, /Cargando el juego…/);
assert.match(androidHtml, /executingModule = true/);
assert.match(androidHtml, /if \(!booting \|\| !executingModule\) return;/, 'Non-game global error events must not abort the incremental boot');

function readEmbeddedObject(source, marker) {
  const markerAt = source.indexOf(marker);
  assert.ok(markerAt >= 0, `Missing embedded object: ${marker}`);
  const start = source.indexOf('{', markerAt + marker.length);
  let depth = 0, quoted = false, escaped = false;
  for (let i = start; i < source.length; i++) {
    const ch = source[i];
    if (quoted) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') quoted = false;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === '{') depth++;
    else if (ch === '}' && --depth === 0) return JSON.parse(source.slice(start, i + 1));
  }
  throw new Error(`Unterminated embedded object: ${marker}`);
}
const erasData = readEmbeddedObject(gameSource, 'var ERAS_DATA =');
const erasI18n = readEmbeddedObject(gameSource, 'var ERAS_I18N =');
const androidErasData = readEmbeddedObject(androidSource, 'var ERAS_DATA =');
const androidErasI18n = readEmbeddedObject(androidSource, 'var ERAS_I18N =');
assert.deepEqual(androidErasData, erasData, 'Web and Android must share the same Era Mode data');
assert.deepEqual(androidErasI18n, erasI18n, 'Web and Android must share the same Era Mode translations');
assert.deepEqual(erasData.packs.map((pack) => pack.id), ['1970s', '1980s', '1990s', '2000s', '2010s', '2020s']);
assert.ok(erasData.timeline.events.some((event) => event.year === 2010 && event.changes.media.socialMedia === true), 'The social-media transition must be 2010');
assert.equal(erasData.decisions.schema, 2, 'the historical decision catalogue schema must be current');
assert.equal(erasData.decisions.records.length, 1000, 'Era Mode must contain 600 original and 400 historical decision scenarios');
assert.equal(erasData.decisions.historyEvents.length, 40, 'the 400 historical decisions must be grounded in 40 real-event anchors');
assert.equal(erasData.decisions.records.filter((record) => record.historyEventId).length, 400, 'exactly 400 scenarios must reference historical events');
for (const decade of erasData.packs.map((pack) => pack.id)) {
  const records = erasData.decisions.records.filter((record) => record.decade === decade);
  const original = records.filter((record) => !record.historyEventId);
  const historical = records.filter((record) => record.historyEventId);
  assert.equal(original.length, 100, `${decade} must preserve its 100 original decisions`);
  assert.equal(historical.length, decade === '2010s' || decade === '2020s' ? 60 : 70, `${decade} must receive its share of the 400 historical decisions`);
  assert.equal(new Set(original.map((record) => `${record.topic}:${record.context}`)).size, 100, `${decade} original decision contexts must remain distinct`);
  for (const record of historical) {
    const event = erasData.decisions.historyEvents.find((candidate) => candidate.id === record.historyEventId);
    assert.ok(event, `${record.id} must reference a real historical anchor`);
    assert.equal(event.decade, record.decade, `${record.id} must stay in its anchor decade`);
  }
}
for (const event of erasData.decisions.historyEvents) {
  for (const field of ['label', 'fact']) for (const language of ['es', 'en', 'de', 'it', 'fr']) {
    assert.ok(event[field]?.[language], `${event.id} is missing ${field} in ${language}`);
  }
  const linked = erasData.decisions.records.filter((record) => record.historyEventId === event.id);
  assert.equal(linked.length, 10, `${event.id} must ground ten decision variations`);
  assert.equal(new Set(linked.map((record) => record.topic)).size, 10, `${event.id} must cover all decision topics`);
}
assert.ok(erasI18n['Modo Épocas']?.en, 'Era Mode translations are not embedded');
for (const [target, source] of [['web', gameSource], ['Android', androidSource]]) {
  assert.match(source, /home-groups/, `${target} main menu must use the grouped home layout`);
  assert.match(source, /home-mainhome-slot/, `${target} must render the direct GOAT Ladder home-menu slot`);
  assert.match(source, /var Pitch3D = \(function \(\)/, `${target} 3D match renderer is missing`);
  assert.match(source, /var PetWorld = \(function \(\)/, `${target} 3D pet world is missing`);
  assert.match(source, /var PetAudio = \(function \(\)/, `${target} 3D pet audio system is missing`);
  assert.match(source, /var Music = \(function \(\)/, `${target} background music system is missing`);
  assert.match(source, /SOC_CUSTOM_OPTIONS = \[/, `${target} player social interface is missing`);
  assert.match(source, /var PLAYER_DECISION_THEMES = \[/, `${target} player decisions are missing`);
  assert.match(source, /var LIFE_KIT_CATALOG = \[\]/, `${target} wearable kit catalog is missing`);
  assert.match(source, /shirtPattern/, `${target} custom 3D kit rendering is missing`);
}
assert.match(gameSource, /data-a="bgm"/, 'Background music control is missing');
assert.match(gameSource, /var LIFE_KIT_CATALOG = \[\]/, 'Expanded wearable kit catalog is missing');
const lifeSource = readFileSync('legacy-game/src/life.js', 'utf8');
const catalogStart = lifeSource.indexOf('var LIFE_KIT_PATTERNS = [');
const catalogEnd = lifeSource.indexOf('var LIFE_COS_DEF =', catalogStart);
assert.ok(catalogStart >= 0 && catalogEnd > catalogStart, 'Kit catalog source block is missing');
const catalogContext = {N_: (text) => text, LIFE_COS: {shirt: []}};
runInNewContext(lifeSource.slice(catalogStart, catalogEnd), catalogContext);
assert.equal(catalogContext.LIFE_KIT_CATALOG.length, 260, 'Expected 260 unlockable shirt designs');
assert.equal(catalogContext.LIFE_COS.shirt.length, 260, 'All 260 kits should be selectable in the wardrobe');
assert.match(gameSource, /function lifeAttBonus\(\)/, 'Wearable kit stat bonuses are missing');
assert.match(gameSource, /SOC_CUSTOM_OPTIONS = \[/, 'Career-aware social post options are missing');
assert.match(gameSource, /socCustomSend\(key, target\)/, 'Social posting and reply simulation is missing');
assert.match(gameSource, /reply \? socState\.replyPeriod === period/, 'A previous post must not disable replying to a comment');
assert.match(gameSource, /soc\.replyPeriod = period/, 'Reply cooldown must be tracked separately from custom posts');
assert.match(gameSource, /p_assist100/, 'Expanded player achievements are missing');
assert.match(gameSource, /m_bigbudget/, 'Expanded manager achievements are missing');
assert.match(gameSource, /MYS1/, 'Post-migration league expansion is missing');
assert.match(gameSource, /mx_minutos_cantera/, 'Post-migration manager decisions are missing');
assert.match(gameSource, /var PLAYER_DECISION_THEMES = \[/, 'Post-migration player decisions are missing');
assert.match(gameSource, /shirtPattern/, 'Custom kit patterns are not connected to the 3D player rig');
assert.doesNotMatch(html, /<script\s+[^>]*src=/i, 'Web game must remain self-contained');
assert.doesNotMatch(androidHtml, /<script\s+[^>]*src=/i, 'Android game must remain self-contained');
assert.ok(!existsSync(join(output, 'camino-engine.js')), 'Stale v5.2 engine bundle must not be published');

const assets = join(output, 'assets');
assert.ok(existsSync(assets), 'Vite assets directory is missing');
assert.ok(readdirSync(assets).some((name) => name.endsWith('.css')), 'No website CSS bundle was emitted');
assert.ok(statSync(webGamePage).size > 1_000_000, 'Self-contained web game bundle is unexpectedly small');
assert.ok(statSync(androidGamePage).size > 1_000_000, 'Self-contained Android game bundle is unexpectedly small');

console.log(`Build smoke passed: shared loading screen, web startup, Android incremental startup; v5.16 (66).`);
