import { useContext } from 'react';
import { ThemeContext, type ThemeContextValue } from '../context/theme-context.js';

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe usarse dentro de <ThemeProvider>');
  }
  return context;
}
