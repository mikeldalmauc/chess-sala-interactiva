# Ajedrez · Sala interactiva

Web de ajedrez pensada para jugarse en una **mesa táctil**: tablero grande en el centro, cada jugador con su reloj y sus botones en su lado de la mesa, y el panel del rival girado 180° para que lo vea de frente. Es una aplicación **solo de cliente** (React + Vite): no necesita servidor, se sirve como ficheros estáticos.

Publicada en GitHub Pages: <https://mikeldalmauc.github.io/chess-sala-interactiva/>

## Qué hace

- **Un jugador contra la máquina** con cuatro niveles (Fácil, Medio, Difícil, Experto). El motor es Stockfish, ejecutado en el navegador dentro de un Web Worker.
- **Dos jugadores en la misma mesa**, con reloj configurable (minutos por jugador y segundos extra por jugada) o sin reloj.
- **Reglas completas** gracias a chess.js: jaque mate, rey ahogado, triple repetición, regla de las 50 jugadas, material insuficiente, caída de bandera, abandono y tablas de mutuo acuerdo.
- **Estilos**: cuatro colores de tablero y dos juegos de piezas. Se guardan en el navegador.
- **Sonidos** sintetizados con Web Audio (no hay ficheros de audio): mover, capturar, enroque, jaque, coronación, inicio y fin de partida. Se pueden silenciar.

## Pensada para la mesa táctil

- Para mover: **tocar la pieza y después la casilla de destino**, o **arrastrarla** con el dedo. Al seleccionar una pieza se marcan sus jugadas legales; también se resaltan la última jugada y el jaque.
- En dos jugadores, el panel y las piezas del jugador de arriba **se giran 180°**: cada uno ve su reloj, sus botones y sus piezas de frente.
- Botones grandes (mínimo 72 px) y sin nada que dependa del ratón. Las acciones delicadas (rendirse, salir, nueva partida) **piden un segundo toque** para confirmar.
- Sin zoom con los dedos, sin selección de texto y sin menú contextual al mantener pulsado.
- Botón de **pantalla completa** en el menú. Para una instalación fija conviene abrir el navegador en modo kiosco, por ejemplo `chrome --kiosk http://localhost:8080`.
- La interfaz escala con el ancho de la pantalla: está ajustada para 1920×1080 y se adapta a pantallas más grandes o más pequeñas.

## Desarrollo sin instalar nada en el PC

Solo hace falta **Docker** (con Compose v2). Node, npm y las dependencias viven dentro del contenedor de desarrollo definido en `.devcontainer/Dockerfile` y `docker-compose.yml`.

El código del repositorio se monta como volumen en `/app`, así que los cambios se ven al instante; `node_modules` vive en un volumen propio (`chess-sala-interactiva_node_modules`) para no mezclar binarios de Linux con el sistema de ficheros de Windows.

### Opción A: desde la terminal

```bash
docker compose up dev          # instala dependencias y arranca Vite en http://localhost:5173
```

Otros comandos útiles (se ejecutan dentro del contenedor):

```bash
docker compose run --rm dev npm run build          # compila en ./dist
docker compose run --rm dev npm install <paquete>  # añade una dependencia
docker compose down -v                             # borra también el volumen de node_modules
```

### Opción B: desde VS Code

Con la extensión **Dev Containers**, abre la carpeta y elige *Reopen in Container*. VS Code usa el mismo servicio `dev` de Compose, instala las dependencias y deja un terminal dentro del contenedor:

```bash
npm run dev
```

El puerto 5173 se reenvía automáticamente.

## Contenedor de producción

`Dockerfile` compila la web en una imagen de Node y la sirve con nginx (ficheros estáticos, gzip y cabeceras de caché).

```bash
docker compose up --build web   # http://localhost:8080
```

O sin Compose:

```bash
docker build -t ajedrez-mesa .
docker run --rm -p 8080:80 ajedrez-mesa
```

Si la web va a servirse bajo una subruta, pasa el argumento de build `BASE_PATH`, por ejemplo `--build-arg BASE_PATH=/ajedrez/`.

## Despliegue automático en GitHub Pages

El workflow `.github/workflows/deploy.yml` se ejecuta en cada push a `main`:

1. Instala las dependencias con `npm ci` (eso copia el motor Stockfish a `public/stockfish/`).
2. Compila con `BASE_PATH=/<nombre-del-repositorio>/`, que es la ruta en la que GitHub Pages sirve el sitio.
3. Sube la carpeta `dist` y la publica.

**Antes del primer despliegue** hay que activar Pages una vez a mano, porque el token del workflow no tiene permiso para crear el sitio: en el repositorio, *Settings → Pages → Build and deployment → Source: GitHub Actions*. Después, cada push a `main` publica la web; también se puede lanzar a mano desde la pestaña *Actions* (*Run workflow*).

## Pruebas en un navegador real

`scripts/e2e/check.mjs` abre la web compilada en Chromium (imagen oficial de Playwright, también en Docker) y juega de verdad: toca y arrastra piezas, provoca un jaque, ofrece tablas, deja responder a la máquina, deshace, se rinde, corona un peón y cambia de estilo. Deja capturas de pantalla en `scripts/e2e/out/`.

```bash
docker compose run --rm dev npm run build   # genera ./dist
docker compose run --rm e2e                 # 22 comprobaciones; la primera vez descarga la imagen de Playwright
```

Si además existe `./dist-pages` (un build con `BASE_PATH=/chess-sala-interactiva/`), comprueba también que la web funciona bajo la subruta de GitHub Pages.

## Estructura del proyecto

```
.
├── .devcontainer/
│   ├── Dockerfile          # imagen de desarrollo (Node 22, npm, git)
│   └── devcontainer.json   # configuración para VS Code Dev Containers
├── .github/workflows/
│   └── deploy.yml          # build y despliegue en GitHub Pages
├── docker-compose.yml      # servicios: dev (desarrollo) y web (producción)
├── Dockerfile              # imagen de producción (build de Vite + nginx)
├── nginx.conf
├── scripts/
│   ├── copy-stockfish.mjs  # copia el motor de node_modules a public/stockfish (postinstall)
│   └── e2e/check.mjs       # prueba de extremo a extremo con Playwright (docker compose run --rm e2e)
├── public/
│   ├── pieces/             # juegos de piezas SVG (ver LICENSES.md)
│   └── stockfish/          # motor Stockfish (generado al instalar; no se versiona)
└── src/
    ├── App.tsx             # menú o partida; guarda los ajustes
    ├── components/
    │   ├── Menu.tsx        # modo, nivel, color, reloj y estilos
    │   ├── Game.tsx        # lógica de la partida: turnos, motor, reloj, fin de partida
    │   ├── Board.tsx       # tablero táctil: tocar-tocar y arrastrar
    │   ├── PlayerPanel.tsx # reloj, estado y botones de cada jugador
    │   ├── Dialogs.tsx     # fin de partida y coronación
    │   ├── StylePicker.tsx # colores del tablero, piezas y sonido
    │   ├── ConfirmButton.tsx
    │   └── Icons.tsx
    ├── engine.ts           # Stockfish por UCI en un Web Worker, niveles
    ├── useClock.ts         # reloj de ajedrez con incremento
    ├── sounds.ts           # sonidos sintetizados (Web Audio)
    ├── themes.ts           # colores y juegos de piezas
    ├── settings.ts         # ajustes en localStorage
    ├── types.ts
    └── styles.css
```

## Cómo funciona por dentro

### La máquina

`src/engine.ts` carga `public/stockfish/stockfish-19-lite-single.js` en un Web Worker y habla con él por UCI. Es la versión *lite* y de un solo hilo: pesa 1,8 MB y no necesita las cabeceras de aislamiento que GitHub Pages no permite configurar. Los niveles combinan la opción `Skill Level` de Stockfish con la profundidad o el tiempo de búsqueda:

| Nivel   | Skill Level | Búsqueda              | Extra                                   |
| ------- | ----------- | --------------------- | --------------------------------------- |
| Fácil   | 0           | profundidad 1         | el 40 % de las veces juega al azar      |
| Medio   | 5           | profundidad 5         |                                         |
| Difícil | 12          | profundidad 10        |                                         |
| Experto | 20          | 1,5 s por jugada      |                                         |

Si el motor no se puede cargar, la máquina sigue jugando con jugadas legales al azar.

### El reloj

`src/useClock.ts`. La primera jugada de cada bando no consume tiempo; después de cada jugada se suma el incremento al que ha movido y arranca el reloj del rival. Por debajo de 20 segundos el reloj activo se pone en rojo. Si llega a cero, pierde ese bando.

### El tablero

`src/components/Board.tsx` usa eventos *pointer*, así que el mismo código vale para dedo y ratón. Al tocar una pieza propia se selecciona y empieza un posible arrastre; si se suelta en otra casilla se intenta la jugada. La validación la hace chess.js: solo se aceptan jugadas legales.

## Personalizar

- **Colores del tablero**: `THEMES` en `src/themes.ts`.
- **Juegos de piezas**: añade una carpeta en `public/pieces/<nombre>/` con `wK.svg`, `wQ.svg`, … `bP.svg` y regístrala en `PIECE_SETS` en `src/themes.ts`.
- **Niveles**: tabla `LEVELS` en `src/engine.ts`.
- **Tiempos del menú**: listas de minutos e incrementos en `src/components/Menu.tsx`.
- **Sonidos**: `src/sounds.ts`.

## Licencias de terceros

- [chess.js](https://github.com/jhlywa/chess.js) — BSD-2-Clause.
- [Stockfish](https://stockfishchess.org/) (paquete npm `stockfish`) — GPL-3.0. Se sirve como ficheros aparte en `public/stockfish/`; no se mezcla con el código de la web.
- Piezas *Clásico* (cburnett) — Colin M. L. Burnett, CC BY-SA 3.0. Piezas *Moderno* (chessnut) — Alexis Luengas, Apache 2.0. Detalles en `public/pieces/LICENSES.md`.
- Tipografía Nunito — SIL Open Font License, cargada desde Google Fonts (si no hay conexión se usa la fuente del sistema).
