import type { ReactNode } from 'react';
import styles from './AuthLayout.module.css';

export function AuthLayout({
  title,
  children,
  footer,
}: {
  title: string;
  children: ReactNode;
  footer: ReactNode;
}): React.JSX.Element {
  return (
    <main className={styles.shell}>
      <section className={styles.card}>
        <h1 className={styles.title}>{title}</h1>
        {children}
        <p className={styles.footer}>{footer}</p>
      </section>
    </main>
  );
}
