import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM, VirtualConsole } from 'jsdom';

const html = readFileSync('dist/android/jugar/juego.html', 'utf8');
const errors = [];
const goatCalls = [];
const virtualConsole = new VirtualConsole();
virtualConsole.on('jsdomError', (error) => errors.push(`jsdom: ${error.message}`));
virtualConsole.on('error', (...args) => errors.push(`console: ${args.join(' ')}`));

const dom = new JSDOM(html, {
  url: 'https://game-smoke.local/',
  runScripts: 'dangerously',
  resources: 'usable',
  pretendToBeVisual: true,
  virtualConsole,
  beforeParse(window) {
    window.matchMedia = () => ({matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}});
    window.scrollTo = () => {};
    window.requestAnimationFrame = (callback) => setTimeout(() => callback(Date.now()), 16);
    window.cancelAnimationFrame = clearTimeout;
    window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
    window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
    window.HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,';
    window.fetch = (url, init = {}) => {
      const call = {url: String(url), init};
      goatCalls.push(call);
      const body = init.method === 'POST'
        ? {id: `smoke-${goatCalls.length}`, delete_token: 'smoke-delete-token', goat_score: 321}
        : String(url).includes('/careers')
          ? {entries: [{id: 'public-career', display_name: 'Community Legend', title: 'A shared career',
            game_mode: 'player', current_club: 'FC Barcelona', started_season: 2020, latest_season: 2025,
            metrics: {appearances: 120, goals: 50, assists: 20, clean_sheets: 0, trophies: 2, awards: 1,
              international_caps: 8, international_goals: 2, clubs: 2, seasons: 6},
            history: [{season: 2025, club: 'FC Barcelona', competition: 'Liga', appearances: 30, goals: 15,
              assists: 8, trophies: ['Liga'], awards: ['Jugador del año']}]}]}
          : {entries: [{id: 'public-record', display_name: 'Community Legend', title: 'A big match',
            game_mode: 'player', event_type: 'match', goat_score: 90, club_name: 'FC Barcelona',
            competition_name: 'Liga', opponent_name: 'Rival FC', metrics: {goals: 3, assists: 1,
              match_rating: 9.2, minutes_played: 90}}]};
      return Promise.resolve({ok: true, status: 200, text: () => Promise.resolve(JSON.stringify(body))});
    };
    window.HTMLCanvasElement.prototype.getContext = function () {
      const methods = {
        measureText: (text) => ({width: String(text).length * 6}),
        createLinearGradient: () => ({addColorStop() {}}),
        createRadialGradient: () => ({addColorStop() {}}),
        getImageData: () => ({data: new Uint8ClampedArray(4)}),
        createPattern: () => null
      };
      return new Proxy(methods, {get: (target, key) => key in target ? target[key] : () => {}});
    };
    window.addEventListener('error', (event) => errors.push(`window: ${event.error?.stack || event.message}`));
  }
});

const {window} = dom;
assert.ok(window.document.querySelector('.boot-screen'), 'loading screen should be visible while the game modules are booting');
const waitFor = async (predicate, description) => {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > 30000) throw new Error(`Timed out waiting for ${description}`);
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
};
const click = (selector) => {
  const button = window.document.querySelector(selector);
  assert.ok(button, `Missing interactive element ${selector}`);
  button.click();
};

try {
  await waitFor(() => window.UIX && window.UIX.ui().view === 'lang' &&
    window.document.querySelectorAll('script[id^="camino-module-"]').length === 0, 'game boot');
  const app = window.document.getElementById('app');
  assert.match(app.textContent, /Español/);
  assert.equal(window.I18N_LOADED.en, undefined, 'non-selected dictionaries should not execute at launch');

  click('[data-a="setlang"][data-v="es"]');
  assert.equal(window.UIX.ui().view, 'home');
  for (const [language, expected] of [['en', 'New game'], ['de', 'Neues Spiel'], ['it', 'Nuova partita'], ['fr', 'Nouvelle partie']]) {
    click('[data-a="golang"]');
    click(`[data-a="setlang"][data-v="${language}"]`);
    assert.equal(window.tr('Nueva partida'), expected);
    assert.equal(window.I18N_LOADED[language], true);
    assert.equal(window.document.getElementById(`camino-i18n-${language}`), null, `${language} payload should be released after loading`);
  }
  assert.ok(app.textContent.includes('Joueur, entraîneur ou ton propre club'));

  window.FEM = true;
  window.tr('Jugadora');
  assert.equal(window.I18N_F_LOADED, true, 'female translations should load when first needed');
  assert.equal(window.document.getElementById('camino-i18n-fem'), null);
  window.FEM = false;
  click('[data-a="golang"]');
  click('[data-a="setlang"][data-v="es"]');

  const models = window.Pitch3DAssets.loadEmbedded();
  assert.ok(models.ok >= 12, `Expected all embedded GLB assets to parse, got ${models.ok}`);
  assert.equal(models.errors.length, 0, `Invalid embedded GLB assets: ${models.errors.join(', ')}`);
  assert.equal(window.document.getElementById('pitch3d-asset-pack'), null, 'parsed model payload should be released');

  window.localStorage.setItem('camino.slots', '[]');
  assert.equal(window.document.querySelector('[data-a="era-open"]'), null, 'Era Mode must not appear as a direct main-menu shortcut');
  click('[data-a="newgame"]');
  assert.ok(window.document.querySelector('[data-a="era-open"]'), 'Era Mode remains available from the mode-selection menu');
  click('[data-a="era-open"]');
  assert.equal(window.document.querySelectorAll('[data-era-field="pack"] option').length, 6);
  assert.equal(window.document.querySelectorAll('[data-era-field="year"] option').length, 10);
  click('[data-era-act="start"]');
  /* Épocas usa el formulario normal de creación: nacionalidad, posición, pie, edad, talento y club libre */
  assert.equal(window.UIX.ui().view, 'create', 'Era Mode must open the standard creation form');
  assert.equal(window.UIX.ui().cr.era.year, 1992);
  for (const [selector, value] of [['#fn', 'Era'], ['#ln', 'Smoke']]) {
    const input = window.document.querySelector(selector);
    input.value = value;
    input.dispatchEvent(new window.Event('input', {bubbles: true}));
  }
  click('[data-a="cnext"]');
  click('[data-a="cnext"]');
  click('[data-a="cnext"]');
  click('[data-a="cset"][data-k="mode"][data-v="pick"]');
  const eraLeagues = [...window.document.querySelectorAll('#clg option')].map((option) => option.textContent);
  assert.ok(!eraLeagues.some((name) => /MLS/.test(name)), 'leagues that did not exist yet (MLS, 1996) are not offered in 1992');
  click('[data-a="cclub"]');
  assert.ok(window.document.querySelector('.eras-clubcard'), 'the chosen club shows its period profile');
  click('[data-a="cnext"]');
  await new Promise((resolve) => setTimeout(resolve, 50));
  assert.equal(window.S.era.active, true);
  assert.equal(window.S.yr, 1992);
  assert.ok(window.S.p.club >= 0, 'the player starts at the club picked in the form');
  assert.equal(window.EraStore.save(), true);
  assert.equal(window.localStorage.getItem('camino.slots'), '[]', 'Era saves must not touch modern saves');
  assert.ok(window.localStorage.getItem('camino.eras.v1.index'));
  assert.equal(window.ACH_ERA.length, 50, 'the game should register 50 Era-only achievements');
  window.UIX.actions.ach();
  assert.ok(window.document.querySelector('.gxl')?.textContent.includes('Primer silbatazo'),
    'Era achievements should be visible in the existing achievements screen');
  assert.ok(window.document.querySelector('.gxl')?.textContent.includes('Mil victorias de leyenda'),
    'the Era achievement list should include manager challenges too');
  click('[data-a="close"]');
  click('[data-a="era-exit"]');
  assert.equal(window.S, null);
  assert.equal(window.UIX.ui().view, 'home');

  click('[data-a="newgame"]');
  click('[data-a="pickmode"][data-v="p"]');
  for (const [selector, value] of [['#fn', 'Smoke'], ['#ln', 'Jugador']]) {
    const input = window.document.querySelector(selector);
    input.value = value;
    input.dispatchEvent(new window.Event('input', {bubbles: true}));
  }
  click('[data-a="cnext"]');
  click('[data-a="cnext"]');
  click('[data-a="cnext"]');
  click('[data-a="cclub"]');
  click('[data-a="cnext"]');
  assert.ok(window.S.p, 'modern player career should start through the existing creation flow');
  assert.equal(window.S.era, undefined, 'modern careers must not inherit Era Mode state');
  assert.ok(window.localStorage.getItem('camino.slots') !== '[]', 'modern save index should continue to work');

  const skipTutorial = window.document.querySelector('[data-a="tutoff"]');
  if (skipTutorial) skipTutorial.click();
  const skipFamily = window.document.querySelector('[data-a="famnone"]');
  if (skipFamily) skipFamily.click();
  const firstDecision = window.document.querySelector('[data-a="choose"]');
  assert.ok(firstDecision, 'a new player career should present its first decision');
  firstDecision.click();
  assert.ok(window.S, 'resolving a career decision should keep the save active');

  click('[data-a="menu"]');
  click('[data-a="home"]');
  click('[data-a="goat"]');
  await waitFor(() => window.__goatSheet && !window.__goatSheet.loading &&
    window.document.querySelector('.goat-career-share'), 'GOAT career board');
  assert.ok(window.document.querySelector('.goat-card')?.textContent.includes('Community Legend'),
    'shared careers should be visible in the Careers board');
  click('[data-a="goatcareeropen"]');
  assert.equal(window.UIX.getSheet().k, 'goatCareerPublish');
  assert.ok(window.document.querySelector('.goat-history'), 'career publishing should preview the season history');
  const careerAlias = window.document.querySelector('[data-career-alias]');
  const careerTitle = window.document.querySelector('[data-career-title]');
  careerAlias.value = 'Smoke Player';
  careerTitle.value = 'My complete career';
  window.document.querySelector('[data-career-consent]').checked = true;
  click('[data-a="goatcareerpublish"]');
  await waitFor(() => window.UIX.getSheet()?.submitSuccess, 'career publication');
  const careerPost = goatCalls.find((call) => call.init.method === 'POST' && call.url.includes('/careers'));
  assert.ok(careerPost, 'publishing a career should POST to the careers endpoint');
  assert.equal(JSON.parse(careerPost.init.body).display_name, 'Smoke Player');

  click('[data-a="close"]');
  window.S.goatLatest = {event_key: 'smoke-player-season', event_type: 'season', game_mode: 'player',
    title: 'Champions season', club_name: 'FC Barcelona', competition_name: 'Liga', season: window.S.yr,
    goals: 18, assists: 7, match_rating: 8.1, minutes_played: 1800};
  click('[data-a="goat"]');
  await waitFor(() => window.__goatSheet && !window.__goatSheet.loading, 'GOAT achievements board');
  click('[data-a="goatboard"][data-v="achievements"]');
  await waitFor(() => !window.__goatSheet.loading &&
    window.document.querySelector('[data-a="goatsubmit"]'), 'milestone publication form');
  assert.ok(window.document.querySelector('.goat-card')?.textContent.includes('Community Legend'),
    'shared achievements should be visible in the Achievements board');
  const milestoneAlias = window.document.querySelector('[data-goat-alias]');
  const milestoneTitle = window.document.querySelector('[data-goat-title]');
  milestoneAlias.value = 'Smoke Player';
  milestoneTitle.value = 'Champions season';
  window.document.querySelector('[data-goat-consent]').checked = true;
  click('[data-a="goatsubmit"]');
  await waitFor(() => window.__goatSheet.submitSuccess != null, 'milestone publication');
  const milestonePost = goatCalls.find((call) => call.init.method === 'POST' && !call.url.includes('/careers'));
  assert.ok(milestonePost, 'publishing a milestone should POST to the achievements endpoint');
  assert.equal(JSON.parse(milestonePost.init.body).event_type, 'season');
  assert.equal(JSON.parse(milestonePost.init.body).display_name, 'Smoke Player');

  click('[data-a="close"]');
  click('[data-a="newgame"]');
  click('[data-a="pickmode"][data-v="mgr"]');
  for (const [selector, value] of [['#fn', 'Smoke'], ['#ln', 'Manager']]) {
    const input = window.document.querySelector(selector);
    input.value = value;
    input.dispatchEvent(new window.Event('input', {bubbles: true}));
  }
  click('[data-a="cnext"]');
  click('[data-a="cnext"]');
  click('[data-a="cclub"]');
  click('[data-a="cnext"]');
  await waitFor(() => window.S?.m && window.UIX.ui().view === 'game', 'manager career creation');
  assert.ok(window.S.m.club >= 0, 'manager creation should assign the selected club');
  assert.equal(window.S.era, undefined, 'modern manager careers must remain outside Era Mode');

  click('[data-a="menu"]');
  click('[data-a="home"]');
  click('[data-a="newgame"]');
  click('[data-a="pickmode"][data-v="club"]');
  const clubName = window.document.querySelector('#cn');
  clubName.value = 'Club Smoke';
  clubName.dispatchEvent(new window.Event('input', {bubbles: true}));
  click('[data-a="cnext"]');
  click('[data-a="cnext"]');
  click('[data-a="cnext"]');
  for (const [selector, value] of [['#fn', 'Smoke'], ['#ln', 'President']]) {
    const input = window.document.querySelector(selector);
    input.value = value;
    input.dispatchEvent(new window.Event('input', {bubbles: true}));
  }
  click('[data-a="cnext"]');
  await waitFor(() => window.S?.custom && window.UIX.ui().view === 'draft', 'custom club creation');
  assert.equal(window.S.custom.n, 'Club Smoke');
  click('[data-a="startclub"]');
  assert.equal(window.UIX.ui().view, 'game', 'custom club roster draft should start a season');
  assert.ok(window.S.m.sq.length >= 18, 'custom club should have a generated squad');
  assert.deepEqual(errors, [], `Unexpected runtime errors: ${errors.join('\n')}`);
  console.log('Runtime smoke passed: boot, five locales, GOAT sharing, all 50 Era achievements, Era isolation, player decisions, manager and custom-club creation.');
} finally {
  window.close();
}
