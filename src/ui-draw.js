/* ui-draw.js — ceremonia del sorteo en directo (bombos, bolas, cápsulas, cuadro, titulares y redes).
   Lee la decisión pendiente «draw» que prepara draw.js; al cerrar, la resuelve con el flujo normal (data-a="choose"). */
(function () {
  if (typeof UIX === "undefined") return;
  var h = UIX.h, opened = {}, D = null;
  function rm() { try { return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } }
  function natX(x) { return {nat: x.nat}; }
  function nm(x, t) { return drawTeamName(natX(x), t); }
  function badge(x, t, big) { return x.nat ? UIX.flag(t) : UIX.crest(t, big); }
  function teamH(x, t, big) { return '<span class="drw-tm">' + badge(x, t, big) + "<b>" + h(nm(x, t)) + "</b></span>"; }
  function potLabel(x, i) { var l = x.pl[i]; return typeof l === "number" ? tr("Bombo {n}", {n: l}) : tr(l); }
  function grpL(i) { return tr("Grupo {group}", {group: String.fromCharCode(65 + i)}); }
  function slotKey(x, st) { return x.typ === "grp" ? st[2] + "-" + st[0] : String(st[2]); }
  function curDraw() { return S && S.pend && S.pend[0] && S.pend[0].k === "draw" ? S.pend[0] : null; }

  /* ---------- tarjeta de la decisión ---------- */
  UIX.pend.draw = function (x) {
    var n = 0; x.pots.forEach(function (p) { n += p.length; });
    var balls = ""; for (var i = 0; i < Math.min(9, n); i++) balls += "<i></i>";
    return '<section class="card decision drwcard"><div class="head"><span class="tag hot"><span class="dot"></span>' + tr("Sorteo en directo") + '</span><span class="eyebrow">' + h(trComp(x.cn)) + "</span></div>" +
      '<div class="drwcard-row"><div class="drwcard-pot" aria-hidden="true">' + balls + '</div><div><h3>' + h(drawTitle(x)) + '</h3><p class="lead">' +
      tr("{team} está en el bombo. Las bolas ya giran: ¿quién te tocará?", {team: h(nm(x, x.me))}) + "</p></div></div>" +
      '<div class="opts"><button class="go" data-a="drawopen">' + tr("Ver el sorteo") + '</button><button class="btn wide" data-a="drawopen" data-v="skip">' + tr("Ver solo el resultado") + "</button></div></section>";
  };
  UIX.actions.drawopen = function (b, v) { var x = curDraw(); if (x) open(x, v === "skip"); };
  UIX.actions.drawspeed = function (b, v) {
    if (!D) return;
    if (v === "skip") { skip(); return; }
    D.spd = v; segSync();
  };
  UIX.actions.drawclose = function () { close(); };
  /* el sorteo aparece solo cuando llega su turno */
  UIX.add("after", function () {
    var x = curDraw();
    if (x && !opened[x.id] && !D && UIX.ui().view === "game") setTimeout(function () { var y = curDraw(); if (y === x && !D && !opened[x.id]) open(x, false); }, 60);
    return "";
  });

  /* ---------- ceremonia ---------- */
  function open(x, skipNow) {
    opened[x.id] = true;
    if (D) shut();
    var el = document.createElement("div");
    el.className = "drw" + (rm() ? " rm" : "");
    el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", drawTitle(x));
    D = {x: x, el: el, i: 0, spd: "n", tm: [], done: false};
    el.innerHTML = '<div class="drw-in">' + headH(x) + '<div class="drw-stage">' + potsH(x) + '<div class="drw-rev" aria-live="polite"><div class="drw-cap" hidden><i class="t"></i><i class="b"></i></div><div class="drw-plate"></div><p class="drw-cue">' +
      tr("Las bolas giran en los bombos…") + "</p></div></div>" + '<div class="drw-board">' + boardH(x) + "</div></div>";
    document.body.appendChild(el);
    el.addEventListener("keydown", function (e) { if (e.key === "Escape") { e.preventDefault(); if (D && D.done) close(); else skip(); } });
    var f = el.querySelector(".drw-spd button"); if (f) f.focus({preventScroll: true});
    if (skipNow) skip();
    else later(stepRun, rm() ? 300 : 900);
  }
  function headH(x) {
    return '<header class="drw-top"><div class="drw-tt"><span class="tag hot"><span class="dot"></span>' + tr("Sorteo en directo") + '</span><span class="eyebrow">' + h(trComp(x.cn)) + "</span>" +
      "<h2>" + h(drawTitle(x)) + '</h2></div><div class="seg drw-spd" role="group" aria-label="' + h(tr("Velocidad del sorteo")) + '">' +
      '<button data-a="drawspeed" data-v="n" aria-pressed="true">' + tr("Normal") + '</button><button data-a="drawspeed" data-v="f" aria-pressed="false">' + tr("Rápida") + '</button><button data-a="drawspeed" data-v="skip" aria-pressed="false">' + tr("Saltar") + "</button></div></header>";
  }
  function potsH(x) {
    return '<div class="drw-pots">' + x.pots.map(function (p, i) {
      var b = "";
      p.forEach(function (t, j) {
        var a = (j * 137.5) % 360 * Math.PI / 180, r = 6 + (j * 7) % 15;
        b += '<i style="left:' + Math.round(26 + Math.cos(a) * r) + "px;top:" + Math.round(30 + Math.sin(a) * r * 0.7) + "px;animation-delay:-" + ((j * 0.37) % 1.6).toFixed(2) + 's"></i>';
      });
      return '<div class="drw-pot" data-p="' + i + '"><div class="drw-bowl">' + b + '</div><small>' + h(potLabel(x, i)) + '</small><b class="num">' + p.length + "</b></div>";
    }).join("") + "</div>";
  }
  function boardH(x) {
    var s = "";
    if (x.typ === "grp") {
      s = '<div class="drw-grps">' + x.res.map(function (g, gi) {
        return '<div class="drw-grp" data-g="' + gi + '"><b>' + h(grpL(gi)) + "</b>" + g.map(function (t, p) { return '<div class="drw-slot" data-s="' + gi + "-" + p + '"><i>' + (p + 1) + "</i></div>"; }).join("") + "</div>";
      }).join("") + "</div>";
    } else if (x.typ === "lp") {
      s = '<div class="drw-me">' + teamH(x, x.me, true) + '<span class="eyebrow">' + h(potLabel(x, x.mp || 0)) + "</span></div>" +
        '<div class="drw-lp">' + x.res.map(function (r, i) { return '<div class="drw-slot" data-s="' + i + '"><i>' + (r[1] ? tr("Casa") : tr("Fuera")) + "</i></div>"; }).join("") + "</div>";
    } else {
      s = '<div class="drw-ties">' + x.res.map(function (t, i) {
        return '<div class="drw-tie"><div class="drw-slot" data-s="' + i * 2 + '"></div><em>' + tr("vs") + '</em><div class="drw-slot r" data-s="' + (i * 2 + 1) + '"></div></div>';
      }).join("") + "</div>";
    }
    return s;
  }
  function later(fn, ms) { if (!D) return; var d = D; var id = setTimeout(function () { if (D === d) fn(); }, ms); D.tm.push(id); }
  function clearT() { if (!D) return; D.tm.forEach(clearTimeout); D.tm = []; var fl = document.querySelectorAll(".drw-fly"); for (var i = 0; i < fl.length; i++) fl[i].remove(); }
  function segSync() {
    var bs = D.el.querySelectorAll(".drw-spd button");
    for (var i = 0; i < bs.length; i++) bs[i].setAttribute("aria-pressed", String(bs[i].getAttribute("data-v") === D.spd));
  }
  function isKey(x, t) { return t === x.me || drawRivals(x).indexOf(t) >= 0; }
  function stepT(x, t) {
    var n = x.seq.length, base = Math.max(650, Math.min(1500, 26000 / n));
    if (rm()) base = 420;
    if (D.spd === "f") return Math.max(170, base / 4);
    return isKey(x, t) ? base * 1.7 : base;
  }
  function potTake(p) {
    var pots = D.el.querySelectorAll(".drw-pot");
    for (var i = 0; i < pots.length; i++) pots[i].classList.toggle("on", i === p);
    var pot = pots[p]; if (!pot) return null;
    var ball = pot.querySelector(".drw-bowl i"); if (ball) ball.remove();
    var c = pot.querySelector(".num"); if (c) c.textContent = String(Math.max(0, +c.textContent - 1));
    return pot.querySelector(".drw-bowl");
  }
  function slotEl(k) { return D.el.querySelector('.drw-slot[data-s="' + k + '"]'); }
  function fill(x, el, t, flash) {
    if (!el) return;
    el.innerHTML = teamH(x, t, false);
    el.classList.add("on");
    if (flash) el.classList.add("in");
    if (t === x.me) { el.classList.add("me"); var g = el.closest(".drw-grp"); if (g) g.classList.add("mine"); }
  }
  function center(r) { return {x: r.left + r.width / 2, y: r.top + r.height / 2}; }
  function stepRun() {
    var x = D.x;
    if (D.i >= x.seq.length) { finish(); return; }
    var st = x.seq[D.i++], t = st[1], T = stepT(x, t), bowl = potTake(st[0]), target = slotEl(slotKey(x, st));
    var rev = D.el.querySelector(".drw-rev"), cap = rev.querySelector(".drw-cap"), plate = rev.querySelector(".drw-plate"), cue = rev.querySelector(".drw-cue");
    var where = x.typ === "grp" ? grpL(st[2]) : x.typ === "lp" ? tr("Rival {n} de {total}", {n: st[2] + 1, total: x.seq.length}) : tr("Cruce {n}", {n: Math.floor(st[2] / 2) + 1});
    if (target) target.scrollIntoView({block: "nearest"});
    var key = isKey(x, t);
    rev.classList.toggle("key", key && t === x.me);
    rev.classList.toggle("riv", key && t !== x.me);
    if (rm() || !bowl || !rev.animate) {
      cap.hidden = true;
      plate.innerHTML = teamH(x, t, true); plate.className = "drw-plate show";
      cue.textContent = potLabel(x, st[0]) + " → " + where;
      fill(x, target, t, false);
      later(stepRun, T);
      return;
    }
    /* 1. la bola sale del bombo y viaja al atril */
    plate.className = "drw-plate"; plate.innerHTML = ""; cap.hidden = true; cap.classList.remove("open");
    cue.textContent = potLabel(x, st[0]);
    var a = center(bowl.getBoundingClientRect()), b = center(rev.getBoundingClientRect());
    var fly = document.createElement("div"); fly.className = "drw-fly"; fly.style.left = a.x + "px"; fly.style.top = a.y + "px";
    document.body.appendChild(fly);
    var t1 = T * 0.34;
    fly.animate([{transform: "translate(-50%,-50%) scale(.5)"}, {transform: "translate(calc(-50% + " + (b.x - a.x) * 0.5 + "px), calc(-50% + " + (Math.min(a.y, b.y) - a.y - 30) + "px)) scale(1.2)", offset: 0.5},
      {transform: "translate(calc(-50% + " + (b.x - a.x) + "px), calc(-50% + " + (b.y - a.y) + "px)) scale(2.2)"}], {duration: t1, easing: "cubic-bezier(.3,.7,.3,1)", fill: "forwards"});
    /* 2. se abre la cápsula y aparece el equipo */
    later(function () {
      fly.remove();
      cap.hidden = false; cap.classList.remove("open"); void cap.offsetWidth; cap.classList.add("open");
      cap.style.animationDuration = (T * 0.25) + "ms";
      plate.innerHTML = teamH(x, t, true); plate.className = "drw-plate show";
      cue.textContent = potLabel(x, st[0]) + " → " + where;
    }, t1);
    /* 3. el nombre vuela a su sitio en el cuadro */
    later(function () {
      if (!target) { stepRun(); return; }
      var pr = plate.getBoundingClientRect(), tr0 = target.getBoundingClientRect();
      var gh = document.createElement("div"); gh.className = "drw-fly tag-fly"; gh.innerHTML = teamH(x, t, false);
      gh.style.left = center(pr).x + "px"; gh.style.top = center(pr).y + "px";
      document.body.appendChild(gh);
      var d = center(tr0), c0 = center(pr), t3 = T * 0.2;
      gh.animate([{transform: "translate(-50%,-50%) scale(1.15)", opacity: 1}, {transform: "translate(calc(-50% + " + (d.x - c0.x) + "px), calc(-50% + " + (d.y - c0.y) + "px)) scale(.8)", opacity: 0.6}], {duration: t3, easing: "ease-in", fill: "forwards"});
      later(function () { gh.remove(); fill(x, target, t, true); }, t3);
      later(stepRun, t3 + T * 0.08);
    }, T * 0.72);
  }
  function skip() {
    if (!D || D.done) return;
    clearT();
    var x = D.x;
    x.seq.forEach(function (st) { var el = slotEl(slotKey(x, st)); if (el && !el.classList.contains("on")) fill(x, el, st[1], false); });
    var balls = D.el.querySelectorAll(".drw-bowl i"); for (var i = 0; i < balls.length; i++) balls[i].remove();
    var nums = D.el.querySelectorAll(".drw-pot .num"); for (var j = 0; j < nums.length; j++) nums[j].textContent = "0";
    D.i = x.seq.length;
    finish(true);
  }
  function finish(fast) {
    if (!D || D.done) return;
    D.done = true; clearT();
    var x = D.x, riv = drawRivals(x);
    D.el.classList.add("over");
    var pots = D.el.querySelectorAll(".drw-pot"); for (var i = 0; i < pots.length; i++) pots[i].classList.remove("on");
    x.seq.forEach(function (st) { if (riv.indexOf(st[1]) >= 0) { var el = slotEl(slotKey(x, st)); if (el) el.classList.add("riv"); } });
    var mine = D.el.querySelector(".drw-slot.me") || D.el.querySelector(".drw-slot.riv");
    if (mine) mine.scrollIntoView({block: "center"});
    later(function () { endPanel(x); }, fast || rm() ? 60 : 650);
  }
  /* ---------- final: titulares, directiva y redes ---------- */
  function postH(p) {
    var a = p.au || {}, acc = a.id && typeof socAcc === "function" ? socAcc(a.id) : null, n0, hd, av, col = "#2b3b40", ver = false;
    if (acc) { n0 = acc.name; hd = acc.handle; av = acc.av; col = acc.col || col; ver = !!acc.verified; }
    else { n0 = a.n || tr("Hincha"); hd = a.hd || "hincha"; av = a.av || "🙂"; }
    return '<article class="spost' + (p.m < 0 ? " neg" : "") + '"><span class="sav" style="background:' + h(col) + '">' + h(av) + '</span><div class="sbody"><div class="shead"><b>' + h(n0) + "</b>" +
      (ver ? '<span class="sver">✔</span>' : "") + '<span class="shd">@' + h(hd) + '</span></div><p class="stext">' + h(tr(p.tk, p.tp)) + "</p></div></article>";
  }
  function mineH(x) {
    var riv = drawRivals(x);
    if (x.typ === "ko") return '<div class="drw-duel">' + teamH(x, x.me, true) + "<em>" + tr("vs") + "</em>" + (riv[0] != null ? teamH(x, riv[0], true) : "") + "</div>";
    if (x.typ === "grp") return '<div class="drw-mineg"><span class="eyebrow">' + h(grpL(x.gi || 0)) + "</span>" + x.res[x.gi || 0].map(function (t) { return '<div class="' + (t === x.me ? "me" : "") + '">' + teamH(x, t, false) + "</div>"; }).join("") + "</div>";
    return '<div class="drw-mineg lp">' + x.res.map(function (r) { return "<div>" + teamH(x, r[0], false) + "<small>" + (r[1] ? tr("Casa") : tr("Fuera")) + "</small></div>"; }).join("") + "</div>";
  }
  function endPanel(x) {
    if (!D) return;
    var rx = x.rx || {hl: [], posts: []}, mgr = UIX.isMgr();
    var p = document.createElement("section");
    p.className = "drw-end";
    p.innerHTML = '<div class="drw-endin"><span class="eyebrow">' + tr("Así queda tu sorteo") + "</span>" + mineH(x) +
      '<div class="drw-hls">' + rx.hl.map(function (l) { return '<p class="drw-hl ' + (l.t > 0 ? "good" : l.t < 0 ? "bad" : "") + '">' + h(tr(l.tk, l.tp)) + "</p>"; }).join("") + "</div>" +
      '<div class="drw-rx"><span class="eyebrow">' + (mgr ? tr("Directiva") : tr("Vestuario")) + "</span><p>" + h(tr(rx.txt || "")) + "</p>" + (mgr && rx.bd ? '<div class="chips">' + UIX.chip(["board", rx.bd]) + "</div>" : "") + "</div>" +
      '<div class="drw-soc"><span class="eyebrow">' + tr("En las redes") + '</span><div class="sfeed">' + rx.posts.map(postH).join("") + "</div></div>" +
      '<button class="go" data-a="drawclose">' + tr("Cerrar") + "</button></div>";
    D.el.querySelector(".drw-in").appendChild(p);
    var b = p.querySelector(".go"); if (b) b.focus({preventScroll: true});
    if (rx.tone) UIX.edgeFlash(rx.tone > 0);
  }
  function shut() { if (!D) return; clearT(); if (D.el && D.el.parentNode) D.el.parentNode.removeChild(D.el); D = null; }
  function close() {
    if (!D) return;
    var x = D.x;
    shut();
    /* resolver con el flujo normal de decisiones (avisos, guardado, hoja del míster…) */
    if (curDraw() === x) {
      var b = document.createElement("button");
      b.setAttribute("data-a", "choose"); b.setAttribute("data-i", "0"); b.hidden = true;
      document.body.appendChild(b); b.click(); b.remove();
    }
  }
})();
