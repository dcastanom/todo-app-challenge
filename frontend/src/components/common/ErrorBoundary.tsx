import { Component, type ErrorInfo, type ReactNode } from 'react';
import styles from './ErrorBoundary.module.css';

interface Props {
  children: ReactNode;
  /** Optional custom fallback; receives the error and a reset callback. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  error: Error | null;
}

/** Catches render/lifecycle errors in the subtree and shows a recovery UI. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  private reset = (): void => this.setState({ error: null });

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback(error, this.reset);

    return (
      <div className={styles.wrap} role="alert">
        <h1 className={styles.title}>Algo salió mal</h1>
        <p className={styles.message}>{error.message || 'Error inesperado'}</p>
        <div className={styles.actions}>
          <button type="button" onClick={this.reset}>
            Reintentar
          </button>
          <button type="button" onClick={() => window.location.assign('/')}>
            Ir al inicio
          </button>
        </div>
      </div>
    );
  }
}
