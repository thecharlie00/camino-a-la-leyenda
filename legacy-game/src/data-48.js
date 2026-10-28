/* data-48.js — expansión de ligas (versión 4.8).
   Incorpora campeonatos masculinos y femeninos de Asia y África, además de las ligas tailandesas.
   Las expansiones se añaden al final para conservar los índices de las partidas guardadas; las nuevas ligas femeninas
   forman parte del mundo ampliado "f2". Los clubes usan plantillas generadas por el motor. */
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

  /* Nuevos campeonatos de expansión: los clubes se añaden al final para conservar índices de guardados. */
  DATA.leagues.push(
    L({id: "MYS1", c: "MY", n: "Malaysia Super League", t: 1, top: 57, bot: 46, cup: "Malaysia FA Cup", w: 0.25, gs: 1},
      "Johor Darul Ta'zim|Selangor FC|Kuala Lumpur City|Sabah FC|Terengganu FC|Kedah Darul Aman|Pahang Rangers|Negeri Sembilan|Penang FC|Kuching City|Perak FC|Kelantan Darul Naim"),
    L({id: "NGA1", c: "NG", n: "Nigeria Premier Football League", t: 1, top: 59, bot: 46, cup: "Nigeria FA Cup", caf: 1, w: 0.3, gs: 1},
      "Enyimba|Rivers United|Remo Stars|Rangers International|Kano Pillars|Shooting Stars|Bendel Insurance|Plateau United|Abia Warriors|Lobi Stars|Nasarawa United|Katsina United|Akwa United|Bayelsa United|Niger Tornadoes|Sunshine Stars|Heartland FC|Doma United|Kwara United|Gombe United"),
    L({id: "IDN1", c: "ID", n: "Liga 1 Indonesia", t: 1, top: 59, bot: 47, cup: "Piala Indonesia", w: 0.3, gs: 1},
      "Persib Bandung|Persija Jakarta|Bali United|Persebaya Surabaya|Arema FC|Borneo Samarinda|PSM Makassar|Madura United|Dewa United|Persik Kediri|PSIS Semarang|Persita Tangerang|PSS Sleman|Barito Putera|Persis Solo|RANS Nusantara|Malut United|Semen Padang"),
    L({id: "VIE1", c: "VN", n: "V.League 1", t: 1, top: 57, bot: 45, cup: "Vietnamese National Cup", w: 0.25, gs: 1},
      "Hanoi FC|The Cong Viettel|Nam Dinh FC|Becamex Binh Duong|Hoang Anh Gia Lai|Song Lam Nghe An|Hai Phong FC|Da Nang FC|Quang Nam FC|Thanh Hoa FC|Hong Linh Ha Tinh|Binh Dinh FC|Ho Chi Minh City FC|Khanh Hoa FC")
  );

  /* Ligas femeninas adicionales para las cuatro confederaciones/regiones anteriores. */
  var womenExtra = [
    {id: "MYS1", c: "MY", n: "Malaysia Women's League", t: 1, top: 49, bot: 40, w: 0.12, gs: 0.5, xl: true, clubs: "Selangor Women|Sabah Women|Kedah Women|Penang Women|Johor Women|Kuala Lumpur Women|Terengganu Women|Pahang Women"},
    {id: "NGA1", c: "NG", n: "Nigeria Women's Premier League", t: 1, top: 56, bot: 44, w: 0.2, gs: 0.5, xl: true, clubs: "Rivers Angels|Bayelsa Queens|Edo Queens|Delta Queens|Nasarawa Amazons|Robo Queens|Confluence Queens|Abia Angels|Sunshine Queens|Ibom Angels|Heartland Queens|Adamawa Queens"},
    {id: "IDN1", c: "ID", n: "Indonesia Women's League", t: 1, top: 49, bot: 39, w: 0.12, gs: 0.5, xl: true, clubs: "Persib Putri|Arema Women|Persija Putri|Bali United Women|PSS Sleman Women|Madura United Women|PSM Makassar Women|Persis Women"},
    {id: "VIE1", c: "VN", n: "Vietnam Women's League", t: 1, top: 52, bot: 42, w: 0.15, gs: 0.5, xl: true, clubs: "Ho Chi Minh City Women|Hanoi Women|Than Khoang San Viet Nam|Phong Phu Ha Nam|Thai Nguyen T&T|Son La Women|Thai Nguyen Women|Ha Noi II Women"}
  ];
  function copyLeague(l) { var o = {}; Object.keys(l).forEach(function (k) { o[k] = l[k]; }); return o; }
  /* El mundo femenino ampliado es exclusivo de nuevas carreras (f2), igual que las expansiones previas. */
  if (DATA.leaguesF2) womenExtra.forEach(function (l) { DATA.leaguesF2.push(copyLeague(l)); });
  if (DATA.leaguesF2) DATA.leaguesF2.push({id: "THA1", c: "TH", n: "Thai Women's League", t: 1, top: 56, bot: 46, w: 0.2, gs: 1, xl: true,
    clubs: "BG Bundit Asia|Chonburi FC|College of Asian Scholars|Kasem Bundit University|Bangkok FC|Lampang Sports School|Nakhon Ratchasima|Chiangmai FC"});
})();
