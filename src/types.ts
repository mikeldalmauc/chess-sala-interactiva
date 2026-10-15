import type { PieceSetId, ThemeId } from './themes';

export type Color = 'w' | 'b';
export type Mode = 'cpu' | 'two';
export type Level = 'facil' | 'medio' | 'dificil' | 'experto';

export interface GameConfig {
  mode: Mode;
  /** Nivel de la máquina (solo modo cpu). */
  level: Level;
  /** Color del jugador humano (solo modo cpu). */
  humanColor: Color;
  /** Minutos por jugador; null = sin reloj. */
  minutes: number | null;
  /** Segundos que se añaden tras cada jugada. */
  increment: number;
}

export interface Settings {
  theme: ThemeId;
  pieces: PieceSetId;
  sound: boolean;
}

export type ResultReason =
  | 'mate'
  | 'ahogado'
  | 'material'
  | 'repeticion'
  | 'cincuenta'
  | 'tiempo'
  | 'abandono'
  | 'acuerdo';

export interface GameResult {
  winner: Color | null;
  reason: ResultReason;
}

export const LEVEL_NAMES: Record<Level, string> = {
  facil: 'Fácil',
  medio: 'Medio',
  dificil: 'Difícil',
  experto: 'Experto',
};

export const other = (c: Color): Color => (c === 'w' ? 'b' : 'w');
export const colorName = (c: Color): string => (c === 'w' ? 'Blancas' : 'Negras');
