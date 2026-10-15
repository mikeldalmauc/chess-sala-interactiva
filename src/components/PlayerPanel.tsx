import type { ReactNode } from 'react';
import { pieceUrl, type PieceSetId } from '../themes';
import type { Color } from '../types';
import { ConfirmButton } from './ConfirmButton';
import { RobotIcon } from './Icons';

export interface PanelAction {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  confirm?: string;
  disabled?: boolean;
}

export interface DrawOffer {
  from: string;
  onAccept: () => void;
  onDecline: () => void;
}

export interface PlayerPanelProps {
  position: 'top' | 'bottom';
  color: Color;
  pieceSet: PieceSetId;
  title: string;
  subtitle?: string;
  isMachine?: boolean;
  /** Girado 180° para el jugador sentado al otro lado de la mesa. */
  rotated?: boolean;
  active: boolean;
  check?: boolean;
  statusText: string;
  /** null = sin reloj: se muestra un mensaje en su lugar. */
  clockMs: number | null;
  message: string;
  actions: PanelAction[];
  drawOffer: DrawOffer | null;
}

function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function PlayerPanel(p: PlayerPanelProps) {
  const low = p.clockMs !== null && p.clockMs < 20_000;
  return (
    <section className={`panel panel-${p.position}${p.rotated ? ' rotated' : ''}`} aria-label={p.title}>
      <div className="panel-head">
        {p.isMachine ? (
          <span className="avatar">
            <RobotIcon />
          </span>
        ) : (
          <img src={pieceUrl(p.pieceSet, p.color, 'k')} alt="" />
        )}
        <span className="name">{p.title}</span>
        {p.subtitle && <span className="sub">{p.subtitle}</span>}
        {p.check && <span className="badge">¡Jaque!</span>}
        <span className="status">
          {p.active && <span className="dot" />}
          {p.statusText}
        </span>
      </div>

      {p.clockMs !== null ? (
        <div className={`clock${p.active ? ' active' : ''}${low ? ' low' : ''}`}>{formatClock(p.clockMs)}</div>
      ) : (
        <div className={`message${p.active ? ' active' : ''}`}>{p.message}</div>
      )}

      {p.drawOffer ? (
        <div className="draw-offer">
          <span>{p.drawOffer.from} ofrecen tablas</span>
          <div className="actions">
            <button type="button" className="btn primary" onClick={p.drawOffer.onAccept}>
              Aceptar
            </button>
            <button type="button" className="btn" onClick={p.drawOffer.onDecline}>
              Rechazar
            </button>
          </div>
        </div>
      ) : p.actions.length > 0 ? (
        <div className="actions">
          {p.actions.map((a) => (
            <ConfirmButton key={a.label} className="btn" {...a} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
