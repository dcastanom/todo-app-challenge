import { lazy, Suspense, type JSX } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/auth/ProtectedRoute.js';
import { Spinner } from './components/common/Spinner.js';
import { AuthProvider } from './context/AuthProvider.js';
import { ThemeProvider } from './context/ThemeProvider.js';

// Route-level code splitting — each page is its own chunk.
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage.js').then((m) => ({ default: m.DashboardPage })),
);
const LoginPage = lazy(() =>
  import('./pages/LoginPage.js').then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = lazy(() =>
  import('./pages/RegisterPage.js').then((m) => ({ default: m.RegisterPage })),
);

export function App(): JSX.Element {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<Spinner label="Cargando…" />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<DashboardPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
