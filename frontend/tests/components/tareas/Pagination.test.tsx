import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { Pagination } from '../../../src/components/tareas/Pagination.js';

describe('<Pagination />', () => {
  it('renders nothing with a single page', () => {
    const { container } = render(
      <Pagination page={1} totalPages={1} total={5} onPageChange={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the current position and total', () => {
    render(<Pagination page={2} totalPages={4} total={73} onPageChange={vi.fn()} />);
    expect(screen.getByText(/página 2 de 4/i)).toHaveTextContent('73 tareas');
  });

  it('disables prev on the first page and next on the last', () => {
    const { rerender } = render(
      <Pagination page={1} totalPages={3} total={50} onPageChange={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: /anterior/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /siguiente/i })).toBeEnabled();

    rerender(<Pagination page={3} totalPages={3} total={50} onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /anterior/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /siguiente/i })).toBeDisabled();
  });

  it('moves between pages', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination page={2} totalPages={3} total={50} onPageChange={onPageChange} />);

    await user.click(screen.getByRole('button', { name: /siguiente/i }));
    await user.click(screen.getByRole('button', { name: /anterior/i }));
    expect(onPageChange).toHaveBeenNthCalledWith(1, 3);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 1);
  });
});
