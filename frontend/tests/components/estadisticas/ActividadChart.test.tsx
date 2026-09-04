import { render, screen } from '@testing-library/react';
import { ActividadChart } from '../../../src/components/estadisticas/ActividadChart.js';

describe('<ActividadChart />', () => {
  it('renders nothing when there is no activity data', () => {
    const { container } = render(<ActividadChart actividad={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders one column per day with an accessible summary', () => {
    render(
      <ActividadChart
        actividad={[
          { fecha: '2026-01-01', creadas: 2, completadas: 1 },
          { fecha: '2026-01-02', creadas: 0, completadas: 3 },
        ]}
      />,
    );
    expect(
      screen.getByRole('img', { name: 'Tareas creadas y completadas por día, últimos 2 días' }),
    ).toBeInTheDocument();
    expect(screen.getByText('01-01')).toBeInTheDocument();
    expect(screen.getByText('01-02')).toBeInTheDocument();
    expect(screen.getByText('Creadas')).toBeInTheDocument();
    expect(screen.getByText('Completadas')).toBeInTheDocument();
  });
});
