import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// GitHub Pages serves the site from https://<owner>.github.io/kill-chain/.
// Using the same base everywhere means dev, preview and production all live at
// /kill-chain/ (e.g. http://localhost:5173/kill-chain/), so asset URLs never differ.
export default defineConfig({
  base: '/kill-chain/',
  plugins: [react()],
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    environment: 'node',
  },
});
