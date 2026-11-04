import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = (path) => readFileSync(path, 'utf8');
const ui = read('legacy-game/src/ui.js');
const i18n = read('legacy-game/src/i18n.js');
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
assert.match(ui, /function syncSelectedLanguage\(\)[\s\S]*?savedLang\(\)[\s\S]*?setLang\(selected\)/,
  'Use the player’s saved language immediately before showing either notice');
assert.match(ui, /window\.caminoUpdate = function \(code, name\)[\s\S]*?syncSelectedLanguage\(\)/,
  'The update callback must synchronize the selected language before rendering');
assert.match(activity, /public boolean isFullScreenAdShowing\(\)/);
assert.match(activity, /return interstitialShowing \|\| consentFormShowing/);
assert.match(activity, /interstitialShowing = true/);
assert.match(activity, /interstitialShowing = false/);
assert.match(css, /\.rate-mark[\s\S]*?animation: rate-mark-in/);
assert.match(css, /@keyframes rate-mark-in/);
assert.match(css, /prefers-reduced-motion: reduce[^}]*\.rate-mark/);

const noticeKeys = [
  '¿Te está gustando Camino a la Leyenda?',
  'Si disfrutas del juego, déjanos una valoración en Google Play. Tu opinión nos ayuda a seguir mejorándolo.',
  'Valorar en Google Play',
  'Ahora no',
  '¡Nueva versión disponible!',
  'Hay una actualización de Camino a la Leyenda con novedades y mejoras. Tus partidas se conservan.',
  'Más tarde',
  'Actualizar',
  'Versión {v} disponible',
  'Nueva versión disponible',
  'Actualiza desde Google Play. Tus partidas se conservan.',
];
assert.match(ui, /tr\("¡Nueva versión disponible!"\)/);
assert.match(ui, /tr\("Hay una actualización de Camino a la Leyenda con novedades y mejoras\. Tus partidas se conservan\."\)/);
assert.match(ui, /tr\("Valorar en Google Play"\)/);
assert.match(ui, /tr\("Actualiza desde Google Play\. Tus partidas se conservan\."\)/);

for (const lang of ['en', 'de', 'it', 'fr']) {
  const runtime = read(`legacy-game/src/lang-${lang}.js`);
  const catalog = JSON.parse(read(`i18n/${lang}/extra.json`));
  for (const key of noticeKeys) {
    assert.ok(runtime.includes(JSON.stringify(key)),
      `Missing ${lang} runtime translation: ${key}`);
    assert.ok(catalog[key], `Missing ${lang} catalog translation: ${key}`);
  }

  // Exercise the actual language-selection and tr() path, not just catalog presence.
  const context = vm.createContext({
    localStorage: {getItem: () => null, setItem: () => {}},
    document: {documentElement: {}, getElementById: () => null},
  });
  vm.runInContext(i18n, context);
  vm.runInContext(runtime, context);
  context.setLang(lang);
  for (const key of noticeKeys) {
    const expected = catalog[key].replace('{v}', '5.25');
    const actual = context.tr(key, {v: '5.25'});
    assert.equal(actual, expected, `${lang} should render the selected-language translation for: ${key}`);
    assert.notEqual(actual, key, `${lang} must not fall back to Spanish for: ${key}`);
  }
}

console.log('Android rating and update notices use the selected language for all five locales.');
