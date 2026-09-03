import type { JSX } from 'react';
import { API_PREFIX } from '@todo/shared';
import styles from './App.module.css';

export function App(): JSX.Element {
  return (
    <main className={styles.shell}>
      <section className={styles.card}>
        <h1 className={styles.title}>Todo App</h1>
        <p>
          Fase 0 completada. El cliente React arranca y consume el contrato compartido (
          <code>@todo/shared</code>). API base: <code>{API_PREFIX}</code>.
        </p>
      </section>
    </main>
  );
}
