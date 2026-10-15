import { pieceUrl, type PieceSetId } from '../themes';
import type { Color, GameResult, ResultReason } from '../types';

const TITLES: Record<ResultReason, string> = {
  mate: '¡Jaque mate!',
  ahogado: 'Rey ahogado',
  material: 'Material insuficiente',
  repeticion: 'Triple repetición',
  cincuenta: 'Regla de las 50 jugadas',
  tiempo: 'Se acabó el tiempo',
  abandono: 'Abandono',
  acuerdo: 'Tablas acordadas',
};

interface GameOverProps {
  result: GameResult;
  twoPlayers: boolean;
  pieceSet: PieceSetId;
  onRematch: () => void;
  onMenu: () => void;
}

export function GameOverDialog({ result, twoPlayers, pieceSet, onRematch, onMenu }: GameOverProps) {
  const title = TITLES[result.reason];
  const subtitle = result.winner ? `Ganan las ${result.winner === 'w' ? 'blancas' : 'negras'}` : 'Tablas';
  return (
    <div className="overlay" role="dialog" aria-label={title}>
      <div className="card">
        {twoPlayers && (
          <div className="mirror" aria-hidden="true">
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
        )}
        <div className="winner-icon">
          {result.winner ? <img src={pieceUrl(pieceSet, result.winner, 'k')} alt="" /> : <span>½</span>}
        </div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
        <button type="button" className="btn primary" onClick={onRematch}>
          Revancha
        </button>
        <button type="button" className="btn" onClick={onMenu}>
          Volver al menú
        </button>
      </div>
    </div>
  );
}

interface PromotionProps {
  color: Color;
  pieceSet: PieceSetId;
  rotated: boolean;
  onPick: (piece: 'q' | 'r' | 'b' | 'n') => void;
  onCancel: () => void;
}

const PROMOTIONS: { type: 'q' | 'r' | 'b' | 'n'; name: string }[] = [
  { type: 'q', name: 'Dama' },
  { type: 'r', name: 'Torre' },
  { type: 'b', name: 'Alfil' },
  { type: 'n', name: 'Caballo' },
];

export function PromotionDialog({ color, pieceSet, rotated, onPick, onCancel }: PromotionProps) {
  return (
    <div className="overlay" role="dialog" aria-label="Corona tu peón">
      <div className={`card${rotated ? ' rotated' : ''}`}>
        <h2>Corona tu peón</h2>
        <p>Toca la pieza que quieres</p>
        <div className="promo">
          {PROMOTIONS.map((p) => (
            <button key={p.type} type="button" onClick={() => onPick(p.type)} aria-label={`Coronar a ${p.name.toLowerCase()}`}>
              <img src={pieceUrl(pieceSet, color, p.type)} alt="" />
              {p.name}
            </button>
          ))}
        </div>
        <button type="button" className="btn" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
