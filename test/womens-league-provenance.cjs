const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const provenance = JSON.parse(fs.readFileSync('real-f/sources.json', 'utf8'));
const source = provenance.AZ1;
assert.ok(source, 'AFFA source record exists for AZ1');
assert.equal(source.season, '2025/26');
assert.equal(source.source.organization, 'Association of Football Federations of Azerbaijan (AFFA)');
assert.equal(source.source.published, '2025-10-03');
assert.match(source.source.url, /^https:\/\/www\.affa\.az\//);
assert.ok(source.coverage.some((line) => line.includes('12 teams')));
assert.ok(source.coverage.some((line) => line.includes('home-and-away')));
assert.ok(source.limitations.some((line) => line.includes('not a final standings table')));
assert.ok(source.limitations.some((line) => line.includes('not ratings published by AFFA')));
assert.ok(source.limitations.some((line) => line.includes("does not assign a season to the game's broader league pool")));
assert.equal(source.participants.length, 12);
assert.equal(new Set(source.participants).size, 12, 'source participant list has no duplicates');

const context = {DATA: {}};
vm.createContext(context);
vm.runInContext(fs.readFileSync('legacy-game/src/data-f.js', 'utf8'), context, {filename: 'data-f.js'});
const league = context.DATA.leaguesF.find((item) => item.id === 'AZ1');
assert.ok(league, 'the audited competition exists in the women’s competition data');
assert.equal(league.n, 'AFFA Top Girls League');
const gameParticipants = league.clubs.split('|');
assert.equal(gameParticipants.length, source.participants.length);
assert.equal(new Set(gameParticipants).size, gameParticipants.length);
assert.deepEqual([...gameParticipants].sort(), [...source.participants].sort(), 'the game club-name pool matches the sourced names; the game data is not assigned a season');

for (const id of ['ESP1', 'ESP2']) {
  assert.ok(provenance[id]?.source?.url, `${id} has a named RFEF source`);
  assert.ok(provenance[id].limitations.some((line) => line.includes('not an Era historical snapshot')));
}
assert.match(provenance.ESP1.source.url, /rfef\.es\/.*Circular_38/);
assert.match(provenance.ESP2.source.url, /rfef\.es\/.*Calendario_Primera_Federacion_Futbol_Femenino/);
assert.equal(provenance.ESP2.season, '2026/27');
assert.equal(provenance.ESP2.formatSource.organization, 'Real Federación Española de Fútbol (RFEF)');
assert.equal(provenance.ESP2.formatSource.published, '2026-06-30');
assert.match(provenance.ESP2.formatSource.url, /Circular_93/);
assert.ok(provenance.ESP2.formatSource.coverage.some((line) => line.includes('26 double round-robin matchdays')));
assert.ok(provenance.ESP2.formatSource.coverage.some((line) => line.includes('positions 2–5')));
assert.ok(provenance.ESP2.limitations.some((line) => line.includes('does not model as a season-by-season historical structure')));
assert.equal(provenance.ESP2.participants.length, 14);
assert.equal(new Set(provenance.ESP2.participants).size, 14);
assert.ok(provenance.ESP2.limitations.some((line) => line.includes('team-strength values remain simulation estimates')));
const researchPool = JSON.parse(fs.readFileSync('real-f/leagues.json', 'utf8')).ESP2;
assert.equal(researchPool.league, 'Primera Federación Fútbol Femenino');
assert.deepEqual(researchPool.clubs, provenance.ESP2.participants, 'the research pool is exactly the sourced 2026/27 participant list');
const esp2Game = context.DATA.leaguesF.find((item) => item.id === 'ESP2');
const displayToSource = new Map([
  ['Alhama CF', 'Alhama CF'], ['Athletic Club B', 'Athletic Club "B"'], ['CP Cacereño', 'Cacereño Femenino'],
  ['CD Alba Femenino', 'CD Alba Femenino'], ['Osasuna B', 'CD Filial de Fundación Club Atlético Osasuna'],
  ['CD Tenerife B', 'CD Tenerife Femenino "B"'], ['Atlético de Madrid B', 'Club Atlético de Madrid "B"'],
  ['FC Barcelona B', 'FC Barcelona "B"'], ['Levante UD', 'Levante UD'], ['Real Madrid B', 'Real Madrid CF "B"'],
  ['Real Sociedad B', 'Real Sociedad de Fútbol "B"'], ['Real Unión de Tenerife Santa Cruz', 'Real Unión de Tenerife Santa Cruz'],
  ['Sportextremadura CD', 'Sportextremadura CD'], ['Villarreal CF', 'Villarreal CF'],
]);
assert.equal(esp2Game.clubs.split('|').length, 14);
assert.deepEqual(esp2Game.clubs.split('|').map((name) => displayToSource.get(name)).sort(), [...provenance.ESP2.participants].sort(), 'modern ESP2 participant membership matches RFEF using explicit screen-name aliases');
assert.deepEqual([...esp2Game.po], [2, 5], 'the 2026/27 promotion playoff covers places 2–5');
assert.equal(esp2Game.poLegs, 2, 'the 2026/27 promotion playoff uses two legs');
assert.equal(esp2Game.rel, 0, 'relegation is disabled until a sourced lower-tier route is implemented');
assert.equal(esp2Game.down, undefined, 'no unsupported lower-division route is advertised');
assert.ok(provenance.ESP2.limitations.some((line) => line.includes('relegation is intentionally disabled')));
const esp1 = context.DATA.leaguesF.find((item) => item.id === 'ESP1');
const esp2 = context.DATA.leaguesF.find((item) => item.id === 'ESP2');
assert.equal(esp1.n, 'Liga F');
assert.equal(esp1.cup, 'Copa de la Reina');
assert.equal(esp1.sc, 'Supercopa de España Femenina');
assert.equal(esp2.n, 'Primera Federación Fútbol Femenino');
for (const file of ['legacy-game/src/data-f.js']) {
  const text = fs.readFileSync(file, 'utf8');
  assert.match(text, /"id":"ESP1","c":"ES","n":"Liga F"/);
  assert.ok(text.includes('"id":"ESP1","c":"ES","n":"Liga F"'));
  assert.ok(text.includes('"id":"ESP1","c":"ES","n":"Liga F","t":1,"top":87,"bot":62,"cup":"Copa de la Reina","sc":"Supercopa de España Femenina"'));
  assert.ok(text.includes('"id":"ESP2","c":"ES","n":"Primera Federación Fútbol Femenino"'));
  assert.ok(text.includes('"id":"ESP2","c":"ES","n":"Primera Federación Fútbol Femenino","t":2,"top":66,"bot":54,"w":0.8,"gs":1,"clubs":"Alhama CF|Athletic Club B|CP Cacereño|CD Alba Femenino|Osasuna B|CD Tenerife B|Atlético de Madrid B|FC Barcelona B|Levante UD|Real Madrid B|Real Sociedad B|Real Unión de Tenerife Santa Cruz|Sportextremadura CD|Villarreal CF","rel":0,"po":[2,5]'), `${file} ships the sourced ESP2 participant pool and its modeled play-off`);
}
for (const file of ['legacy-game/src/data-f.js']) {
  assert.ok(fs.readFileSync(file, 'utf8').includes('"rel":0,"po":[2,5],"poLegs":2'), `${file} models the 2026/27 two-leg promotion playoff`);
}
console.log('Women’s competition provenance passed: AFFA 2025/26 evidence and RFEF 2026/27 ESP2 participants, format and limits.');
