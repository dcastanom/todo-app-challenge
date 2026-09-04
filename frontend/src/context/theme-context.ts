import { createContext } from 'react';

/** `system` follows the OS; `light`/`light` are explicit user choices. */
export type ThemePreference = 'system' | 'light' | 'dark';
/** The theme actually applied to the document after resolving `system`. */
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeContextValue {
  /** What the user picked. */
  preference: ThemePreference;
  /** What is on screen right now. */
  theme: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
  /** Flips between light and dark (and pins the choice). */
  toggle: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export const THEME_STORAGE_KEY = 'todo:theme';
