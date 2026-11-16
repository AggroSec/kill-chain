import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { execSync } from 'node:child_process';

/**
 * Short commit id baked into the build and written into run logs, so a
 * replay can use the exact same cards and enemies. GitHub Actions provides
 * GITHUB_SHA; locally we ask git. Falls back to "dev".
 */
function buildId(): string {
  if (process.env.GITHUB_SHA !== undefined) return process.env.GITHUB_SHA.slice(0, 7);
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return 'dev';
  }
}

// GitHub Pages serves the site from https://<owner>.github.io/kill-chain/.
// Using the same base everywhere means dev, preview and production all live at
// /kill-chain/ (e.g. http://localhost:5173/kill-chain/), so asset URLs never differ.
export default defineConfig({
  base: '/kill-chain/',
  plugins: [react()],
  define: { __BUILD_ID__: JSON.stringify(buildId()) },
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    environment: 'node',
  },
});
