/* Ruedas de prensa: preguntas por contexto y respuestas (con efectos) inspiradas en frases reales */
var PRESS = {
  mgr: [
    {id: "m1", ctx: ["loss", "controversy"], q: N_("¿Qué le ha pasado hoy a su equipo ante el {opp}?"),
     a: [
       {t: N_("¿Por qué? No puedo decirlo. Si explico lo que pienso del arbitraje, tendré un problema muy grande."), fx: {fans: 4, sqMor: 2, rep: -3, board: -2}, ref: N_("Inspirada en Mourinho, 2011")},
       {t: N_("Partido a partido. Hoy no salió, el próximo sí. No hay otro camino."), fx: {sqMor: 3, board: 1, fans: -2}, ref: N_("Inspirada en Simeone, 'partido a partido'")},
       {t: N_("Es culpa mía. Me responsabilizo de todo; los jugadores han dado lo que tenían."), fx: {chem: 4, sqMor: 3, board: -2, rep: -1}, ref: N_("Inspirada en el estilo de Guardiola")},
       {t: N_("Prefiero no hablar. Cualquier cosa que diga me costará una multa y mi cuenta corriente no está para bromas."), fx: {rep: 2, board: 1, fans: -3, chem: -1}, ref: N_("Inspirada en Mourinho, 'prefiero no hablar'")}
     ]},
    {id: "m2", ctx: ["win"], q: N_("Tres puntos más. ¿Está satisfecho con el juego del equipo?"),
     a: [
       {t: N_("Salid y disfrutad. Hoy lo han hecho y eso es lo que importa: jugar bien, sin miedo."), fx: {fans: 4, chem: 2, board: -2}, ref: N_("Inspirada en Cruyff, final de 1992")},
       {t: N_("Ganar, ganar y volver a ganar. Lo demás es literatura."), fx: {board: 3, sqMor: 1, fans: -2}, ref: N_("Inspirada en Luis Aragonés")},
       {t: N_("Football, bloody hell! No sé cómo, pero nunca se acaba hasta que termina."), fx: {fans: 3, rep: 2, chem: -2}, ref: N_("Inspirada en Ferguson, 1999")},
       {t: N_("Hemos ganado, pero no me he divertido. Hay mucho que mejorar y mañana empiezo a trabajar."), fx: {board: 2, rep: 1, sqMor: -3}, ref: N_("Inspirada en el estilo de Klopp")}
     ]},
    {id: "m3", ctx: ["title", "win"], q: N_("¿Se ve ya campeón de {lg}?"),
     a: [
       {t: N_("Yo soy el normal. Me veo en el banquillo del {club}, con una cerveza y mucha humildad."), fx: {fans: 4, rep: 2, board: -2}, ref: N_("Inspirada en Klopp, 'the normal one', 2015")},
       {t: N_("Ni lo pienso. Un partido, solo uno. El del domingo es el más importante de mi vida."), fx: {sqMor: 3, chem: 2, fans: -2}, ref: N_("Inspirada en Simeone, 'partido a partido'")},
       {t: N_("Claro que sí. Soy campeón. Lo que pasa es que otros todavía no se han enterado."), fx: {fans: 5, rep: 3, chem: -3, board: -2}, ref: N_("Inspirada en Mourinho, 'The Special One', 2004")},
       {t: N_("No lo sé. Pregunte a mi ceja: si se levanta, es que podemos ganarla."), fx: {rep: 3, sqMor: 2, board: -1, fans: -1}, ref: N_("Inspirada en Ancelotti, la ceja")}
     ]},
    {id: "m4", ctx: ["draw"], q: N_("Se han dejado dos puntos ante el {opp}. ¿Qué opina?"),
     a: [
       {t: N_("Un empate no es un mal resultado. En este fútbol hay que saber sufrir."), fx: {board: 2, sqMor: 1, fans: -3}, ref: N_("Inspirada en Del Bosque")},
       {t: N_("Nos hemos dejado dos puntos por falta de ambición. No volverá a pasar, os lo aseguro."), fx: {fans: 3, board: 1, sqMor: -3, chem: -1}, ref: N_("Inspirada en Ferguson")},
       {t: N_("El balón no entró, pero tuvimos más que ellos. Quien tiene el balón, tiene el partido."), fx: {fans: 2, chem: 2, board: -2}, ref: N_("Inspirada en Cruyff")},
       {t: N_("Si pasamos un partido sin recibir gol, sumamos un punto. Y a veces es el que más pesa."), fx: {board: 3, sqMor: 1, fans: -2, rep: -1}, ref: N_("Inspirada en el estilo de Simeone")}
     ]},
    {id: "m5", ctx: ["bigwin"], q: N_("Goleada al {opp}. ¿Le sorprende el resultado?"),
     a: [
       {t: N_("Nada me sorprende. Sabía que aquí, con esta gente, los goles iban a llegar."), fx: {rep: 3, fans: 2, sqMor: -2}, ref: N_("Inspirada en Luis Enrique")},
       {t: N_("No celebramos nada. La semana que viene nos tocará otro rival y habrá que repetirlo."), fx: {board: 3, sqMor: 1, fans: -3}, ref: N_("Inspirada en Simeone")},
       {t: N_("Es el fútbol, amigo. A veces la pelota entra y a veces el poste manda. Hoy, nos amó."), fx: {fans: 3, chem: 2, rep: -2}, ref: N_("Inspirada en Bielsa")},
       {t: N_("Que celebren los jugadores. Yo me quedo en el hotel viendo el partido del {coach} y tomando notas."), fx: {rep: 2, board: 2, chem: -3}, ref: N_("Inspirada en Wenger")}
     ]},
    {id: "m6", ctx: ["bigloss"], q: N_("Una derrota así, ¿se puede explicar? ¿Pensó en dimitir?"),
     a: [
       {t: N_("Esto no es una dictadura. Yo he dado la cara, que otros den la suya. Pero no voy a dimitir."), fx: {sqMor: 3, board: -3, rep: 1, fans: -1}, ref: N_("Inspirada en Del Bosque")},
       {t: N_("Me da igual lo que digáis. Mañana trabajamos, igual que hoy. Siguiente pregunta."), fx: {chem: 3, rep: -2, fans: -2, board: -1}, ref: N_("Inspirada en Luis Enrique")},
       {t: N_("Lo siento muchísimo. Pido perdón a toda la afición. No se merecían esto, ni mucho menos."), fx: {fans: 4, board: -2, rep: -2, sqMor: 2}, ref: N_("Inspirada en Guardiola, 'I'm sorry'")},
       {t: N_("Hemos perdido, pero sé que esto me hará más fuerte. Los grandes se miden cuando se caen."), fx: {rep: 2, sqMor: 2, fans: -2, board: -1}, ref: N_("Inspirada en Ferguson")}
     ]},
    {id: "m7", ctx: ["derby"], q: N_("Era el derbi. ¿Qué significa este resultado para la afición?"),
     a: [
       {t: N_("Un derbi no se juega, se gana. Los puntos son los mismos, pero el orgullo vale el doble."), fx: {fans: 4, sqMor: 2, rep: -2}, ref: N_("Inspirada en Ferguson")},
       {t: N_("Para mí es un partido más. Tres puntos, ni más ni menos. Pero sé lo que significa para vosotros."), fx: {board: 2, chem: 1, fans: -3}, ref: N_("Inspirada en el estilo de Simeone")},
       {t: N_("Mi equipo ha hablado en el campo. No hace falta añadir nada más: el que quiera entender, que entienda."), fx: {fans: 3, rep: 2, board: -2}, ref: N_("Inspirada en Mourinho")},
       {t: N_("Ojalá la ciudad lo celebre con alegría y sin excesos. El fútbol es un juego, no una guerra."), fx: {rep: 3, board: 2, fans: -3, sqMor: -1}, ref: N_("Inspirada en Del Bosque")}
     ]},
    {id: "m8", ctx: ["final"], q: N_("Mañana se juega una final. ¿Cómo están los nervios?"),
     a: [
       {t: N_("Aquí no hay nervios. Hay ganas de salir y disfrutar. Los nervios, para los que miran desde casa."), fx: {sqMor: 4, fans: 2, board: -2}, ref: N_("Inspirada en Cruyff, 'salid y disfrutad'")},
       {t: N_("Es una final y las finales no se juegan, se ganan. No hay otra opción, y todos lo saben."), fx: {board: 3, fans: 2, sqMor: -3}, ref: N_("Inspirada en Luis Aragonés")},
       {t: N_("Nervios los tengo yo, pero los jugadores están tranquilos. Es lo mejor que me ha pasado en esta semana."), fx: {chem: 3, fans: 1, rep: -2}, ref: N_("Inspirada en Ancelotti")},
       {t: N_("Hemos preparado la final con mucho detalle. Si perdemos, será por algo que ni yo podía controlar."), fx: {rep: 2, board: 2, sqMor: -2, fans: -1}, ref: N_("Inspirada en Bielsa")}
     ]},
    {id: "m9", ctx: ["controversy"], q: N_("El árbitro anuló un gol a su equipo. ¿Le han robado?"),
     a: [
       {t: N_("Yo no hablo de árbitros. Pero si quieren hablar, ya saben que en el campo hay cosas que ven todos menos él."), fx: {fans: 4, sqMor: 2, rep: -3, board: -2}, ref: N_("Inspirada en Mourinho")},
       {t: N_("No lo vi. De verdad, no vi la jugada. Estaba mirando hacia otro lado, como siempre."), fx: {rep: 3, board: 1, fans: -2, sqMor: -1}, ref: N_("Inspirada en Wenger, 'I did not see it'")},
       {t: N_("No voy a criticar al árbitro. Se equivoca como nos equivocamos todos. Hay que seguir adelante."), fx: {rep: 3, board: 2, fans: -4, sqMor: -1}, ref: N_("Inspirada en Del Bosque")},
       {t: N_("Si el VAR existe es para esto. Que alguien me explique para qué sirve entonces. Lo demás, mejor ni decirlo."), fx: {fans: 3, sqMor: 3, board: -2, rep: -2}, ref: N_("Inspirada en Bielsa")}
     ]},
    {id: "m10", ctx: ["title"], q: N_("El {coach} dice que su equipo no aguantará la presión. ¿Responde?"),
     a: [
       {t: N_("Es un maestro del 'mind games'. Que hable lo que quiera; yo me ocupo de entrenar a mi gente."), fx: {sqMor: 3, rep: 2, fans: -2}, ref: N_("Inspirada en Ferguson, 'mind games'")},
       {t: N_("Me parece muy bien. Yo estoy muy tranquilo. Pero no creo que mi colega pueda decir lo mismo."), fx: {fans: 4, rep: 2, board: -2, chem: -1}, ref: N_("Inspirada en Ferguson y Wenger, 2009")},
       {t: N_("Con todo el respeto, hablaré con él el sábado por la noche. Si no hay lugar para charlar, será que se acabó."), fx: {fans: 3, sqMor: 2, rep: -2, board: -1}, ref: N_("Inspirada en Mourinho")},
       {t: N_("No digo nada. Cada uno se cuida. A mí lo que me preocupa es si mañana el césped está en condiciones."), fx: {board: 2, rep: 1, fans: -3, sqMor: 1}, ref: N_("Inspirada en el estilo de Del Bosque")}
     ]},
    {id: "m11", ctx: ["relegation"], q: N_("Están en puestos de descenso. ¿Tiene miedo?"),
     a: [
       {t: N_("Miedo tengo a lo que no puedo controlar. Y esto sí lo controlo: trabajo, esfuerzo y uno a uno, los partidos."), fx: {sqMor: 3, chem: 2, fans: -2}, ref: N_("Inspirada en Simeone")},
       {t: N_("Me da igual la clasificación. Si juego a lo mío, los puntos llegarán. Y si no, que me echen."), fx: {fans: 2, chem: 2, board: -3, rep: 1}, ref: N_("Inspirada en Luis Enrique")},
       {t: N_("No tengo miedo. He vivido peores momentos. Seguiré dando guerra hasta que nos salvemos o me echen."), fx: {fans: 3, sqMor: 1, board: -1, rep: -1}, ref: N_("Inspirada en Ferguson")},
       {t: N_("Hay que ser realistas: estamos mal. Si me preguntan, hacen falta refuerzos. Y los quiero ya."), fx: {board: -3, fans: 2, sqMor: 3, rep: 1}, ref: N_("Inspirada en Wenger")}
     ]},
    {id: "m12", ctx: ["injury"], q: N_("{player} estará varias semanas lesionado. ¿Cómo afecta al equipo?"),
     a: [
       {t: N_("Es una pérdida enorme, pero tenemos un plantel capaz de suplir a cualquiera. Los demás tendrán su oportunidad."), fx: {sqMor: 3, chem: 2, fans: -2}, ref: N_("Inspirada en Guardiola")},
       {t: N_("Un jugador no hace a un equipo. Y quien crea lo contrario no ha jugado nunca al fútbol."), fx: {chem: 3, rep: 1, fans: -2, sqMor: -2}, ref: N_("Inspirada en Cruyff")},
       {t: N_("Es un palo tremendo. Ya estamos pidiendo al club que busque a alguien. Como sea y cuando sea."), fx: {board: -3, fans: 2, sqMor: 2, rep: 1}, ref: N_("Inspirada en Wenger")},
       {t: N_("No daré más detalles de la lesión. Es información reservada. Que se las arreglen los rivales para averiguarla."), fx: {rep: 2, board: 2, fans: -3, chem: -1}, ref: N_("Inspirada en Bielsa")}
     ]},
    {id: "m13", ctx: ["rumour"], q: N_("Se habla de que otro club le quiere. ¿Se queda en el {club}?"),
     a: [
       {t: N_("Mi mujer me dice que me quede. Y en casa manda ella. Así que sí, me quedo."), fx: {fans: 3, board: 3, rep: -1, sqMor: -1}, ref: N_("Inspirada en Ancelotti")},
       {t: N_("Hablaré del futuro cuando termine la temporada. Ahora mismo mi única obsesión es el siguiente partido."), fx: {sqMor: 2, board: 1, fans: -3}, ref: N_("Inspirada en Simeone")},
       {t: N_("Soy entrenador. Tengo contrato, pero mañana puedo estar en la calle. Así es esto y no me asusta."), fx: {rep: 3, chem: 1, board: -2, fans: -1}, ref: N_("Inspirada en Wenger")},
       {t: N_("Si me ofrecen más dinero y un proyecto ganador, lo escucharé. Los románticos ya no existen."), fx: {rep: 3, board: -4, fans: -3, sqMor: 1}, ref: N_("Inspirada en Mourinho")}
     ]},
    {id: "m14", ctx: ["crisis"], q: N_("Cinco partidos sin ganar. ¿Siente que peligra su puesto?"),
     a: [
       {t: N_("Mi puesto es del club, no mío. Si quieren cambiarlo, ahí está la puerta. Pero antes debemos trabajar."), fx: {board: 2, sqMor: 1, fans: -2, rep: 1}, ref: N_("Inspirada en Zidane, 2018")},
       {t: N_("La presión es un privilegio. No te quejes de ella, porque quiere decir que hay algo grande en juego."), fx: {sqMor: 3, rep: 1, board: -1, fans: -1}, ref: N_("Inspirada en Ferguson, 'squeaky bum time'")},
       {t: N_("Vamos a cambiar la dinámica. Trabajamos desde esta noche y ya nadie hablará de esto."), fx: {fans: 3, chem: 1, board: -2, rep: -1}, ref: N_("Inspirada en Luis Aragonés")},
       {t: N_("No miro la clasificación. Si pierdo mi puesto, será por hacerlo a mi manera. No tengo otra forma."), fx: {chem: 3, rep: 2, board: -3, fans: -2}, ref: N_("Inspirada en Bielsa")}
     ]},
    {id: "m15", ctx: ["any"], q: N_("¿Cuál es su filosofía de juego?"),
     a: [
       {t: N_("Si tienes la pelota, el rival no puede marcar. El fútbol es así de simple, aunque lo más difícil es jugar simple."), fx: {fans: 3, rep: 3, board: -2, sqMor: -1}, ref: N_("Inspirada en Cruyff")},
       {t: N_("Intensidad, corazón y fútbol de metal. El fútbol bonito me gusta, pero ganar a lo grande me gusta más."), fx: {fans: 3, sqMor: 2, rep: -1, chem: -1}, ref: N_("Inspirada en Klopp, 'heavy metal football'")},
       {t: N_("Defender bien y salir rápido. Si alguien me dice que es feo, que me enseñe la copa que ha ganado él."), fx: {board: 3, sqMor: 1, fans: -3, rep: -1}, ref: N_("Inspirada en Simeone")},
       {t: N_("Siempre adaptarse al jugador que tienes. No hay una filosofía, hay una plantilla y un rival delante."), fx: {rep: 2, chem: 3, fans: -2, board: -1}, ref: N_("Inspirada en Ancelotti")}
     ]},
    {id: "m16", ctx: ["any"], q: N_("¿Qué mensaje quiere mandar a la afición del {club}?"),
     a: [
       {t: N_("Que crean. Que vengan al campo, que empujen, que sufran con nosotros. Sin ellos no somos nada."), fx: {fans: 5, board: 1, rep: -1, sqMor: -1}, ref: N_("Inspirada en Simeone, 'Creer'")},
       {t: N_("Que tengan paciencia. Esto es un proceso y los procesos llevan tiempo. Si no, que compren un reloj."), fx: {board: 2, chem: 2, fans: -3, rep: 1}, ref: N_("Inspirada en el estilo de Wiegman")},
       {t: N_("Que sepan que lo único que me importa es ganar. Y que si no pierdo yo, perderán otros."), fx: {fans: 3, rep: 2, chem: -2, board: -1}, ref: N_("Inspirada en Luis Aragonés")},
       {t: N_("Gracias. Y perdón por adelantado por los próximos errores, que los habrá. Gracias, de verdad."), fx: {fans: 4, sqMor: 1, rep: -2, board: -1}, ref: N_("Inspirada en Guardiola, 'I'm sorry'")}
     ]},
    {id: "m17", ctx: ["loss"], q: N_("Pierden de nuevo. ¿Se ha plantado en el vestuario?"),
     a: [
       {t: N_("No he gritado ni he roto ninguna taza. Prefiero hablar con ellos uno a uno. Y casi siempre acabo escuchando."), fx: {chem: 4, sqMor: 2, fans: -2, board: -1}, ref: N_("Inspirada en Ancelotti")},
       {t: N_("Hubo secador de pelo. Y un par de platos volando. Pero lo que pasa en el vestuario se queda en el vestuario."), fx: {sqMor: -3, rep: 2, board: 2, fans: 2}, ref: N_("Inspirada en Ferguson, 'hairdryer treatment'")},
       {t: N_("Les dije que me siguieran o se fueran. Los que se queden estarán conmigo hasta el final, y punto."), fx: {sqMor: 2, chem: -3, fans: 2, board: 1}, ref: N_("Inspirada en Mourinho")},
       {t: N_("Sin comentarios. Si cada vez que perdemos preguntan por el vestuario, nos quedamos sin vestuario."), fx: {board: 2, rep: 1, fans: -3, chem: -1}, ref: N_("Inspirada en Zidane")}
     ]},
    {id: "m18", ctx: ["win", "derby"], q: N_("Ganan el derbi. ¿A quién dedica la victoria?"),
     a: [
       {t: N_("A los que han sufrido durante toda la semana. A mi familia, a mi staff y a nadie de la prensa."), fx: {chem: 3, sqMor: 3, rep: -2, fans: 1}, ref: N_("Inspirada en Simeone")},
       {t: N_("A los hinchas, a la ciudad y a todos los que dijeron que este equipo no podía. A ellos, de corazón."), fx: {fans: 5, rep: -1, board: -1, sqMor: 1}, ref: N_("Inspirada en Ferguson")},
       {t: N_("Se la dedico a mí mismo. Hay que ser egoísta para ser feliz en este oficio. Y hoy lo soy mucho."), fx: {rep: 3, fans: 1, chem: -3, board: -1}, ref: N_("Inspirada en Mourinho")},
       {t: N_("Al fútbol. Hemos jugado bien, hemos ganado y se ha respetado al rival. Es la mejor dedicatoria posible."), fx: {rep: 3, board: 2, fans: -3, sqMor: -1}, ref: N_("Inspirada en Del Bosque")}
     ]},
    {id: "m19", ctx: ["bigloss", "crisis"], q: N_("¿Qué debe cambiar para evitar otra goleada como esta?"),
     a: [
       {t: N_("Todo. Y lo digo en serio. Desde esta noche vamos a replantearnos hasta la forma de calentar."), fx: {chem: -2, fans: 3, sqMor: 1, board: 1}, ref: N_("Inspirada en Bielsa")},
       {t: N_("Nada. Hay que seguir con lo mismo. Si cambio por una derrota, mañana perderé mi identidad, y ese es mi mayor activo."), fx: {sqMor: 3, rep: 2, fans: -3, board: -2}, ref: N_("Inspirada en Guardiola")},
       {t: N_("Debemos ser más duros atrás y más listos delante. Y más listos en conferencia, ya que estamos."), fx: {board: 2, fans: 1, rep: -2, chem: 1}, ref: N_("Inspirada en Wenger")},
       {t: N_("Pregunten a los jugadores. Yo ya les he dicho lo que tengo que decirles, y no ha sido agradable."), fx: {board: 1, rep: 1, chem: -4, sqMor: -2, fans: 1}, ref: N_("Inspirada en Ferguson")}
     ]},
    {id: "m20", ctx: ["draw", "title"], q: N_("Empate y el liderato se escapa. ¿Pesa la presión?"),
     a: [
       {t: N_("Presión es lo que sienten los que no tienen trabajo. Nosotros tenemos un partido, y es el siguiente."), fx: {sqMor: 3, chem: 1, fans: -2}, ref: N_("Inspirada en Simeone")},
       {t: N_("Claro que pesa. Pero me gusta que pese; es señal de que estamos donde queremos estar."), fx: {fans: 2, rep: 2, board: -1, sqMor: -2}, ref: N_("Inspirada en Ferguson")},
       {t: N_("No miro lo que hacen los demás. Miro a mis jugadores y a su cara, y su cara me dice que vamos bien."), fx: {chem: 3, sqMor: 2, fans: -2, board: -1}, ref: N_("Inspirada en Ancelotti")},
       {t: N_("Nadie nos regala nada. Nos han empatado porque no hemos sido letales. Y los letales ganan títulos."), fx: {board: 2, fans: 1, sqMor: -3, rep: 1}, ref: N_("Inspirada en el estilo de Wenger")}
     ]},
    {id: "m21", ctx: ["final", "win"], q: N_("¡Campeones! ¿Qué siente en este momento?"),
     a: [
       {t: N_("Ahora sí. Pero no preguntéis por la próxima, que mi lugar favorito es el banquillo de al lado, con los suplentes."), fx: {fans: 4, chem: 3, rep: -1, board: -1}, ref: N_("Inspirada en Ancelotti")},
       {t: N_("Hoy no habrá comentarios, solo cervezas. Y las pagan los que dudaron de nosotros desde agosto."), fx: {fans: 4, sqMor: 2, rep: -2, board: -1}, ref: N_("Inspirada en Luis Aragonés")},
       {t: N_("Un título es un título. Mañana nos lo habremos olvidado y empezamos a trabajar, que de eso se trata."), fx: {board: 3, rep: 2, fans: -3, sqMor: -1}, ref: N_("Inspirada en Simeone")},
       {t: N_("Esto es para quienes no creyeron y para los que sí. Y para un servidor, que lo merecía como nadie."), fx: {rep: 4, fans: 2, chem: -3, board: -1}, ref: N_("Inspirada en Mourinho, 'Special One'")}
     ]},
    {id: "m22", ctx: ["final", "loss"], q: N_("Perdieron la final. ¿Qué le dice a los aficionados?"),
     a: [
       {t: N_("Que gracias por todo. Hemos perdido, pero hemos competido con orgullo. Las finales se pierden cuando se juegan."), fx: {fans: 4, sqMor: 2, rep: -2, board: -2}, ref: N_("Inspirada en Del Bosque")},
       {t: N_("Que no se hundan. Nosotros tampoco. Mañana volvemos a levantarnos, aunque sea con la cabeza como un bombo."), fx: {sqMor: 3, chem: 2, fans: -1, board: -1}, ref: N_("Inspirada en Klopp")},
       {t: N_("Que no me pidan explicaciones de una final perdida. Hace falta un poco de suerte, y hoy no la teníamos."), fx: {board: 2, rep: 1, fans: -3, sqMor: -1}, ref: N_("Inspirada en Wenger")},
       {t: N_("Es culpa mía, y solo mía. Una semana a oscuras para reflexionar. Que nadie más cargue con esto."), fx: {chem: 4, sqMor: 3, board: -3, rep: -2}, ref: N_("Inspirada en el estilo de Guardiola")}
     ]},
    {id: "m23", ctx: ["controversy"], q: N_("{player} se enzarzó en una pelea en pleno campo. ¿Lo sancionará?"),
     a: [
       {t: N_("Lo que pasa en el campo se queda en el campo. Pero a él le voy a poner una multa que le dolerá."), fx: {chem: 2, board: 2, sqMor: -3, fans: -1}, ref: N_("Inspirada en Ferguson")},
       {t: N_("No lo vi. Y si lo vi, no era tan grave. El otro empezó, seguro. Pregunten al otro."), fx: {sqMor: 3, fans: 2, rep: -3, board: -2}, ref: N_("Inspirada en Wenger, 'I did not see it'")},
       {t: N_("Lo defiendo hasta las últimas consecuencias. Es mi jugador y se juega la vida por este escudo."), fx: {sqMor: 4, chem: 3, rep: -3, board: -3}, ref: N_("Inspirada en Mourinho")},
       {t: N_("Hablaré con él en privado. Aquí en público solo digo que no representa los valores de este club."), fx: {rep: 3, board: 3, sqMor: -4, chem: -2}, ref: N_("Inspirada en Klopp")}
     ]},
    {id: "m24", ctx: ["controversy"], q: N_("Le han multado por sus declaraciones sobre el arbitraje. ¿Se arrepiente?"),
     a: [
       {t: N_("Me arrepiento de pagar. Lo dicho, dicho está. Y si hace falta, lo repito, que me sale barato."), fx: {fans: 4, sqMor: 2, board: -3, rep: -2}, ref: N_("Inspirada en Mourinho")},
       {t: N_("Yo no he dicho nada ofensivo. He dicho lo que todos piensan. Y a mí me caen las multas por pensar en voz alta."), fx: {fans: 3, rep: -2, board: -1, chem: 1}, ref: N_("Inspirada en Luis Enrique")},
       {t: N_("Pido disculpas. Me dejé llevar por la emoción. No volverá a pasar, aunque soy de los que repiten."), fx: {rep: 3, board: 3, fans: -3, sqMor: -2}, ref: N_("Inspirada en Klopp")},
       {t: N_("Esta es mi gente y es mi equipo. Si por defenderlos me multan, que me multen cien veces."), fx: {fans: 3, sqMor: 3, board: -2, rep: -2}, ref: N_("Inspirada en Simeone")}
     ]},
    {id: "m25", ctx: ["rumour"], q: N_("{player} quiere salir del club. ¿Lo venderá?"),
     a: [
       {t: N_("Aquí nadie es imprescindible. Si quiere irse, que se vaya, pero con la maleta y por la puerta de atrás."), fx: {board: 2, chem: -4, sqMor: -2, fans: 1}, ref: N_("Inspirada en Ferguson")},
       {t: N_("Solo se va quien yo quiero que se vaya. Y {player} es un jugador que siempre querré tener en mi equipo."), fx: {sqMor: 3, chem: 3, board: -2, rep: -1}, ref: N_("Inspirada en Mourinho")},
       {t: N_("Hablaré con él cara a cara. Si de verdad no es feliz, buscaremos una solución que nos convenga a ambos."), fx: {rep: 2, chem: 2, board: -1, fans: -3}, ref: N_("Inspirada en Ancelotti")},
       {t: N_("Nadie me ha dicho nada. Me enteré por la prensa, como vosotros. Aquí hay mucho humo y poco fuego."), fx: {fans: 2, board: 1, rep: -2, sqMor: -2}, ref: N_("Inspirada en Wenger")}
     ]},
    {id: "m26", ctx: ["injury", "controversy"], q: N_("{player} sufre una lesión grave tras una entrada del {opp}. ¿Culpa al rival?"),
     a: [
       {t: N_("No señalo a nadie. Pero si hubiera más justicia, la entrada merecería algo más que una tarjeta amarilla."), fx: {fans: 3, sqMor: 3, rep: -2, board: -1}, ref: N_("Inspirada en Mourinho")},
       {t: N_("El fútbol es duro, ya lo sabemos. No hay mala intención. Le deseo un pronto regreso a mi jugador."), fx: {rep: 4, board: 2, fans: -3, sqMor: -2}, ref: N_("Inspirada en Del Bosque")},
       {t: N_("El fútbol que me gusta es el del balón, no el de los tobillos. Pero hoy no tengo ganas de hablar de eso."), fx: {chem: 2, rep: 2, fans: -2, board: -1}, ref: N_("Inspirada en Cruyff")},
       {t: N_("Voy a pedir explicaciones oficiales a la liga. El que arriesga la salud de un compañero tiene que pagar."), fx: {fans: 3, board: 3, rep: -3, chem: 1}, ref: N_("Inspirada en Bielsa")}
     ]},
    {id: "m27", ctx: ["relegation", "win"], q: N_("Victoria vital en la lucha por la permanencia. ¿Están salvados?"),
     a: [
       {t: N_("Hasta que las matemáticas no lo digan, no. Nos quedan partidos, y los voy a jugar con el cuchillo entre los dientes."), fx: {sqMor: 2, chem: 2, fans: -2, board: 1}, ref: N_("Inspirada en Simeone")},
       {t: N_("Hoy, un poquito más cerca. Lo que no ganamos es el aplauso: eso lo reservo para el final de temporada."), fx: {fans: 3, sqMor: 2, rep: -1, board: -1}, ref: N_("Inspirada en Ancelotti")},
       {t: N_("No miro la clasificación. Miro a mis jugadores, que tienen el corazón de un campeón."), fx: {sqMor: 3, chem: 2, board: -1, fans: -1}, ref: N_("Inspirada en Luis Aragonés")},
       {t: N_("Queda mucho. Pero que quede claro que este es el mejor trabajo de mi vida, y lo digo con orgullo."), fx: {rep: 3, board: 2, chem: -3, fans: 1}, ref: N_("Inspirada en Ferguson")}
     ]},
    {id: "m28", ctx: ["relegation", "loss", "crisis"], q: N_("Cada vez más cerca del descenso. ¿Qué le dice al vestuario?"),
     a: [
       {t: N_("Les digo que nadie nos regalará nada. Y que esta situación nos pertenece a todos, empezando por mí."), fx: {chem: 3, sqMor: 3, fans: -2, board: -2}, ref: N_("Inspirada en Klopp")},
       {t: N_("Les digo que mañana, entrenamiento a las 7. El que no esté, que busque equipo."), fx: {board: 3, sqMor: -3, chem: -2, fans: 2}, ref: N_("Inspirada en Ferguson")},
       {t: N_("Les digo que sonrían. Un equipo que sufre sin disfrutar ya ha perdido. Por lo menos disfrutemos."), fx: {chem: 3, fans: 1, board: -2, sqMor: 1, rep: -1}, ref: N_("Inspirada en Cruyff")},
       {t: N_("Nada. Prefiero el silencio. A veces las palabras sobran y hay que dejar que hable el trabajo."), fx: {rep: 2, board: 1, fans: -3, sqMor: -2}, ref: N_("Inspirada en Zidane")}
     ]},
    {id: "m29", ctx: ["title", "loss"], q: N_("Pierden y el título se complica. ¿Sigue vivo el sueño?"),
     a: [
       {t: N_("Vivo, vivísimo. Aún quedan jornadas, y yo he visto cosas mucho más raras en mis años de oficio."), fx: {fans: 3, sqMor: 2, rep: -1, board: -2}, ref: N_("Inspirada en Luis Aragonés")},
       {t: N_("Un título no se pierde en una tarde. Se pierde en una semana de mala cabeza. Y de eso hoy tenemos poco."), fx: {board: 2, rep: 2, fans: -2, sqMor: -2}, ref: N_("Inspirada en Wenger")},
       {t: N_("Yo he ganado campeonatos perdiendo partidos peores. La liga es de resistencia, no de velocidad."), fx: {sqMor: 3, chem: 1, fans: -2, board: -1}, ref: N_("Inspirada en Ferguson")},
       {t: N_("Si alguien quiere abandonar el barco, que lo haga ahora. A los que se queden les prometo tormenta y gloria."), fx: {chem: -3, sqMor: 2, fans: 4, rep: 1}, ref: N_("Inspirada en Klopp")}
     ]},
    {id: "m30", ctx: ["crisis", "any"], q: N_("La prensa dice que el vestuario está dividido. ¿Es cierto?"),
     a: [
       {t: N_("Hay un vestuario unido, y un periodista dividido. Desde luego no es el mío el que tiene problemas."), fx: {sqMor: 3, chem: 2, rep: -3, fans: 1}, ref: N_("Inspirada en Mourinho")},
       {t: N_("Hay problemas, como en todas las casas. Pero los resolvemos en familia, no aquí delante de las cámaras."), fx: {chem: 3, board: 2, fans: -3, rep: 1}, ref: N_("Inspirada en Del Bosque")},
       {t: N_("En el vestuario se discute y se grita. Y eso es bueno. Mala señal sería que nadie se atreviera a alzar la voz."), fx: {chem: -2, sqMor: 2, fans: 2, rep: 1}, ref: N_("Inspirada en Ferguson")},
       {t: N_("¿Dividido? Si lo estuviera, lo sabría. Solo sé que tengo 25 jugadores y todos quieren jugar. Ese es el problema."), fx: {rep: 2, fans: 1, sqMor: -3, chem: 1}, ref: N_("Inspirada en Ancelotti")}
     ]},
    {id: "m31", ctx: ["derby", "loss"], q: N_("Pierden el derbi en casa. ¿Qué le dice a la afición?"),
     a: [
       {t: N_("Perdón. Perdón por no estar a la altura de este escudo y de su gente. No volverá a ocurrir."), fx: {fans: 4, sqMor: 1, board: -2, rep: -2}, ref: N_("Inspirada en Guardiola, 'I'm sorry'")},
       {t: N_("Que no pierdan la fe. Un derbi se pierde, pero la temporada es larga. Ya les devolveremos la sonrisa."), fx: {fans: 3, sqMor: 2, rep: -1, board: -1}, ref: N_("Inspirada en Ancelotti")},
       {t: N_("Que miren el marcador: está claro. Pero también que miren el juego: nos merecimos más. El fútbol a veces es injusto."), fx: {chem: 2, rep: 1, fans: -2, board: -1}, ref: N_("Inspirada en Cruyff")},
       {t: N_("No hay excusas. Ellos fueron mejores, y punto. Ahora toca levantarse y demostrar de qué estamos hechos."), fx: {rep: 2, board: 2, sqMor: -2, fans: -1}, ref: N_("Inspirada en Klopp")}
     ]},
    {id: "m32", ctx: ["bigwin", "title"], q: N_("Goleada y liderato. ¿Hay un rival capaz de pararlos?"),
     a: [
       {t: N_("Sí, nosotros mismos. El mayor peligro de un equipo grande es creerse invencible. Y yo no se lo permitiré."), fx: {board: 3, sqMor: 1, fans: -2, rep: 1}, ref: N_("Inspirada en Ferguson")},
       {t: N_("Eso nos encantaría saberlo. Ven a vernos jugar, y si encuentras algo, me avisas."), fx: {fans: 4, rep: 2, chem: -2, board: -1}, ref: N_("Inspirada en Mourinho")},
       {t: N_("Invencibles no hay. Pero con este fútbol, perder será más difícil que ganar. Ya lo hicimos una vez."), fx: {fans: 3, rep: 3, sqMor: -2, board: -1}, ref: N_("Inspirada en Wenger, 'los Invencibles'")},
       {t: N_("Hay cien equipos capaces. Y mañana, en la radio, algún ex jugador dirá que somos aburridos."), fx: {rep: 2, chem: 2, fans: -2, board: -1}, ref: N_("Inspirada en Guardiola")}
     ]},
    {id: "m33", ctx: ["win", "any"], q: N_("¿Qué ha cambiado respecto al partido anterior?"),
     a: [
       {t: N_("Nada. Seguimos igual, con el mismo trabajo. A veces el fútbol te da lo que antes te quitó."), fx: {sqMor: 2, chem: 2, rep: -1, fans: -1}, ref: N_("Inspirada en Simeone")},
       {t: N_("Hablé con ellos, les puse un vídeo de hace tres años y todo el mundo lloró. Ya veis, así de fácil."), fx: {chem: 3, sqMor: 2, rep: -2, board: -1}, ref: N_("Inspirada en Klopp")},
       {t: N_("Hemos cambiado el sistema. Me encanta cuando la prensa se da cuenta de que no soy un dogmático."), fx: {rep: 3, fans: 1, chem: -2, board: 1}, ref: N_("Inspirada en Bielsa")},
       {t: N_("Hemos tenido suerte. Hay que decirlo: a veces ganas y no sabes por qué. Disfrutemos antes de que cambie."), fx: {fans: 3, rep: 1, sqMor: -2, board: -1}, ref: N_("Inspirada en Luis Aragonés")}
     ]},
    {id: "m34", ctx: ["any"], q: N_("¿Cómo definiría su relación con la directiva del {club}?"),
     a: [
       {t: N_("Excelente. Hablamos todos los días, nos entendemos con una mirada. Y no, no estoy amenazado."), fx: {board: 4, fans: -2, rep: -1, sqMor: 1}, ref: N_("Inspirada en Zidane")},
       {t: N_("Hay respeto mutuo, pero cada uno mira por su cartera. Yo la mía y ellos la suya."), fx: {rep: 2, board: -2, fans: 2, chem: 1}, ref: N_("Inspirada en Wenger")},
       {t: N_("Complicada. Dicen que no tienen dinero, pero luego compran un hotel. Dejémoslo ahí."), fx: {fans: 4, sqMor: 2, board: -5, rep: 1}, ref: N_("Inspirada en Mourinho")},
       {t: N_("Soy un trabajador del club. Hago lo que me piden y ellos hacen lo suyo. Así de sencillo."), fx: {board: 2, rep: 1, fans: -3, sqMor: -1}, ref: N_("Inspirada en Del Bosque")}
     ]},
    {id: "m35", ctx: ["rumour", "any"], q: N_("Un periódico dice que usted ha pedido fichajes y le han dicho que no."), 
     a: [
       {t: N_("Con lo que tengo, voy a pelear. Y si ganamos, que nadie me pregunte por fichajes. Y si perdemos, tampoco."), fx: {sqMor: 3, board: 2, fans: -2, rep: -1}, ref: N_("Inspirada en Simeone")},
       {t: N_("Quiero un equipo competitivo. Y no estoy dispuesto a mentir: lo que tenemos no basta para pelear por todo."), fx: {fans: 3, sqMor: 1, board: -4, rep: 1}, ref: N_("Inspirada en Wenger")},
       {t: N_("Si quiero a un jugador, se lo digo al club y ya está. Lo que sea, pero no lo cuento en la rueda de prensa."), fx: {board: 3, rep: 2, fans: -3, chem: 1}, ref: N_("Inspirada en Ancelotti")},
       {t: N_("Es mentira. Lo que he pedido es que el hotel tenga mejor café. Eso sí lo he pedido, y con insistencia."), fx: {fans: 2, rep: 2, board: -1, chem: -1}, ref: N_("Inspirada en Klopp")}
     ]},
    {id: "m36", ctx: ["draw", "controversy"], q: N_("Un penalti dudoso en el último minuto les cuesta la victoria. ¿Qué opina?"),
     a: [
       {t: N_("Es el fútbol moderno. Con 30 cámaras no hay manera de decidir si es penalti. Con cero cámaras era más fácil."), fx: {rep: 2, fans: 2, board: 1, sqMor: -1}, ref: N_("Inspirada en Wenger")},
       {t: N_("No hablo de árbitros, pero me preguntaría quién designa a quién y con qué criterios. Eso que lo piensen otros."), fx: {fans: 4, sqMor: 2, rep: -3, board: -2}, ref: N_("Inspirada en Mourinho")},
       {t: N_("Hay que aceptar las decisiones. Hemos tenido ocasiones para cerrar el partido antes y no lo hicimos."), fx: {rep: 3, board: 2, fans: -3, sqMor: -2}, ref: N_("Inspirada en Del Bosque")},
       {t: N_("Yo ni lo vi. Ni el penalti ni el árbitro. Estaba concentrado en el partido, como corresponde."), fx: {chem: 2, fans: 1, rep: -1, board: -1}, ref: N_("Inspirada en Wenger, 'I did not see it'")}
     ]},
    {id: "m37", ctx: ["injury", "crisis"], q: N_("Con tantas bajas, ¿es excusa para los malos resultados?"),
     a: [
       {t: N_("Excusa, no. Pero verdad, sí. Con diez lesionados y los mismos veintidós convocados no se hacen milagros."), fx: {fans: 3, sqMor: 2, board: -2, rep: -1}, ref: N_("Inspirada en Klopp")},
       {t: N_("No hablo de bajas. Quien juega, juega, y el que no está, no existe. Esto es fútbol, no una enfermería."), fx: {board: 3, chem: 1, sqMor: -2, fans: -1}, ref: N_("Inspirada en Simeone")},
       {t: N_("Es un problema, claro. Pero también es una oportunidad para los jóvenes. Los vais a ver, y os van a gustar."), fx: {chem: 3, fans: 2, board: 1, rep: -2}, ref: N_("Inspirada en Ferguson")},
       {t: N_("No me gusta hablar de lesionados. Pero sí diré que el calendario es un crimen y que alguien debería hacer algo."), fx: {rep: 2, fans: 2, board: -2, chem: 1}, ref: N_("Inspirada en Guardiola")}
     ]},
    {id: "m38", ctx: ["final", "derby"], q: N_("La final es contra su eterno rival. ¿Más presión o más motivación?"),
     a: [
       {t: N_("Motivación total. Es la final que cualquier niño soñó jugar, y me importa muy poco lo demás."), fx: {fans: 4, sqMor: 3, rep: -1, board: -1}, ref: N_("Inspirada en Ferguson")},
       {t: N_("Las dos. Pero si los jugadores se creen que es un partido más, se equivocan. Esto no es un partido más."), fx: {board: 2, chem: 1, sqMor: -2, fans: 2}, ref: N_("Inspirada en Luis Aragonés")},
       {t: N_("Lo único que importa es el balón. Si lo tenemos nosotros, nada de lo anterior tiene la mayor importancia."), fx: {rep: 3, chem: 2, fans: -2, board: -1}, ref: N_("Inspirada en Cruyff")},
       {t: N_("Presión solo la que se ponga la prensa. En la final yo estaré tranquilo, bebiendo té con los jugadores."), fx: {sqMor: 3, chem: 2, fans: -3, board: -1}, ref: N_("Inspirada en Ancelotti")}
     ]},
    {id: "m39", ctx: ["rumour", "crisis"], q: N_("¿Ha hablado con la directiva sobre su continuidad?"),
     a: [
       {t: N_("Mi continuidad es lo de menos. Hablaré cuando tenga algo que contar, no antes ni después."), fx: {board: 2, rep: 1, fans: -3, sqMor: -1}, ref: N_("Inspirada en Zidane")},
       {t: N_("Me han dicho que tengo su apoyo total. Eso significa que me quedan dos semanas, según mi experiencia."), fx: {fans: 3, rep: 2, board: -3, sqMor: -1}, ref: N_("Inspirada en Mourinho")},
       {t: N_("No tengo nada que hablar. Solo trabajo. Cuando quieran echarme, no necesitan que se lo pida yo."), fx: {sqMor: 2, chem: 2, board: -2, fans: -1}, ref: N_("Inspirada en Luis Enrique")},
       {t: N_("Mi contrato dura hasta que dure. Después, buscaré otro club, otra ciudad. Pero ahora estoy aquí, a muerte."), fx: {fans: 3, board: 2, rep: -2, sqMor: 1, chem: -1}, ref: N_("Inspirada en Wenger")}
     ]},
    {id: "m40", ctx: ["title", "final"], q: N_("Última jornada: si ganan, son campeones. ¿Cómo lo vive?"),
     a: [
       {t: N_("Con calma. He visto muchas de estas, y lo único que importa es no cambiar nada. Ni el menú."), fx: {sqMor: 3, chem: 2, fans: -2, board: -1}, ref: N_("Inspirada en Ancelotti")},
       {t: N_("Con el estómago revuelto. Y no sé cómo lo hace Ferguson desde hace años: yo me muero."), fx: {fans: 3, rep: 1, sqMor: -3, board: 1}, ref: N_("Inspirada en Ferguson")},
       {t: N_("Como un partido más. Lo que tenga que ser será, y no habrá marcha atrás. Gane o pierda, sigo siendo yo."), fx: {rep: 2, chem: 2, fans: -3, board: -1}, ref: N_("Inspirada en Del Bosque")},
       {t: N_("Con hambre. Hambre de títulos, hambre de ganar. A quien no tenga hambre le invito a ver el partido desde la grada."), fx: {sqMor: 2, fans: 3, chem: -3, board: 1}, ref: N_("Inspirada en Klopp")}
     ]},
    {id: "m41", ctx: ["draw"], q: N_("¿Merecían más? Parece que tuvieron mejores ocasiones."), 
     a: [
       {t: N_("Merecimos ganar. Pero el fútbol no es una cuestión de merecimientos, sino de goles. Y esos no entraron."), fx: {fans: 2, rep: 1, board: -1, sqMor: -2}, ref: N_("Inspirada en Luis Aragonés")},
       {t: N_("Ni más ni menos. Un punto es un punto. Y a quienes miran la tabla les diré: los puntos no se regalan."), fx: {board: 3, sqMor: 1, fans: -3, rep: -1}, ref: N_("Inspirada en Simeone")},
       {t: N_("Merecimos más y merecimos menos. Es fútbol, ¿qué queréis? Si no hay emoción, tampoco hay negocio."), fx: {rep: 2, fans: 1, chem: 1, board: -2}, ref: N_("Inspirada en Ancelotti")},
       {t: N_("Los números dicen una cosa y el marcador otra. Me quedo con los números; el marcador es cuestión de azar."), fx: {rep: 3, chem: 2, fans: -3, board: -1}, ref: N_("Inspirada en Bielsa")}
     ]},
    {id: "m42", ctx: ["bigwin", "win"], q: N_("Cuatro goles esta tarde. ¿Se acabaron las dudas sobre el equipo?"),
     a: [
       {t: N_("Las dudas nunca se acaban. Las dudas son lo que nos mantiene vivos. Mañana, de nuevo a empezar."), fx: {sqMor: 2, chem: 1, fans: -1, board: 1}, ref: N_("Inspirada en Bielsa")},
       {t: N_("Dudas, ninguna. Es el mejor equipo en el que he trabajado. Y lo dice alguien que ha estado en sitios grandes."), fx: {fans: 4, sqMor: 3, rep: -2, board: -1}, ref: N_("Inspirada en Mourinho")},
       {t: N_("Una golondrina no hace verano. Hoy ha salido todo, pero el domingo, con la lluvia, veremos quién tiene hambre."), fx: {board: 3, rep: 1, fans: -3, sqMor: -1}, ref: N_("Inspirada en Del Bosque")},
       {t: N_("Un día así nos devuelve la sonrisa. Y la sonrisa es el primer paso. El segundo es repetirlo."), fx: {chem: 3, fans: 3, board: -1, rep: -1}, ref: N_("Inspirada en Klopp")}
     ]},
    {id: "m43", ctx: ["any"], q: N_("Otros clubes gastan mucho más que ustedes. ¿Es una desventaja?"),
     a: [
       {t: N_("Cada desventaja tiene su ventaja. Con menos dinero, tenemos más hambre. Y el hambre gana más partidos que el oro."), fx: {fans: 3, sqMor: 3, board: -2, rep: 1}, ref: N_("Inspirada en Cruyff")},
       {t: N_("El dinero no da la felicidad, pero ayuda a dormir tranquilo. Os lo digo yo, que lo sé bien."), fx: {board: -3, fans: 2, rep: 2, sqMor: -1}, ref: N_("Inspirada en Wenger")},
       {t: N_("Es una desventaja, claro. Pero a nosotros nadie nos regaló nunca nada. Por eso siempre seremos distintos."), fx: {fans: 4, chem: 2, rep: -2, board: -1}, ref: N_("Inspirada en Simeone")},
       {t: N_("Yo solo trabajo con lo que tengo. Hablar de dinero es cosa de la directiva, y yo prefiero hablar de tácticas."), fx: {board: 3, rep: 1, fans: -3, sqMor: -1}, ref: N_("Inspirada en Del Bosque")}
     ]},
    {id: "m44", ctx: ["loss", "relegation", "crisis"], q: N_("Otra derrota ante un rival directo. ¿Es el momento de hacer cambios?"),
     a: [
       {t: N_("Si hay que cambiar, empiezo por mí. Pero antes de la próxima jornada no cambiaré nada. Nada de nada."), fx: {sqMor: 3, chem: 2, fans: -3, board: -2}, ref: N_("Inspirada en Simeone")},
       {t: N_("Cambios los habrá. Y quien no entienda lo que está en juego, que se vaya preparando para observar desde la grada."), fx: {board: 3, fans: 3, sqMor: -4, chem: -2}, ref: N_("Inspirada en Ferguson")},
       {t: N_("No hay nada que cambiar. Hay que jugar mejor. Y para eso, necesitamos paciencia y confianza en el proceso."), fx: {chem: 3, rep: 1, fans: -3, board: -1}, ref: N_("Inspirada en Guardiola")},
       {t: N_("Tengo la sensación de que, aunque cambiara el once, el resultado sería el mismo. Es cuestión de actitud, no de nombres."), fx: {rep: 2, board: 1, sqMor: -3, chem: -1, fans: 1}, ref: N_("Inspirada en Zidane")}
     ]},
    {id: "m45", ctx: ["any"], q: N_("Un periodista le pregunta por su nuevo corte de pelo. ¿Qué responde?"),
     a: [
       {t: N_("Es el resultado de mi peluquero, un genio. Y de la dieta de pasta, que me ha dejado sin ideas."), fx: {fans: 4, rep: 2, board: -2, chem: -1}, ref: N_("Inspirada en Klopp")},
       {t: N_("¿Esa es su pregunta? ¿Después de noventa minutos de partido? Siguiente pregunta, por favor."), fx: {rep: -2, fans: 2, board: 1, sqMor: 1}, ref: N_("Inspirada en Luis Enrique")},
       {t: N_("Mi peinado es lo menos preocupante de este club. Pero me alegra que se fijen en lo importante."), fx: {fans: 3, chem: 1, board: -2, rep: 1}, ref: N_("Inspirada en Mourinho")},
       {t: N_("Se lo pregunté a mi mujer. Ella dijo que hacía falta. Y como usted sabe, no se discute."), fx: {fans: 3, board: 2, rep: -1, sqMor: -2}, ref: N_("Inspirada en Ancelotti")}
     ]},
    {id: "m46", ctx: ["win", "controversy"], q: N_("El {coach} dice que ganaron con suerte y ayuda arbitral. ¿Qué responde?"),
     a: [
       {t: N_("Que se tome un té. A veces ganar sin que te gusten cómo lo hicimos es la peor derrota para un entrenador."), fx: {fans: 4, rep: 1, board: -2, chem: -1}, ref: N_("Inspirada en Ferguson")},
       {t: N_("Le deseo mucha suerte. La va a necesitar para la liga y para la vida. Y creo que me quedo corto."), fx: {fans: 3, sqMor: 2, rep: -3, board: -1}, ref: N_("Inspirada en Mourinho")},
       {t: N_("Tiene derecho a opinar. Respeto su sentimiento, pero el marcador está claro. Seguimos con lo nuestro."), fx: {rep: 3, board: 2, fans: -3, sqMor: -1}, ref: N_("Inspirada en Del Bosque")},
       {t: N_("Ganamos porque lo merecimos. Si el resultado le molesta, que lo reclame en el campo, no en las ruedas de prensa."), fx: {chem: 2, sqMor: 3, rep: -2, fans: 1, board: -1}, ref: N_("Inspirada en Simeone")}
     ]},
    {id: "m47", ctx: ["controversy", "any"], q: N_("El VAR ha intervenido varias veces hoy. ¿Opina que mejora el fútbol?"),
     a: [
       {t: N_("El VAR es un invento maravilloso. Lástima que lo manejen humanos, que al final son los que se equivocan."), fx: {rep: 3, fans: 2, board: -1, sqMor: -1}, ref: N_("Inspirada en Wenger")},
       {t: N_("Quita emoción, quita rapidez y quita goles. Y ahora, además, quita sentido común. Pero es una opinión personal."), fx: {fans: 3, chem: 1, rep: -2, board: -1}, ref: N_("Inspirada en Luis Enrique")},
       {t: N_("Si es para ser justos, bienvenido sea. Si es para quitar goles, que nos lo expliquen con cuidado."), fx: {rep: 2, board: 2, fans: -2, sqMor: -1}, ref: N_("Inspirada en Del Bosque")},
       {t: N_("No tengo opinión. Pregunten a los que cobran por tenerla. Yo cobro por entrenar y no por pensar en pantallas."), fx: {board: 3, rep: -1, fans: -2, chem: 1}, ref: N_("Inspirada en Bielsa")}
     ]},
    {id: "m48", ctx: ["bigloss", "controversy"], q: N_("Pierden 0-4 y critican al árbitro. ¿No es una excusa?"),
     a: [
       {t: N_("Nunca he dicho que sea una excusa. Pero con 0-4, hasta el árbitro tiene derecho a sentirse culpable."), fx: {fans: 3, sqMor: 2, rep: -3, board: -2}, ref: N_("Inspirada en Mourinho")},
       {t: N_("Nos han ganado de manera clara. Cualquier otra cosa sería faltar al respeto al rival y a nuestros aficionados."), fx: {rep: 4, board: 3, fans: -3, sqMor: -2}, ref: N_("Inspirada en Klopp")},
       {t: N_("Pienso lo que pienso, pero hoy no toca. Ya nos expresaremos por los cauces oficiales, que para eso hay."), fx: {board: 2, rep: 1, fans: -2, sqMor: -1}, ref: N_("Inspirada en Luis Aragonés")},
       {t: N_("El árbitro ha sido el menor de nuestros problemas. Y el mayor, que hemos visto el balón en nuestra portería cuatro veces."), fx: {chem: 2, rep: 2, fans: -1, sqMor: -3}, ref: N_("Inspirada en Guardiola")}
     ]}
  ],
  ply: [
    {id: "p1", ctx: ["win"], q: N_("Gran victoria hoy. ¿Qué le ha dicho el entrenador al final?"),
     a: [
       {t: N_("Me ha dicho que siga así. Y yo le he dicho que me deje en el once. Los dos hemos quedado contentos."), fx: {coach: 3, mor: 2, fame: -1, fans: -1}, ref: N_("Inspirada en Ramos")},
       {t: N_("Nada. Los grandes jugadores no necesitan que les digan nada. Hablamos con los goles."), fx: {fame: 3, fol: 15, coach: -3, mor: 1}, ref: N_("Inspirada en Zlatan")},
       {t: N_("Que estaba orgulloso del equipo. Yo estoy orgulloso de él. Aquí nadie sobra y nadie falta."), fx: {mor: 3, coach: 2, fame: -2, fol: 5}, ref: N_("Inspirada en Xavi")},
       {t: N_("Pregúnteselo a él. Yo salí a disfrutar y a mover el balón. Lo demás, que lo arreglen los de arriba."), fx: {fans: 2, coach: -2, mor: 1, fame: 1}, ref: N_("Inspirada en Cruyff")}
     ]},
    {id: "p2", ctx: ["loss"], q: N_("Han perdido ante el {opp}. ¿Qué ha faltado?"),
     a: [
       {t: N_("Faltó todo. Ni corazón, ni cabeza, ni nada. Nos pasaron por encima y no hay otra explicación."), fx: {coach: 2, mor: -3, fans: 2, prof: 2}, ref: N_("Inspirada en Piqué")},
       {t: N_("Mala suerte. El balón no quería entrar. Hay días así. Mañana nos levantamos y sale el sol."), fx: {mor: 2, fans: -2, coach: -1, prof: -1}, ref: N_("Inspirada en Del Piero")},
       {t: N_("Cuando uno pierde, todos pierden. Hoy el único responsable soy yo. Yo debí dar más."), fx: {coach: 3, fans: 3, mor: -2, fame: -1}, ref: N_("Inspirada en Iniesta")},
       {t: N_("¿Qué mirás, bobo? Andá pa' allá. Digo, que estoy concentrado ya en el próximo."), fx: {fame: 3, fol: 25, coach: -2, prof: -2}, ref: N_("Inspirada en Messi, Mundial 2022")}
     ]},
    {id: "p3", ctx: ["draw"], q: N_("Empate sin goles. ¿Se siente frustrado como delantero?"),
     a: [
       {t: N_("Un punto fuera es un buen punto. No siempre hay que marcar tres. Lo que importa es no perder."), fx: {coach: 3, mor: 1, fans: -3, fame: -1}, ref: N_("Inspirada en Maldini")},
       {t: N_("Frustrado, claro. Pero tranquilo. Cuando entre uno, entrarán diez. Es la ley del gol, y siempre me ha dado la razón."), fx: {fans: 2, mor: 2, prof: -1, coach: -1}, ref: N_("Inspirada en Cristiano")},
       {t: N_("Hemos jugado bien, pero necesitamos más veneno arriba. Hablaré con los míos sobre eso. Yo el primero."), fx: {coach: 2, prof: 3, fans: -2, mor: -1}, ref: N_("Inspirada en Lewandowski")},
       {t: N_("Esto es fútbol. A veces ganas, a veces pierdes y a veces tu hermano te quita el postre. Así es."), fx: {fans: 3, fol: 10, coach: -2, prof: -1}, ref: N_("Inspirada en Zlatan")}
     ]},
    {id: "p4", ctx: ["bigwin", "win"], q: N_("Tres goles hoy. ¿Siente que es el mejor delantero de {lg}?"),
     a: [
       {t: N_("Siuuu. Eso es lo que siento. Y que alguien me traiga un trofeo, que hoy me lo he ganado."), fx: {fans: 3, fol: 40, coach: -2, fame: 3, mor: -1}, ref: N_("Inspirada en Cristiano, 'siuuu'")},
       {t: N_("Soy rico, guapo y un gran jugador. Por eso me tienen envidia. No es mi culpa."), fx: {fame: 4, fol: 30, fans: -3, coach: -1}, ref: N_("Inspirada en Cristiano, 2010")},
       {t: N_("Un jugador es tan bueno como sus compañeros. Los goles son de todos, yo solo estaba en el lugar correcto."), fx: {coach: 3, mor: 3, fame: -2, fol: -5, fans: 1}, ref: N_("Inspirada en Xavi")},
       {t: N_("Vine como un rey y me iré como una leyenda. Un día, claro. Todavía queda mucho."), fx: {fame: 4, fol: 35, coach: -2, mor: -2, fans: 1}, ref: N_("Inspirada en Zlatan, 2018")}
     ]},
    {id: "p5", ctx: ["bigloss", "crisis"], q: N_("Una derrota humillante hoy. ¿Qué tiene que decirle a los aficionados?"),
     a: [
       {t: N_("Perdón. Hoy no estuvimos a la altura de lo que merecen. Nos vamos a levantar, os lo prometo."), fx: {fans: 4, coach: 2, fame: -2, mor: -2}, ref: N_("Inspirada en Iniesta")},
       {t: N_("Respeto su enfado. Pero también les pido que no nos silben mientras estamos intentando cambiar las cosas."), fx: {fans: -4, mor: 2, coach: 1, prof: 1}, ref: N_("Inspirada en Ramos")},
       {t: N_("Cuando las gaviotas siguen al barco pesquero es porque creen que les van a tirar sardinas. Muchas gracias."), fx: {fame: 4, fol: 30, fans: -3, coach: -2}, ref: N_("Inspirada en Cantona, 1995")},
       {t: N_("Los que dudan de nosotros no están en el vestuario. Aquí hay un grupo unido y de eso no hay duda."), fx: {mor: 3, coach: 2, fans: -2, prof: -1}, ref: N_("Inspirada en Rapinoe")}
     ]},
    {id: "p6", ctx: ["derby"], q: N_("El derbi se acerca. ¿Cómo lo prepara mentalmente?"),
     a: [
       {t: N_("Con calma. Un derbi se gana con la cabeza más que con las piernas. Y yo, hoy, tengo muy buena cabeza."), fx: {coach: 3, prof: 2, fans: -2, fol: 5}, ref: N_("Inspirada en Zidane")},
       {t: N_("Quiero marcar y celebrarlo delante de su afición. ¿Eso es malo? Es para lo que me pagan, y me pagan bien."), fx: {fans: 3, fame: 3, fol: 25, coach: -2, mor: -1}, ref: N_("Inspirada en Cristiano")},
       {t: N_("Es otro partido, aunque sé lo que significa. Vendrán a vernos 60 mil personas y no voy a defraudarlas."), fx: {fans: 3, mor: 2, coach: 1, fame: -2}, ref: N_("Inspirada en Totti")},
       {t: N_("Los derbis no se juegan, se sufren. Se sufren desde el lunes y se sienten hasta el domingo."), fx: {mor: 3, fans: 1, prof: -2, coach: 1}, ref: N_("Inspirada en Raúl")}
     ]},
    {id: "p7", ctx: ["final"], q: N_("Mañana juega una final. ¿Qué se siente?"),
     a: [
       {t: N_("Son partidos para los que he vivido. Me gusta estar donde otros no se atreven a pisar. Y mañana pisaré fuerte."), fx: {fans: 3, fame: 3, mor: 2, coach: -2}, ref: N_("Inspirada en Maradona")},
       {t: N_("Vamos a salir a disfrutar. No hay otra forma. Si te agobias, no vas a rendir. Y yo no me agobio."), fx: {mor: 3, coach: 2, fol: 10, fame: -2}, ref: N_("Inspirada en Cruyff, 'salid y disfrutad'")},
       {t: N_("No sé. Pregúntemelo cuando termine. Ahora solo sé que estoy aquí para ganar y llevarme la copa."), fx: {fans: 2, prof: 2, fame: 1, mor: -2}, ref: N_("Inspirada en Alexia Putellas")},
       {t: N_("Siento que tengo un año más y una final menos. Quiero ganar esta antes de que me pese la edad."), fx: {fans: 3, fol: 15, coach: -1, mor: -3}, ref: N_("Inspirada en Modric")}
     ]},
    {id: "p8", ctx: ["controversy"], q: N_("Le han expulsado por protestar. ¿Se arrepiente de su reacción?"),
     a: [
       {t: N_("Para nada. Lo volvería a hacer. Si no protesto yo, ¿quién va a protestar? Los que tienen miedo no ganan."), fx: {fans: 4, fol: 20, coach: -3, prof: -3, mor: 1}, ref: N_("Inspirada en Zlatan")},
       {t: N_("Me arrepiento de haber perdido los nervios. Es una falta de respeto al árbitro y al club. Pido disculpas."), fx: {coach: 3, prof: 3, fans: -3, fame: -2}, ref: N_("Inspirada en Zidane, final 2006")},
       {t: N_("Dije lo que sentía. Yo no me escondo, ni de la prensa ni de nadie. Si me sancionan, lo acepto y punto."), fx: {fans: 3, mor: 2, prof: -1, coach: -1, fame: 1}, ref: N_("Inspirada en Rapinoe")},
       {t: N_("No lo recuerdo bien. Fue un momento de calentón. Un abrazo para el árbitro y nos vemos el domingo."), fx: {coach: 1, fans: 1, fol: 10, prof: -2, mor: -1}, ref: N_("Inspirada en Piqué")}
     ]},
    {id: "p9", ctx: ["title"], q: N_("Están peleando por el título de {lg}. ¿Cómo viven los jugadores la presión?"),
     a: [
       {t: N_("La presión no existe si disfrutas. Yo cierro los ojos y pienso en cuando era un niño con el balón en la calle."), fx: {mor: 3, fans: 2, prof: -2, fol: 10}, ref: N_("Inspirada en Maradona")},
       {t: N_("Los títulos son lo único que cuenta. Aquí no vinimos a hacer amigos, vinimos a ganar. Y vamos a ganar."), fx: {fame: 3, fans: 2, coach: 1, mor: -3}, ref: N_("Inspirada en Cristiano")},
       {t: N_("No hablamos del título. Hablamos de cada partido. Si empezamos a hablar de trofeos, nos distraemos de lo que importa."), fx: {coach: 3, prof: 3, fans: -3, fol: -5}, ref: N_("Inspirada en Simeone, 'partido a partido'")},
       {t: N_("Si nos ponen en cualquier lista, igual. Ganaremos el título, y luego iremos todos a la Casa Blanca. Menos yo."), fx: {fame: 3, fol: 40, fans: 2, coach: -2, prof: -2}, ref: N_("Inspirada en Rapinoe")}
     ]},
    {id: "p10", ctx: ["relegation"], q: N_("El {club} está en zona de descenso. ¿Se plantea irse?"),
     a: [
       {t: N_("Yo me quedo hasta el final, aunque tengamos que bajar de categoría. Yo vine a ayudar y no me voy cuando se complica."), fx: {fans: 5, mor: 2, coach: 2, fame: -2, prof: -1}, ref: N_("Inspirada en Totti")},
       {t: N_("Eso es algo que hablaremos en verano. Ahora solo importa salvar la categoría, con todos los de aquí."), fx: {coach: 2, prof: 3, fans: -3, mor: -1}, ref: N_("Inspirada en Del Piero")},
       {t: N_("No me hace falta. Si me ofrecen un proyecto grande, ya sabré qué hacer. Pero aquí hay mucho trabajo."), fx: {fame: 3, fol: 15, fans: -4, coach: -2}, ref: N_("Inspirada en Mbappé, 2022")},
       {t: N_("No pienso más allá del siguiente partido. Si nos salvamos, luego decidimos. Primero luchar, luego pensar."), fx: {mor: 2, prof: 2, fans: 1, fame: -2, coach: 1}, ref: N_("Inspirada en Simeone")}
     ]},
    {id: "p11", ctx: ["injury"], q: N_("Vuelve de una lesión larga. ¿Cuánto ha sufrido en la recuperación?"),
     a: [
       {t: N_("Cada día un reto. Pero sufrir es parte del trabajo. Quien no sufre no sabe lo que vale volver a jugar."), fx: {mor: 3, fans: 3, prof: 2, fame: -2}, ref: N_("Inspirada en Alexia Putellas")},
       {t: N_("Mucho. Pero me convertí en otra persona. Más paciente, más fuerte y más humilde. Y más guapo, dicen."), fx: {fol: 20, fame: 2, fans: 1, prof: -2, coach: -1}, ref: N_("Inspirada en Cristiano")},
       {t: N_("Duro, sí. Pero ahora estoy con todos mis compañeros y me siento como un niño. Eso es lo que importa."), fx: {mor: 3, coach: 2, fame: -3, fol: -5, fans: 1}, ref: N_("Inspirada en Iniesta")},
       {t: N_("Un infierno. Meses sin tocar balón, sin sentirme jugador. Si me preguntan si volvería a pasarlo, digo que no."), fx: {fans: 4, mor: -3, prof: -1, fol: 15, fame: 2}, ref: N_("Inspirada en Rapinoe")}
     ]},
    {id: "p12", ctx: ["rumour"], q: N_("Se habla de que otro club le quiere. ¿Piensa en irse?"),
     a: [
       {t: N_("Me quedo, y lo digo claro. Estoy feliz aquí y nada ni nadie va a moverme de este lugar. Hoy, al menos."), fx: {fans: 4, coach: 3, fame: -2, mor: 1, fol: -5}, ref: N_("Inspirada en Mbappé, 2022")},
       {t: N_("Mi agente sabe lo que quiero. Si la oferta es buena, lo hablamos. Si no, hasta luego. Soy profesional."), fx: {prof: 3, fame: 2, fans: -4, coach: -3}, ref: N_("Inspirada en Zlatan")},
       {t: N_("No voy a comentar rumores. Pero sí diré que mis compañeros son los mejores y que quiero ganar cosas aquí."), fx: {coach: 2, mor: 2, fans: 1, fame: -1, fol: 5}, ref: N_("Inspirada en Alexia Putellas")},
       {t: N_("Rumores hay siempre. Es lo que pasa cuando juegas bien. Tomaos un café con la prensa y lo hablamos."), fx: {fol: 30, fame: 3, coach: -2, fans: -2, prof: -1}, ref: N_("Inspirada en Neymar")}
     ]},
    {id: "p13", ctx: ["crisis", "loss"], q: N_("Llevan varias jornadas sin ganar. ¿Le preocupa su puesto en el equipo?"),
     a: [
       {t: N_("Mi puesto no me preocupa. Si el míster cree que otro lo hace mejor, tiene derecho a ponerle. Yo seguiré trabajando."), fx: {coach: 4, prof: 3, fans: -2, fame: -2}, ref: N_("Inspirada en Iniesta")},
       {t: N_("Mi puesto es mío. Para quitármelo tendrán que venir con una grúa. Y aun así, les costaría."), fx: {fans: 2, mor: 2, coach: -4, fol: 15, fame: 1}, ref: N_("Inspirada en Ramos")},
       {t: N_("Me preocupa más el equipo que yo. Este club merece cosas mejores. Que me quiten a mí, si hace falta."), fx: {fans: 4, mor: 2, coach: 2, fame: -2, prof: -1}, ref: N_("Inspirada en Totti")},
       {t: N_("Preocupado no, ocupado. Cuando uno trabaja, no tiene tiempo de preocuparse. Hay que seguir picando piedra."), fx: {prof: 3, mor: 2, fans: -3, fol: -5, coach: 1}, ref: N_("Inspirada en Simeone")}
     ]},
    {id: "p14", ctx: ["any"], q: N_("¿Cuál es su mayor sueño en el fútbol?"),
     a: [
       {t: N_("Ganar el Balón de Oro. Y luego guardar el Balón de Oro. Y luego ganar otro. Y así hasta la jubilación."), fx: {fame: 4, fol: 30, coach: -2, mor: -1, fans: 1}, ref: N_("Inspirada en Cristiano")},
       {t: N_("Retirarme en este club con la camiseta puesta. Sin traspasos ni contratos millonarios. Solo yo y mi escudo."), fx: {fans: 5, coach: 3, fame: -3, fol: -5}, ref: N_("Inspirada en Totti")},
       {t: N_("Ser feliz jugando. Si mañana ganara el mundo entero y no disfrutara, no me serviría de nada."), fx: {mor: 4, prof: -1, fans: 2, fame: -2}, ref: N_("Inspirada en Maradona")},
       {t: N_("Ganar un Mundial. Todos soñamos con eso. Y si lo gano, me iré a mi casa y nadie me verá en un mes."), fx: {fame: 3, fans: 3, coach: 1, mor: -2, prof: -1}, ref: N_("Inspirada en Messi")}
     ]},
    {id: "p15", ctx: ["any"], q: N_("Las redes dicen que se cree superior al resto. ¿Qué responde?"),
     a: [
       {t: N_("Yo no me creo superior. Soy superior. Y no es arrogancia, es una descripción objetiva."), fx: {fame: 4, fol: 40, coach: -3, mor: -2, fans: 1}, ref: N_("Inspirada en Zlatan")},
       {t: N_("Tengo la suerte de jugar con los mejores. Me rodeo de gente que me hace mejor. Y no leo las redes."), fx: {mor: 3, coach: 3, fol: -10, fame: -2}, ref: N_("Inspirada en Modric")},
       {t: N_("Soy el que más trabaja de este vestuario. No lo digo yo, lo dice el entrenador. Pregúntenle."), fx: {coach: 2, prof: 3, fans: -2, mor: -1}, ref: N_("Inspirada en Cristiano")},
       {t: N_("Voy a decir algo, y que se entienda: no tengo tiempo para la gente que no trabaja. Gracias."), fx: {fame: 2, fol: 25, fans: -2, coach: -2, mor: 1}, ref: N_("Inspirada en Rapinoe")}
     ]},
    {id: "p16", ctx: ["win", "derby"], q: N_("Ha ganado el derbi y ha celebrado delante de la grada rival. ¿Provocación?"),
     a: [
       {t: N_("Celebré con mi gente. Si ellos lo ven como provocación, es su problema. Yo me limito a disfrutar."), fx: {fans: 4, fol: 25, coach: -2, prof: -2, fame: 2}, ref: N_("Inspirada en Cristiano")},
       {t: N_("En absoluto. Respeto a su afición, pero también al fútbol. Marqué un gol, me alegré. Nada más que eso."), fx: {coach: 3, prof: 3, fans: -3, fol: -5}, ref: N_("Inspirada en Del Piero")},
       {t: N_("Un poquito, sí. Pero me lo habían pedido los míos y yo, que soy muy complaciente, hice caso."), fx: {fans: 3, fol: 15, mor: 2, prof: -2, coach: -1}, ref: N_("Inspirada en Zlatan")},
       {t: N_("¿Qué mirás, bobo? Andá pa' allá. Es lo que le dije al rival, no a su afición. Que quede claro."), fx: {fame: 4, fol: 35, coach: -2, prof: -3, mor: 1}, ref: N_("Inspirada en Messi, Mundial 2022")}
     ]},
    {id: "p17", ctx: ["bigwin"], q: N_("Han ganado 5-0. ¿Qué ha cambiado en el equipo?"),
     a: [
       {t: N_("Nada. El mismo equipo de siempre. Hoy salió todo. Pero que nadie se emocione, que esto es largo."), fx: {coach: 3, prof: 3, fans: -2, fame: -2}, ref: N_("Inspirada en Xavi")},
       {t: N_("Hemos encontrado la fórmula: pasarlo bien. Lo mejor es que los chicos se divierten, y eso se nota."), fx: {mor: 3, fans: 3, coach: -1, prof: -2}, ref: N_("Inspirada en Rapinoe")},
       {t: N_("Hay un jugador que lo ha cambiado todo: yo. Lo digo con humildad y los datos en la mano."), fx: {fame: 4, fol: 30, coach: -3, mor: -2, fans: 1}, ref: N_("Inspirada en Cristiano")},
       {t: N_("La actitud. Todos corrieron, todos pelearon. Cuando hay compromiso, el talento aparece solo."), fx: {coach: 3, mor: 2, fame: -1, fans: 1, fol: -5}, ref: N_("Inspirada en Ramos")}
     ]},
    {id: "p18", ctx: ["bigloss"], q: N_("Perdieron 0-5. ¿Cómo se explica semejante resultado?"),
     a: [
       {t: N_("No se explica. Se acepta, se aprende y se sigue. No hay más secreto que ese. Mañana, a entrenar."), fx: {coach: 3, prof: 3, fans: -3, mor: -2}, ref: N_("Inspirada en Iniesta")},
       {t: N_("Nos pasaron por encima. No hay excusas. Como equipo, hoy hemos fallado a nuestra gente. Pedimos disculpas."), fx: {fans: 4, mor: -3, coach: 1, fame: -2}, ref: N_("Inspirada en Piqué")},
       {t: N_("Con diez en el campo desde el minuto 10, tampoco se podía hacer más. El árbitro tiene que explicárselo a la gente."), fx: {fans: 2, mor: 2, coach: -3, prof: -3, fol: 10}, ref: N_("Inspirada en Ramos")},
       {t: N_("Un mal día lo tiene cualquiera. Yo he ganado 5-0, ahora me toca perder 0-5. Equilibrio cósmico."), fx: {fol: 25, fame: 2, fans: -3, coach: -2, prof: -2}, ref: N_("Inspirada en Zlatan")}
     ]},
    {id: "p19", ctx: ["controversy", "crisis"], q: N_("Ha tenido un rifirrafe con un compañero en el entrenamiento. ¿Qué pasó?"),
     a: [
       {t: N_("Nada. Cosas del vestuario. Si nos peleamos es porque nos importa. Mañana nos damos un abrazo y listo."), fx: {mor: 2, coach: 1, fans: 1, prof: -2, fol: 5}, ref: N_("Inspirada en Ramos")},
       {t: N_("Hubo una discusión, sí. Era necesaria. A veces los vestuarios necesitan que alguien alce la voz."), fx: {coach: -2, mor: -2, fans: 3, prof: 1, fame: 2}, ref: N_("Inspirada en Rapinoe")},
       {t: N_("No voy a hablar de eso. Lo del vestuario se queda en el vestuario, y mucho más si lo cuenta la prensa."), fx: {coach: 3, prof: 3, fans: -3, fol: -5}, ref: N_("Inspirada en Raúl")},
       {t: N_("Dije lo que pensaba. Si no le gusta, que me lo diga a la cara. Es como si fuera mi hermano, pero con menos paciencia."), fx: {fol: 20, fame: 2, mor: -3, coach: -2, fans: 2}, ref: N_("Inspirada en Zlatan")}
     ]},
    {id: "p20", ctx: ["controversy"], q: N_("Un gesto suyo en la celebración ha generado polémica. ¿Pidió disculpas?"),
     a: [
       {t: N_("Disculpas, ninguna. Lo hice con el corazón y no voy a retractarme. A quien no le guste, que no mire."), fx: {fans: 3, fol: 30, fame: 3, coach: -3, prof: -3}, ref: N_("Inspirada en Rapinoe")},
       {t: N_("Fue una ligereza de la que me arrepiento. No era mi intención ofender a nadie. Pido perdón y sigo adelante."), fx: {coach: 3, prof: 3, fans: -2, fame: -2, fol: -10}, ref: N_("Inspirada en Piqué")},
       {t: N_("Fue un gesto espontáneo. Pasa a veces cuando marcas en el último minuto. Quien no lo sienta así, no ha jugado."), fx: {fans: 3, mor: 2, coach: -1, prof: -2, fol: 10}, ref: N_("Inspirada en Cristiano, 'siuuu'")},
       {t: N_("Ahora mismo estoy más preocupado por el partido del domingo. De lo demás, que se encarguen los de comunicación."), fx: {coach: 2, prof: 1, fans: -3, fame: -1, mor: 1}, ref: N_("Inspirada en Alexia Putellas")}
     ]},
    {id: "p21", ctx: ["title", "win"], q: N_("Líderes de {lg}. ¿Cuál es el secreto del equipo?"),
     a: [
       {t: N_("Trabajo, trabajo y más trabajo. Y mucha suerte en las lesiones. Lo demás son excusas de los otros."), fx: {coach: 3, prof: 2, fame: -2, fans: 1}, ref: N_("Inspirada en Simeone")},
       {t: N_("El secreto soy yo. Bromeo. Bueno, no del todo. Pero los compañeros también ayudan un poquito."), fx: {fame: 3, fol: 30, mor: 1, coach: -3, fans: 1}, ref: N_("Inspirada en Zlatan")},
       {t: N_("Somos una familia. Si alguien tiene un problema, todos lo tenemos. Esa es la clave, y nunca la cambiaremos."), fx: {mor: 4, coach: 2, fame: -2, fol: -5, prof: -1}, ref: N_("Inspirada en Alexia Putellas")},
       {t: N_("El míster, sin duda. Nos ha dado confianza, alegría y un buen sistema. Todo lo bueno es suyo, lo malo es mío."), fx: {coach: 4, fans: 1, fame: -3, prof: 1, mor: 1}, ref: N_("Inspirada en Xavi")}
     ]},
    {id: "p22", ctx: ["final", "loss"], q: N_("Perdieron la final. ¿Cómo se sobrepone a una derrota así?"),
     a: [
       {t: N_("No me sobrepongo. Duele, y eso es bueno. Si no doliera, es que no me importaría. Mañana vuelvo a empezar."), fx: {mor: -2, prof: 3, fans: 3, coach: 1, fame: -1}, ref: N_("Inspirada en Messi")},
       {t: N_("Tengo la medalla de segundo en el cajón, al lado de las otras. Un día les haré compañía con una de oro."), fx: {fans: 2, fol: 15, mor: 1, fame: 1, prof: -2}, ref: N_("Inspirada en Rapinoe")},
       {t: N_("Lloré en el vestuario, sí. No me da vergüenza. Me importa, me importa tanto que ni siquiera lo puedo disimular."), fx: {fans: 4, fol: 20, mor: -2, coach: -1, fame: 2}, ref: N_("Inspirada en Cristiano")},
       {t: N_("La final se perdió y ya está. Al día siguiente, a comprar el pan y a seguir. Nadie se ha muerto."), fx: {mor: 3, coach: 1, fans: -3, prof: -2}, ref: N_("Inspirada en Modric")}
     ]},
    {id: "p23", ctx: ["relegation", "win"], q: N_("Victoria vital para la permanencia. ¿Qué significa este gol?"),
     a: [
       {t: N_("Significa que hay esperanza. Que esto no ha acabado. Que si seguimos juntos, nos salvamos. Todos a una."), fx: {mor: 4, fans: 3, coach: 1, fame: -2}, ref: N_("Inspirada en Raúl")},
       {t: N_("Significa que soy un fichaje caro que, por fin, ha empezado a valer lo que cuesta. Gracias por la paciencia."), fx: {fans: 3, fol: 20, coach: -1, prof: -1, fame: 1}, ref: N_("Inspirada en Zlatan")},
       {t: N_("Para mí significa muchísimo. Para mi familia, más. Se lo dedico a mi padre. Y a mi pierna izquierda."), fx: {fol: 15, fans: 2, mor: 2, prof: -2, fame: 1}, ref: N_("Inspirada en Maradona")},
       {t: N_("Un gol no salva nada. Nos quedan seis finales y debemos ganarlas todas. Mañana ya pensamos en la siguiente."), fx: {coach: 3, prof: 3, fans: -3, mor: -2}, ref: N_("Inspirada en Simeone")}
     ]},
    {id: "p24", ctx: ["injury", "rumour"], q: N_("Está lesionado y se habla de un traspaso. ¿Qué hay de cierto?"),
     a: [
       {t: N_("Estoy centrado en recuperarme. Lo demás es ruido. Y yo, con las muletas, hago mucho ruido propio."), fx: {prof: 3, coach: 2, fol: 5, fans: -2, fame: -1}, ref: N_("Inspirada en Alexia Putellas")},
       {t: N_("Mi agente lo sabe todo, yo no sé nada. Y así vivo más tranquilo, la verdad. Gracias por preguntar."), fx: {fol: 15, fame: 1, coach: -2, prof: -2, mor: 2}, ref: N_("Inspirada en Neymar")},
       {t: N_("Soy del club hasta que la lesión me deje o hasta que ellos me echen. Mientras tanto, a trabajar con la pierna mala."), fx: {fans: 4, coach: 3, mor: 1, fame: -2, fol: -5}, ref: N_("Inspirada en Totti")},
       {t: N_("Hay interés, claro. Estoy bien tratado, pero el fútbol es un negocio. Y yo, un buen activo, aun lesionado."), fx: {fame: 3, fol: 20, fans: -4, coach: -3, prof: 1}, ref: N_("Inspirada en Zlatan")}
     ]},
    {id: "p25", ctx: ["any"], q: N_("¿Qué le dice a los jóvenes que quieren ser futbolistas?"),
     a: [
       {t: N_("Que no se rindan. Yo me quedé fuera de varias pruebas, y aquí estoy. Los no son parte del camino."), fx: {fans: 4, mor: 2, fame: 1, fol: 15, coach: -1}, ref: N_("Inspirada en Messi")},
       {t: N_("Que estudien. El fútbol dura poco y la vida, mucho. Y si no, que aprendan a hacer buenas inversiones."), fx: {coach: 2, prof: 3, fans: -2, fame: -1, mor: -1}, ref: N_("Inspirada en Del Piero")},
       {t: N_("Que entrenen más que nadie. El talento es un regalo, pero el trabajo es lo que te lleva a lo más alto."), fx: {prof: 3, coach: 2, fans: 1, mor: -2, fame: -1}, ref: N_("Inspirada en Cristiano")},
       {t: N_("Que sean ellos mismos. Que no copien a nadie. El mundo no necesita otro Zlatan, necesita otro tú."), fx: {fame: 3, fol: 30, fans: 2, coach: -3, mor: 1}, ref: N_("Inspirada en Zlatan")}
     ]},
    {id: "p26", ctx: ["win", "any"], q: N_("Marcó el gol de la victoria. ¿Cómo lo celebró?"),
     a: [
       {t: N_("Corriendo como un loco, besando el escudo y dejando que los compañeros me abrazaran. Siempre lo hago así."), fx: {fans: 4, mor: 2, coach: 1, fame: -2, prof: -1}, ref: N_("Inspirada en Totti")},
       {t: N_("Con el 'siuuu' de siempre. No me preguntéis dónde me lo enseñaron, pero me sale solo."), fx: {fol: 35, fame: 3, coach: -2, mor: 1, fans: 1}, ref: N_("Inspirada en Cristiano, 'siuuu'")},
       {t: N_("No me gusta celebrar demasiado. Marcar es mi trabajo. No exagero; después de un gol, vuelvo al centro del campo."), fx: {coach: 3, prof: 3, fans: -2, fol: -10, fame: -2}, ref: N_("Inspirada en Lewandowski")},
       {t: N_("Con un baile que mis sobrinos me enseñaron. Han visto el vídeo en redes, y me han dicho que ni de lejos."), fx: {fol: 30, fans: 2, mor: 2, prof: -2, coach: -1}, ref: N_("Inspirada en Mbappé")}
     ]},
    {id: "p27", ctx: ["draw", "controversy"], q: N_("El árbitro les negó un penalti clarísimo en el empate. ¿Qué opina?"),
     a: [
       {t: N_("Eso es una vergüenza. Si va a ser así, mejor que cierren la liga. Los árbitros también tienen que pasar por un examen."), fx: {fans: 4, fol: 25, coach: -3, prof: -3, mor: 2}, ref: N_("Inspirada en Ramos")},
       {t: N_("Es el árbitro quien decide. Yo no puedo hacer nada. Hay que aceptar y seguir. La próxima, nosotros decidiremos."), fx: {coach: 3, prof: 3, fans: -3, fol: -5, mor: -1}, ref: N_("Inspirada en Modric")},
       {t: N_("No tengo nada que decir sobre arbitraje. Pero tengo mucho que decir en el campo, y ahí no me quedo callado."), fx: {fame: 2, fans: 1, coach: -1, mor: 1, prof: 1}, ref: N_("Inspirada en Zidane")},
       {t: N_("Hemos visto la repetición cien veces. Si algún día alguien dice que no era penalti, que me llame. Le invito a un café."), fx: {fol: 20, fans: 3, coach: -2, prof: -2, fame: 1}, ref: N_("Inspirada en Piqué")}
     ]},
    {id: "p28", ctx: ["crisis", "any"], q: N_("Se rumorea que no está de acuerdo con el entrenador. ¿Es cierto?"),
     a: [
       {t: N_("El míster es el jefe y yo soy un jugador. Respeto sus decisiones, aunque a veces no las comparta. Es mi trabajo."), fx: {coach: 4, prof: 3, fans: -2, fame: -2, mor: -1}, ref: N_("Inspirada en Raúl")},
       {t: N_("Tengo opinión, claro. Pero no la cuento a la prensa. Se la cuento a él, en su despacho, con la puerta cerrada."), fx: {coach: 2, prof: 2, fans: -1, mor: 1, fol: -5}, ref: N_("Inspirada en Xavi")},
       {t: N_("Algún día hablaré. Me han hecho cosas que no se dicen en la rueda de prensa. Pero el libro está en camino."), fx: {fame: 3, fol: 30, fans: 2, coach: -4, prof: -3}, ref: N_("Inspirada en Zlatan")},
       {t: N_("No hay problema. Todo está bien. Nunca discutimos... bueno, solo cuando perdemos. O cuando ganamos."), fx: {fol: 15, mor: 1, fans: 1, prof: -1, coach: -2}, ref: N_("Inspirada en Ramos")}
     ]},
    {id: "p29", ctx: ["title", "derby"], q: N_("Dos puntos separan a los dos rivales. ¿Decide el derbi la liga?"),
     a: [
       {t: N_("No, la liga se decide en 38 jornadas. Pero este derbi puede darnos una ventaja psicológica enorme, y la vamos a coger."), fx: {fans: 3, coach: 2, prof: 2, fame: -1, mor: -1}, ref: N_("Inspirada en Del Piero")},
       {t: N_("Sí. Hoy se decide todo. Quien gane será campeón, quien pierda, tendrá que irse a casa con la cabeza baja."), fx: {fans: 4, fol: 20, mor: -2, coach: -2, fame: 2}, ref: N_("Inspirada en Cristiano")},
       {t: N_("Lo decidirá el balón. Y el balón, por si no lo sabía, siempre está de nuestro lado. Pregúntele a mi pie izquierdo."), fx: {fame: 3, fol: 25, mor: 2, coach: -1, fans: 1}, ref: N_("Inspirada en Maradona")},
       {t: N_("No voy a decidir nada. Lo decide el equipo. Si alguien intenta cargar con todo, se equivoca. Esto es de once."), fx: {coach: 3, mor: 3, fame: -3, fans: -1, fol: -5}, ref: N_("Inspirada en Xavi")}
     ]},
    {id: "p30", ctx: ["rumour", "final"], q: N_("Se dice que este será su último gran partido en el club. ¿Es así?"),
     a: [
       {t: N_("Eso lo decidiré yo, cuando yo quiera y como yo quiera. Hoy toca jugar, y de lo demás hablamos después."), fx: {fame: 3, fans: -2, coach: -2, fol: 20, mor: 1}, ref: N_("Inspirada en Zlatan")},
       {t: N_("Si me voy, será con la cabeza alta y el escudo en el corazón. Pero hoy no me voy. Hoy estoy aquí."), fx: {fans: 4, coach: 2, fame: -2, mor: 1, fol: 5}, ref: N_("Inspirada en Totti")},
       {t: N_("No lo sé. Ni lo he hablado con mi familia. Cada día es una sorpresa, y no sé si me gustan las sorpresas."), fx: {mor: 2, prof: -2, fans: -2, fol: 10, coach: -1}, ref: N_("Inspirada en Modric")},
       {t: N_("Si la final sale bien, me quedo. Si sale mal, me quedo para vengarme. En cualquier caso, me quedo."), fx: {fans: 4, mor: 2, fol: 15, coach: 1, prof: -2}, ref: N_("Inspirada en Mbappé, 2022")}
     ]},
    {id: "p31", ctx: ["bigwin", "title"], q: N_("Goleada y a un paso del título. ¿Ya piensa en celebrarlo?"),
     a: [
       {t: N_("Celebrar es lo último en lo que pienso. Todavía quedan partidos, y solo cuando suena el último pitido, se descorcha."), fx: {coach: 3, prof: 3, fans: -3, fol: -5, mor: -1}, ref: N_("Inspirada en Simeone")},
       {t: N_("Claro que sí. La fiesta ya está organizada. Los que quieran, que se apunten. Los que no, que miren desde casa."), fx: {fans: 3, fol: 40, fame: 3, coach: -3, prof: -3}, ref: N_("Inspirada en Rapinoe")},
       {t: N_("Tengo ganas de celebrarlo con toda la ciudad. Pero antes hay que ganar. Mientras, a descansar."), fx: {fans: 3, mor: 2, coach: 1, fol: 5, fame: -2}, ref: N_("Inspirada en Iniesta")},
       {t: N_("Me da miedo celebrar demasiado pronto. En mi carrera he visto cómo se escapan títulos que parecían ganados."), fx: {mor: -2, prof: 2, coach: 2, fans: -2, fame: 1}, ref: N_("Inspirada en Maldini")}
     ]},
    {id: "p32", ctx: ["any", "controversy"], q: N_("Una foto suya en una fiesta se ha hecho viral. ¿Qué explicación da?"),
     a: [
       {t: N_("Era el cumpleaños de un amigo. Estuve un rato y me fui pronto. Si queréis las pruebas, enseño el ticket del Uber."), fx: {fol: 15, coach: 1, prof: -1, fans: -2, mor: 2}, ref: N_("Inspirada en Piqué")},
       {t: N_("Mi vida privada es mía. Mientras rinda en el campo, nadie debería preocuparse por lo que haga fuera de él."), fx: {fame: 3, fol: 25, coach: -3, prof: -3, fans: -1}, ref: N_("Inspirada en Neymar")},
       {t: N_("Tienen razón. Fue un error, y pido perdón al club y a mis compañeros. Les prometo que no volverá a ocurrir."), fx: {coach: 3, prof: 3, fans: -2, fol: -10, mor: -2}, ref: N_("Inspirada en Ramos")},
       {t: N_("¿Esa foto? No salgo ni de lejos bien parado. Debería haberme puesto el otro pantalón. Eso sí que me preocupa."), fx: {fol: 30, fans: 3, mor: 2, coach: -2, prof: -2}, ref: N_("Inspirada en Zlatan")}
     ]},
    {id: "p33", ctx: ["loss", "derby"], q: N_("Perdieron el derbi con un error suyo. ¿Cómo lo lleva?"),
     a: [
       {t: N_("Es culpa mía. Cometí un error y costó el partido. Pido perdón a la afición y a mis compañeros. Lo asumo."), fx: {coach: 3, fans: 3, prof: 3, mor: -3, fame: -2}, ref: N_("Inspirada en Iniesta")},
       {t: N_("Un error lo tiene cualquiera. Lo importante es seguir adelante. Los errores son humanos; los fallos, repetirlos."), fx: {mor: 2, prof: 2, fans: -3, coach: 1, fol: 5}, ref: N_("Inspirada en Maldini")},
       {t: N_("Eso es fútbol. Si no lo hubiera hecho yo, lo habría hecho otro. Pero nadie me lo recordará en diez años."), fx: {mor: 3, fol: 10, fans: -3, coach: -2, prof: -2}, ref: N_("Inspirada en Del Piero")},
       {t: N_("No voy a hablar de mis errores. Los analizaré en casa, a solas. Aquí hablo de los aciertos, y esos los recordaré."), fx: {coach: 1, prof: 2, fans: -2, fame: 1, mor: 1}, ref: N_("Inspirada en Cristiano")}
     ]},
    {id: "p34", ctx: ["relegation", "loss", "crisis"], q: N_("Descenso casi consumado. ¿Qué siente en este momento?"),
     a: [
       {t: N_("Tristeza y rabia. Pero aún queda un 1% de esperanza. Y con el 1% he ganado partidos, ahora a por la liga."), fx: {fans: 4, mor: 2, coach: 1, fame: -1, prof: -1}, ref: N_("Inspirada en Raúl")},
       {t: N_("Nada que no sintiera antes. El club me ha dado mucho, y sigo aquí. Bajar o no, seré del club hasta el final."), fx: {fans: 5, coach: 3, fame: -3, fol: -5, mor: -1}, ref: N_("Inspirada en Totti")},
       {t: N_("Siento haber fallado. Todos nos equivocamos. Los jugadores, la directiva, el entrenador. Hoy toca asumirlo juntos."), fx: {coach: 2, prof: 3, fans: -1, mor: -3, fol: 5}, ref: N_("Inspirada en Del Piero")},
       {t: N_("Siento que mi carrera no merece acabar aquí. Si bajamos, ya sabéis que no seguiré. Un jugador como yo no está para esto."), fx: {fame: 3, fol: 15, fans: -5, coach: -3, mor: 1}, ref: N_("Inspirada en Zlatan")}
     ]},
    {id: "p35", ctx: ["draw", "injury"], q: N_("Empataron y usted tuvo que retirarse con molestias. ¿Cómo está?"),
     a: [
       {t: N_("Estoy bien. Es solo un golpe. Mañana me hacen pruebas, pero si dependiera de mí, jugaba el domingo con una pierna."), fx: {fans: 3, mor: 2, coach: -2, prof: -2}, ref: N_("Inspirada en Ramos")},
       {t: N_("No lo sé. El médico dirá. Yo no soy médico, soy delantero. Y los delanteros somos de dolor corto."), fx: {coach: 2, prof: 2, fans: -2, fol: 10, mor: -1}, ref: N_("Inspirada en Zlatan")},
       {t: N_("Me paré porque lo vi venir. Es mejor perderse un partido que un año entero. Ya aprendí de otras lesiones."), fx: {coach: 3, prof: 3, fans: -3, mor: -1}, ref: N_("Inspirada en Alexia Putellas")},
       {t: N_("Un poco mal, sí. Pero el empate me duele más que la rodilla. Eso sí que no tiene hielo ni vendaje."), fx: {fans: 3, mor: 1, prof: 1, fol: 5, coach: -2}, ref: N_("Inspirada en Totti")}
     ]},
    {id: "p36", ctx: ["bigloss", "controversy"], q: N_("Tras la goleada, un aficionado le insultó en la calle. ¿Qué piensa?"),
     a: [
       {t: N_("Tiene derecho a estar enfadado. Pagan la entrada y esperan más. Le entiendo y prometo que lo compensaremos."), fx: {fans: 4, coach: 2, fame: -2, mor: -2}, ref: N_("Inspirada en Iniesta")},
       {t: N_("Se lo perdono porque no lo conozco. Si lo conociera, a lo mejor le invitaba a jugar el próximo partido en mi lugar."), fx: {fol: 30, fame: 2, fans: -3, coach: -2, prof: -2}, ref: N_("Inspirada en Zlatan")},
       {t: N_("Eso no se hace. Hay que respetar a las personas, también a los jugadores. Esto no es el espíritu del fútbol."), fx: {coach: 2, prof: 2, fans: -4, mor: 2, fol: 5}, ref: N_("Inspirada en Rapinoe")},
       {t: N_("Es parte del trabajo. Si no te insultan es que no importas. Y me insultaron mucho, así que algo importo."), fx: {mor: 2, fol: 15, fans: 1, prof: -2, coach: -1}, ref: N_("Inspirada en Cantona, 1995")}
     ]},
    {id: "p37", ctx: ["draw", "title"], q: N_("Otro empate en la lucha por {lg}. ¿Se escapa el título?"),
     a: [
       {t: N_("No se escapa nada. Lo importante es mantener la calma y no mirar la clasificación. Nos quedan muchas balas."), fx: {coach: 3, prof: 2, fans: -2, fame: -1}, ref: N_("Inspirada en Simeone")},
       {t: N_("Si se escapa, lo cogeremos de nuevo. Somos como un perro con un hueso: no lo soltamos hasta el final."), fx: {fans: 4, mor: 2, fame: 1, coach: -1, prof: -2}, ref: N_("Inspirada en Rapinoe")},
       {t: N_("Con lo que ha pasado hoy, probablemente sí. No tiene sentido mentir. Habría que ganarlo todo, y eso es difícil."), fx: {fans: 2, prof: 2, mor: -4, coach: 1, fol: 5}, ref: N_("Inspirada en Piqué")},
       {t: N_("El título es del que menos falle. Hoy hemos fallado nosotros, pero los de arriba también lo harán. Es ley."), fx: {mor: 3, fol: 10, fans: -2, coach: -1, fame: 1}, ref: N_("Inspirada en Del Piero")}
     ]}
  ]
};
