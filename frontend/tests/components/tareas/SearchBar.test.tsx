import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';
import { SearchBar } from '../../../src/components/tareas/SearchBar.js';

describe('<SearchBar />', () => {
  it('debounces and emits the final value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} delay={50} />);

    await user.type(screen.getByRole('searchbox'), 'informe');

    expect(onChange).not.toHaveBeenCalledWith('inform');
    await waitFor(() => expect(onChange).toHaveBeenCalledWith('informe'));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('reflects an external reset', () => {
    const { rerender } = render(<SearchBar value="algo" onChange={vi.fn()} />);
    expect(screen.getByRole('searchbox')).toHaveValue('algo');
    rerender(<SearchBar value="" onChange={vi.fn()} />);
    expect(screen.getByRole('searchbox')).toHaveValue('');
  });
});
