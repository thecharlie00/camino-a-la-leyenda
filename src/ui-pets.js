/* ui-pets.js — tarjeta y hoja de la mascota (pestaña Jugador). */
(function () {
  if (typeof UIX === "undefined" || typeof PET_DEF === "undefined") return;
  var U = UIX, h = U.h;
  function rer() { U.persist(); U.renderSheet(); U.render(false); }
  function chips(d) {
    var m = (isGK() ? d.gk : d.att) || {}, out = [];
    Object.keys(m).forEach(function (a) { out.push('<span class="chip up">+' + m[a] + " " + h(tr(ATT_NAMES[a])) + "</span>"); });
    out.push('<span class="chip up">' + tr("Moral +{n}", {n: d.mor}) + "</span>");
    if (d.calm) out.push('<span class="chip up">' + tr("Forma más estable") + "</span>");
    if (d.fame) out.push('<span class="chip up">' + tr("Fama y seguidores") + "</span>");
    if (d.risk) out.push('<span class="chip down">' + tr("Sustos y veterinario") + "</span>");
    return out.join("");
  }
  function petSize(pt) { return [34, 46, 58, 58][petStage(pt)]; }

  /* tarjeta en la pestaña Jugador */
  U.add("jugador", function () {
    if (!S || !S.p || U.isMgr() || !petOn()) return "";
    var pt = petOf();
    if (!pt) return '<button class="card petcta" data-a="petopen"><span class="petcta-ic" aria-hidden="true">🐾</span><span><b>' + tr("Adopta una mascota") + "</b><small>" + tr("Te acompaña, crece contigo y mejora tu ánimo.") + '</small></span><span class="chev" aria-hidden="true">›</span></button>';
    var d = petDef(pt.k);
    return '<button class="card petcard" data-a="petopen"><span class="petic" style="font-size:' + petSize(pt) + 'px" aria-hidden="true">' + petIco(pt) + "</span>" +
      '<span class="petinfo"><span class="eyebrow">' + tr("Tu mascota") + "</span><b>" + h(pt.nm) + "</b><small>" + h(tr(d.n)) + " · " + trn(pt.age, "{n} año", "{n} años") + " · " + h(tr(PET_STAGE[petStage(pt)])) + "</small>" +
      '<span class="petbond" aria-label="' + h(tr("Vínculo {n} %", {n: Math.round(pt.bond)})) + '"><i style="width:' + Math.round(pt.bond) + '%"></i></span></span>' +
      (pt.cared ? "" : '<span class="petdot" title="' + h(tr("Quiere jugar contigo")) + '">!</span>') + '<span class="chev" aria-hidden="true">›</span></button>';
  });
  U.actions.petopen = function () { U.ui().petTab = U.ui().petTab || "n"; U.ui().petPick = null; U.open("lpet"); };
  U.actions.pettab = function (b, v) { U.ui().petTab = v; U.ui().petPick = null; U.renderSheet(); };
  U.actions.petpick = function (b, v) { U.ui().petPick = v; U.renderSheet(); var i = document.getElementById("petnm"); if (i) i.focus(); };
  U.actions.petadopt = function () {
    var i = document.getElementById("petnm"), r = petAdopt(U.ui().petPick, i ? i.value : "");
    if (r.noName) { U.toast(tr("Ponle un nombre a tu mascota.")); return; }
    if (r.poor) { U.toast(tr("No tienes dinero suficiente.")); return; }
    if (r.ok) { U.edgeFlash(true); U.toast(tr("¡{pet} ya está en casa!", {pet: petOf().nm})); U.ui().petPick = null; rer(); }
  };
  U.actions.petcare = function () { if (petCare()) { U.toast(tr("Pasas la tarde con {pet}: el vínculo crece.", {pet: petOf().nm})); rer(); } };
  U.actions.petname = function () { var i = document.getElementById("petrn"); if (i && petRename(i.value)) { U.toast(tr("Ahora se llama {pet}.", {pet: petOf().nm})); rer(); } };

  U.sheets.lpet = function () {
    var pt = petOf(), L = lifeOf(), s;
    if (pt) {
      var d = petDef(pt.k), st = petStage(pt);
      s = '<h2>' + tr("Tu mascota") + '</h2><div class="stack"><div class="pethero"><span class="petic" style="font-size:' + (petSize(pt) + 30) + 'px" aria-hidden="true">' + petIco(pt) + '</span><div><b class="petnm">' + h(pt.nm) + "</b><small>" + h(tr(d.n)) + " · " + trn(pt.age, "{n} año", "{n} años") + "</small></div></div>";
      s += '<ol class="petstages">' + PET_STAGE.map(function (x, i) { return '<li class="' + (i < st ? "done" : i === st ? "now" : "") + '">' + h(tr(x)) + "</li>"; }).join("") + "</ol>";
      s += '<div><div class="lbl">' + tr("Vínculo") + ' · ' + Math.round(pt.bond) + ' %</div><div class="petbond big"><i style="width:' + Math.round(pt.bond) + '%"></i></div><p class="muted lfhint">' + tr("Cuanto más fuerte el vínculo, más te ayuda. Si no le dedicas tiempo, se debilita.") + "</p></div>";
      s += '<div class="chips">' + chips(d) + "</div>";
      s += '<button class="go" data-a="petcare"' + (pt.cared ? " disabled" : "") + ">" + (pt.cared ? tr("Ya habéis pasado tiempo juntos este tramo") : tr("Pasar tiempo con {pet}", {pet: h(pt.nm)})) + "</button>";
      s += '<p class="muted lfhint">' + tr("Gasto anual: {v}. Esperanza de vida: {a}–{b} años.", {v: fmtMoney(d.year), a: d.life[0], b: d.life[1]}) + "</p>";
      s += '<div class="petrn"><input id="petrn" maxlength="16" value="' + h(pt.nm) + '" aria-label="' + h(tr("Nombre")) + '"><button class="btn" data-a="petname">' + tr("Cambiar nombre") + "</button></div>";
    } else {
      var tab = U.ui().petTab || "n", pick = U.ui().petPick, list = PET_DEF.filter(function (x) { return tab === "x" ? x.ex : !x.ex; });
      s = '<h2>' + tr("Adoptar una mascota") + '</h2><div class="stack"><p class="muted" style="margin:0">' + tr("Llega como cría y crece contigo temporada a temporada. Tienes {m}.", {m: fmtMoney(S.p.money)}) + "</p>";
      s += '<div class="seg"><button data-a="pettab" data-v="n" aria-pressed="' + (tab === "n") + '">' + tr("Normales") + '</button><button data-a="pettab" data-v="x" aria-pressed="' + (tab === "x") + '">' + tr("Exóticas") + "</button></div>";
      if (tab === "x") s += '<p class="muted lfhint">' + tr("Las exóticas dan más fama, pero cuestan más y pueden dar sustos.") + "</p>";
      s += '<div class="petlist">' + list.map(function (d) {
        var on = pick === d.k, can = S.p.money >= d.price;
        return '<div class="petrow' + (on ? " on" : "") + '"><button class="petrowb" data-a="petpick" data-v="' + d.k + '" aria-pressed="' + on + '"' + (can ? "" : " disabled") + '><span class="petic" aria-hidden="true">' + d.ico[0] + '</span><span class="grow"><b>' + h(tr(d.n)) + "</b><small>" + h(tr(d.d)) + "</small><small class=\"muted\">" +
          tr("{p} · {y}/año · vive {a}–{b} años", {p: fmtMoney(d.price), y: fmtMoney(d.year), a: d.life[0], b: d.life[1]}) + '</small><span class="chips">' + chips(d) + "</span></span></button>" +
          (on ? '<div class="petadopt"><input id="petnm" maxlength="16" placeholder="' + h(tr("¿Cómo se va a llamar?")) + '" aria-label="' + h(tr("Nombre de la mascota")) + '"><button class="go" data-a="petadopt">' + tr("Adoptar") + "</button></div>" : "") + "</div>";
      }).join("") + "</div>";
    }
    if (L.petMem && L.petMem.length) s += '<div><div class="lbl">' + tr("En el recuerdo") + '</div><ul class="petmem">' + L.petMem.slice(-6).reverse().map(function (m) { var d = petDef(m.k); return "<li>🌈 <b>" + h(m.nm) + "</b> · " + h(d ? tr(d.n) : "") + " · " + m.y0 + "–" + m.y1 + "</li>"; }).join("") + "</ul></div>";
    return s + '<button class="btn wide" data-a="close">' + tr("Cerrar") + "</button></div>";
  };
})();
