/* ui-48.js — «Familia» (4.8), interfaz del modo entrenador: preparar la familia, cuidar la relación,
   seguir a tus hijos futbolistas y ficharlos. */
(function () {
  if (typeof UIX === "undefined") return;
  var U = UIX, h = U.h;
  function relWord(r) { return r >= 75 ? tr("Muy bien") : r >= 55 ? tr("Bien") : r >= 35 ? tr("Regular") : r >= 20 ? tr("Mal") : tr("Al límite"); }
  function relBar(r) { return '<div class="bar famrel"><i class="' + (r >= 55 ? "hi" : r >= 30 ? "mid" : "lo") + '" style="width:' + Math.max(3, Math.min(100, r)) + '%"></i></div>'; }
  function kidLine(k) {
    var I = famKidInfo(k), who = k.sib ? (k.g === "f" ? tr("Hermana") : tr("Hermano")) : k.g === "f" ? tr("Hija") : tr("Hijo");
    var s = "<b>" + h(k.fn) + "</b> · " + h(who) + (k.ad && !k.sib ? " " + h(k.g === "f" ? tr("adoptada") : tr("adoptado")) : "") + " · " + h(trn(I.age, "{n} año", "{n} años"));
    if (I.fb) s += I.fb.ret ? " · " + h(tr("retirado del fútbol")) : " · ⚽ " + h(I.club) + " · " + I.ovr + (I.mine ? ' <span class="chip up">' + h(tr("En tu plantilla")) + "</span>" : "");
    return s;
  }

  /* ---------- tarjeta en el club ---------- */
  function famCard() {
    if (!S || S.ph === "ret" || typeof famOf !== "function" || !(S.m || S.p)) return "";
    var f = famOf(); if (!f) return "";
    if (famCanSetup()) return '<section class="card famcard"><div class="presrow"><span class="presic" aria-hidden="true">👪</span><div class="grow"><b>' + tr("Tu vida personal") + "</b><small>" +
      (S.mode === "mgr" ? tr("¿Tienes pareja o hijos? Tendrás que cuidar la relación, y tus hijos podrán ser futbolistas… y jugar a tus órdenes.") : tr("¿Tienes pareja o hijos? Tendrás que cuidar la relación, y te acompañarán si después eres entrenador o si tu hijo o tu hija toma el relevo.")) + '</small></div></div><div class="row2" style="margin-top:10px"><button class="btn pri" data-a="famset">' + tr("Configurar") + '</button><button class="btn" data-a="famnone">' + tr("Sin familia por ahora") + "</button></div></section>";
    if (!f.pt && !f.kids.length && !f.par) return "";
    var o = '<section class="card famcard" data-a="famsheet" role="button" tabindex="0"><div class="presrow"><span class="presic" aria-hidden="true">👪</span><div class="grow"><b>' + tr("Tu familia") + "</b>";
    if (f.pt) o += "<small>" + h(tr("Con {name} · relación: {w}", {name: f.pt.fn, w: relWord(f.pt.rel)})) + "</small>" + relBar(f.pt.rel);
    else if (f.par) o += "<small>" + h(f.par.pt ? tr("Tus padres: {a} y {b}", {a: f.par.fn, b: f.par.pt}) : tr("Hijo o hija de {a}", {a: f.par.fn})) + "</small>";
    var fbk = f.kids.filter(function (k) { return k.fb && !k.fb.ret; });
    if (fbk.length) o += "<small>" + fbk.map(function (k) { var I = famKidInfo(k); return "⚽ " + h(k.fn) + " · " + h(I.club) + " · " + I.ovr; }).join("<br>") + "</small>";
    else if (f.kids.length) o += "<small>" + h(f.kids.map(function (k) { return k.fn + " (" + famAge(k) + ")"; }).join(" · ")) + "</small>";
    return o + "</div></div></section>";
  }
  U.add("clubTop", function () { return S && S.mode === "mgr" && S.m ? famCard() : ""; });
  U.add("carreraTop", function () { return S && S.mode !== "mgr" && S.p ? famCard() : ""; });

  /* ---------- preparar la familia ---------- */
  var FS = null;
  function fsRead() {
    if (!FS) return;
    var n = document.getElementById("fsptn"); if (n) FS.ptn = n.value;
    FS.kids.forEach(function (k, i) { var e = document.getElementById("fsk" + i); if (e) k.fn = e.value; var a = document.getElementById("fska" + i); if (a) k.age = +a.value; });
  }
  U.actions.famset = function () { FS = {pt: "none", ptn: "", kids: []}; U.open("famset"); };
  U.actions.famnone = function () { famSetup({}); U.persist(); U.render(false); };
  U.actions.fspt = function (b, v) { fsRead(); FS.pt = v; if (v !== "none" && !FS.ptn) FS.ptn = famFirst(famNat(), v); U.renderSheet(); };
  U.actions.fskadd = function () { fsRead(); if (FS.kids.length < 3) FS.kids.push({fn: famFirst(famNat(), "m"), g: "m", age: Math.max(0, Math.min(6, famHero().age - 18))}); U.renderSheet(); };
  U.actions.fskdel = function (b, v) { fsRead(); FS.kids.splice(+v, 1); U.renderSheet(); };
  U.actions.fskg = function (b, v) { fsRead(); var i = +b.getAttribute("data-i"), k = FS.kids[i]; if (k && k.g !== v) { k.g = v; k.fn = famFirst(famNat(), v); } U.renderSheet(); };
  U.actions.fsgo = function () {
    fsRead();
    if (FS.pt !== "none" && !FS.ptn.trim()) { U.toast(tr("Escribe su nombre")); return; }
    var sameSex = FS.pt === famMe();
    famSetup({pt: FS.pt === "none" ? null : {fn: FS.ptn.trim(), g: FS.pt}, kids: FS.kids.map(function (k) { return {fn: (k.fn || "").trim() || famFirst(famNat(), k.g), g: k.g, age: k.age, ad: sameSex}; })});
    FS = null; U.closeSheet(); U.persist(); U.render(false);
    U.toast(tr("Familia guardada"));
  };
  U.sheets.famset = function () {
    if (!FS) FS = {pt: "none", ptn: "", kids: []};
    var o = "<h2>" + tr("Tu vida personal") + '</h2><p class="lead">' + tr("Solo se configura una vez. Después, la familia crece (o no) según tus decisiones.") + '</p><div class="stack">';
    o += '<div><label class="lbl">' + tr("Pareja") + '</label><div class="seg">' + [["none", tr("Sin pareja")], ["m", tr("Un hombre")], ["f", tr("Una mujer")]].map(function (x) {
      return '<button data-a="fspt" data-v="' + x[0] + '" aria-pressed="' + (FS.pt === x[0]) + '">' + h(x[1]) + "</button>"; }).join("") + "</div>";
    if (FS.pt !== "none") o += '<label class="lbl" for="fsptn" style="margin-top:8px">' + tr("Nombre de tu pareja") + '</label><input type="text" id="fsptn" maxlength="20" autocomplete="off" value="' + h(FS.ptn) + '">' +
      (FS.pt === famMe() ? '<p class="muted" style="font-size:13px;margin:4px 0 0">' + tr("Si queréis ampliar la familia, adoptaréis a un niño o a una niña.") + "</p>" : "");
    o += "</div>";
    var maxAge = Math.min(15, famHero().age - 18);
    if (maxAge < 0) return o + '<p class="muted" style="font-size:13px;margin:0">' + tr("Con tu edad, los hijos llegarán más adelante.") + '</p><button class="btn pri wide" data-a="fsgo">' + tr("Guardar") + '</button><button class="btn wide" data-a="close">' + tr("Cancelar") + "</button></div>";
    o += '<div><label class="lbl">' + tr("Hijos") + "</label>";
    FS.kids.forEach(function (k, i) {
      o += '<div class="famkrow"><input type="text" id="fsk' + i + '" maxlength="20" autocomplete="off" value="' + h(k.fn) + '" aria-label="' + h(tr("Nombre")) + '">' +
        '<div class="seg">' + [["m", tr("Hijo")], ["f", tr("Hija")]].map(function (x) { return '<button data-a="fskg" data-i="' + i + '" data-v="' + x[0] + '" aria-pressed="' + (k.g === x[0]) + '">' + h(x[1]) + "</button>"; }).join("") + "</div>" +
        '<select id="fska' + i + '" aria-label="' + h(tr("Edad")) + '">' + Array.apply(null, Array(maxAge + 1)).map(function (_, a) { return '<option value="' + a + '"' + (a === k.age ? " selected" : "") + ">" + h(trn(a, "{n} año", "{n} años")) + "</option>"; }).join("") + "</select>" +
        '<button class="btn" data-a="fskdel" data-v="' + i + '" aria-label="' + h(tr("Quitar")) + '">✕</button></div>';
    });
    if (FS.kids.length < 3) o += '<button class="btn wide" data-a="fskadd">+ ' + tr("Añadir hijo o hija") + "</button>";
    o += '<p class="muted" style="font-size:13px;margin:6px 0 0">' + tr("A los 16 años podrán querer ser futbolistas. Si juegan en tu mismo fútbol, podrás ficharlos.") + "</p></div>";
    return o + '<button class="btn pri wide" data-a="fsgo">' + tr("Guardar") + '</button><button class="btn wide" data-a="close">' + tr("Cancelar") + "</button></div>";
  };

  /* ---------- la familia al detalle ---------- */
  U.actions.famsheet = function () { U.open("fam"); };
  U.actions.famsign = function (b, v) {
    var k = famKid(+v); if (!k) return;
    var fee = famFee(k.fb, famAge(k));
    if (fee > S.m.bud) { U.toast(tr("No te llega el presupuesto")); return; }
    if (!famSign(k)) { U.toast(tr("La operación no sale.")); return; }
    U.persist(); U.renderSheet(); U.render(false);
    U.toast(k.g === "f" ? tr("{name} firma por tu club", {name: famKidName(k)}) : tr("{name} firma por tu club", {name: famKidName(k)}));
  };
  U.sheets.fam = function () {
    var f = famOf(), o = "<h2>" + tr("Tu familia") + "</h2>";
    if (f.par) o += '<section class="famblk"><div class="famhd"><b>' + h(tr("Tus padres")) + "</b></div><p class=\"muted\" style=\"font-size:13px;margin:4px 0 0\">" + h(f.par.pt ? f.par.fn + " · " + f.par.pt : f.par.fn) + "</p></section>";
    if (f.pt) {
      o += '<section class="famblk"><div class="famhd"><b>' + h(f.pt.fn) + "</b><span>" + h(relWord(f.pt.rel)) + " · " + Math.round(f.pt.rel) + "</span></div>" + relBar(f.pt.rel) +
        '<p class="muted" style="font-size:13px;margin:6px 0 0">' + tr("La relación se resiente con el trabajo: un club grande, una crisis o niños pequeños en casa. Las decisiones que la cuidan la mejoran. Bien cuidada te da química; descuidada, te la quita.") + "</p></section>";
    } else o += '<p class="muted">' + (f.ex ? tr("Ahora mismo no tienes pareja.") : tr("No tienes pareja. Puede que conozcas a alguien.")) + "</p>";
    if (!famKids(f).length) o += '<p class="muted">' + tr("Todavía no tienes hijos.") + "</p>";
    f.kids.forEach(function (k) {
      var I = famKidInfo(k);
      o += '<section class="famblk"><div class="famhd">' + kidLine(k) + "</div>";
      if (I.fb) {
        o += '<p class="muted" style="font-size:13px;margin:4px 0 6px">' + h(tr("{pos} · {apps} partidos y {g} goles en su carrera", {pos: posName(I.fb.pos), apps: I.tot.apps, g: I.tot.g})) + "</p>";
        if (I.fb.seasons.length) o += '<table class="famtbl"><thead><tr><th>' + tr("Temporada") + "</th><th>" + tr("Club") + "</th><th>" + tr("PJ") + "</th><th>" + tr("Goles") + "</th><th>" + tr("Media") + "</th></tr></thead><tbody>" +
          I.fb.seasons.slice().reverse().map(function (s) { return "<tr" + (s.mine ? ' class="mine"' : "") + "><td>" + seasonLabel(s.y) + "</td><td>" + h(s.club >= 0 ? clubName(s.club) : s.cn || "—") + (s.mine ? " ★" : "") + "</td><td>" + s.apps + "</td><td>" + s.g + "</td><td>" + s.ovr + "</td></tr>"; }).join("") + "</tbody></table>";
        if (I.mine && I.p) o += '<p class="muted" style="font-size:13px;margin:6px 0 0">' + h(tr("Esta temporada contigo: {apps} partidos, {g} goles.", {apps: I.p.st.apps, g: I.p.st.g})) + "</p>";
        if (famSignable(k)) { var fee = famFee(k.fb, I.age); o += '<button class="btn pri wide" style="margin-top:8px" data-a="famsign" data-v="' + k.id + '">' + h(fee ? tr("Ficharle por {fee}", {fee: fmtMoney(fee)}) : tr("Ficharle (sin coste)")) + "</button>"; }
        else if (!famSame(k) && !I.fb.ret) o += '<p class="muted" style="font-size:13px;margin:6px 0 0">' + h(k.g === "f" ? tr("Juega en el fútbol femenino: no puedes ficharla, pero sigues su carrera.") : tr("Juega en el fútbol masculino: no puedes ficharlo, pero sigues su carrera.")) + "</p>";
      } else if (I.age < 16 && !k.no) o += '<p class="muted" style="font-size:13px;margin:4px 0 0">' + h(trn(16 - I.age, "En {n} año podrá decidir si quiere ser futbolista.", "En {n} años podrá decidir si quiere ser futbolista.")) + "</p>";
      o += "</section>";
    });
    return o + '<button class="btn wide" data-a="close" style="margin-top:12px">' + tr("Cerrar") + "</button>";
  };
})();
