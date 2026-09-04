import { render, screen } from '@testing-library/react';
import { StatCard } from '../../../src/components/estadisticas/StatCard.js';

describe('<StatCard />', () => {
  it('renders the label and value', () => {
    render(<StatCard label="Total" value={7} />);
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('accepts a string value', () => {
    render(<StatCard label="Tasa" value="42%" />);
    expect(screen.getByText('42%')).toBeInTheDocument();
  });
});
