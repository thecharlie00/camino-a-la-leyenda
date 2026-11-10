/* Fase 9 del Modo Épocas: el partido en 3D y los minijuegos con el aspecto de su año (erascene/scene.json).
   Terreno, balón (color y vuelo), árbitro de negro hasta 1993, dorsales del 1 al 11 mientras no hay dorsales fijos,
   vallas estáticas y filtro de televisión de la época. Sin contexto de Épocas devuelve null y nada cambia. */
var ERA_SCENE = (ERAS_DATA && ERAS_DATA.scene) || null;
function eraScene3D() {
  if (!ERA_SCENE || !eraContextForYear(S && S.yr)) return null;
  return eraSceneFor(S.yr, eraContextForYear(S.yr));
}
function eraSceneFor(year, prof) {
  prof = prof || eraProfileForYear(year);
  var pr = prof && prof.presentation, rules = prof && prof.rules;
  if (!pr) return null;
  var out = {}, pitch = ERA_SCENE.pitch[pr.pitchWear], ball = ERA_SCENE.ball[pr.ball], ref = ERA_SCENE.referee;
  if (pitch) { out.grassMix = pitch.grassMix; out.grassMul = pitch.grassMul || null; }
  if (ball) { out.ball = ball.colors; out.ballDur = ball.dur; }
  out.tv = ERA_SCENE.tv[pr.broadcast] || null;
  out.staticBoards = ERA_SCENE.staticBoards.indexOf(pr.adBoards) >= 0;
  out.numbers = rules ? rules.fixedShirtNumbers === false : false;
  out.ref = year <= ref.blackUntil ? [0.04, 0.045, 0.05] : ref.colours[year % ref.colours.length];
  return out;
}
/* textos de lo que de verdad cambia (para la ficha de reglas) */
function eraSceneLines(year) {
  if (!ERA_SCENE) return [];
  var prof = eraContextForYear(year) || eraProfileForYear(year), pr = prof && prof.presentation, rules = prof && prof.rules, out = [];
  if (!pr) return out;
  out.push(eraText(year <= ERA_SCENE.referee.blackUntil ? "Árbitro vestido de negro." : "Árbitro con camiseta de color."));
  if (rules && rules.fixedShirtNumbers === false) out.push(eraText("Dorsales del 1 al 11 según la alineación."));
  if (ERA_SCENE.pitch[pr.pitchWear]) out.push(eraText(pr.pitchWear === "mud-winter" ? "Terreno embarrado y gastado." : "Césped en transición al híbrido, algo gastado."));
  if (ERA_SCENE.ball[pr.ball]) out.push(eraText(pr.ball === "heavy-leather" ? "Balón de cuero marrón y pesado: vuela más despacio." : "Balón clásico blanco y negro, algo más lento que el actual."));
  if (ERA_SCENE.staticBoards.indexOf(pr.adBoards) >= 0) out.push(eraText("Vallas publicitarias estáticas, sin luces."));
  if (ERA_SCENE.tv[pr.broadcast]) out.push(eraText(ERA_SCENE.tv[pr.broadcast] === "sd169" ? "Imagen de televisión de definición estándar." : "Imagen de televisión 4:3 de la época, con grano."));
  var mg = ERA_SCENE.minigames;
  if (year <= mg.gkStillUntil) out.push(eraText("Penaltis: el portero no puede moverse antes del lanzamiento."));
  if (mg.ballSkill[pr.ball]) out.push(eraText("Faltas y penaltis con un balón que pesa más."));
  return out;
}
(function installEraScene() {
  if (!ERAS_MODE || !ERA_SCENE) return;
  /* filtro de televisión: CSS propio para el lienzo 3D y para los minijuegos */
  function css() {
    if (typeof document === "undefined" || document.getElementById("eras-tv-style")) return;
    var st = document.createElement("style"); st.id = "eras-tv-style";
    st.textContent = "canvas.era-tv-grainy{filter:saturate(.62) contrast(1.12) sepia(.22) blur(.35px)}canvas.era-tv-sd43{filter:saturate(.82) contrast(1.06) blur(.3px)}canvas.era-tv-sd169{filter:saturate(.9) blur(.2px)}" +
      ".era-tv-layer{position:absolute;inset:0;z-index:18;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(0,0,0,.16) 0 1px,transparent 1px 3px)}" +
      ".era-tv-layer.era-tv-grainy,.era-tv-layer.era-tv-sd43{box-shadow:inset 0 0 40px rgba(0,0,0,.55)}.era-tv-layer.era-tv-grainy::before,.era-tv-layer.era-tv-sd43::before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,#000 0 12.5%,transparent 12.5% 87.5%,#000 87.5%)}" +
      ".era-tv-layer.era-tv-sd169{background:repeating-linear-gradient(0deg,rgba(0,0,0,.08) 0 1px,transparent 1px 3px)}" +
      "body.era-mg-grainy .mg-ov .mg-box svg,body.era-mg-grainy .mg-ov canvas{filter:saturate(.62) contrast(1.12) sepia(.22)}body.era-mg-sd43 .mg-ov .mg-box svg,body.era-mg-sd43 .mg-ov canvas{filter:saturate(.82) contrast(1.06)}";
    document.head.appendChild(st);
  }
  css();
  /* minijuegos: reglas y balón de la época (el portero quieto hasta 1996 pesa en sus paradas) */
  if (typeof Minigame !== "undefined" && Minigame) {
    ["penalty", "freekick", "gkPenalty", "gkFreekick"].forEach(function (name) {
      var base = Minigame[name]; if (typeof base !== "function") return;
      Minigame[name] = function (opt, done) {
        var scene = null, year = opt && opt.eraYear ? +opt.eraYear : S && S.yr, prof = null;
        try { prof = opt && opt.eraYear ? eraProfileForYear(year) : eraContextForYear(S && S.yr); scene = prof ? eraSceneFor(year, prof) : null; } catch (e) { scene = null; }
        if (!scene) return base.apply(this, arguments);
        var mg = ERA_SCENE.minigames, o = Object.assign({}, opt || {}), adj = mg.ballSkill[prof.presentation.ball] || 0;
        if (year <= mg.gkStillUntil && (name === "penalty" || name === "gkPenalty")) o.gk = (o.gk != null ? +o.gk : 70) + mg.gkAdj;
        if (adj && (name === "penalty" || name === "freekick")) o.skill = (o.skill != null ? +o.skill : 70) + adj;
        css();
        var cls = scene.tv ? "era-mg-" + scene.tv : "";
        if (cls) document.body.classList.add(cls);
        return base.call(this, o, function (res) { if (cls) document.body.classList.remove(cls); if (typeof done === "function") done(res); });
      };
    });
  }
})();
