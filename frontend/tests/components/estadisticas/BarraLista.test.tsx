import { render, screen } from '@testing-library/react';
import { BarraLista } from '../../../src/components/estadisticas/BarraLista.js';

describe('<BarraLista />', () => {
  it('shows the empty state when there are no items', () => {
    render(<BarraLista items={[]} vacio="Nada por aquí" />);
    expect(screen.getByText('Nada por aquí')).toBeInTheDocument();
  });

  it('renders one row per item with counts and percentage', () => {
    render(
      <BarraLista
        vacio="—"
        items={[
          { key: 'alta', label: 'Alta', total: 4, completadas: 2 },
          { key: 'baja', label: 'Baja', total: 0, completadas: 0 },
        ]}
      />,
    );

    expect(screen.getByText('Alta')).toBeInTheDocument();
    expect(screen.getByText('2/4 · 50%')).toBeInTheDocument();
    expect(screen.getByText('0/0 · 0%')).toBeInTheDocument();
  });

  it('exposes an accessible label describing each bar', () => {
    render(
      <BarraLista
        vacio="—"
        items={[{ key: 'trabajo', label: 'Trabajo', total: 5, completadas: 5, color: '#336699' }]}
      />,
    );
    expect(
      screen.getByRole('img', { name: 'Trabajo: 5 tareas, 100% completadas' }),
    ).toBeInTheDocument();
  });
});
