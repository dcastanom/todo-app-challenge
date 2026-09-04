import { useEffect, useRef } from 'react';
import styles from './ShortcutsHelpModal.module.css';

const IS_MAC =
  typeof navigator !== 'undefined' && /mac|iphone|ipad|ipod/i.test(navigator.userAgent);
const MOD = IS_MAC ? '⌘' : 'Ctrl';

const SHORTCUTS: { keys: string; desc: string }[] = [
  { keys: `${MOD} + K`, desc: 'Buscar tareas' },
  { keys: 'N', desc: 'Nueva tarea' },
  { keys: `${MOD} + D`, desc: 'Alternar modo oscuro' },
  { keys: '?', desc: 'Mostrar esta ayuda' },
  { keys: 'Esc', desc: 'Cerrar formulario o diálogo' },
];

export interface ShortcutsHelpModalProps {
  open: boolean;
  onClose: () => void;
}

export function ShortcutsHelpModal({
  open,
  onClose,
}: ShortcutsHelpModalProps): React.JSX.Element | null {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="shortcuts-title" className={styles.title}>
          Atajos de teclado
        </h2>
        <dl className={styles.list}>
          {SHORTCUTS.map((s) => (
            <div key={s.keys} className={styles.row}>
              <dt>
                <kbd className={styles.kbd}>{s.keys}</kbd>
              </dt>
              <dd>{s.desc}</dd>
            </div>
          ))}
        </dl>
        <button ref={closeRef} type="button" className={styles.close} onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
}
