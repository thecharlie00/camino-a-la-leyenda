/* Bot de entrenador "sensato" para revisar el equilibrio del modo míster. Uso: node test/mgrbot.js [carreras] [temporadas] */
const fs = require("fs"), vm = require("vm"), path = require("path");
const SRC = path.join(__dirname, "../src");
const N = +(process.argv[2] || 3), SEAS = +(process.argv[3] || 10);
const files = ["data.js", "engine-core.js", "engine-player.js", "events.js", "trophies.js", "engine-manager.js", "events-manager.js"];
const G = {console, Math, Date, JSON}; vm.createContext(G);
vm.runInContext(files.map(f => fs.readFileSync(path.join(SRC, f), "utf8")).join("\n"), G, {filename: "game.js"});
function quickPlayer(i) {
  G.newCareer({fn: "Bot", ln: "N" + i, nat: ["ES", "AR", "ENG", "BR", "DE", "FR"][i % 6], nat2: null, pos: "MC", foot: "Diestro", age: 17, talent: ["elegido", "joya", "promesa"][i % 3], club: -1, ev: 1, seed: 500 + i});
  let k = 0;
  while (G.S.ph !== "ret" && k++ < 60000) {
    G.cleanPendPlayer();
    if (G.S.pend.length) { const x = G.S.pend[0]; let ch = 0; if (x.k === "offers") ch = x.forced ? 0 : -1; if (x.k === "ev" && x.id === "retiro") { const d = G.playerDesc(x); ch = d.opts.length - 1; } G.resolvePendingPlayer(ch); }
    else G.advancePlayer();
  }
}
function bestGood(d) { let b = 0, bv = -1; d.opts.forEach((o, i) => { if (o.dis) return; const g = o.outs.reduce((a, u) => a + (u.good ? u.p : 0), 0); if (g > bv) { bv = g; b = i; } }); return b; }
const stats = {seasons: 0, over: 0, under: 0, sacked: 0, tro: 0, signings: 0, sales: 0};
for (let i = 0; i < N; i++) {
  quickPlayer(i);
  G.startManager();
  let steps = 0, lastTw = -1;
  while (G.S.ph !== "ret" && steps++ < 200000) {
    const S = G.S, m = S.m;
    if (m.seasons.length >= SEAS && S.ph === "off" && !S.pend.length) break;
    if (m.club >= 0 && m.mk.open && lastTw !== S.tw && !S.pend.length) {
      lastTw = S.tw;
      const act = m.sq.filter(p => !p.loanOut), avg = G.mSquadAvg();
      let bought = 0;
      ["POR", "LD", "DFC", "LI", "MCD", "MC", "MCO", "ED", "EI", "DC"].forEach(pos => {
        if (bought >= 2) return;
        const mine = act.filter(p => p.pos === pos).sort((a, b) => b.ovr - a.ovr), best = mine[0] ? mine[0].ovr : 0;
        if (best >= avg - 1) return;
        const t = m.mk.list.filter(t => !t.done && t.pos === pos && t.ovr > best + 1 && t.ask <= m.bud).sort((a, b) => b.ovr - a.ovr)[0];
        if (t && G.mgrStartBid(t.id)) bought++;
      });
      if (!bought) { const old = act.filter(p => p.age >= 32 && p.role !== "C").sort((a, b) => a.ovr - b.ovr)[0]; if (old) G.mgrStartSell(old.id); }
    }
    G.cleanPend();
    if (S.pend.length) {
      const x = S.pend[0];
      let ch = 0;
      if (x.k === "jobs") { ch = x.list.map((o, i) => [G.S.cr[o.club], i]).sort((a, b) => b[0] - a[0])[0][1]; }
      else {
        const d = G.pendDesc(x);
        if (["renew", "bid", "terms", "sell", "mso", "youth"].indexOf(x.k) >= 0) ch = 0;
        else if (x.k === "mfocus") ch = 1;
        else if (x.k === "inoffer") { const p = G.mPl(x.pid); ch = p && p.age >= 30 ? 0 : d.opts.length - 1; }
        else if (x.k === "mplan") { let b = 0, bv = -1; d.opts.forEach((o, i) => { const v = o.outs[0].p + 0.5 * o.outs[1].p; if (v > bv) { bv = v; b = i; } }); ch = b; }
        else ch = bestGood(d);
        if (d.opts[ch] && d.opts[ch].dis) ch = d.opts.findIndex(o => !o.dis);
        if (x.k === "bid") stats.signings++;
        if (x.k === "sell" || x.k === "inoffer") stats.sales++;
      }
      G.resolvePending(ch);
    } else {
      if (m.club >= 0 && (S.ph === "pre" || S.ph === "gap")) m.xi = G.mBestXI(m.form);
      G.advance();
    }
  }
  const m = G.S.m;
  console.log("\nCarrera " + i + ": empezó con prestigio " + Math.round(m.peakRep) + " · final " + Math.round(m.rep) + " · títulos " + m.trophies.length);
  m.seasons.forEach(s => {
    stats.seasons++; if (s.pos < s.exp) stats.over++; else if (s.pos > s.exp) stats.under++;
    console.log("  " + s.y + " " + G.clubName(s.club).padEnd(22).slice(0, 22) + " esp " + String(s.exp).padStart(2) + " → " + String(s.pos).padStart(2) + "º  " + s.w + "-" + s.d + "-" + s.l + " (" + s.gf + ":" + s.ga + ") nivel " + s.r + " dir " + s.board + (s.mid ? " (a mitad)" : "") + (s.tro.length ? "  [" + s.tro.join(", ") + "]" : ""));
  });
  stats.tro += m.trophies.length;
  stats.sacked += m.spells.length - 1;
  console.log("  plantilla " + m.sq.length + " · masa " + G.fmtMoney(G.mWageBill()) + " / tope " + G.fmtMoney(m.wcap) + " · presupuesto " + G.fmtMoney(m.bud) + " · media XI " + G.mSquadAvg().toFixed(1));
}
console.log("\nResumen", JSON.stringify(stats));
