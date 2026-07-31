# Proyecto Octágono

Combate táctico gestual para móvil. No hay botones ni joystick: el
tablero vive integrado en la lona del octágono y cada acción se dibuja
con el dedo. Al levantarlo, el luchador ejecuta la secuencia completa
mediante animación procedural en tiempo real.

PWA 100% local-first: sin backend, sin assets externos, sin librerías de
terceros. Todo el audio se sintetiza en tiempo real con WebAudio y todo
el arte se dibuja vectorialmente sobre `<canvas>`.

## Cómo se juega

1. El tablero aparece dentro de la lona: cada zona es una acción (Jab,
   Cross, Hook, Low Kick, High Kick, Paso, Esquiva, Guardia, Derribo,
   Clinch, Escape).
2. Desliza el dedo de zona en zona para encadenar tu combo.
3. Levanta el dedo: tu luchador ejecuta la secuencia dibujada, golpe a
   golpe, con impacto, partículas y sonido.
4. Termina tu combo en **Guardia** o **Esquiva** para protegerte del
   turno del rival — no hay botón de defensa aparte.
5. El rival tiene personalidad propia (Boxeador, Kickboxer, Luchador o
   Contragolpeador): cada arquetipo pondera sus propias acciones y
   reacciona a tus golpes de forma distinta.

## Ejecutar en local

Los módulos usan `import`/`export` de ES Modules y el Service Worker
requiere un origen http(s) — no funciona abriendo `index.html` con
`file://`. Sirve la carpeta con cualquier servidor estático:

```bash
python3 -m http.server 8080
# o
npx serve .
```

Abre `http://localhost:8080` en el navegador (o en el móvil, en la
misma red, usando la IP del equipo).

## Publicar en GitHub Pages

1. Sube el contenido de esta carpeta a la raíz de un repositorio de
   GitHub (o a `/docs` si prefieres esa convención).
2. En **Settings → Pages**, selecciona la rama y carpeta donde subiste
   los archivos.
3. Espera a que se publique y abre la URL que te da GitHub Pages.
4. Desde el móvil, usa "Añadir a pantalla de inicio" para instalarla
   como app (PWA instalable, funciona offline tras la primera carga).

No se necesita build step: no hay bundler, transpilador ni dependencias
de `npm` para producción.

## Arquitectura

```
index.html            Punto de entrada, marcado del HUD y las pantallas
manifest.json          Manifest de la PWA
sw.js                  Service Worker (cache-first, offline completo)
css/main.css            Sistema visual (tokens, HUD, menús)
js/
  main.js               Orquestador: cablea motor + combate + UI
  engine/                Motor genérico, reutilizable fuera de este juego
    loop.js               Bucle de simulación a paso fijo + time scale
    camera.js             Cámara 2.5D (proyección, shake, zoom)
    input.js              Captura de puntero unificada (touch/ratón)
    particles.js          Sistema de partículas con pool reutilizable
    utils.js               Matemáticas, easing, helpers
  data/                  Datos puros del diseño de combate
    moves.js               Catálogo de acciones del tablero
    archetypes.js           Arquetipos de luchador (stats + IA)
  sprites/fighterShapes.js  Proporciones vectoriales por complexión
  animations/moveAnimations.js  Keyframes de pose por movimiento
  fighters/
    fighter.js             Modelo de luchador: stats y máquina de estados
    animator.js             Interpolación y fundido entre animaciones
    fighterRenderer.js      Cinemática directa + dibujo vectorial
  combat/
    board.js                Lona del octágono + zonas tácticas dinámicas
    swipeSystem.js           Gesto → combo, estela, partículas, feedback
    comboResolver.js         Secuencia dibujada → playbook ejecutable
    ai.js                    Personalidad del rival, reacciones, contras
    combatManager.js         Orquestación de turnos, daño, rondas, KO
  effects/
    hitEffects.js            Impacto: partículas, shake, destello, onda
    screenEffects.js         Flash global, slow-motion, zoom, estela
    koEffects.js             Secuencia cinemática del KO
  audio/audioEngine.js      Todo el sonido, sintetizado con WebAudio
  ui/
    hud.js                   Barras de vida/estamina, ronda, combo
    menu.js                  Menú principal y selección de rival
    screens.js                Carga, pausa y resultado
assets/icons/            Iconos de la PWA (PNG + favicon SVG)
```

## Notas de diseño

- **Sin sprites externos.** Cada luchador es un muñeco vectorial
  (cápsulas + arcos) posado mediante cinemática directa a partir de
  keyframes de ángulos. Esto permite animaciones fluidas y ligeras sin
  descargar un solo archivo de imagen.
- **Sin librerías pesadas.** Sólo Canvas 2D y WebAudio, nativos del
  navegador. Pensado para mantener 60 FPS en gama media.
- **Tablero nunca igual dos veces.** Cada ronda se genera un
  subconjunto y una disposición nuevos de zonas tácticas.
- **Distancia como capa táctica.** Clinch / Cercano / Medio determinan
  qué acciones conectan mejor — moverte con Paso/Escape importa.
