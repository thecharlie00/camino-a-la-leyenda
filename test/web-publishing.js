import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const expectedAppAdsTxt = 'google.com, pub-3919867907492197, DIRECT, f08c47fec0942fa0';
const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.caminoleyenda.app';
const locales = ['', 'en/', 'de/', 'it/', 'fr/'];
const read = (path) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

// Website ads now come from the user-provided networks. Their seller rows were not provided,
// so keep the web ads.txt explicit rather than falsely claiming Google AdSense web inventory.
for (const path of ['ads.txt', 'public/ads.txt', 'dist/ads.txt']) {
  const text = read(path);
  assert.doesNotMatch(text, /^google\.com, pub-/m, `${path} must not claim web AdSense inventory`);
  assert.match(text, /abscloud\.org/);
  assert.match(text, /bauval\.org/);
}

// Android AdMob authorization remains separate and unchanged.
for (const path of ['app-ads.txt', 'public/app-ads.txt', 'dist/app-ads.txt']) {
  assert.equal(read(path).trim(), expectedAppAdsTxt, `Invalid AdMob app-ads.txt seller declaration in ${path}`);
}

for (const locale of locales) {
  for (const root of ['', 'dist/']) {
    const path = join(root, locale, 'index.html');
    const html = read(path);
    const playStoreCtas = [...html.matchAll(/<a\b[^>]*class=["'][^"']*store-link[^"']*["'][^>]*>/gi)];
    assert.equal(playStoreCtas.length, 1, `${path} must expose one active Google Play CTA`);
    assert.ok(playStoreCtas[0][0].includes(`href="${playStoreUrl}"`), `${path} Google Play CTA must use the app listing URL`);
    assert.match(playStoreCtas[0][0], /target=["']_blank["']/i, `${path} Google Play CTA should open the listing separately`);
    assert.match(playStoreCtas[0][0], /rel=["'][^"']*noopener[^"']*["']/i, `${path} Google Play CTA must be safe for a new tab`);
    assert.doesNotMatch(html, /class=["']store-disabled["']|class=["']police-ribbon["']/, `${path} must not show the old disabled Play label`);
    assert.doesNotMatch(html, /google-adsense-account|adsbygoogle\.js|<ins[^>]*adsbygoogle/i, `${path} must not load AdSense`);
    assert.match(html, /data-bauval-banner/, `${path} must include the replacement banner slot`);
    assert.match(html, /data-network-ads/, `${path} must include the two consent-gated site ad tags`);
  }

  for (const root of ['', 'dist/']) {
    const play = read(join(root, locale, 'jugar/index.html'));
    assert.doesNotMatch(play, /google-adsense-account|adsbygoogle\.js|<ins[^>]*adsbygoogle/i);
    assert.match(play, /data-bauval-banner/, `${root}${locale}jugar must include the replacement banner slot`);
    assert.doesNotMatch(play, /data-network-ads/, 'Pop-capable network tags must not load on the game page');

    const goat = read(join(root, locale, 'goat-ladder/index.html'));
    assert.doesNotMatch(goat, /google-adsense-account|adsbygoogle\.js|<ins[^>]*adsbygoogle/i);
    assert.match(goat, /data-bauval-banner/);
    assert.match(goat, /data-network-ads/);

    const privacy = read(join(root, locale, 'privacidad/index.html'));
    assert.doesNotMatch(privacy, /google-adsense-account|adsbygoogle\.js|Google AdSense/i);
    assert.match(privacy, /abscloud\.org/);
    assert.match(privacy, /bauval\.org/);
  }
}

const loader = read('site.js');
for (const url of [
  'https://abscloud.org/1/88abf9d555a4a30b9f834a14f05cfd91',
  'https://bauval.org/14/658905d412d2a8d77d2857f1d878c9e6',
  'https://bauval.org/22/b4c1dc5f8033cebc60622af9c1b9e516',
]) assert.ok(loader.includes(url), `Missing replacement ad tag: ${url}`);
assert.match(loader, /if \(value\.ads\) loadWebAds\(\)/, 'Third-party ad scripts must be gated by consent');
assert.match(loader, /window\.innerWidth >= 761/, 'The fixed 728x90 banner should not overflow phone layouts');

console.log('Replacement web ad tags, consent gating, privacy disclosures, AdMob app-ads.txt and Google Play links validated.');
