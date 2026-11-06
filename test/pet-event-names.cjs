const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const events = {};
const context = {
  N_: value => value,
  EV: event => { events[event.id] = event; },
  X: {
    club: 'Córdoba CF',
    nat: 'España',
    lg: 'Primera',
    opp: () => 'Rival FC',
    spick: values => values[0],
  },
  S: {p: {life: {pet: {v: 2, nm: 'Toby', n: {hun: 80, thi: 70}}}}},
  tr: (template, values = {}) => String(template).replace(/\{(\w+)\}/g, (_, key) => {
    const value = values[key];
    return value == null ? '' : String(value);
  }),
};
vm.createContext(context);
vm.runInContext(fs.readFileSync('legacy-game/src/gx-events.js', 'utf8'), context, {filename: 'gx-events.js'});

const ad = events.gx_mascota_anuncio;
assert.ok(ad, 'pet advertising event is registered');
assert.equal(ad.title(), 'Un anuncio con Toby');
assert.equal(ad.text(), 'Una marca de comida para mascotas quiere rodar un anuncio contigo y con Toby.');
assert.doesNotMatch(ad.title() + ad.text(), /\[object Object\]/);

// Old or malformed saves must fall back to generic wording instead of stringifying pet stats.
context.S.p.life.pet = {v: 2, n: {hun: 80, thi: 70}};
assert.equal(ad.title(), 'Un anuncio con tu mascota');
assert.equal(ad.text(), 'Una marca de comida para mascotas quiere rodar un anuncio contigo y con tu mascota.');
assert.doesNotMatch(ad.title() + ad.text(), /\[object Object\]/);

// Older saves that stored a string in `n` keep their original pet name.
context.S.p.life.pet = {n: 'Luna'};
assert.equal(ad.title(), 'Un anuncio con Luna');
assert.doesNotMatch(ad.title(), /\[object Object\]/);

console.log('Pet career events use the pet name safely and fall back for malformed/legacy saves.');
