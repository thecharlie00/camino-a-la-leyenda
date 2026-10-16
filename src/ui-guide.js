/* ui-guide.js — Tutorial y guía del juego (parche 2.6).
   Pantalla completa con categorías, tarjetas desplegables y glosario con buscador.
   Se abre desde el menú principal, el menú de partida y el botón «?» de la cabecera. */
(function () {
  if (typeof UIX === "undefined") return;
  var h = UIX.h, G = null;

  function cats() {
    return [
      {k: "basics", ic: "▶", n: tr("Lo básico"), cards: [
        {t: tr("Cómo avanza el juego"), b: [tr("Pulsa el botón grande de abajo para avanzar al siguiente tramo de la temporada."), tr("Cuando aparece una tarjeta de decisión, elige una opción: los números de colores te dicen qué ganas y qué pierdes antes de elegir."), tr("Arriba siempre ves tu nivel, tu club y la fase de la temporada.")]},
        {t: tr("Modos de juego"), b: [tr("Jugador/a: creas tu futbolista y vives su carrera, de la cantera al Balón de Oro."), tr("Míster: diriges un club real; alineas, fichas y hablas con la prensa."), tr("Crea tu club: fundas un equipo propio con escudo y equipación.")]},
        {t: tr("Ritmo de decisiones"), b: [tr("Tranquilo, Normal o Intenso cambian cuántas decisiones y partidos en directo te salen."), tr("En los tres puedes ver un partido entero o simular el resto en cualquier momento."), tr("Se cambia en el menú, cuando quieras.")]},
        {t: tr("Avisos"), b: [tr("Rojo: lesiones, expulsiones o bajas en tu once. Ámbar: mercado y avisos. Verde: buenas noticias."), tr("Las tarjetas del inicio se descartan deslizándolas hacia la derecha.")]}
      ]},
      {k: "tac", ic: "📋", n: tr("Táctica y partido 2D"), cards: [
        {t: tr("Mentalidad"), b: [tr("Encerrarse y Defensiva: encajas menos, pero creas poco."), tr("Ofensiva y Presión alta: más ocasiones a favor y en contra; la presión cansa antes."), tr("Equilibrada es la opción segura si no sabes qué hacer.")]},
        {t: tr("Línea defensiva (bloque)"), b: [tr("Baja: proteges tu área y sufres menos al contraataque."), tr("Alta: robas más arriba, pero dejas espacio a la espalda."), tr("En el campo 2D verás la línea de tus defensas subir o bajar.")]},
        {t: tr("Amplitud, pase y ritmo"), b: [tr("Amplitud: abierto estira al rival por las bandas; estrecho junta a tus jugadores por dentro."), tr("Pase corto: más posesión; pase largo: llegas antes, pero pierdes más balones."), tr("Ritmo alto: más ocasiones y más cansancio; ritmo lento: controlas el partido.")]},
        {t: tr("Posiciones afines"), b: [tr("Cada jugador rinde al 100 % en su posición."), tr("En una posición afín (misma línea o puesto vecino) pierde un poco de nivel."), tr("Fuera de su línea no se puede colocar: nunca verás a un mediapunta en la portería.")]},
        {t: tr("Cambios en directo"), b: [tr("1. Toca quién sale (flecha roja ↓). El partido se pausa."), tr("2. Elige quién entra (flecha verde ↑): solo aparecen los suplentes que pueden jugar en ese puesto."), tr("3. Revisa el dibujo final y confirma.")]},
        {t: tr("Bajas en el once"), b: [tr("Si un lesionado o sancionado sigue en tu once, verás un aviso rojo."), tr("Pulsa «Corregir automáticamente» o cámbialo tú."), tr("Si juegas sin corregirlo, entra un suplente de urgencia, el equipo rinde peor y baja la moral.")]},
        {t: tr("La semana de trabajo"), b: [tr("En «Inicio» eliges la carga de entrenamiento: intensa hace progresar más, suave descansa y previene lesiones."), tr("Prepara cada partido según el rival: tu segundo entrenador te dice su estilo y, con 3 estrellas o más, su punto débil."), tr("Mejora a tu cuerpo técnico con el presupuesto de fichajes: segundo, preparador físico y médico.")]},
        {t: tr("Copas y torneos"), b: [tr("En la clasificación, pulsa «Copas y torneos» para ver cualquier competición: fase de liga, grupos y todas las eliminatorias."), tr("Tus competiciones salen arriba; el resto, en la lista desplegable.")]},
        {t: tr("Leer el campo 2D"), b: [tr("Cada punto es un jugador con su dorsal y los colores de su equipo."), tr("Las estelas muestran pases y tiros; el texto de abajo narra la jugada."), tr("Faltas, fueras de juego y tarjetas se marcan sobre el césped: destello, línea del fuera de juego y tarjeta sobre el jugador.")]}
      ]},
      {k: "press", ic: "🎙️", n: tr("Prensa y moral"), cards: [
        {t: tr("Ruedas de prensa"), b: [tr("Las preguntas salen de tu situación real: clasificación, rachas, derbis, tu forma…"), tr("Debajo de cada respuesta ves su efecto antes de elegir."), tr("Las respuestas valientes suben la ilusión, pero pueden enfadar a la directiva o al rival.")]},
        {t: tr("Moral del vestuario"), b: [tr("Con la moral alta, tus jugadores rinden más."), tr("Baja con derrotas, promesas incumplidas, poco protagonismo o alinear bajas."), tr("Sube con victorias, charlas acertadas y minutos para quien los pide.")]},
        {t: tr("Directiva, afición y prensa"), b: [tr("Directiva: tu puesto depende de ella; cumple los objetivos de la temporada."), tr("Afición: aplaude los resultados y los gestos con el club."), tr("Prensa: te trata mejor si eres claro y no la ignoras.")]},
        {t: tr("Motes"), b: [tr("Si destacas (o metes la pata), la grada y las redes te pondrán un mote."), tr("Los periodistas lo usarán en sus preguntas.")]}
      ]},
      {k: "mkt", ic: "💼", n: tr("Mercado y ojeo"), cards: [
        {t: tr("Lista de traspasos"), b: [tr("Te proponemos jugadores útiles: mejoran a tu titular, están a su nivel o son recambios con proyección."), tr("La etiqueta de cada uno te dice qué aporta."), tr("Cuanto más mejore al equipo, más caro será el traspaso y más alto el sueldo, siempre según tu presupuesto.")]},
        {t: tr("Negociar"), b: [tr("Paso 1: el traspaso con su club. Paso 2: el sueldo con el jugador."), tr("Mueve la barra o usa − y +: el importe se muestra con dos decimales (1,82 M€) y es exactamente lo que ofreces."), tr("Ofertas muy bajas llenan el medidor de frustración; si llega al 100 %, se rompe la negociación."), tr("El porcentaje solo marca 100 % cuando igualas lo que piden.")]},
        {t: tr("Ojeadores"), b: [tr("Contrata ojeadores con más estrellas para informes más precisos sobre el potencial."), tr("Envíalos a una región: traerán jugadores de esa zona que encajan en tus necesidades."), tr("Sus informes llegan aunque el mercado esté cerrado.")]},
        {t: tr("Cláusulas y cesiones"), b: [tr("Si alguien paga la cláusula de un jugador, se va sin que puedas impedirlo."), tr("Cesiones: con opción de compra decides tú al final; con obligación, la compra es automática.")]}
      ]},
      {k: "ply", ic: "⚽", n: tr("Modo jugador/a y portero/a"), cards: [
        {t: tr("Momentos del partido"), b: [tr("En las jugadas clave decides qué hacer; tus atributos cambian la probabilidad de éxito."), tr("Al terminar ves el resultado del partido.")]},
        {t: tr("Penaltis y la barra de tensión"), b: [tr("Elige la zona y para la barra de potencia dentro de la franja ideal."), tr("Con más presión (final, tanda, último lanzamiento), la franja se estrecha y la barra tiembla."), tr("Como portero/a, eliges hacia dónde tirarte y cuándo.")]},
        {t: tr("Faltas directas"), b: [tr("Como lanzador eliges dónde apuntar y la potencia; como portero/a, colocas la barrera y cuántos jugadores la forman.")]},
        {t: tr("Dorsal"), b: [tr("Puedes pedir el dorsal que quieras. Si lo lleva un compañero, quizá tengas que esperar a la próxima temporada.")]},
        {t: tr("Vida fuera del campo"), b: [tr("Invierte tus ahorros: algunos negocios dan beneficios y otros pueden salir mal."), tr("Contrata servicios (entrenador personal, nutricionista…) para mejorar atributos durante un tiempo."), tr("Tienes un rival asignado: compara tu carrera con la suya en el panel.")]}
      ]},
      {k: "gloss", ic: "📖", n: tr("Glosario"), gloss: true}
    ];
  }
  function gloss() {
    return [
      [tr("Ritmo"), tr("Aceleración y velocidad punta: ganar carreras al espacio y llegar al contraataque.")],
      [tr("Tiro"), tr("Precisión y potencia al rematar; pesa mucho en goles y penaltis.")],
      [tr("Pase"), tr("Visión y precisión: asistencias y jugadas que acaban en ocasión.")],
      [tr("Regate"), tr("Control y desborde en el uno contra uno.")],
      [tr("Defensa"), tr("Anticipación, entradas y marcaje; evita ocasiones del rival.")],
      [tr("Físico"), tr("Fuerza y resistencia: aguantar choques, lesionarse menos y no cansarse.")],
      [tr("Estirada"), tr("Alcance del portero/a en los disparos a las esquinas.")],
      [tr("Paradas"), tr("Seguridad para atrapar o despejar los tiros.")],
      [tr("Saque"), tr("Juego con los pies y saques largos para iniciar jugadas.")],
      [tr("Reflejos"), tr("Reacción a tiros cercanos y penaltis.")],
      [tr("Velocidad"), tr("Salidas del portero/a y rapidez para cerrar el ángulo.")],
      [tr("Colocación"), tr("Posicionamiento bajo palos: estar en el sitio antes de que llegue el tiro.")],
      [tr("Media"), tr("Nivel general del jugador o jugadora, de 1 a 99.")],
      [tr("Potencial"), tr("Hasta dónde puede llegar su media; los ojeadores te dan una horquilla.")],
      [tr("Forma"), tr("Cómo llega a los partidos según sus últimas actuaciones.")],
      [tr("Estado físico"), tr("Cansancio acumulado; por debajo de la mitad rinde peor y se lesiona más.")],
      [tr("Moral"), tr("Ánimo del jugador o jugadora; con moral alta rinde más.")],
      [tr("Química"), tr("Lo bien que se entiende el equipo; sube con estabilidad y victorias.")],
      [tr("Rol"), tr("Clave, Importante, Rotación, Suplente o Promesa: lo que espera jugar. Si no se cumple, baja su moral.")],
      [tr("Prestigio"), tr("Tu reputación como míster: abre las puertas de clubes más grandes.")],
      [tr("Fama"), tr("Lo conocido que eres como futbolista; atrae ofertas, patrocinios y prensa.")],
      [tr("Presión"), tr("Tensión del momento: estrecha la franja ideal en penaltis y minijuegos.")],
      [tr("Frustración"), tr("En una negociación, el enfado del club o del jugador con tus ofertas.")],
      [tr("Cláusula"), tr("Precio que libera a un jugador sin negociar.")],
      [tr("Bloque defensivo"), tr("Altura de tu línea de defensas: baja, media o alta.")],
      [tr("Posición afín"), tr("Una posición de la misma línea o vecina a la suya; rinde algo menos.")]
    ];
  }

  function open(k) {
    if (G) close();
    var el = document.createElement("div");
    el.className = "gde"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", tr("Guía del juego"));
    G = {el: el, k: k || "basics", q: ""};
    document.body.appendChild(el);
    paint();
    el.addEventListener("keydown", function (e) { if (e.key === "Escape") { e.preventDefault(); close(); } });
    el.addEventListener("input", function (e) { if (e.target.id === "gdeq") { G.q = e.target.value; paintBody(); } });
    el.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-g]");
      if (!b) return;
      var a = b.getAttribute("data-g");
      if (a === "close") close();
      else if (a === "cat") { G.k = b.getAttribute("data-v"); G.q = ""; paint(); var t = el.querySelector(".gde-body"); if (t) t.scrollTop = 0; }
    });
    var f = el.querySelector(".gde-x"); if (f) f.focus({preventScroll: true});
  }
  function paint() {
    var C = cats();
    G.el.innerHTML = '<div class="gde-in"><header class="gde-top"><div><span class="eyebrow">' + tr("Tutorial") + '</span><h2>' + tr("Guía del juego") + '</h2></div><button class="gde-x" data-g="close" aria-label="' + h(tr("Cerrar")) + '">×</button></header>' +
      '<nav class="gde-cats" role="tablist">' + C.map(function (c) { return '<button role="tab" data-g="cat" data-v="' + c.k + '" aria-selected="' + (c.k === G.k) + '"><span aria-hidden="true">' + c.ic + "</span>" + h(c.n) + "</button>"; }).join("") + "</nav>" +
      '<div class="gde-body"></div></div>';
    paintBody();
    var on = G.el.querySelector('.gde-cats [aria-selected="true"]'); if (on && on.scrollIntoView) on.scrollIntoView({block: "nearest", inline: "center"});
  }
  function paintBody() {
    var c = cats().filter(function (x) { return x.k === G.k; })[0], body = G.el.querySelector(".gde-body"), s = "";
    if (c.gloss) {
      var q = G.q.trim().toLowerCase(), l = gloss().filter(function (g) { return !q || (g[0] + " " + g[1]).toLowerCase().indexOf(q) >= 0; });
      if (!body.querySelector("#gdeq")) {
        body.innerHTML = '<input id="gdeq" class="gde-q" type="search" placeholder="' + h(tr("Buscar un atributo o término…")) + '" autocomplete="off"><dl class="gde-gl"></dl>';
      }
      body.querySelector(".gde-gl").innerHTML = l.length ? l.map(function (g) { return "<div><dt>" + h(g[0]) + "</dt><dd>" + h(g[1]) + "</dd></div>"; }).join("") : '<p class="muted">' + tr("Nada coincide con tu búsqueda.") + "</p>";
      return;
    }
    s += c.cards.map(function (cd, i) {
      return '<details class="gde-card"' + (i === 0 ? " open" : "") + "><summary><b>" + h(cd.t) + '</b><span class="chev" aria-hidden="true">›</span></summary><ul>' + cd.b.map(function (x) { return "<li>" + h(x) + "</li>"; }).join("") + "</ul></details>";
    }).join("");
    body.innerHTML = s;
  }
  function close() { if (!G) return; G.el.remove(); G = null; }

  UIX.actions.guide = function (b, v) { if (UIX.ui().sheet) UIX.closeSheet(); open(v); };
  UIX.add("menu", function () { return '<button class="btn wide gde-open" data-a="guide">📖 ' + tr("Guía del juego") + "</button>"; });
  window.openGuide = open;
})();
