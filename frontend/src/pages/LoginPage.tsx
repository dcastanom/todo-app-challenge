import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm.js';
import { useAuth } from '../hooks/useAuth.js';
import { AuthLayout } from './AuthLayout.js';

export function LoginPage(): React.JSX.Element {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  if (isAuthenticated) return <Navigate to={from} replace />;

  return (
    <AuthLayout
      title="Iniciar sesión"
      footer={
        <>
          ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
        </>
      }
    >
      <LoginForm
        onSuccess={() => {
          void navigate(from, { replace: true });
        }}
      />
    </AuthLayout>
  );
}
