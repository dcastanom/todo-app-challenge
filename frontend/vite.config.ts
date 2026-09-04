/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    // Tests live outside src/, mirroring the src/ hierarchy under tests/.
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: './tests/setup.ts',
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      // main/App/pages are composition shells exercised by the Playwright E2E suite.
      exclude: ['src/main.tsx', 'src/App.tsx', 'src/pages/**', '**/*.d.ts'],
      thresholds: { statements: 80, branches: 75, functions: 80, lines: 80 },
    },
  },
});
