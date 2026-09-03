import { useEffect, useRef, useState } from 'react';
import styles from './SearchBar.module.css';

export interface SearchBarProps {
  value: string;
  onChange: (query: string) => void;
  delay?: number;
}

/** Debounced search box. Emits `onChange` `delay` ms after the last keystroke. */
export function SearchBar({ value, onChange, delay = 300 }: SearchBarProps): React.JSX.Element {
  const [local, setLocal] = useState(value);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Reflect external resets (e.g. "clear filters").
  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(() => {
    if (local === value) return;
    const t = setTimeout(() => onChangeRef.current(local), delay);
    return () => clearTimeout(t);
  }, [local, value, delay]);

  return (
    <div className={styles.wrap}>
      <input
        type="search"
        className={styles.input}
        placeholder="Buscar tareas…"
        aria-label="Buscar tareas"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
      />
    </div>
  );
}
