// Copia el motor Stockfish (versión "lite single", sin SharedArrayBuffer)
// desde node_modules a public/stockfish y escribe un manifest con el nombre
// del fichero JS, para que la app no dependa del número de versión.
import { createRequire } from 'node:module';
import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const dest = join(here, '..', 'public', 'stockfish');

let pkgDir;
try {
  pkgDir = dirname(require.resolve('stockfish/package.json'));
} catch {
  console.warn('[stockfish] paquete no instalado: la máquina jugará al azar');
  process.exit(0);
}

let files = [];
for (const sub of ['src', 'bin', '.']) {
  const dir = join(pkgDir, sub);
  if (!existsSync(dir)) continue;
  files = readdirSync(dir)
    .filter((f) => /lite-single.*\.(js|wasm)$/.test(f))
    .map((f) => join(dir, f));
  if (files.length) break;
}

if (!files.length) {
  console.warn('[stockfish] no se encontraron los ficheros lite-single');
  process.exit(0);
}

mkdirSync(dest, { recursive: true });
for (const f of files) cpSync(f, join(dest, basename(f)));
const js = files.map((f) => basename(f)).find((f) => f.endsWith('.js'));
writeFileSync(join(dest, 'manifest.json'), JSON.stringify({ js }, null, 2));
console.log(`[stockfish] ${files.length} ficheros copiados a public/stockfish (${js})`);
