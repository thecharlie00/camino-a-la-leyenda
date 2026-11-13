/* Modo Épocas: cobertura declarada. Comprueba que una carrera no puede empezar en una
   competición anterior a su fundación y que las temporadas sin campeones reales se
   etiquetan como simulación en la interfaz, sin tocar el modo moderno ni los guardados. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM, VirtualConsole } = require('jsdom');

const history = JSON.parse(fs.readFileSync('legacy-game/erascene/clubs-history.json', 'utf8'));
const champions = JSON.parse(fs.readFileSync('legacy-game/erascene/history.json', 'utf8'));

const lastDocumented = Math.max(...Object.keys(champions.seasons).map(Number));
assert.ok(lastDocumented >= 2000, 'history.json must document recent club seasons');

/* 1. Datos: años de fundación posteriores a 1970 con fuente propia y nombres cronológicos. */
const modern = Object.entries(history.leagues).filter(([, entry]) => entry.since != null && entry.since > 1970);
assert.ok(modern.length >= 18, `expected at least 18 competitions founded after 1970, found ${modern.length}`);
for (const [id, entry] of modern) {
  assert.ok(entry.src, `${id}: a post-1970 start year needs a source`);
  const names = entry.names || [];
  assert.deepEqual(names.map((row) => row[0]), [...names.map((row) => row[0])].sort((a, b) => a - b), `${id}: names must be chronological`);
}
for (const [id, entry] of Object.entries(history.leagues)) {
  const women = entry.women || [];
  if (women.length) {
    assert.ok(entry.womenSrc, `${id}: a women's name series needs its own source`);
    assert.deepEqual(women.map((row) => row[0]), [...women.map((row) => row[0])].sort((a, b) => a - b), `${id}: women's names must be chronological`);
  }
  for (const row of entry.names || []) assert.ok(row[1] && String(row[1]).trim(), `${id}: every name needs text`);
}
/* Las cuatro primeras divisiones nuevas conservan su serie femenina para no mostrar marcas actuales. */
for (const id of ['FI1', 'IS1', 'WAL1', 'NIR1']) {
  assert.ok(history.leagues[id] && history.leagues[id].women, `${id}: the new competition needs an era women's name series`);
}

/* 2. El bundle Android real aplica los límites y la etiqueta de cobertura. */
const html = fs.readFileSync('dist/android/jugar/juego.html', 'utf8');
const errors = [];
const virtualConsole = new VirtualConsole();
virtualConsole.on('jsdomError', (error) => errors.push(error.message));
const dom = new JSDOM(html, {
  url: 'https://eras-coverage.local/', runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole,
  beforeParse(window) {
    window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
    window.scrollTo = () => {};
    window.requestAnimationFrame = (callback) => setTimeout(() => callback(Date.now()), 16);
    window.cancelAnimationFrame = clearTimeout;
    window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
    window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
    window.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: () => () => ({ addColorStop() {} }) });
    window.HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,';
    window.fetch = () => Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve('{"entries":[]}') });
  }
});

(async function () {
  const window = dom.window;
  const started = Date.now();
  while (!(window.UIX && window.eraStartCareer && window.eraHistoryLastSeason && window.eraCoverageNotice &&
    window.UIX.actions && window.UIX.actions['era-rules'] && window.UIX.actions['era-book'] && window.UIX.slots && window.UIX.slots.after && window.UIX.slots.after.length >= 20)) {
    if (Date.now() - started > 30000) throw new Error('the game did not boot');
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  const ev = (code) => JSON.parse(JSON.stringify(window.eval(code)));
  assert.equal(ev('eraHistoryLastSeason()'), lastDocumented, 'the UI must use the last documented club season');
  assert.equal(ev('eraCoverageNotice(2024)'), null, 'a documented season has no mock-history label');
  assert.equal(ev('eraCoverageNotice(2025)').lastSeason, lastDocumented, 'later seasons report the documented boundary');

  /* Una carrera en el límite: 2024 no lleva etiqueta; 2026, sí. */
  ev("ERA_CREATE_CONTEXT = null; eraStartCareer('manager', 2024, {firstName: 'Cob', lastName: 'Test', clubName: 'FC Barcelona'}); UIX.ui().view = 'game'; UIX.render(true); 0");
  assert.equal(window.document.querySelectorAll('.era-cover-tag').length, 0, '2024 is documented: no coverage tag');
  ev("S.yr = 2026; UIX.ui().view = 'game'; UIX.render(true); 0");
  const tags = window.document.querySelectorAll('.era-cover-tag');
  assert.equal(tags.length, 1, 'a season beyond the documented history shows the coverage tag');
  assert.ok(tags[0].textContent.trim().length > 0, 'the tag has visible text');
  assert.match(tags[0].getAttribute('title') || '', /2024/, 'the tag explains up to which season real champions are recorded');

  /* El anuario no promete comparación histórica en esas temporadas. */
  ev("UIX.actions['era-book'](); 0");
  const book = window.document.getElementById('era-overlay');
  assert.ok(book && /Sin referencia histórica/.test(book.textContent), 'the yearbook declares the missing reference');
  ev("UIX.actions['era-book'](); 0");

  /* Las partidas de Épocas se guardan y aparecen en el menú normal de carga. */
  ev("EraStore.save(); 0");
  const saved = ev('EraStore.getIndex()');
  assert.equal(saved.length, 1, 'the era career is saved in its own store');
  const savedId = saved[0].id;
  ev("UIX.ui().view = 'home'; UIX.render(true); 0");
  assert.match(window.document.getElementById('main').textContent, /Cargar partida · 1/, 'the home screen counts an era save as a loadable game');
  ev("UIX.ui().view = 'load'; UIX.render(true); 0");
  const loadText = window.document.getElementById('main').textContent;
  assert.match(loadText, /Modo Épocas/, 'the normal load menu lists era saves');
  assert.match(loadText, /Partidas de Épocas/, 'the normal load menu groups era saves');
  assert.ok(window.document.querySelector('[data-a="eraload"]'), 'the era save can be continued from the normal menu');
  ev(`UIX.actions['eraload'](null, null, ${JSON.stringify(savedId)}); 0`);
  assert.equal(ev('UIX.ui().view'), 'game', 'continuing an era save opens the era career');
  assert.equal(ev('!!(S && S.era && S.era.active)'), true, 'the loaded career is a real Era career');
  ev(`UIX.ui().view = 'load'; UIX.render(true); 0`);
  ev(`UIX.actions['eradel'](null, null, ${JSON.stringify(savedId)}); 0`);
  assert.equal(ev('EraStore.getIndex().length'), 0, 'the era save can be deleted from the normal menu');
  assert.doesNotMatch(window.document.getElementById('main').textContent, /Partidas de Épocas/, 'the era group disappears with its last save');

  /* El modo moderno no lleva la marca. */
  ev("UIX.actions['era-exit'] && UIX.actions['era-exit'](); 0");
  assert.equal(window.document.querySelectorAll('.era-cover-tag').length, 0, 'leaving Era Mode removes the era HUD');
  assert.deepEqual(errors, [], 'the booted game logs no script errors');
  console.log(`Era coverage tests passed: ${modern.length} post-1970 competitions carry a sourced start year, the new top flights declare their women's names, documented champions end in ${lastDocumented}, later seasons are labelled as simulated and the modern mode stays clean.`);
  process.exit(0);
})().catch((error) => {
  console.error(error && error.stack || error);
  process.exit(1);
});
