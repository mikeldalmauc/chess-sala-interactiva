import { Chess } from 'chess.js';
import { useState } from 'react';
import { pieceUrl } from '../themes';
import { LEVEL_NAMES, type Color, type GameConfig, type Level, type Mode, type Settings } from '../types';
import { Board, type BoardPiece } from './Board';
import { FullscreenIcon, LogoIcon, PeopleIcon, PlayIcon, RobotIcon } from './Icons';
import { StylePicker } from './StylePicker';

interface Props {
  settings: Settings;
  onSettings: (s: Settings) => void;
  onStart: (config: GameConfig) => void;
}

const START_GRID: (BoardPiece | null)[][] = new Chess()
  .board()
  .map((row) => row.map((p) => (p ? { type: p.type, color: p.color } : null)));

interface Option<T> {
  value: T;
  label: string;
  img?: string;
}

function Pills<T extends string | number | null>({
  options,
  value,
  onChange,
}: {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="pills">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          className={`pill${o.value === value ? ' on' : ''}`}
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
        >
          {o.img && <img src={o.img} alt="" />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

function toggleFullscreen() {
  if (document.fullscreenElement) {
    void document.exitFullscreen();
  } else {
    void document.documentElement.requestFullscreen?.();
  }
}

export function Menu({ settings, onSettings, onStart }: Props) {
  const [mode, setMode] = useState<Mode>('cpu');
  const [level, setLevel] = useState<Level>('medio');
  const [color, setColor] = useState<Color>('w');
  const [minutes, setMinutes] = useState<number | null>(5);
  const [increment, setIncrement] = useState(0);

  const start = () =>
    onStart({
      mode,
      level,
      humanColor: color,
      minutes: mode === 'two' ? minutes : null,
      increment: mode === 'two' ? increment : 0,
    });

  return (
    <div className="menu">
      <div className="menu-preview">
        <Board grid={START_GRID} orientation="w" theme={settings.theme} pieceSet={settings.pieces} rotateBlack={mode === 'two'} />
        <p>Así se verá el tablero</p>
      </div>

      <div className="menu-panel">
        <div className="menu-title">
          <LogoIcon />
          <div>
            <h1>Ajedrez</h1>
            <p>Elige cómo jugar y pulsa Jugar</p>
          </div>
          <button type="button" className="btn icon-btn" aria-label="Pantalla completa" onClick={toggleFullscreen}>
            <FullscreenIcon />
          </button>
        </div>

        <div className="mode-row">
          <button type="button" className={`mode${mode === 'cpu' ? ' on' : ''}`} aria-pressed={mode === 'cpu'} onClick={() => setMode('cpu')}>
            <RobotIcon />
            <span>
              <b>Un jugador</b>
              <span>contra la máquina</span>
            </span>
          </button>
          <button type="button" className={`mode${mode === 'two' ? ' on' : ''}`} aria-pressed={mode === 'two'} onClick={() => setMode('two')}>
            <PeopleIcon />
            <span>
              <b>Dos jugadores</b>
              <span>uno a cada lado de la mesa</span>
            </span>
          </button>
        </div>

        {mode === 'cpu' ? (
          <>
            <section className="section">
              <h2>Nivel de la máquina</h2>
              <Pills<Level>
                options={(Object.keys(LEVEL_NAMES) as Level[]).map((l) => ({ value: l, label: LEVEL_NAMES[l] }))}
                value={level}
                onChange={setLevel}
              />
            </section>
            <section className="section">
              <h2>Juegas con</h2>
              <Pills<Color>
                options={[
                  { value: 'w', label: 'Blancas', img: pieceUrl(settings.pieces, 'w', 'k') },
                  { value: 'b', label: 'Negras', img: pieceUrl(settings.pieces, 'b', 'k') },
                ]}
                value={color}
                onChange={setColor}
              />
            </section>
          </>
        ) : (
          <>
            <section className="section">
              <h2>Minutos por jugador</h2>
              <Pills<number | null>
                options={[
                  { value: null, label: 'Sin reloj' },
                  { value: 3, label: '3 min' },
                  { value: 5, label: '5 min' },
                  { value: 10, label: '10 min' },
                  { value: 15, label: '15 min' },
                  { value: 30, label: '30 min' },
                ]}
                value={minutes}
                onChange={setMinutes}
              />
            </section>
            <section className="section">
              <h2>Segundos extra por jugada</h2>
              <Pills<number>
                options={[
                  { value: 0, label: '0 s' },
                  { value: 2, label: '2 s' },
                  { value: 5, label: '5 s' },
                  { value: 10, label: '10 s' },
                ]}
                value={increment}
                onChange={setIncrement}
              />
            </section>
          </>
        )}

        <button type="button" className="play" onClick={start}>
          <PlayIcon />
          Jugar
        </button>

        <StylePicker settings={settings} onChange={onSettings} />
      </div>
    </div>
  );
}
