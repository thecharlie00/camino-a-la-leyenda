import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const publisherId = 'ca-pub-3919867907492197';
const expectedAdsTxt = 'google.com, pub-3919867907492197, DIRECT, f08c47fec0942fa0';
const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.caminoleyenda.app';
const locales = ['', 'en/', 'de/', 'it/', 'fr/'];
const read = (path) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

for (const path of ['ads.txt', 'public/ads.txt', 'dist/ads.txt']) {
  assert.equal(read(path).trim(), expectedAdsTxt, `Invalid AdSense seller declaration in ${path}`);
}

for (const path of ['app-ads.txt', 'public/app-ads.txt', 'dist/app-ads.txt']) {
  assert.equal(read(path).trim(), expectedAdsTxt, `Invalid AdMob app-ads.txt seller declaration in ${path}`);
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
    const metaPattern = new RegExp(`<meta\\s+name=["']google-adsense-account["']\\s+content=["']${publisherId}["']\\s*>`, 'gi');
    const adsScripts = [...html.matchAll(/<script\b[^>]*adsbygoogle\.js\?client=([^"'&\s]+)[^>]*>/gi)];
    assert.equal([...html.matchAll(metaPattern)].length, 1, `${path} must contain exactly one AdSense account meta tag`);
    assert.equal(adsScripts.length, 1, `${path} must load AdSense exactly once`);
    assert.equal(adsScripts[0][1], publisherId, `${path} AdSense client ID does not match the account meta tag`);
    assert.match(adsScripts[0][0], /\basync\b/i, `${path} AdSense script must load asynchronously`);
    assert.match(adsScripts[0][0], /crossorigin=["']anonymous["']/i, `${path} AdSense script must use anonymous CORS`);
  }
}

console.log('AdSense metadata, ads.txt, AdMob app-ads.txt and active Google Play links validated for all five languages.');
