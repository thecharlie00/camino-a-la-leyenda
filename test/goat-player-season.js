import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source = readFileSync('legacy-game/src/goat.js', 'utf8');
const S = {
  uid: 'player-season-test',
  blog: [],
  mode: 'player',
  yr: 2025,
  p: {seasons: []}
};
const W = {lg: [{n: 'Liga de prueba', upI: -1}]};
const row = {
  y: 2024, club: 7, lg: 0, g: 19, a: 8, apps: 31, min: 2500, rt: 8.2,
  pos: 1, ovr1: 84, tro: [{n: 'Liga'}], aw: [{n: 'MVP'}]
};
const translations = {
  Campeones: 'Champions',
  'Temporada histórica en {comp}': 'Historic season at {comp}'
};
const translate = (key, values = {}) => Object.entries(values).reduce(
  (text, [name, value]) => text.replace(`{${name}}`, value), translations[key] || key);
const originalSeasonEnd = function () {
  S.p.seasons.push(row);
  S.blog.push({type: 'season'});
  return 'season-ended';
};
const factory = new Function(
  'window', 'GOAT_API_URL', 'GOAT_TEXT', 'LANG', 'navigator', 'localStorage', 'fetch',
  'TextEncoder', 'AbortController', 'console', 'S', 'W', 'clubName', 'trComp', 'tr', 'seasonEnd',
  `${source}\nreturn seasonEnd;`
);
const wrappedSeasonEnd = factory(
  {}, 'https://api.test', {es: {}}, 'es', {onLine: true},
  {getItem: () => null, setItem() {}, removeItem() {}}, () => Promise.resolve({}),
  TextEncoder, AbortController, {log() {}, warn() {}, error() {}}, S, W,
  (club) => club === 7 ? 'Club de prueba' : '', (competition) => competition,
  translate, originalSeasonEnd
);

assert.equal(wrappedSeasonEnd(), 'season-ended');
assert.equal(S.goatLatest.event_type, 'season');
assert.equal(S.goatLatest.game_mode, 'player');
assert.equal(S.goatLatest.event_key, 'player-season-test:1:season');
assert.equal(S.goatLatest.club_name, 'Club de prueba');
assert.equal(S.goatLatest.competition_name, 'Liga de prueba');
assert.equal(S.goatLatest.goals, 19);
assert.equal(S.goatLatest.assists, 8);
assert.equal(S.goatLatest.minutes_played, 2500);
assert.equal(S.goatLatest.league_position, 1);
console.log('GOAT player season milestone capture passed.');
