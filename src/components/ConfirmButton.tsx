import { useEffect, useState, type ReactNode } from 'react';

interface Props {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  /** Si se indica, el primer toque muestra este texto y el segundo ejecuta la acción. */
  confirm?: string;
  disabled?: boolean;
  className?: string;
}

/** Botón con confirmación en dos toques: evita abandonos o reinicios por un roce en la mesa. */
export function ConfirmButton({ label, icon, onClick, confirm, disabled, className = 'btn' }: Props) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const id = window.setTimeout(() => setArmed(false), 3000);
    return () => window.clearTimeout(id);
  }, [armed]);

  const handleClick = () => {
    if (confirm && !armed) {
      setArmed(true);
      return;
    }
    setArmed(false);
    onClick();
  };

  return (
    <button type="button" className={`${className}${armed ? ' armed' : ''}`} onClick={handleClick} disabled={disabled}>
      {armed ? (
        <span>{confirm}</span>
      ) : (
        <>
          {icon}
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
