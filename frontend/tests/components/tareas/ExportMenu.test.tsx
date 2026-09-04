import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExportMenu } from '../../../src/components/tareas/ExportMenu.js';

const api = vi.hoisted(() => ({ exportar: vi.fn() }));
vi.mock('../../../src/services/tareas.service.js', () => ({ tareasApi: api }));

const download = vi.hoisted(() => ({ descargarBlob: vi.fn() }));
vi.mock('../../../src/lib/download.js', () => download);

beforeEach(() => {
  vi.clearAllMocks();
  api.exportar.mockResolvedValue({ blob: new Blob(['x']), filename: 'tareas-2026-01-01.csv' });
});

describe('<ExportMenu />', () => {
  it('exports CSV with the active filters and triggers the download', async () => {
    const user = userEvent.setup();
    render(<ExportMenu filtros={{ prioridad: 'alta' }} />);

    await user.click(screen.getByRole('button', { name: 'CSV' }));

    await waitFor(() => expect(download.descargarBlob).toHaveBeenCalled());
    expect(api.exportar).toHaveBeenCalledWith('csv', { prioridad: 'alta' });
    expect(download.descargarBlob).toHaveBeenCalledWith(expect.any(Blob), 'tareas-2026-01-01.csv');
  });

  it('exports JSON', async () => {
    const user = userEvent.setup();
    render(<ExportMenu filtros={{}} />);
    await user.click(screen.getByRole('button', { name: 'JSON' }));
    await waitFor(() => expect(api.exportar).toHaveBeenCalledWith('json', {}));
  });

  it('shows an error when the export fails', async () => {
    const user = userEvent.setup();
    api.exportar.mockRejectedValue(new Error('boom'));
    render(<ExportMenu filtros={{}} />);
    await user.click(screen.getByRole('button', { name: 'CSV' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/no se pudo exportar/i);
  });
});
