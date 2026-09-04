import { act, render, screen } from '@testing-library/react';
import { OfflineIndicator } from '../../../src/components/common/OfflineIndicator.js';

describe('<OfflineIndicator />', () => {
  let online = true;

  beforeEach(() => {
    online = true;
    vi.spyOn(navigator, 'onLine', 'get').mockImplementation(() => online);
  });

  it('renders nothing while online', () => {
    const { container } = render(<OfflineIndicator />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows a status banner when the connection drops', () => {
    render(<OfflineIndicator />);
    act(() => {
      online = false;
      window.dispatchEvent(new Event('offline'));
    });
    expect(screen.getByRole('status')).toHaveTextContent(/sin conexión/i);
  });
});
