import { useCallback, useEffect, useRef, useState } from 'react';
import type { Color } from './types';

export interface ClockApi {
  enabled: boolean;
  /** Milisegundos restantes de cada bando. */
  time: Record<Color, number>;
  running: Color | null;
  /** Tras una jugada: suma el incremento al que ha movido y arranca el reloj del rival. */
  afterMove: (mover: Color) => void;
  stop: () => void;
}

export function useClock(minutes: number | null, incrementSec: number, onFlag: (loser: Color) => void): ClockApi {
  const enabled = minutes !== null && minutes > 0;
  const initial = enabled ? minutes * 60_000 : 0;
  const [time, setTime] = useState<Record<Color, number>>({ w: initial, b: initial });
  const [running, setRunning] = useState<Color | null>(null);
  const onFlagRef = useRef(onFlag);
  onFlagRef.current = onFlag;
  const flagged = useRef(false);

  useEffect(() => {
    if (!running || !enabled) return;
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const dt = now - last;
      last = now;
      setTime((t) => ({ ...t, [running]: Math.max(0, t[running] - dt) }));
    }, 100);
    return () => window.clearInterval(id);
  }, [running, enabled]);

  useEffect(() => {
    if (!running || flagged.current) return;
    if (time[running] <= 0) {
      flagged.current = true;
      setRunning(null);
      onFlagRef.current(running);
    }
  }, [time, running]);

  const afterMove = useCallback(
    (mover: Color) => {
      if (!enabled || flagged.current) return;
      setTime((t) => ({ ...t, [mover]: t[mover] + incrementSec * 1000 }));
      setRunning(mover === 'w' ? 'b' : 'w');
    },
    [enabled, incrementSec],
  );

  const stop = useCallback(() => setRunning(null), []);

  return { enabled, time, running, afterMove, stop };
}
