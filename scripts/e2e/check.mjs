// Prueba de extremo a extremo en un navegador real (Chromium headless).
// Se ejecuta con `docker compose run --rm e2e` tras compilar la web (`npm run build`).
// Sirve ./dist en un puerto local, juega partidas tocando y arrastrando piezas y guarda capturas en scripts/e2e/out/.
import http from 'node:http';
import { createReadStream, existsSync, mkdirSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';

const DIST = process.env.DIST_DIR || '/dist';
const DIST_PAGES = process.env.DIST_PAGES_DIR || '/dist-pages';
const OUT = process.env.OUT_DIR || '/e2e/out';
const PORT = 8099;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
  '.json': 'application/json',
};

function serve(roots, port) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = decodeURIComponent(req.url.split('?')[0]);
      const entry = roots.find((r) => r.prefix !== '/' && url.startsWith(r.prefix)) || roots.find((r) => r.prefix === '/');
      let file = normalize(join(entry.dir, url.slice(entry.prefix.length)));
      if (!file.startsWith(entry.dir)) {
        res.writeHead(403);
        return res.end();
      }
      if (!existsSync(file) || statSync(file).isDirectory()) file = join(entry.dir, 'index.html');
      res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' });
      createReadStream(file).pipe(res);
    });
    server.listen(port, () => resolve(server));
  });
}

const results = [];
const check = (name, ok, extra = '') => {
  results.push({ name, ok });
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${extra ? `  [${extra}]` : ''}`);
};

if (!existsSync(join(DIST, 'index.html'))) {
  console.error(`No existe ${DIST}/index.html. Compila primero: docker compose run --rm dev npm run build`);
  process.exit(1);
}
mkdirSync(OUT, { recursive: true });
const hasPages = existsSync(join(DIST_PAGES, 'index.html'));
const server = await serve(
  [
    { prefix: '/', dir: DIST },
    { prefix: '/chess-sala-interactiva/', dir: DIST_PAGES },
  ],
  PORT,
);

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, hasTouch: true });
const page = await context.newPage();
const errors = [];
const ignorable = (t) => /fonts\.g|googleapis|gstatic/.test(t);
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => {
  if (m.type() === 'error' && !ignorable(m.text())) errors.push('console: ' + m.text());
});

const sq = (s) => page.locator(`[data-square="${s}"]`);
const hasPiece = async (s) => (await sq(s).locator('img').count()) > 0;
const pieceSrc = async (s) => (await sq(s).locator('img').getAttribute('src')) || '';
const tap = async (from, to) => {
  await sq(from).click();
  await sq(to).click();
};
const center = async (s) => {
  const b = await sq(s).boundingBox();
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
};
const drag = async (from, to) => {
  const a = await center(from);
  const b = await center(to);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move((a.x + b.x) / 2, (a.y + b.y) / 2, { steps: 6 });
  await page.mouse.move(b.x, b.y, { steps: 6 });
  await page.mouse.up();
};
const shot = (name) => page.screenshot({ path: join(OUT, name) });

try {
  // ---------- Menú ----------
  await page.goto(`http://localhost:${PORT}/`);
  await page.waitForSelector('.menu');
  await shot('01-menu.png');

  const uci = await page.evaluate(
    () =>
      new Promise((res) => {
        fetch('/stockfish/manifest.json')
          .then((r) => r.json())
          .then((m) => {
            const w = new Worker('/stockfish/' + m.js);
            const t = setTimeout(() => res('timeout'), 20000);
            w.onmessage = (e) => {
              if (String(e.data).includes('uciok')) {
                clearTimeout(t);
                w.terminate();
                res('uciok');
              }
            };
            w.onerror = (e) => res('error ' + e.message);
            w.postMessage('uci');
          })
          .catch((e) => res('sin manifest: ' + e.message));
      }),
  );
  check('Stockfish (worker wasm) responde uciok', uci === 'uciok', uci);

  // ---------- Dos jugadores, 5 min + 2 s ----------
  await page.getByRole('button', { name: /Dos jugadores/ }).click();
  await page.getByRole('button', { name: '5 min', exact: true }).click();
  await page.getByRole('button', { name: '2 s', exact: true }).click();
  await page.getByRole('button', { name: 'Jugar' }).click();
  await page.waitForSelector('.game.two');
  await shot('02-dos-jugadores-inicio.png');

  await tap('e2', 'e4');
  check('e2-e4 tocando origen y destino', !(await hasPiece('e2')) && (await hasPiece('e4')));

  await sq('e7').click();
  const dots = await page.locator('.sq.dot').count();
  check('al seleccionar e7 se marcan 2 jugadas legales', dots === 2, String(dots));
  await sq('e5').click();
  check('e7-e5', await hasPiece('e5'));

  await drag('g1', 'f3');
  check('g1-f3 arrastrando la pieza', (await hasPiece('f3')) && !(await hasPiece('g1')));

  await tap('e5', 'e3');
  check('jugada ilegal e5-e3 rechazada', !(await hasPiece('e3')) && (await hasPiece('e5')));

  await tap('b8', 'c6');
  await tap('f1', 'c4');
  await tap('f8', 'c5');
  await tap('c2', 'c3');
  await tap('g8', 'f6');
  await tap('d2', 'd4');
  await tap('e5', 'd4');
  await tap('c3', 'd4');
  await tap('c5', 'b4');
  check('jaque resaltado en e1', (await page.locator('.sq.check[data-square="e1"]').count()) === 1);
  check('insignia ¡Jaque! visible', (await page.getByText('¡Jaque!').count()) >= 1);
  const activeClock = (await page.locator('.panel-bottom .clock.active').textContent()) || '';
  check('reloj de blancas activo con formato mm:ss', /^\d\d:\d\d$/.test(activeClock), activeClock);
  const blackClock = (await page.locator('.panel-top .clock').textContent()) || '';
  check('reloj de negras ha descontado tiempo y sumado incremento', blackClock !== '05:00', blackClock);
  await shot('03-dos-jugadores-jaque.png');

  await page.locator('.panel-top').getByRole('button', { name: /Tablas/ }).click();
  check('oferta de tablas aparece en el panel del rival', (await page.getByText('Negras ofrecen tablas').count()) === 1);
  await page.locator('.panel-bottom').getByRole('button', { name: 'Aceptar' }).click();
  check('tablas acordadas terminan la partida', (await page.getByText('Tablas acordadas').count()) >= 1);
  await shot('04-fin-tablas.png');
  await page.getByRole('button', { name: 'Volver al menú' }).click();
  await page.waitForSelector('.menu');

  // ---------- Un jugador, nivel fácil ----------
  await page.getByRole('button', { name: /Un jugador/ }).click();
  await page.getByRole('button', { name: 'Fácil' }).click();
  await page.getByRole('button', { name: 'Jugar' }).click();
  await page.waitForSelector('.game.cpu');
  await tap('e2', 'e4');
  await page.waitForFunction(
    () => {
      const last = [...document.querySelectorAll('.sq.last')].map((e) => e.getAttribute('data-square'));
      return last.length === 2 && !last.includes('e4');
    },
    null,
    { timeout: 30000 },
  );
  const reply = await page.evaluate(() => [...document.querySelectorAll('.sq.last')].map((e) => e.getAttribute('data-square')).join('-'));
  check('la máquina responde a e2-e4', true, reply);
  await shot('05-maquina.png');

  await page.getByRole('button', { name: 'Deshacer' }).click();
  await page.waitForTimeout(400);
  check('deshacer devuelve la posición inicial', (await hasPiece('e2')) && !(await hasPiece('e4')));

  const resign = page.locator('.panel-bottom').getByRole('button', { name: /Rendirse|Toca otra vez/ });
  await resign.click();
  check('primer toque en Rendirse pide confirmación', (await page.getByText('¿Rendirse? Toca otra vez').count()) === 1);
  await resign.click();
  check('segundo toque termina la partida por abandono', (await page.getByText('Abandono').count()) >= 1);
  await shot('06-abandono.png');
  await page.getByRole('button', { name: 'Volver al menú' }).click();
  await page.waitForSelector('.menu');

  // ---------- Coronación y estilos (dos jugadores sin reloj) ----------
  await page.getByRole('button', { name: /Dos jugadores/ }).click();
  await page.getByRole('button', { name: 'Sin reloj' }).click();
  await page.getByRole('button', { name: 'Jugar' }).click();
  await page.waitForSelector('.game.two');
  await tap('a2', 'a4');
  await tap('b7', 'b5');
  await tap('a4', 'b5');
  await tap('a7', 'a6');
  await tap('b5', 'a6');
  await tap('b8', 'c6');
  await tap('a6', 'a7');
  await tap('a8', 'b8');
  await tap('a7', 'a8');
  check('aparece el diálogo de coronación', (await page.getByText('Corona tu peón').count()) === 1);
  await shot('07-coronacion.png');
  await page.getByRole('button', { name: 'Coronar a dama' }).click();
  check('hay una dama blanca en a8', (await pieceSrc('a8')).endsWith('wQ.svg'), await pieceSrc('a8'));

  await page.getByRole('button', { name: 'Estilo' }).click();
  await page.getByRole('button', { name: 'Tablero Marrón' }).click();
  await page.getByRole('button', { name: 'Moderno' }).click();
  const light = await page.locator('.sq.light').first().evaluate((el) => getComputedStyle(el).backgroundColor);
  check('tema marrón aplicado al tablero', light === 'rgb(240, 217, 181)', light);
  check('juego de piezas moderno aplicado', (await pieceSrc('e1')).includes('/pieces/chessnut/'), await pieceSrc('e1'));
  await shot('08-estilo.png');
  const stored = await page.evaluate(() => localStorage.getItem('ajedrez-mesa:ajustes'));
  check('ajustes guardados en localStorage', !!stored && stored.includes('marron'), stored || '');

  // ---------- Build de GitHub Pages bajo /chess-sala-interactiva/ (si existe dist-pages) ----------
  if (hasPages) {
    const page2 = await context.newPage();
    const failed = [];
    page2.on('requestfailed', (r) => {
      if (!ignorable(r.url())) failed.push(r.url());
    });
    page2.on('response', (r) => {
      if (r.status() >= 400 && !ignorable(r.url())) failed.push(`${r.status()} ${r.url()}`);
    });
    await page2.goto(`http://localhost:${PORT}/chess-sala-interactiva/`);
    await page2.waitForSelector('.menu');
    const src2 = (await page2.locator('.board img').first().getAttribute('src')) || '';
    check('pages: las piezas usan la ruta base', src2.startsWith('/chess-sala-interactiva/pieces/'), src2);
    const manifestOk = await page2.evaluate(() => fetch('/chess-sala-interactiva/stockfish/manifest.json').then((r) => r.ok));
    check('pages: manifest del motor accesible', manifestOk === true);
    check('pages: ninguna petición fallida', failed.length === 0, failed.join(', '));
    await page2.screenshot({ path: join(OUT, '09-pages.png') });
  } else {
    console.log('(sin dist-pages: se omite la comprobación de la ruta base de GitHub Pages)');
  }

  check('sin errores de consola ni excepciones', errors.length === 0, errors.join(' | '));
} catch (e) {
  check('la prueba no se ha interrumpido', false, e.message);
  await shot('99-error.png').catch(() => {});
}

await browser.close();
server.close();
const failedCount = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failedCount}/${results.length} comprobaciones correctas`);
process.exit(failedCount ? 1 : 0);
