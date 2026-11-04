import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const ui = read('legacy-game/src/ui.js');
const css = read('legacy-game/src/style.css');
const activity = read('android/src/com/caminoleyenda/app/MainActivity.java');

assert.match(ui, /RATE_AFTER_PLAY_MS = 15 \* 60 \* 1000/,
  'Ask for a rating only after at least 15 minutes of active gameplay');
assert.match(ui, /UI\.view === "game" && S && !UI\.sheet/,
  'Only accumulate playtime while an active game is visible');
assert.match(ui, /UI\.view !== "home" \|\| UI\.sheet \|\| document\.visibilityState !== "visible"/,
  'The rating prompt must wait for the safe home screen, never interrupt a match');
assert.match(ui, /isFullScreenAdShowing/,
  'The prompt must wait until a fullscreen ad or consent form is no longer showing');
assert.match(ui, /RATE_SNOOZE_MS = 14 \* 24 \* 60 \* 60 \* 1000/);
assert.match(ui, /RATE_MAX_PROMPTS = 3/);
assert.match(ui, /rateState\.done = true; saveRateState\(\)/,
  'Choosing to rate should prevent further reminders');
assert.match(ui, /window\.AndroidBridge\.openStore\(\)/,
  'The rating action should open this app’s Google Play listing');
assert.match(activity, /public boolean isFullScreenAdShowing\(\)/);
assert.match(activity, /return interstitialShowing \|\| consentFormShowing/);
assert.match(activity, /interstitialShowing = true/);
assert.match(activity, /interstitialShowing = false/);
assert.match(css, /\.rate-mark[\s\S]*?animation: rate-mark-in/);
assert.match(css, /@keyframes rate-mark-in/);
assert.match(css, /prefers-reduced-motion: reduce[^}]*\.rate-mark/);

const prompts = [
  '¿Te está gustando Camino a la Leyenda?',
  'Si disfrutas del juego, déjanos una valoración en Google Play. Tu opinión nos ayuda a seguir mejorándolo.',
  'Valorar en Google Play',
  'Ahora no',
];
for (const lang of ['en', 'de', 'it', 'fr']) {
  const runtime = read(`legacy-game/src/lang-${lang}.js`);
  const catalog = JSON.parse(read(`i18n/${lang}/extra.json`));
  for (const key of prompts) {
    assert.ok(runtime.includes(JSON.stringify(key)),
      `Missing ${lang} runtime rating-prompt translation: ${key}`);
    assert.ok(catalog[key], `Missing ${lang} catalog rating-prompt translation: ${key}`);
  }
}

console.log('Android rating prompt checks passed: 15-minute active-play threshold, safe home-only timing, snoozing, Play Store action, motion and translations.');
