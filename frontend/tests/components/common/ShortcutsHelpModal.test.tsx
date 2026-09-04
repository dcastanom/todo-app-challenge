import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShortcutsHelpModal } from '../../../src/components/common/ShortcutsHelpModal.js';

describe('<ShortcutsHelpModal />', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<ShortcutsHelpModal open={false} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('lists the shortcuts and closes on the button', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ShortcutsHelpModal open onClose={onClose} />);

    expect(screen.getByRole('dialog', { name: /atajos de teclado/i })).toBeInTheDocument();
    expect(screen.getByText(/nueva tarea/i)).toBeInTheDocument();
    expect(screen.getByText(/modo oscuro/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /cerrar/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('closes when the overlay is clicked but not the modal body', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ShortcutsHelpModal open onClose={onClose} />);

    await user.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
  });
});
