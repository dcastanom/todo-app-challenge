import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../../../src/components/auth/ProtectedRoute.js';
import { renderWithAuth } from '../../test-utils.js';

function tree() {
  return (
    <Routes>
      <Route path="/login" element={<div>login page</div>} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<div>secret dashboard</div>} />
      </Route>
    </Routes>
  );
}

describe('<ProtectedRoute />', () => {
  it('renders the nested route when authenticated', () => {
    renderWithAuth(tree(), { auth: { status: 'authenticated', isAuthenticated: true } });
    expect(screen.getByText('secret dashboard')).toBeInTheDocument();
  });

  it('redirects to /login when unauthenticated', () => {
    renderWithAuth(tree(), { auth: { status: 'unauthenticated' } });
    expect(screen.getByText('login page')).toBeInTheDocument();
  });

  it('shows a spinner while the session is loading', () => {
    renderWithAuth(tree(), { auth: { status: 'loading' } });
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('secret dashboard')).not.toBeInTheDocument();
  });
});
