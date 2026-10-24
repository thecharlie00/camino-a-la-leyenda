/* pet-audio.js — sonidos de la mascota sintetizados con WebAudio (sin archivos, sin red), con su propio volumen.
   Cada especie tiene su «voz» (tono, timbre, forma) generada aquí; nada procede de otros juegos. */
var PetAudio = (function () {
  "use strict";
  var KEY = "camino.petvol", ac = null, out = null, vol = 0.7, noise = null;
  try { var v = localStorage.getItem(KEY); if (v != null) vol = Math.max(0, Math.min(1, +v)); } catch (e) {}
  function init() {
    if (ac) return true;
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    try { ac = new AC(); out = ac.createGain(); out.gain.value = vol * 0.5; out.connect(ac.destination); } catch (e) { ac = null; return false; }
    var n = ac.sampleRate, b = ac.createBuffer(1, n, n), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    noise = b;
    return true;
  }
  function ok() { if (!vol) return false; if (!init()) return false; if (ac.state === "suspended") { try { ac.resume(); } catch (e) {} } return true; }
  function env(g, t, a, peak, dcy) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dcy); }
  function tone(type, f0, f1, dur, peak, delay, filt) {
    var t = ac.currentTime + (delay || 0), o = ac.createOscillator(), g = ac.createGain(), node = o;
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    if (filt) { var f = ac.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = filt; o.connect(f); node = f; }
    node.connect(g); g.connect(out); env(g, t, Math.min(0.02, dur * 0.2), peak, dur); o.start(t); o.stop(t + dur + 0.05);
  }
  function hiss(dur, fc, q, peak, delay, type) {
    var t = ac.currentTime + (delay || 0), s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noise; f.type = type || "bandpass"; f.frequency.value = fc; f.Q.value = q || 1;
    s.connect(f); f.connect(g); g.connect(out); env(g, t, 0.01, peak, dur); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }
  /* voces: [forma, tono base, caída, duración, filtro] según la especie y la etapa (las crías, más agudas) */
  var VOICE = {dog: ["sawtooth", 520, 0.62, 0.13, 1400], cat: ["triangle", 640, 1.35, 0.32, 2400], rabbit: ["sine", 1500, 1.2, 0.06, 0], hamster: ["square", 2200, 1.3, 0.05, 3200],
    hedgehog: ["triangle", 1300, 0.9, 0.07, 2200], fennec: ["sawtooth", 900, 1.4, 0.12, 2200], capybara: ["sine", 260, 0.9, 0.18, 800], macaw: ["square", 1100, 1.5, 0.12, 2600],
    iguana: ["noise", 900, 1, 0.2, 0], python: ["noise", 3200, 1, 0.45, 0], turtle: ["sine", 330, 0.9, 0.08, 0], fish: ["sine", 900, 1.6, 0.05, 0], tarantula: ["noise", 5000, 1, 0.08, 0]};
  var api = {};
  api.volume = function (v) { if (v == null) return vol; vol = Math.max(0, Math.min(1, v)); try { localStorage.setItem(KEY, String(vol)); } catch (e) {} if (out) out.gain.value = vol * 0.5; };
  api.voice = function (k, stage, kind) {
    if (!ok()) return;
    var V = VOICE[k] || VOICE.dog, f = V[1] * [1.45, 1.18, 1, 0.92][stage || 0], n = kind === "happy" ? 2 : kind === "sad" ? 1 : kind === "excited" ? 3 : 1;
    for (var i = 0; i < n; i++) {
      var dl = i * (V[3] + 0.06);
      if (V[0] === "noise") hiss(V[3], V[1], 2, 0.25, dl, k === "python" ? "highpass" : "bandpass");
      else if (kind === "sad") tone(V[0], f * 1.1, f * 0.7, V[3] * 2.2, 0.18, dl, V[4]);
      else tone(V[0], f * (1 + i * 0.08), f * V[2], V[3], 0.22, dl, V[4]);
    }
  };
  api.fx = function (name) {
    if (!ok()) return;
    switch (name) {
      case "pop": tone("sine", 600, 1200, 0.07, 0.25); break;
      case "munch": for (var i = 0; i < 3; i++) hiss(0.06, 1200 + i * 200, 3, 0.25, i * 0.13); break;
      case "slurp": tone("sine", 300, 900, 0.18, 0.15); tone("sine", 320, 1000, 0.18, 0.12, 0.22); break;
      case "splash": hiss(0.35, 1800, 0.6, 0.3); hiss(0.2, 3500, 1, 0.15, 0.08); break;
      case "bubble": tone("sine", 700 + Math.random() * 500, 1600, 0.06, 0.12); break;
      case "scrub": hiss(0.08, 2600, 2, 0.08); break;
      case "brush": hiss(0.1, 5200, 1.2, 0.06); break;
      case "sparkle": [1568, 2093, 2637].forEach(function (f, j) { tone("triangle", f, f, 0.12, 0.1, j * 0.06); }); break;
      case "success": [523, 659, 784, 1047].forEach(function (f, j) { tone("triangle", f, f * 1.01, 0.14, 0.16, j * 0.08); }); break;
      case "fail": tone("triangle", 420, 260, 0.25, 0.14); break;
      case "whistle": tone("sine", 2100, 2500, 0.12, 0.18); tone("sine", 2500, 2100, 0.18, 0.18, 0.14); break;
      case "kick": tone("sine", 160, 60, 0.1, 0.4); hiss(0.04, 900, 1, 0.2); break;
      case "bounce": tone("sine", 220, 120, 0.08, 0.25); break;
      case "step": hiss(0.03, 700, 2, 0.05); break;
      case "bell": tone("sine", 2400, 2380, 0.4, 0.1); tone("sine", 3600, 3580, 0.3, 0.05); break;
      case "cheer": hiss(0.8, 1000, 0.5, 0.25); hiss(0.6, 2200, 0.7, 0.12, 0.1); break;
      case "coin": tone("square", 988, 988, 0.06, 0.1); tone("square", 1319, 1319, 0.2, 0.1, 0.06); break;
      case "snore": tone("sine", 140, 110, 0.6, 0.08, 0, 400); break;
      case "tap": tone("sine", 900, 700, 0.03, 0.1); break;
    }
  };
  return api;
})();
