/* pet-style.js — constantes de estilo de la mascota (5.6). Todo el sistema de mascota lee de aquí.
   Mismo motor, luz y sombra que el partido 3D (Pitch3D.core). El vóxel de la mascota es la mitad exacta
   del detalle de los jugadores (4 cm), para que encaje a escala junto a ellos. */
var PetStyle = {
  VOXEL_SIM: 0.04,
  VOXEL: 0.02,
  /* paleta compartida: la de los iconos pixel del juego más tonos de la simulación */
  PAL: {
    K: "#1b1b24", W: "#ffffff", w: "#d8dde3", g: "#8a929c", G: "#4a5260", R: "#e2403a", r: "#9e2422", O: "#f08a24", o: "#b3561a",
    Y: "#f6c83a", y: "#c08a1c", L: "#ffe98a", N: "#4cb84a", n: "#2a7a32", B: "#3a7ad8", b: "#23468e", C: "#6fd0f0", P: "#a05ad0",
    p: "#6a3494", S: "#f2c09a", s: "#c88a62", T: "#8a5a34", t: "#5a3a20", M: "#f070a8", m: "#c04a7e",
    eye: "#16141c", shine: "#ffffff", blush: "#ff8fb0", mud: "#6b4a2b", mud2: "#4f3520", foam: "#f4f8ff", wood: "#9a6a3e", wood2: "#6e4628"
  },
  /* luz: exposición sobre la del partido e intensidad de farolas por la noche */
  LIGHT: {exposure: 1.0, nightFlood: 0.16, duskFlood: 0.08},
  /* oclusión ambiental por vértice (niveles 0..3) — la misma tabla que usa vox-core */
  AO: [0.55, 0.72, 0.87, 1.0],
  /* reflejo del suelo y radio de la sombra */
  REFLECT: 0.35, SHADOW_R: 3.2,
  /* calidad: alta (sombras, reflejo, física secundaria) o baja */
  QUALITY_KEY: "camino.petq",
  quality: function () { try { return localStorage.getItem(this.QUALITY_KEY) || "auto"; } catch (e) { return "auto"; } },
  setQuality: function (v) { try { localStorage.setItem(this.QUALITY_KEY, v); } catch (e) {} },
  /* colores del club del jugador para camisetas, bufandas y banderines */
  teamColors: function () {
    try { var cc = clubColors(W.clubs[S.p.club].n); return [cc[0] || "#c8312f", cc[1] || "#f2f2f2"]; } catch (e) { return ["#c8312f", "#f2f2f2"]; }
  }
};
