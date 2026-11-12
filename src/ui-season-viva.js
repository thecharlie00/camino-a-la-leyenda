/* ui-season-viva.js — acceso contextual a la próxima acción y presentación de crónicas. */
(function () {
  if (typeof UIX === "undefined" || typeof SeasonViva === "undefined") return;
  var U = UIX, h = U.h;
  function focusCard() {
    var x = SeasonViva.focus();
    if (!x) return "";
    return '<section class="card viva-focus" role="region" aria-labelledby="viva-focus-title"><div class="head"><span class="tag">' + h(tr("Foco de jornada")) + '</span><span class="eyebrow">' + h(x.title) + '</span></div>' +
      '<p class="lead" id="viva-focus-title" style="margin:4px 0 10px">' + h(x.detail) + '</p><button class="btn sm" data-a="' + h(x.action) + '"' + (x.value ? ' data-v="' + h(x.value) + '"' : "") + '>' + h(x.label) + "</button></section>";
  }
  U.add("carreraTop", function () { return S && S.mode !== "mgr" ? focusCard() : ""; });
  U.add("clubTop", function () { return S && S.mode === "mgr" ? focusCard() : ""; });
  U.actions.vivafocus = function () {
    var d = document.querySelector(".wkcard");
    if (d) {
      d.open = true;
      try { d.scrollIntoView({behavior: window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center"}); } catch (e) {}
    } else {
      U.ui().tab = "plantilla";
      U.render(false);
    }
  };
})();
