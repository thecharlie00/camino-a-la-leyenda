/* pet-items.js — registro de objetos de la mascota (5.6): comida, cuidado, juguetes, accesorios y decoración.
   Añadir un accesorio = añadir su entrada aquí con su receta de vóxeles (o un generador), sin tocar código.
   Recetas: primitivas en vóxeles relativas al anclaje de su ranura, pensadas para una cabeza de 10 de ancho
   (se escalan a la talla real redondeando a vóxeles enteros). Colores: "T1"/"T2" = colores del club,
   letras = paleta de PetStyle.PAL, o hexadecimal.
   Ranuras: h cabeza · f cara · n cuello · b cuerpo · k espalda · p patas · l cola · t juguete (en la boca o al lado). */
var PET_RARITY = [["c", N_("Común")], ["r", N_("Rara")], ["e", N_("Épica")], ["l", N_("Legendaria")]];
var PET_SLOTS2 = [["h", N_("Cabeza")], ["f", N_("Cara")], ["n", N_("Cuello")], ["b", N_("Cuerpo")], ["k", N_("Espalda")], ["p", N_("Patas")], ["l", N_("Cola")], ["t", N_("Juguete")]];
var PET_FOOD = [
  {id: "food_basic", n: N_("Pienso básico"), d: N_("Llena la tripa. Cinco raciones."), price: 25, pack: 5, hun: 38, col: "#b98552", kind: "food"},
  {id: "food_prem", n: N_("Comida premium"), d: N_("Más rica y nutritiva. Cinco raciones."), price: 90, pack: 5, hun: 60, mood: 6, col: "#d9603a", kind: "food"},
  {id: "treat", n: N_("Chuches"), d: N_("Un subidón de alegría… que luego pasa factura. Cinco unidades."), price: 40, pack: 5, hun: 8, mood: 14, debt: 1, col: "#f070a8", kind: "treat"},
  {id: "treat_bone", n: N_("Hueso de premio"), d: N_("Para premiar los trucos. Cinco unidades."), price: 55, pack: 5, hun: 6, mood: 10, col: "#f4e6c8", kind: "treat"}
];
var PET_CARE_ITEMS = [
  {id: "shampoo", n: N_("Champú"), d: N_("Para tres baños."), price: 60, pack: 3, kind: "care"},
  {id: "brush", n: N_("Cepillo"), d: N_("Deja el pelo brillante. No se gasta."), price: 150, pack: 1, durable: 1, kind: "care"}
];
var PET_TOYS = [
  {id: "toy_ball", n: N_("Pelota de fútbol"), price: 50, model: "ball", kind: "toy"},
  {id: "toy_frisbee", n: N_("Disco volador"), price: 120, model: "frisbee", kind: "toy"},
  {id: "toy_rope", n: N_("Cuerda de nudos"), price: 80, model: "rope", kind: "toy"},
  {id: "toy_plush", n: N_("Peluche de balón"), price: 140, model: "plush", kind: "toy"}
];
/* gustos: cada accesorio tiene etiquetas; la personalidad decide qué le encanta y qué le fastidia */
var PET_ACC2 = [
  /* cabeza */
  {id: "cap", s: "h", n: N_("Gorra"), r: "c", price: 120, tags: ["sporty"], ico: "🧢", rec: [["box", -4, 0, -3, 3, 2, 3, "B"], ["box", -3, 3, -2, 2, 3, 2, "B"], ["box", -4, 0, 4, 3, 0, 6, "b"], ["box", -1, 2, 3, -0, 2, 3, "W"]]},
  {id: "cap_club", s: "h", n: N_("Gorra del club"), r: "r", price: 260, tags: ["sporty"], rec: [["box", -4, 0, -3, 3, 2, 3, "T1"], ["box", -3, 3, -2, 2, 3, 2, "T1"], ["box", -4, 0, 4, 3, 0, 6, "T2"], ["box", -1, 2, 3, 0, 2, 3, "T2"]]},
  {id: "bow", s: "h", n: N_("Lazo"), r: "c", price: 80, tags: ["cute"], ico: "🎀", rec: [["box", -4, 0, 0, -1, 2, 1, "M"], ["box", 1, 0, 0, 4, 2, 1, "M"], ["box", -1, 0, 0, 1, 1, 1, "m"]]},
  {id: "band", s: "h", n: N_("Cinta deportiva"), r: "c", price: 90, tags: ["sporty"], rec: [["box", -5, -2, -4, 4, -1, 4, "T1", "ring"]]},
  {id: "straw", s: "h", n: N_("Pamela"), r: "r", price: 250, tags: ["cute", "cozy"], ico: "👒", rec: [["box", -6, 0, -6, 5, 0, 5, "Y"], ["box", -3, 1, -3, 2, 3, 2, "Y"], ["box", -3, 1, -3, 2, 1, 2, "M"]]},
  {id: "grad", s: "h", n: N_("Birrete"), r: "r", price: 400, tags: ["regal"], ico: "🎓", rec: [["box", -3, 0, -3, 2, 1, 2, "K"], ["box", -5, 2, -5, 4, 2, 4, "K"], ["box", 4, 1, 4, 4, 1, 4, "Y"], ["box", 4, -1, 4, 4, 0, 4, "Y"]]},
  {id: "tophat", s: "h", n: N_("Sombrero de copa"), r: "r", price: 600, tags: ["regal", "silly"], ico: "🎩", rec: [["box", -5, 0, -5, 4, 0, 4, "K"], ["box", -3, 1, -3, 2, 6, 2, "K"], ["box", -3, 2, -3, 2, 2, 2, "R"]]},
  {id: "helmet", s: "h", n: N_("Casco de portero"), r: "r", price: 700, tags: ["brave", "sporty"], rec: [["box", -5, -3, -4, 4, 2, 4, "w", "shell"], ["box", -5, -1, 5, 4, -1, 5, "G"]]},
  {id: "crown", s: "h", n: N_("Corona de campeón"), r: "l", un: "cont", ud: N_("Gana una competición continental (Champions, Libertadores…)."), tags: ["regal", "shiny"], ico: "👑", rec: [["box", -4, 0, -4, 3, 1, 3, "Y", "ring"], ["box", -4, 2, -4, -4, 3, -4, "Y"], ["box", 3, 2, -4, 3, 3, -4, "Y"], ["box", -4, 2, 3, -4, 3, 3, "Y"], ["box", 3, 2, 3, 3, 3, 3, "Y"], ["box", -1, 2, 3, 0, 3, 3, "Y"], ["box", -1, 1, 3, 0, 1, 3, "R"]], glow: 1},
  {id: "star", s: "h", n: N_("Aura de estrella"), r: "l", un: "bdo", ud: N_("Gana el Balón de Oro."), tags: ["shiny", "regal"], ico: "🌟", rec: [["box", -5, 4, -5, 4, 4, 4, "L", "ring"]], glow: 1},
  /* cara */
  {id: "glasses", s: "f", n: N_("Gafas de pasta"), r: "c", price: 150, tags: ["cozy"], ico: "👓", rec: [["box", -4, 0, 0, -1, 2, 0, "K", "frame"], ["box", 1, 0, 0, 4, 2, 0, "K", "frame"], ["box", -1, 1, 0, 1, 1, 0, "K"]]},
  {id: "sun", s: "f", n: N_("Gafas de sol"), r: "c", price: 200, tags: ["shiny", "sporty"], ico: "🕶️", rec: [["box", -4, 0, 0, -1, 1, 0, "K"], ["box", 1, 0, 0, 4, 1, 0, "K"], ["box", -5, 2, 0, 5, 2, 0, "K"]]},
  {id: "disguise", s: "f", n: N_("Bigote de incógnito"), r: "r", price: 300, tags: ["silly"], ico: "🥸", rec: [["box", -4, 0, 0, -1, 2, 0, "K", "frame"], ["box", 1, 0, 0, 4, 2, 0, "K", "frame"], ["box", -3, -3, 1, 2, -3, 1, "t"], ["box", -3, -4, 1, -3, -4, 1, "t"], ["box", 2, -4, 1, 2, -4, 1, "t"]]},
  {id: "paint", s: "f", n: N_("Pintura con los colores del club"), r: "c", price: 70, tags: ["sporty", "silly"], rec: [["box", -4, -1, 0, -3, -1, 0, "T1"], ["box", -4, -2, 0, -3, -2, 0, "T2"], ["box", 2, -1, 0, 3, -1, 0, "T1"], ["box", 2, -2, 0, 3, -2, 0, "T2"]]},
  /* cuello */
  {id: "bell", s: "n", n: N_("Collar con cascabel"), r: "c", price: 60, tags: ["cute"], ico: "🔔", rec: [["box", -5, 0, -4, 4, 0, 4, "R", "ring"], ["box", -1, -2, 5, 0, -1, 5, "Y"]]},
  {id: "scarf", s: "n", n: N_("Bufanda del club"), r: "c", price: 150, tags: ["sporty", "cozy"], ico: "🧣", gen: "scarf"},
  {id: "bandana", s: "n", n: N_("Pañuelo"), r: "c", price: 90, tags: ["cute", "sporty"], rec: [["box", -5, 0, -4, 4, 1, 4, "R", "ring"], ["box", -2, -2, 5, 1, -1, 5, "R"], ["box", -1, -3, 5, 0, -3, 5, "R"]]},
  {id: "pearls", s: "n", n: N_("Collar de perlas"), r: "e", price: 900, tags: ["regal", "shiny"], ico: "📿", rec: [["box", -5, 0, -4, 4, 0, 4, "W", "beads"]]},
  {id: "whistle", s: "n", n: N_("Silbato de árbitro"), r: "r", price: 220, tags: ["sporty"], rec: [["box", -5, 0, -4, 4, 0, 4, "K", "ring"], ["box", -1, -3, 5, 1, -2, 6, "g"]]},
  {id: "medal", s: "n", n: N_("Medalla de campeón"), r: "e", un: "cup", ud: N_("Gana una copa nacional."), tags: ["shiny", "regal"], ico: "🏅", rec: [["box", -5, 0, -4, 4, 0, 4, "B", "ring"], ["box", -1, -3, 5, 1, -1, 5, "Y"]], glow: 1},
  {id: "gold", s: "n", n: N_("Oro con la selección"), r: "l", un: "nat", ud: N_("Gana un Mundial, una Eurocopa u otro gran torneo de selecciones."), tags: ["shiny", "regal"], ico: "🥇", rec: [["box", -5, 0, -4, 4, 0, 4, "R", "ring"], ["box", -2, -4, 5, 1, -1, 5, "Y"]], glow: 1},
  {id: "mvp", s: "n", n: N_("Medalla de MVP"), r: "e", un: "mvp", ud: N_("Gana un premio individual de la temporada."), tags: ["shiny", "regal"], rec: [["box", -5, 0, -4, 4, 0, 4, "P", "ring"], ["box", -2, -4, 5, 1, -1, 5, "w"], ["box", -1, -3, 6, 0, -2, 6, "Y"]], glow: 1},
  {id: "champscarf", s: "n", n: N_("Bufanda de campeón"), r: "e", un: "league", ud: N_("Gana una liga."), tags: ["sporty", "shiny"], gen: "scarf", gold: 1},
  /* cuerpo */
  {id: "jersey", s: "b", n: N_("Camiseta de tu club con dorsal"), r: "r", price: 350, tags: ["sporty"], gen: "jersey"},
  {id: "jersey_gk", s: "b", n: N_("Camiseta de portero"), r: "r", price: 350, tags: ["sporty", "brave"], gen: "jersey", colors: ["#c6f432", "#1b1d1f"]},
  {id: "bib", s: "b", n: N_("Peto de entrenamiento"), r: "c", price: 120, tags: ["sporty"], gen: "bib"},
  {id: "vest", s: "b", n: N_("Chaleco acolchado"), r: "c", price: 180, tags: ["cozy"], gen: "vest"},
  {id: "cape", s: "b", n: N_("Capa de superestrella"), r: "e", price: 2400, tags: ["regal", "shiny", "silly"], gen: "cape"},
  /* espalda */
  {id: "backpack", s: "k", n: N_("Mochila"), r: "c", price: 160, tags: ["cozy"], rec: [["box", -3, 0, -3, 2, 3, 2, "O"], ["box", -2, 1, 3, 1, 2, 3, "o"], ["box", -3, 4, -1, 2, 4, 0, "o"]]},
  {id: "wings", s: "k", n: N_("Alitas"), r: "e", price: 1800, tags: ["cute", "silly"], gen: "wings"},
  {id: "minigoal", s: "k", n: N_("Mini portería"), r: "e", price: 2200, tags: ["sporty", "silly"], rec: [["box", -5, 0, -1, -5, 4, -1, "W"], ["box", 4, 0, -1, 4, 4, -1, "W"], ["box", -5, 5, -1, 4, 5, -1, "W"], ["box", -4, 1, -2, 3, 4, -2, "w", "net"]]},
  /* patas */
  {id: "boots", s: "p", n: N_("Botitas con tacos"), r: "r", price: 420, tags: ["sporty"], gen: "boots", c: "#1b1d1f", c2: "#ffffff"},
  {id: "goldboots", s: "p", n: N_("Botitas doradas"), r: "l", un: "scorer", ud: N_("Gana un trofeo de máximo goleador."), tags: ["sporty", "shiny"], gen: "boots", c: "#e8c35a", c2: "#fff4c0", glow: 1},
  {id: "wrist", s: "p", n: N_("Muñequeras"), r: "c", price: 80, tags: ["sporty"], gen: "wrist"},
  {id: "socks", s: "p", n: N_("Calcetines del club"), r: "c", price: 100, tags: ["sporty", "cozy"], gen: "socks"},
  /* cola */
  {id: "tailbow", s: "l", n: N_("Lazo para la cola"), r: "c", price: 70, tags: ["cute"], gen: "tailbow"},
  {id: "tailrings", s: "l", n: N_("Anillos de colores"), r: "c", price: 90, tags: ["silly", "cute"], gen: "tailrings"},
  /* juguete (en la boca o a su lado) */
  {id: "bone", s: "t", n: N_("Hueso"), r: "c", price: 40, tags: ["cozy"], ico: "🦴", model: "bone"},
  {id: "ball", s: "t", n: N_("Pelota"), r: "c", price: 50, tags: ["sporty"], ico: "⚽", model: "ball"},
  {id: "teddy", s: "t", n: N_("Peluche"), r: "c", price: 120, tags: ["cute", "cozy"], ico: "🧸", model: "plush"},
  {id: "cup", s: "t", n: N_("Copa en miniatura"), r: "e", un: "league", ud: N_("Gana una liga."), tags: ["shiny", "regal"], ico: "🏆", model: "cup", glow: 1},
  {id: "boot", s: "t", n: N_("Bota dorada"), r: "l", un: "scorer", ud: N_("Gana un trofeo de máximo goleador."), tags: ["shiny", "sporty"], ico: "👟", model: "goldboot", glow: 1},
  {id: "glove", s: "t", n: N_("Guante de oro"), r: "l", un: "gk", ud: N_("Gana un premio al mejor portero."), tags: ["shiny", "brave"], ico: "🧤", model: "goldglove", glow: 1},
  /* premios de concursos (no se compran) */
  {id: "ribbon_local", s: "n", n: N_("Escarapela de campeón local"), r: "r", un: "cont_local", ud: N_("Gana un concurso local de mascotas."), tags: ["shiny"], rec: [["box", -5, 0, -4, 4, 0, 4, "B", "ring"], ["box", -1, -2, 5, 0, -1, 5, "B"], ["box", -1, -3, 5, -1, -3, 5, "b"], ["box", 0, -3, 5, 0, -3, 5, "b"]]},
  {id: "sash_nat", s: "b", n: N_("Banda de campeón nacional"), r: "l", un: "cont_nac", ud: N_("Gana un concurso nacional de mascotas."), tags: ["regal", "shiny"], gen: "sash", glow: 1},
  {id: "laurel", s: "h", n: N_("Corona de laurel"), r: "e", un: "cont_com", ud: N_("Gana un concurso comarcal de mascotas."), tags: ["regal"], rec: [["box", -5, 0, -4, 4, 0, 4, "N", "ring"], ["box", -5, 1, -4, 4, 1, 4, "n", "beads"]]}
];
var PET_DECOR = [
  {id: "bed", n: N_("Cama mullida"), price: 300, model: "bed", fixed: 1},
  {id: "bowl_food", n: N_("Comedero"), price: 0, model: "bowl_food", fixed: 1},
  {id: "bowl_water", n: N_("Bebedero"), price: 0, model: "bowl_water", fixed: 1},
  {id: "basket", n: N_("Cesta de juguetes"), price: 250, model: "basket"},
  {id: "goal", n: N_("Mini portería"), price: 900, model: "goal"},
  {id: "poster", n: N_("Póster de tu club"), price: 200, model: "poster"},
  {id: "pennant", n: N_("Banderín del club"), price: 120, model: "pennant"},
  {id: "plant", n: N_("Maceta"), price: 140, model: "plant"},
  {id: "rug", n: N_("Alfombra con escudo"), price: 380, model: "rug"},
  {id: "lamp", n: N_("Farolillo"), price: 260, model: "lamp"},
  {id: "trophy_local", n: N_("Trofeo de concurso local"), un: 1, model: "trophy1"},
  {id: "trophy_com", n: N_("Trofeo de concurso comarcal"), un: 1, model: "trophy2"},
  {id: "trophy_nac", n: N_("Trofeo de concurso nacional"), un: 1, model: "trophy3"}
];
/* trucos: básicos, futboleros y especiales (por vínculo alto) */
var PET_TRICKS2 = [
  {k: "sit", n: N_("Sentarse"), cat: "b", d: 0.6, g: "down"},
  {k: "lie", n: N_("Tumbarse"), cat: "b", d: 0.8, g: "down2"},
  {k: "paw", n: N_("Dar la pata"), cat: "b", d: 0.9, g: "right"},
  {k: "spin", n: N_("Dar una vuelta"), cat: "b", d: 0.9, g: "circle"},
  {k: "jump", n: N_("Saltar"), cat: "b", d: 0.8, g: "up"},
  {k: "roll", n: N_("Rodar"), cat: "b", d: 1.1, g: "zig"},
  {k: "dead", n: N_("Hacerse el muerto"), cat: "b", d: 1.2, g: "left"},
  {k: "nose", n: N_("Toque con el morro"), cat: "f", d: 1.0, ball: 1, g: "tap2"},
  {k: "header", n: N_("Cabezazo"), cat: "f", d: 1.2, ball: 1, g: "upup"},
  {k: "pass", n: N_("Pase con la pata"), cat: "f", d: 1.1, ball: 1, g: "rightright"},
  {k: "dribble", n: N_("Conducción"), cat: "f", d: 1.2, ball: 1, g: "wave"},
  {k: "juggle", n: N_("Malabares"), cat: "f", d: 1.5, ball: 1, g: "circle2"},
  {k: "control", n: N_("Control orientado"), cat: "f", d: 1.2, ball: 1, g: "downup"},
  {k: "save", n: N_("Parada de portero"), cat: "f", d: 1.3, ball: 1, g: "leftright"},
  {k: "kneeslide", n: N_("Celebración: rodillazo"), cat: "f", d: 1.2, g: "slash"},
  {k: "flip", n: N_("Celebración: voltereta"), cat: "f", d: 1.4, g: "loop"},
  {k: "dive", n: N_("Tirarse a la piscina"), cat: "f", d: 1.0, g: "downleft"},
  {k: "combo", n: N_("Combo encadenado"), cat: "s", d: 1.6, bond: 75, g: "star"},
  {k: "mycel", n: N_("Imitar tu celebración"), cat: "s", d: 1.5, bond: 80, g: "heart"}
];
function petItem(id) {
  var L = [PET_FOOD, PET_CARE_ITEMS, PET_TOYS, PET_ACC2, PET_DECOR];
  for (var i = 0; i < L.length; i++) for (var j = 0; j < L[i].length; j++) if (L[i][j].id === id) return L[i][j];
  return null;
}
function petTrick(k) { for (var i = 0; i < PET_TRICKS2.length; i++) if (PET_TRICKS2[i].k === k) return PET_TRICKS2[i]; return null; }
