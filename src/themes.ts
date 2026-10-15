export const THEMES = {
  verde: { name: 'Verde', light: '#eeeed2', dark: '#769656' },
  marron: { name: 'Marrón', light: '#f0d9b5', dark: '#b58863' },
  azul: { name: 'Azul', light: '#dee3e6', dark: '#8ca2ad' },
  gris: { name: 'Gris', light: '#e8e8e8', dark: '#8f8f8f' },
} as const;

export type ThemeId = keyof typeof THEMES;

export const PIECE_SETS = {
  cburnett: { name: 'Clásico' },
  chessnut: { name: 'Moderno' },
} as const;

export type PieceSetId = keyof typeof PIECE_SETS;

export function pieceUrl(set: PieceSetId, color: 'w' | 'b', type: string): string {
  return `${import.meta.env.BASE_URL}pieces/${set}/${color}${type.toUpperCase()}.svg`;
}

export const isThemeId = (v: unknown): v is ThemeId => typeof v === 'string' && v in THEMES;
export const isPieceSetId = (v: unknown): v is PieceSetId => typeof v === 'string' && v in PIECE_SETS;
