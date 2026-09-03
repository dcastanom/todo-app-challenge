import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { registerSchema, type RegisterInput } from '@todo/shared';
import { useAuth } from '../../hooks/useAuth.js';
import styles from './AuthForm.module.css';

export function RegisterForm({ onSuccess }: { onSuccess?: () => void }): React.JSX.Element {
  const { register: registerUser, error, clearError } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = handleSubmit(async (values) => {
    clearError();
    try {
      await registerUser(values);
      onSuccess?.();
    } catch {
      /* error surfaced via useAuth().error */
    }
  });

  return (
    <form
      className={styles.form}
      onSubmit={(e) => void onSubmit(e)}
      noValidate
      aria-label="Crear cuenta"
    >
      {error && (
        <p className={styles.formError} role="alert">
          {error}
        </p>
      )}

      <div className={styles.field}>
        <label htmlFor="reg-username">Usuario</label>
        <input
          id="reg-username"
          autoComplete="username"
          aria-invalid={errors.username ? 'true' : 'false'}
          {...register('username')}
        />
        {errors.username && <span className={styles.fieldError}>{errors.username.message}</span>}
      </div>

      <div className={styles.field}>
        <label htmlFor="reg-email">Email</label>
        <input
          id="reg-email"
          type="email"
          autoComplete="email"
          aria-invalid={errors.email ? 'true' : 'false'}
          {...register('email')}
        />
        {errors.email && <span className={styles.fieldError}>{errors.email.message}</span>}
      </div>

      <div className={styles.field}>
        <label htmlFor="reg-nombre">Nombre completo (opcional)</label>
        <input
          id="reg-nombre"
          autoComplete="name"
          aria-invalid={errors.nombreCompleto ? 'true' : 'false'}
          {...register('nombreCompleto')}
        />
        {errors.nombreCompleto && (
          <span className={styles.fieldError}>{errors.nombreCompleto.message}</span>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="reg-password">Contraseña</label>
        <input
          id="reg-password"
          type="password"
          autoComplete="new-password"
          aria-invalid={errors.password ? 'true' : 'false'}
          {...register('password')}
        />
        {errors.password && <span className={styles.fieldError}>{errors.password.message}</span>}
      </div>

      <button className={styles.submit} type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creando…' : 'Crear cuenta'}
      </button>
    </form>
  );
}
