/* Expansión de competiciones (5.33): seis segundas divisiones masculinas y seis femeninas
   con ruta de ascenso/descenso. Comprueba datos, procedencia declarada, paridad de género y el
   enlazado real que hace el motor dentro del bundle Android compilado.
   node test/league-expansion.cjs */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

/* Seis segundas divisiones con ruta y cuatro primeras divisiones por mundo (veinte competiciones
   nuevas en total contando las dos ramas de género). */
const SECOND = ['AUT2', 'SUI2', 'DEN2', 'NOR2', 'SWE2', 'CZE2'];
const LINK = {AUT2: 'AUT1', SUI2: 'SUI1', DEN2: 'DEN1', NOR2: 'NOR1', SWE2: 'SWE1', CZE2: 'CZE1'};
const TOPS = ['FI1', 'IS1', 'WAL1', 'NIR1'];
const NEW = [...SECOND, ...TOPS];
/* Diez competiciones nuevas por mundo: seis segundas divisiones y cuatro primeras. */
const EXPECTED = {men: 109 + 10, women: 88 + 10, women2: 93 + 10};

/* 1. Los dos paquetes de datos deben ser idénticos (juego y copia de src). */
assert.equal(fs.readFileSync('legacy-game/src/data-49.js', 'utf8'), fs.readFileSync('src/data-49.js', 'utf8'),
  'the game bundle and the src copy keep the same league expansion');
assert.match(fs.readFileSync('build_legacy_game.py', 'utf8'), /"data-48\.js", "data-49\.js", "names\.js"/,
  'the Android and web bundles load data-49.js right after data-48.js');

/* 2. Datos cargados como en un arranque real. */
function loadData(withExpansion) {
  const context = {DATA: {}};
  vm.createContext(context);
  const files = ['data.js', 'data-es.js', 'data-f.js', 'data-45.js', 'data-48.js'];
  if (withExpansion) files.push('data-49.js');
  for (const file of files) {
    vm.runInContext(fs.readFileSync(`legacy-game/src/${file}`, 'utf8'), context, {filename: file});
  }
  return context.DATA;
}
const baseData = loadData(false);
const DATA = loadData(true);
const context = {DATA};
const pools = {men: DATA.leagues, women: DATA.leaguesF, women2: DATA.leaguesF2};
const find = (list, id) => list.filter((league) => league.id === id)[0];

function checkPool(name, list) {
  for (const id of NEW) {
    const league = find(list, id);
    assert.ok(league, `${name}: ${id} exists`);
    assert.equal(league.xl, true, `${name}: ${id} is appended with the xl flag so saved club indexes do not move`);
    const clubs = league.clubs.split('|');
    assert.ok(clubs.length >= 8, `${name}: ${id} has enough clubs for a calendar (${clubs.length})`);
    assert.equal(new Set(clubs).size, clubs.length, `${name}: ${id} has no repeated club`);
    assert.ok(league.top > league.bot, `${name}: ${id} declares a strength range`);
    assert.ok(league.n && league.c, `${name}: ${id} declares a name and a country`);
    const isSecond = SECOND.includes(id);
    assert.equal(league.t, isSecond ? 2 : 1, `${name}: ${id} is a ${isSecond ? 'second' : 'first'} tier`);
    if (isSecond) {
      const parent = find(list, LINK[id]);
      assert.ok(parent, `${name}: ${LINK[id]} exists`);
      assert.equal(parent.down, id, `${name}: ${LINK[id]} descends into ${id}`);
      assert.ok(parent.rel >= 1, `${name}: ${LINK[id]} sends at least one club down`);
    } else {
      assert.ok(!league.down, `${name}: ${id} is a top tier without a simulated lower division`);
    }
  }
  /* Las ligas nuevas no introducen ninguna colisión de nombres: el mundo conserva exactamente
     los mismos clubes repetidos que ya tenía antes de la expansión. */
  const duplicates = (world) => {
    const seen = new Map();
    const repeated = new Set();
    for (const league of world) {
      for (const club of league.clubs.split('|')) {
        if (seen.has(club)) repeated.add(club);
        else seen.set(club, league.id);
      }
    }
    return [...repeated].sort();
  };
  const baseline = name === 'men' ? baseData.leagues : name === 'women' ? baseData.leaguesF : baseData.leaguesF2;
  assert.deepEqual(duplicates(list), duplicates(baseline), `${name}: the expansion reuses no existing club name`);
  for (const id of NEW) {
    const clubs = find(list, id).clubs.split('|');
    const others = new Set();
    for (const league of list) if (league.id !== id) league.clubs.split('|').forEach((club) => others.add(club));
    assert.deepEqual(clubs.filter((club) => others.has(club)), [], `${name}: ${id} does not borrow an existing club`);
  }
}
checkPool('men', pools.men);
checkPool('women', pools.women);
checkPool('women2', pools.women2);
assert.equal(pools.men.length, EXPECTED.men, 'ten men’s competitions are added and no other league is deleted');
assert.equal(pools.women.length, EXPECTED.women, 'the women’s world grows by ten competitions');
assert.equal(pools.women2.length, EXPECTED.women2, 'the extended women’s world grows by ten competitions');

/* 3. Paridad: los mismos países reciben la misma competición en ambos géneros. */
const menCountries = NEW.map((id) => find(pools.men, id).c).sort();
assert.deepEqual(menCountries, ['AT', 'CH', 'CZ', 'DK', 'FI', 'IS', 'NIR', 'NO', 'SE', 'WAL'].sort(),
  'ten countries: six new second tiers and four new top divisions');
assert.equal(new Set(menCountries).size, menCountries.length, 'each of the ten countries gets exactly one new competition');
for (const id of NEW) {
  assert.equal(find(pools.women2, id).c, find(pools.men, id).c, `${id}: the women's tier uses the same country`);
  assert.equal(find(pools.women2, id).clubs, find(pools.women, id).clubs, `${id}: both women's worlds share the pool`);
}

/* 4. Procedencia declarada: ninguna competición nueva se publica sin fuente o sin límites. */
const menSources = JSON.parse(fs.readFileSync('real/sources.json', 'utf8'));
const womenSources = JSON.parse(fs.readFileSync('real-f/sources.json', 'utf8'));
for (const id of NEW) {
  const men = menSources[id];
  assert.ok(men, `real/sources.json records ${id}`);
  assert.equal(men.status, 'verified-season-participants', `${id}: the men's list is a verified season participant list`);
  assert.match(men.source.url, /^https:\/\/en\.wikipedia\.org\/wiki\//, `${id}: the source is identifiable`);
  assert.ok(men.coverage.length >= 1 && men.limitations.length >= 3, `${id}: coverage and limits are declared`);
  assert.ok(men.limitations.some((line) => line.includes('not an Era historical snapshot')), `${id}: the record is not sold as history`);
  assert.ok(men.limitations.some((line) => line.includes('simulation estimates')), `${id}: ratings are not presented as official`);
  assert.deepEqual(find(pools.men, id).clubs.split('|'), men.gameParticipants, `${id}: the game pool matches the recorded participants`);

  const women = womenSources[id];
  assert.ok(women, `real-f/sources.json records ${id}`);
  assert.ok(['verified-season-participants', 'curated-pool'].includes(women.status), `${id}: the women's record declares its status`);
  assert.ok(women.limitations.some((line) => line.includes('not an Era historical snapshot')), `${id}: the women's record is not sold as history`);
  if (women.status === 'verified-season-participants') {
    assert.deepEqual(find(pools.women2, id).clubs.split('|'), women.gameParticipants, `${id}: verified women's pool matches its record`);
    assert.deepEqual(find(pools.women, id).clubs, find(pools.women2, id).clubs, `${id}: both women's worlds share the verified pool`);
  } else {
    assert.ok(women.basis && women.basis.length > 20, `${id}: the curated pool explains its basis`);
    assert.ok(women.limitations.some((line) => line.startsWith('This is not a verified')), `${id}: the curated pool says it is not an official roster`);
  }
}
assert.equal(womenSources.SWE2.status, 'verified-season-participants', 'the Swedish women’s second tier is the verified one');
assert.equal(womenSources.WAL1.status, 'verified-season-participants', 'the Welsh women’s top flight is a verified season list');
assert.equal(NEW.filter((id) => womenSources[id].status === 'curated-pool').length, 5,
  'five women’s second tiers are declared curated pools instead of pretending to be a verified roster');
assert.equal(NEW.filter((id) => womenSources[id].status === 'verified-season-participants').length, 5,
  'five new women’s competitions are backed by a verified participant list');

/* 4b. Guarda de implementación: el cierre de temporada usa exactamente los campos que se declaran. */
const engine = fs.readFileSync('legacy-game/src/engine-core.js', 'utf8');
assert.match(engine, /if \(l\.downI < 0 \|\| !l\.rel\) return;/,
  'the season end skips a route only when the league has no lower division or no relegation places');
assert.match(engine, /promoList\(l\.downI, k\)/,
  'the promoted clubs come from the linked lower division, not from the same pool');
assert.match(engine, /S\.cl\[c\] = l\.downI;/,
  'the relegated clubs move to the linked lower division');

/* 4c. La rutina real de fin de temporada mueve clubes entre las dos categorías. */
const engineSource = engine;
const startMarker = '  // ascensos y descensos';
const endMarker = '\n  W.clubs.forEach(function (cl, i) {';
const start = engineSource.indexOf(startMarker);
const end = engineSource.indexOf(endMarker, start);
assert.ok(start >= 0 && end > start, 'the promotion and relegation loop stays a readable block in the engine');
const promotionLoop = engineSource.slice(start, end);
const route = {
  W: {
    lg: [
      {downI: 1, downDv: null, dv: null, rel: 1, upN: 0, top: 74, bot: 63},
      {downI: -1, downDv: null, dv: null, rel: 0, upN: 0, top: 63, bot: 52}
    ],
    dv: {},
    clubs: [{lg0: 0}, {lg0: 0}, {lg0: 0}, {lg0: 0}, {lg0: 1}, {lg0: 1}, {lg0: 1}, {lg0: 1}]
  },
  S: {last: {final: [[0, 1, 2, 3], [4, 5, 6, 7]]}, cl: {0: 0, 1: 0, 2: 0, 3: 0, 4: 1, 5: 1, 6: 1, 7: 1}, cr: {}},
  promoList: (li, k) => route.S.last.final[li].slice(0, k),
  shuffle: (list) => list
};
vm.createContext(route);
vm.runInContext(promotionLoop, route);
assert.equal(route.S.cl[3], 1, 'the last club of the first tier is relegated into the new second tier');
assert.equal(route.S.cl[4], 0, 'the champion of the new second tier is promoted into the first tier');
assert.equal(route.S.cl[0], 0, 'a first-tier club that did not finish last stays put');
assert.equal(route.S.cl[7], 1, 'a second-tier club that did not win stays put');

/* 4d. Épocas no hereda estas ligas modernas: sus paquetes son snapshots aparte. */
const eraFiles = fs.readdirSync('legacy-game/erascene/packs').map((file) => `legacy-game/erascene/packs/${file}`);
const eraText = eraFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
for (const id of NEW) assert.ok(!eraText.includes(`"${id}"`), `Eras packs do not claim the modern ${id} competition`);

/* 5. El motor real del bundle enlaza las rutas en los dos mundos. */
const {JSDOM, VirtualConsole} = require('jsdom');
const html = fs.readFileSync('dist/android/jugar/juego.html', 'utf8');
const errors = [];
const virtualConsole = new VirtualConsole();
virtualConsole.on('jsdomError', (error) => errors.push(error.message));
const dom = new JSDOM(html, {
  url: 'https://league-expansion.local/', runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole,
  beforeParse(window) {
    window.matchMedia = () => ({matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}});
    window.scrollTo = () => {};
    window.requestAnimationFrame = (callback) => setTimeout(() => callback(Date.now()), 16);
    window.cancelAnimationFrame = clearTimeout;
    window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
    window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
    window.HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,';
    window.fetch = () => Promise.resolve({ok: true, status: 200, text: () => Promise.resolve('{"entries":[]}')});
  }
});

(async function () {
  const window = dom.window;
  const started = Date.now();
  while (!(window.UIX && window.buildWorld && window.W)) {
    if (Date.now() - started > 30000) throw new Error('the game did not boot');
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  const inspect = (worldKey) => window.eval(`(function () {
    W.ready = false;
    buildWorld(${JSON.stringify(worldKey)});
    var out = {wk: W.wk, count: W.lg.length, leagues: {}};
    ${JSON.stringify(NEW)}.forEach(function (id) {
      var li = W.lgIdx[id], lg = W.lg[li];
      var parentId = ${JSON.stringify(LINK)}[id], pi = parentId ? W.lgIdx[parentId] : -1, parent = parentId ? W.lg[pi] : null;
      out.leagues[id] = lg ? {
        clubs: lg.cl0.length, tier: lg.t, index: li, upI: lg.upI, upN: parent ? lgUpN(li) : 0,
        parent: pi, parentDown: parent ? parent.down : null,
        parentDownI: parent ? parent.downI : null, parentRel: parent ? parent.rel : 0
      } : null;
    });
    return out;
  })()`);
  for (const [worldKey, label] of [['m', 'men'], ['f2', 'women']]) {
    const world = inspect(worldKey);
    assert.equal(world.wk, worldKey, `${label}: the engine built the expected world`);
    for (const id of NEW) {
      const league = world.leagues[id];
      const isSecond = SECOND.includes(id);
      assert.ok(league, `${label}: the engine builds ${id}`);
      assert.equal(league.tier, isSecond ? 2 : 1, `${label}: ${id} is built at its declared tier`);
      assert.equal(league.clubs, find(label === 'men' ? pools.men : pools.women2, id).clubs.split('|').length,
        `${label}: every ${id} club exists in the engine world`);
      if (!isSecond) {
        assert.equal(league.parent, -1, `${label}: ${id} is a top tier without a simulated lower division`);
        continue;
      }
      assert.equal(league.parentDown, id, `${label}: ${LINK[id]} keeps the down link`);
      assert.equal(league.parentDownI, league.index, `${label}: the engine resolves ${LINK[id]} → ${id}`);
      assert.equal(league.upI, league.parent, `${label}: ${id} promotes into ${LINK[id]}`);
      assert.equal(league.upN, league.parentRel, `${label}: ${id} promotes as many clubs as the first tier relegates`);
      assert.ok(league.upN >= 1, `${label}: ${id} has a working promotion route`);
    }
  }
  /* Una carrera real puede empezar directamente en la segunda división nueva y ascender. */
  const firstClub = window.eval("(function () { buildWorld('m'); return W.cName['Admira Wacker']; })()");
  assert.ok(firstClub >= 0, 'the new second tier exposes its clubs to the career start');
  window.eval(`newCareer({fn: 'Liga', ln: 'Expansión', nat: 'AT', pos: 'DFC', foot: 'Diestro', age: 18, talent: 'promesa', club: ${firstClub}, ev: 1})`);
  const career = JSON.parse(window.eval("JSON.stringify({name: clubName(S.p.club), tier: W.lg[S.cl[S.p.club]].t, up: lgUpN(S.cl[S.p.club]), div: lgDivRaw(S.cl[S.p.club])})"));
  assert.equal(career.name, 'Admira Wacker', 'the career starts at the requested second-tier club');
  assert.equal(career.tier, 2, 'the club plays in the new second tier');
  assert.equal(career.div, '2. Liga austriaca', 'the game shows the new competition name');
  assert.equal(career.up, 1, 'the new second tier offers a real promotion route');
  /* Y otra carrera en una de las primeras divisiones nuevas, para comprobar que juega su liga. */
  const welshClub = window.eval("(function () { buildWorld('m'); return W.cName['The New Saints']; })()");
  assert.ok(welshClub >= 0, 'the new Welsh top flight exposes its clubs to the career start');
  window.eval(`newCareer({fn: 'Liga', ln: 'Gales', nat: 'WAL', pos: 'DC', foot: 'Diestro', age: 19, talent: 'promesa', club: ${welshClub}, ev: 1})`);
  const welsh = JSON.parse(window.eval("JSON.stringify({name: clubName(S.p.club), tier: W.lg[S.cl[S.p.club]].t, div: lgDivRaw(S.cl[S.p.club]), clubs: W.lg[S.cl[S.p.club]].cl0.length, down: !!W.lg[S.cl[S.p.club]].down, fixtures: (S.cal || S.fixtures || []).length})"));
  assert.equal(welsh.name, 'The New Saints', 'the career starts at the requested Welsh club');
  assert.equal(welsh.tier, 1, 'the new Welsh competition is a top flight');
  assert.equal(welsh.div, 'Cymru Premier', 'the game shows the era-free competition name');
  assert.equal(welsh.clubs, 16, 'all sixteen Welsh clubs are present in the engine');
  assert.equal(welsh.down, false, 'the new top flight claims no simulated relegation route');
  assert.deepEqual(errors, [], 'the booted game logs no script errors');
  console.log('League expansion tests passed: twelve connected second tiers (six men, six women), eight new top flights (four per gender), verified men’s participants, five verified and five curated women’s pools, declared provenance, real engine links in both worlds, two playable careers and no leak into Eras.');
  process.exit(0);
})().catch((error) => {
  console.error(error && error.stack || error);
  process.exit(1);
});
