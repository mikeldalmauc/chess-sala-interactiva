import { useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { THEMES, pieceUrl, type PieceSetId, type ThemeId } from '../themes';
import type { Color } from '../types';

export interface BoardPiece {
  type: string;
  color: Color;
}

export interface Target {
  to: string;
  capture: boolean;
}

interface Props {
  /** 8 filas (de la 8 a la 1) por 8 columnas (de la a a la h). */
  grid: (BoardPiece | null)[][];
  orientation: Color;
  theme: ThemeId;
  pieceSet: PieceSetId;
  /** Gira las piezas negras 180° para el jugador sentado enfrente. */
  rotateBlack?: boolean;
  coords?: boolean;
  selected?: string | null;
  targets?: Target[];
  lastMove?: { from: string; to: string } | null;
  checkSquare?: string | null;
  /** Color cuyas piezas se pueden tocar y arrastrar. */
  movableColor?: Color | null;
  onTap?: (square: string) => void;
  onDrop?: (from: string, to: string) => void;
}

interface Drag {
  from: string;
  piece: BoardPiece;
  x: number;
  y: number;
}

const FILES = 'abcdefgh';
const ROWS = [7, 6, 5, 4, 3, 2, 1, 0]; // índice de fila: 0 = fila 1
const COLS = [0, 1, 2, 3, 4, 5, 6, 7];

export function Board({
  grid,
  orientation,
  theme,
  pieceSet,
  rotateBlack = false,
  coords = true,
  selected = null,
  targets = [],
  lastMove = null,
  checkSquare = null,
  movableColor = null,
  onTap,
  onDrop,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const colors = THEMES[theme];
  const rows = orientation === 'w' ? ROWS : [...ROWS].reverse();
  const cols = orientation === 'w' ? COLS : [...COLS].reverse();

  const pieceAt = (sq: string): BoardPiece | null => grid[7 - (Number(sq[1]) - 1)][FILES.indexOf(sq[0])];

  const relative = (e: PointerEvent<HTMLDivElement>) => {
    const r = ref.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const squareAt = (e: PointerEvent<HTMLDivElement>): string | null => {
    const el = ref.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    if (x < 0 || y < 0 || x >= r.width || y >= r.height) return null;
    const col = Math.floor((x / r.width) * 8);
    const row = Math.floor((y / r.height) * 8);
    const file = orientation === 'w' ? col : 7 - col;
    const rank = orientation === 'w' ? 7 - row : row;
    return FILES[file] + String(rank + 1);
  };

  const handleDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const sq = squareAt(e);
    if (!sq) return;
    const piece = pieceAt(sq);
    onTap?.(sq);
    if (piece && movableColor && piece.color === movableColor) {
      ref.current?.setPointerCapture(e.pointerId);
      setDrag({ from: sq, piece, ...relative(e) });
    }
  };

  const handleMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    setDrag({ ...drag, ...relative(e) });
  };

  const handleUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    const to = squareAt(e);
    const from = drag.from;
    setDrag(null);
    if (to && to !== from) onDrop?.(from, to);
  };

  const targetMap = new Map(targets.map((t) => [t.to, t]));
  const style = { '--light': colors.light, '--dark': colors.dark } as CSSProperties;

  return (
    <div
      ref={ref}
      className="board"
      style={style}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerCancel={() => setDrag(null)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {rows.map((rank, ri) =>
        cols.map((file, ci) => {
          const sq = FILES[file] + String(rank + 1);
          const piece = grid[7 - rank][file];
          const light = (rank + file) % 2 === 1;
          const target = targetMap.get(sq);
          const classes = [
            'sq',
            light ? 'light' : 'dark',
            selected === sq ? 'selected' : '',
            lastMove && (lastMove.from === sq || lastMove.to === sq) ? 'last' : '',
            checkSquare === sq ? 'check' : '',
            target ? (target.capture ? 'ring' : 'dot') : '',
          ]
            .filter(Boolean)
            .join(' ');
          const hidden = drag !== null && drag.from === sq;
          return (
            <div key={sq} className={classes} data-square={sq}>
              {coords && ci === 0 && <span className="coord rank">{rank + 1}</span>}
              {coords && ri === 7 && <span className="coord file">{FILES[file]}</span>}
              {piece && !hidden && (
                <img
                  className={rotateBlack && piece.color === 'b' ? 'piece rotated' : 'piece'}
                  src={pieceUrl(pieceSet, piece.color, piece.type)}
                  alt=""
                  draggable={false}
                />
              )}
            </div>
          );
        }),
      )}
      {drag && (
        <img
          className="piece dragging"
          style={{ left: drag.x, top: drag.y }}
          src={pieceUrl(pieceSet, drag.piece.color, drag.piece.type)}
          alt=""
          draggable={false}
        />
      )}
    </div>
  );
}
