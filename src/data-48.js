/* data-48.js — Tailandia (versión 4.8).
   Masculino: Thai League 1 y Thai League 2 (xl: los clubes se crean al final para no mover los índices de las partidas guardadas).
   Femenino (mundo "f2"): Thai Women's League. Clubes reales, plantillas ficticias. */
(function () {
  var used = {};
  DATA.leagues.forEach(function (l) { l.clubs.split("|").forEach(function (n) { used[n] = 1; }); });
  function L(o, clubs) {
    o.clubs = clubs.split("|").filter(function (n) { if (used[n]) return false; used[n] = 1; return true; }).join("|");
    o.xl = true;
    return o;
  }
  DATA.leagues.push(
    L({id: "THA1", c: "TH", n: "Thai League 1", t: 1, top: 66, bot: 57, cup: "Copa de Tailandia", afc: 1, w: 0.45, gs: 1, down: "THA2", rel: 3},
      "Buriram United|Bangkok United|BG Pathum United|Port FC|Muangthong United|Ratchaburi FC|Chiangrai United|PT Prachuap|Sukhothai FC|Lamphun Warriors|Nakhon Ratchasima Mazda|Uthai Thani FC|Rayong FC|Kanchanaburi Power|Chonburi FC|Ayutthaya United"),
    L({id: "THA2", c: "TH", n: "Thai League 2", t: 2, top: 58, bot: 51, w: 0.2, gs: 1, po: [3, 6]},
      "Nongbua Pitchaya|Khon Kaen United|Nakhon Pathom United|Police Tero|Chiangmai United|Trat FC|Lampang FC|Pattaya United|Suphanburi FC|Chanthaburi FC|Kasetsart FC|Phrae United|Sisaket United|Chainat Hornbill|Nakhon Si United|Mahasarakham SBT|Bangkok FC|Songkhla FC")
  );
  if (DATA.leaguesF2) DATA.leaguesF2.push({id: "THA1", c: "TH", n: "Thai Women's League", t: 1, top: 56, bot: 46, w: 0.2, gs: 1, xl: true,
    clubs: "BG Bundit Asia|Chonburi FC|College of Asian Scholars|Kasem Bundit University|Bangkok FC|Lampang Sports School|Nakhon Ratchasima|Chiangmai FC"});
})();
