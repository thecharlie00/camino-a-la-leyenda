/* sp-data.js — datos ajustables de los minijuegos de balón parado (5.6): física, equilibrio, perfiles de
   porteros y lanzadores, contextos de estadio, retos y recompensas. Se cambian aquí sin tocar el código. */
var SP_DATA = {
  /* física del balón (unidades SI) */
  phys: {
    dt: 1 / 240, g: 9.81, r: 0.11, drag: 0.0125, magnus: 0.0032, spinDecay: 0.06,
    knuckle: 2.6, knuckleF: 2.4, groundE: 0.56, groundEWet: 0.64, groundF: 0.74, postE: 0.62, postR: 0.06,
    goalW: 7.32, goalH: 2.44, netD: 2.0, netBackH: 1.9, keeperE: 0.35
  },
  /* tipos de golpeo: velocidad típica (m/s), rotación (rad/s) y animación */
  shots: {
    placed: {v: [17, 23], spin: 8, clip: "inside", n: N_("Colocado")},
    power: {v: [25, 33], spin: 4, clip: "laces", n: N_("Potente")},
    curl: {v: [19, 26], spin: 55, clip: "inside", n: N_("Rosca")},
    outside: {v: [20, 27], spin: 45, clip: "outside", n: N_("Exterior")},
    dip: {v: [24, 30], spin: 38, clip: "laces", n: N_("Folha seca")},
    knuckle: {v: [25, 31], spin: 0.5, clip: "laces", n: N_("Sin rotación")},
    chip: {v: [8, 11], spin: 10, clip: "chip", n: N_("Vaselina")}
  },
  /* equilibrio (objetivos de referencia: penaltis 70-80 % gol, 20-30 % parada; faltas, bastantes menos) */
  bal: {
    errBase: 0.18, errPower: 0.35, errPress: 0.4, errBadFoot: 0.6, errSkill: 0.55,
    gkReactBase: 0.31, gkReactSkill: 0.09, gkReach: 2.75, gkReachSkill: 0.6, gkDiveSpeed: 5.4,
    wallJump: 0.45, wallTimingVar: 0.08, blindLag: 0.12,
    trainHelpAfter: 6, trainHelpMax: 0.06
  },
  /* porteros rivales: lado preferido (-1 izquierda del lanzador, 1 derecha), adivina (0 espera … 1 adivina siempre),
     reflejos y alcance (0..1), distracción en la línea, adaptación a tus repeticiones */
  keepers: [
    {k: "guess", n: N_("Adivinador"), side: 0, guess: 0.85, refl: 0.5, reach: 0.6, dance: 0.2, adapt: 0.5, early: 0.08},
    {k: "wait", n: N_("Paciente"), side: 0, guess: 0.25, refl: 0.8, reach: 0.55, dance: 0.05, adapt: 0.7, early: 0.0},
    {k: "left", n: N_("Zurdo de instinto"), side: -1, guess: 0.7, refl: 0.55, reach: 0.65, dance: 0.4, adapt: 0.4, early: 0.05},
    {k: "right", n: N_("Diestro de instinto"), side: 1, guess: 0.7, refl: 0.55, reach: 0.65, dance: 0.3, adapt: 0.4, early: 0.05},
    {k: "showman", n: N_("Showman"), side: 0, guess: 0.6, refl: 0.6, reach: 0.7, dance: 0.9, adapt: 0.5, early: 0.12},
    {k: "wall", n: N_("Muro"), side: 0, guess: 0.45, refl: 0.9, reach: 0.8, dance: 0.1, adapt: 0.8, early: 0.02}
  ],
  /* lanzadores rivales: lado preferido, potencia frente a colocación, panenka, pausa, nervios y lo bien que disimulan */
  takers: [
    {k: "placer", n: N_("Colocador"), side: 0, power: 0.3, panenka: 0.03, pause: 0.1, nerves: 0.3, hide: 0.4, high: 0.25},
    {k: "blaster", n: N_("Cañonero"), side: 0, power: 0.9, panenka: 0.0, pause: 0.0, nerves: 0.4, hide: 0.2, high: 0.45},
    {k: "lefty", n: N_("Siempre a su izquierda"), side: -1, power: 0.5, panenka: 0.02, pause: 0.05, nerves: 0.3, hide: 0.1, high: 0.3},
    {k: "righty", n: N_("Siempre a su derecha"), side: 1, power: 0.5, panenka: 0.02, pause: 0.05, nerves: 0.3, hide: 0.1, high: 0.3},
    {k: "cool", n: N_("Sangre fría"), side: 0, power: 0.45, panenka: 0.15, pause: 0.45, nerves: 0.05, hide: 0.8, high: 0.3},
    {k: "nervous", n: N_("Nervioso"), side: 0, power: 0.6, panenka: 0.0, pause: 0.0, nerves: 0.85, hide: 0.05, high: 0.5}
  ],
  /* especialistas de falta (rivales) */
  fkTakers: [
    {k: "curler", n: N_("Rosca"), shot: "curl", far: 0.7, under: 0.05, hide: 0.4},
    {k: "cannon", n: N_("Potencia"), shot: "power", far: 0.5, under: 0.1, hide: 0.2},
    {k: "dipper", n: N_("Folha seca"), shot: "dip", far: 0.4, under: 0.0, hide: 0.5},
    {k: "sneaky", n: N_("Por debajo de la barrera"), shot: "placed", far: 0.4, under: 0.45, hide: 0.6},
    {k: "nearpost", n: N_("Al palo del portero"), shot: "curl", far: 0.1, under: 0.05, hide: 0.5},
    {k: "knuckler", n: N_("Sin rotación"), shot: "knuckle", far: 0.5, under: 0.0, hide: 0.3}
  ],
  /* contextos de estadio según la importancia */
  ctx: [
    {k: "barrio", n: N_("Campo de barrio"), crowd: 0.15, stands: 0},
    {k: "small", n: N_("Estadio pequeño"), crowd: 0.45, stands: 1},
    {k: "big", n: N_("Gran estadio"), crowd: 0.8, stands: 2},
    {k: "final", n: N_("Final"), crowd: 1, stands: 2, confetti: 1}
  ],
  /* retos especiales: una sola oportunidad, recompensa propia */
  challenges: [
    {k: "fk93", kind: "fk", n: N_("Minuto 93, perdiendo 1-0"), d: N_("Falta frontal a 22 metros. Si entra, empate."), dist: 22, ang: 0, press: 0.9, reward: 900, ctx: "big"},
    {k: "cupfinal", kind: "pen", n: N_("Final de copa"), d: N_("Último penalti de la tanda. Si marcas, campeón."), press: 1, reward: 1200, ctx: "final"},
    {k: "gkwall", kind: "gkfk", n: N_("El especialista"), d: N_("El mejor lanzador de la liga tira desde la frontal. Para y gana."), dist: 19, ang: -0.2, press: 0.7, reward: 800, ctx: "big"},
    {k: "gkpen", kind: "gkpen", n: N_("Muerte súbita"), d: N_("Si paras este, ganáis la tanda."), press: 1, reward: 1000, ctx: "final"},
    {k: "farfk", kind: "fk", n: N_("Desde muy lejos"), d: N_("Falta a 33 metros. Solo un golpeo perfecto entra."), dist: 33, ang: 0.15, press: 0.4, reward: 700, ctx: "small"}
  ],
  /* entrenamiento: dianas */
  targets: [
    {k: "corners", n: N_("Escuadras"), pts: [[-3.2, 2.1], [3.2, 2.1]], r: 0.55},
    {k: "low", n: N_("Al palo, raso"), pts: [[-3.1, 0.35], [3.1, 0.35]], r: 0.55},
    {k: "rings", n: N_("Aros"), pts: [[-2.4, 1.5], [0, 2.0], [2.4, 1.5]], r: 0.5}
  ],
  /* recompensas y logros (dinero en €, accesorios y celebraciones) */
  rewards: {goalTrain: 0, challengeMul: 1, achGold: 1},
  ach: [
    {k: "panenka", n: N_("Sangre helada"), d: N_("Marca un penalti a lo Panenka."), money: 300},
    {k: "fktop", n: N_("A la escuadra"), d: N_("Marca una falta directa por la escuadra."), money: 400},
    {k: "savefinal", n: N_("Héroe de la final"), d: N_("Para un penalti en una final."), money: 600},
    {k: "postin", n: N_("Palo y dentro"), d: N_("Marca después de tocar el poste."), money: 200},
    {k: "hattrickfk", n: N_("Especialista"), d: N_("Marca tres faltas directas."), money: 700},
    {k: "wallwin", n: N_("Barrera perfecta"), d: N_("Para una falta sin que la barrera toque el balón."), money: 300},
    {k: "shoot5", n: N_("Infalible"), d: N_("Marca cinco penaltis seguidos."), money: 500}
  ],
  celebs: [
    {k: "arms", n: N_("Brazos al cielo")}, {k: "slide", n: N_("Rodillazo")}, {k: "plane", n: N_("Avión")},
    {k: "jump", n: N_("Salto con puño"), un: "shoot5"}, {k: "silence", n: N_("Silencio al público"), un: "panenka"}, {k: "flip", n: N_("Voltereta"), un: "fktop"}
  ]
};
