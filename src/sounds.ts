// Sonidos sintetizados con Web Audio: no hace falta ningún fichero de audio.
// "knock" imita el golpe de una pieza de madera sobre el tablero.

let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(on: boolean): void {
  enabled = on;
}

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** Llamar en el primer toque del usuario: los navegadores bloquean el audio hasta entonces. */
export function unlockAudio(): void {
  getContext();
}

interface Knock {
  freq: number;
  noise: number;
  gain: number;
  decay: number;
}

function knock(c: AudioContext, at: number, k: Knock): void {
  // Golpe grave (seno con caída rápida)
  const osc = c.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(k.freq, at);
  osc.frequency.exponentialRampToValueAtTime(k.freq * 0.55, at + k.decay);
  const g = c.createGain();
  g.gain.setValueAtTime(k.gain, at);
  g.gain.exponentialRampToValueAtTime(0.0001, at + k.decay);
  osc.connect(g).connect(c.destination);
  osc.start(at);
  osc.stop(at + k.decay + 0.05);

  // Ruido breve filtrado: el "toc" de la madera
  const n = Math.floor(c.sampleRate * 0.05);
  const buffer = c.createBuffer(1, n, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 2;
  const src = c.createBufferSource();
  src.buffer = buffer;
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = k.noise;
  bp.Q.value = 0.7;
  const ng = c.createGain();
  ng.gain.setValueAtTime(k.gain * 0.5, at);
  ng.gain.exponentialRampToValueAtTime(0.0001, at + 0.05);
  src.connect(bp).connect(ng).connect(c.destination);
  src.start(at);
}

function tone(c: AudioContext, at: number, freq: number, dur: number, gain: number, type: OscillatorType = 'sine'): void {
  const osc = c.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(gain, at + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(g).connect(c.destination);
  osc.start(at);
  osc.stop(at + dur + 0.05);
}

function play(fn: (c: AudioContext, at: number) => void): void {
  if (!enabled) return;
  const c = getContext();
  if (!c) return;
  try {
    fn(c, c.currentTime + 0.01);
  } catch {
    // Si el audio falla, la partida sigue en silencio.
  }
}

const WOOD: Knock = { freq: 190, noise: 2400, gain: 0.5, decay: 0.09 };

export const sounds = {
  move: () => play((c, t) => knock(c, t, WOOD)),
  capture: () =>
    play((c, t) => {
      knock(c, t, { freq: 130, noise: 1600, gain: 0.7, decay: 0.13 });
      knock(c, t + 0.05, { freq: 100, noise: 1200, gain: 0.4, decay: 0.12 });
    }),
  castle: () =>
    play((c, t) => {
      knock(c, t, WOOD);
      knock(c, t + 0.1, { ...WOOD, freq: 170, noise: 2200 });
    }),
  check: () =>
    play((c, t) => {
      knock(c, t, WOOD);
      tone(c, t + 0.05, 880, 0.18, 0.12, 'triangle');
      tone(c, t + 0.17, 1174.7, 0.28, 0.12, 'triangle');
    }),
  promote: () =>
    play((c, t) => {
      [523.25, 659.25, 783.99].forEach((f, i) => tone(c, t + i * 0.09, f, 0.25, 0.12, 'triangle'));
    }),
  start: () =>
    play((c, t) => {
      [392, 523.25, 659.25].forEach((f, i) => tone(c, t + i * 0.1, f, 0.22, 0.1, 'triangle'));
    }),
  end: () =>
    play((c, t) => {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(c, t + i * 0.06, f, 0.7, 0.08));
    }),
};
