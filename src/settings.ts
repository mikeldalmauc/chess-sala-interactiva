import { isPieceSetId, isThemeId } from './themes';
import type { Settings } from './types';

const KEY = 'ajedrez-mesa:ajustes';

export const DEFAULT_SETTINGS: Settings = { theme: 'verde', pieces: 'cburnett', sound: true };

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      theme: isThemeId(parsed.theme) ? parsed.theme : DEFAULT_SETTINGS.theme,
      pieces: isPieceSetId(parsed.pieces) ? parsed.pieces : DEFAULT_SETTINGS.pieces,
      sound: typeof parsed.sound === 'boolean' ? parsed.sound : DEFAULT_SETTINGS.sound,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // Sin almacenamiento local: los ajustes duran lo que dure la sesión.
  }
}
