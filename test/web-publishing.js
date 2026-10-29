import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const publisherId = 'ca-pub-3919867907492197';
const expectedAdsTxt = 'google.com, pub-3919867907492197, DIRECT, f08c47fec0942fa0';
const locales = ['', 'en/', 'de/', 'it/', 'fr/'];
const read = (path) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

for (const path of ['ads.txt', 'public/ads.txt', 'dist/ads.txt']) {
  assert.equal(read(path).trim(), expectedAdsTxt, `Invalid AdSense seller declaration in ${path}`);
}

for (const locale of locales) {
  for (const root of ['', 'dist/']) {
    const path = join(root, locale, 'index.html');
    const html = read(path);
    const metaPattern = new RegExp(`<meta\\s+name=["']google-adsense-account["']\\s+content=["']${publisherId}["']\\s*>`, 'gi');
    const adsScripts = [...html.matchAll(/<script\b[^>]*adsbygoogle\.js\?client=([^"'&\s]+)[^>]*>/gi)];
    assert.equal([...html.matchAll(metaPattern)].length, 1, `${path} must contain exactly one AdSense account meta tag`);
    assert.equal(adsScripts.length, 1, `${path} must load AdSense exactly once`);
    assert.equal(adsScripts[0][1], publisherId, `${path} AdSense client ID does not match the account meta tag`);
    assert.match(adsScripts[0][0], /\basync\b/i, `${path} AdSense script must load asynchronously`);
    assert.match(adsScripts[0][0], /crossorigin=["']anonymous["']/i, `${path} AdSense script must use anonymous CORS`);
  }
}

console.log('AdSense publisher metadata and ads.txt validated in source and build output for all five languages.');
