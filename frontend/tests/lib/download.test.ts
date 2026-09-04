import { descargarBlob } from '../../src/lib/download.js';

describe('descargarBlob', () => {
  const origCreate = URL.createObjectURL;
  const origRevoke = URL.revokeObjectURL;

  beforeEach(() => {
    vi.useFakeTimers();
    URL.createObjectURL = vi.fn().mockReturnValue('blob:fake');
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    URL.createObjectURL = origCreate;
    URL.revokeObjectURL = origRevoke;
  });

  it('creates a download anchor, clicks it and cleans up', () => {
    const clicks: string[] = [];
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicks.push(`${this.download}|${this.href}`);
    });

    descargarBlob(new Blob(['x'], { type: 'text/csv' }), 'tareas.csv');

    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(clicks).toEqual(['tareas.csv|blob:fake']);
    expect(document.querySelector('a')).toBeNull(); // anchor removed

    vi.runAllTimers();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake');
    clickSpy.mockRestore();
  });
});
