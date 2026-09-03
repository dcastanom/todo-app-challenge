import { useNavigate } from 'react-router-dom';
import { TodoList } from '../components/tareas/TodoList.js';
import { useAuth } from '../hooks/useAuth.js';
import styles from './DashboardPage.module.css';

export function DashboardPage(): React.JSX.Element {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = (): void => {
    void logout().finally(() => navigate('/login', { replace: true }));
  };

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <h1 className={styles.title}>Mis tareas</h1>
        <div className={styles.user}>
          <span>{user?.nombreCompleto ?? user?.username}</span>
          <button type="button" onClick={handleLogout}>
            Salir
          </button>
        </div>
      </header>
      <TodoList />
    </main>
  );
}
