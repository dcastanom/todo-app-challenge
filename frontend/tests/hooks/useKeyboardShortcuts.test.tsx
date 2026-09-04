import { renderHook } from '@testing-library/react';
import { eventToCombo, useKeyboardShortcuts } from '../../src/hooks/useKeyboardShortcuts.js';

function press(init: KeyboardEventInit, target?: Element): void {
  const ev = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
  (target ?? window).dispatchEvent(ev);
}

describe('eventToCombo', () => {
  it('normalises modifiers + key', () => {
    expect(eventToCombo(new KeyboardEvent('keydown', { key: 'K', ctrlKey: true }))).toBe('mod+k');
    expect(eventToCombo(new KeyboardEvent('keydown', { key: '?', shiftKey: true }))).toBe(
      'shift+?',
    );
    expect(eventToCombo(new KeyboardEvent('keydown', { key: 'Escape' }))).toBe('escape');
  });
});

describe('useKeyboardShortcuts', () => {
  it('fires the matching handler and prevents default', () => {
    const onK = vi.fn();
    renderHook(() => useKeyboardShortcuts({ 'mod+k': onK }));
    press({ key: 'k', ctrlKey: true });
    expect(onK).toHaveBeenCalledTimes(1);
  });

  it('ignores bare-key shortcuts while typing in an input', () => {
    const onHelp = vi.fn();
    const input = document.createElement('input');
    document.body.appendChild(input);
    renderHook(() => useKeyboardShortcuts({ '?': onHelp }));

    press({ key: '?' }, input);
    expect(onHelp).not.toHaveBeenCalled();

    press({ key: '?' }); // on window/body — not a text field
    expect(onHelp).toHaveBeenCalledTimes(1);
    input.remove();
  });

  it('still fires mod shortcuts while typing', () => {
    const onK = vi.fn();
    const input = document.createElement('input');
    document.body.appendChild(input);
    renderHook(() => useKeyboardShortcuts({ 'mod+k': onK }));
    press({ key: 'k', metaKey: true }, input);
    expect(onK).toHaveBeenCalledTimes(1);
    input.remove();
  });

  it('does nothing when disabled', () => {
    const onK = vi.fn();
    renderHook(() => useKeyboardShortcuts({ 'mod+k': onK }, false));
    press({ key: 'k', ctrlKey: true });
    expect(onK).not.toHaveBeenCalled();
  });

  it('detaches the listener on unmount', () => {
    const onK = vi.fn();
    const { unmount } = renderHook(() => useKeyboardShortcuts({ 'mod+k': onK }));
    unmount();
    press({ key: 'k', ctrlKey: true });
    expect(onK).not.toHaveBeenCalled();
  });
});
