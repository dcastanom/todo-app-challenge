import { Link, Navigate, useNavigate } from 'react-router-dom';
import { RegisterForm } from '../components/auth/RegisterForm.js';
import { useAuth } from '../hooks/useAuth.js';
import { AuthLayout } from './AuthLayout.js';

export function RegisterPage(): React.JSX.Element {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) return <Navigate to="/" replace />;

  return (
    <AuthLayout
      title="Crear cuenta"
      footer={
        <>
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </>
      }
    >
      <RegisterForm
        onSuccess={() => {
          void navigate('/', { replace: true });
        }}
      />
    </AuthLayout>
  );
}
