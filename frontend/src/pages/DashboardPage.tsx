import { useNavigate } from 'react-router-dom';
import { CategoryManager } from '../components/categorias/CategoryManager.js';
import { TagManager } from '../components/etiquetas/TagManager.js';
import { TodoList } from '../components/tareas/TodoList.js';
import { useAuth } from '../hooks/useAuth.js';
import { useCategorias } from '../hooks/useCategorias.js';
import { useEtiquetas } from '../hooks/useEtiquetas.js';
import { useTodos } from '../hooks/useTodos.js';
import styles from './DashboardPage.module.css';

export function DashboardPage(): React.JSX.Element {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const todos = useTodos();
  const refreshTodos = (): void => void todos.refresh();
  const categorias = useCategorias(refreshTodos);
  const etiquetas = useEtiquetas(refreshTodos);

  const handleLogout = (): void => {
    void logout().finally(() => navigate('/login', { replace: true }));
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Mis tareas</h1>
        <div className={styles.user}>
          <span>{user?.nombreCompleto ?? user?.username}</span>
          <button type="button" onClick={handleLogout}>
            Salir
          </button>
        </div>
      </header>

      <div className={styles.layout}>
        <main className={styles.main}>
          <TodoList todos={todos} categorias={categorias.items} etiquetas={etiquetas.items} />
        </main>
        <aside className={styles.aside}>
          <CategoryManager coleccion={categorias} />
          <TagManager coleccion={etiquetas} />
        </aside>
      </div>
    </div>
  );
}
