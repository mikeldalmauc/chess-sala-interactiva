import { PIECE_SETS, THEMES, type PieceSetId, type ThemeId } from '../themes';
import type { Settings } from '../types';
import { SpeakerIcon } from './Icons';

interface Props {
  settings: Settings;
  onChange: (s: Settings) => void;
}

/** Fila de estilos: colores del tablero, juego de piezas y sonido. */
export function StylePicker({ settings, onChange }: Props) {
  return (
    <div className="style-picker">
      <span className="label">Tablero</span>
      {(Object.keys(THEMES) as ThemeId[]).map((id) => {
        const t = THEMES[id];
        const on = settings.theme === id;
        return (
          <button
            key={id}
            type="button"
            className={`swatch${on ? ' on' : ''}`}
            aria-label={`Tablero ${t.name}`}
            aria-pressed={on}
            onClick={() => onChange({ ...settings, theme: id })}
          >
            <span style={{ background: t.light }} />
            <span style={{ background: t.dark }} />
            <span style={{ background: t.dark }} />
            <span style={{ background: t.light }} />
          </button>
        );
      })}
      <span className="label">Piezas</span>
      {(Object.keys(PIECE_SETS) as PieceSetId[]).map((id) => {
        const on = settings.pieces === id;
        return (
          <button
            key={id}
            type="button"
            className={`pill${on ? ' on' : ''}`}
            aria-pressed={on}
            onClick={() => onChange({ ...settings, pieces: id })}
          >
            {PIECE_SETS[id].name}
          </button>
        );
      })}
      <button
        type="button"
        className={`pill sound${settings.sound ? ' on' : ''}`}
        aria-pressed={settings.sound}
        onClick={() => onChange({ ...settings, sound: !settings.sound })}
      >
        <SpeakerIcon muted={!settings.sound} />
        {settings.sound ? 'Sonido' : 'Silencio'}
      </button>
    </div>
  );
}
