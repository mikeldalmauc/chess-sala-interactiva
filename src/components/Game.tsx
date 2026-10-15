import { Chess, type Square } from 'chess.js';
import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Engine } from '../engine';
import { sounds } from '../sounds';
import { LEVEL_NAMES, colorName, other, type Color, type GameConfig, type GameResult, type Settings } from '../types';
import { useClock } from '../useClock';
import { Board, type BoardPiece, type Target } from './Board';
import { ConfirmButton } from './ConfirmButton';
import { GameOverDialog, PromotionDialog } from './Dialogs';
import { FlagIcon, HalfIcon, HomeIcon, PaletteIcon, RestartIcon, SpeakerIcon, UndoIcon } from './Icons';
import { PlayerPanel, type PanelAction, type PlayerPanelProps } from './PlayerPanel';
import { StylePicker } from './StylePicker';

interface Props {
  config: GameConfig;
  settings: Settings;
  onSettings: (s: Settings) => void;
  onExit: () => void;
  onRestart: () => void;
  onRematch: () => void;
}

function checkGameOver(chess: Chess): GameResult | null {
  if (chess.isCheckmate()) return { winner: other(chess.turn()), reason: 'mate' };
  if (chess.isStalemate()) return { winner: null, reason: 'ahogado' };
  if (chess.isInsufficientMaterial()) return { winner: null, reason: 'material' };
  if (chess.isThreefoldRepetition()) return { winner: null, reason: 'repeticion' };
  if (chess.isDraw()) return { winner: null, reason: 'cincuenta' };
  return null;
}

function kingSquare(chess: Chess, color: Color): string | null {
  for (const row of chess.board()) {
    for (const p of row) {
      if (p && p.type === 'k' && p.color === color) return p.square;
    }
  }
  return null;
}

function timeControlLabel(config: GameConfig): string {
  if (!config.minutes) return 'Sin reloj';
  return config.increment ? `${config.minutes} min + ${config.increment} s` : `${config.minutes} min`;
}

export function Game({ config, settings, onSettings, onExit, onRestart, onRematch }: Props) {
  const chessRef = useRef<Chess | null>(null);
  if (!chessRef.current) chessRef.current = new Chess();
  const chess = chessRef.current;
  const [, rerender] = useReducer((n: number) => n + 1, 0);

  const [selected, setSelected] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [promo, setPromo] = useState<{ from: string; to: string } | null>(null);
  const [result, setResult] = useState<GameResult | null>(null);
  const [drawOffer, setDrawOffer] = useState<Color | null>(null);
  const [thinking, setThinking] = useState(false);
  const [styleOpen, setStyleOpen] = useState(false);
  const engineRef = useRef<Engine | null>(null);

  const twoPlayers = config.mode === 'two';
  const human = config.humanColor;
  const cpuColor = other(human);
  const orientation: Color = twoPlayers ? 'w' : human;
  const topColor = other(orientation);
  const fen = chess.fen();
  const turn = chess.turn();
  const inCheck = chess.inCheck();
  const inProgress = result === null;
  const historyLength = chess.history().length;

  const finishRef = useRef<(r: GameResult) => void>(() => {});
  const clock = useClock(config.minutes, config.increment, (loser) =>
    finishRef.current({ winner: other(loser), reason: 'tiempo' }),
  );

  const finish = (r: GameResult) => {
    engineRef.current?.stop();
    setThinking(false);
    setResult(r);
    setSelected(null);
    setPromo(null);
    setDrawOffer(null);
    clock.stop();
    sounds.end();
  };
  finishRef.current = finish;

  const applyMove = (from: string, to: string, promotion?: string) => {
    let flags: string;
    let mover: Color;
    try {
      const mv = chess.move({ from, to, promotion });
      flags = mv.flags;
      mover = mv.color;
    } catch {
      return;
    }
    const r = checkGameOver(chess);
    if (chess.inCheck() && !r) sounds.check();
    else if (flags.includes('p')) sounds.promote();
    else if (flags.includes('k') || flags.includes('q')) sounds.castle();
    else if (flags.includes('c') || flags.includes('e')) sounds.capture();
    else sounds.move();
    setLastMove({ from, to });
    setSelected(null);
    setPromo(null);
    setDrawOffer(null);
    if (r) finish(r);
    else clock.afterMove(mover);
    rerender();
  };

  // Motor de la máquina (solo modo cpu)
  useEffect(() => {
    if (twoPlayers) return;
    const engine = new Engine();
    engineRef.current = engine;
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [twoPlayers]);

  // Cuando le toca a la máquina, pide una jugada
  const cpuToMove = !twoPlayers && inProgress && !promo && turn === cpuColor;
  useEffect(() => {
    if (!cpuToMove) return;
    let cancelled = false;
    setThinking(true);
    const started = performance.now();
    const position = chess.fen();
    void (async () => {
      const engine = engineRef.current;
      let uci = engine ? await engine.bestMove(position, config.level) : null;
      if (cancelled) return;
      if (config.level === 'facil' && Math.random() < 0.4) uci = null; // el nivel fácil se despista
      const legal = chess.moves({ verbose: true });
      if (legal.length === 0) return;
      const wanted = uci;
      let move = wanted ? legal.find((m) => m.from === wanted.slice(0, 2) && m.to === wanted.slice(2, 4)) : undefined;
      if (!move) move = legal[Math.floor(Math.random() * legal.length)];
      const promotion = wanted && wanted.length > 4 ? wanted[4] : move.promotion;
      await new Promise((r) => setTimeout(r, Math.max(0, 500 - (performance.now() - started))));
      if (cancelled) return;
      setThinking(false);
      applyMove(move.from, move.to, promotion);
    })();
    return () => {
      cancelled = true;
      engineRef.current?.stop();
      setThinking(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cpuToMove, fen]);

  const grid: (BoardPiece | null)[][] = useMemo(
    () => chess.board().map((row) => row.map((p) => (p ? { type: p.type, color: p.color } : null))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fen],
  );

  const movable: Color | null = !inProgress || promo ? null : twoPlayers ? turn : turn === human && !thinking ? human : null;

  const targets: Target[] = useMemo(() => {
    if (!selected) return [];
    const map = new Map<string, Target>();
    for (const m of chess.moves({ square: selected as Square, verbose: true })) {
      map.set(m.to, { to: m.to, capture: m.flags.includes('c') || m.flags.includes('e') });
    }
    return [...map.values()];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, fen]);

  const tryMove = (from: string, to: string): boolean => {
    const m = chess.moves({ square: from as Square, verbose: true }).find((x) => x.to === to);
    if (!m) return false;
    if (m.promotion) {
      setPromo({ from, to });
      setSelected(null);
      return true;
    }
    applyMove(from, to);
    return true;
  };

  const onTap = (sq: string) => {
    if (!movable) return;
    if (selected && tryMove(selected, sq)) return;
    const p = chess.get(sq as Square);
    if (p && p.color === movable) setSelected(sq === selected ? null : sq);
    else setSelected(null);
  };

  const onDrop = (from: string, to: string) => {
    if (!movable) return;
    if (tryMove(from, to)) return;
    const p = chess.get(to as Square);
    setSelected(p && p.color === movable ? to : from);
  };

  const undo = () => {
    if (!inProgress) return;
    engineRef.current?.stop();
    setThinking(false);
    // Deshace hasta que vuelva a tocarle al humano
    if (chess.turn() === cpuColor) chess.undo();
    else {
      chess.undo();
      chess.undo();
    }
    const history = chess.history({ verbose: true });
    const last = history[history.length - 1];
    setLastMove(last ? { from: last.from, to: last.to } : null);
    setSelected(null);
    setPromo(null);
    rerender();
  };

  const resign = (c: Color) => finish({ winner: other(c), reason: 'abandono' });
  const acceptDraw = () => finish({ winner: null, reason: 'acuerdo' });

  const panelFor = (c: Color, position: 'top' | 'bottom'): PlayerPanelProps => {
    const isTurn = turn === c && inProgress;
    const isMachine = !twoPlayers && c === cpuColor;
    const clockMs = clock.enabled ? clock.time[c] : null;
    const common = {
      position,
      color: c,
      pieceSet: settings.pieces,
      rotated: twoPlayers && c === topColor,
      active: isTurn,
      check: isTurn && inCheck,
      clockMs,
    };
    if (isMachine) {
      return {
        ...common,
        title: 'Máquina',
        subtitle: `nivel ${LEVEL_NAMES[config.level].toLowerCase()}`,
        isMachine: true,
        statusText: !inProgress ? '' : thinking ? 'pensando' : 'esperando',
        message: thinking ? 'Pensando…' : 'Esperando tu jugada',
        actions: [],
        drawOffer: null,
      };
    }
    const actions: PanelAction[] = twoPlayers
      ? [
          { label: 'Rendirse', icon: <FlagIcon />, confirm: '¿Rendirse? Toca otra vez', onClick: () => resign(c), disabled: !inProgress },
          { label: 'Tablas', icon: <HalfIcon />, onClick: () => setDrawOffer(c), disabled: !inProgress || drawOffer !== null },
        ]
      : [
          { label: 'Rendirse', icon: <FlagIcon />, confirm: '¿Rendirse? Toca otra vez', onClick: () => resign(c), disabled: !inProgress },
          { label: 'Deshacer', icon: <UndoIcon />, onClick: undo, disabled: !inProgress || historyLength === 0 },
        ];
    return {
      ...common,
      title: twoPlayers ? colorName(c) : `Tú · ${colorName(c)}`,
      statusText: !inProgress ? '' : isTurn ? 'te toca' : 'esperando',
      message: isTurn ? 'Mueve una pieza' : twoPlayers ? 'Espera tu turno' : 'La máquina piensa',
      actions,
      drawOffer:
        twoPlayers && drawOffer && drawOffer !== c
          ? { from: colorName(drawOffer), onAccept: acceptDraw, onDecline: () => setDrawOffer(null) }
          : null,
    };
  };

  const confirmLeave = inProgress && historyLength > 0;

  return (
    <div className={`game${twoPlayers ? ' two' : ' cpu'}`}>
      <aside className="side left">
        <PlayerPanel {...panelFor(topColor, 'top')} />
        <div className="tc-badge">{timeControlLabel(config)}</div>
        <PlayerPanel {...panelFor(orientation, 'bottom')} />
      </aside>

      <Board
        grid={grid}
        orientation={orientation}
        theme={settings.theme}
        pieceSet={settings.pieces}
        rotateBlack={twoPlayers}
        selected={selected}
        targets={targets}
        lastMove={lastMove}
        checkSquare={inCheck ? kingSquare(chess, turn) : null}
        movableColor={movable}
        onTap={onTap}
        onDrop={onDrop}
      />

      <aside className="side right">
        <ConfirmButton className="btn square-btn" label="Menú" icon={<HomeIcon />} confirm={confirmLeave ? '¿Salir? Toca otra vez' : undefined} onClick={onExit} />
        <ConfirmButton className="btn square-btn" label="Nueva partida" icon={<RestartIcon />} confirm={confirmLeave ? '¿Reiniciar? Toca otra vez' : undefined} onClick={onRestart} />
        <button type="button" className={`btn square-btn${styleOpen ? ' on' : ''}`} aria-expanded={styleOpen} onClick={() => setStyleOpen((v) => !v)}>
          <PaletteIcon />
          <span>Estilo</span>
        </button>
        <button type="button" className="btn square-btn" aria-pressed={settings.sound} onClick={() => onSettings({ ...settings, sound: !settings.sound })}>
          <SpeakerIcon muted={!settings.sound} />
          <span>{settings.sound ? 'Sonido' : 'Silencio'}</span>
        </button>
      </aside>

      {styleOpen && (
        <div className="style-pop">
          <StylePicker settings={settings} onChange={onSettings} />
        </div>
      )}

      {promo && (
        <PromotionDialog
          color={turn}
          pieceSet={settings.pieces}
          rotated={twoPlayers && turn === topColor}
          onPick={(piece) => applyMove(promo.from, promo.to, piece)}
          onCancel={() => setPromo(null)}
        />
      )}

      {result && (
        <GameOverDialog result={result} twoPlayers={twoPlayers} pieceSet={settings.pieces} onRematch={onRematch} onMenu={onExit} />
      )}
    </div>
  );
}
