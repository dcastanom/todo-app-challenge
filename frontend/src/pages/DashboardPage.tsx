import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CategoryManager } from '../components/categorias/CategoryManager.js';
import { OfflineIndicator } from '../components/common/OfflineIndicator.js';
import { ShortcutsHelpModal } from '../components/common/ShortcutsHelpModal.js';
import { ThemeToggle } from '../components/common/ThemeToggle.js';
import { TagManager } from '../components/etiquetas/TagManager.js';
import { TodoList } from '../components/tareas/TodoList.js';
import { useAuth } from '../hooks/useAuth.js';
import { useCategorias } from '../hooks/useCategorias.js';
import { useEtiquetas } from '../hooks/useEtiquetas.js';
import { useFilters } from '../hooks/useFilters.js';
import { useKeyboardShortcuts, type ShortcutMap } from '../hooks/useKeyboardShortcuts.js';
import { useSeleccion } from '../hooks/useSeleccion.js';
import { useTheme } from '../hooks/useTheme.js';
import { useTodos } from '../hooks/useTodos.js';
import styles from './DashboardPage.module.css';

export function DashboardPage(): React.JSX.Element {
  const { user, logout } = useAuth();
  const { toggle: toggleTheme } = useTheme();
  const navigate = useNavigate();

  const filters = useFilters();
  const todos = useTodos(filters.filtros);
  const refreshTodos = (): void => void todos.refresh();
  const categorias = useCategorias(refreshTodos);
  const etiquetas = useEtiquetas(refreshTodos);
  const seleccion = useSeleccion();

  const searchRef = useRef<HTMLInputElement>(null);
  const [nuevaSignal, setNuevaSignal] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);

  const handleLogout = (): void => {
    void logout().finally(() => navigate('/login', { replace: true }));
  };

  const shortcuts = useMemo<ShortcutMap>(
    () => ({
      'mod+k': () => searchRef.current?.focus(),
      'mod+n': () => setNuevaSignal((n) => n + 1),
      'mod+d': () => toggleTheme(),
      'shift+?': () => setHelpOpen(true),
      '?': () => setHelpOpen(true),
      escape: () => setHelpOpen(false),
    }),
    [toggleTheme],
  );
  useKeyboardShortcuts(shortcuts);

  return (
    <div>
      <OfflineIndicator />
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>Mis tareas</h1>
          <div className={styles.user}>
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              aria-label="Atajos de teclado"
              title="Atajos de teclado (?)"
            >
              ?
            </button>
            <span>{user?.nombreCompleto ?? user?.username}</span>
            <button type="button" onClick={handleLogout}>
              Salir
            </button>
          </div>
        </header>

        <div className={styles.layout}>
          <main className={styles.main}>
            <TodoList
              todos={todos}
              filters={filters}
              seleccion={seleccion}
              categorias={categorias.items}
              etiquetas={etiquetas.items}
              nuevaSignal={nuevaSignal}
              searchInputRef={searchRef}
            />
          </main>
          <aside className={styles.aside}>
            <CategoryManager coleccion={categorias} />
            <TagManager coleccion={etiquetas} />
          </aside>
        </div>
      </div>

      <ShortcutsHelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
