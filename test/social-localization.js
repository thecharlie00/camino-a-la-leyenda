import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const translations = [
  ['Tres puntos más para el {club}. Nada mal, nada mal.',
    'Another three points for {club}. Not bad at all, not bad at all.',
    'Noch drei Punkte für {club}. Gar nicht schlecht, wirklich gar nicht schlecht.',
    'Altri tre punti per il {club}. Niente male, davvero niente male.',
    'Trois points de plus pour {club}. Pas mal du tout, vraiment pas mal.'],
  ['¡Triplete! El balón se va a casa con {name}. ¡Qué maravilla!',
    'Hat-trick! The ball goes home with {name}. Lovely stuff.',
    'Hattrick! Der Ball geht mit {name} nach Hause. Stark!',
    'Tripletta! Il pallone va a casa con {name}. Che spettacolo!',
    'Triplé ! Le ballon repart à la maison avec {name}. Quel régal !'],
  ['Sky Sportz informa de que {to} prepara una oferta por {name}. Se esperan conversaciones esta semana.',
    'Sky Sportz understands {to} are preparing a bid for {name}. Talks expected this week.',
    'Sky Sportz zufolge bereitet {to} ein Angebot für {name} vor. Gespräche werden diese Woche erwartet.',
    "Secondo Sky Sportz, {to} prepara un'offerta per {name}. Trattative attese questa settimana.",
    'Selon Sky Sportz, {to} prépare une offre pour {name}. Des discussions sont attendues cette semaine.'],
  ['FICHAJE CERRADO: {name} llega al {club} desde el {from}. Contrato hasta {year}.',
    'DONE DEAL: {name} joins {club} from {from}. Contract until {year}.',
    'PERFEKT: {name} wechselt von {from} zu {club}. Vertrag bis {year}.',
    'AFFARE FATTO: {name} passa dal {from} al {club}. Contratto fino al {year}.',
    "TRANSFERT CONCLU : {name} rejoint le {club} en provenance de {from}. Contrat jusqu'en {year}."],
  ['¡Enhorabuena, {club}! Un {trophy} más que merecido.',
    'Congratulations, {club}! A deserved {trophy}.',
    'Glückwunsch, {club}! Absolut verdient: {trophy}.',
    'Complimenti, {club}! Vittoria meritata: {trophy}.',
    'Félicitations, {club} ! Titre amplement mérité : {trophy}.'],
  ['Bien hecho, {name}. Un premio más que merecido.',
    'Well done, {name}. A deserved award, no doubt.',
    'Stark, {name}. Diese Auszeichnung hast du mehr als verdient.',
    'Complimenti, {name}. Un premio meritatissimo.',
    'Bravo, {name}. Une récompense amplement méritée.'],
  ["{name} está entre los candidatos al Balón de Oro. Ya era hora, la verdad.",
    "{name} on the Ballon d'Or list. About time, to be honest.",
    "{name} steht auf der Ballon-d’Or-Liste. Wurde auch Zeit, ehrlich gesagt.",
    "{name} è tra i candidati al Pallone d'Oro. Era ora, a dire il vero.",
    "{name} figure parmi les candidats au Ballon d'Or. Il était temps, franchement."],
  ['Debut internacional de {name}. Un momento para disfrutar.',
    'A debut for {name} on the international stage. A moment to savour.',
    'Ein Debüt für {name} auf internationaler Bühne. Ein Moment zum Genießen.',
    'Esordio internazionale per {name}. Un momento da assaporare.',
    'Des débuts internationaux pour {name}. Un moment à savourer.'],
  ['Qué carrera la de {name}. Toca colgar las botas. Gracias por todo.',
    'What a career for {name}. Time to hang up the boots. Thanks for everything.',
    'Was für eine Karriere, {name}. Zeit, die Schuhe an den Nagel zu hängen. Danke für alles.',
    'Che carriera, {name}. È ora di appendere gli scarpini al chiodo. Grazie di tutto.',
    "Quelle carrière pour {name}. L'heure de raccrocher les crampons. Merci pour tout."],
  ['Todo mi respeto, {name}. Un profesional de verdad y una gran persona. Disfruta de tu retiro.',
    'Respect to {name}. A proper pro, a proper character. Enjoy retirement.',
    'Respekt, {name}. Ein echter Profi und ein großartiger Mensch. Genieß den Ruhestand.',
    'Rispetto per {name}. Un vero professionista e una gran persona. Goditi il ritiro.',
    'Respect à {name}. Un vrai pro, un vrai personnage. Profite bien de ta retraite.'],
  ['{lg} | {player} brilla en una victoria espectacular del {club}. Puro drama.',
    '{lg} | {player} stars as {club} pull off a stunning result. Pure drama.',
    '{lg} | {player} glänzt bei einem überraschenden Erfolg des {club}. Spannung pur.',
    '{lg} | {player} brilla nella splendida vittoria del {club}. Puro spettacolo.',
    '{lg} | {player} brille et le {club} signe un résultat retentissant. Du grand spectacle.'],
  ["Cómo está cambiando {player} la temporada del {club} en {lg}: análisis a fondo.",
    "How {player} is changing {club}'s season in {lg}: a deep dive.",
    'Wie {player} die Saison des {club} in {lg} verändert: eine ausführliche Analyse.',
    "Come {player} sta cambiando la stagione del {club} in {lg}: un'analisi approfondita.",
    'Comment {player} change la saison du {club} en {lg} : analyse en profondeur.'],
  ['Gran fin de semana en {lg}. {player} estuvo espectacular con el {club}.',
    'Great weekend in {lg}. {player} was superb for {club}.',
    'Starkes Wochenende in {lg}. {player} war überragend für {club}.',
    'Grande weekend in {lg}. {player} è stato super con il {club}.',
    'Super week-end en {lg}. {player} a été remarquable avec le {club}.'],
];
const langs = ['es', 'en', 'de', 'it', 'fr'];
const context = {};
for (const file of ['i18n.js', 'lang-en.js', 'lang-de.js', 'lang-it.js', 'lang-fr.js', 'lang-fem.js']) {
  runInNewContext(readFileSync(`legacy-game/src/${file}`, 'utf8'), context, { filename: file });
}
const socialSource = readFileSync('legacy-game/src/social-data.js', 'utf8');
const allSocialKeys = [...new Set([...socialSource.matchAll(/N_\(("(?:\\.|[^"\\])*")\)/g)].map((match) => JSON.parse(match[1])))];
for (const lang of langs.slice(1)) {
  for (const sourceKey of allSocialKeys) {
    assert.equal(typeof context.I18N[lang][sourceKey], 'string', `Missing ${lang} social translation key: ${sourceKey}`);
    const placeholders = (value) => [...value.matchAll(/\{\w+\}/g)].map((match) => match[0]).sort();
    assert.deepEqual(placeholders(context.I18N[lang][sourceKey]), placeholders(sourceKey), `${lang} social placeholder mismatch: ${sourceKey}`);
  }
  const catalog = {};
  for (const file of readdirSync(`i18n/${lang}`).filter((name) => name.endsWith('.json'))) {
    Object.assign(catalog, JSON.parse(readFileSync(`i18n/${lang}/${file}`, 'utf8')));
  }
  for (const row of translations) {
    assert.ok(row[0] in catalog, `Missing ${lang} translation catalog key: ${row[0]}`);
    assert.equal(catalog[row[0]], row[langs.indexOf(lang)], `Catalog/runtime translation mismatch for ${lang}: ${row[0]}`);
  }
}
for (const row of translations) {
  const [sourceKey] = row;
  assert.ok(socialSource.includes(`N_(${JSON.stringify(sourceKey)})`), `Missing Spanish source key: ${sourceKey}`);
  for (let i = 1; i < langs.length; i++) {
    const lang = langs[i];
    assert.equal(typeof context.I18N[lang][sourceKey], 'string', `Missing ${lang} translation: ${sourceKey}`);
    const sourcePlaceholders = [...sourceKey.matchAll(/\{\w+\}/g)].map((match) => match[0]).sort();
    const translatedPlaceholders = [...context.I18N[lang][sourceKey].matchAll(/\{\w+\}/g)].map((match) => match[0]).sort();
    assert.deepEqual(translatedPlaceholders, sourcePlaceholders, `${lang} placeholders changed: ${sourceKey}`);
  }
  for (let i = 0; i < langs.length; i++) {
    context.LANG = langs[i];
    context.FEM = false;
    assert.equal(context.tr(sourceKey), row[i], `Incorrect ${langs[i]} translation: ${sourceKey}`);
  }
}
context.LANG = 'en';
context.FEM = true;
assert.equal(context.tr(translations[6][0]), "{name} on the Women's Ballon d'Or list. About time, to be honest.", 'female Ballon d’Or override remains connected');
context.LANG = 'fr';
assert.equal(context.tr(translations[9][0]), 'Respect à {name}. Une vraie pro, un vrai personnage. Profite bien de ta retraite.', 'French female retirement wording remains connected');

const core = readFileSync('legacy-game/src/engine-core.js', 'utf8');
assert.match(core, /function clubName\(c\) \{ return c >= 0 && W\.clubs\[c\] \? W\.clubs\[c\]\.n : "—"; \}/, 'club display names continue to use the real world-data name without era aliases');
console.log(`Social localization tests passed: 13 corrected templates, ${allSocialKeys.length} social keys, five languages, placeholders and female overrides.`);
