const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const src = fs.readFileSync('legacy-game/src/world45.js', 'utf8');
const start = src.indexOf('function poMatchTwoLeg(');
const end = src.indexOf('\n}\n/* se juega una vez por temporada', start);
assert.ok(start >= 0 && end > start, 'two-leg simulator remains a named, isolated engine helper');
const helper = src.slice(start, end + 2);
const results = [[1, 0], [0, 2]];
const calls = [];
const context = {
  S: {cr: {1: 72, 2: 61}},
  simGoals(home, away, homeAdvantage) { calls.push([home, away, homeAdvantage]); return results.shift(); },
};
vm.createContext(context);
vm.runInContext(helper, context);
const tie = context.poMatchTwoLeg(1, 2, 1);
assert.deepEqual(calls, [[61, 72, 1], [72, 61, 1]], 'lower seed hosts the first leg; higher seed hosts the return');
assert.deepEqual([...tie.legs[0]], [0, 1]);
assert.deepEqual([...tie.legs[1]], [0, 2]);
assert.deepEqual([...tie.g], [0, 3], 'the tie stores the two-leg aggregate from the stable bracket order');
assert.equal(tie.w, 2, 'aggregate winner advances');

context.S.cr = {1: 72, 2: 61};
context.simGoals = () => [0, 0];
const level = context.poMatchTwoLeg(1, 2, 1);
assert.deepEqual([...level.g], [0, 0]);
assert.equal(level.w, 1, 'aggregate equality goes to the better regular-season seed, not to a random replay');

const key = 'Ida: {first}; vuelta: {second}; global: {total}.';
const localized = {
  en: 'First leg: {first}; second leg: {second}; aggregate: {total}.',
  de: 'Hinspiel: {first}; Rückspiel: {second}; Gesamt: {total}.',
  it: 'Andata: {first}; ritorno: {second}; totale: {total}.',
  fr: 'Aller : {first} ; retour : {second} ; score cumulé : {total}.',
};
for (const [locale, value] of Object.entries(localized)) {
  assert.equal(JSON.parse(fs.readFileSync(`i18n/${locale}/extra.json`, 'utf8'))[key], value, `${locale} two-leg score line is translated`);
  for (const root of ['legacy-game/src', 'src']) assert.ok(fs.readFileSync(`${root}/lang-${locale}.js`, 'utf8').includes(`${JSON.stringify(key)}:${JSON.stringify(value)}`), `${root} ${locale} runtime dictionary includes the translation`);
}
console.log('Women’s promotion play-off tests passed: two legs, host order, aggregate score, seed tiebreak and five-locale score copy.');
