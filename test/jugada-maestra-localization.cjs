const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const keys = [
  'Jugada Maestra', 'Dibuja pases y tiros, y resuelve la jugada.',
  'Campo de fútbol. Arrastra desde el balón hacia un compañero o compañera, o hacia la portería.',
  'Pasar a un compañero o compañera', '¡Gol! La jugada termina en la red.',
  'La defensa tapa el disparo. Busca primero una línea de tiro.',
  'El portero llega a tu disparo. Prueba con más espacio o cambia el ángulo.',
  'Busca un espacio o apunta a un compañero o compañera.', 'Pase completado: el equipo conserva la posesión.',
  'Pase interceptado. Aún puedes reaccionar si te queda otra acción.',
  'Retos independientes: no cambian el resultado ni las estadísticas de tus carreras.',
  'Acciones: {n}/{max}', 'O elige un pase asistido', 'Pase {n}', 'Tirar a puerta',
  '¡Jugada completada!', 'La defensa gana esta vez', 'Medalla conseguida: {medal}',
  'Puedes intentarlo otra vez sin coste ni penalización.', 'Volver a intentarlo', 'Volver a retos',
  'Jugada {n} de 30', 'Capítulo {n}: {title}', 'Orientación y pase', 'Ataca el espacio', 'Paredes y apoyos', 'Tiro y remate', 'Decide bajo presión', 'Retos', 'Salir', 'Pase y orientación',
  'Lleva el balón a la zona libre y termina la jugada.', 'El desmarque',
  'Encuentra a quien ataca el espacio a la espalda.', 'Pared',
  'Combina con un apoyo y busca la devolución.', 'Tiro colocado',
  'Abre el ángulo y apunta a un lado de la portería.', 'Centro desde la banda',
  'Supera la presión y encuentra el remate en el área.', 'Contraataque',
  'Avanza con decisión: tienes pocas acciones antes del repliegue.'
];
/* cadenas de la integración de Jugada Maestra en el partido (panel y comentario) */
const matchKeys = [
  "¡Arranca el partido! {us} contra {opp}.",
  "Jugada Maestra en el {club}: el partido se detiene en una ocasión clara.",
  "Falta de {name}, que ya tenía amarilla: segunda amarilla y roja. Os quedáis con diez.",
  "¡Entrada durísima de {name}! Roja directa: os quedáis con diez.",
  "Falta de {name} cortando la jugada: amarilla.",
  "Falta de {x}, que ya tenía amarilla: roja y el rival se queda con diez.",
  "Falta de {x} para frenar el contragolpe: amarilla.",
  "{name} se duele y pide el cambio.",
  "Descanso: {a}-{b}.",
  "¡Final del partido! {a}-{b}.",
  "Cambio: entra {a}, sale {b}.",
  "Cambias la mentalidad: {m}.",
  "Cambias al {f}.",
  "Encerrarse",
  "Defensiva",
  "Equilibrada",
  "Ofensiva",
  "Presión alta",
  "En directo",
  "¿Ves el partido o lo simulas?",
  "{us} contra {opp}. Si lo ves, podrás cambiar la mentalidad, el sistema y hacer hasta cinco cambios durante el partido.",
  "Ver el partido",
  "Minuto a minuto, con cambios tácticos.",
  "Bajas al banquillo. Empieza el partido.",
  "Simular el partido",
  "Lo sigues desde la grada.",
  "Simular el resto del tramo",
  "No te volveremos a preguntar hasta el próximo tramo.",
  "Dejas que el equipo juegue.",
  "Partido en curso",
  "Minuto {min}: {a}-{b} contra el {opp}.",
  "Volver al partido",
  "Simular lo que queda",
  "Simulas el resto del partido.",
  "«{answer}»",
  "Objetivos",
  "Temporada {season}",
  "Elige tus objetivos de la temporada",
  "Cuanto más difícil, mayor recompensa si lo cumples.",
  "Confirmar objetivos",
  "Cambias «{k}»: {o}.",
  "Campo de fútbol. Arrastra desde el balón hacia un compañero o compañera, o hacia la portería.",
  "Gol: la jugada acaba en la red. El marcador y las estadísticas ya lo reflejan.",
  "La defensa despeja el balón. La jugada no se repite.",
  "Pérdida: el rival corta la jugada y se lleva el balón.",
  "El portero llega: parada y el juego sigue.",
  "Al palo: la jugada se queda ahí.",
  "El disparo se marcha fuera. El partido continúa.",
  "Dibuja desde el balón hacia un compañero o compañera, o hacia la portería.",
  "Jugada Maestra",
  "Ocasión para el {club}",
  "Final",
  "La jugada ya está resuelta. Vuelve al partido cuando quieras.",
  "El partido está en pausa. Dibuja desde el balón hacia un compañero o hacia la portería: la jugada se resuelve una sola vez.",
  "Acciones: {n}/{max}",
  "O elige un pase asistido",
  "Pase {n}",
  "Tirar a puerta",
  "Dejar que decida el equipo",
  "Última acción de la jugada.",
  "Continuar el partido",
  /* carrera de jugador/a: tarjeta de la ocasión, panel y ajuste */
  "Ocasión para {name}",
  "El partido se detiene en una ocasión para {name}. Dibuja la jugada: si acaba en gol, el tanto es tuyo, y solo se resuelve una vez.",
  "Jugar la jugada",
  "Tu ocasión ya estaba en el partido: la jugada decide si acaba en gol, parada, despeje o pérdida.",
  "En una ocasión por partido el juego se detiene y dibujas la jugada: si acaba en gol, el tanto es tuyo, sin repetirla.",
  "Tus partidos se resuelven como hasta ahora, sin interrupciones.",
  "Gol: el tanto es tuyo y cuenta en tus estadísticas.",
];
const vars = (text) => [...text.matchAll(/\{\w+\}/g)].map((x) => x[0]).sort();
const ctx = {I18N: {en: {}, de: {}, it: {}, fr: {}}};
vm.createContext(ctx);
for (const lang of ['en', 'de', 'it', 'fr']) vm.runInContext(fs.readFileSync(`legacy-game/src/lang-${lang}.js`, 'utf8'), ctx, {filename: `lang-${lang}.js`});
for (const lang of ['en', 'de', 'it', 'fr']) {
  const catalog = {};
  for (const f of fs.readdirSync(`i18n/${lang}`).filter((x) => x.endsWith('.json'))) Object.assign(catalog, JSON.parse(fs.readFileSync(`i18n/${lang}/${f}`, 'utf8')));
  for (const key of keys.concat(matchKeys)) {
    const value = ctx.I18N[lang][key];
    assert.equal(typeof value, 'string', `${lang} missing runtime translation: ${key}`);
    assert.deepEqual(vars(value), vars(key), `${lang} placeholder mismatch: ${key}`);
    assert.equal(catalog[key], value, `${lang} catalog/runtime mismatch: ${key}`);
  }
}
console.log('Jugada Maestra localization tests passed for EN/DE/IT/FR and placeholders.');
