import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { PRIORIDADES, type CrearTareaInput, type Prioridad, type TareaDTO } from '@todo/shared';
import { HttpError } from '../../services/http.js';
import styles from './TodoForm.module.css';

const formSchema = z.object({
  titulo: z.string().trim().min(1, 'El título es obligatorio').max(255),
  descripcion: z.string().trim().max(5000),
  prioridad: z.enum(PRIORIDADES),
  fechaLocal: z.string(),
});
type FormValues = z.infer<typeof formSchema>;

const PRIORIDAD_LABEL: Record<Prioridad, string> = {
  baja: 'Baja',
  normal: 'Normal',
  alta: 'Alta',
  urgente: 'Urgente',
};

/** ISO string → value for <input type="datetime-local"> (local time, no tz). */
function isoToLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${String(d.getFullYear())}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export interface TodoFormProps {
  initial?: TareaDTO;
  onSubmit: (input: CrearTareaInput) => Promise<void>;
  onCancel: () => void;
}

export function TodoForm({ initial, onSubmit, onCancel }: TodoFormProps): React.JSX.Element {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titulo: initial?.titulo ?? '',
      descripcion: initial?.descripcion ?? '',
      prioridad: initial?.prioridad ?? 'normal',
      fechaLocal: isoToLocalInput(initial?.fechaVencimiento ?? null),
    },
  });

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit({
        titulo: values.titulo,
        descripcion: values.descripcion ? values.descripcion : null,
        prioridad: values.prioridad,
        fechaVencimiento: values.fechaLocal ? new Date(values.fechaLocal).toISOString() : null,
        categoriaId: initial?.categoriaId ?? null,
      });
    } catch (err) {
      setError('root', {
        message: err instanceof HttpError ? err.message : 'No se pudo guardar la tarea',
      });
    }
  });

  return (
    <form
      className={styles.form}
      onSubmit={(e) => void submit(e)}
      aria-label={initial ? 'Editar tarea' : 'Nueva tarea'}
      noValidate
    >
      {errors.root && (
        <p className={styles.formError} role="alert">
          {errors.root.message}
        </p>
      )}

      <label className={styles.field}>
        <span>Título</span>
        <input {...register('titulo')} aria-invalid={errors.titulo ? 'true' : 'false'} autoFocus />
        {errors.titulo && <span className={styles.fieldError}>{errors.titulo.message}</span>}
      </label>

      <label className={styles.field}>
        <span>Descripción</span>
        <textarea rows={3} {...register('descripcion')} />
      </label>

      <div className={styles.row}>
        <label className={styles.field}>
          <span>Prioridad</span>
          <select {...register('prioridad')}>
            {PRIORIDADES.map((p) => (
              <option key={p} value={p}>
                {PRIORIDAD_LABEL[p]}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span>Vence</span>
          <input type="datetime-local" {...register('fechaLocal')} />
        </label>
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.secondary} onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className={styles.primary} disabled={isSubmitting}>
          {isSubmitting ? 'Guardando…' : initial ? 'Guardar' : 'Crear tarea'}
        </button>
      </div>
    </form>
  );
}
