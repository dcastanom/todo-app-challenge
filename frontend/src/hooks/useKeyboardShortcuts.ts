import { useEffect } from 'react';

export interface ShortcutContext {
  /** True when the event originated from a text field / contenteditable. */
  typing: boolean;
  event: KeyboardEvent;
}

/**
 * A shortcut key is `"mod+k"` (mod = Cmd on macOS, Ctrl elsewhere),
 * `"shift+?"`, or a bare `"escape"`. Handlers that return nothing and match
 * get `preventDefault()`. Shortcuts requiring `mod` still fire while typing;
 * bare-key shortcuts (except Escape) are suppressed in text fields.
 */
export type ShortcutMap = Record<string, (ctx: ShortcutContext) => void>;

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

/** Normalises a KeyboardEvent to the same token format as the map keys. */
export function eventToCombo(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push('mod');
  if (e.shiftKey) parts.push('shift');
  if (e.altKey) parts.push('alt');
  const key = e.key.toLowerCase();
  if (!['control', 'meta', 'shift', 'alt'].includes(key)) parts.push(key);
  return parts.join('+');
}

export function useKeyboardShortcuts(shortcuts: ShortcutMap, enabled = true): void {
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e: KeyboardEvent): void => {
      const combo = eventToCombo(e);
      const handler = shortcuts[combo];
      if (!handler) return;

      const typing = isTypingTarget(e.target);
      const hasMod = e.ctrlKey || e.metaKey;
      if (typing && !hasMod && combo !== 'escape') return;

      e.preventDefault();
      handler({ typing, event: e });
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [shortcuts, enabled]);
}
