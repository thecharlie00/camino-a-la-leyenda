/* Efectos de sonido de la interfaz (retro, sintetizados con Web Audio; sin archivos ni conexión).
   Elegir una decisión, que salga bien o mal, resultado de cada tramo, títulos y momentos grandes.
   Se activan o desactivan en Accesibilidad («Efectos de sonido»); por defecto, activados. */
var Sfx = (function () {
  var KEY = "camino.sfx", ac = null, out = null, last = {};
  function enabled() { try { return localStorage.getItem(KEY) !== "0"; } catch (e) { return true; } }
  function setEnabled(v) { try { localStorage.setItem(KEY, v ? "1" : "0"); } catch (e) {} }
  function init() {
    if (ac) return true;
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    try { ac = new AC(); out = ac.createGain(); out.gain.value = 0.55; out.connect(ac.destination); return true; } catch (e) { ac = null; return false; }
  }
  function hz(n) { return 440 * Math.pow(2, (n - 69) / 12); }
  function tone(n, at, dur, type, vol, slide) {
    var o = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter();
    o.type = type; o.frequency.setValueAtTime(hz(n), at);
    if (slide) o.frequency.exponentialRampToValueAtTime(hz(n) * slide, at + dur);
    f.type = "lowpass"; f.frequency.value = 3600;
    g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(vol, at + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(f); f.connect(g); g.connect(out); o.start(at); o.stop(at + dur + 0.02);
  }
  function hiss(at, dur, vol, freq) {
    var len = Math.floor(ac.sampleRate * dur), b = ac.createBuffer(1, len, ac.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    var s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = b; f.type = "highpass"; f.frequency.value = freq || 4000;
    g.gain.setValueAtTime(vol, at); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    s.connect(f); f.connect(g); g.connect(out); s.start(at);
  }
  /* cada sonido: lista de [nota, inicio en s, duración, onda, volumen, deslizamiento] */
  var SOUNDS = {
    tap: [[84, 0, 0.04, "square", 0.05]],
    choose: [[76, 0, 0.06, "square", 0.08], [83, 0.055, 0.09, "square", 0.08]],
    ok: [[72, 0, 0.09, "square", 0.08], [76, 0.08, 0.09, "square", 0.08], [79, 0.16, 0.09, "square", 0.08], [84, 0.24, 0.22, "square", 0.09], [60, 0, 0.3, "triangle", 0.14]],
    bad: [[67, 0, 0.12, "square", 0.08], [63, 0.12, 0.12, "square", 0.08], [58, 0.24, 0.34, "sawtooth", 0.07, 0.9], [46, 0, 0.5, "triangle", 0.16, 0.85]],
    meh: [[72, 0, 0.08, "triangle", 0.1], [72, 0.1, 0.12, "triangle", 0.08]],
    win: [[72, 0, 0.08, "square", 0.07], [79, 0.08, 0.16, "square", 0.08], [48, 0, 0.25, "triangle", 0.14]],
    loss: [[64, 0, 0.12, "triangle", 0.1], [60, 0.13, 0.26, "triangle", 0.1, 0.94]],
    big: [[67, 0, 0.1, "square", 0.08], [72, 0.1, 0.1, "square", 0.08], [76, 0.2, 0.1, "square", 0.08], [79, 0.3, 0.4, "square", 0.09], [84, 0.3, 0.4, "sawtooth", 0.04], [48, 0.3, 0.45, "triangle", 0.16]],
    trophy: [[67, 0, 0.12, "square", 0.08], [67, 0.13, 0.08, "square", 0.07], [67, 0.22, 0.08, "square", 0.07], [72, 0.32, 0.5, "square", 0.09], [76, 0.32, 0.5, "sawtooth", 0.04],
      [71, 0.86, 0.12, "square", 0.08], [74, 0.98, 0.12, "square", 0.08], [79, 1.1, 0.8, "square", 0.1], [83, 1.1, 0.8, "sawtooth", 0.045], [43, 0.32, 0.5, "triangle", 0.16], [48, 1.1, 0.8, "triangle", 0.18]]
  };
  function play(kind) {
    if (!SOUNDS[kind] || !enabled() || !init()) return false;
    var now = Date.now(); if (last[kind] && now - last[kind] < (kind === "tap" ? 90 : 160)) return false; last[kind] = now;
    try {
      if (ac.state === "suspended" && ac.resume) ac.resume();
      var t0 = ac.currentTime + 0.01;
      if (kind !== "choose" && kind !== "tap" && last.choose && now - last.choose < 300) t0 += 0.16; /* que se oiga primero la elección */
      SOUNDS[kind].forEach(function (x) { tone(x[0], t0 + x[1], x[2], x[3], x[4], x[5]); });
      if (kind === "trophy") hiss(t0 + 1.1, 1.2, 0.08, 5000);
      if (kind === "big") hiss(t0 + 0.3, 0.6, 0.05, 5000);
      return true;
    } catch (e) { return false; }
  }
  return {play: play, enabled: enabled, setEnabled: setEnabled, sounds: function () { return Object.keys(SOUNDS); }};
})();

(function installSfx() {
  if (typeof window === "undefined") return;
  /* la háptica ya marca lo bueno, lo malo y lo grande en todo el juego: el sonido la acompaña */
  if (typeof Anim !== "undefined" && Anim && Anim.haptic) {
    var baseHaptic = Anim.haptic;
    Anim.haptic = function (kind) { if (kind === "ok" || kind === "bad" || kind === "big") Sfx.play(kind); return baseHaptic.apply(this, arguments); };
  }
  /* elegir una opción o avanzar */
  document.addEventListener("click", function (ev) {
    var b = ev.target && ev.target.closest ? ev.target.closest("[data-a]") : null; if (!b || b.disabled) return;
    var a = b.getAttribute("data-a");
    if (a === "choose" || a === "objok" || a === "negook") Sfx.play("choose");
    else if (a === "advance" || a === "cnext" || a === "cset" || a === "cclub" || a === "objsel") Sfx.play("tap");
  }, true);
  /* resultados que llegan al avanzar (tramos, fichajes, despidos) y títulos nuevos */
  var seen = {fid: null, uid: null, tro: null};
  function trophies() { if (!S) return 0; var who = S.mode === "mgr" ? S.m : S.p; return who && who.trophies ? who.trophies.length : 0; }
  function cardSound(c) {
    if (!c) return null;
    if (c.t === "mblock" && c.st) return c.st.w > c.st.l ? "win" : c.st.w < c.st.l ? "loss" : "meh";
    if (c.t === "block" && c.st && c.st.rn) { var avg = c.st.rs / c.st.rn; return avg >= 7 ? "win" : avg < 6 ? "loss" : "meh"; }
    if (c.t === "msacked") return "bad";
    if (c.t === "transfer" || c.t === "mjob" || c.t === "mtransfer" && c.inn) return "ok";
    return null;
  }
  function check() {
    if (!S || !S.feed) { seen.uid = null; return; }
    var top = S.feed[0], fid = top ? top.id : null, tro = trophies();
    if (seen.uid !== S.uid) { seen.uid = S.uid; seen.fid = fid; seen.tro = tro; return; }
    if (tro > seen.tro) Sfx.play("trophy");
    else if (fid !== seen.fid) { var snd = cardSound(top); if (snd) Sfx.play(snd); }
    seen.fid = fid; seen.tro = tro;
  }
  if (window.UIX && window.UIX.add) window.UIX.add("after", function () { try { check(); } catch (e) {} });
  /* nombres de los ajustes en los idiomas del juego */
  var NAMES = {"Efectos de sonido": {en: "Sound effects", de: "Soundeffekte", it: "Effetti sonori", fr: "Effets sonores"},
    "Activados": {en: "On", de: "An", it: "Attivi", fr: "Activés"}, "Desactivados": {en: "Off", de: "Aus", it: "Disattivati", fr: "Désactivés"}};
  if (typeof ensureI18n === "function") {
    var baseEnsure = ensureI18n;
    ensureI18n = function (lang) {
      var r = baseEnsure.apply(this, arguments);
      try { var d = I18N[lang]; if (d) Object.keys(NAMES).forEach(function (k) { if (!d[k] && NAMES[k][lang]) d[k] = NAMES[k][lang]; }); } catch (e) {}
      return r;
    };
  }
  window.SfxUI = {
    block: function () {
      var on = Sfx.enabled(), T = typeof tr === "function" ? tr : function (s) { return s; };
      return '<div><label class="lbl">' + T("Efectos de sonido") + '</label><div class="seg"><button data-a="sfxset" data-v="1" aria-pressed="' + on + '">' + T("Activados") +
        '</button><button data-a="sfxset" data-v="0" aria-pressed="' + !on + '">' + T("Desactivados") + "</button></div></div>";
    }
  };
  if (window.UIX && window.UIX.actions) window.UIX.actions.sfxset = function (b, v) {
    Sfx.setEnabled(+v === 1); if (window.UIX.renderSheet) window.UIX.renderSheet();
    var d = document.querySelector("details.a11y"); if (d) d.open = true;
    if (+v === 1) Sfx.play("ok");
  };
})();
