const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const languageFiles = ['i18n.js', 'lang-en.js', 'lang-de.js', 'lang-it.js', 'lang-fr.js'];
const additions = [
  'Foco de jornada', 'Próximo rival de liga', 'Prepara el siguiente tramo',
  'Abre la semana de trabajo para revisar rival y preparación.',
  'Hay {n} baja en tu once.', 'Hay {n} bajas en tu once.',
  'Antes de avanzar, revisa quién puede jugar.', 'Ver preparación', 'Ver objetivos',
  'Consulta tu progreso antes del siguiente tramo.', '{club} · {league}',
  'Tramo {n} · {season}', 'Balance del tramo: {w}, {d} y {l}.',
  'Puesto actual en la liga: {pos}.', 'La forma del equipo acompaña',
  'Un tramo exigente', 'La pelea sigue abierta', 'Tu aportación se nota',
  'Cada minuto cuenta', 'En este tramo: {apps}, {goals} y {assists}.',
  'Nota media: {r}.', 'Hito de tu carrera', 'El equipo terminó en el puesto {pos}.',
  'La temporada del equipo llegó a su fin.', 'Balance: {w}, {d} y {l}.',
  '{n} empate', '{n} empates', '{n} derrota', '{n} derrotas', '{n} asistencias',
  'El equipo terminó en el puesto {pos}.', '{apps}: {goals} y {assists}.',
  '{n} título de equipo.', '{n} títulos de equipo.',
  'Esta temporada no dejó títulos de equipo.',
  'La temporada en tres momentos', 'Balance de temporada',
];
const context = {};
vm.createContext(context);
for (const file of languageFiles) vm.runInContext(fs.readFileSync(`legacy-game/src/${file}`, 'utf8'), context, {filename: file});
const placeholders = (text) => [...text.matchAll(/\{\w+\}/g)].map((match) => match[0]).sort();
for (const lang of ['en', 'de', 'it', 'fr']) {
  const catalog = {};
  for (const file of fs.readdirSync(`i18n/${lang}`).filter((name) => name.endsWith('.json'))) {
    Object.assign(catalog, JSON.parse(fs.readFileSync(`i18n/${lang}/${file}`, 'utf8')));
  }
  for (const key of new Set(additions)) {
    assert.equal(typeof context.I18N[lang][key], 'string', `Missing ${lang} runtime translation: ${key}`);
    const found = placeholders(context.I18N[lang][key]);
    const expected = placeholders(key);
    const singularMaySpellOne = key === 'Hay {n} baja en tu once.';
    assert.ok(found.every((placeholder) => expected.includes(placeholder)), `Unexpected placeholder in ${lang}: ${key}`);
    if (!singularMaySpellOne) assert.deepEqual(found, expected, `Placeholder mismatch in ${lang}: ${key}`);
    assert.equal(catalog[key], context.I18N[lang][key], `Catalog/runtime mismatch in ${lang}: ${key}`);
  }
}
console.log('Season Viva localization tests passed for EN/DE/IT/FR and all placeholders.');
