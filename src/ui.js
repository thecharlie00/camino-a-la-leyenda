/* ===== INTERFAZ ===== */
(function () {
  "use strict";
  var UI = {view: "home", tab: "carrera", exp: {}, flash: null, cr: null, sheet: null, wl: null, hofF: "ALL", busy: false, mkF: "ALL"};
  var $app = document.getElementById("app");
  var ICON = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h5v-6h4v6h5V10"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/></svg>',
    medal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3l2.5 6M16 3l-2.5 6"/><circle cx="12" cy="15" r="6"/><path d="M12 12.5l.9 1.8 2 .3-1.45 1.4.35 2-1.8-.95-1.8.95.35-2L9.1 14.6l2-.3z"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></svg>',
    at: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>',
    dots: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>',
    route: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="5" cy="18" r="2.5"/><circle cx="19" cy="6" r="2.5"/><path d="M7.5 18H14a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h6.5"/></svg>',
    shirt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M8 3 3 6l2 5 3-1v11h8V10l3 1 2-5-5-3c-.8 1.4-2.2 2.2-4 2.2S8.8 4.4 8 3z"/></svg>',
    table: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M3 14h18M9 9v11"/></svg>',
    trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v4M8 21h8M9.5 18h5"/></svg>',
    globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/></svg>',
    swap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h14l-4-4M20 16H6l4 4"/></svg>',
    board: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M12 4v13M8 21l2-4M16 21l-2-4"/><circle cx="12" cy="10.5" r="2"/></svg>'
  };

  /* ---------- utilidades ---------- */
  function h(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]; }); }
  function dec(x, n) { return fmtDec(x, n); }
  function lc(t) { return LANG === "de" ? String(t) : String(t).toLowerCase(); }
  function sgn(v) { var a = Math.abs(v), s = Number.isInteger(a) ? String(a) : dec(a); return (v >= 0 ? "+" : "−") + s; }
  function textOn(col) {
    if (!col || col.charAt(0) !== "#") return "#fff";
    var r = parseInt(col.substr(1, 2), 16), g = parseInt(col.substr(3, 2), 16), b = parseInt(col.substr(5, 2), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62 ? "#141414" : "#fff";
  }
  var COL_OK = /^(#[0-9a-fA-F]{3,8}|hsl\(\d{1,3},\d{1,3}%,\d{1,3}%\))$/;
  /* ---------- extensiones: módulos de interfaz en ficheros aparte (ui-*.js) se enganchan aquí ----------
     UIX.actions[accion] = function (boton, valor, id) · UIX.sheets[k] = function (sheet) → html
     UIX.pend[k] = function (x) → html de la decisión · UIX.slots[sitio] = [function () → html]
     sitios: home, menu, carrera, jugador, club, plantilla, mercado, hist, histM, create, after (tras cada render) */
  var UIX = window.UIX = {actions: {}, sheets: {}, pend: {}, slots: {}};
  function slot(name, arg) {
    var l = UIX.slots[name] || [], o = "";
    for (var i = 0; i < l.length; i++) { try { o += l[i](arg) || ""; } catch (e) { console.error(e); } }
    return o;
  }
  UIX.add = function (name, fn) { (UIX.slots[name] = UIX.slots[name] || []).push(fn); };
  function crestRaw(col, ab, big, cs) {
    col = [0, 1].map(function (i) { return col && COL_OK.test(col[i]) ? col[i] : "#556066"; });
    if (typeof crestSVG === "function") return crestSVG({shape: cs ? cs.shape : "shield", pat: cs ? cs.pat : "band", col: col, ab: ab, big: big});
    return '<span class="crest' + (big ? " lg" : "") + '" style="background:' + col[0] + ";box-shadow:inset 0 -" + (big ? 10 : 6) + "px 0 " + col[1] + ";color:" + textOn(col[0]) + ";padding-bottom:" + (big ? 7 : 4) + 'px" aria-hidden="true">' + h(ab) + "</span>";
  }
  function crest(ci, big) {
    var c = W.clubs[ci]; if (!c) return "";
    if (c.cs && typeof crestSVG === "function") return crestRaw(c.col, c.ab, big, c.cs);
    if (typeof crestAuto === "function") return crestAuto(c.n0 || c.n, c.col, c.ab, big);
    return crestRaw(c.col, c.ab, big);
  }
  function flag(ni) { return W.ctry[ni] ? '<span class="flag" aria-hidden="true">' + W.ctry[ni].flag + "</span>" : ""; }
  function team(nat, t) { return nat ? flag(t) + " <span>" + h(natName(t)) + "</span>" : crest(t) + " <span>" + h(clubName(t)) + "</span>"; }
  function tier(o) { return o >= 85 ? "e" : o >= 75 ? "g" : o >= 65 ? "s" : "b"; }
  function repTier(r) { return r >= 80 ? "e" : r >= 60 ? "g" : r >= 40 ? "s" : "b"; }
  function barCls(v) { return v < 35 ? "lo" : v < 60 ? "mid" : "hi"; }
  function isMgr() { return !!S && S.mode === "mgr"; }
  function myClub() { return isMgr() ? S.m.club : S.p.club; }
  function myNat() { return isMgr() ? -1 : S.p.inat; }
  function toast(t) {
    var el = document.createElement("div"); el.className = "toast"; el.setAttribute("role", "status"); el.textContent = t;
    document.body.appendChild(el); setTimeout(function () { el.remove(); }, 2600);
  }
  function pctList(outs) {
    var raw = outs.map(function (u) { return u.p * 100; }), r = raw.map(Math.round), d = 100 - r.reduce(function (a, b) { return a + b; }, 0);
    if (d !== 0 && r.length) { var k = raw.indexOf(Math.max.apply(null, raw)); r[k] += d; }
    return r;
  }

  /* ---------- guardado: ranuras en el dispositivo + copia en la cuenta ----------
     camino.slots: índice de partidas · camino.s.<id>: partida comprimida · camino.active: la partida en curso sin comprimir */
  var MAX_SLOTS = 10;
  function metaOf(s) {
    var mgr = s.mode === "mgr" && !!s.m, p = s.p, m = s.m, club = mgr ? m.club : (p ? p.club : -1), cn = "";
    if (club >= 0 && W.clubs[club]) cn = s.custom && s.custom.id === club ? s.custom.n : (W.clubs[club].n0 || W.clubs[club].n);
    return {id: s.uid, mode: mgr ? (s.kind === "club" ? "club" : (p ? "pm" : "mgr")) : "p", n: mgr ? (m.fn ? m.fn + " " : "") + m.ln : p.fn + " " + p.ln,
      club: club, cn: cn, cu: s.custom && s.custom.id === club ? {ab: s.custom.ab, col: s.custom.col} : null, yr: s.yr, ts: s.ts || 0,
      lv: mgr ? Math.round(m.rep) : Math.round(p.ovr), pos: mgr ? "DT" : p.pos, ret: s.ph === "ret", draft: s.ph === "draft", g: s.g === "f" ? "f" : "m"};
  }
  var Store = {
    db: null, uid: null, cloud: false, ptimer: null, busy: false, again: false, busyP: null,
    init: function () {
      var self = this;
      try {
        if (!window.claude || typeof window.claude.use !== "function") return Promise.resolve();
        return Promise.all([window.claude.use("db"), window.claude.use("user")]).then(function (r) {
          var db = r[0], user = r[1];
          if (!db || !user) return;
          return user.id().then(function (id) { if (id) { self.db = db; self.uid = id; self.cloud = true; } });
        }).catch(function () {});
      } catch (e) { return Promise.resolve(); }
    },
    lget: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    lset: function (k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
    ldel: function (k) { try { localStorage.removeItem(k); } catch (e) {} },
    doc: function (name) { return this.db.doc("data/users/" + this.uid + "/" + name); },
    index: function () { try { return JSON.parse(this.lget("camino.slots") || "[]") || []; } catch (e) { return []; } },
    setIndex: function (l) { this.lset("camino.slots", JSON.stringify(l)); },
    entry: function (id) { return this.index().filter(function (e) { return e.id === id; })[0] || null; },
    tomb: function () { try { return JSON.parse(this.lget("camino.del") || "[]") || []; } catch (e) { return []; } },
    saveLocal: function () {
      if (!S) return;
      S.ts = Date.now();
      var json = serialize(), me = metaOf(S);
      if (!this.lset("camino.active", json)) { this.ldel("camino.active"); this.lset("camino.active", json); }
      this.lset("camino.activeId", S.uid);
      var idx = this.index().filter(function (e) { return e.id !== me.id; });
      idx.unshift(me); this.setIndex(idx);
      this.schedule();
    },
    schedule: function () { var self = this; clearTimeout(this.ptimer); this.ptimer = setTimeout(function () { self.flush(); }, 2500); },
    /* comprime la partida en curso en su ranura y la sube a la cuenta */
    flush: function () {
      var self = this;
      clearTimeout(this.ptimer);
      if (!S) return Promise.resolve();
      if (this.busy) { this.again = true; return this.busyP; }
      this.busy = true; this.again = false;
      var json = serialize(), id = S.uid, ts = S.ts || Date.now();
      this.busyP = pack(json).then(function (pk) {
        self.lset("camino.s." + id, JSON.stringify({ts: ts, z: pk.z, d: pk.d}));
        if (!self.cloud || pk.d.length > 240000) return;
        return self.doc("s-" + id).set({ts: ts, z: pk.z, d: pk.d}).then(function () { return self.pushIndex(); });
      }).catch(function () {}).then(function () { self.busy = false; if (self.again && S) return self.flush(); });
      return this.busyP;
    },
    pushIndex: function () {
      var self = this;
      if (!this.cloud) return Promise.resolve();
      var dead = this.tomb();
      return this.doc("slots").get().then(function (snap) {
        var cl = snap.exists ? (snap.data().list || []) : [], by = {};
        cl.concat(self.index()).forEach(function (e) { if (!e || dead.indexOf(e.id) >= 0) return; if (!by[e.id] || (e.ts || 0) > (by[e.id].ts || 0)) by[e.id] = e; });
        var list = Object.keys(by).map(function (k) { var e = Object.assign({}, by[k]); delete e.cloud; return e; }).sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
        return self.doc("slots").set({list: list});
      }).catch(function () {});
    },
    list: function () {
      var self = this, local = this.index();
      if (!this.cloud) return Promise.resolve(local);
      var dead = this.tomb();
      return this.doc("slots").get().then(function (snap) {
        var cl = snap.exists ? (snap.data().list || []) : [], by = {};
        local.forEach(function (e) { by[e.id] = e; });
        cl.forEach(function (e) { if (!e || dead.indexOf(e.id) >= 0) return; if (!by[e.id] || (e.ts || 0) > (by[e.id].ts || 0)) by[e.id] = Object.assign({}, e, {cloud: true}); });
        return Object.keys(by).map(function (k) { return by[k]; }).sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
      }).catch(function () { return local; });
    },
    load: function (id) {
      var e = this.entry(id), raw = this.lget("camino.activeId") === id ? this.lget("camino.active") : null, pk = null;
      try { pk = JSON.parse(this.lget("camino.s." + id) || "null"); } catch (err) {}
      var rawTs = raw ? (e ? e.ts || 0 : 0) : -1;
      var local = raw && (!pk || rawTs >= (pk.ts || 0)) ? Promise.resolve({json: raw, ts: rawTs})
        : pk ? unpack(pk.z, pk.d).then(function (j) { return {json: j, ts: pk.ts || 0}; }) : Promise.resolve(null);
      if (!this.cloud) return local.then(function (x) { return x && x.json; });
      return Promise.all([local, this.doc("s-" + id).get().then(function (snap) { return snap.exists ? snap.data() : null; }).catch(function () { return null; })]).then(function (r) {
        var loc = r[0], cd = r[1];
        if (cd && (!loc || (cd.ts || 0) > loc.ts)) return unpack(cd.z, cd.d);
        return loc ? loc.json : null;
      });
    },
    remove: function (id) {
      this.ldel("camino.s." + id);
      if (this.lget("camino.activeId") === id) { this.ldel("camino.active"); this.ldel("camino.activeId"); }
      this.setIndex(this.index().filter(function (e) { return e.id !== id; }));
      var dead = this.tomb();
      if (dead.indexOf(id) < 0) { dead.push(id); this.lset("camino.del", JSON.stringify(dead.slice(-80))); }
      if (this.cloud) { this.doc("s-" + id).delete().catch(function () {}); this.pushIndex(); }
    },
    /* partidas de la versión anterior (una sola ranura) */
    migrate: function () {
      var old = this.lget("camino.save");
      if (!old) return;
      try {
        var s = JSON.parse(old), self = this;
        if (!s.uid) s.uid = Date.now().toString(36);
        if (!s.ts) s.ts = +(this.lget("camino.ts") || 0) || Date.now();
        if (!this.entry(s.uid)) {
          var json = JSON.stringify(s), idx = this.index();
          idx.unshift(metaOf(s)); this.setIndex(idx);
          this.lset("camino.active", json); this.lset("camino.activeId", s.uid);
          pack(json).then(function (pk) { self.lset("camino.s." + s.uid, JSON.stringify({ts: s.ts, z: pk.z, d: pk.d})); });
        }
        this.ldel("camino.save"); this.ldel("camino.ts");
      } catch (e) {}
    },
    migrateCloud: function () {
      var self = this;
      if (!this.cloud) return Promise.resolve();
      return this.doc("save").get().then(function (snap) {
        if (!snap.exists) return;
        var d = snap.data();
        return unpack(d.z, d.d).then(function (json) {
          var s = JSON.parse(json);
          if (!s.uid) s.uid = Date.now().toString(36);
          s.ts = s.ts || d.ts || Date.now();
          if (self.entry(s.uid)) return self.doc("save").delete();
          var j2 = JSON.stringify(s);
          return pack(j2).then(function (pk) {
            self.lset("camino.s." + s.uid, JSON.stringify({ts: s.ts, z: pk.z, d: pk.d}));
            var idx = self.index(); idx.push(metaOf(s)); idx.sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); }); self.setIndex(idx);
            return self.doc("s-" + s.uid).set({ts: s.ts, z: pk.z, d: pk.d}).then(function () { return self.pushIndex(); }).then(function () { return self.doc("save").delete(); });
          });
        });
      }).catch(function () {});
    },
    hof: function () {
      var self = this, local = [];
      try { local = JSON.parse(this.lget("camino.hof") || "[]"); } catch (e) {}
      if (!this.cloud) return Promise.resolve(local);
      return this.doc("hof").get().then(function (snap) {
        var cloud = snap.exists ? (snap.data().list || []) : [];
        var seen = {}, all = [];
        cloud.concat(local).forEach(function (e) { if (!seen[e.id]) { seen[e.id] = 1; all.push(e); } });
        return all;
      }).catch(function () { return local; });
    },
    addHof: function (entry) {
      var self = this;
      return this.hof().then(function (list) {
        if (list.some(function (e) { return e.id === entry.id; })) return list;
        list.push(entry);
        list.sort(function (a, b) { return b.sc - a.sc; });
        list = list.slice(0, 60);
        self.lset("camino.hof", JSON.stringify(list));
        if (self.cloud) self.doc("hof").set({list: list}).catch(function () {});
        return list;
      });
    }
  };
  function b64(bytes) { var s = ""; for (var i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); }
  function unb64(str) { var bin = atob(str), out = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out; }
  function pack(json) {
    try {
      if (typeof CompressionStream === "undefined") return Promise.resolve({z: false, d: json});
      var stream = new Blob([json]).stream().pipeThrough(new CompressionStream("gzip"));
      return new Response(stream).arrayBuffer().then(function (buf) { return {z: true, d: b64(new Uint8Array(buf))}; }).catch(function () { return {z: false, d: json}; });
    } catch (e) { return Promise.resolve({z: false, d: json}); }
  }
  function unpack(z, d) {
    if (!z) return Promise.resolve(d);
    var stream = new Blob([unb64(d)]).stream().pipeThrough(new DecompressionStream("gzip"));
    return new Response(stream).text();
  }

  /* ---------- acciones del juego ---------- */
  function persist() { Store.saveLocal(); }
  /* ---------- efectos: bordes de color y confeti ---------- */
  var LANG_FLAG = {es: "ES", en: "GB", de: "DE", it: "IT", fr: "FR"};
  function calm() { try { return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } }
  function edgeFlash(good) {
    if (good == null) return;
    var o = document.createElement("div");
    o.className = "edge " + (good ? "good" : "bad");
    o.setAttribute("aria-hidden", "true");
    document.body.appendChild(o);
    try { if (navigator.vibrate) navigator.vibrate(good ? 25 : [40, 60, 40]); } catch (e) {}
    setTimeout(function () { o.remove(); }, 1300);
  }
  function confetti(gold) {
    if (calm()) return;
    var c = document.createElement("canvas"), W0 = window.innerWidth, H0 = window.innerHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
    c.className = "confetti"; c.width = W0 * dpr; c.height = H0 * dpr; c.setAttribute("aria-hidden", "true");
    document.body.appendChild(c);
    var g = c.getContext("2d"); g.scale(dpr, dpr);
    var cols = gold ? ["#ffd54a", "#f2b705", "#ffe9a3", "#c9971c", "#fff4cc"] : ["#ffb21e", "#3fcf7c", "#66b9ff", "#ff5b66", "#edf1e8", "#b98cff"];
    var ps = [], n = gold ? 190 : 150;
    for (var i = 0; i < n; i++) {
      var side = i % 2 ? 1 : -1;
      ps.push({x: side > 0 ? W0 * 0.08 : W0 * 0.92, y: H0 * 0.72, vx: (-side) * (3 + Math.random() * 7) * -1, vy: -(9 + Math.random() * 9), w: 6 + Math.random() * 6, h: 4 + Math.random() * 6,
        r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.4, c: cols[i % cols.length], star: gold && i % 5 === 0});
    }
    var t0 = performance.now();
    (function frame(t) {
      var el = (t - t0) / 1000;
      g.clearRect(0, 0, W0, H0);
      ps.forEach(function (p) {
        p.vy += 0.32; p.vx *= 0.99; p.vy *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        g.save(); g.globalAlpha = Math.max(0, 1 - Math.max(0, el - 2.2)); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c;
        if (p.star) { g.beginPath(); for (var k = 0; k < 10; k++) { var rr = k % 2 ? 3 : 7, a = k * Math.PI / 5; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.fill(); }
        else g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 1.7)));
        g.restore();
      });
      if (el < 3.4) requestAnimationFrame(frame); else c.remove();
    })(t0);
  }
  window.__fx = {confetti: confetti, edge: edgeFlash};
  function snapshot() {
    if (!S) return null;
    var mgr = isMgr();
    return {tro: mgr ? S.m.trophies.length : (S.p ? S.p.trophies.length : 0), bdo: !mgr && S.p ? S.p.awards.filter(function (a) { return a.k === "bdo"; }).length : 0};
  }
  /* celebración de un título: ventana con el trofeo, la temporada y lo que gana el club */
  function trophyModal() {
    if (!S || !S.troQ || !S.troQ.length || document.getElementById("tromod")) return;
    var mgr = isMgr(), list = mgr ? S.m.trophies : S.p.trophies, idx = S.troQ.shift(), t = list[idx];
    persist();
    if (!t) return trophyModal();
    var fx = t.fx || {}, chips = [];
    if (mgr) {
      if (fx.bud) chips.push('<span class="chip up">' + tr("Presupuesto {v}", {v: "+" + fmtMoney(fx.bud) + (fx.budPct ? " (+" + fx.budPct + " %)" : "")}) + "</span>");
      if (fx.rep) chips.push('<span class="chip up">' + tr("Prestigio +{n}", {n: fx.rep}) + "</span>");
      if (fx.board) chips.push('<span class="chip up">' + tr("Directiva +{n}", {n: fx.board}) + "</span>");
      if (fx.fans) chips.push('<span class="chip up">' + tr("Afición +{n}", {n: fx.fans}) + "</span>");
      chips.push('<span class="chip up">' + tr("Moral de la plantilla +6") + "</span>");
    } else {
      if (fx.fame) chips.push('<span class="chip up">' + tr("Fama +{n}", {n: fx.fame}) + "</span>");
      if (fx.fans) chips.push('<span class="chip up">' + tr("Afición +{n}", {n: fx.fans}) + "</span>");
      if (fx.mor) chips.push('<span class="chip up">' + tr("Moral +{n}", {n: fx.mor}) + "</span>");
    }
    var who = mgr ? clubName(t.club) : t.nat >= 0 ? natName(t.nat) : clubName(t.team);
    var el = document.createElement("div"); el.id = "tromod"; el.className = "tromod"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true");
    el.innerHTML = '<div class="tropanel"><div class="trorays" aria-hidden="true"></div><div class="trokick">' + h(tr("¡Campeones!")) + '</div><div class="troimg">' + (typeof trophySVG === "function" ? trophySVG(t.k, 132) : "🏆") + "</div>" +
      "<h2>" + h(trComp(t.n)) + '</h2><div class="troseason">' + h(t.s || "") + " · " + h(who) + '</div><div class="chips">' + chips.join("") + '</div><button class="go" data-a="troclose">' + h(tr("¡A celebrarlo!")) + "</button></div>";
    document.body.appendChild(el);
    try { if (navigator.vibrate) navigator.vibrate([30, 60, 30]); } catch (e) {}
    confetti(true);
  }
  function celebrate(b) {
    var a = snapshot();
    setTimeout(trophyModal, 350);
    if (!a || !b) return;
    if (a.bdo > b.bdo) { confetti(true); setTimeout(function () { confetti(true); }, 700); }
    else if (a.tro > b.tro) confetti(false);
  }
  function doAdvance() {
    if (UI.busy) return;
    UI.busy = true;
    var before = S.feed[0] ? S.feed[0].id : null, snap = snapshot();
    try { advance(); } catch (e) { console.error(e); toast(tr("Algo ha fallado al simular. Tu partida sigue guardada.")); }
    UI.busy = false;
    UI.flash = S.feed[0] && S.feed[0].id !== before ? S.feed[0].id : null;
    if (S.ph === "ret") onRetire();
    persist(); UI.tab = isMgr() ? "club" : "carrera"; render(true);
    celebrate(snap);
  }
  function doChoose(i) {
    var before = S.feed[0] ? S.feed[0].id : null, inSheet = !!(UI.sheet && UI.sheet.k === "pend"), card = null, snap = snapshot();
    try { card = resolvePending(i); } catch (e) { console.error(e); toast(tr("No se pudo aplicar la decisión.")); }
    UI.flash = S.feed[0] && S.feed[0].id !== before ? S.feed[0].id : null;
    if (S.ph === "ret") onRetire();
    persist();
    if (inSheet) {
      cleanPend();
      if (!(S.pend[0] && S.pend[0].ui)) { UI.sheet = null; if (card && card.txt) toast(card.txt.length > 90 ? card.txt.slice(0, 88) + "…" : card.txt); }
      render(false);
    } else render(true);
    if (card) edgeFlash(card.good);
    celebrate(snap);
    if (S && S.liveReq != null) openLive();
  }
  function onRetire() {
    if (isMgr()) {
      var m = S.m, r = S.mretired; if (!r) return;
      Store.addHof({id: S.uid + "m", n: m.fn + " " + m.ln, nat: W.ctry[m.nat].code, pos: "DT", g: "DT", peak: Math.round(m.peakRep), club: clubName(r.main), y0: m.y0, y1: r.y,
        apps: r.tot.n, gl: r.tot.w, as: 0, tro: m.trophies.length, bdo: 0, sc: r.lg.sc, title: r.lg.title, ts: Date.now(), mgr: true});
      return;
    }
    var p = S.p, rr = S.retired;
    if (!rr) return;
    var tot = rr.tot;
    Store.addHof({id: S.uid, n: p.fn + " " + p.ln, nat: W.ctry[p.inat >= 0 ? p.inat : p.nat].code, pos: p.pos, g: W.pos[p.pos].g, peak: Math.round(p.peak),
      club: clubName(rr.main), y0: START_YEAR, y1: rr.y, apps: tot.apps, gl: tot.g, as: tot.a, tro: p.trophies.length,
      bdo: p.awards.filter(function (a) { return a.k === "bdo"; }).length, sc: rr.lg.sc, title: rr.lg.title, ts: Date.now()});
  }

  /* ---------- render principal ---------- */
  function render(toTop) {
    var keep = document.getElementById("main"), y = keep ? keep.scrollTop : 0, v = UI.view;
    /* fútbol femenino: los textos se ponen en femenino al crear o jugar una partida femenina */
    var gnow = v === "modes" ? UI.gsel : v === "create" && UI.cr ? UI.cr.g : (v === "game" || v === "draft") && S ? S.g : null;
    setFem(gnow === "f");
    /* mundo (ligas y clubes) del fútbol masculino o femenino según la partida o la creación en curso */
    var wkNow = v === "create" && UI.cr ? (UI.cr.g === "f" ? "f" : "m") : (v === "game" || v === "draft") && S ? worldKey(S) : null;
    if (wkNow && W.wk !== wkNow) { buildWorld(wkNow); if (S && worldKey(S) === wkNow && S.custom) applyCustom(); }
    if (v === "lang") $app.innerHTML = langView();
    else if (v === "load") $app.innerHTML = loadView();
    else if (v === "modes") $app.innerHTML = modesView();
    else if (v === "create" && UI.cr) $app.innerHTML = createView();
    else if (v === "draft" && S && S.ph === "draft") $app.innerHTML = draftView();
    else if (v !== "game" || !S || S.ph === "draft") { UI.view = "home"; $app.innerHTML = homeView(); }
    else {
      if (isMgr()) {
        cleanPend();
        var x = S.pend[0];
        if (x && x.ui && !(x.k === "mlivew" && LV)) { if (!UI.sheet || UI.sheet.k !== "pend") UI.sheet = {k: "pend"}; }
        else if (UI.sheet && UI.sheet.k === "pend") UI.sheet = null;
      }
      $app.innerHTML = (isMgr() ? topBarM() : topBar()) + '<main id="main">' + tabView() + "</main>" + dock() + tabsNav();
    }
    renderSheet();
    var mm = document.getElementById("main");
    if (mm) mm.scrollTop = toTop ? 0 : y;
    var key = UI.view + "|" + (UI.view === "game" ? UI.tab : UI.cr ? UI.cr.kind + UI.cr.step : "");
    if (key !== UI.vkey && mm && !calm()) { var back = UI.vback; mm.classList.add(back ? "vin-back" : "vin"); }
    UI.vkey = key; UI.vback = false;
    if (UI.view === "game" && !calm2()) setTimeout(flushNtf, 60);
    slot("after");
  }
  function calm2() { return !!document.querySelector(".mg-ov"); }
  function topBar() {
    var p = S.p, o = ovrInt(), ni = p.inat >= 0 ? p.inat : p.nat;
    return '<header class="top"><div class="ovr tier-' + tier(o) + '" aria-label="' + h(tr("Media {n}", {n: o})) + '"><b class="num">' + o + "</b><small>" + h(posAb(p.pos)) + "</small></div>" +
      '<div class="who"><h1>' + h(p.fn + " " + p.ln) + '</h1><div class="sub">' + crest(p.club) + "<span>" + (p.loan ? tr("{club} (cedido)", {club: h(clubName(p.club))}) : h(clubName(p.club))) + "</span><span>· " + trn(p.age, "{n} año", "{n} años") + "</span>" + flag(ni) + "</div></div>" +
      '<button class="iconbtn" data-a="menu" aria-label="' + h(tr("Menú")) + '">' + ICON.dots + "</button></header>";
  }
  function topBarM() {
    var m = S.m, r = Math.round(m.rep);
    return '<header class="top"><div class="ovr tier-' + repTier(r) + '" aria-label="' + h(tr("Prestigio {n}", {n: r})) + '"><b class="num">' + r + "</b><small>" + tr("DT") + "</small></div>" +
      '<div class="who"><h1>' + h(m.fn + " " + m.ln) + '</h1><div class="sub">' + (m.club >= 0 ? crest(m.club) + "<span>" + h(clubName(m.club)) + "</span>" : "<span>" + tr("Sin banquillo") + "</span>") + "<span>· " + trn(m.age, "{n} año", "{n} años") + "</span>" + flag(m.nat) + "</div></div>" +
      '<button class="iconbtn" data-a="menu" aria-label="' + h(tr("Menú")) + '">' + ICON.dots + "</button></header>";
  }
  function mainTab() { return isMgr() ? "club" : "carrera"; }
  function dock() {
    if (S.ph === "ret") {
      if (!isMgr()) return '<div class="dock two"><button class="go ghost" data-a="newcareer">' + tr("Nueva carrera") + '</button><button class="go" data-a="startmgr">' + tr("Empezar como entrenador") + " " + ICON.play + "</button></div>";
      return '<div class="dock"><button class="go" data-a="newgame">' + tr("Nueva partida") + " " + ICON.play + "</button></div>";
    }
    cleanPend();
    if (S.pend.length) {
      if (S.pend[0].ui) return "";
      return UI.tab !== mainTab() ? '<div class="dock"><button class="go ghost" data-a="tab" data-t="' + mainTab() + '">' + tr("Tienes una decisión pendiente") + "</button></div>" : "";
    }
    var lab = nextLabel();
    return lab ? '<div class="dock">' + (UI.tab === "plantilla" ? "" : xiWarn(true)) + '<button class="go" data-a="advance">' + h(lab) + " " + ICON.play + "</button></div>" : "";
  }
  /* aviso rojo: lesionados o sancionados en el once */
  function xiWarn(dockMode) {
    if (!isMgr() || !S.m || S.m.club < 0 || ["pre", "gap", "blk", "sblk"].indexOf(S.ph) < 0 || typeof mUnavXI !== "function") return "";
    var u = mUnavXI();
    if (!u.length) return "";
    var why = u.map(function (x) { var p = x.p; return "<b>" + h(plShort(p)) + "</b> " + (p.inj > S.tw ? tr("lesionado") : tr("sancionado")); }).join(" · ");
    if (dockMode) return '<div class="xiwarn dk" role="alert"><div class="xwt"><span class="xwi">!</span>' + trn(u.length, "{n} baja en tu once", "{n} bajas en tu once") + '</div><div class="xwb"><button class="btn" data-a="fixxi">' + tr("Corregir") + '</button><button class="btn" data-a="tab" data-t="plantilla">' + tr("Ver el once") + "</button></div></div>";
    return '<div class="xiwarn" role="alert"><div class="xwt"><span class="xwi">!</span>' + trn(u.length, "{n} baja en tu once", "{n} bajas en tu once") + '</div><p>' + why + '</p><p class="xws">' + tr("Si juegas así, entrará un suplente de urgencia, el equipo rendirá peor y el vestuario perderá moral.") + '</p><div class="xwb"><button class="btn" data-a="fixxi">' + tr("Corregir automáticamente") + "</button>" + (UI.tab !== "plantilla" ? '<button class="btn" data-a="tab" data-t="plantilla">' + tr("Ver el once") + "</button>" : "") + "</div></div>";
  }
  /* navegación: cuatro pestañas; lo demás vive en «Más» */
  function subTabs() { return isMgr() ? ["comp", "red", "hist"] : ["red", "hist", "mundo"]; }
  function tabsNav() {
    var t = isMgr() ? [["club", tr("Inicio"), ICON.home], ["plantilla", tr("Equipo"), ICON.shirt], ["mercado", tr("Mercado"), ICON.swap], ["mas", tr("Más"), ICON.grid]]
      : [["carrera", tr("Inicio"), ICON.home], ["jugador", tr("Yo"), ICON.shirt], ["comp", tr("Liga"), ICON.table], ["mas", tr("Más"), ICON.grid]];
    var unread = socUnread(), cur = subTabs().indexOf(UI.tab) >= 0 ? "mas" : UI.tab;
    return '<nav class="tabs four" aria-label="' + h(tr("Secciones")) + '">' + t.map(function (x) {
      return '<button data-a="tab" data-t="' + x[0] + '"' + (cur === x[0] ? ' aria-current="page"' : "") + ">" + x[2] + "<span>" + x[1] + "</span>" + (x[0] === "mas" && unread && UI.tab !== "red" ? '<span class="nbadge">' + (unread > 9 ? "9+" : unread) + "</span>" : "") + "</button>";
    }).join("") + "</nav>";
  }
  /* «Más»: el resto del juego en una lista clara */
  function tabMas() {
    var unread = socUnread(), mgr = isMgr(), rows = [];
    if (mgr) { var pos = S.m.club >= 0 ? posInLeague(S.m.club) : 0; rows.push(["tab", "comp", ICON.table, tr("Competición"), pos > 0 ? tr("Vais {pos} en {lg}", {pos: ord(pos), lg: lgName(S.cl[S.m.club])}) : tr("Clasificaciones y calendario")]); }
    rows.push(["tab", "red", ICON.at, tr("Red social"), unread ? trn(unread, "{n} publicación nueva", "{n} publicaciones nuevas") : tr("Lo que dicen de ti")]);
    rows.push(["tab", "hist", ICON.trophy, tr("Historial"), tr("Temporadas, títulos y premios")]);
    if (!mgr) rows.push(["tab", "mundo", ICON.globe, tr("Mundo"), tr("Otras ligas, selecciones y rivales")]);
    if (typeof achCount === "function") { achCheck(); var ac = achCount(); rows.push(["ach", "", ICON.medal, tr("Logros"), tr("{n} de {m} conseguidos", {n: ac[0], m: ac[1]})]); }
    rows.push(["guide", "", ICON.book, tr("Guía del juego"), tr("Cómo funciona cada parte")]);
    rows.push(["menu", "", ICON.gear, tr("Ajustes y partidas"), tr("Idioma, ritmo, guardar y cargar")]);
    return '<div class="stack"><h2 class="scrt">' + tr("Más") + '</h2><div class="mlist">' + rows.map(function (r) {
      return '<button class="mrow" data-a="' + r[0] + '"' + (r[1] ? ' data-t="' + r[1] + '"' : "") + '><span class="mic">' + r[2] + '</span><span class="mtx"><b>' + h(r[3]) + "</b><small>" + h(r[4]) + "</small></span>" + (r[1] === "red" && unread ? '<span class="nbadge in">' + (unread > 9 ? "9+" : unread) + "</span>" : "") + '<span class="chev" aria-hidden="true">›</span></button>';
    }).join("") + "</div></div>";
  }

  function tabView() {
    var body = tabView0(), t = UI.tab, sub = subTabs().indexOf(t) >= 0;
    var names = {comp: tr("Competición"), red: tr("Red social"), hist: tr("Historial"), mundo: tr("Mundo")};
    return (sub ? '<div class="backbar"><button class="backbtn" data-a="tab" data-t="mas">‹ ' + tr("Más") + "</button><h2>" + h(names[t] || "") + "</h2></div>" : "") + slot(t + "Top") + body + slot(t);
  }
  function tabView0() {
    if (isMgr()) {
      switch (UI.tab) {
        case "plantilla": return tabPlantilla();
        case "mercado": return tabMercado();
        case "comp": return tabComp();
        case "hist": return tabHistM();
        case "red": return tabRed();
        case "mas": return tabMas();
        default: UI.tab = "club"; return tabClub();
      }
    }
    switch (UI.tab) {
      case "jugador": return tabJugador();
      case "comp": return tabComp();
      case "hist": return tabHist();
      case "mundo": return tabMundo();
      case "red": return tabRed();
      case "mas": return tabMas();
      default: UI.tab = "carrera"; return tabCarrera();
    }
  }

  /* ---------- pestaña Carrera ---------- */
  function phaseText() {
    switch (S.ph) {
      case "pre": return tr("Pretemporada");
      case "blk": return tr("Jugando {block}", {block: BLOCKS[S.bi][2]});
      case "gap": return tr("Próximo tramo: {block}", {block: BLOCKS[S.bi][2]});
      case "post": return tr("Temporada terminada");
      case "sblk": return tr("Verano {year}", {year: S.yr + 1});
      case "awards": return tr("Gala de premios");
      case "off": return tr("Vacaciones");
      case "mjob": return tr("Buscando banquillo");
      case "ret": return tr("Carrera terminada");
    }
    return "";
  }
  /* temporada: título claro y los cinco tramos con su nombre */
  function ribbon() {
    var done = S.ph === "pre" || S.ph === "mjob" ? 0 : S.ph === "blk" || S.ph === "gap" ? S.bi : 5;
    var yl = S.ph === "mjob" ? seasonLabel(S.yr + 1) : seasonLabel(S.yr);
    return '<div class="sstrip"><div class="sshead"><h2>' + tr("Temporada {season}", {season: yl}) + '</h2><span>' + h(phaseText()) + '</span></div><ol class="ssteps" aria-label="' + h(tr("{n} de 5 tramos jugados", {n: done})) + '">' +
      BLOCKS.map(function (b, i) { return '<li class="' + (i < done ? "done" : i === done && done < 5 ? "now" : "") + '">' + h(tr(b[2])) + "</li>"; }).join("") + "</ol></div>";
  }

  function meter(lab, v, k) { v = Math.round(v); return '<div class="meter"><div class="eyebrow"><span>' + "" + lab + '</span><span class="num">' + v + '</span></div><div class="bar"><i class="' + barCls(v) + '" style="width:' + v + '%"></i></div></div>'; }
  /* cada indicador tiene su emoji fijo y, al lado, su barra */
  var STAT_EMO = {form: "📈", mor: "😊", fit: "💪", coach: "🧑‍🏫", fans: "📣", board: "💼", room: "👕", chem: "🧩", prof: "🎯", fame: "⭐"};
  function statEmo(k) { return STAT_EMO[k] || ""; }
  function lvlWord(v) { return v >= 75 ? [tr("muy bien"), "hi"] : v >= 55 ? [tr("bien"), "ok"] : v >= 35 ? [tr("regular"), "mid"] : [tr("mal"), "lo"]; }
  function statusRow(items) {
    return '<button class="strow" data-a="statinfo" aria-label="' + h(tr("Ver tu estado en detalle")) + '">' + items.map(function (x) {
      var v = Math.round(x[1]);
      return '<span class="stc" aria-label="' + h(x[0] + " " + v) + '"><span class="stl">' + h(x[0]) + '</span><span class="bar"><i class="' + barCls(v) + '" style="width:' + v + '%"></i></span><span class="num">' + v + "</span></span>";
    }).join("") + "</button>";
  }
  function statusItems() {
    if (isMgr()) { var m = S.m; return [[tr("Directiva"), m.board, "board"], [tr("Afición"), m.fans, "fans"], [tr("Vestuario"), m.club >= 0 ? mAvgMor() : 50, "room"], [tr("Química"), m.chem, "chem"], [tr("Forma"), teamForm(), "form"]]; }
    var p = S.p; return [[tr("Forma"), p.form, "form"], [tr("Moral"), p.mor, "mor"], [tr("Físico"), p.fit, "fit"], [tr("Míster"), p.coach, "coach"], [tr("Afición"), p.fans, "fans"]];
  }
  function metersRow() { var p = S.p; return '<div class="meters">' + meter(tr("Forma"), p.form) + meter(tr("Moral"), p.mor) + meter(tr("Físico"), p.fit) + meter(tr("Míster"), p.coach) + meter(tr("Afición"), p.fans) + "</div>"; }
  function tabCarrera() {
    var s = '<div class="stack">' + ribbon() + statusRow(statusItems());
    cleanPend();
    if (S.pend.length) s += pendingCard(S.pend[0]);
    if (S.ph === "ret") s += retireCard();
    else if (!S.pend.length && (S.ph === "pre" || S.ph === "gap")) s += aheadCard();
    s += newsList();
    return s + "</div>";
  }
  function aheadCard() {
    var p = S.p, inj = p.inj && p.injT > S.tw ? tr("Lesionado: {inj} ({n} sem.)", {inj: h(lc(tr(p.inj.n))), n: p.injT - S.tw}) : "";
    var objs = S.ph === "gap" && p.objs.length ? '<div style="margin-top:10px">' + p.objs.map(objRow).join("") + "</div>" : "";
    return '<section class="card"><div class="head"><span class="tag ok"><span class="dot"></span>' + tr("Siguiente") + '</span><span class="eyebrow">' + h(tr(roleNow())) + "</span></div>" +
      "<h3>" + (S.ph === "pre" ? tr("Todo listo para arrancar") : tr("Tramo {n} de 5: {block}", {n: S.bi + 1, block: BLOCKS[S.bi][2]})) + "</h3>" +
      '<p class="lead">' + (S.ph === "pre" ? (inCont() ? tr("Liga, copa, {comp} y ventanas con la selección. Pulsa el botón para jugar el primer tramo.", {comp: h(trComp(inCont()))}) : tr("Liga, copa y ventanas con la selección. Pulsa el botón para jugar el primer tramo.")) : tr("Llegas con {fit} de físico y {form} de forma.", {fit: Math.round(p.fit), form: Math.round(p.form)})) + (inj ? '<br><span class="neg">' + inj + "</span>" : "") + "</p>" + objs + "</section>";
  }
  function inCont() {
    var c = null, me = myClub();
    ["UCL", "UEL", "UECL", "LIB", "SUD", "ACL", "CAF", "CCC"].some(function (k) { var x = S.C[k]; if (x && x.teams && x.teams.indexOf(me) >= 0) { c = x.n; return true; } return false; });
    return c;
  }
  function objRow(o) {
    var pr = objProgress(o), met = objMet(o), pct;
    if (o.k === "pos") pct = pr[0] > 0 ? Math.max(5, Math.min(100, (1 - (pr[0] - pr[1]) / 10) * 100)) : 0;
    else pct = Math.min(100, pr[1] ? pr[0] / pr[1] * 100 : 0);
    var val = o.k === "pos" ? (pr[0] > 0 ? ord(pr[0]) : "—") : o.k === "rt" ? dec(pr[0]) : pr[0] + "/" + pr[1];
    return '<div class="obj"><div><span>' + h(objName(o)) + objPill(o) + '</span><span class="num ' + (met ? "pos" : "") + '">' + val + '</span></div><div class="bar"><i class="' + (met ? "hi" : "mid") + '" style="width:' + pct + '%"></i></div></div>';
  }

  /* ---------- decisiones pendientes ---------- */
  function boardHTML(b) {
    return '<div class="board"><span class="min">' + h(b.min) + '</span><span class="tm">' + h(b.l[0]) + '</span><span class="sc">' + b.l[1] + "-" + b.r[1] + '</span><span class="tm">' + h(b.r[0]) + "</span></div>";
  }
  function optHTML(o, i) {
    var outs = o.outs, sure = outs.length === 1, gp = 0, pc = pctList(outs);
    outs.forEach(function (u) { if (u.good) gp += u.p; });
    var gpc = Math.round(gp * 100);
    var badge = sure ? '<span class="pct sure">' + tr("Seguro") + '</span>' : '<span class="pct ' + (gp >= 0.67 ? "hi" : gp >= 0.4 ? "mid" : "lo") + '">' + h(o.badge || tr("Bien")) + " " + gpc + " %</span>";
    if (o.blind) return '<button class="opt" data-a="choose" data-i="' + i + '"><span class="ot"><b>' + h(o.t) + "</b></span>" + (o.ref ? '<span class="oref">' + h(o.ref) + "</span>" : "") + "</button>";
    if (o.mini) badge = '<span class="pct mid">🎯 ' + h(tr("Tú decides")) + "</span>";
    var s = '<button class="opt" data-a="' + (o.so && UIX.actions.so ? "so" : o.mini && typeof Minigame !== "undefined" ? "mini" : "choose") + '" data-i="' + i + '"' + (o.mini ? ' data-m="' + h(o.mini) + '"' : "") + (o.dis ? " disabled" : "") + '><span class="ot"><b>' + h(o.t) + "</b>" + badge + "</span>";
    if (o.d) s += "<small>" + h(o.d) + "</small>";
    if (o.dis) s += '<small class="neg">' + h(o.dis) + "</small>";
    var lines = "";
    outs.forEach(function (u, k) {
      var chips = u.chips.map(chip).join("");
      if (sure) { if (chips) lines += '<span class="out">' + chips + "</span>"; return; }
      var cls = u.neu ? "nu" : u.good ? "ok" : "ko";
      lines += '<span class="out ' + cls + '"><span class="op">' + (o.mini ? h(/^gk/.test(o.mini) ? (u.good ? tr("Si la paras") : tr("Si entra")) : u.good ? tr("Si entra") : tr("Si no entra")) : h(u.lab || (u.good ? tr("Bien") : tr("Mal"))) + " " + pc[k] + " %") + "</span>" + (chips || (u.lab ? "" : '<span class="chip">' + tr("Sin cambios") + '</span>')) + "</span>";
    });
    if (lines) s += '<span class="outs">' + lines + "</span>";
    if (o.ref) s += '<span class="oref">' + h(o.ref) + "</span>";
    return s + "</button>";
  }
  /* sala de prensa: photocall con los colores del club, mesa con micrófonos y periodistas en primer plano */
  var PR_ID = 0;
  function pressRoomSVG(q) {
    var mgr = S.mode === "mgr", ci = mgr ? S.m.club : S.p.club, c = W.clubs[ci] || {}, id = "pr" + (++PR_ID);
    var col = [0, 1].map(function (i) { return c.col && COL_OK.test(c.col[i]) ? c.col[i] : i ? "#ffb21e" : "#24393f"; });
    var ab = h(c.ab || "FC"), nm = h(socSelfName()), s = "";
    s += '<svg class="pressroom" viewBox="0 0 360 168" role="img" aria-label="' + h(tr("Sala de prensa")) + '"><defs>';
    s += '<linearGradient id="' + id + 'w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16262b"/><stop offset="1" stop-color="#0c1619"/></linearGradient>';
    s += '<radialGradient id="' + id + 'l" cx=".5" cy=".25" r=".6"><stop offset="0" stop-color="#fff6dc" stop-opacity=".22"/><stop offset="1" stop-color="#fff6dc" stop-opacity="0"/></radialGradient>';
    s += '<pattern id="' + id + 'p" width="60" height="34" patternUnits="userSpaceOnUse">' +
      '<rect width="60" height="34" fill="' + col[0] + '" opacity=".16"/>' +
      '<text x="15" y="21" text-anchor="middle" font-size="11" font-weight="800" fill="' + col[1] + '" opacity=".7" font-family="var(--f-disp,Impact,sans-serif)">' + ab + '</text>' +
      '<circle cx="45" cy="17" r="5" fill="none" stroke="#91a4a6" stroke-width="1.6" opacity=".5"/><rect x="38" y="25" width="14" height="2" rx="1" fill="#91a4a6" opacity=".4"/>' +
      '<rect x="0" y="0" width="60" height="34" fill="none" stroke="#000" stroke-opacity=".25"/></pattern>';
    s += '<radialGradient id="' + id + 'f"><stop offset="0" stop-color="#fff"/><stop offset=".25" stop-color="#fff" stop-opacity=".8"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient><linearGradient id="' + id + 't" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + col[0] + '"/><stop offset="1" stop-color="#05090a"/></linearGradient></defs>';
    /* pared y photocall */
    s += '<rect width="360" height="168" fill="url(#' + id + 'w)"/><rect x="40" y="0" width="280" height="118" fill="url(#' + id + 'p)"/>';
    s += '<rect x="40" y="0" width="280" height="118" fill="url(#' + id + 'l)"/><rect x="38" y="0" width="2" height="118" fill="#000" opacity=".4"/><rect x="320" y="0" width="2" height="118" fill="#000" opacity=".4"/>';
    /* protagonista sentado */
    var shirt = mgr ? "#1b2328" : col[0], trim = mgr ? "#e9e3d6" : col[1];
    s += '<g transform="translate(0 -5)">';
    s += '<path d="M152 117 Q152 84 168 80 L192 80 Q208 84 208 112 Z" fill="' + shirt + '"/>';
    s += mgr ? '<path d="M174 80 L180 94 L186 80 Z" fill="' + trim + '"/><path d="M179 84 L181 84 L182 98 L178 98 Z" fill="' + col[0] + '"/>' : '<path d="M172 80 Q180 87 188 80" fill="none" stroke="' + trim + '" stroke-width="2.4"/>';
    s += '<rect x="176" y="70" width="8" height="11" rx="3" fill="#c99470"/><ellipse cx="180" cy="62" rx="10" ry="11.5" fill="#d6a27a"/>';
    s += '<path d="M170 60 Q170 49 180 49 Q191 49 190 61 Q186 54 176 56 Z" fill="#2b1d14"/><ellipse cx="170" cy="63" rx="1.8" ry="3" fill="#c99470"/><ellipse cx="190" cy="63" rx="1.8" ry="3" fill="#c99470"/></g>';
    /* mesa, micrófonos, agua y cartel */
    s += '<rect x="70" y="108" width="220" height="7" rx="2" fill="#2a3a3f"/><rect x="74" y="115" width="212" height="30" fill="url(#' + id + 't)"/>';
    s += '<rect x="148" y="121" width="64" height="12" rx="2" fill="#0b1417" opacity=".75"/><text x="180" y="130" text-anchor="middle" font-size="7.5" font-weight="700" fill="#edf1e8" font-family="var(--f-body,sans-serif)">' + (nm.length > 18 ? nm.slice(0, 17) + "…" : nm) + "</text>";
    var mics = [[160, "#ff5b66"], [168, "#66b9ff"], [176, "#ffb21e"], [184, "#3fcf7c"], [192, "#edf1e8"], [200, "#b98552"]];
    mics.forEach(function (m, i) {
      var top = 94 + (i % 2) * 3, x2 = 180 + (m[0] - 180) * 0.6;
      s += '<path d="M' + m[0] + ' 108 L' + x2.toFixed(1) + " " + top + '" stroke="#0b1417" stroke-width="1.6"/><rect x="' + (x2 - 3.2).toFixed(1) + '" y="' + (top - 3) + '" width="6.4" height="7" rx="3" fill="#20262a"/><rect x="' + (x2 - 3.6).toFixed(1) + '" y="' + (top + 3) + '" width="7.2" height="4" rx="1" fill="' + m[1] + '"/>';
    });
    s += '<rect x="226" y="94" width="7" height="14" rx="2" fill="#9fd6ff" opacity=".55"/><rect x="227.5" y="91" width="4" height="4" rx="1" fill="#66b9ff"/><path d="M238 100 L246 100 L245 108 L239 108 Z" fill="#9fd6ff" opacity=".4"/>';
    /* cámaras en trípode */
    [[22, 1], [338, -1]].forEach(function (k) {
      var x = k[0], f = k[1];
      s += '<path d="M' + x + " 116 L" + (x - 12) + " 168 M" + x + " 116 L" + (x + 12) + " 168 M" + x + ' 116 V168" stroke="#05090a" stroke-width="2.4"/>';
      s += '<rect x="' + (x - 14) + '" y="98" width="28" height="18" rx="3" fill="#05090a"/><rect x="' + (f > 0 ? x + 12 : x - 22) + '" y="101" width="10" height="12" rx="2" fill="#05090a"/><circle cx="' + (f > 0 ? x + 22 : x - 22) + '" cy="107" r="4.5" fill="#1d2a2e" stroke="#05090a" stroke-width="2"/><circle cx="' + (x - 8 * f) + '" cy="103" r="1.6" fill="#ff5b66" class="pr-rec"/>';
    });
    /* periodistas de espaldas; uno levanta la mano */
    var heads = [[58, 150, "#2b1d14"], [104, 156, "#4a3424"], [150, 152, "#15100c"], [214, 154, "#6b5a45"], [262, 150, "#2b1d14"], [306, 157, "#3a2a1c"]];
    var hand = q ? [0, 4, 1, 5][(q.n || 1) % 4] : -1;
    heads.forEach(function (p, i) {
      if (i === hand) s += '<path d="M' + (p[0] + 12) + " " + (p[1] + 4) + " Q" + (p[0] + 20) + " " + (p[1] - 14) + " " + (p[0] + 18) + " " + (p[1] - 30) + '" stroke="#0d181b" stroke-width="7" stroke-linecap="round" fill="none"/><circle cx="' + (p[0] + 18) + '" cy="' + (p[1] - 33) + '" r="4.5" fill="#c99470"/>';
      s += '<path d="M' + (p[0] - 26) + " 168 Q" + (p[0] - 24) + " " + (p[1] + 2) + " " + p[0] + " " + (p[1] + 1) + " Q" + (p[0] + 24) + " " + (p[1] + 2) + " " + (p[0] + 26) + ' 168 Z" fill="#1f3036"/>';
      s += '<ellipse cx="' + p[0] + '" cy="' + (p[1] - 8) + '" rx="11" ry="12" fill="' + p[2] + '"/>';
    });
    /* flashes */
    s += '<g class="pr-flash"><circle cx="92" cy="128" r="22" fill="url(#' + id + 'f)"/></g><g class="pr-flash f2"><circle cx="276" cy="124" r="20" fill="url(#' + id + 'f)"/></g>';
    return s + "</svg>";
  }
  function descCard(d) {
    var o = '<section class="card decision ' + (d.cls || "") + '" aria-live="polite"><div class="head"><span class="tag ' + h(d.tag) + '"><span class="dot"></span>' + h(d.tagTxt) + '</span><span class="eyebrow">' + h(d.cat || "") + "</span></div>";
    if (d.scene === "press") o += pressRoomSVG(d.sceneQ);
    o += "<h3>" + h(d.title) + "</h3>";
    if (d.board) o += boardHTML(d.board);
    o += '<p class="lead">' + h(d.text) + "</p>";
    if (d.ref) o += '<div class="ref"><b>' + tr("Pasó de verdad") + '</b>' + h(d.ref) + "</div>";
    o += '<div class="opts">' + d.opts.map(optHTML).join("") + "</div>";
    if (S && S.pend[0] && S.pend[0].k === "moment" && d.opts.length > 1) o += '<button class="btn wide msim" data-a="msim">⏩ ' + tr("Simular la jugada") + '</button><p class="muted" style="font-size:12px;margin:6px 0 0">' + tr("El juego decide por ti y te dice cómo acaba el partido.") + "</p>";
    return o + "</section>";
  }
  /* marcador final tras un momento de partido */
  function finBox(f) {
    var r = f.so ? "so" : f.r > 0 ? "w" : f.r < 0 ? "l" : "d";
    var lab = f.so ? tr("A los penaltis") : f.r > 0 ? tr("Victoria") : f.r < 0 ? tr("Derrota") : tr("Empate");
    return '<div class="finbox ' + r + '"><span class="ft">' + tr("Final") + (f.et ? " · " + tr("prórroga") : "") + '</span><div class="fs"><span>' + h(f.us) + "</span><b>" + f.gu + "–" + f.gt + "</b><span>" + h(f.opp) + "</span></div>" +
      (f.pens ? '<span class="fp">' + tr("Penaltis: {a}-{b}", {a: f.pens[0], b: f.pens[1]}) + "</span>" : "") + '<em>' + h(lab) + "</em></div>";
  }
  /* negociación de un fichaje con barra de oferta y medidor de frustración */
  function negoPct(v, ask) { var p = Math.round(v / ask * 100); return v < ask ? Math.min(99, p) : Math.max(100, p); }
  function negoCard(x) {
    var t = mgrTarget(x.tid); if (!t) return "";
    var fee = x.ph === "fee", mx = negoMax(x), v = Math.min(x.v, mx), who = fee ? clubName(t.club) : t.fn + " " + t.ln;
    var o = '<section class="card decision nego"><div class="head"><span class="tag real"><span class="dot"></span>' + tr("Fichaje") + '</span><span class="eyebrow">' + (fee ? tr("Paso 1 de 2 · con su club") : tr("Paso 2 de 2 · con el jugador")) + "</span></div>";
    o += "<h3>" + (fee ? tr("Oferta por {name}", {name: h(t.fn + " " + t.ln)}) : tr("Convencer a {name}", {name: h(t.fn + " " + t.ln)})) + "</h3>";
    o += '<p class="lead">' + h(tDesc(t)) + " " + (fee ? tr("El {club} pide {ask}. Tienes {bud} de presupuesto.", {club: h(who), ask: "<b>" + fmtMoney2(x.ask) + "</b>", bud: fmtMoney2(S.m.bud)})
      : (x.fee ? tr("Acuerdo cerrado con el {club} por {fee}.", {club: h(clubName(t.club)), fee: fmtMoney2(x.fee)}) + " " : tr("Está sin equipo y escucha ofertas.") + " ") + trn(t.yrsD, "Pide {ask} al año durante {n} año.", "Pide {ask} al año durante {n} años.", {ask: "<b>" + fmtMoney2(x.ask) + "</b>"})) + "</p>";
    var fr = Math.round(x.fr), frc = fr >= 70 ? "hi" : fr >= 40 ? "mid" : "lo";
    o += '<div class="frus ' + frc + '"><div class="frl"><span>' + (fee ? tr("Frustración del {club}", {club: h(who)}) : tr("Frustración de {name}", {name: h(t.ln)})) + "</span><b>" + fr + ' %</b></div><div class="frb"><i style="width:' + fr + '%"></i></div>' +
      '<small class="muted">' + tr("Si llega al 100 %, se rompe la negociación.") + "</small></div>";
    var pctAsk = negoPct(v, x.ask);
    o += '<div class="nslide"><div class="nv"><b id="negoval">' + fmtMoney2(v) + (fee ? "" : "<small>/" + tr("año") + "</small>") + '</b><span id="negopct" class="' + (pctAsk >= 100 ? "up" : pctAsk >= 80 ? "" : "down") + '">' + tr("{pct} % de lo que piden", {pct: pctAsk}) + "</span></div>" +
      '<div class="nrow"><button class="btn sm" data-a="negostep" data-v="-1" aria-label="' + h(tr("Bajar")) + '">−</button><input type="range" id="negov" min="' + x.lo + '" max="' + mx + '" step="' + negoStep(x) + '" value="' + v + '" aria-label="' + h(tr("Tu oferta")) + '"><button class="btn sm" data-a="negostep" data-v="1" aria-label="' + h(tr("Subir")) + '">+</button></div>' +
      '<div class="nends muted"><span>' + fmtMoney2(x.lo) + "</span><span>" + fmtMoney2(mx) + "</span></div></div>";
    if (!fee) o += '<button class="pickrow" data-a="negoprom" aria-pressed="' + !!x.prom + '"><div class="grow"><b>' + tr("Prometerle que será Clave") + "</b><small>" + tr("Lo convence más, pero si no juega se sentirá engañado.") + "</small></div></button>";
    if (x.log && x.log.length) o += '<ul class="nlog">' + x.log.filter(function (l) { return l.txt; }).slice(0, 4).map(function (l) { return '<li class="' + h(l.r) + '">' + h(l.txt) + "</li>"; }).join("") + "</ul>";
    o += '<div class="opts"><button class="btn pri wide" data-a="negooff">' + (fee ? tr("Hacer la oferta") : tr("Ofrecer este sueldo")) + '</button><button class="btn wide" data-a="negoquit">' + tr("Retirarte de la operación") + "</button></div>";
    o += '<p class="muted" style="font-size:12.5px;margin:8px 0 0">' + trn(x.tries, "{n} oferta hecha.", "{n} ofertas hechas.") + " " + tr("Ofertas muy bajas los enfadan más.") + "</p>";
    return o + "</section>";
  }
  /* avisos temporales que manda el motor: lesiones, rojas, mercado, resultados */
  function flushNtf() {
    if (!S || !S.ntf || !S.ntf.length || LV) return; /* durante el partido en directo se guardan para después */
    var q = S.ntf; S.ntf = [];
    var res = q.filter(function (n) { return n.k === "res"; }), rest = q.filter(function (n) { return n.k !== "res"; });
    var wrap = document.getElementById("ntfs");
    if (!wrap) { wrap = document.createElement("div"); wrap.id = "ntfs"; wrap.className = "ntfs"; wrap.setAttribute("aria-live", "polite"); document.body.appendChild(wrap); }
    var add = function (cls, html, ms) {
      var el = document.createElement("div"); el.className = "ntf " + cls; el.setAttribute("role", "status"); el.innerHTML = html;
      var tm = null, gone = false;
      var close = function () { if (gone) return; gone = true; el.classList.add("out"); setTimeout(function () { el.remove(); }, 400); };
      var arm = function (t) { clearTimeout(tm); tm = setTimeout(close, t); };
      /* tocar la lista o desplazarla la mantiene abierta; tocar fuera de la lista la cierra */
      el.addEventListener("click", function (e) { if (el._nodrop && Date.now() - el._nodrop < 300) return; if (!(e.target.closest && e.target.closest(".ntfl"))) close(); });
      var keep = function () { arm(4000); };
      /* deslizar a la derecha para quitarla */
      var sx = null, sy = null, dx = 0, drag = false;
      el.addEventListener("pointerdown", function (e) { clearTimeout(tm); sx = e.clientX; sy = e.clientY; dx = 0; drag = false; });
      el.addEventListener("pointermove", function (e) {
        if (sx == null) return;
        var mx = e.clientX - sx, my = e.clientY - sy;
        if (!drag && Math.abs(mx) > 10 && Math.abs(mx) > Math.abs(my) * 1.3) { drag = true; el.classList.add("swiping"); try { el.setPointerCapture(e.pointerId); } catch (er) {} }
        if (drag) { dx = Math.max(0, mx); el.style.transform = "translateX(" + dx + "px)"; el.style.opacity = String(Math.max(0.2, 1 - dx / 260)); }
      });
      var endDrag = function () {
        if (sx == null) return; sx = null; el.classList.remove("swiping");
        if (drag && dx > 80) { gone = true; el.style.transform = "translateX(110%)"; el.style.opacity = "0"; try { if (navigator.vibrate) navigator.vibrate(10); } catch (er) {} setTimeout(function () { el.remove(); }, 220); return; }
        if (drag) { el.style.transform = ""; el.style.opacity = ""; el._nodrop = Date.now(); }
        keep();
      };
      el.addEventListener("pointerup", endDrag);
      el.addEventListener("pointercancel", endDrag);
      el.addEventListener("mouseenter", function () { clearTimeout(tm); });
      el.addEventListener("mouseleave", keep);
      var lst = el.querySelector(".ntfl"); if (lst) lst.addEventListener("scroll", keep, {passive: true});
      wrap.appendChild(el);
      while (wrap.children.length > 4) wrap.removeChild(wrap.firstChild);
      arm(ms);
    };
    if (res.length) {
      var w = res.filter(function (n) { return n.r > 0; }).length, l = res.filter(function (n) { return n.r < 0; }).length;
      add("res", '<b>' + (res.length === 1 ? tr("Resultado") : tr("Resultados")) + (res.length > 1 ? ' <small>' + tr("{w}V · {d}E · {l}D", {w: w, d: res.length - w - l, l: l}) + "</small>" : "") + "</b>" +
        '<div class="ntfl' + (res.length > 5 ? " more" : "") + '">' + res.map(function (n) { return "<span>" + h(n.t) + "</span>"; }).join("") + "</div>", Math.min(12000, 5200 + Math.max(0, res.length - 4) * 500));
    }
    rest.slice(-4).forEach(function (n, i) { setTimeout(function () { add(n.k, h(n.t), n.k === "red" ? 5200 : 4200); }, 140 * (i + (res.length ? 1 : 0))); });
    persist();
  }
  function pendingCard(x) {
    var o = "";
    if (x.k === "objs") return objsCard(x);
    if (x.k === "nego") return negoCard(x);
    if (UIX.pend[x.k]) return UIX.pend[x.k](x);
    if (x.k === "focus") {
      var gk = isGK();
      o += '<section class="card decision"><div class="head"><span class="tag real"><span class="dot"></span>' + tr("Decisión de carrera") + '</span><span class="eyebrow">' + tr("Entrenamiento") + '</span></div><h3>' + tr("Plan de pretemporada") + '</h3><p class="lead">' + tr("¿En qué vas a trabajar esta temporada? Esto es lo que te subirá al terminarla.") + '</p><div class="focusgrid">';
      Object.keys(FOCUS).forEach(function (k, i) {
        var f = FOCUS[k], al = gk ? f.gk : f.att;
        /* lo que sube en la temporada: +0,45 por tramo en cada atributo (5 tramos) o +3 % de progresión de media */
        var gain = al.length ? al.map(function (a) { return '<span class="chip up">' + h(tr(ATT_NAMES[a])) + " +2</span>"; }).join("") : '<span class="chip up">' + h(tr("Media: +3 % de progresión")) + "</span>";
        o += '<button class="opt" data-a="choose" data-i="' + i + '"><b>' + h(f.n) + "</b><small>" + h(f.d) + '</small><span class="outs"><span class="out">' + gain + "</span></span></button>";
      });
      return o + "</div></section>";
    }
    if (x.k === "offers") {
      o += '<section class="card decision"><div class="head"><span class="tag real"><span class="dot"></span>' + tr("Mercado de {kind}", {kind: h(tr(x.kind))}) + '</span><span class="eyebrow">' + trn(x.list.length, "{n} oferta", "{n} ofertas") + "</span></div>";
      o += "<h3>" + (x.forced ? tr("Eres agente libre: elige tu nuevo club") : tr("Tienes ofertas sobre la mesa")) + '</h3><p class="lead">' + tr("Tu valor de mercado: {value}. Ahora cobras {sal} al año en el {club}.", {value: fmtMoney(marketValue()), sal: fmtMoney(S.p.con.sal), club: h(clubName(S.p.club))}) + '</p><div class="opts">';
      x.list.forEach(function (of, i) {
        var li = S.cl[of.club];
        o += '<div class="offer">' + crest(of.club, true) + '<div style="min-width:0"><div class="nm">' + h(clubName(of.club)) + '</div><div class="muted" style="font-size:13px">' + flag(W.clubs[of.club].ci) + " " + h(lgName(li)) + " · " + tr("nivel {n}", {n: Math.round(S.cr[of.club])}) + (of.promised ? " · " + tr("te lo prometieron") : "") + "</div></div>" +
          '<div class="kv"><div><span>' + tr("Rol") + '</span><b>' + h(tr(of.role)) + "</b></div><div><span>" + (of.loan ? tr("Tipo") : tr("Traspaso")) + "</span><b>" + (of.loan ? tr("Cesión 1 año") : of.fee ? fmtMoney(of.fee) : tr("Libre")) + "</b></div>" +
          "<div><span>" + tr("Sueldo/año") + "</span><b>" + fmtMoney(of.sal) + "</b></div><div><span>" + tr("Contrato") + "</span><b>" + (of.loan ? "—" : trn(of.yrs, "{n} año", "{n} años")) + "</b></div></div>" +
          '<button class="btn pri sign" data-a="choose" data-i="' + i + '">' + (of.loan ? tr("Aceptar cesión") : tr("Fichar por el {club}", {club: h(clubName(of.club))})) + "</button></div>";
      });
      if (!x.forced) o += '<button class="btn wide" data-a="choose" data-i="-1">' + tr("Quedarme en el {club}", {club: h(clubName(S.p.club))}) + "</button>";
      return o + "</div></section>";
    }
    if (x.k === "jobs") return jobsCard(x);
    var d = null;
    try { d = pendDesc(x); } catch (e) { console.error(e); }
    return d ? descCard(d) : "";
  }
  function jobsCard(x) {
    var m = S.m, max = mgrMaxClubR();
    var title = x.first ? tr("Elige tu primer banquillo") : x.sacked ? tr("Te han destituido: busca nuevo club") : x.forced ? tr("Elige tu próximo banquillo") : tr("Otros clubes te quieren");
    var o = '<section class="card decision"><div class="head"><span class="tag real"><span class="dot"></span>' + tr("Banquillos") + '</span><span class="eyebrow">' + tr("Prestigio {n}", {n: Math.round(m.rep)}) + "</span></div>";
    o += "<h3>" + title + '</h3><p class="lead">' + (x.first ? tr("Con tu nombre y tu carrera como jugador, estos clubes te ofrecen su banquillo.") + " " : "") + tr("Puedes dirigir clubes de nivel {n} o menos; con más prestigio llegarán los grandes.", {n: Math.round(max)}) + "</p><div class=\"opts\">";
    x.list.forEach(function (of, i) {
      var li = S.cl[of.club], L = S.L && S.L[li], ex = L ? L.exp.indexOf(of.club) + 1 : 0;
      o += '<div class="offer">' + crest(of.club, true) + '<div style="min-width:0"><div class="nm">' + h(clubName(of.club)) + '</div><div class="muted" style="font-size:13px">' + flag(W.clubs[of.club].ci) + " " + h(lgName(li)) + " · " + tr("nivel {n}", {n: Math.round(S.cr[of.club])}) + (of.club === m.exClub ? " · " + tr("tu antiguo club") : "") + "</div></div>" +
        '<div class="kv"><div><span>' + tr("Presupuesto") + '</span><b>' + fmtMoney(mBudgetFor(of.club)) + "</b></div><div><span>" + tr("Sueldo/año") + "</span><b>" + fmtMoney(of.sal) + "</b></div>" +
        "<div><span>" + tr("Contrato") + "</span><b>" + trn(of.yrs, "{n} año", "{n} años") + "</b></div><div><span>" + tr("Favorito a") + "</span><b>" + (ex ? tr("{pos} en liga", {pos: ord(ex)}) : "—") + "</b></div></div>" +
        '<p class="muted" style="font-size:12.5px;margin:6px 0 0">' + tr("Sustituirías a {n}.", {n: h(coachName(of.club))}) + "</p>" +
        '<button class="btn pri sign" data-a="choose" data-i="' + i + '">' + tr("Firmar con el {club}", {club: h(clubName(of.club))}) + "</button></div>";
    });
    o += '<button class="btn wide" data-a="jobpick">' + tr("Buscar otro banquillo") + '</button>';
    if (!x.forced) o += '<button class="btn wide" data-a="choose" data-i="-1">' + tr("Quedarme en el {club}", {club: h(clubName(m.club))}) + "</button>";
    return o + "</div></section>";
  }

  /* ---------- chips y tarjetas del feed ---------- */
  var MCHIP = {board: N_("Directiva"), fans: N_("Afición"), rep: N_("Prestigio"), chem: N_("Química"), sqMor: N_("Moral del vestuario"), sfit: N_("Físico de la plantilla"), pts: N_("Puntos en liga")};
  function chip(c) {
    var k = c[0], v = c[1], ex = c[2], cls = "", t;
    switch (k) {
      case "money": case "bud": t = (v >= 0 ? "+" : "−") + fmtMoney(Math.abs(v)); if (k === "bud") t = tr("{amount} presupuesto", {amount: t}); cls = v >= 0 ? "up" : "down"; break;
      case "fol": t = tr("{amount} seguidores", {amount: (v >= 0 ? "+" : "−") + fmtFol(Math.abs(v))}); cls = v >= 0 ? "up" : "down"; break;
      case "inj": t = tr("Lesión: {range} sem.", {range: Array.isArray(v) ? v[0] + "–" + v[1] : v}); cls = "down"; break;
      case "susp": t = trn(v, "Sanción: {n} partido", "Sanción: {n} partidos"); cls = "down"; break;
      case "buff": t = tr("{v} media temporal", {v: sgn(v)}) + (ex ? " (" + ex + ")" : ""); cls = v >= 0 ? "up" : "down"; break;
      case "tbuff": t = tr("{v} nivel del equipo", {v: sgn(v)}) + (ex ? " (" + ex + ")" : ""); cls = v >= 0 ? "up" : "down"; break;
      case "att": t = sgn(v) + " " + ex; cls = v >= 0 ? "up" : "down"; break;
      case "gmul": t = tr("Progresión ×{v}", {v: dec(v, 2)}); cls = v >= 1 ? "up" : "down"; break;
      case "sal": t = tr("Sueldo ×{v}", {v: dec(v, 2)}); cls = v >= 1 ? "up" : "down"; break;
      case "pos": t = tr("Nueva posición: {pos}", {pos: posAb(ex)}); break;
      case "coachSet": t = tr("Relación con el míster: {v}", {v: v}); break;
      case "injMul": t = tr("Riesgo de lesión {v} %", {v: (v < 1 ? "−" : "+") + Math.round(Math.abs(1 - v) * 100)}); cls = v < 1 ? "up" : "down"; break;
      case "note": t = ex; cls = "note"; break;
      case "goal": t = ex + (v > 1 ? " ×" + v : ""); cls = "up"; break;
      case "concede": t = tr("Gol rival") + (v > 1 ? " ×" + v : ""); cls = "down"; break;
      case "save": t = tr("Parada"); cls = "up"; break;
      case "red": t = ex ? tr("Roja para {name}", {name: ex}) : typeof v === "number" ? tr("Roja: {games}", {games: trn(v, "{n} partido", "{n} partidos")}) : tr("Roja"); cls = "down"; break;
      case "yellow": t = tr("Amarilla"); cls = "down"; break;
      case "rt": t = tr("Nota {v}", {v: sgn(v)}); cls = v >= 0 ? "up" : "down"; break;
      case "pmor": t = tr("Moral de {name} {v}", {name: ex, v: sgn(v)}); cls = v >= 0 ? "up" : "down"; break;
      case "pinj": t = ex ? tr("{name}: lesión {range} sem.", {name: ex, range: Array.isArray(v) ? v[0] + "–" + v[1] : v}) : tr("lesión {range} sem.", {range: Array.isArray(v) ? v[0] + "–" + v[1] : v}); cls = "down"; break;
      case "psus": t = ex ? trn(v, "{name}: sanción {n} partido", "{name}: sanción {n} partidos", {name: ex}) : trn(v, "sanción {n} partido", "sanción {n} partidos"); cls = "down"; break;
      case "prole": t = ex; break;
      case "povr": t = ex ? tr("{name}: media {v}", {name: ex, v: sgn(v)}) : tr("media {v}", {v: sgn(v)}); cls = v >= 0 ? "up" : "down"; break;
      case "youth": t = trn(v, "+{n} canterano", "+{n} canteranos"); cls = "up"; break;
      case "wcap": t = tr("Tope salarial ×{v}", {v: dec(v, 2)}); cls = v >= 1 ? "up" : "down"; break;
      default: if (!v) return ""; t = sgn(Math.round(v * 10) / 10) + " " + (FX_LABEL[k] || (MCHIP[k] ? tr(MCHIP[k]) : k)); cls = v >= 0 ? "up" : "down";
    }
    return '<span class="chip ' + cls + '">' + h(t) + "</span>";
  }
  function resTag(c) {
    if (c.good == null) return "";
    return '<span class="eyebrow ' + (c.good ? "pos" : "neg") + '">' + (c.good ? tr("Salió bien") : tr("Salió mal")) + (c.pct != null ? " · " + c.pct + " %" : "") + "</span>";
  }
  /* novedades: la última, completa; las anteriores, en filas que se abren al tocarlas */
  var FEED_IC = {decision: "💬", moment: "⚽", block: "📅", transfer: "✍️", season: "🏁", seasonEnd: "🏆", summer: "☀️", awards: "🏅", mstart: "📋", mfound: "🏟️", mjob: "🤝", mseason: "🏁", mblock: "📅", mseasonEnd: "🏆", msacked: "🚪", mtransfer: "🔁", mretire: "👋", retire: "👋"};
  function feedRow(c) {
    var html = feedCard(c), m = /<h3[^>]*>([\s\S]*?)<\/h3>/.exec(html), tg = /<span class="tag[^"]*">([\s\S]*?)<\/span>/.exec(html);
    var title = m ? m[1].replace(/<[^>]+>/g, "").trim() : "", sub = tg ? tg[1].replace(/<[^>]+>/g, "").trim() : "";
    if (!title) return feedCardSw(c);
    var good = c.good === true ? " g" : c.good === false ? " b" : "";
    return '<details class="frow sw' + good + '"' + (c.id != null ? ' data-fid="' + h(String(c.id)) + '"' : "") + '><summary><span class="fic" aria-hidden="true">' + (FEED_IC[c.t] || "•") + '</span><span class="ftx"><b>' + title + "</b>" + (sub ? "<small>" + sub + "</small>" : "") + '</span><span class="chev" aria-hidden="true">›</span></summary><div class="frowb">' + html + "</div></details>";
  }
  function newsList() {
    var l = S.feed.filter(function (c) { return !c.hid; });
    if (!l.length) return "";
    return '<h3 class="sech">' + tr("Novedades") + '</h3><p class="sechint">' + tr("Toca para abrir · desliza a la derecha para quitar") + "</p>" + l.map(function (c, i) { return i === 0 || c.id === UI.flash ? feedCardSw(c) : feedRow(c); }).join("");
  }
  /* tarjetas del muro: se pueden descartar deslizando a la derecha */
  function feedCardSw(c) {
    var o = feedCard(c);
    return c && c.id != null ? o.replace(/^<article class="/, '<article data-fid="' + h(String(c.id)) + '" class="sw ') : o;
  }
  function feedCard(c) {
    var fl = UI.flash === c.id ? " flash" : "";
    switch (c.t) {
      case "decision":
        var tg = c.tipo === "mgr" ? "real" : c.tipo === "real" ? "real" : "rand", tl = c.tipo === "mgr" ? tr("Banquillo") : c.tipo === "real" ? tr("Decisión") : tr("Imprevisto");
        return '<article class="card' + fl + '"><div class="head"><span class="tag ' + tg + '">' + tl + "</span>" + (c.good != null ? resTag(c) : '<span class="eyebrow">' + h(c.cat || "") + "</span>") + "</div>" +
          "<h3>" + h(c.title) + '</h3><p class="lead"><b>' + h(c.choice) + ".</b> " + h(c.txt) + '</p><div class="chips">' + (c.chips || []).map(chip).join("") + "</div></article>";
      case "moment":
        return '<article class="card' + fl + '"><div class="head"><span class="tag hot">' + (c.tipo === "mgr" ? tr("Desde la banda") : tr("Momento clave")) + "</span>" + (c.good != null ? resTag(c) : "") + "</div>" +
          "<h3>" + h(c.title) + '</h3><div class="muted" style="font-size:13px;margin-top:4px">' + h(c.ctx || "") + '</div><p class="lead"><b>' + h(c.choice) + ".</b> " + h(c.txt) + "</p>" + (c.fin ? finBox(c.fin) : "") +
          (c.chips && c.chips.length ? '<div class="chips">' + c.chips.map(chip).join("") + "</div>" : "") + "</article>";
      case "block": return blockCard(c, fl);
      case "transfer":
        return '<article class="card' + fl + '"><div class="head"><span class="tag real">' + (c.loan ? tr("Cesión") : tr("Fichaje")) + '</span><span class="eyebrow">' + seasonLabel(c.y) + "</span></div>" +
          '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">' + crest(c.from, true) + '<span class="muted">→</span>' + crest(c.to, true) + "<h3>" + h(clubName(c.to)) + "</h3></div>" +
          '<div class="statline"><div class="stat"><b>' + (c.loan ? "—" : c.fee ? fmtMoney(c.fee) : tr("Libre")) + "</b><span>" + tr("Traspaso") + "</span></div><div class=\"stat\"><b>" + fmtMoney(c.sal) + "</b><span>" + tr("Sueldo/año") + "</span></div><div class=\"stat\"><b>" + (c.loan ? 1 : c.yrs) + "</b><span>" + tr("Años") + "</span></div></div>" +
          '<p class="lead">' + tr("Llegas como {role} a {lg}.", {role: h(lc(tr(String(c.role)))), lg: h(lgName(S.cl[c.to]))}) + "</p></article>";
      case "season":
        return '<article class="card' + fl + '"><div class="head"><span class="tag">' + tr("Arranca la temporada") + '</span><span class="eyebrow">' + seasonLabel(c.y) + '</span></div><div style="display:flex;align-items:center;gap:10px">' + crest(c.club, true) +
          '<div style="min-width:0"><h3>' + h(clubName(c.club)) + '</h3><div class="muted" style="font-size:13px">' + h(lgName(c.lg)) + " · " + h(tr(c.role)) + " · " + tr("media {n}", {n: c.ovr}) + " · " + trn(c.age, "{n} año", "{n} años") + "</div></div></div></article>";
      case "seasonEnd": return seasonEndCard(c, fl);
      case "summer": return summerCard(c, fl);
      case "awards": return awardsCard(c, fl);
      case "retire": case "mretire": return "";
      case "mstart":
        return '<article class="card' + fl + '"><div class="head"><span class="tag real">' + tr("Nueva etapa") + '</span><span class="eyebrow">' + seasonLabel(c.y) + '</span></div><h3>' + tr("Del césped al banquillo") + '</h3><p class="lead">' + tr("Te sacas el título de entrenador. Empiezas con {rep} de prestigio: cuanto más ganes, más grandes serán los clubes que te llamen.", {rep: c.rep}) + "</p></article>";
      case "mfound":
        return '<article class="card' + fl + '"><div class="head"><span class="tag real">' + tr("Club propio") + '</span><span class="eyebrow">' + seasonLabel(c.y) + '</span></div><div style="display:flex;align-items:center;gap:10px">' + crest(c.club, true) +
          '<div style="min-width:0"><h3>' + tr("Nace el {c}", {c: h(clubName(c.club))}) + '</h3><div class="muted" style="font-size:13px">' + h(lgName(c.lg)) + " · " + tr("nivel {n}", {n: c.r}) + " · " + tr("presupuesto {m}", {m: fmtMoney(c.bud)}) + " · " + h(tr(DIFFS[c.diff] || "")) + '</div></div></div><p class="lead" style="margin:10px 0 0">' + tr("Eres el dueño y el entrenador: nadie puede despedirte, pero el dinero y la plantilla dependen de tus resultados.") + "</p></article>";
      case "mjob":
        return '<article class="card' + fl + '"><div class="head"><span class="tag real">' + (c.mid ? tr("Nuevo banquillo") : tr("Presentación")) + '</span><span class="eyebrow">' + seasonLabel(c.y) + '</span></div><div style="display:flex;align-items:center;gap:10px">' + crest(c.club, true) +
          '<div style="min-width:0"><h3>' + tr("Entrenador del {club}", {club: h(clubName(c.club))}) + '</h3><div class="muted" style="font-size:13px">' + h(lgName(c.lg)) + " · " + tr("nivel {n}", {n: c.r}) + " · " + tr("presupuesto {m}", {m: fmtMoney(c.bud)}) + "</div></div></div></article>";
      case "mseason":
        return '<article class="card' + fl + '"><div class="head"><span class="tag">' + tr("Arranca la temporada") + '</span><span class="eyebrow">' + seasonLabel(c.y) + '</span></div><div style="display:flex;align-items:center;gap:10px">' + crest(c.club, true) +
          '<div style="min-width:0"><h3>' + h(clubName(c.club)) + '</h3><div class="muted" style="font-size:13px">' + h(lgName(c.lg)) + " · " + tr("nivel {n}", {n: c.r}) + " · " + tr("presupuesto {m}", {m: fmtMoney(c.bud)}) + "</div></div></div>" +
          (c.objs && c.objs.length ? '<ul class="news">' + c.objs.map(function (o) { return '<li class="star">' + h(typeof o === "string" ? o : objName(o)) + "</li>"; }).join("") + "</ul>" : "") + "</article>";
      case "mblock": return mBlockCard(c, fl);
      case "mseasonEnd": return mSeasonEndCard(c, fl);
      case "msacked":
        return '<article class="card' + fl + '"><div class="head"><span class="tag hot">' + tr("Destituido") + '</span><span class="eyebrow">' + seasonLabel(c.y) + '</span></div><div style="display:flex;align-items:center;gap:10px">' + crest(c.club, true) +
          '<h3>' + tr("El {club} prescinde de ti", {club: h(clubName(c.club))}) + '</h3></div><p class="lead">' + tr("La directiva ha perdido la confianza ({n}/100). Toca buscar otro banquillo.", {n: c.board}) + '</p></article>';
      case "mtransfer":
        var inn = c.inn, other = inn ? c.from : c.to;
        return '<article class="card' + fl + '"><div class="head"><span class="tag ' + (inn ? "ok" : "") + '">' + (inn ? tr("Fichaje") : tr("Salida")) + '</span><span class="eyebrow">' + seasonLabel(c.y) + "</span></div>" +
          "<h3>" + h(c.n) + '</h3><div class="muted" style="font-size:13px;margin-top:2px">' + h(posAb(c.pos)) + " · " + trn(c.age, "{n} año", "{n} años") + " · " + tr("media {n}", {n: c.ovr}) + "</div>" +
          '<div class="statline"><div class="stat"><b>' + (c.fee ? fmtMoney(c.fee) : tr("Libre")) + "</b><span>" + tr("Traspaso") + "</span></div>" + (inn ? '<div class="stat"><b>' + fmtMoney(c.sal) + '</b><span>' + tr("Sueldo/año") + '</span></div><div class="stat"><b>' + c.yrs + "</b><span>" + tr("Años") + "</span></div>" : "") + "</div>" +
          '<p class="lead">' + (inn ? (other >= 0 ? tr("Llega desde el {club} con rol de {role}.", {club: h(clubName(other)), role: h(lc(ROLES[c.role].n))}) : tr("Llega como agente libre con rol de {role}.", {role: h(lc(ROLES[c.role].n))})) : (c.why ? h(c.why) : tr("Deja el club")) + ".") + "</p></article>";
    }
    return "";
  }
  function matchRow(m) {
    var res = m.gu > m.gt ? "W" : m.gu < m.gt ? "L" : m.p ? (m.p[0] > m.p[1] ? "W" : "L") : "D";
    var rt = m.ro === "nc" ? '<span class="dim">NC</span>' : m.rt != null ? '<span class="' + (m.rt >= 7.5 ? "top" : m.rt < 6 ? "bad" : "") + '">' + dec(m.rt) + "</span>" :
      '<span class="dim">' + ({bench: tr("Banq."), inj: tr("Les."), susp: tr("Sanc.")}[m.ro] || "—") + "</span>";
    var ga = [];
    if (m.g) ga.push(trn(m.g, "{n} gol", "{n} goles"));
    if (m.a) ga.push(tr("{n} asist.", {n: m.a}));
    if (m.red) ga.push(tr("roja"));
    var score = m.gu + "-" + m.gt + (m.p ? " (" + m.p[0] + "-" + m.p[1] + ")" : m.et ? "*" : "");
    return '<div class="m' + (m.ro === "nc" ? " nc" : "") + '"><div class="cmp">' + h(trComp(m.c)) + (m.r ? "<br>" + h(tr(m.r)) : "") + '</div><div class="opp">' + (m.h ? "" : '<span class="dim">@</span>') + team(m.nat, m.o) +
      '</div><div><span class="res ' + res + '">' + score + "</span>" + (ga.length ? '<span class="ga">' + ga.join(" · ") + "</span>" : "") + '</div><div class="rt">' + rt + "</div></div>";
  }
  function mMatchRow(m) {
    var res = m.gu > m.gt ? "W" : m.gu < m.gt ? "L" : m.p ? (m.p[0] > m.p[1] ? "W" : "L") : "D";
    var score = m.gu + "-" + m.gt + (m.p ? " (" + m.p[0] + "-" + m.p[1] + ")" : m.et ? "*" : "");
    return '<div class="m mm"><div class="cmp">' + h(trComp(m.c)) + (m.r ? "<br>" + h(tr(m.r)) : "") + '</div><div class="opp">' + (m.h ? "" : '<span class="dim">@</span>') + team(0, m.o) +
      '</div><div><span class="res ' + res + '">' + score + "</span>" + (m.sc && m.sc.length ? '<span class="ga">' + h(m.sc.join(", ")) + "</span>" : "") + "</div></div>";
  }
  function blockCard(c, fl) {
    var W_ = 0, D = 0, L = 0, g = 0, a = 0;
    c.log.forEach(function (m) { if (m.ro === "nc") return; if (m.gu > m.gt) W_++; else if (m.gu < m.gt) L++; else D++; g += m.g || 0; a += m.a || 0; });
    var avg = c.st.rn ? dec(c.st.rs / c.st.rn) : "—", d = Math.round(c.ovr1) - Math.round(c.ovr0);
    var open = UI.exp[c.id], list = open ? c.log : c.log.slice(0, 6);
    var o = '<article class="card' + fl + '"><div class="head"><span class="tag">' + tr("Tramo {n}/5 · {lab} {year}", {n: c.bi + 1, lab: h(tr(c.lab)), year: c.bi < 2 ? c.y : c.y + 1}) + '</span><span class="eyebrow">' + (c.pos > 0 ? tr("{pos} en liga", {pos: ord(c.pos)}) : "") + "</span></div>";
    o += "<h3>" + tr("{w}V {d}E {l}D", {w: W_, d: D, l: L}) + (c.st.apps ? " · " + trn(g, "{n} gol", "{n} goles") + " · " + tr("{n} asist.", {n: a}) : " · " + tr("sin minutos")) + "</h3>";
    o += '<div class="statline"><div class="stat"><b>' + c.st.apps + '</b><span>' + tr("Partidos") + '</span></div><div class="stat"><b>' + avg + '</b><span>' + tr("Nota") + '</span></div><div class="stat"><b>' + Math.round(c.ovr1) + '</b><span>' + tr("Media") + ' ' + (d ? '<em class="' + (d > 0 ? "pos" : "neg") + '" style="font-style:normal">' + sgn(d) + "</em>" : "") + "</span></div></div>";
    if (c.log.length) o += '<div class="matches">' + list.map(matchRow).join("") + "</div>";
    if (c.log.length > 6) o += '<button class="more" data-a="more" data-id="' + c.id + '">' + (open ? tr("Ver menos") : tr("Ver los {n} partidos", {n: c.log.length})) + "</button>";
    if (c.news && c.news.length) o += '<ul class="news">' + c.news.map(function (n) { return '<li class="' + n.t + '">' + h(n.x) + "</li>"; }).join("") + "</ul>";
    return o + "</article>";
  }
  function mBlockCard(c, fl) {
    var open = UI.exp[c.id], list = open ? c.log : c.log.slice(0, 6), st = c.st;
    var o = '<article class="card' + fl + '"><div class="head"><span class="tag">' + tr("Tramo {n}/5 · {lab} {year}", {n: c.bi + 1, lab: h(tr(c.lab)), year: c.bi < 2 ? c.y : c.y + 1}) + '</span><span class="eyebrow">' + (c.pos > 0 ? tr("{pos} en liga", {pos: ord(c.pos)}) : "") + "</span></div>";
    o += "<h3>" + tr("{w}V {d}E {l}D", {w: st.w, d: st.d, l: st.l}) + " · " + st.gf + ":" + st.ga + "</h3>";
    o += '<div class="statline"><div class="stat"><b>' + c.board + '</b><span>' + tr("Directiva") + '</span></div><div class="stat"><b>' + c.fans + '</b><span>' + tr("Afición") + '</span></div><div class="stat"><b>' + (st.w * 3 + st.d) + "</b><span>" + tr("Puntos") + "</span></div></div>";
    if (c.log.length) o += '<div class="matches">' + list.map(mMatchRow).join("") + "</div>";
    if (c.log.length > 6) o += '<button class="more" data-a="more" data-id="' + c.id + '">' + (open ? tr("Ver menos") : tr("Ver los {n} partidos", {n: c.log.length})) + "</button>";
    if (c.news && c.news.length) o += '<ul class="news">' + c.news.map(function (n) { return '<li class="' + n.t + '">' + h(n.x) + "</li>"; }).join("") + "</ul>";
    return o + "</article>";
  }
  function seasonEndCard(c, fl) {
    var r = c.row, champ = c.pos === 1;
    var o = '<article class="card' + fl + '"><div class="head"><span class="tag ' + (champ ? "real" : "") + '">' + tr("Balance {season}", {season: seasonLabel(c.y)}) + '</span><span class="eyebrow">' + h(clubName(c.club)) + "</span></div>";
    o += "<h3>" + (champ ? tr("¡Campeón de {lg}!", {lg: h(lgName(c.lg))}) : tr("{pos} en {lg}", {pos: ord(c.pos), lg: h(lgName(c.lg))})) + "</h3>";
    var gkRow = r.gc != null && W.pos[S.p.pos] && W.pos[S.p.pos].g === "POR";
    o += '<div class="statline"><div class="stat"><b>' + r.apps + '</b><span>' + tr("Partidos") + '</span></div>' + (gkRow
      ? '<div class="stat"><b>' + r.cs + '</b><span>' + tr("Port. a cero") + '</span></div><div class="stat"><b>' + r.gc + '</b><span>' + tr("Encajados") + '</span></div>'
      : '<div class="stat"><b>' + r.g + '</b><span>' + tr("Goles") + '</span></div><div class="stat"><b>' + r.a + '</b><span>' + tr("Asist.") + '</span></div>') + '<div class="stat"><b>' + (r.rt ? dec(r.rt) : "—") + '</b><span>' + tr("Nota") + '</span></div><div class="stat"><b>' + r.ovr1 + '</b><span>' + tr("Media") + '</span></div></div>';
    if (gkRow && r.apps) o += '<p class="muted" style="font-size:13px;margin:8px 0 0">' + tr("{cs} porterías a cero y {gc} goles encajados ({avg} por partido).", {cs: r.cs, gc: r.gc, avg: fmtDec(r.gc / Math.max(1, r.apps), 2)}) + "</p>";
    if (c.objs && c.objs.length) o += '<div style="margin-top:10px">' + c.objs.map(function (ob) { return '<div class="obj"><div><span>' + h(objName(ob)) + '</span><span class="' + (ob.met ? "pos" : "neg") + '">' + (ob.met ? tr("Cumplido") : tr("No cumplido")) + "</span></div></div>"; }).join("") + "</div>";
    var tro = S.p.trophies.filter(function (t) { return t.s === seasonLabel(c.y); });
    if (tro.length) o += '<div class="trorow">' + tro.map(function (t) { return trophySVG(t.k, 44, trComp(t.n)); }).join("") + "</div>";
    var news = (c.news || []).slice();
    (r.tro || []).forEach(function (t) { if (!news.some(function (n) { return n.x.indexOf(t) >= 0; })) news.push({t: "trophy", x: tr("Título: {t}", {t: trComp(t)})}); });
    if (news.length) o += '<ul class="news">' + news.map(function (n) { return '<li class="' + n.t + '">' + h(n.x) + "</li>"; }).join("") + "</ul>";
    return o + "</article>";
  }
  function mSeasonEndCard(c, fl) {
    var r = c.row, champ = c.pos === 1;
    var o = '<article class="card' + fl + '"><div class="head"><span class="tag ' + (champ ? "real" : "") + '">' + tr("Balance {season}", {season: seasonLabel(c.y)}) + '</span><span class="eyebrow">' + h(clubName(c.club)) + "</span></div>";
    o += "<h3>" + (champ ? tr("¡Campeones de {lg}!", {lg: h(lgName(c.lg))}) : tr("{pos} en {lg}", {pos: ord(c.pos), lg: h(lgName(c.lg))})) + "</h3>";
    o += '<div class="statline"><div class="stat"><b>' + r.w + "</b><span>" + tr("Victorias") + '</span></div><div class="stat"><b>' + r.d + "</b><span>" + tr("Empates") + '</span></div><div class="stat"><b>' + r.l + "</b><span>" + tr("Derrotas") + '</span></div><div class="stat"><b>' + r.gf + ":" + r.ga + "</b><span>" + tr("Goles") + '</span></div><div class="stat"><b>' + c.board + "</b><span>" + tr("Directiva") + "</span></div></div>";
    if (c.objs && c.objs.length) o += '<div style="margin-top:10px">' + c.objs.map(function (ob) { return '<div class="obj"><div><span>' + h(objName(ob)) + '</span><span class="' + (ob.met ? "pos" : "neg") + '">' + (ob.met ? tr("Cumplido") : tr("No cumplido")) + "</span></div></div>"; }).join("") + "</div>";
    var tro = S.m.trophies.filter(function (t) { return t.s === seasonLabel(c.y); });
    if (tro.length) o += '<div class="trorow">' + tro.map(function (t) { return trophySVG(t.k, 44, trComp(t.n)); }).join("") + "</div>";
    if (c.news && c.news.length) o += '<ul class="news">' + c.news.map(function (n) { return '<li class="' + n.t + '">' + h(n.x) + "</li>"; }).join("") + "</ul>";
    return o + "</article>";
  }
  function summerCard(c, fl) {
    var o = '<article class="card' + fl + '"><div class="head"><span class="tag">' + tr("Verano {year}", {year: c.y}) + "</span></div>";
    o += "<h3>" + (c.tour ? h(trComp(c.tour.n)) : tr("Torneos de verano")) + "</h3>";
    if (c.tour && c.tour.apps) o += '<div class="statline"><div class="stat"><b>' + c.tour.apps + "</b><span>" + tr("Partidos") + '</span></div><div class="stat"><b>' + c.tour.g + "</b><span>" + tr("Goles") + '</span></div><div class="stat"><b>' + c.tour.a + "</b><span>" + tr("Asist.") + "</span></div></div>";
    if (c.log && c.log.length) o += '<div class="matches">' + c.log.map(c.mgr ? mMatchRow : matchRow).join("") + "</div>";
    if (c.cards.length) o += '<div class="kvlist" style="margin-top:8px">' + c.cards.map(function (x) {
      return "<div><span>" + h(trComp(x.n)) + (x.mine && x.stage ? " · " + (c.mgr ? tr("tu equipo: {stage}", {stage: h(lcT(tr(x.stage)))}) : tr("tú: {stage}", {stage: h(lcT(tr(x.stage)))})) : "") + "</span><span>" + (x.win >= 0 ? (x.nat ? flag(x.win) + " " + h(natName(x.win)) : h(clubName(x.win))) : "—") + "</span></div>";
    }).join("") + "</div>";
    if (!c.cards.length) o += '<p class="lead">' + tr("Un verano tranquilo, sin grandes torneos.") + "</p>";
    if (c.news && c.news.length) o += '<ul class="news">' + c.news.map(function (n) { return '<li class="' + n.t + '">' + h(n.x) + "</li>"; }).join("") + "</ul>";
    return o + "</article>";
  }
  function awardsCard(c, fl) {
    var o = '<article class="card' + fl + '"><div class="head"><span class="tag real">' + tr("Gala de premios {year}", {year: c.y}) + '</span><span class="eyebrow">' + (c.mgr ? "" : c.pos && c.pos <= 30 ? tr("Tú: {pos}", {pos: ord(c.pos)}) : tr("No nominado")) + "</span></div><h3>" + tr("Balón de Oro {year}", {year: c.y}) + "</h3>";
    o += '<div style="margin-top:8px">' + c.top.map(function (x, i) {
      return '<div class="rank' + (x.me ? " me" : "") + '"><b>' + (i + 1) + "</b><span>" + flag(x.ni) + " " + (x.me ? (c.mgr ? tr("{name} (tu jugador)", {name: h(x.n)}) : tr("{name} (tú)", {name: h(x.n)})) : h(x.n)) + '</span><span class="muted" style="font-size:12px">' + h(clubName(x.club)) + "</span></div>";
    }).join("") + "</div>";
    if (!c.mgr && c.pos > 10 && c.pos <= 30) o += '<div class="rank me"><b>' + c.pos + "</b><span>" + tr("Tú") + "</span><span></span></div>";
    if (c.won && c.won.length) o += '<ul class="news">' + c.won.map(function (a) { return '<li class="' + (a.minor ? "ok" : "trophy") + '">' + h(awardName(a)) + "</li>"; }).join("") + "</ul>";
    return o + "</article>";
  }
  function retireCard() {
    var r = S.retired, p = S.p; if (!r) return "";
    var bdo = p.awards.filter(function (a) { return a.k === "bdo"; }).length;
    return '<section class="card decision"><div class="legacy"><div class="eyebrow">' + tr("Tu legado") + '</div><div class="big num">' + r.lg.sc + "</div><h2>" + h(tr(r.lg.title)) + '</h2><p class="lead" style="margin:8px auto 0">' + tr("{name} se retira a los {age} años. Su club de referencia: {club}.", {name: h(p.fn + " " + p.ln), age: r.age, club: h(clubName(r.main))}) + "</p></div>" +
      '<div class="statline"><div class="stat"><b>' + r.tot.apps + "</b><span>" + tr("Partidos") + '</span></div><div class="stat"><b>' + r.tot.g + "</b><span>" + tr("Goles") + '</span></div><div class="stat"><b>' + r.tot.a + "</b><span>" + tr("Asist.") + '</span></div><div class="stat"><b>' + p.trophies.length + "</b><span>" + tr("Títulos") + '</span></div><div class="stat"><b>' + p.intl.caps + "</b><span>" + tr("Internac.") + '</span></div><div class="stat"><b>' + bdo + "</b><span>" + tr("B. de Oro") + "</span></div></div>" +
      '<div class="ref"><b>' + tr("Tu siguiente paso") + "</b>" + tr("Puedes seguir en el fútbol desde el banquillo: eliges club, fichas, renuevas contratos, decides el once y cuidas la moral del vestuario.") + "</div>" +
      '<div class="opts"><button class="btn pri wide" data-a="startmgr">' + tr("Empezar carrera de entrenador") + '</button><button class="btn wide" data-a="hof">' + tr("Ver el Salón de la fama") + '</button><button class="btn wide" data-a="newcareer">' + tr("Empezar una carrera nueva") + "</button></div></section>";
  }

  /* ---------- pestaña Jugador ---------- */
  function tabJugador() {
    var p = S.p, o = ovrInt(), at = attrs(), ni = p.inat >= 0 ? p.inat : p.nat, est = p.potSeen || potEstimate();
    var s = '<div class="stack"><section class="cromo tier-' + tier(o) + '"><div class="ctop"><div><div class="big num">' + o + '</div><div class="pos">' + h(p.pos) + "</div></div>" + crest(p.club, true) + "</div>";
    s += '<div class="name">' + h(p.fn + " " + p.ln) + '</div><div class="attrs">' + Object.keys(at).map(function (k) { return "<div><b>" + at[k] + "</b>" + h(tr(ATT_NAMES[k])) + "</div>"; }).join("") + "</div>";
    s += '<div class="foot">' + flag(ni) + " " + h(natName(ni)) + " · " + h(posName(p.pos)) + " · " + h(tr(p.foot)) + "</div></section>";
    s += '<section class="card"><div class="head"><h3>' + tr("Estado") + '</h3><span class="eyebrow">' + tr("Potencial {a}–{b}", {a: est[0], b: est[1]}) + "</span></div>";
    s += '<div class="meters big">' + meter(tr("Forma"), p.form, "form") + meter(tr("Moral"), p.mor, "mor") + meter(tr("Físico"), p.fit, "fit") + meter(tr("Profesionalidad"), p.prof, "prof") + meter(tr("Fama"), p.fame, "fame") + meter(tr("Relación con el míster"), p.coach, "coach") + meter(tr("Afición"), p.fans, "fans") + "</div>";
    if (p.buffs.length) s += '<div class="chips">' + p.buffs.map(function (b) { return '<span class="chip ' + (b.v >= 0 ? "up" : "down") + '">' + sgn(b.v) + " " + h(tr(b.n || "efecto")) + " · " + trn(b.b, "{n} tramo", "{n} tramos") + "</span>"; }).join("") + "</div>";
    s += "</section>";
    var inj = p.inj && p.injT > S.tw ? h(tr(p.inj.n)) + " · " + tr("{n} sem.", {n: p.injT - S.tw}) : tr("Disponible");
    var fo = function (k) { return UI.fold && UI.fold[k] ? " open" : ""; };
    s += '<details class="card fold" data-fold="ficha"' + fo("ficha") + '><summary class="head"><h3>' + tr("Ficha") + '</h3><span class="eyebrow">' + (p.con ? tr("{sal}/año", {sal: fmtMoney(p.con.sal)}) : "") + '<span class="fchev" aria-hidden="true">›</span></span></summary><div class="kvlist" style="margin-top:6px">' +
      "<div><span>" + tr("Club") + "</span><span>" + h(clubName(p.club)) + (p.loan ? " " + tr("(cedido por el {club})", {club: h(clubName(p.loan.from))}) : "") + "</span></div>" +
      "<div><span>" + tr("Liga") + "</span><span>" + flag(W.clubs[p.club].ci) + " " + h(lgName(S.cl[p.club])) + "</span></div>" +
      "<div><span>" + tr("Entrenador") + "</span><span>" + h(coachName(p.club)) + "</span></div>" +
      "<div><span>" + tr("Rol en el equipo") + "</span><span>" + h(tr(roleNow())) + " " + tr("(nivel del club {n})", {n: Math.round(S.cr[p.club])}) + "</span></div>" +
      "<div><span>" + tr("Contrato") + "</span><span>" + (p.con ? tr("{sal}/año", {sal: fmtMoney(p.con.sal)}) + " · " + trn(Math.max(0, p.con.yrs), "{n} año", "{n} años") : "—") + "</span></div>" +
      "<div><span>" + tr("Valor de mercado") + "</span><span>" + fmtMoney(marketValue()) + "</span></div>" +
      "<div><span>" + tr("Dinero") + "</span><span>" + fmtMoney(p.money) + "</span></div>" +
      "<div><span>" + tr("Seguidores") + "</span><span>" + fmtFol(p.fol) + "</span></div>" +
      "<div><span>" + tr("Agente") + "</span><span>" + [tr("Sin agente"), tr("Familiar (5 %)"), tr("Agencia de estrellas (10 %)")][p.agent] + "</span></div>" +
      "<div><span>" + tr("Edad") + "</span><span>" + tr("{n} años", {n: p.age}) + "</span></div>" +
      "<div><span>" + tr("Estado físico") + "</span><span" + (p.inj && p.injT > S.tw ? ' class="neg"' : "") + ">" + inj + "</span></div>" +
      (p.susp ? "<div><span>" + tr("Sanción") + "</span><span class=\"neg\">" + trn(p.susp, "{n} partido", "{n} partidos") + "</span></div>" : "") +
      (p.flags.captain ? "<div><span>" + tr("Brazalete") + "</span><span>" + tr("Capitán") + "</span></div>" : "") +
      (p.flags.pens ? "<div><span>" + tr("Penaltis") + "</span><span>" + tr("Lanzador oficial") + "</span></div>" : "") +
      "</div></details>";
    if (p.objs.length) s += '<section class="card"><h3>' + tr("Objetivos de la temporada") + '</h3><div style="margin-top:6px">' + p.objs.map(objRow).join("") + "</div></section>";
    var tourTxt = p.intl.tours.length ? p.intl.tours.map(function (t) { return h(trComp(t.n)) + " (" + h(tr(t.st || "")) + ")"; }).join(", ") : tr("Ninguno todavía");
    s += '<details class="card fold" data-fold="selec"' + fo("selec") + '><summary class="head"><h3>' + tr("Selección") + '</h3><span class="eyebrow">' + trn(p.intl.caps, "{n} partido", "{n} partidos") + '<span class="fchev" aria-hidden="true">›</span></span></summary><div class="kvlist" style="margin-top:6px">' +
      "<div><span>" + tr("Selección") + "</span><span>" + (p.inat >= 0 ? flag(p.inat) + " " + h(natName(p.inat)) : tr("Por decidir: {a} o {b}", {a: flag(p.nat), b: flag(p.nat2)})) + "</span></div>" +
      "<div><span>" + tr("Nivel de la selección") + "</span><span>" + Math.round(S.nr[ni]) + "</span></div>" +
      "<div><span>" + tr("Internacionalidades") + "</span><span>" + trn(p.intl.caps, "{n} partido", "{n} partidos") + " · " + trn(p.intl.g, "{n} gol", "{n} goles") + "</span></div>" +
      "<div><span>" + tr("Debut") + "</span><span>" + (p.intl.debut ? p.intl.debut : tr("Pendiente")) + "</span></div>" +
      "<div><span>" + tr("Torneos") + "</span><span>" + tourTxt + "</span></div></div></details>";
    return s + "</div>";
  }

  /* ---------- pestaña Competición ---------- */
  function leagueTable(li, highlight) {
    var st = standings(li), L = W.lg[li], n = st.length, euro = L.eu ? L.eu[0] + L.eu[1] + L.eu[2] : L.sa ? L.sa[0] + L.sa[1] : L.cc || L.afc || L.caf || 0;
    var ucl = L.eu ? L.eu[0] : L.sa ? L.sa[0] : euro;
    var up = L.upI >= 0 ? lgUpN(li) : 0, down = L.downI >= 0 ? L.rel : 0;
    var o = '<div class="tablewrap"><table><thead><tr><th>#</th><th>' + tr("Club") + '</th><th>' + tr("PJ") + '</th><th>' + tr("DG") + '</th><th>' + tr("Pts") + '</th></tr></thead><tbody>';
    st.forEach(function (x, i) {
      var z = i < up ? "z2" : i < ucl && !up ? "z1" : i < euro && !up ? "z2" : i >= n - down ? "z3" : "";
      var r = x.r;
      o += "<tr" + (x.c === highlight ? ' class="me"' : "") + '><td class="' + z + '">' + (i + 1) + '</td><td class="club"><div class="cl">' + crest(x.c) + "<span>" + h(clubName(x.c)) + "</span></div></td><td>" + r[0] + "</td><td>" + (r[4] - r[5] > 0 ? "+" : "") + (r[4] - r[5]) + "</td><td><b>" + r[6] + "</b></td></tr>";
    });
    o += "</tbody></table></div>";
    var leg = [];
    if (up) leg.push('<span><i style="background:var(--grass)"></i>' + tr("Ascenso") + "</span>");
    else if (ucl) { leg.push('<span><i style="background:var(--sky)"></i>' + (L.eu ? tr("Champions") : L.sa ? tr("Libertadores") : tr("Torneo continental")) + "</span>"); if (euro > ucl) leg.push('<span><i style="background:var(--grass)"></i>' + (L.eu ? tr("Europa / Conference") : L.sa ? tr("Sudamericana") : "") + "</span>"); }
    if (down) leg.push('<span><i style="background:var(--red)"></i>' + tr("Descenso") + "</span>");
    return o + (leg.length ? '<div class="legend">' + leg.join("") + "</div>" : "");
  }
  function involved(c) {
    if (!c || c.typ === "lite" || c.typ === "nq") return false;
    var me = myClub(), mn = myNat();
    if (c.nat) return mn >= 0 && c.teams && c.teams.indexOf(mn) >= 0 && (c.squad || c.k === "NL" || c.k === "NLB");
    if (me < 0) return false;
    if (c.teams && c.teams.indexOf(me) >= 0) return true;
    var inv = false;
    if (c.ko) c.ko.r.forEach(function (rd) { rd.ties.forEach(function (t) { if (t.a === me || t.b === me) inv = true; }); });
    return inv;
  }
  function compBox(c) {
    var me = c.nat ? myNat() : myClub(), nat = !!c.nat, o = '<section class="card"><div class="head"><h3>' + h(trComp(c.n)) + '</h3><span class="eyebrow">' + h(tr(c.sub || "")) + "</span></div>";
    if (c.win >= 0 && c.done) o += '<p class="lead">' + (c.win === me ? '<b class="pos">' + tr("¡Campeones!") + "</b>" : tr("Campeón: {team}", {team: team(nat, c.win)})) + "</p>";
    if ((c.typ === "swiss" || c.typ === "grp") && !c.ko) {
      if (c.typ === "swiss") {
        var st = sortTable(c.teams, c.tb, false), pos = st.findIndex(function (x) { return x.c === me; });
        var lo = Math.max(0, Math.min(pos - 3, st.length - 7)), part = st.slice(lo, lo + 7);
        o += '<p class="muted" style="margin:4px 0 6px;font-size:13px">' + tr("Fase de liga: los 8 primeros van a octavos; del 9º al 24º, playoff.") + "</p>" + miniTable(part, lo, me, nat);
      } else {
        var gi = c.g.findIndex(function (g) { return g.indexOf(me) >= 0; });
        if (gi >= 0) o += '<p class="muted" style="margin:4px 0 6px;font-size:13px">' + (c.sub ? h(tr(c.sub)) : tr("Grupo {g}", {g: String.fromCharCode(65 + gi)})) + "</p>" + miniTable(sortTable(c.g[gi], c.gt[gi], nat), 0, me, nat);
      }
    }
    if (c.ko) {
      var rows = [];
      c.ko.r.forEach(function (rd) {
        rd.ties.forEach(function (t) {
          if (t.a !== me && t.b !== me) return;
          if (t.b < 0) { rows.push("<div><span>" + h(tr(rd.n)) + "</span><span>" + tr("Exento") + "</span></div>"); return; }
          var opp = t.a === me ? t.b : t.a, us = t.a === me ? 0 : 1, sc = t.s.map(function (s) { return s[us] + "-" + s[1 - us]; }).join(" / ");
          var stt = t.w < 0 ? (sc || tr("Por jugar")) : (t.w === me ? '<b class="pos">' + sc + (t.p ? " " + tr("(pen.)") : "") + "</b>" : '<b class="neg">' + sc + (t.p ? " " + tr("(pen.)") : "") + "</b>");
          rows.push("<div><span>" + h(tr(rd.n)) + " · " + team(nat, opp) + "</span><span>" + stt + "</span></div>");
        });
      });
      if (!rows.length && c.ko.ri < c.ko.r.length) rows.push("<div><span>" + tr("Siguiente ronda") + "</span><span>" + h(tr(c.ko.r[c.ko.ri].n)) + "</span></div>");
      o += '<div class="kvlist">' + rows.join("") + "</div>";
    }
    return o + "</section>";
  }
  function miniTable(rows, off, me, nat) {
    return '<div class="tablewrap"><table><thead><tr><th>#</th><th>' + tr("Equipo") + '</th><th>' + tr("PJ") + '</th><th>' + tr("DG") + '</th><th>' + tr("Pts") + '</th></tr></thead><tbody>' + rows.map(function (x, i) {
      var r = x.r; return "<tr" + (x.c === me ? ' class="me"' : "") + "><td>" + (off + i + 1) + '</td><td class="club"><div class="cl">' + team(nat, x.c) + "</div></td><td>" + r[0] + "</td><td>" + (r[4] - r[5]) + "</td><td><b>" + r[6] + "</b></td></tr>";
    }).join("") + "</tbody></table></div>";
  }
  function curLeague() {
    var off = ["post", "sblk", "awards", "off", "ret", "mjob"].indexOf(S.ph) >= 0;
    if (isMgr()) {
      var m = S.m, last = m.seasons.length ? m.seasons[m.seasons.length - 1].lg : null;
      if ((off || m.club < 0) && last != null) return last;
      return m.club >= 0 ? S.cl[m.club] : (last != null ? last : W.lgIdx.ESP1);
    }
    var p = S.p;
    if (off && p.seasons.length) return p.seasons[p.seasons.length - 1].lg;
    return S.cl[p.club];
  }
  function leagueSelect(id, sel) {
    var s = '<select id="' + id + '">';
    W.confs.forEach(function (cf) {
      var ls = W.lg.map(function (l, i) { return i; }).filter(function (i) { return W.lg[i].conf === cf; });
      if (ls.length) s += '<optgroup label="' + h(tr(cf)) + '">' + ls.map(function (i) { return '<option value="' + i + '"' + (i === sel ? " selected" : "") + ">" + W.ctry[W.lg[i].ci].flag + " " + h(lgName(i)) + "</option>"; }).join("") + "</optgroup>";
    });
    return s + "</select>";
  }
  function tabComp() {
    var li = curLeague(), me = myClub(), seg = UIX.cupsView && S.C ? '<div class="seg compseg"><button data-a="compseg" data-v="lg" aria-pressed="' + (UI.compSeg !== "cup") + '">' + tr("Liga") + '</button><button data-a="compseg" data-v="cup" aria-pressed="' + (UI.compSeg === "cup") + '">' + tr("Copas y torneos") + "</button></div>" : "";
    if (seg && UI.compSeg === "cup") return '<div class="stack">' + seg + UIX.cupsView() + "</div>";
    var s = '<div class="stack">' + seg + '<section class="card"><div class="head"><h3>' + flag(W.lg[li].ci) + " " + h(lgName(li)) + '</h3><span class="eyebrow">' + tr("Jornada {a}/{b}", {a: Math.min(S.L[li].md, S.L[li].N), b: S.L[li].N}) + "</span></div>" + leagueTable(li, me) + "</section>";
    var keys = Object.keys(S.C).filter(function (k) { return involved(S.C[k]); });
    keys.sort(function (a, b) { return (S.C[b].lvl || 0) - (S.C[a].lvl || 0); });
    keys.forEach(function (k) { s += compBox(S.C[k]); });
    if (!isMgr() && S.q) {
      var qk = Object.keys(S.q).filter(function (k) { return S.q[k].gp; });
      if (qk.length) s += '<section class="card"><h3>' + tr("Clasificación con tu selección") + '</h3><div class="kvlist" style="margin-top:6px">' + qk.map(function (k) { var q = S.q[k]; return "<div><span>" + h(k.replace(/(\D+)(\d+)/, function (_, a, b) { return tr({WC: "Mundial", EURO: "Eurocopa", AFCON: "Copa África", ASIAN: "Copa Asiática", GOLD: "Copa Oro", OFCN: "Copa OFC"}[a] || a) + " " + b; })) + "</span><span>" + tr("{pts} pts en {gp} partidos ({gf}-{ga})", {pts: q.pts, gp: q.gp, gf: q.gf, ga: q.ga}) + "</span></div>"; }).join("") + "</div></section>";
    }
    if (isMgr()) {
      if (UI.wl == null) UI.wl = li;
      s += '<section class="card"><label class="lbl" for="wl">' + tr("Todas las ligas") + '</label>' + leagueSelect("wl", UI.wl) + '<div style="margin-top:10px">' + leagueTable(UI.wl, me) + "</div></section>";
      s += palmaresCard();
    }
    return s + "</div>";
  }
  function palmaresCard() {
    var comps = [["UCL", N_("Champions League"), 0], ["LIB", N_("Copa Libertadores"), 0], ["UEL", N_("Europa League"), 0], ["CWC", N_("Mundial de Clubes"), 0], ["WC", N_("Mundial"), 1], ["EURO", N_("Eurocopa"), 1], ["CA", N_("Copa América"), 1], ["AFCON", N_("Copa África"), 1]];
    var rows = comps.map(function (c) {
      var hs = S.hist[c[0]]; if (!hs || !hs.length) return "";
      var last = hs.slice(-3).reverse();
      return "<div><span>" + h(tr(c[1])) + "</span><span>" + last.map(function (x) { return x[0] + " " + (c[2] ? flag(x[1]) : h(clubName(x[1]))); }).join(" · ") + "</span></div>";
    }).join("");
    var bdo = (S.hist.BDO || []).slice(-6).reverse().map(function (x) { var a = String(x[2] || "").split("|"); return "<div><span>" + tr("Balón de Oro {year}", {year: x[0]}) + "</span><span>" + flag(+a[1]) + " " + h(a[0]) + (a[3] ? " " + tr("(tú)") : "") + "</span></div>"; }).join("");
    return '<section class="card"><h3>' + tr("Palmarés reciente") + '</h3>' + (rows || bdo ? '<div class="kvlist" style="margin-top:6px">' + rows + bdo + "</div>" : '<p class="empty">' + tr("Los campeones aparecerán al terminar la primera temporada.") + "</p>") + "</section>";
  }

  /* ---------- vitrina ---------- */
  function vitrina(list, emptyTxt) {
    var grp = {};
    list.forEach(function (t) { var k = trComp(t.n.replace(/ \d{4}$/, "")); (grp[k] = grp[k] || []).push(t); });
    var keys = Object.keys(grp).sort(function (a, b) { return grp[b][0].w - grp[a][0].w || grp[b].length - grp[a].length; });
    if (!keys.length) return '<p class="empty">' + h(emptyTxt) + "</p>";
    return '<div class="tgrid">' + keys.map(function (k) {
      var l = grp[k];
      return '<div class="tile">' + (l.length > 1 ? '<span class="cnt">×' + l.length + "</span>" : "") + trophySVG(l[0].k, 56, k) + "<b>" + h(k) + "</b><small>" + l.map(function (t) { return t.s || t.y; }).join(", ") + "</small></div>";
    }).join("") + "</div>";
  }
  function yearsTxt(ys) {
    var c = {}, order = [];
    ys.forEach(function (y) { if (!c[y]) { c[y] = 0; order.push(y); } c[y]++; });
    return order.map(function (y) { return y + (c[y] > 1 ? " (×" + c[y] + ")" : ""); }).join(", ");
  }
  function awardsGrid(list, emptyTxt) {
    var grp = {};
    list.forEach(function (a) { var k = awardName(a).replace(/ \([^)]*\)$/, "").replace(/ \d{4}$/, "").replace(/ \d{4} \(/, " ("); (grp[a.k + "|" + k] = grp[a.k + "|" + k] || {k: a.k, n: k, ys: []}).ys.push(a.y); });
    var keys = Object.keys(grp);
    if (!keys.length) return '<p class="empty">' + h(emptyTxt) + "</p>";
    return '<div class="tgrid">' + keys.reverse().map(function (k) {
      var a = grp[k];
      return '<div class="tile">' + (a.ys.length > 1 ? '<span class="cnt">×' + a.ys.length + "</span>" : "") + trophySVG(a.k, 52, a.n) + "<b>" + h(a.n) + "</b><small>" + yearsTxt(a.ys) + "</small></div>";
    }).join("") + "</div>";
  }

  /* ---------- pestaña Historial (jugador) ---------- */
  function tabHist() {
    var p = S.p, tot = careerTotals(), lg = S.retired ? S.retired.lg : legacy();
    var s = '<div class="stack"><section class="card"><div class="eyebrow">' + tr("Legado {sc}", {sc: lg.sc}) + " · " + h(tr(lg.title)) + '</div><h3 style="margin-top:4px">' + tr("Tu carrera") + '</h3>' + nickLine(p);
    s += '<div class="statline"><div class="stat"><b>' + tot.seasons + '</b><span>' + tr("Temporadas") + '</span></div><div class="stat"><b>' + tot.apps + '</b><span>' + tr("Partidos") + '</span></div><div class="stat"><b>' + tot.g + '</b><span>' + tr("Goles") + '</span></div><div class="stat"><b>' + tot.a + '</b><span>' + tr("Asist.") + '</span></div><div class="stat"><b>' + p.trophies.length + '</b><span>' + tr("Títulos") + '</span></div><div class="stat"><b>' + p.intl.caps + "</b><span>" + tr("Internac.") + "</span></div></div></section>";
    s += '<section class="card"><h3>' + tr("Vitrina") + '</h3>' + vitrina(p.trophies, tr("Todavía no has levantado ningún título.")) + "</section>";
    s += '<section class="card"><h3>' + tr("Premios individuales") + '</h3>' + awardsGrid(p.awards, tr("Los premios llegarán con las grandes temporadas.")) + "</section>";
    s += playerSeasonsTable(p);
    if (p.tx.length) s += '<section class="card"><h3>' + tr("Fichajes") + '</h3><div class="kvlist" style="margin-top:6px">' + p.tx.slice().reverse().map(function (t) { return "<div><span>" + seasonLabel(t.y) + " · " + h(clubName(t.from)) + " → " + h(clubName(t.to)) + "</span><span>" + (t.loan ? tr("Cesión") : t.fee ? fmtMoney(t.fee) : tr("Libre")) + "</span></div>"; }).join("") + "</div></section>";
    if (p.ms.length) s += '<section class="card"><h3>' + tr("Hitos") + '</h3><div class="kvlist" style="margin-top:6px">' + p.ms.slice().reverse().map(function (m) { return "<div><span>" + h(tr(m.t)) + "</span><span>" + seasonLabel(m.y) + "</span></div>"; }).join("") + "</div></section>";
    return s + "</div>";
  }
  function playerSeasonsTable(p) {
    if (!p.seasons.length) return "";
    var gk = W.pos[p.pos] && W.pos[p.pos].g === "POR";
    var s = '<section class="card"><h3>' + tr("Temporada a temporada") + '</h3><div class="tablewrap" style="margin-top:6px"><table><thead><tr><th>' + tr("Año") + '</th><th>' + tr("Club") + '</th><th>' + tr("PJ") + '</th>' + (gk ? '<th title="' + h(tr("Porterías a cero")) + '">' + tr("PC") + '</th><th title="' + h(tr("Goles encajados")) + '">' + tr("GE") + "</th>" : '<th>' + tr("G") + '</th><th>' + tr("A") + "</th>") + '<th>' + tr("Nota") + '</th><th>' + tr("Med.") + '</th></tr></thead><tbody>';
    p.seasons.slice().reverse().forEach(function (r) {
      s += "<tr><td>" + seasonLabel(r.y) + '</td><td class="club"><div class="cl">' + crest(r.club) + "<span>" + h(clubName(r.club)) + (r.loan ? " " + tr("(c)") : "") + "</span></div></td><td>" + r.apps + "</td><td>" + (gk ? r.cs + "</td><td>" + (r.gc != null ? r.gc : "—") : r.g + "</td><td>" + r.a) + "</td><td>" + (r.rt ? dec(r.rt) : "—") + "</td><td>" + r.ovr1 + "</td></tr>";
    });
    return s + "</tbody></table></div></section>";
  }

  /* ---------- pestaña Mundo ---------- */
  function tabMundo() {
    if (UI.wl == null) UI.wl = curLeague();
    var s = '<div class="stack"><section class="card"><label class="lbl" for="wl">' + tr("Todas las ligas") + '</label>' + leagueSelect("wl", UI.wl);
    s += '<div style="margin-top:10px">' + leagueTable(UI.wl, myClub()) + "</div></section>";
    s += palmaresCard();
    var nr = W.ctry.map(function (c, i) { return i; }).filter(natLive).sort(function (a, b) { return S.nr[b] - S.nr[a]; }).slice(0, 20);
    s += '<section class="card"><h3>' + tr("Ranking de selecciones") + '</h3><div style="margin-top:6px">' + nr.map(function (n, i) {
      return '<div class="rank' + (n === myNat() ? " me" : "") + '"><b>' + (i + 1) + "</b><span>" + flag(n) + " " + h(natName(n)) + '</span><span class="num">' + Math.round(S.nr[n]) + "</span></div>";
    }).join("") + "</div></section>";
    return s + "</div>";
  }

  /* ============ MODO ENTRENADOR ============ */
  function teamForm() { var r = S.m.recent || []; if (!r.length) return 50; var pts = 0; r.forEach(function (x) { pts += x === "W" ? 3 : x === "D" ? 1 : 0; }); return pts / (r.length * 3) * 100; }
  function meterV(lab, v) { v = Math.round(v); return '<div class="meter v"><div class="eyebrow">' + lab + '</div><div class="mrow"><div class="bar"><i class="' + barCls(v) + '" style="width:' + v + '%"></i></div><span class="num">' + v + "</span></div></div>"; }
  function metersRowM() { var m = S.m; return '<div class="meters">' + meterV(tr("Directiva"), m.board) + meterV(tr("Afición"), m.fans) + meterV(tr("Vestuario"), m.club >= 0 ? mAvgMor() : 50) + meterV(tr("Química"), m.chem) + meterV(tr("Forma"), teamForm()) + "</div>"; }
  function tabClub() {
    var m = S.m, s = '<div class="stack">' + ribbon() + statusRow(statusItems());
    cleanPend();
    var x = S.pend[0];
    if (x && !x.ui) s += pendingCard(x);
    if (S.ph === "ret") s += retireCardM();
    else if (!S.pend.length && (S.ph === "pre" || S.ph === "gap") && m.club >= 0) s += aheadCardM();
    s += newsList();
    return s + "</div>";
  }
  function aheadCardM() {
    var m = S.m, li = S.cl[m.club], pos = posInLeague(m.club), inj = mActive().filter(function (p) { return p.inj > S.tw; }).length;
    var win = m.mk.open ? '<span class="tag ok"><span class="dot"></span>' + tr("Mercado abierto") + "</span>" : '<span class="tag ok"><span class="dot"></span>' + tr("Siguiente") + "</span>";
    var o = '<section class="card"><div class="head">' + win + '<span class="eyebrow">' + tr("Nivel {n}", {n: Math.round(mTeamRating(m.xi))}) + "</span></div>";
    o += "<h3>" + (S.ph === "pre" ? tr("Pretemporada en el {club}", {club: h(clubName(m.club))}) : tr("Tramo {n} de 5: {blk}", {n: S.bi + 1, blk: tr(BLOCKS[S.bi][2])})) + "</h3>";
    o += '<p class="lead">' + (S.ph === "pre" ? tr("Revisa el once y la táctica, y aprovecha el mercado de verano antes de empezar.") : (pos > 0 ? tr("{pos} en {lg}.", {pos: ord(pos), lg: h(lgName(li))}) + " " : "") + (inj ? trn(inj, "{n} lesionado.", "{n} lesionados.") : tr("Sin lesionados."))) +
      (m.mk.open ? " " + tr("El mercado cierra cuando empiece el tramo.") : "") + "</p>";
    if (m.objs.length) o += '<div style="margin-top:10px">' + m.objs.map(function (ob) {
      var pr = mgrObjProgress(ob);
      return '<div class="obj"><div><span>' + h(objName(ob)) + objPill(ob) + '</span><span class="num ' + (pr.met ? "pos" : "") + '">' + h(pr.txt) + '</span></div><div class="bar"><i class="' + (pr.met ? "hi" : "mid") + '" style="width:' + Math.round(pr.pct) + '%"></i></div></div>';
    }).join("") + "</div>";
    o += '<div class="row2" style="margin-top:12px"><button class="btn wide" data-a="tab" data-t="plantilla">' + tr("Plantilla y once") + '</button><button class="btn wide" data-a="tab" data-t="mercado">' + (m.mk.open ? tr("Ir al mercado") : tr("Ver el mercado")) + "</button></div>";
    return o + "</section>";
  }
  function retireCardM() {
    var r = S.mretired, m = S.m; if (!r) return "";
    return '<section class="card decision"><div class="legacy"><div class="eyebrow">' + tr("Tu legado en los banquillos") + '</div><div class="big num">' + r.lg.sc + "</div><h2>" + h(tr(r.lg.title)) + '</h2><p class="lead" style="margin:8px auto 0">' + tr("{name} se retira a los {age} años. Su club de referencia: {club}.", {name: h(m.fn + " " + m.ln), age: r.age, club: h(clubName(r.main))}) + "</p></div>" +
      '<div class="statline"><div class="stat"><b>' + m.seasons.length + '</b><span>' + tr("Temporadas") + '</span></div><div class="stat"><b>' + r.tot.n + '</b><span>' + tr("Partidos") + '</span></div><div class="stat"><b>' + r.tot.w + '</b><span>' + tr("Victorias") + '</span></div><div class="stat"><b>' + m.trophies.length + '</b><span>' + tr("Títulos") + '</span></div><div class="stat"><b>' + Math.round(m.peakRep) + "</b><span>" + tr("Prestigio máx.") + "</span></div></div>" +
      '<div class="opts"><button class="btn wide" data-a="hof">' + tr("Ver el Salón de la fama") + "</button></div></section>";
  }
  function plTags(p) {
    var t = "";
    if (p.inj > S.tw) t += '<span class="ptag bad">' + tr("LES") + " " + (p.inj - S.tw) + "</span>";
    if (p.sus > 0) t += '<span class="ptag bad">' + tr("SANC") + "</span>";
    if (p.req) t += '<span class="ptag bad">' + tr("QUIERE SALIR") + "</span>";
    if (p.list) t += '<span class="ptag warn">' + tr("EN VENTA") + "</span>";
    if (p.leaveTo) t += '<span class="ptag warn">' + tr("SE VA") + "</span>";
    if (p.yrs <= 1 && !p.noRenew) t += '<span class="ptag warn">' + tr("RENOVAR") + "</span>";
    if (S.m.cap === p.id) t += '<span class="ptag ok">C</span>';
    return t;
  }
  function squadRow(p, zone) {
    var m = S.m, inXI = m.xi.indexOf(p.id) >= 0, dz = zone === "bench" ? "bp" : zone === "nc" ? "np" : "";
    return '<button class="prow' + (inXI ? " inxi" : "") + '" data-a="pl" data-id="' + p.id + '"' + (zone ? ' data-drag="' + zone + ":" + p.id + '" data-drop="' + dz + ":" + p.id + '"' : "") + '><span class="pp">' + h(posAb(p.pos)) + '</span><span class="pn"><b>' + flag(p.nat) + " " + h(plShort(p)) + plTags(p) + "</b><small>" + tr("{n} años", {n: p.age}) + " · " + h(tr(ROLES[p.role].n)) + " · " + trn(p.yrs, "{n} año", "{n} años") + " · " + fmtMoney(p.sal) + "</small></span>" +
      '<span class="pbars" aria-label="' + h(tr("Físico {f}, moral {m}", {f: Math.round(p.fit), m: Math.round(p.mor)})) + '"><i style="--w:' + Math.round(p.fit) + '%;--c:var(--sky)"></i><i style="--w:' + Math.round(p.mor) + "%;--c:" + (p.mor < 35 ? "var(--red)" : p.mor < 55 ? "var(--led)" : "var(--grass)") + '"></i></span><span class="po">' + Math.round(p.ovr) + "</span></button>";
  }
  function benchChip(p) {
    var out = !mAvail(p);
    return '<button class="bchip' + (out ? " out" : "") + '" data-a="pl" data-id="' + p.id + '" data-drag="bench:' + p.id + '" data-drop="bp:' + p.id + '"><b>' + Math.round(p.ovr) + "</b><span>" + h(p.ln) + "</span><small>" + h(posAb(p.pos)) + (p.inj > S.tw ? " · " + tr("LES") : p.sus > 0 ? " · " + tr("SANC") : "") + "</small></button>";
  }
  var SQ_GROUPS = [[N_("Porteros"), ["POR"]], [N_("Defensas"), ["LD", "DFC", "LI"]], [N_("Centrocampistas"), ["MCD", "MC", "MD", "MI", "MCO"]], [N_("Delanteros"), ["ED", "EI", "DC"]]];
  /* qué aporta respecto a tu titular */
  function mkFitTag(t) {
    if (!t.mk || t.done) return "";
    var r = t.mk.rel;
    if (r >= 0.5) return '<em class="mkfit up">' + tr("Mejora a tu titular (+{n})", {n: Math.round(r)}) + "</em>";
    if (r > -0.5) return '<em class="mkfit eq">' + tr("Nivel de tu titular") + "</em>";
    return '<em class="mkfit pro">' + tr("Recambio con proyección") + "</em>";
  }
  function tabPlantilla() {
    var m = S.m;
    if (m.club < 0) return '<div class="stack"><p class="empty">' + tr("Ahora mismo no diriges a ningún equipo.") + "</p></div>";
    if (!m.bench) m.bench = mBestBench(m.xi);
    var slots = FORMATIONS[m.form], xy = FORM_XY[m.form];
    var s = '<div class="stack">' + xiWarn(false) + '<section class="card"><div class="head"><h3>' + tr("Once titular") + '</h3><span class="eyebrow">' + tr("Nivel {n}", {n: dec(mTeamRating(m.xi))}) + "</span></div>";
    s += '<div class="pitch mpitch" role="group" aria-label="' + h(tr("Once titular")) + '"><div class="box t"></div><div class="box b"></div>' + slots.map(function (sp, i) {
      var p = m.xi[i] != null ? mPl(m.xi[i]) : null, out = p && !mAvail(p), eff = p ? Math.round(p.ovr - posFit(p.pos, sp)) : "—";
      return '<button class="slot' + (out ? " out" : "") + (p && posFit(p.pos, sp) > 3 ? " off" : "") + (p ? "" : " empty") + '" data-a="slot" data-i="' + i + '"' + (p ? ' data-drag="xi:' + i + '"' : "") + ' data-drop="xi:' + i + '" style="left:' + xy[i][0] + "%;top:" + xy[i][1] + '%" aria-label="' + h(posAb(sp) + ": " + (p ? plName(p) : tr("vacío"))) + '"><b>' + eff + "</b><span>" + h(p ? p.ln : tr("Vacío")) + "</span><small>" + h(posAb(sp)) + "</small></button>";
    }).join("") + "</div>";
    var bench = m.bench.map(mPl).filter(Boolean);
    s += '<div class="bhead"><span class="sgroup">' + tr("Banquillo") + '</span><span class="eyebrow">' + bench.length + "/" + BENCH_N + "</span></div>";
    s += '<div class="bstrip" data-drop="bench">' + (bench.length ? bench.map(benchChip).join("") : '<p class="empty" style="margin:0">' + tr("Arrastra aquí a tus suplentes.") + "</p>") + "</div>";
    s += '<p class="muted" style="font-size:12.5px;margin:8px 0 0">' + tr("Mantén pulsado un jugador y arrástralo al campo, al banquillo o a los no convocados; si lo sueltas encima de otro, se cambian. Toca un hueco del campo para elegir de una lista.") + "</p>";
    s += '<div class="row2" style="margin-top:10px"><div><label class="lbl" for="mform">' + tr("Formación") + '</label><select id="mform">' + Object.keys(FORMATIONS).map(function (f) { return '<option value="' + f + '"' + (f === m.form ? " selected" : "") + ">" + f + "</option>"; }).join("") + '</select></div><div><label class="lbl">&nbsp;</label><button class="btn wide" data-a="bestxi">' + tr("Once ideal") + "</button></div></div>";
    s += '<div style="margin-top:10px"><label class="lbl">' + tr("Mentalidad") + '</label><div class="seg">' + MENT_NAMES.map(function (n, i) { return '<button data-a="ment" data-v="' + i + '" aria-pressed="' + (m.ment === i) + '">' + h(tr(n)) + "</button>"; }).join("") + "</div></div>";
    s += '<div style="margin-top:10px"><label class="lbl">' + tr("Rotaciones") + '</label><div class="seg">' + ROT_NAMES.map(function (n, i) { return '<button data-a="rot" data-v="' + i + '" aria-pressed="' + (m.rot === i) + '">' + h(tr(n)) + "</button>"; }).join("") + '</div><p class="muted" style="font-size:12.5px;margin:6px 0 0">' + tr("Más rotación descansa a los cansados en los partidos menores; en los grandes siempre juegan los mejores. Los cambios salen del banquillo.") + "</p></div>";
    s += "</section>";
    var inXI = {}, onB = {};
    m.xi.forEach(function (id) { if (id != null) inXI[id] = 1; });
    m.bench.forEach(function (id) { onB[id] = 1; });
    var nc = mActive().filter(function (p) { return !inXI[p.id] && !onB[p.id]; });
    s += '<section class="card zone" data-drop="nc"><div class="head"><h3>' + tr("No convocados") + '</h3><span class="eyebrow">' + nc.length + "</span></div>";
    SQ_GROUPS.forEach(function (g) {
      var l = nc.filter(function (p) { return g[1].indexOf(p.pos) >= 0; }).sort(function (a, b) { return g[1].indexOf(a.pos) - g[1].indexOf(b.pos) || b.ovr - a.ovr; });
      if (l.length) s += '<div class="sgroup">' + h(tr(g[0])) + "</div>" + l.map(function (p) { return squadRow(p, "nc"); }).join("");
    });
    if (!nc.length) s += '<p class="empty">' + tr("Todos tus jugadores están en el once o en el banquillo.") + "</p>";
    s += '<p class="muted" style="font-size:12px;margin:8px 0 0">' + tr("Barras: físico (azul) y moral.") + " " + tr("Masa salarial: {m} al año.", {m: fmtMoney(mWageBill())}) + "</p></section>";
    var loans = m.sq.filter(function (p) { return p.loanOut; });
    if (loans.length) s += '<section class="card"><h3>' + tr("Cedidos") + '</h3><div class="kvlist" style="margin-top:6px">' + loans.map(function (p) { return "<div><span>" + h(plName(p)) + " (" + h(posAb(p.pos)) + ", " + Math.round(p.ovr) + ")</span><span>" + h(clubName(p.loanOut.club)) + "</span></div>"; }).join("") + "</div></section>";
    return s + "</div>";
  }
  function tabMercado() {
    var m = S.m;
    if (m.club < 0) return '<div class="stack"><p class="empty">' + tr("Sin equipo no hay mercado.") + '</p></div>';
    var open = !!m.mk.open, bill = mWageBill();
    var s = '<div class="stack"><section class="card"><div class="head"><h3>' + tr("Mercado") + '</h3>' + (open ? '<span class="tag ok"><span class="dot"></span>' + tr("Abierto") + " · " + h(tr(m.mk.open)) + "</span>" : '<span class="tag">' + tr("Cerrado") + "</span>") + "</div>";
    s += '<div class="statline"><div class="stat"><b>' + fmtMoney(m.bud) + '</b><span>' + tr("Presupuesto") + '</span></div><div class="stat"><b class="' + (bill > m.wcap ? "neg" : "") + '">' + fmtMoney(bill) + '</b><span>' + tr("Masa salarial") + '</span></div><div class="stat"><b>' + fmtMoney(m.wcap) + "</b><span>" + tr("Tope salarial") + "</span></div></div>";
    s += '<p class="muted" style="font-size:13px;margin:10px 0 0">' + (open ? tr("Ficha jugadores de la lista, vende o cede desde la ficha de cada jugador en Plantilla. El mercado cierra al empezar el siguiente tramo.") : tr("Puedes estudiar la lista, pero solo se ficha en verano (pretemporada) y en invierno (antes del tramo Feb–Mar).")) + "</p></section>";
    var list = (m.mk.list || []).filter(function (t) { return UI.mkF === "ALL" || W.pos[t.pos].g === UI.mkF; });
    s += '<section class="card"><div class="head"><h3>' + tr("Informes de ojeadores") + '</h3><span class="eyebrow">' + trn((m.mk.list || []).length, "{n} jugador", "{n} jugadores") + "</span></div>";
    s += '<div class="seg" style="margin-bottom:6px">' + [[tr("Todos"), "ALL"], ["POR", "POR"], ["DEF", "DEF"], ["MED", "MED"], ["DEL", "DEL"]].map(function (x) { return '<button data-a="mkf" data-v="' + x[1] + '" aria-pressed="' + (UI.mkF === x[1]) + '">' + x[0] + "</button>"; }).join("") + "</div>";
    s += list.length ? list.map(function (t) {
      var st = t.done ? {fichado: tr("Fichado"), rechazado: tr("Negociación rota"), "rechazó": tr("No quiso venir"), descartado: tr("Descartado")}[t.done] || tr("Cerrado") : null;
      var can = open && !t.done && t.ask <= m.bud;
      return '<div class="trow' + (t.done ? " done" : "") + '"><span class="pp">' + h(posAb(t.pos)) + '</span><span class="pn"><b>' + flag(t.nat) + " " + h(t.fn.charAt(0) + ". " + t.ln) + '</b><small>' + tr("{n} años", {n: t.age}) + " · " + (t.club >= 0 ? h(clubName(t.club)) : tr("Sin equipo")) + " · " + tr("pot. {a}–{b}", {a: t.potR[0], b: t.potR[1]}) + "</small><small>" +
        (t.club >= 0 ? tr("Piden {x}", {x: fmtMoney(t.ask)}) : tr("Gratis")) + " · " + tr("{sal}/año", {sal: fmtMoney(t.sal)}) + "</small>" + mkFitTag(t) + "</span><span class=\"po\">" + Math.round(t.ovr) + "</span>" +
        (st ? '<span class="dim" style="font-size:12px">' + st + "</span>" : '<button class="btn sm pri" data-a="mbid" data-id="' + t.id + '"' + (can ? "" : " disabled") + ">" + (t.club >= 0 ? tr("Fichar") : tr("Negociar")) + "</button>") + "</div>";
    }).join("") : '<p class="empty">' + tr("No hay jugadores en esta posición.") + "</p>";
    if (open && !m.mk.ref) s += '<button class="btn wide" style="margin-top:10px" data-a="mscout">' + tr("Pedir otro informe a los ojeadores") + '</button>';
    s += "</section>";
    var tx = (m.tx || []).filter(function (t) { return t.y === S.yr; });
    if (tx.length) s += '<section class="card"><h3>' + tr("Movimientos de la temporada") + '</h3><div class="kvlist" style="margin-top:6px">' + tx.map(function (t) {
      return "<div><span>" + (t.inn ? "↘ " : "↗ ") + h(t.n) + " (" + h(posAb(t.pos)) + ")" + (t.inn ? " · " + (t.from >= 0 ? tr("desde {club}", {club: h(clubName(t.from))}) : tr("desde libre")) : t.to >= 0 ? " · " + tr("al {club}", {club: h(clubName(t.to))}) : "") + "</span><span>" + (t.fee ? fmtMoney(t.fee) : tr("Libre")) + "</span></div>";
    }).join("") + "</div></section>";
    return s + "</div>";
  }
  function tabHistM() {
    var m = S.m, lg = S.mretired ? S.mretired.lg : mgrLegacy(), tot = mgrTotals();
    var s = '<div class="stack"><section class="card"><div class="eyebrow">' + tr("Legado {sc}", {sc: lg.sc}) + " · " + h(tr(lg.title)) + '</div><h3 style="margin-top:4px">' + tr("En los banquillos") + '</h3>' + nickLine(m);
    s += '<div class="statline"><div class="stat"><b>' + m.seasons.length + '</b><span>' + tr("Temporadas") + '</span></div><div class="stat"><b>' + tot.n + '</b><span>' + tr("Partidos") + '</span></div><div class="stat"><b>' + tot.w + '</b><span>' + tr("Victorias") + '</span></div><div class="stat"><b>' + m.trophies.length + '</b><span>' + tr("Títulos") + '</span></div><div class="stat"><b>' + Math.round(m.peakRep) + "</b><span>" + tr("Prestigio máx.") + "</span></div></div></section>";
    s += '<section class="card"><h3>' + tr("Vitrina del entrenador") + '</h3>' + vitrina(m.trophies, tr("Tu primer título como entrenador está por llegar.")) + "</section>";
    if (m.awards.length) s += '<section class="card"><h3>' + tr("Premios") + '</h3>' + awardsGrid(m.awards, "") + "</section>";
    if (m.seasons.length) {
      s += '<section class="card"><h3>' + tr("Temporada a temporada") + '</h3><div class="tablewrap" style="margin-top:6px"><table><thead><tr><th>' + tr("Año") + '</th><th>' + tr("Club") + '</th><th>' + tr("Pos") + '</th><th>' + tr("V-E-D") + '</th><th>' + tr("Tít.") + '</th></tr></thead><tbody>';
      m.seasons.slice().reverse().forEach(function (r) {
        s += "<tr><td>" + seasonLabel(r.y) + '</td><td class="club"><div class="cl">' + crest(r.club) + "<span>" + h(clubName(r.club)) + (r.mid ? " *" : "") + "</span></div></td><td>" + ord(r.pos) + "</td><td>" + r.w + "-" + r.d + "-" + r.l + "</td><td>" + r.tro.length + "</td></tr>";
      });
      s += '</tbody></table></div><p class="muted" style="font-size:12px;margin:6px 0 0">' + tr("* Llegaste a mitad de temporada.") + "</p></section>";
    }
    if (m.spells.length) s += '<section class="card"><h3>' + tr("Clubes dirigidos") + '</h3><div class="kvlist" style="margin-top:6px">' + m.spells.slice().reverse().map(function (sp) {
      return '<div><span><span style="display:inline-flex;align-items:center;gap:6px">' + crest(sp.club) + h(clubName(sp.club)) + "</span> · " + sp.y0 + "–" + (sp.y1 || tr("hoy")) + "</span><span>" + tr("{w}V {d}E {l}D", {w: sp.w, d: sp.d, l: sp.l}) + (sp.tro ? " · " + tr("{n} tít.", {n: sp.tro}) : "") + "</span></div>";
    }).join("") + "</div></section>";
    if (m.alumni.length) s += '<section class="card"><h3>' + tr("Jugadores que dejaron huella") + '</h3><div class="kvlist" style="margin-top:6px">' + m.alumni.slice(0, 20).map(function (a) {
      return "<div><span>" + flag(a.nat) + " " + h(a.n) + " (" + h(posAb(a.pos)) + ") · " + tr("{a} PJ, {g} G", {a: a.apps, g: a.g}) + "</span><span>" + h(tr(a.why)) + "</span></div>";
    }).join("") + "</div></section>";
    var p = S.p, pr = S.retiredP;
    if (p && pr) {
      s += '<section class="card"><div class="eyebrow">' + tr("Como jugador · legado {sc}", {sc: pr.lg.sc}) + " · " + h(tr(pr.lg.title)) + '</div><h3 style="margin-top:4px">' + h(p.fn + " " + p.ln) + "</h3>";
      s += '<div class="statline"><div class="stat"><b>' + pr.tot.apps + '</b><span>' + tr("Partidos") + '</span></div><div class="stat"><b>' + pr.tot.g + '</b><span>' + tr("Goles") + '</span></div><div class="stat"><b>' + p.trophies.length + '</b><span>' + tr("Títulos") + '</span></div><div class="stat"><b>' + p.intl.caps + "</b><span>" + tr("Internac.") + "</span></div></div>";
      s += vitrina(p.trophies, tr("Sin títulos como jugador.")) + "</section>";
    }
    return s + "</div>";
  }

  /* ---------- portada: idioma, menú principal, partidas y modos ---------- */
  function langName(l) { var x = LANGS.filter(function (z) { return z[0] === (l || LANG); })[0]; return x ? x[1] : "Español"; }
  function titleHTML() { return "<h1>" + h(tr("Camino")) + "<em>" + h(tr("a la leyenda")) + "</em></h1>"; }
  function langView() {
    var s = '<main id="main"><div class="stack">' + updBanner(false) + slot("home") + '<section class="hero"><div class="eyebrow">Idioma · Language · Sprache · Lingua · Langue</div>' + titleHTML() + '</section><div class="opts">';
    s += LANGS.map(function (l) { return '<button class="pickrow lang" data-a="setlang" data-v="' + l[0] + '" lang="' + l[0] + '" aria-pressed="' + (LANG === l[0]) + '"><span class="lflag" aria-hidden="true">' + flagOf(LANG_FLAG[l[0]]) + '</span><div class="grow"><b>' + h(l[1]) + "</b></div>" + ICON.play + "</button>"; }).join("");
    return s + "</div></div></main>";
  }
  function slotsNow() { return UI.slots || Store.index(); }
  function homeView() {
    var n = slotsNow().length;
    var s = '<main id="main"><div class="stack">' + updBanner(false) + '<section class="hero"><div class="eyebrow">' + tr("Jugador, míster o tu propio club") + "</div>" + titleHTML() +
      "<p>" + tr("{n} ligas de los cinco continentes, todas las selecciones del mundo, copas, Champions, Libertadores, Mundiales y el Balón de Oro.", {n: W.lg.length}) + "</p>" +
      '<div class="scoreline"><span>' + tr("{n} LIGAS", {n: W.lg.length}) + "</span><span>" + tr("{n} CLUBES", {n: W.clubs.length - 2}) + "</span><span>" + tr("{n} SELECCIONES", {n: W.ctry.length}) + "</span></div></section>";
    s += '<div class="opts"><button class="go" data-a="goload"' + (n ? "" : " disabled") + ">" + tr("Cargar partida") + (n ? " · " + n : "") + " " + ICON.play + '</button><button class="go ghost" data-a="newgame">' + tr("Nueva partida") + '</button><button class="btn wide gde-open" data-a="guide">📖 ' + tr("Guía del juego") + "</button></div>";
    s += '<div class="opts"><button class="btn wide" data-a="hof">' + tr("Salón de la fama") + '</button><button class="btn wide" data-a="import">' + tr("Cargar una partida con código") + '</button><button class="btn wide" data-a="golang">' + tr("Idioma") + ": " + h(langName()) + '</button><button class="btn wide" data-a="a11y">' + tr("Accesibilidad") + '</button><button class="linkbtn" data-a="privacy">' + tr("Política de privacidad") + "</button>" + (adPrivacyRequired() ? '<button class="linkbtn" data-a="adprivacy">' + tr("Opciones de privacidad de anuncios") + "</button>" : "") + "</div></div></main>";
    return s;
  }
  function fmtWhen(ts) {
    try {
      var d = new Date(ts), now = new Date(), same = d.toDateString() === now.toDateString();
      var t = d.toLocaleTimeString(LANG, {hour: "2-digit", minute: "2-digit"});
      return same ? tr("hoy, {t}", {t: t}) : d.toLocaleDateString(LANG, {day: "numeric", month: "short"}) + ", " + t;
    } catch (e) { return ""; }
  }
  var MODE_NAMES = {p: N_("Carrera de jugador"), pm: N_("Jugador y míster"), mgr: N_("Carrera de míster"), club: N_("Club propio")};
  function slotCard(e) {
    var cr = e.cu ? crestRaw(e.cu.col, e.cu.ab, true) : (e.club >= 0 && W.clubs[e.club] ? crestRaw(W.clubs[e.club].col, W.clubs[e.club].ab, true) : "");
    var lvTier = e.pos === "DT" ? repTier(e.lv) : tier(e.lv), cur = S && S.uid === e.id;
    return '<section class="card slotc"><div class="head"><span class="tag' + (e.ret ? "" : " ok") + '"><span class="dot"></span>' + h(tr(MODE_NAMES[e.mode] || "")) + (e.g === "f" ? " · " + h(tr("Femenino")) : "") + '</span><span class="eyebrow">' + (e.yr ? seasonLabel(e.draft ? e.yr + 1 : e.yr) : "") + "</span></div>" +
      '<div class="slotrow">' + cr + '<div class="grow"><h3>' + h(e.n) + '</h3><div class="muted" style="font-size:13px">' + h(e.cn || tr("Sin club")) + (e.ret ? " · " + tr("retirado") : "") + (e.ts ? " · " + h(fmtWhen(e.ts)) : "") + (e.cloud ? " · " + tr("en tu cuenta") : "") + "</div></div>" +
      '<div class="ovr tier-' + lvTier + '"><b>' + e.lv + "</b><small>" + h(e.pos === "DT" ? tr("DT") : posAb(e.pos)) + "</small></div></div>" +
      '<div class="row2" style="margin-top:12px"><button class="btn wide danger" data-a="askdel" data-v="' + h(e.id) + '">' + tr("Borrar") + '</button><button class="btn pri wide" data-a="loadslot" data-v="' + h(e.id) + '">' + (cur ? tr("Continuar") : tr("Jugar")) + "</button></div></section>";
  }
  function loadView() {
    var l = slotsNow();
    var s = '<main id="main"><div class="stack"><section><div class="eyebrow">' + tr("Tus partidas") + '</div><h2 class="vtitle">' + tr("Cargar partida") + "</h2></section>";
    if (!l.length) s += '<p class="empty">' + tr("Todavía no tienes partidas guardadas.") + "</p>";
    s += l.map(slotCard).join("");
    s += '<div class="row2"><button class="btn wide" data-a="gohome">' + tr("Atrás") + '</button><button class="btn wide" data-a="import">' + tr("Cargar con código") + "</button></div>";
    return s + "</div></main>";
  }
  function modesView() {
    var modes = [["p", ICON.route, N_("Carrera de jugador"), N_("Crea a tu futbolista y vive su carrera entera. Cuando te retires, puedes seguir como entrenador.")],
      ["mgr", ICON.board, N_("Carrera de míster"), N_("Empieza directamente en el banquillo del club que elijas: fichajes, alineación, renovaciones y moral del vestuario.")],
      ["club", ICON.shirt, N_("Crea tu club"), N_("Inventa un club, ponlo en la liga que quieras y empieza con una plantilla nueva según la dificultad.")]];
    var s = '<main id="main"><div class="stack"><section><div class="eyebrow">' + tr("Nueva partida") + '</div><h2 class="vtitle">' + tr("Elige un modo") + '</h2></section>';
    s += '<div class="seg gseg">' + [["m", N_("Fútbol masculino")], ["f", N_("Fútbol femenino")]].map(function (x) { return '<button data-a="gsel" data-v="' + x[0] + '" aria-pressed="' + ((UI.gsel || "m") === x[0]) + '">' + h(tr(x[1])) + "</button>"; }).join("") + "</div>";
    s += '<div class="opts">';
    s += modes.map(function (x) { return '<button class="pickrow modec" data-a="pickmode" data-v="' + x[0] + '"><span class="micon">' + x[1] + '</span><div class="grow"><b>' + h(tr(x[2])) + "</b><small>" + h(tr(x[3])) + "</small></div></button>"; }).join("");
    return s + '</div><button class="btn wide" data-a="gohome">' + tr("Atrás") + "</button></div></main>";
  }
  var POS_XY = {DC: [50, 12], EI: [18, 21], ED: [82, 21], MCO: [50, 31], MI: [17, 44], MC: [50, 47], MD: [83, 44], MCD: [50, 61], LI: [15, 72], DFC: [50, 77], LD: [85, 72], POR: [50, 92]};
  function natOptions(sel, allowNone) {
    var list = W.ctry.map(function (c, i) { return i; }).filter(natLive).sort(function (a, b) { return natName(a).localeCompare(natName(b), LANG); });
    return (allowNone ? '<option value="">' + tr("Ninguna") + "</option>" : "") + list.map(function (i) { var c = W.ctry[i]; return '<option value="' + c.code + '"' + (c.code === sel ? " selected" : "") + ">" + c.flag + " " + h(natName(i)) + "</option>"; }).join("");
  }
  function createPlayerView() {
    var c = UI.cr, st = c.step, s = '<main id="main"><div class="stack"><div class="steps">' + [0, 1, 2, 3].map(function (i) { return '<i class="' + (i <= st ? "on" : "") + '"></i>'; }).join("") + "</div>";
    if (st === 0) {
      s += '<section><div class="eyebrow">' + tr("Paso {n} de 4", {n: 1}) + '</div><h2 style="font-size:34px;text-transform:uppercase">' + tr("¿Quién eres?") + "</h2></section>";
      s += '<div class="row2"><div><label class="lbl" for="fn">' + tr("Nombre") + '</label><input type="text" id="fn" data-f="fn" value="' + h(c.fn) + '" maxlength="18" autocomplete="off"></div><div><label class="lbl" for="ln">' + tr("Apellido") + '</label><input type="text" id="ln" data-f="ln" value="' + h(c.ln) + '" maxlength="20" autocomplete="off"></div></div>';
      s += '<div><label class="lbl" for="nat">' + tr("Nacionalidad") + '</label><select id="nat" data-f="nat">' + natOptions(c.nat) + "</select></div>";
      s += '<div><label class="lbl" for="nat2">' + tr("Segunda nacionalidad (opcional)") + '</label><select id="nat2" data-f="nat2">' + natOptions(c.nat2, true) + '</select><p class="muted" style="font-size:13px;margin:6px 0 0">' + tr("Si tienes dos, cuando destaques te tocará elegir selección.") + "</p></div>";
    } else if (st === 1) {
      s += '<section><div class="eyebrow">' + tr("Paso {n} de 4", {n: 2}) + '</div><h2 style="font-size:34px;text-transform:uppercase">' + tr("Tu posición") + "</h2></section>";
      s += '<div class="pitch" role="group" aria-label="' + h(tr("Elige posición")) + '"><div class="box t"></div><div class="box b"></div>' + Object.keys(POS_XY).map(function (k) {
        return '<button data-a="cpos" data-v="' + k + '" style="left:' + POS_XY[k][0] + "%;top:" + POS_XY[k][1] + '%" aria-pressed="' + (c.pos === k) + '" aria-label="' + h(posName(k)) + '">' + h(posAb(k)) + "</button>";
      }).join("") + "</div>";
      s += '<p class="lead" style="margin:0">' + h(posName(c.pos)) + "</p>";
      s += '<div class="row2"><div><label class="lbl">' + tr("Pierna buena") + '</label><div class="seg">' + [N_("Diestro"), N_("Zurdo")].map(function (f) { return '<button data-a="cset" data-k="foot" data-v="' + f + '" aria-pressed="' + (c.foot === f) + '">' + h(tr(f)) + "</button>"; }).join("") + "</div></div>";
      s += '<div><label class="lbl">' + tr("Edad al debutar") + '</label><div class="seg">' + [16, 17, 18, 19].map(function (a) { return '<button data-a="cset" data-k="age" data-v="' + a + '" aria-pressed="' + (c.age === a) + '">' + a + "</button>"; }).join("") + "</div></div></div>";
      s += slot("create", c);
    } else if (st === 2) {
      s += '<section><div class="eyebrow">' + tr("Paso {n} de 4", {n: 3}) + '</div><h2 style="font-size:34px;text-transform:uppercase">' + tr("Tu talento") + '</h2></section><div class="opts">';
      var desc = {promesa: tr("Empiezas con 58 de media. Nadie da un duro por ti: hasta dónde llegues depende de ti."), joya: tr("Empiezas con 62. Los grandes ya te vigilan. Tus decisiones dirán si llegas arriba."), elegido: tr("Empiezas con 65. Todos esperan mucho de ti, y eso también pesa."), misterio: tr("Tu media inicial es una sorpresa. Nadie sabe qué futbolista puedes llegar a ser.")};
      Object.keys(TALENT).forEach(function (k) { s += '<button class="pickrow" data-a="cset" data-k="talent" data-v="' + k + '" aria-pressed="' + (c.talent === k) + '"><div class="grow"><b>' + h(TALENT[k].n) + "</b><small>" + h(desc[k]) + "</small></div></button>"; });
      s += '</div><div><label class="lbl">' + tr("Ritmo de decisiones") + '</label><div class="seg">' + [[tr("Tranquilo"), 0], [tr("Normal"), 1], [tr("Intenso"), 2]].map(function (x) { return '<button data-a="cset" data-k="ev" data-v="' + x[1] + '" aria-pressed="' + (c.ev === x[1]) + '">' + x[0] + "</button>"; }).join("") + '</div><p class="muted" style="font-size:13px;margin:6px 0 0">' + evDesc(c.ev, false) + "</p></div>";
    } else {
      s += '<section><div class="eyebrow">' + tr("Paso {n} de 4", {n: 4}) + '</div><h2 style="font-size:34px;text-transform:uppercase">' + tr("Tu primer club") + "</h2></section>";
      s += '<div class="seg"><button data-a="cset" data-k="mode" data-v="rand" aria-pressed="' + (c.mode === "rand") + '">' + tr("Cantera de mi país") + '</button><button data-a="cset" data-k="mode" data-v="pick" aria-pressed="' + (c.mode === "pick") + '">' + tr("Elegir club") + "</button></div>";
      if (c.mode === "rand") {
        var pb = (TALENT[c.talent].ovr || 59) + ({16: -3, 17: -1.5, 18: 0, 19: 1.5}[c.age] || 0);
        if (!c.offers || c.offKey !== c.nat) { c.offers = startOffersPlayer(c.nat, pb); c.offKey = c.nat; if (c.offers.indexOf(c.club) < 0) c.club = -1; }
        s += '<p class="lead">' + tr("Tres clubes modestos quieren subirte de la cantera. Elige dónde debutar.") + '</p><div class="list">' + offerRows(c, pb) + "</div>";
        s += '<button class="btn wide" data-a="reoffer">' + tr("Buscar otras ofertas") + "</button>";
      }
      else {
        if (c.lg == null) c.lg = (W.byCountry[W.cIdx[c.nat]] || [W.lgIdx.ESP1])[0];
        s += '<div><label class="lbl" for="clg">' + tr("Liga") + '</label><select id="clg" data-f="lg">';
        W.confs.forEach(function (cf) {
          var ls = W.lg.map(function (l, i) { return i; }).filter(function (i) { return W.lg[i].conf === cf; });
          if (ls.length) s += '<optgroup label="' + h(tr(cf)) + '">' + ls.map(function (i) { return '<option value="' + i + '"' + (i === +c.lg ? " selected" : "") + ">" + W.ctry[W.lg[i].ci].flag + " " + h(lgName(i)) + "</option>"; }).join("") + "</optgroup>";
        });
        s += '</select></div><div class="list">';
        var base = TALENT[c.talent].ovr || 59;
        base += {16: -3, 17: -1.5, 18: 0, 19: 1.5}[c.age] || 0;
        W.lg[+c.lg].cl0.forEach(function (ci) {
          var r = W.clubs[ci].r0, role = roleFor(base - r, c.age);
          s += '<button class="pickrow" data-a="cclub" data-v="' + ci + '" aria-pressed="' + (c.club === ci) + '">' + crest(ci, true) + '<div class="grow"><b>' + h(W.clubs[ci].n) + "</b><small>" + tr("Rol esperado: {role}", {role: h(tr(role))}) + '</small></div><span class="lvl">' + Math.round(r) + "</span></button>";
        });
        s += '</div><p class="muted" style="font-size:13px;margin:0">' + tr("Un grande te da prestigio, pero quizá no minutos. Un club pequeño, el escaparate para crecer.") + "</p>";
      }
    }
    var canNext = st === 0 ? (c.fn.trim() && c.ln.trim()) : st === 3 ? c.club >= 0 : true;
    s += '<div class="row2" style="margin-top:6px"><button class="btn wide" data-a="cback">' + (st === 0 ? tr("Cancelar") : tr("Atrás")) + '</button><button class="btn pri wide" data-a="cnext"' + (canNext ? "" : " disabled") + ">" + (st === 3 ? tr("Empezar carrera") : tr("Siguiente")) + "</button></div>";
    if (st === 0 && !canNext) s += '<p class="muted" style="font-size:13px;margin:0">' + tr("Escribe nombre y apellido para seguir.") + "</p>";
    return s + "</div></main>";
  }
  function createView() {
    var k = UI.cr.kind;
    return k === "mgr" ? createMgrView() : k === "club" ? createClubView() : createPlayerView();
  }
  function stepsBar(st, n) { return '<div class="steps">' + range(n).map(function (i) { return '<i class="' + (i <= st ? "on" : "") + '"></i>'; }).join("") + "</div>"; }
  function stepHead(st, n, title) { return '<section><div class="eyebrow">' + tr("Paso {a} de {b}", {a: st + 1, b: n}) + '</div><h2 class="vtitle">' + h(title) + "</h2></section>"; }
  function navRow(st, n, canNext, last) {
    return '<div class="row2" style="margin-top:6px"><button class="btn wide" data-a="cback">' + (st === 0 ? tr("Cancelar") : tr("Atrás")) + '</button><button class="btn pri wide" data-a="cnext"' + (canNext ? "" : " disabled") + ">" + (st === n - 1 ? h(last) : tr("Siguiente")) + "</button></div>";
  }
  function whoFields(c, ages) {
    var s = '<div class="row2"><div><label class="lbl" for="fn">' + tr("Nombre") + '</label><input type="text" id="fn" data-f="fn" value="' + h(c.fn) + '" maxlength="18" autocomplete="off"></div><div><label class="lbl" for="ln">' + tr("Apellido") + '</label><input type="text" id="ln" data-f="ln" value="' + h(c.ln) + '" maxlength="20" autocomplete="off"></div></div>';
    s += '<div><label class="lbl" for="nat">' + tr("Nacionalidad") + '</label><select id="nat" data-f="nat">' + natOptions(c.nat) + "</select></div>";
    s += '<div><label class="lbl">' + tr("Edad") + '</label><div class="seg">' + ages.map(function (a) { return '<button data-a="cset" data-k="age" data-v="' + a + '" aria-pressed="' + (c.age === a) + '">' + a + "</button>"; }).join("") + "</div></div>";
    return s;
  }
  var DIFF_DESC_M = [N_("Directiva paciente, un 30 % más de presupuesto y buen prestigio de partida."), N_("La experiencia equilibrada."), N_("Menos dinero y una directiva con prisa. Casi nadie te conoce."), N_("Presupuesto mínimo y cero paciencia. Nadie da un duro por ti.")];
  var DIFF_DESC_C = [N_("Plantilla para pelear la liga y un 60 % más de presupuesto."), N_("Plantilla de mitad de tabla y presupuesto normal."), N_("Plantilla para no descender y poco dinero."), N_("La peor plantilla de la liga y casi sin dinero.")];
  /* qué cambia con el ritmo de decisiones (en el modo míster, el intenso permite ver los partidos en directo) */
  function evDesc(ev, mgr) {
    if (ev === 2) return mgr ? tr("Intenso: más decisiones y momentos clave. Además, antes de cada partido eliges si verlo en directo, con cambios tácticos y sustituciones, o simularlo.") : tr("Intenso: más decisiones, imprevistos y momentos clave en los partidos.");
    if (ev === 0) return tr("Tranquilo: pocas decisiones; la carrera avanza rápido.");
    return tr("Normal: un equilibrio entre decisiones y partidos.");
  }
  function diffFields(c, desc) {
    var s = '<div class="opts">' + DIFFS.map(function (n, i) { return '<button class="pickrow" data-a="cset" data-k="diff" data-v="' + i + '" aria-pressed="' + (c.diff === i) + '"><div class="grow"><b>' + h(tr(n)) + "</b><small>" + h(tr(desc[i])) + "</small></div></button>"; }).join("") + "</div>";
    s += '<div><label class="lbl">' + tr("Ritmo de decisiones") + '</label><div class="seg">' + [[N_("Tranquilo"), 0], [N_("Normal"), 1], [N_("Intenso"), 2]].map(function (x) { return '<button data-a="cset" data-k="ev" data-v="' + x[1] + '" aria-pressed="' + (c.ev === x[1]) + '">' + h(tr(x[0])) + "</button>"; }).join("") + '</div><p class="muted" style="font-size:13px;margin:6px 0 0">' + evDesc(c.ev, true) + "</p></div>";
    return s;
  }
  function leagueField(c) {
    if (c.lg == null) c.lg = (W.byCountry[W.cIdx[c.nat]] || [W.lgIdx.ESP1])[0];
    var s = '<div><label class="lbl" for="clg">' + tr("Liga") + '</label><select id="clg" data-f="lg">';
    W.confs.forEach(function (cf) {
      var ls = W.lg.map(function (l, i) { return i; }).filter(function (i) { return W.lg[i].conf === cf; });
      if (ls.length) s += '<optgroup label="' + cf + '">' + ls.map(function (i) { return '<option value="' + i + '"' + (i === +c.lg ? " selected" : "") + ">" + W.ctry[W.lg[i].ci].flag + " " + h(lgName(i)) + "</option>"; }).join("") + "</optgroup>";
    });
    return s + "</select></div>";
  }
  /* tarjetas de oferta para empezar (jugador: rol esperado; míster: liga y nivel) */
  function offerRows(c, base) {
    return c.offers.map(function (ci) {
      var cl = W.clubs[ci], li = cl.lg0, sub = base != null ? tr("{lg} · rol esperado: {role}", {lg: h(lgName(li)), role: h(tr(roleFor(base - cl.r0, c.age)))}) : flag(cl.ci) + " " + h(lgName(li));
      return '<button class="pickrow" data-a="cclub" data-v="' + ci + '" aria-pressed="' + (c.club === ci) + '">' + crest(ci, true) + '<div class="grow"><b>' + h(cl.n) + "</b><small>" + sub + '</small></div><span class="lvl">' + Math.round(cl.r0) + "</span></button>";
    }).join("");
  }
  function createMgrView() {
    var c = UI.cr, st = c.step, n = 3, s = '<main id="main"><div class="stack">' + stepsBar(st, n);
    if (st === 0) { s += stepHead(st, n, tr("¿Quién eres?")) + whoFields(c, [30, 35, 40, 45, 50, 55]); }
    else if (st === 1) { s += stepHead(st, n, tr("Dificultad")) + diffFields(c, DIFF_DESC_M); }
    else {
      s += stepHead(st, n, tr("Tu banquillo"));
      s += '<div class="seg"><button data-a="cset" data-k="mmode" data-v="off" aria-pressed="' + (c.mmode === "off") + '">' + tr("Empezar desde abajo") + '</button><button data-a="cset" data-k="mmode" data-v="pick" aria-pressed="' + (c.mmode === "pick") + '">' + tr("Elegir club") + "</button></div>";
      if (c.mmode === "off") {
        if (!c.offers) { c.offers = startOffersMgr(); if (c.offers.indexOf(c.club) < 0) c.club = -1; }
        s += '<p class="lead">' + tr("Tres clubes de ligas menos potentes te ofrecen su banquillo. Gana allí y llamarán los grandes.") + '</p><div class="list">' + offerRows(c, null) + "</div>";
        s += '<button class="btn wide" data-a="reoffer">' + tr("Buscar otras ofertas") + "</button>";
      }
    }
    if (st === 2 && c.mmode === "pick") {
      s += leagueField(c) + '<div class="list">';
      var maxR = 61 + DIFF_REP[c.diff] * 0.32;
      W.lg[+c.lg].cl0.slice().sort(function (a, b) { return W.clubs[b].r0 - W.clubs[a].r0; }).forEach(function (ci) {
        var r = W.clubs[ci].r0, big = r > maxR + 2;
        s += '<button class="pickrow" data-a="cclub" data-v="' + ci + '" aria-pressed="' + (c.club === ci) + '">' + crest(ci, true) + '<div class="grow"><b>' + h(W.clubs[ci].n) + "</b><small>" + (big ? tr("Un grande: la afición no tendrá paciencia") : tr("Nivel adecuado para empezar")) + '</small></div><span class="lvl">' + Math.round(r) + "</span></button>";
      });
      s += '</div><p class="muted" style="font-size:13px;margin:0">' + tr("Puedes empezar en cualquier club. Si ganas, llegarán ofertas de clubes más grandes.") + "</p>";
    }
    var canNext = st === 0 ? !!(c.fn.trim() && c.ln.trim()) : st === 2 ? c.club >= 0 : true;
    s += navRow(st, n, canNext, tr("Empezar"));
    if (st === 0 && !canNext) s += '<p class="muted" style="font-size:13px;margin:0">' + tr("Escribe nombre y apellido para seguir.") + "</p>";
    return s + "</div></main>";
  }
  var CLUB_COLS = ["#c8102e", "#8a1538", "#f26522", "#ffcd00", "#00843d", "#0b5d3b", "#6cabdd", "#0057b8", "#0b2545", "#5b2a86", "#111111", "#ffffff", "#9aa5ab", "#d4a017"];
  function createClubView() {
    var c = UI.cr, st = c.step, n = 4, s = '<main id="main"><div class="stack">' + stepsBar(st, n);
    var ab = (c.ab || clubAbbr(c.cn) || "FC").toUpperCase().slice(0, 4);
    if (st === 0) {
      s += stepHead(st, n, tr("Tu club"));
      s += '<div class="clubprev">' + crestRaw(c.col, ab, true, c.crest) + (typeof kitSVG === "function" ? kitSVG({pat: c.kit.pat, col: [c.col[0], c.col[1], c.kit.col3], big: true}) : "") + '<div class="grow"><b>' + h(c.cn || tr("Nombre del club")) + '</b><small class="muted">' + h(ab) + "</small></div></div>";
      s += '<div><label class="lbl" for="cn">' + tr("Nombre del club") + '</label><input type="text" id="cn" data-f="cn" value="' + h(c.cn) + '" maxlength="26" autocomplete="off" placeholder="' + h(tr("Por ejemplo: Atlético Vallès")) + '"></div>';
      s += '<div><label class="lbl" for="ab">' + tr("Abreviatura") + '</label><input type="text" id="ab" data-f="ab" value="' + h(c.ab) + '" maxlength="4" autocomplete="off" placeholder="' + h(ab) + '" style="text-transform:uppercase"></div>';
      [0, 1].forEach(function (k) {
        s += '<div><label class="lbl">' + (k ? tr("Color secundario") : tr("Color principal")) + '</label><div class="swatches">' + CLUB_COLS.map(function (col) { return '<button class="sw" data-a="ccol" data-k="' + k + '" data-v="' + col + '" style="background:' + col + '" aria-pressed="' + (c.col[k] === col) + '" aria-label="' + col + '"></button>'; }).join("") + "</div></div>";
      });
      s += clubLookFields(c, ab);
    } else if (st === 1) {
      s += stepHead(st, n, tr("¿Dónde juega?")) + leagueField(c);
      var cl = W.lg[+c.lg].cl0.slice().sort(function (a, b) { return W.clubs[b].r0 - W.clubs[a].r0; });
      if (c.club < 0 || cl.indexOf(c.club) < 0) c.club = cl[cl.length - 1];
      s += '<p class="muted" style="font-size:13px;margin:0">' + tr("Tu club ocupará la plaza de uno de estos equipos, que desaparece de la liga.") + '</p><div class="list">';
      cl.forEach(function (ci) { s += '<button class="pickrow" data-a="cclub" data-v="' + ci + '" aria-pressed="' + (c.club === ci) + '">' + crest(ci, true) + '<div class="grow"><b>' + h(W.clubs[ci].n) + "</b><small>" + (c.club === ci ? tr("Tu club ocupa su plaza") : tr("Sustituir a este club")) + '</small></div><span class="lvl">' + Math.round(W.clubs[ci].r0) + "</span></button>"; });
      s += "</div>";
    } else if (st === 2) { s += stepHead(st, n, tr("Dificultad")) + diffFields(c, DIFF_DESC_C); }
    else { s += stepHead(st, n, tr("Tú, el míster")) + whoFields(c, [30, 35, 40, 45, 50, 55]); }
    var canNext = st === 0 ? c.cn.trim().length >= 2 : st === 1 ? c.club >= 0 : st === 3 ? !!(c.fn.trim() && c.ln.trim()) : true;
    s += navRow(st, n, canNext, tr("Crear el club"));
    if (st === 0 && !canNext) s += '<p class="muted" style="font-size:13px;margin:0">' + tr("Ponle un nombre a tu club para seguir.") + "</p>";
    if (st === 3 && !canNext) s += '<p class="muted" style="font-size:13px;margin:0">' + tr("Escribe nombre y apellido para seguir.") + "</p>";
    return s + "</div></main>";
  }
  function draftView() {
    var m = S.m, cu = S.custom, li = S.cl[m.club];
    var s = '<main id="main"><div class="stack"><section><div class="eyebrow">' + tr("Crea tu club") + '</div><h2 class="vtitle">' + tr("Tu plantilla") + "</h2></section>";
    s += '<section class="card"><div class="clubprev">' + crest(m.club, true) + '<div class="grow"><b>' + h(clubName(m.club)) + '</b><small class="muted">' + h(lgName(li)) + " · " + tr("nivel {n}", {n: Math.round(S.cr[m.club])}) + " · " + tr("presupuesto {m}", {m: fmtMoney(m.bud)}) + "</small></div></div>";
    s += '<p class="lead" style="margin:10px 0 0">' + tr("Estos son tus jugadores. Toca cualquier nombre para cambiarlo, o genera otra plantilla si no te convence.") + "</p></section>";
    s += '<section class="card">';
    SQ_GROUPS.forEach(function (g) {
      var l = m.sq.filter(function (p) { return g[1].indexOf(p.pos) >= 0; }).sort(function (a, b) { return g[1].indexOf(a.pos) - g[1].indexOf(b.pos) || b.ovr - a.ovr; });
      if (!l.length) return;
      s += '<div class="sgroup">' + h(tr(g[0])) + "</div>";
      s += l.map(function (p) {
        return '<div class="drow"><span class="pp">' + h(posAb(p.pos)) + '</span><input type="text" data-rn="' + p.id + '" value="' + h(plName(p)) + '" maxlength="40" autocomplete="off" aria-label="' + h(tr("Nombre del jugador")) + '"><span class="dage">' + tr("{n} años", {n: p.age}) + '</span><span class="po">' + Math.round(p.ovr) + "</span></div>";
      }).join("");
    });
    s += "</section>";
    s += '<div class="opts"><button class="btn wide" data-a="redraft">' + tr("Generar otra plantilla") + '</button><button class="go" data-a="startclub">' + tr("Empezar la temporada") + " " + ICON.play + "</button></div>";
    s += '<button class="btn wide" data-a="gohome">' + tr("Menú principal") + "</button>";
    return s + "</div></main>";
  }
  function startCreate(kind) {
    var c = {step: 0, kind: kind || "p", fn: "", ln: "", nat: "ES", ev: 1, lg: null, club: -1, g: UI.gsel === "f" ? "f" : "m"};
    if (c.kind === "p") Object.assign(c, {nat2: "", pos: "DC", foot: "Diestro", age: 17, talent: "joya", mode: "rand"});
    else Object.assign(c, {age: 40, diff: 1, mmode: "off"});
    if (c.kind === "club") Object.assign(c, {cn: "", ab: "", col: ["#c8102e", "#ffffff"], lg: W.lgIdx.ESP1, crest: {shape: "shield", pat: "band"}, kit: {pat: "plain", col3: "#ffffff"}});
    UI.cr = c; UI.view = "create"; render(true);
  }
  function finishCreate() {
    var c = UI.cr;
    switchGame(function () {
      try {
        if (c.kind === "mgr") newManagerCareer({fn: c.fn.trim(), ln: c.ln.trim(), nat: c.nat, age: c.age, diff: c.diff, ev: c.ev, club: c.club, g: c.g});
        else if (c.kind === "club") newClubCareer({fn: c.fn.trim(), ln: c.ln.trim(), nat: c.nat, age: c.age, diff: c.diff, ev: c.ev, cn: c.cn.trim(), ab: (c.ab || clubAbbr(c.cn)).toUpperCase().slice(0, 4), col: c.col, repl: c.club, g: c.g, crest: c.crest, kit: c.kit});
        else newCareer({fn: c.fn.trim(), ln: c.ln.trim(), nat: c.nat, nat2: c.nat2 || null, pos: c.pos, foot: c.foot, age: c.age, talent: c.talent, club: c.club, ev: c.ev, g: c.g});
      } catch (e) { console.error(e); toast(tr("No se pudo crear la partida.")); return; }
      UI.cr = null; UI.exp = {}; UI.wl = null; UI.flash = null; UI.sheet = null;
      UI.view = S.ph === "draft" ? "draft" : "game"; UI.tab = isMgr() ? "club" : "carrera";
      persist(); refreshSlots(); render(true); showAd("start");
    });
  }
  /* ---------- paneles ---------- */
  function renderSheet() {
    var old = document.querySelector(".sheet"); if (old) old.remove();
    if (!UI.sheet) { UI.sheetK = null; return; }
    var html = sheetHTML();
    if (!html) { UI.sheet = null; return; }
    var fresh = UI.sheetK !== UI.sheet.k + "|" + (UI.sheet.id || UI.sheet.i || "");
    UI.sheetK = UI.sheet.k + "|" + (UI.sheet.id || UI.sheet.i || "");
    var el = document.createElement("div"); el.className = "sheet" + (fresh && !calm() ? " pop" : ""); el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true");
    el.innerHTML = '<div class="panel">' + html + "</div>";
    document.body.appendChild(el);
  }
  function sheetHTML() {
    var t = UI.sheet;
    if (UIX.sheets[t.k]) return UIX.sheets[t.k](t);
    if (t.k === "statinfo") {
      var it = statusItems();
      return "<h2>" + (isMgr() ? tr("Estado del club") : tr("Tu estado")) + '</h2><div class="stack"><div class="stlist">' + it.map(function (x) { var w = lvlWord(x[1]), v = Math.round(x[1]); return '<div class="stli"><div class="stlt"><span>' + h(x[0]) + '</span><b class="' + w[1] + '">' + h(w[0]) + " · " + v + '</b></div><div class="bar"><i class="' + barCls(v) + '" style="width:' + v + '%"></i></div></div>'; }).join("") + "</div>" +
        '<p class="muted" style="font-size:13px;margin:0">' + (isMgr() ? tr("Directiva y afición deciden tu futuro; vestuario, química y forma, cómo rinde el equipo.") : tr("Forma, moral y físico deciden cómo rindes; el míster y la afición, tus minutos y tu fama.")) + '</p><button class="btn wide" data-a="close">' + tr("Cerrar") + "</button></div>";
    }
    if (t.k === "menu") {
      var ev = S ? S.set.ev : 1;
      return '<h2>' + tr("Menú") + '</h2><div class="stack">' + updBanner(true) + slot("menu") + '<div><label class="lbl">' + tr("Idioma") + '</label><div class="seg langseg">' + LANGS.map(function (l) { return '<button data-a="setlang" data-v="' + l[0] + '" lang="' + l[0] + '" aria-pressed="' + (LANG === l[0]) + '" title="' + h(l[1]) + '"><span class="lflag sm" aria-hidden="true">' + flagOf(LANG_FLAG[l[0]]) + "</span>" + l[0].toUpperCase() + "</button>"; }).join("") + "</div></div>" +
        '<div><label class="lbl">' + tr("Ritmo de decisiones") + '</label><div class="seg">' + [[N_("Tranquilo"), 0], [N_("Normal"), 1], [N_("Intenso"), 2]].map(function (x) { return '<button data-a="setev" data-v="' + x[1] + '" aria-pressed="' + (ev === x[1]) + '">' + h(tr(x[0])) + "</button>"; }).join("") + '</div><p class="muted" style="font-size:13px;margin:6px 0 0">' + evDesc(ev, isMgr()) + "</p></div>" +
        '<p class="muted" style="margin:0;font-size:13px">' + (Store.cloud ? tr("Tu partida se guarda sola en tu cuenta y en este dispositivo.") : tr("Tu partida se guarda sola en este dispositivo. Usa el código para pasarla a otro móvil.")) + "</p>" +
        '<button class="btn wide" data-a="home">' + tr("Menú principal") + '</button><button class="btn wide" data-a="export">' + tr("Copiar código de partida") + '</button><button class="btn wide" data-a="import">' + tr("Cargar partida con código") + '</button><button class="btn wide" data-a="hof">' + tr("Salón de la fama") + "</button>" +
        '<button class="btn wide" data-a="privacy">' + tr("Política de privacidad") + "</button>" + (adPrivacyRequired() ? '<button class="btn wide" data-a="adprivacy">' + tr("Opciones de privacidad de anuncios") + "</button>" : "") + '<button class="btn wide" data-a="close">' + tr("Cerrar") + "</button></div>";
    }
    if (t.k === "privacy") {
      var P = [[N_("Resumen"), N_("Camino a la Leyenda es gratis gracias a los anuncios: la app muestra anuncios de Google AdMob entre partidas. No vendemos tus datos y no necesitas crear una cuenta para jugar.")],
        [N_("Qué datos guarda"), N_("Solo lo que tú creas al jugar: los nombres que escribes, tus partidas, el idioma elegido y el Salón de la fama. Todo se guarda en el almacenamiento local de tu dispositivo.")],
        [N_("Anuncios"), N_("Para mostrar y medir los anuncios, Google AdMob puede recoger el identificador de publicidad del dispositivo, la dirección IP, la ubicación aproximada, datos técnicos del dispositivo e información sobre cómo interactúas con los anuncios. Google trata estos datos según su política de privacidad: policies.google.com/privacy.")],
        [N_("Tu consentimiento"), N_("Si estás en el Espacio Económico Europeo, el Reino Unido o Suiza, la app te pregunta al abrirla si aceptas anuncios personalizados. Puedes cambiar tu elección cuando quieras en «Opciones de privacidad de anuncios», en el menú. También puedes restablecer o eliminar el ID de publicidad en los ajustes de Android.")],
        [N_("Conexión a internet"), N_("La app usa internet solo para cargar los anuncios y para comprobar en Google Play si hay una versión nueva: el juego funciona sin conexión y tus partidas nunca se envían a ningún servidor.")],
        [N_("Código de partida"), N_("El código para copiar tu partida solo se genera cuando lo pides y lo compartes tú. Contiene tus partidas, nada más.")],
        [N_("Borrar tus datos"), N_("Puedes borrar cualquier partida desde «Cargar partida». Desinstalar la app elimina todo lo guardado en el dispositivo. Para borrar los datos publicitarios que tiene Google, restablece tu ID de publicidad o entra en myadcenter.google.com.")],
        [N_("Menores"), N_("El juego no está dirigido a menores de 13 años y no recoge a sabiendas datos personales de menores.")],
        [N_("Nombres de jugadores"), N_("Los nombres de futbolistas y entrenadores son versiones inventadas inspiradas en el fútbol real; el juego no está afiliado a ningún club, liga ni jugador.")],
        [N_("Cambios y contacto"), N_("Si esta política cambia, lo verás aquí con la fecha de actualización. Para cualquier duda, escribe al correo de contacto del desarrollador que aparece en la ficha de Google Play.")]];
      if (NO_ADS) P = [[N_("Resumen"), N_("Camino a la Leyenda no tiene anuncios, no usa analíticas ni rastreadores y no vende ni comparte datos con nadie. No necesitas crear una cuenta para jugar.")],
        P[1],
        [N_("Conexión a internet"), N_("La app solo se conecta a internet para comprobar en Google Play si hay una versión nueva: el juego funciona sin conexión y no envía tus datos ni tus partidas a ningún servidor.")],
        P[5], [N_("Borrar tus datos"), N_("Puedes borrar cualquier partida desde «Cargar partida». Desinstalar la app elimina todo lo guardado en el dispositivo.")],
        P[7], P[8], P[9]];
      return "<h2>" + tr("Política de privacidad") + '</h2><p class="muted" style="margin:-6px 0 10px;font-size:13px">' + tr("Última actualización: {d}", {d: "10/10/2026"}) + '</p><div class="policy">' + P.map(function (x) { return "<h3>" + h(tr(x[0])) + "</h3><p>" + h(tr(x[1])) + "</p>"; }).join("") + '</div><button class="btn wide" style="margin-top:12px" data-a="close">' + tr("Cerrar") + "</button>";
    }
    if (t.k === "update") {
      return '<div class="upd">' + ICON.play + '</div><h2>' + tr("¡Nueva versión disponible!") + '</h2><p class="lead">' + tr("Hay una actualización de Camino a la Leyenda con novedades y mejoras. Tus partidas se conservan.") + "</p>" +
        '<div class="row2" style="margin-top:14px"><button class="btn wide" data-a="close">' + tr("Más tarde") + '</button><button class="btn pri wide" data-a="doupdate">' + tr("Actualizar") + "</button></div>";
    }
    if (t.k === "socedit") return socEditHTML();
    if (t.k === "askdel") {
      var e = slotsNow().filter(function (x) { return x.id === t.id; })[0];
      return "<h2>" + tr("¿Borrar la partida?") + '</h2><p class="lead">' + tr("Se borrará la partida de {n} de este dispositivo y de tu cuenta. No se puede deshacer.", {n: h(e ? e.n : "")}) + '</p><div class="row2" style="margin-top:14px"><button class="btn wide" data-a="close">' + tr("Cancelar") + '</button><button class="btn pri wide" data-a="dodel" data-v="' + h(t.id) + '">' + tr("Borrar") + "</button></div>";
    }
    if (t.k === "ren") {
      var rp = mPl(t.id); if (!rp) return "";
      return "<h2>" + tr("Cambiar nombre") + '</h2><div class="stack"><div class="row2"><div><label class="lbl" for="rfn">' + tr("Nombre") + '</label><input type="text" id="rfn" value="' + h(rp.fn) + '" maxlength="20" autocomplete="off"></div><div><label class="lbl" for="rln">' + tr("Apellido") + '</label><input type="text" id="rln" value="' + h(rp.ln) + '" maxlength="24" autocomplete="off"></div></div>' +
        '<p class="muted" style="margin:0;font-size:13px">' + tr("Puedes dejar el nombre en blanco si se le conoce por un solo nombre.") + '</p><div class="row2"><button class="btn wide" data-a="pl" data-id="' + rp.id + '">' + tr("Cancelar") + '</button><button class="btn pri wide" data-a="dorename" data-id="' + rp.id + '">' + tr("Guardar") + "</button></div></div>";
    }
    if (t.k === "export") return "<h2>" + tr("Código de partida") + '</h2><p class="muted" style="margin:0 0 10px;font-size:14px">' + tr("Cópialo y guárdalo donde quieras. Pegándolo en «Cargar partida» recuperas esta carrera en cualquier dispositivo.") + '</p><textarea id="code" readonly>' + h(t.code || tr("Generando…")) + '</textarea><div class="row2" style="margin-top:10px"><button class="btn wide" data-a="close">' + tr("Cerrar") + '</button><button class="btn pri wide" data-a="copy">' + tr("Copiar") + "</button></div>";
    if (t.k === "import") return "<h2>" + tr("Cargar partida") + '</h2><p class="muted" style="margin:0 0 10px;font-size:14px">' + tr("Pega el código de una partida. Se añadirá a tus partidas guardadas.") + '</p><textarea id="incode" placeholder="CAMINO1:…"></textarea>' + (t.err ? '<p class="neg" style="margin:8px 0 0">' + h(t.err) + "</p>" : "") + '<div class="row2" style="margin-top:10px"><button class="btn wide" data-a="close">' + tr("Cancelar") + '</button><button class="btn pri wide" data-a="doImport">' + tr("Cargar") + "</button></div>";
    if (t.k === "hof") {
      var list = (t.list || []).filter(function (e) { return UI.hofF === "ALL" || e.g === UI.hofF; });
      return "<h2>" + tr("Salón de la fama") + '</h2><div class="seg" style="margin-bottom:12px">' + [[N_("Todos"), "ALL"], [N_("POR"), "POR"], [N_("DEF"), "DEF"], [N_("MED"), "MED"], [N_("DEL"), "DEL"], [N_("DT"), "DT"]].map(function (x) { return '<button data-a="hoff" data-v="' + x[1] + '" aria-pressed="' + (UI.hofF === x[1]) + '">' + h(tr(x[0])) + "</button>"; }).join("") + "</div>" +
        (t.list == null ? '<p class="empty">' + tr("Cargando…") + "</p>" : list.length ? list.map(function (e, i) {
          var ni = W.cIdx[e.nat];
          var det = e.g === "DT" ? tr("Entrenador") + " · " + h(e.club) + " · " + e.y0 + "–" + e.y1 + " · " + trn(e.apps, "{n} partido", "{n} partidos") + ", " + trn(e.gl, "{n} victoria", "{n} victorias") + " · " + trn(e.tro, "{n} título", "{n} títulos")
            : h(posAb(e.pos)) + " · " + h(e.club) + " · " + e.y0 + "–" + e.y1 + " · " + tr("{apps} PJ, {goals} G", {apps: e.apps, goals: e.gl}) + " · " + trn(e.tro, "{n} título", "{n} títulos") + (e.bdo ? " · " + tr("{n} BdO", {n: e.bdo}) : "");
          return '<div class="rank"><b>' + (i + 1) + "</b><span>" + (ni != null ? flag(ni) + " " : "") + "<b style=\"font:inherit;color:var(--chalk)\">" + h(e.n) + '</b><br><small class="muted">' + det + '</small></span><span class="num" style="text-align:right"><b style="color:var(--led)">' + e.sc + '</b><br><small class="muted">' + h(tr(e.title)) + "</small></span></div>";
        }).join("") : '<p class="empty">' + tr("Aquí aparecerán tus jugadores y entrenadores cuando se retiren.") + "</p>") +
        '<button class="btn wide" style="margin-top:14px" data-a="close">' + tr("Cerrar") + "</button>";
    }
    if (t.k === "pend") {
      var x = S.pend[0]; if (!x) return "";
      return pendingCard(x) + (x.k === "clausm" ? "" : '<button class="btn wide" style="margin-top:12px" data-a="close">' + tr("Cerrar sin decidir") + "</button>");
    }
    if (t.k === "pl") return playerSheet(mPl(t.id));
    if (t.k === "slot") return slotSheet(t.i);
    if (t.k === "pickclub") return pickClubSheet(t);
    return "";
  }
  function playerSheet(p) {
    if (!p) return "";
    var m = S.m, open = !!m.mk.open, st = p.st, now = S.yr * 10 + S.bi;
    var s = '<div class="pshead"><div class="ovr tier-' + tier(Math.round(p.ovr)) + '"><b>' + Math.round(p.ovr) + "</b><small>" + h(posAb(p.pos)) + '</small></div><div style="min-width:0"><h2 style="margin:0">' + h(plName(p)) + '</h2><div class="muted" style="font-size:13px">' + flag(p.nat) + " " + h(natName(p.nat)) + " · " + h(posName(p.pos)) + " · " + tr("{n} años", {n: p.age}) + "</div></div></div>";
    s += '<div class="meters" style="grid-template-columns:repeat(3,1fr);margin-top:12px">' + meter(tr("Forma"), p.form) + meter(tr("Moral"), p.mor) + meter(tr("Físico"), p.fit) + "</div>";
    s += '<div class="kvlist" style="margin-top:10px">' +
      "<div><span>" + tr("Potencial") + "</span><span>" + Math.round(Math.max(p.ovr, p.pot - (m.flags.data ? 1 : 3))) + "–" + Math.round(Math.min(95, p.pot + (m.flags.data ? 1 : 3))) + "</span></div>" +
      "<div><span>" + tr("Contrato") + "</span><span>" + tr("{m}/año", {m: fmtMoney(p.sal)}) + " · " + trn(p.yrs, "{n} temporada", "{n} temporadas") + (p.noRenew ? " · " + tr("no renovará") : "") + "</span></div>" +
      "<div><span>" + tr("Valor de mercado") + "</span><span>" + fmtMoney(pValue(p)) + "</span></div>" +
      "<div><span>" + tr("Temporada") + "</span><span>" + tr("{apps} PJ · {goals} G · {assists} A", {apps: st.apps, goals: st.g, assists: st.a}) + (st.rn ? " · " + tr("nota {rating}", {rating: dec(st.rs / st.rn)}) : "") + "</span></div>" +
      "<div><span>" + tr("En el club") + "</span><span>" + tr("desde {year}", {year: p.since}) + " · " + tr("{apps} PJ, {goals} G", {apps: p.tot.apps + st.apps, goals: p.tot.g + st.g}) + (p.yth ? " · " + tr("canterano") : "") + "</span></div>" +
      (p.tr ? "<div><span>" + tr("Carácter") + "</span><span>" + h(tr(TRAITS[p.tr])) + "</span></div>" : "") +
      (p.inj > S.tw ? "<div><span>" + tr("Estado") + '</span><span class="neg">' + h(p.injN ? tr(p.injN) : tr("Lesionado")) + " · " + tr("{n} sem.", {n: p.inj - S.tw}) + "</span></div>" : "") +
      (p.sus > 0 ? "<div><span>" + tr("Sanción") + '</span><span class="neg">' + trn(p.sus, "{n} partido", "{n} partidos") + "</span></div>" : "") +
      (p.prom ? "<div>" + tr("<span>Promesa</span><span>Le prometiste ser Clave</span>") + "</div>" : "") +
      "</div>";
    s += '<label class="lbl" style="margin-top:12px">' + tr("Rol en la plantilla") + '</label><div class="seg">' + ROLE_ORDER.map(function (r) { return '<button data-a="mrole" data-id="' + p.id + '" data-v="' + r + '" aria-pressed="' + (p.role === r) + '">' + tr(ROLES[r].n) + "</button>"; }).join("") + "</div>";
    s += '<p class="muted" style="font-size:12.5px;margin:6px 0 0">' + tr("Espera jugar alrededor del {pct} % de los minutos. Bajarle el rol le sienta mal.", {pct: Math.round(ROLES[p.role].s * 100)}) + "</p>";
    var zn = mZoneOf(p.id)[0];
    s += '<label class="lbl" style="margin-top:12px">' + tr("Convocatoria") + '</label><div class="kvlist"><div><span>' + (zn === "xi" ? tr("En el once titular") : zn === "bench" ? tr("En el banquillo") : tr("No convocado")) + "</span><span>" +
      (zn !== "bench" ? '<button class="btn sm" data-a="mzone" data-id="' + p.id + '" data-v="bench">' + tr("Al banquillo") + "</button> " : "") +
      (zn !== "nc" ? '<button class="btn sm" data-a="mzone" data-id="' + p.id + '" data-v="nc">' + tr("Dejar fuera") + "</button>" : "") + "</span></div></div>";
    s += '<div class="opts">';
    s += '<button class="btn wide" data-a="renpl" data-id="' + p.id + '">' + tr("Cambiar nombre") + "</button>";
    if (p.yrs <= 2 && !p.noRenew) s += '<button class="btn wide" data-a="mrenew" data-id="' + p.id + '"' + (p.rnT === now ? " disabled" : "") + ">" + (p.rnT === now ? tr("Renovar contrato (el próximo tramo)") : tr("Renovar contrato")) + "</button>";
    s += '<button class="btn wide" data-a="mtalk" data-id="' + p.id + '"' + (p.tkT === now ? " disabled" : "") + ">" + (p.tkT === now ? tr("Hablar con él (ya hablasteis)") : tr("Hablar con él")) + "</button>";
    s += '<button class="btn wide" data-a="msell" data-id="' + p.id + '"' + (open ? "" : " disabled") + ">" + (open ? tr("Escuchar ofertas") : tr("Escuchar ofertas (mercado cerrado)")) + "</button>";
    s += '<button class="btn wide" data-a="mlist" data-id="' + p.id + '">' + (p.list ? tr("Quitar de la lista de venta") : tr("Poner en la lista de venta")) + "</button>";
    if (p.age <= 23) s += '<button class="btn wide" data-a="mloan" data-id="' + p.id + '"' + (open ? "" : " disabled") + ">" + (open ? tr("Ceder una temporada") : tr("Ceder una temporada (mercado cerrado)")) + "</button>";
    s += '<button class="btn wide danger" data-a="mrelease" data-id="' + p.id + '">' + tr("Rescindir contrato") + "</button>";
    s += '<button class="btn wide" data-a="close">' + tr("Cerrar") + "</button></div>";
    return s;
  }
  /* si el elegido ya es titular en otro hueco, el que sale de este debe valer para aquel */
  function xiSwapOk(pid, i) {
    var m = S.m, xi = m.xi.indexOf(pid), cur = m.xi[i];
    if (xi < 0 || xi === i || cur == null || !mPl(cur)) return true;
    return posOk(mPl(cur).pos, FORMATIONS[m.form][xi]);
  }
  function slotSheet(i) {
    var m = S.m, sp = FORMATIONS[m.form][i], cur = m.xi[i];
    var all = m.sq.filter(function (p) { return !p.loanOut; });
    var l = all.filter(function (p) { return posOk(p.pos, sp) && (xiSwapOk(p.id, i)); }).sort(function (a, b) { return (mAvail(b) - mAvail(a)) || (mSlotEff(b, sp) - mSlotEff(a, sp)); });
    var hid = all.length - l.length;
    var s = "<h2>" + h(posName(sp)) + '</h2><p class="muted" style="margin:-6px 0 10px;font-size:13px">' + tr("Elige quién juega en este puesto. Si ya era titular en otro hueco, se intercambian.") + (hid ? " " + trn(hid, "{n} jugador no aparece porque no puede jugar ahí.", "{n} jugadores no aparecen porque no pueden jugar ahí.") : "") + '</p><div class="list" style="max-height:62vh">';
    s += l.map(function (p) {
      var eff = Math.round(p.ovr - posFit(p.pos, sp)), xi = m.xi.indexOf(p.id);
      var zn = xi >= 0 ? (xi !== i ? tr("Titular de {p}", {p: posAb(FORMATIONS[m.form][xi])}) + " · " : "") : (m.bench || []).indexOf(p.id) >= 0 ? tr("Banquillo") + " · " : tr("No convocado") + " · ";
      return '<button class="pickrow" data-a="setslot" data-i="' + i + '" data-id="' + p.id + '" aria-pressed="' + (p.id === cur) + '"' + (mAvail(p) ? "" : ' style="opacity:.55"') + '><span class="pp">' + h(posAb(p.pos)) + '</span><div class="grow"><b>' + h(plName(p)) + plTags(p) + "</b><small>" + zn + tr("físico {f} · moral {m}", {f: Math.round(p.fit), m: Math.round(p.mor)}) + '</small></div><span class="lvl">' + eff + "</span></button>";
    }).join("");
    s += "</div>";
    if (cur != null && mPl(cur)) s += '<button class="btn wide" style="margin-top:12px" data-a="pl" data-id="' + cur + '">' + tr("Ver la ficha de {n}", {n: h(plShort(mPl(cur)))}) + "</button>";
    return s + '<button class="btn wide" style="margin-top:8px" data-a="close">' + tr("Cerrar") + "</button>";
  }
  function pickClubSheet(t) {
    var max = mgrMaxClubR(), li = t.lg != null ? t.lg : curLeague();
    var cl = teamsOfLeague(li).sort(function (a, b) { return S.cr[b] - S.cr[a]; });
    var s = "<h2>" + tr("Buscar banquillo") + '</h2><p class="muted" style="margin:-6px 0 10px;font-size:13px">' + tr("Con tu prestigio puedes dirigir clubes de nivel {n} o menos.", {n: Math.round(max)}) + "</p>" + leagueSelect("pcl", li) + '<div class="list" style="margin-top:10px;max-height:56vh">';
    s += cl.map(function (c) {
      var ok = S.cr[c] <= max && c !== S.m.club;
      return '<button class="pickrow" data-a="takejob" data-v="' + c + '"' + (ok ? "" : " disabled") + ">" + crest(c, true) + '<div class="grow"><b>' + h(clubName(c)) + "</b><small>" + (ok ? tr("Presupuesto {m}", {m: fmtMoney(mBudgetFor(c))}) : c === S.m.club ? tr("Tu club actual") : tr("Te falta prestigio")) + '</small></div><span class="lvl">' + Math.round(S.cr[c]) + "</span></button>";
    }).join("");
    return s + '</div><button class="btn wide" style="margin-top:12px" data-a="close">' + tr("Cerrar") + "</button>";
  }
  function exportCode() {
    UI.sheet = {k: "export", code: null}; renderSheet();
    pack(serialize()).then(function (pk) { UI.sheet.code = "CAMINO1:" + (pk.z ? "z:" : "j:") + (pk.z ? pk.d : b64(new TextEncoder().encode(pk.d))); renderSheet(); });
  }
  function importCode(txt) {
    txt = (txt || "").trim();
    var m = /^CAMINO1:(z|j):([A-Za-z0-9+/=\s]+)$/.exec(txt);
    if (!m) { UI.sheet.err = tr("Ese código no parece de esta app. Debe empezar por CAMINO1:"); renderSheet(); return; }
    var data = m[2].replace(/\s+/g, "");
    var p = m[1] === "z" ? unpack(true, data) : Promise.resolve(new TextDecoder().decode(unb64(data)));
    p.then(function (json) {
      var s0 = JSON.parse(json);
      if (!s0 || !s0.cr || !(s0.p || s0.m)) throw new Error("no válida");
      switchGame(function () {
        try { restore(json); } catch (e) { toast(tr("No se pudo leer el código. Comprueba que lo has pegado entero.")); return; }
        enterGame(); persist(); refreshSlots(); render(true); toast(tr("Partida cargada"));
      });
    }).catch(function () { UI.sheet.err = tr("No se pudo leer el código. Comprueba que lo has pegado entero."); renderSheet(); });
  }
  function closeSheet() {
    if (UI.sheet && UI.sheet.k === "pend" && S && S.pend[0] && S.pend[0].k === "clausm") return;
    if (UI.sheet && UI.sheet.k === "pend" && S && S.pend[0] && S.pend[0].ui) { S.pend.shift(); persist(); }
    UI.sheet = null;
  }
  function openPend(ok, msg) {
    if (ok) { UI.sheet = {k: "pend"}; persist(); render(false); }
    else if (msg) toast(msg);
  }

  /* ---------- cambiar de partida, cargar y borrar ---------- */
  function refreshSlots() { UI.slots = Store.index(); Store.list().then(function (l) { UI.slots = l; if (UI.view === "home" || UI.view === "load") render(false); }); }
  /* antes de cambiar de partida, la actual queda comprimida en su ranura */
  /* guardar la partida actual antes de cambiar; si el guardado tarda o falla, se sigue igualmente (antes se quedaba esperando) */
  function switchGame(fn) {
    var done = false, go = function () { if (done) return; done = true; fn(); };
    var pr; try { pr = S ? Store.flush() : null; } catch (e) { pr = null; }
    if (pr && typeof pr.then === "function") { pr.then(go, go); setTimeout(go, 1500); } else go();
  }
  function enterGame() {
    UI.exp = {}; UI.wl = null; UI.flash = null; UI.sheet = null; UI.cr = null;
    UI.view = S.ph === "draft" ? "draft" : "game"; UI.tab = isMgr() ? "club" : "carrera";
  }
  /* ---------- anuncios (solo en la app de Android; en la web no hay) ----------
     Se muestran en las transiciones: empezar partida, volver al menú, cargar partida y pasar de jugador a entrenador.
     Mínimo 60 s entre anuncios para no encadenarlos (p. ej. menú → cargar). */
  var AD_GAP = 60000, lastAd = 0;
  var NO_ADS = false; /* build.py lo pone a true en la versión sin anuncios */
  function showAd(where) {
    var B = window.AndroidBridge;
    if (NO_ADS || !B || !B.showAd || Date.now() - lastAd < AD_GAP) return;
    try { if (B.showAd(String(where))) lastAd = Date.now(); } catch (e) {}
  }
  function adPrivacyRequired() {
    var B = window.AndroidBridge;
    try { return !!(B && B.privacyOptionsRequired && B.privacyOptionsRequired()); } catch (e) { return false; }
  }
  /* aviso de actualización: la app de Android pregunta a Google Play y llama a caminoUpdate(versión) */
  window.caminoUpdate = function (code, name) {
    if (!code) return;
    UI.upd = {code: +code, name: name ? String(name).replace(/[^0-9.]/g, "").slice(0, 12) : ""};
    if (UI.view === "home") render(false);
    if (UI.updShown) return;
    UI.updShown = true;
    UI.sheet = {k: "update"}; renderSheet();
  };
  function updBanner(inMenu) {
    if (!UI.upd) return "";
    return '<section class="updbar' + (inMenu ? " inmenu" : "") + '"><div class="ui">' + ICON.play + '</div><div class="grow"><b>' + (UI.upd.name ? tr("Versión {v} disponible", {v: h(UI.upd.name)}) : tr("Nueva versión disponible")) + "</b><small>" + tr("Actualiza desde Google Play. Tus partidas se conservan.") + '</small></div><button class="btn pri sm" data-a="doupdate">' + tr("Actualizar") + "</button></section>";
  }
  function loadSlot(id) {
    if (S && S.uid === id) { enterGame(); render(true); showAd("load"); return; }
    switchGame(function () {
      Store.load(id).then(function (json) {
        if (!json) throw new Error("vacía");
        restore(json); enterGame(); persist(); render(true); showAd("load");
      }).catch(function (e) { console.error(e); toast(tr("No se pudo cargar esa partida.")); refreshSlots(); });
    });
  }
  function setLangUI(l) {
    setLang(l);
    if (UI.view === "lang") UI.view = "home";
    render(false);
  }

  /* ======================= PARCHE 2.0: interfaz ======================= */
  /* ---------- objetivos a elegir ---------- */
  function objPill(o) { return o && o.lv != null ? ' <span class="dpill d' + o.lv + '">' + h(objLabel(o)) + "</span>" : ""; }
  function objsCard(x) {
    var o = '<section class="card decision"><div class="head"><span class="tag real"><span class="dot"></span>' + tr("Objetivos") + '</span><span class="eyebrow">' + tr("Temporada {season}", {season: seasonLabel(S.yr)}) + "</span></div>";
    o += "<h3>" + tr("Elige tus objetivos de la temporada") + '</h3><p class="lead">' + (isMgr() ? tr("La dificultad depende de la media de tu plantilla y de tu prestigio. Cuanto más difícil, más te lo agradecerá la directiva.") : tr("La dificultad depende de tu media y de tu contrato con el club. Cuanto más difícil, mayor recompensa si lo cumples.")) + "</p>";
    x.cats.forEach(function (c, ci) {
      o += '<div class="objcat"><div class="lbl">' + h(tr(c.n)) + '</div><div class="objopts">';
      c.list.forEach(function (ob, oi) {
        o += '<button class="objopt" data-a="objsel" data-c="' + ci + '" data-i="' + oi + '" aria-pressed="' + (x.sel[ci] === oi) + '"><span>' + h(objName(ob)) + '</span><span class="dpill d' + ob.lv + '">' + h(objLabel(ob)) + "</span></button>";
      });
      o += "</div></div>";
    });
    return o + '<button class="go" style="margin-top:12px" data-a="objok">' + tr("Confirmar objetivos") + " " + ICON.play + "</button></section>";
  }
  /* ---------- mote ---------- */
  function nickLine(o) { var n = nickName(o); return n ? '<p class="nick">' + tr("La afición te llama «{nick}»", {nick: h(n)}) + "</p>" : ""; }
  /* ---------- escudo y equipación del club propio ---------- */
  function clubLookFields(c, ab) {
    if (typeof CREST_SHAPES === "undefined") return "";
    var s = '<div><label class="lbl">' + tr("Forma del escudo") + '</label><div class="shapes">' + CREST_SHAPES.map(function (x) {
      return '<button class="shape" data-a="ccrest" data-k="shape" data-v="' + x[0] + '" aria-pressed="' + (c.crest.shape === x[0]) + '" title="' + h(tr(x[1])) + '">' + crestSVG({shape: x[0], pat: c.crest.pat, col: c.col, ab: ab, big: true}) + "</button>";
    }).join("") + "</div></div>";
    s += '<div><label class="lbl">' + tr("Diseño del escudo") + '</label><div class="chips">' + CREST_PATS.map(function (x) {
      return '<button class="chipb" data-a="ccrest" data-k="pat" data-v="' + x[0] + '" aria-pressed="' + (c.crest.pat === x[0]) + '">' + h(tr(x[1])) + "</button>";
    }).join("") + "</div></div>";
    s += '<div><label class="lbl">' + tr("Equipación") + '</label><div class="shapes">' + KIT_PATS.map(function (x) {
      return '<button class="shape kit" data-a="ckit" data-v="' + x[0] + '" aria-pressed="' + (c.kit.pat === x[0]) + '" title="' + h(tr(x[1])) + '">' + kitSVG({pat: x[0], col: [c.col[0], c.col[1], c.kit.col3]}) + "</button>";
    }).join("") + "</div></div>";
    s += '<div><label class="lbl">' + tr("Color de los detalles") + '</label><div class="swatches">' + CLUB_COLS.map(function (col) { return '<button class="sw" data-a="ccol" data-k="2" data-v="' + col + '" style="background:' + col + '" aria-pressed="' + (c.kit.col3 === col) + '" aria-label="' + col + '"></button>'; }).join("") + "</div></div>";
    return s;
  }
  /* ---------- red social ---------- */
  function socUnread() { if (!S || !S.soc) return 0; return Math.max(0, S.soc.posts.length - (S.soc.seen || 0)); }
  function socWhen(p) { return seasonLabel(p.y) + (p.ph === "blk" || p.ph === "gap" ? " · " + tr(BLOCKS[Math.min(4, p.bi)][2]) : ""); }
  function socText(p) {
    var tp = Object.assign({}, p.tp);
    if (tp.nick) tp.nick = tr(tp.nick, {ln: tp.nickLn || ""});
    if (tp.quote) tp.quote = tr(tp.quote, tp.quoteTp || {});
    if (tp.choice) tp.choice = String(tp.choice);
    return tr(p.tk, tp);
  }
  function socPostHTML(p) {
    var a = p.au || {}, acc = a.id ? socAcc(a.id) : null, prof = S.soc.prof, nm, hd, av, col = "#2b3b40", ver = false;
    if (acc) { nm = acc.name; hd = acc.handle; av = acc.av; col = acc.col || col; ver = !!acc.verified; }
    else if (a.self) { nm = prof.name; hd = prof.handle; av = prof.av; col = prof.col; ver = socFollowers() >= 100; }
    else if (a.club != null) { nm = a.n; hd = a.hd; av = ""; ver = true; }
    else { nm = a.n; hd = a.hd; av = a.av || "🙂"; }
    var avHTML = a.club != null && W.clubs[a.club] ? '<span class="sav">' + crest(a.club) + "</span>" : '<span class="sav" style="background:' + h(col) + '">' + h(av) + "</span>";
    return '<article class="spost' + (p.m < 0 ? " neg" : p.m > 0 ? " posm" : "") + '">' + avHTML + '<div class="sbody"><div class="shead"><b>' + h(nm) + "</b>" + (ver ? '<span class="sver" aria-label="' + h(tr("Verificado")) + '">✔</span>' : "") + '<span class="shd">@' + h(hd) + " · " + h(socWhen(p)) + "</span></div>" +
      '<p class="stext">' + h(socText(p)) + '</p><div class="sstats"><span>♥ ' + h(fmtCount(p.lk)) + "</span><span>⟲ " + h(fmtCount(p.rt)) + "</span></div></div></article>";
  }
  function fmtCount(n) { return n >= 1e6 ? fmtDec(n / 1e6, 1) + "M" : n >= 1e3 ? fmtDec(n / 1e3, 1) + "k" : String(n); }
  function tabRed() {
    var soc = socInit(), prof = soc.prof, fol = socFollowers();
    soc.seen = soc.posts.length;
    var s = '<div class="stack"><section class="card sprof"><div class="sban" style="background:' + h(prof.col) + '"></div><div class="sinfo"><div class="srow"><span class="sav big" style="background:' + h(prof.col) + '">' + h(prof.av) + '</span><button class="btn sm" data-a="socedit">' + tr("Editar perfil") + "</button></div>";
    s += '<h3 style="margin:6px 0 0">' + h(prof.name) + (fol >= 100 ? ' <span class="sver">✔</span>' : "") + '</h3><div class="muted">@' + h(prof.handle) + "</div>";
    if (prof.bio) s += '<p style="margin:8px 0 0">' + h(prof.bio) + "</p>";
    var n = nickName(isMgr() ? S.m : S.p);
    if (n) s += '<p class="muted" style="margin:6px 0 0;font-size:13px">' + tr("Para la afición: «{nick}»", {nick: h(n)}) + "</p>";
    s += '<div class="sfol"><span><b>' + h(fmtFol(fol)) + "</b> " + tr("seguidores") + "</span><span><b>" + (180 + (hashStr(prof.handle) % 400)) + "</b> " + tr("siguiendo") + "</span></div></div></section>";
    if (!soc.posts.length) s += '<p class="empty">' + tr("Todavía no se habla de ti. Juega unos partidos y las redes empezarán a echar humo.") + "</p>";
    else s += '<section class="sfeed">' + soc.posts.slice(0, 80).map(socPostHTML).join("") + "</section>";
    return s + "</div>";
  }
  function socDraft() {
    var g = function (id) { var e = document.getElementById(id); return e ? e.value : null; };
    if (UI.sheet && UI.sheet.k === "socedit" && g("sname") != null) UI.sheet.d = {name: g("sname"), handle: g("shandle"), bio: g("sbio"), av: (UI.sheet.d || {}).av, col: (UI.sheet.d || {}).col};
  }
  function socEditHTML() {
    var p = Object.assign({}, S.soc.prof, UI.sheet.d || {});
    Object.keys(p).forEach(function (k) { if (p[k] == null) p[k] = S.soc.prof[k]; });
    return "<h2>" + tr("Editar perfil") + '</h2><div class="stack"><div><label class="lbl" for="sname">' + tr("Nombre") + '</label><input type="text" id="sname" value="' + h(p.name) + '" maxlength="30" autocomplete="off"></div>' +
      '<div><label class="lbl" for="shandle">' + tr("Usuario") + '</label><input type="text" id="shandle" value="' + h(p.handle) + '" maxlength="15" autocomplete="off"></div>' +
      '<div><label class="lbl" for="sbio">' + tr("Biografía") + '</label><textarea id="sbio" maxlength="140" style="min-height:70px">' + h(p.bio) + "</textarea></div>" +
      '<div><label class="lbl">' + tr("Avatar") + '</label><div class="chips">' + SOC_AV.map(function (a) { return '<button class="chipb av" data-a="socav" data-v="' + h(a) + '" aria-pressed="' + (p.av === a) + '">' + h(a) + "</button>"; }).join("") + "</div></div>" +
      '<div><label class="lbl">' + tr("Color del perfil") + '</label><div class="swatches">' + SOC_COL.map(function (c) { return '<button class="sw" data-a="soccol" data-v="' + c + '" style="background:' + c + '" aria-pressed="' + (p.col === c) + '" aria-label="' + c + '"></button>'; }).join("") + "</div></div>" +
      '<div class="row2"><button class="btn wide" data-a="close">' + tr("Cancelar") + '</button><button class="btn pri wide" data-a="socsave">' + tr("Guardar") + "</button></div></div>";
  }
  /* ---------- minijuego de penaltis y faltas ---------- */
  function doMini(i, kind) {
    var x = S.pend[0]; if (!x) return;
    var p = S.p, at = attrs(), f = S.cur && S.cur.pm && S.cur.pm[x.fi];
    var gk = f ? Math.round(f.or || 70) : 70, imp = f ? f.imp || 1 : 1;
    var skill = Math.round(kind === "fk" ? ((at.TIR || p.ovr) * 0.6 + (at.PAS || p.ovr) * 0.4) : (at.TIR || p.ovr));
    var opts = {skill: clamp(skill, 40, 95), gk: clamp(gk, 40, 95), pressure: clamp(imp / 3, 0.1, 1), dist: 22, rand: R};
    if (kind === "gkpen" || kind === "gkfk") {
      var me = Math.round(((at.REF || p.ovr) + (at.EST || at.COL || p.ovr)) / 2);
      var gopts = {gk: clamp(me, 40, 95), skill: clamp(gk, 40, 95), pressure: opts.pressure, dist: 18 + Math.floor(R() * 10), rand: R};
      var save = function (res) { FORCE_OUT = !res.scored; doChoose(i); };
      if (kind === "gkfk") Minigame.gkFreekick(gopts, save); else Minigame.gkPenalty(gopts, save);
      return;
    }
    var go = function (res) { FORCE_OUT = !!res.scored; doChoose(i); };
    if (kind === "fk") Minigame.freekick(opts, go); else Minigame.penalty(opts, go);
  }
  /* ---------- partido en directo ---------- */
  var LV = null;
  function openLive() {
    if (!S || !S.live) { S.liveReq = null; return; }
    S.liveReq = null;
    closeLive(true);
    var el = document.createElement("div"); el.id = "live"; el.className = "live"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true");
    document.body.appendChild(el);
    LV = {el: el, speed: 1, run: true, sel: null, timer: null};
    liveRender();
    liveTick();
  }
  function closeLive(silent) {
    if (LV && LV.timer) clearTimeout(LV.timer);
    if (typeof Pitch !== "undefined") Pitch.destroy();
    var el = document.getElementById("live"); if (el) el.remove();
    LV = null;
    setTimeout(flushNtf, 400);
  }
  /* cambios en directo: 1) quién sale (↓ rojo), 2) quién entra entre los compatibles (↑ verde), 3) vista previa y confirmar */
  function liveSubsH(L, slots) {
    var si = LV.sel != null ? L.xi.indexOf(LV.sel) : -1, sp = si >= 0 ? slots[si] : null;
    if (si < 0) { LV.sel = null; LV.pin = null; }
    var step = LV.sel == null ? 1 : LV.pin == null ? 2 : 3;
    var s = '<div class="lsubhd"><span class="lbl">' + tr("Cambios") + '</span><ol class="lsteps">' +
      [tr("Quién sale"), tr("Quién entra"), tr("Confirmar")].map(function (t, k) { return '<li class="' + (k + 1 < step ? "done" : k + 1 === step ? "now" : "") + '">' + h(t) + "</li>"; }).join("") + "</ol></div>";
    if (step === 3) {
      var po = mPl(LV.sel), pi = mPl(LV.pin), xy = FORM_XY[L.form] || [];
      s += '<div class="lprev"><div class="lprevp" aria-hidden="true">' + slots.map(function (sl, k) {
        var id = k === si ? LV.pin : L.xi[k], p = mPl(id), c = xy[k] || [50, 50];
        return '<i class="' + (k === si ? "in" : "") + (id === L.red ? " red" : "") + '" style="left:' + c[0] + "%;top:" + c[1] + '%"><b>' + h(posAb(sl)) + "</b><span>" + h(p ? p.ln : "") + "</span></i>";
      }).join("") + "</div>" +
        '<div class="lswap"><div class="out"><span class="ar">↓</span><div><small>' + tr("Sale") + "</small><b>" + h(plName(po)) + "</b></div></div>" +
        '<div class="in"><span class="ar">↑</span><div><small>' + tr("Entra de {pos}", {pos: posAb(sp)}) + "</small><b>" + h(plName(pi)) + "</b>" +
        (pi && pi.pos !== sp ? '<em class="aff">' + tr("Posición afín ({p})", {p: posAb(pi.pos)}) + "</em>" : "") + "</div></div></div>" +
        '<div class="lprevb"><button class="btn" data-a="lsubx">' + tr("Cancelar") + '</button><button class="go" data-a="lsubok">' + tr("Confirmar cambio") + "</button></div></div>";
      return s;
    }
    s += '<div class="lsubs"><div><div class="lbl">' + tr("En el campo") + "</div>" + L.xi.map(function (id, i) {
      var p = mPl(id); if (!p) return "";
      var on = LV.sel === id;
      return '<button class="lpl' + (on ? " on out" : "") + (id === L.red ? " red" : "") + (id === L.hurt ? " hurt" : "") + (L.yc && L.yc[id] && id !== L.red ? " yc" : "") + '" data-a="lout" data-id="' + id + '"' + (id === L.red ? " disabled" : "") + ' aria-pressed="' + on + '"><span class="pp">' + h(posAb(slots[i])) + "</span>" + (on ? '<span class="ar">↓</span>' : "") + h(plShort(p)) + '<span class="fit">' + Math.round(p.fit) + "</span></button>";
    }).join("") + "</div>";
    s += '<div><div class="lbl">' + tr("Banquillo") + "</div>";
    if (!L.bench.length) s += '<p class="muted" style="font-size:13px">' + tr("Sin suplentes") + "</p>";
    else if (sp == null) s += L.bench.map(function (id) { var p = mPl(id); return p ? '<div class="lpl ghost"><span class="pp">' + h(posAb(p.pos)) + "</span>" + h(plShort(p)) + '<span class="fit">' + Math.round(p.ovr) + "</span></div>" : ""; }).join("");
    else {
      var ok = L.bench.filter(function (id) { var p = mPl(id); return p && posOk(p.pos, sp); });
      s += ok.map(function (id) {
        var p = mPl(id);
        return '<button class="lpl cand" data-a="lin" data-id="' + id + '"><span class="pp">' + h(posAb(p.pos)) + '</span><span class="ar">↑</span>' + h(plShort(p)) + '<span class="fit">' + Math.round(p.ovr) + "</span>" + (p.pos === sp ? "" : '<em class="aff">' + tr("afín") + "</em>") + "</button>";
      }).join("");
      if (!ok.length) s += '<p class="muted" style="font-size:12.5px">' + tr("Nadie en el banquillo puede jugar de {pos}.", {pos: posAb(sp)}) + "</p>";
      var hid = L.bench.length - ok.length;
      if (hid && ok.length) s += '<p class="muted" style="font-size:12px;margin:2px 0 0">' + trn(hid, "{n} suplente oculto: no puede jugar de {pos}.", "{n} suplentes ocultos: no pueden jugar de {pos}.").replace("{pos}", h(posAb(sp))) + "</p>";
    }
    s += "</div></div>";
    s += '<p class="lhint">' + (step === 1 ? tr("Toca al jugador que quieres sacar. El partido se pausa mientras haces el cambio.") : tr("Elige quién entra. Solo ves a quien puede jugar en su puesto.")) + "</p>";
    return s;
  }
  function subDone() { if (LV && LV.resume) { LV.resume = false; LV.run = true; liveTick(); } }
  function liveTick() {
    if (!LV) return;
    if (LV.timer) clearTimeout(LV.timer);
    var L = S.live;
    if (!L || L.done || !LV.run) { liveRender(); return; }
    LV.timer = setTimeout(function () {
      if (!LV || !S.live) return;
      var ev = liveStep();
      livePitchFeed(ev);
      if (ev.some(function (e) { return e.t === "half"; })) LV.run = false;
      if (ev.some(function (e) { return e.t === "goal" || e.t === "red" || e.t === "inj"; }) && LV.speed > 1) LV.run = LV.speed < 4;
      liveRender();
      liveTick();
    }, Math.max([0, 700, 340, 120][LV.speed] || 700, typeof Pitch !== "undefined" ? Pitch.busy() : 0));
  }
  function liveRender() {
    if (!LV || !S.live) return;
    var L = S.live, f = S.cur.pm[L.fi], m = S.m, tot = (L.poss[0] + L.poss[1]) || 1, pu = Math.round(L.poss[0] / tot * 100);
    var us = '<span class="lteam">' + crest(m.club) + "<b>" + h(clubName(m.club)) + "</b></span>", them = '<span class="lteam r"><b>' + h(clubName(f.opp)) + "</b>" + crest(f.opp) + "</span>";
    var sc = f.home ? us + '<span class="lsc num">' + L.gu + " - " + L.gt + "</span>" + them : them.replace(' r"', '"') + '<span class="lsc num">' + L.gt + " - " + L.gu + "</span>" + us.replace('"lteam"', '"lteam r"');
    var s = '<div class="lhead"><span class="lmin num">' + (L.done ? tr("Final") : L.min + "'") + "</span>" + '<span class="muted">' + h(compShort(f)) + "</span></div>";
    s += '<div class="lscore">' + sc + "</div>";
    var cu = liveCol(m.club, f.opp), poss = (L.poss[0] + L.poss[1]) ? Math.round(L.poss[0] / (L.poss[0] + L.poss[1]) * 100) : 50, mo = L.mo == null ? pu : Math.round(L.mo);
    var gls = function (us) { var l = (L.gl || []).filter(function (g) { return g.us === us; }); return l.length ? l.map(function (g) { return h(g.n) + " " + g.min + "'"; }).join(", ") : ""; };
    var lg = gls(1), rg = gls(0);
    if (lg || rg) s += '<div class="lgoals"><span>' + (f.home ? (lg ? "⚽ " + lg : "") : (rg ? "⚽ " + rg : "")) + '</span><span class="r">' + (f.home ? (rg ? rg + " ⚽" : "") : (lg ? lg + " ⚽" : "")) + "</span></div>";
    var top = s; s = "";
    /* barra de posesión con los colores de los clubes: se mueve hacia quien tiene el balón */
    var left = f.home ? mo : 100 - mo, bx = L.bx == null ? 50 : (f.home ? L.bx : 100 - L.bx);
    var cl = f.home ? cu[0] : cu[1], cr = f.home ? cu[1] : cu[0];
    s += '<div class="lmo" role="img" aria-label="' + h(tr("Posesión")) + '"><div class="lmot"><i class="a" style="width:' + (LV.mo == null ? left : LV.mo) + '%;background:' + cl + '"></i><i class="b" style="background:' + cr + '"></i><span class="lball" style="left:' + (LV.bx == null ? bx : LV.bx) + '%">⚽</span></div>' +
      '<div class="lmol"><span>' + (f.home ? poss : 100 - poss) + ' %</span><span class="muted">' + tr("Posesión") + "</span><span>" + (f.home ? 100 - poss : poss) + " %</span></div></div>";
    LV.moN = left; LV.bxN = bx;
    /* línea del tiempo con las ocasiones */
    var mx = Math.max(90 + (L.add || 0), L.min);
    s += '<div class="ltl"><div class="ltlt"><i class="now" style="width:' + Math.min(100, L.min / mx * 100) + '%"></i><i class="ht" style="left:' + (45 / mx * 100) + '%"></i>' +
      (L.ch || []).map(function (c) { var up = (c.us === 1) === !!f.home; return '<b class="' + c.k + (up ? " up" : " dn") + '" style="left:' + (c.min / mx * 100) + "%;background:" + (c.us === 1 ? cu[0] : cu[1]) + '" title="' + c.min + "'\"></b>"; }).join("") + "</div></div>";
    var st = function (lab, a, b) { return '<div><span>' + lab + '</span><b class="num">' + (f.home ? a + " – " + b : b + " – " + a) + "</b></div>"; };
    s += '<div class="lstats three">' + st(tr("Tiros"), L.shots[0], L.shots[1]) + st(tr("A puerta"), L.on[0], L.on[1]) + st(tr("Ocasiones claras"), (L.big || [0, 0])[0], (L.big || [0, 0])[1]) + "</div>";
    var ICO = {goal: "⚽", save: "🧤", miss: "💨", post: "🥅", com: "🎙️", yellow: "🟨", red: "🟥", inj: "🚑", sub: "🔁", tac: "📋", half: "⏱️", end: "🏁"};
    s += '<div class="lbl" style="margin-top:12px">' + tr("Comentarios") + '</div><div class="lfeed">' + L.ev.slice(0, 18).map(function (e) { return '<div class="lev ' + e.t + (e.us === 1 ? " us" : e.us === 0 ? " them" : "") + '"' + (e.us === 1 ? ' style="--tc:' + cu[0] + '"' : e.us === 0 ? ' style="--tc:' + cu[1] + '"' : "") + '><span class="num">' + e.min + "'</span><span class=\"li\">" + (ICO[e.t] || "•") + "</span><span class=\"lt\">" + h(e.txt) + "</span></div>"; }).join("") + "</div>";
    var dyn = s; s = "";
    if (!L.done) {
      s += '<div class="lctl"><div class="seg">' + [[0, "⏸"], [1, "▶"], [2, "▶▶"], [3, "▶▶▶"]].map(function (x) { return '<button data-a="lspeed" data-v="' + x[0] + '" aria-pressed="' + ((x[0] === 0 && !LV.run) || (LV.run && LV.speed === x[0])) + '" aria-label="' + (x[0] ? tr("Velocidad {n}", {n: x[0]}) : tr("Pausa")) + '">' + x[1] + "</button>"; }).join("") + "</div></div>";
      s += '<div class="lbl">' + tr("Mentalidad") + '</div><div class="seg lment">' + ["bus", 0, 1, 2, "press"].map(function (v) { return '<button data-a="lment" data-v="' + v + '" aria-pressed="' + (String(L.ment) === String(v)) + '">' + h(liveMentName(v)) + "</button>"; }).join("") + "</div>";
      if (typeof LIVE_TAC !== "undefined" && typeof liveTac === "function") {
        var tac = liveTac(L);
        s += '<div class="ltac">' + Object.keys(LIVE_TAC).map(function (k) { return '<div class="ltacr"><span class="lbl">' + h(tr(LIVE_TAC[k].n)) + '</span><div class="seg sm">' + LIVE_TAC[k].o.map(function (o, i) { return '<button data-a="ltac" data-k="' + k + '" data-v="' + i + '" aria-pressed="' + (tac[k] === i) + '">' + h(tr(o)) + "</button>"; }).join("") + "</div></div>"; }).join("") + "</div>";
      }
      s += '<div class="lrow"><label class="lbl" for="lform">' + tr("Sistema") + '</label><select id="lform" data-live="form">' + Object.keys(FORMATIONS).map(function (k) { return '<option value="' + k + '"' + (k === L.form ? " selected" : "") + ">" + k + "</option>"; }).join("") + "</select>" +
        '<span class="muted" style="font-size:13px">' + trn(L.left, "Te queda {n} cambio", "Te quedan {n} cambios") + "</span></div>";
      if (L.left > 0) {
        var slots = FORMATIONS[L.form];
        s += liveSubsH(L, slots);
      }
    }
    s += L.done ? '<button class="go" data-a="lend">' + tr("Volver al vestuario") + " " + ICON.play + "</button>" : '<button class="btn wide" data-a="lsim">' + tr("Simular lo que queda") + "</button>";
    if (!LV.el.querySelector("#lvbody")) {
      LV.el.innerHTML = '<div class="lpanel"><div id="lvtop"></div><div class="lpitchw" id="lvpitch"></div><div id="lvbody"></div><div id="lvctl"></div></div>';
      LV.ctlKey = null;
      if (typeof Pitch !== "undefined") Pitch.mount(document.getElementById("lvpitch"), {cols: [f.home ? cu[0] : cu[1], f.home ? cu[1] : cu[0]], spdLabel: tr("Velocidad de simulación"),
        lab: {goal: tr("GOL"), goalOf: tr("¡GOL DE {n}!"), post: tr("¡PALO!"), half: tr("FIN DEL PRIMER TIEMPO"), end: tr("FINAL"), off: tr("FUERA DE JUEGO"), foul: tr("FALTA"), thr: tr("SAQUE DE BANDA"), cor: tr("CÓRNER"), gk: tr("SAQUE DE PUERTA")},
        onSpeed: function (n) { if (!LV) return; LV.speed = n; LV.run = true; LV.resume = false; liveTick(); liveRender(); }});
    }
    document.getElementById("lvtop").innerHTML = top;
    document.getElementById("lvbody").innerHTML = dyn;
    /* los controles solo se redibujan si cambian: así los botones no desaparecen bajo el dedo en cada minuto */
    var ck = [L.done, LV.run, LV.speed, String(L.ment), L.form, L.left, LV.sel, LV.pin, L.red, L.hurt, L.xi.join(","), L.bench.join(","), JSON.stringify(L.tac || {}), Math.floor((L.min || 0) / 5)].join("|");
    if (ck !== LV.ctlKey) { LV.ctlKey = ck; document.getElementById("lvctl").innerHTML = s; }
    livePitchTeams();
    if (typeof Pitch !== "undefined") Pitch.freeze(!LV.run && !L.done);
    /* animar la barra desde donde estaba */
    var mt = LV.el.querySelector(".lmot .a"), bl = LV.el.querySelector(".lball");
    LV.mo = LV.moN; LV.bx = LV.bxN;
    var moN = LV.moN, bxN = LV.bxN; requestAnimationFrame(function () { if (mt) mt.style.width = moN + "%"; if (bl) bl.style.left = bxN + "%"; });
  }
  /* dorsales fijos de tu plantilla */
  function myNums() {
    var m = S.m, nums = m.nums = m.nums || {}, used = {}, STD = {POR: [1, 13, 25], LD: [2, 12], LI: [3, 23], DFC: [4, 5, 15, 24], MCD: [6, 16], MC: [8, 14, 18], MCO: [10, 20], MD: [7, 17], MI: [11, 21], ED: [7, 17], EI: [11, 21], DC: [9, 19, 22]};
    var ids = {}; m.sq.forEach(function (p) { ids[p.id] = 1; });
    Object.keys(nums).forEach(function (k) { if (!ids[k]) delete nums[k]; else used[nums[k]] = 1; });
    m.sq.slice().sort(function (a, b) { return b.ovr - a.ovr; }).forEach(function (p) {
      if (nums[p.id]) return;
      var n = (STD[p.pos] || []).filter(function (x) { return !used[x]; })[0];
      if (!n) { n = 26; while (used[n]) n++; }
      nums[p.id] = n; used[n] = 1;
    });
    return nums;
  }
  function livePitchTeams() {
    if (typeof Pitch === "undefined" || !S.live) return;
    var L = S.live, f = S.cur.pm[L.fi], slots = FORMATIONS[L.form] || FORMATIONS["4-3-3"], nums = myNums();
    var mine = L.xi.map(function (id, i) { var p = id == null ? null : mPl(id); return id == null ? null : {id: id, pos: slots[i], gone: id === L.red, nm: p ? p.ln : ""}; });
    var os = FORMATIONS["4-3-3"], theirs = (L.oxi || []).map(function (o, i) { return {id: "o" + i, pos: os[i] || "MC", nm: o.n || ""}; });
    var fixed = {}; mine.forEach(function (p) { if (p) fixed[p.id] = nums[p.id]; });
    if (f.home) Pitch.teams(mine, theirs, [fixed, null]); else Pitch.teams(theirs, mine, [null, fixed]);
  }
  function livePitchFeed(ev) {
    if (typeof Pitch === "undefined" || !S.live) return;
    var L = S.live, f = S.cur.pm[L.fi], me = f.home ? 0 : 1;
    ev.forEach(function (e) {
      if (e.us == null && e.t !== "half" && e.t !== "end") return;
      var side = e.us === 1 ? me : e.us === 0 ? 1 - me : 0, who = null;
      if (e.us === 1 && e.pid != null) { who = L.xi.indexOf(e.pid); if (who < 0) who = null; }
      if (e.us === 0 && e.ox != null && e.ox >= 0) who = e.ox;
      Pitch.event({t: e.t, side: side, who: who, k: e.k, txt: e.txt});
    });
    Pitch.state({own: L.own === 0 ? me : 1 - me, bx: f.home ? L.bx : 100 - L.bx, speed: LV ? LV.speed : 1});
  }
  /* colores de los dos clubes, que se distingan entre sí */
  function liveCol(a, b) {
    var ca = (W.clubs[a] && W.clubs[a].col) || ["#ffb21e", "#ffffff"], cb = (W.clubs[b] && W.clubs[b].col) || ["#66b9ff", "#ffffff"];
    var toHex = function (c) {
      var m = /^hsl\((\d+),(\d+)%,(\d+)%\)$/.exec(c || "");
      if (m) { var H = +m[1] / 360, Sa = +m[2] / 100, Li = +m[3] / 100, q = Li < 0.5 ? Li * (1 + Sa) : Li + Sa - Li * Sa, p0 = 2 * Li - q;
        var f2 = function (t) { if (t < 0) t += 1; if (t > 1) t -= 1; return t < 1 / 6 ? p0 + (q - p0) * 6 * t : t < 0.5 ? q : t < 2 / 3 ? p0 + (q - p0) * (2 / 3 - t) * 6 : p0; };
        return "#" + [f2(H + 1 / 3), f2(H), f2(H - 1 / 3)].map(function (v) { return ("0" + Math.round(v * 255).toString(16)).slice(-2); }).join(""); }
      m = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(c || ""); if (m) return "#" + m[1] + m[1] + m[2] + m[2] + m[3] + m[3];
      return c;
    };
    ca = ca.map(toHex); cb = cb.map(toHex);
    var hx = function (c) { var m = /^#([0-9a-f]{6})$/i.exec(c || ""); if (!m) return [128, 128, 128]; var n = parseInt(m[1], 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
    var d = function (x, y) { var p = hx(x), q = hx(y); return Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) + Math.abs(p[2] - q[2]); };
    var dark = function (c) { var p = hx(c); return p[0] + p[1] + p[2] < 90; };
    var A = COL_OK.test(ca[0]) ? ca[0] : "#ffb21e", B = COL_OK.test(cb[0]) ? cb[0] : "#66b9ff";
    if (dark(A) && COL_OK.test(ca[1])) A = ca[1];
    if (d(A, B) < 120 || dark(B)) B = COL_OK.test(cb[1]) && d(A, cb[1]) >= 120 ? cb[1] : d(A, "#edf1e8") > 200 ? "#edf1e8" : "#5f7477";
    return [A, B];
  }
  function liveEnd() {
    var snap = snapshot();
    try { liveFinish(); } catch (e) { console.error(e); }
    closeLive(); persist(); UI.sheet = null; render(false);
    celebrate(snap);
  }

  /* ---------- arrastrar jugadores: once, banquillo y no convocados ---------- */
  var DR = null;
  function dragSrc(el) {
    var a = (el.getAttribute("data-drag") || "").split(":");
    if (!a[0]) return null;
    return a[0] === "xi" ? {z: "xi", i: +a[1]} : {z: a[0], id: +a[1]};
  }
  function dropDst(el) {
    var a = (el.getAttribute("data-drop") || "").split(":");
    if (a[0] === "xi") return {z: "xi", i: +a[1]};
    if (a[0] === "bp") return {z: "bench", id: +a[1]};
    if (a[0] === "np") return {z: "nc", id: +a[1]};
    return {z: a[0]};
  }
  function dragPlayer(src) { var m = S.m; return mPl(src.z === "xi" ? m.xi[src.i] : src.id); }
  function dragStart(x, y) {
    var p = dragPlayer(DR.src);
    if (!p) { DR = null; return; }
    var g = document.createElement("div");
    g.className = "dghost";
    g.innerHTML = "<b>" + Math.round(p.ovr) + "</b><span>" + h(p.ln) + "</span><small>" + h(posAb(p.pos)) + "</small>";
    document.body.appendChild(g);
    DR.ghost = g; DR.started = true;
    DR.el.classList.add("dsrc");
    document.body.classList.add("dragging");
    try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) {}
    dragMove(x, y);
    DR.raf = requestAnimationFrame(dragScroll);
  }
  function dragOver(x, y) {
    var t = document.elementFromPoint(x, y), d = t && t.closest ? t.closest("[data-drop]") : null;
    if (d === DR.el) d = null;
    if (d !== DR.over) { if (DR.over) DR.over.classList.remove("dover"); DR.over = d; if (d) d.classList.add("dover"); }
  }
  function dragMove(x, y) {
    DR.x = x; DR.y = y;
    DR.ghost.style.transform = "translate(" + Math.round(x - 34) + "px," + Math.round(y - 44) + "px)";
    dragOver(x, y);
  }
  function dragScroll() {
    if (!DR || !DR.started) return;
    var mm = document.getElementById("main");
    if (mm) {
      var r = mm.getBoundingClientRect(), top = r.top + 64, bot = Math.min(r.bottom, window.innerHeight) - 120, v = 0;
      if (DR.y < top) v = -Math.ceil((top - DR.y) / 5);
      else if (DR.y > bot) v = Math.ceil((DR.y - bot) / 5);
      if (v) { mm.scrollTop += clamp(v, -22, 22); dragOver(DR.x, DR.y); }
    }
    DR.raf = requestAnimationFrame(dragScroll);
  }
  function dragEnd(cancel) {
    var d = DR;
    DR = null;
    if (!d) return;
    clearTimeout(d.timer);
    if (!d.started) return;
    cancelAnimationFrame(d.raf);
    document.body.classList.remove("dragging");
    if (d.ghost) d.ghost.remove();
    d.el.classList.remove("dsrc");
    if (d.over) d.over.classList.remove("dover");
    UI.noClick = Date.now();
    if (cancel || !d.over) return;
    var res = mgrMove(d.src, dropDst(d.over));
    if (res === "full") toast(tr("El banquillo está completo: suéltalo encima de un suplente para cambiarlos."));
    else if (res === "pos") toast(tr("Ese jugador no puede jugar en esa posición."));
    else if (res) { persist(); render(false); }
  }
  function dragBegin(el, x, y, touch) {
    if (!S || !isMgr() || UI.sheet) return;
    var src = dragSrc(el);
    if (!src) return;
    DR = {el: el, src: src, sx: x, sy: y, x: x, y: y, touch: touch, started: false};
  }
  document.addEventListener("touchstart", function (e) {
    if (DR) { dragEnd(true); return; }
    if (e.touches.length !== 1) return;
    var el = e.target.closest && e.target.closest("[data-drag]");
    if (!el) return;
    var t = e.touches[0];
    dragBegin(el, t.clientX, t.clientY, true);
    if (DR) DR.timer = setTimeout(function () { if (DR && !DR.started) dragStart(DR.x, DR.y); }, 260);
  }, {passive: true});
  document.addEventListener("touchmove", function (e) {
    if (!DR || !DR.touch) return;
    var t = e.touches[0];
    if (!DR.started) {
      if (Math.abs(t.clientX - DR.sx) > 9 || Math.abs(t.clientY - DR.sy) > 9) { clearTimeout(DR.timer); DR = null; }
      else { DR.x = t.clientX; DR.y = t.clientY; }
      return;
    }
    if (e.cancelable) e.preventDefault();
    dragMove(t.clientX, t.clientY);
  }, {passive: false});
  document.addEventListener("touchend", function (e) {
    if (!DR || !DR.touch) return;
    if (DR.started && e.cancelable) e.preventDefault();
    dragEnd(false);
  }, {passive: false});
  document.addEventListener("touchcancel", function () { if (DR) dragEnd(true); });
  document.addEventListener("contextmenu", function (e) { if (DR || (e.target.closest && e.target.closest("[data-drag]"))) e.preventDefault(); });
  document.addEventListener("mousedown", function (e) {
    if (e.button !== 0 || DR) return;
    var el = e.target.closest && e.target.closest("[data-drag]");
    if (el) dragBegin(el, e.clientX, e.clientY, false);
  });
  document.addEventListener("mousemove", function (e) {
    if (!DR || DR.touch) return;
    if (!DR.started) { if (Math.abs(e.clientX - DR.sx) + Math.abs(e.clientY - DR.sy) > 7) dragStart(e.clientX, e.clientY); return; }
    e.preventDefault();
    dragMove(e.clientX, e.clientY);
  });
  document.addEventListener("mouseup", function () { if (DR && !DR.touch) dragEnd(false); });

  /* ---------- eventos ---------- */
  document.addEventListener("click", function (e) {
    if (UI.noClick && Date.now() - UI.noClick < 450) { e.preventDefault(); e.stopPropagation(); return; }
    var b = e.target.closest("[data-a]");
    if (!b || b.disabled) return;
    if (b.tagName === "SELECT" || b.tagName === "INPUT") return;
    var a = b.getAttribute("data-a"), id = +b.getAttribute("data-id"), v = b.getAttribute("data-v");
    if (UIX.actions[a]) { try { UIX.actions[a](b, v, b.getAttribute("data-id")); } catch (err) { console.error(err); } return; }
    switch (a) {
      case "advance": doAdvance(); break;
      case "choose": doChoose(+b.getAttribute("data-i")); break;
      case "tab": UI.tab = b.getAttribute("data-t"); render(true); break;
      case "more": UI.exp[id] = !UI.exp[id]; render(false); break;
      case "menu": UI.sheet = {k: "menu"}; renderSheet(); break;
      case "close": closeSheet(); render(false); break;
      case "setev": S.set.ev = +v; persist(); renderSheet(); break;
      case "setlang": setLangUI(v); break;
      case "golang": UI.view = "lang"; render(true); break;
      case "privacy": UI.sheet = {k: "privacy"}; renderSheet(); break;
      case "doupdate": try { window.AndroidBridge.openStore(); } catch (err) {} closeSheet(); render(false); break;
      case "adprivacy": try { window.AndroidBridge.showPrivacyOptions(); } catch (err) {} break;
      case "gohome": var fromDraft = UI.view === "draft"; UI.vback = true; UI.view = "home"; UI.cr = null; render(true); if (fromDraft) showAd("menu"); break;
      case "goload": UI.view = "load"; render(true); refreshSlots(); break;
      case "newgame":
        if (slotsNow().length >= MAX_SLOTS) { toast(tr("Tienes {n} partidas guardadas, el máximo. Borra alguna para empezar otra.", {n: MAX_SLOTS})); UI.view = "load"; render(true); break; }
        UI.view = "modes"; render(true); break;
      case "troclose": var tm = document.getElementById("tromod"); if (tm) { tm.classList.add("out"); setTimeout(function () { tm.remove(); trophyModal(); }, 280); } break;
      case "pickmode": startCreate(v); break;
      /* tras retirarte: empezar otra carrera de jugador/a desde cero (la retirada queda guardada) */
      case "newcareer":
        UI.sheet = null; closeLive(true);
        try { persist(); Store.flush && Store.flush(); } catch (err) {}
        /* con el máximo de partidas, la carrera terminada deja su hueco (ya está en el Salón de la fama) */
        if (slotsNow().length >= MAX_SLOTS && S && S.ph === "ret") { var oldId = S.uid; try { Store.remove(oldId); } catch (err) {} UI.slots = slotsNow().filter(function (x) { return x.id !== oldId; }); }
        if (slotsNow().length >= MAX_SLOTS) { toast(tr("Tienes {n} partidas guardadas, el máximo. Borra alguna para empezar otra.", {n: MAX_SLOTS})); UI.view = "load"; render(true); break; }
        UI.gsel = S && S.g === "f" ? "f" : UI.gsel;
        S = null;
        UI.tab = null; UI.exp = {}; UI.flash = null;
        startCreate("p"); showAd("menu");
        break;
      case "gsel": UI.gsel = v === "f" ? "f" : "m"; render(false); break;
      case "loadslot": loadSlot(v); break;
      case "askdel": UI.sheet = {k: "askdel", id: v}; renderSheet(); break;
      case "dodel":
        Store.remove(v);
        if (S && S.uid === v) S = null;
        UI.slots = slotsNow().filter(function (x) { return x.id !== v; });
        UI.sheet = null; render(false); toast(tr("Partida borrada"));
        break;
      case "export": exportCode(); break;
      case "copy":
        var ta = document.getElementById("code"), code = ta ? ta.value : "";
        if (!UI.sheet.code) break;
        if (window.AndroidBridge && window.AndroidBridge.copy) { try { window.AndroidBridge.copy(code); toast(tr("Código copiado")); break; } catch (err) {} }
        try {
          navigator.clipboard.writeText(code).then(function () { toast(tr("Código copiado")); }, function () { ta.select(); toast(tr("Selecciona y copia el texto")); });
        } catch (err) { ta.select(); toast(tr("Selecciona y copia el texto")); }
        break;
      case "import": UI.sheet = {k: "import"}; renderSheet(); break;
      case "doImport": importCode((document.getElementById("incode") || {}).value); break;
      case "hof": UI.sheet = {k: "hof", list: null}; renderSheet(); Store.hof().then(function (l) { if (UI.sheet && UI.sheet.k === "hof") { UI.sheet.list = l.sort(function (x, y) { return y.sc - x.sc; }); renderSheet(); } }); break;
      case "hoff": UI.hofF = v; renderSheet(); break;
      case "home": UI.sheet = null; Store.flush(); UI.view = "home"; refreshSlots(); render(true); showAd("menu"); break;
      case "continue": enterGame(); render(true); showAd("load"); break;
      case "startmgr":
        try { startManager(); } catch (err) { console.error(err); toast(tr("No se pudo empezar la carrera de entrenador.")); break; }
        UI.tab = "club"; UI.exp = {}; UI.wl = null; persist(); render(true); showAd("manager"); break;
      case "jobpick": UI.sheet = {k: "pickclub", lg: null}; renderSheet(); break;
      case "takejob":
        if (mgrTakeJob(+v)) { UI.sheet = null; UI.tab = "club"; persist(); render(true); } else toast(tr("No puedes fichar por ese club ahora."));
        break;
      /* plantilla */
      case "pl": UI.sheet = {k: "pl", id: id}; renderSheet(); break;
      case "slot": UI.sheet = {k: "slot", i: +b.getAttribute("data-i")}; renderSheet(); break;
      case "msim":
        if (S.pend[0] && S.pend[0].k === "moment") { var nOpt = document.querySelectorAll('.decision [data-a="choose"]').length || 2, ri0 = Math.floor(Math.random() * nOpt); var cb0 = document.querySelector('.decision [data-a="choose"][data-i="' + ri0 + '"]'); if (cb0) cb0.click(); }
        break;
      case "statinfo": UI.sheet = {k: "statinfo"}; renderSheet(); break;
      case "fixxi": var nf = mFixUnav(); persist(); render(false); toast(nf ? trn(nf, "Hecho: {n} cambio en el once.", "Hecho: {n} cambios en el once.") : tr("No hay suplentes disponibles para esas posiciones.")); break;
      case "setslot":
        var zq = mZoneOf(id), si = +b.getAttribute("data-i");
        if (mgrMove(zq[0] === "xi" ? {z: "xi", i: zq[1]} : {z: zq[0], id: id}, {z: "xi", i: si}) === "pos") { toast(tr("Ese jugador no puede jugar en esa posición.")); break; }
        UI.sheet = null; persist(); render(false); break;
      case "mzone":
        var zp = mZoneOf(id), res = mgrMove(zp[0] === "xi" ? {z: "xi", i: zp[1]} : {z: zp[0], id: id}, {z: v});
        if (res === "full") toast(tr("El banquillo está completo: suéltalo encima de un suplente para cambiarlos."));
        else if (res) { persist(); renderSheet(); render(false); }
        break;
      case "bestxi": S.m.xi = mBestXI(S.m.form); S.m.bench = mBestBench(S.m.xi); persist(); render(false); toast(tr("Once ideal y banquillo colocados")); break;
      case "ment": S.m.ment = +v; persist(); render(false); break;
      case "rot": S.m.rot = +v; persist(); render(false); break;
      case "mrole": mgrSetRole(id, v); persist(); renderSheet(); render(false); break;
      case "mlist": var pl = mPl(id); if (pl) { pl.list = !pl.list; persist(); renderSheet(); toast(pl.list ? tr("En la lista de venta: llegarán más ofertas") : tr("Ya no está en venta")); } break;
      case "mrenew": openPend(mgrStartRenew(id), tr("Ya negociasteis en este tramo.")); break;
      case "mtalk": openPend(mgrStartTalk(id), tr("Ya hablasteis en este tramo.")); break;
      case "msell": openPend(mgrStartSell(id), tr("Nadie ha preguntado por él ahora mismo.")); break;
      case "mloan": openPend(mgrStartLoan(id), tr("Ningún club puede acogerle ahora.")); break;
      case "mrelease": openPend(mgrStartRelease(id)); break;
      case "renpl": UI.sheet = {k: "ren", id: id}; renderSheet(); break;
      case "dorename":
        var nf = document.getElementById("rfn"), nl = document.getElementById("rln");
        if (mgrRename(id, nf ? nf.value : "", nl ? nl.value : "")) { persist(); UI.sheet = {k: "pl", id: id}; renderSheet(); render(false); toast(tr("Nombre cambiado")); }
        else toast(tr("Escribe al menos un nombre."));
        break;
      /* mercado */
      case "mkf": UI.mkF = v; render(false); break;
      case "mbid": openPend(mgrStartBid(b.getAttribute("data-id")), tr("Ahora no se puede negociar.")); break;
      case "mscout": var mk = S.m.mk; if (mk.open && !mk.ref) { mk.ref = true; mk.list = mk.list.filter(function (t) { return t.done; }).concat(mgrScoutList(12)); persist(); render(false); toast(tr("Nuevo informe de ojeadores")); } break;
      /* creación */
      case "cpos": UI.cr.pos = v; render(false); break;
      case "cset": var k = b.getAttribute("data-k"); if ((k === "mode" || k === "mmode") && UI.cr[k] !== v) UI.cr.club = -1; UI.cr[k] = (k === "age" || k === "ev" || k === "diff") ? +v : v; render(false); break;
      case "reoffer": UI.cr.offers = null; UI.cr.offKey = null; UI.cr.club = -1; render(false); break;
      case "ccol": if (b.getAttribute("data-k") === "2") UI.cr.kit.col3 = v; else UI.cr.col[+b.getAttribute("data-k")] = v; render(false); break;
      case "ccrest": UI.cr.crest[b.getAttribute("data-k")] = v; render(false); break;
      case "ckit": UI.cr.kit.pat = v; render(false); break;
      /* objetivos */
      case "objsel": var ox = S.pend[0]; if (ox && ox.k === "objs") { ox.sel[+b.getAttribute("data-c")] = +b.getAttribute("data-i"); persist(); render(false); } break;
      case "objok": if (confirmObjChoice()) { persist(); toast(tr("Objetivos fijados. ¡A por ellos!")); render(true); } break;
      /* negociación de fichajes */
      case "negostep": var nx0 = S.pend[0]; if (nx0 && nx0.k === "nego") { negoSet(nx0.v + (+v) * negoStep(nx0) * (nx0.ph === "fee" ? 5 : 10)); persist(); renderSheet(); } break;
      case "negoprom": var nx1 = S.pend[0]; if (nx1 && nx1.k === "nego") { negoProm(!nx1.prom); persist(); renderSheet(); } break;
      case "negooff":
        var nx2 = S.pend[0]; if (!nx2 || nx2.k !== "nego") break;
        var nin = document.getElementById("negov"), r0 = negoOffer(nin ? +nin.value : nx2.v);
        persist();
        if (S.pend[0] && S.pend[0].k === "nego") { renderSheet(); if (r0 && r0.r === "ok") edgeFlash(true); else if (r0 && r0.r !== "cap") edgeFlash(false); }
        else { UI.sheet = null; render(false); if (r0) edgeFlash(r0.r === "ok"); }
        break;
      case "negoquit": negoQuit(); persist(); UI.sheet = null; render(false); break;
      /* minijuego */
      case "mini": doMini(+b.getAttribute("data-i"), b.getAttribute("data-m")); break;
      /* red social */
      case "socedit": UI.sheet = {k: "socedit"}; renderSheet(); break;
      case "socav": socDraft(); UI.sheet.d.av = v; renderSheet(); break;
      case "soccol": socDraft(); UI.sheet.d.col = v; renderSheet(); break;
      case "socsave":
        var sp = S.soc.prof, nmv = (document.getElementById("sname") || {}).value, hdv = (document.getElementById("shandle") || {}).value, bio = (document.getElementById("sbio") || {}).value;
        if (UI.sheet.d && UI.sheet.d.av) sp.av = UI.sheet.d.av;
        if (UI.sheet.d && UI.sheet.d.col) sp.col = UI.sheet.d.col;
        if (nmv && nmv.trim()) sp.name = nmv.trim().slice(0, 30);
        if (hdv && socSlug(hdv)) sp.handle = socSlug(hdv).slice(0, 15);
        sp.bio = String(bio || "").slice(0, 140);
        UI.sheet = null; persist(); render(false); toast(tr("Perfil actualizado"));
        break;
      /* partido en directo */
      case "lspeed": if (LV) { var sv = +v; LV.run = sv > 0; if (sv > 0) LV.speed = sv; liveTick(); liveRender(); } break;
      case "lment": liveSet("ment", v === "bus" || v === "press" ? v : +v); liveRender(); break;
      case "lout": if (LV) { if (LV.sel == null && LV.run) { LV.resume = true; LV.run = false; } LV.sel = LV.sel === id ? null : id; LV.pin = null; if (LV.sel == null) subDone(); liveRender(); } break;
      case "lin": if (LV && LV.sel != null) { LV.pin = id; liveRender(); } break;
      case "lsubok": if (LV && LV.sel != null && LV.pin != null) { liveSub(LV.sel, LV.pin); LV.sel = LV.pin = null; subDone(); liveRender(); } break;
      case "lsubx": if (LV) { LV.sel = LV.pin = null; subDone(); liveRender(); } break;
      case "ltac": liveSet(b.getAttribute("data-k"), +v); liveRender(); break;
      case "lsim": liveSimRest(); if (typeof Pitch !== "undefined") Pitch.reset(); liveRender(); if (typeof Pitch !== "undefined") Pitch.event({t: "end", side: 0}); break;
      case "lend": liveEnd(); break;
      case "cclub": UI.cr.club = +v; render(false); break;
      case "cback": UI.vback = true; if (UI.cr.step === 0) { UI.view = "modes"; UI.cr = null; render(true); } else { UI.cr.step--; render(true); } break;
      case "cnext":
        var last = {p: 3, mgr: 2, club: 3}[UI.cr.kind];
        if (UI.cr.step >= last) finishCreate(); else { UI.cr.step++; render(true); }
        break;
      /* club propio: plantilla inicial */
      case "redraft": clubRedraft(); persist(); render(false); toast(tr("Plantilla nueva generada")); break;
      case "startclub":
        try { clubStart(); } catch (err) { console.error(err); toast(tr("No se pudo empezar la temporada.")); break; }
        enterGame(); persist(); render(true); break;
    }
  });
  document.addEventListener("toggle", function (e) {
    var d = e.target; if (!d || !d.getAttribute || !d.getAttribute("data-fold")) return;
    (UI.fold = UI.fold || {})[d.getAttribute("data-fold")] = d.open;
  }, true);
  document.addEventListener("input", function (e) {
    if (e.target.id === "negov" && S && S.pend[0] && S.pend[0].k === "nego") {
      var nx = S.pend[0], vv = negoSnap(nx, +e.target.value); nx.v = vv;
      var pc = negoPct(vv, nx.ask), lb = document.getElementById("negoval"), pp = document.getElementById("negopct");
      if (lb) lb.innerHTML = fmtMoney2(vv) + (nx.ph === "fee" ? "" : "<small>/" + tr("año") + "</small>");
      if (pp) { pp.textContent = tr("{pct} % de lo que piden", {pct: pc}); pp.className = pc >= 100 ? "up" : pc >= 80 ? "" : "down"; }
      return;
    }
    var f = e.target.getAttribute && e.target.getAttribute("data-f");
    if (f && UI.cr && e.target.tagName === "INPUT") {
      UI.cr[f] = e.target.value;
      var c = UI.cr, nx = document.querySelector('[data-a="cnext"]');
      if (!nx) return;
      if ((c.kind === "club" && c.step === 0)) {
        nx.disabled = c.cn.trim().length < 2;
        var ab = (c.ab || clubAbbr(c.cn) || "FC").toUpperCase().slice(0, 4), pv = document.querySelector(".clubprev");
        if (pv) pv.innerHTML = crestRaw(c.col, ab, true) + '<div class="grow"><b>' + h(c.cn || tr("Nombre del club")) + '</b><small class="muted">' + h(ab) + "</small></div>";
        var abIn = document.getElementById("ab"); if (abIn && f === "cn") abIn.placeholder = ab;
      } else if (c.step === 0 || (c.kind === "club" && c.step === 3)) nx.disabled = !(c.fn.trim() && c.ln.trim());
    }
  });
  document.addEventListener("change", function (e) {
    var t = e.target;
    if (t.id === "wl") { UI.wl = +t.value; render(false); return; }
    if (t.id === "mform") { mSetFormation(t.value); persist(); render(false); return; }
    if (t.getAttribute && t.getAttribute("data-live") === "form") { liveSet("form", t.value); liveRender(); return; }
    if (t.id === "pcl") { UI.sheet.lg = +t.value; renderSheet(); return; }
    var rn = t.getAttribute && t.getAttribute("data-rn");
    if (rn && S && S.m) {
      var nm = splitName(t.value);
      if (nm && mgrRename(+rn, nm.fn, nm.ln)) persist();
      else { var rp = mPl(+rn); if (rp) t.value = plName(rp); }
      return;
    }
    var f = t.getAttribute && t.getAttribute("data-f");
    if (f && UI.cr && t.tagName === "SELECT") {
      UI.cr[f] = t.value;
      if (f === "lg") { UI.cr.lg = +t.value; UI.cr.club = -1; }
      if (f === "nat") { if (UI.cr.kind === "p") UI.cr.lg = null; if (UI.cr.kind === "p") UI.cr.club = -1; }
      render(false);
    }
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && UI.sheet) { closeSheet(); render(false); } });
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") { try { Store.flush(); } catch (err) {} } });

  /* ---------- deslizar a la derecha para descartar tarjetas ---------- */
  (function () {
    var sw = null;
    document.addEventListener("pointerdown", function (e) {
      var c = e.target.closest && e.target.closest(".sw[data-fid]");
      if (!c || e.target.closest("button, a, input, select")) return;
      sw = {el: c, x: e.clientX, y: e.clientY, dx: 0, on: false, id: e.pointerId};
    }, {passive: true});
    document.addEventListener("pointermove", function (e) {
      if (!sw || e.pointerId !== sw.id) return;
      var dx = e.clientX - sw.x, dy = e.clientY - sw.y;
      if (!sw.on) { if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { sw = null; return; } if (dx > 12 && dx > Math.abs(dy) * 1.4) { sw.on = true; sw.el.classList.add("swiping"); } else return; }
      sw.dx = Math.max(0, dx);
      sw.el.style.transform = "translateX(" + sw.dx + "px) rotate(" + (sw.dx / 60) + "deg)";
      sw.el.style.opacity = String(Math.max(0.15, 1 - sw.dx / (sw.el.offsetWidth * 0.9)));
    }, {passive: true});
    var end = function () {
      if (!sw) return;
      var c = sw.el, done = sw.on && sw.dx > c.offsetWidth * 0.33;
      c.classList.remove("swiping");
      if (done) {
        var id = c.getAttribute("data-fid");
        c.style.transform = "translateX(110%) rotate(6deg)"; c.style.opacity = "0";
        try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) {}
        setTimeout(function () {
          c.style.height = c.offsetHeight + "px"; c.classList.add("gone");
          setTimeout(function () { (S.feed || []).forEach(function (f) { if (String(f.id) === id) f.hid = 1; }); c.remove(); persist(); }, 260);
        }, 220);
      } else { c.style.transform = ""; c.style.opacity = ""; }
      sw = null;
    };
    document.addEventListener("pointerup", end);
    document.addEventListener("pointercancel", end);
    /* mientras se desliza una tarjeta, el navegador no debe interpretar el gesto (volver atrás, desplazar) */
    document.addEventListener("touchmove", function (e) { if (sw && sw.on && e.cancelable) e.preventDefault(); }, {passive: false});
  })();

  /* helpers para los módulos ui-*.js */
  Object.assign(UIX, {h: h, render: render, persist: persist, toast: toast, renderSheet: renderSheet, closeSheet: closeSheet, crest: crest, crestRaw: crestRaw, flag: flag, team: team, miniTable: miniTable, involved: involved, myClub: myClub, myNat: myNat,
    chip: chip, edgeFlash: edgeFlash, confetti: confetti, openLive: function () { openLive(); }, isMgr: isMgr, ui: function () { return UI; }, icon: ICON,
    open: function (k, d) { UI.sheet = Object.assign({k: k}, d || {}); renderSheet(); }, slot: slot, choose: function (i) { doChoose(i); }});

  /* ---------- arranque ---------- */
  function boot(data) {
    buildWorld();
    var l = savedLang();
    if (l) setLang(l);
    if (!document.getElementById("tro-defs")) { var d = document.createElement("div"); d.id = "tro-defs"; d.innerHTML = trophyDefs(); document.body.appendChild(d); }
    Store.migrate();
    UI.slots = Store.index();
    if (data && data.save) {
      try { restore(data.save); enterGame(); if (data.tab) UI.tab = data.tab; } catch (e) { S = null; UI.view = "home"; }
    } else UI.view = l ? "home" : "lang";
    render(true);
    try { var AB = window.AndroidBridge; if (AB && AB.updateAvailable && AB.updateAvailable() > 0) window.caminoUpdate(AB.updateAvailable(), AB.updateName ? AB.updateName() : ""); } catch (e) {}
    Store.init().then(function () {
      if (!Store.cloud) return;
      return Store.migrateCloud().then(function () { refreshSlots(); });
    });
  }
  /* el arranque lo lanza ui-boot.js, el último fichero, para que los módulos ui-*.js ya estén enganchados */
  window.__camBoot = function () {
    var hot = window.claude && window.claude.hot;
    if (hot && typeof hot.snapshot === "function") { try { hot.snapshot(function () { return {save: S ? serialize() : null, tab: UI.tab}; }); } catch (e) {} }
    if (hot && typeof hot.ready === "function") hot.ready(boot); else boot((hot && hot.data) || {});
  };
})();
