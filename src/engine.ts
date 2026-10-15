import type { Level } from './types';

// Niveles: "Skill Level" de Stockfish (0-20) combinado con una profundidad o tiempo de búsqueda.
const LEVELS: Record<Level, { skill: number; go: string }> = {
  facil: { skill: 0, go: 'go depth 1' },
  medio: { skill: 5, go: 'go depth 5' },
  dificil: { skill: 12, go: 'go depth 10' },
  experto: { skill: 20, go: 'go movetime 1500' },
};

const BASE = import.meta.env.BASE_URL;

/**
 * Envoltorio mínimo de Stockfish (protocolo UCI) en un Web Worker.
 * Si el motor no se puede cargar, bestMove devuelve null y la partida sigue con jugadas al azar.
 */
export class Engine {
  private worker: Worker | null = null;
  private readonly ready: Promise<boolean>;
  private requestId = 0;
  private onLine: ((line: string) => void) | null = null;

  constructor() {
    this.ready = this.boot();
  }

  private async boot(): Promise<boolean> {
    try {
      const res = await fetch(`${BASE}stockfish/manifest.json`, { cache: 'no-cache' });
      if (!res.ok) return false;
      const manifest = (await res.json()) as { js?: string };
      if (!manifest.js) return false;
      const worker = new Worker(`${BASE}stockfish/${manifest.js}`);
      this.worker = worker;
      worker.onmessage = (e: MessageEvent) => this.onLine?.(String(e.data));
      const ok = await this.expect(worker, 'uci', 'uciok', 20000);
      if (!ok) {
        worker.terminate();
        this.worker = null;
      }
      return ok;
    } catch {
      this.worker = null;
      return false;
    }
  }

  /** Envía un comando y espera una línea concreta de respuesta. */
  private expect(worker: Worker, command: string, reply: string, timeoutMs: number): Promise<boolean> {
    return new Promise((resolve) => {
      let timer = 0;
      const finish = (ok: boolean) => {
        window.clearTimeout(timer);
        this.onLine = null;
        worker.onerror = null;
        resolve(ok);
      };
      timer = window.setTimeout(() => finish(false), timeoutMs);
      this.onLine = (line) => {
        if (line === reply) finish(true);
      };
      worker.onerror = () => finish(false);
      worker.postMessage(command);
    });
  }

  /** Mejor jugada en notación UCI (por ejemplo "e2e4" o "e7e8q"), o null si no hay motor. */
  async bestMove(fen: string, level: Level): Promise<string | null> {
    const ok = await this.ready;
    const worker = this.worker;
    if (!ok || !worker) return null;
    const id = ++this.requestId;

    // Cancela cualquier búsqueda anterior y sincroniza para no mezclar respuestas.
    worker.postMessage('stop');
    await this.expect(worker, 'isready', 'readyok', 5000);
    if (id !== this.requestId) return null;

    const { skill, go } = LEVELS[level];
    worker.postMessage(`setoption name Skill Level value ${skill}`);
    worker.postMessage(`position fen ${fen}`);

    const move = await new Promise<string | null>((resolve) => {
      let timer = 0;
      const finish = (m: string | null) => {
        window.clearTimeout(timer);
        this.onLine = null;
        resolve(m);
      };
      timer = window.setTimeout(() => finish(null), 30000);
      this.onLine = (line) => {
        if (!line.startsWith('bestmove')) return;
        const m = line.split(/\s+/)[1];
        finish(m && m !== '(none)' ? m : null);
      };
      worker.postMessage(go);
    });

    return id === this.requestId ? move : null;
  }

  /** Cancela la búsqueda en curso (deshacer, nueva partida...). */
  stop(): void {
    this.requestId++;
    this.worker?.postMessage('stop');
  }

  dispose(): void {
    this.requestId++;
    this.worker?.terminate();
    this.worker = null;
  }
}
