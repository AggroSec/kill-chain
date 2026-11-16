// Replays a run log from the game and prints a turn-by-turn report.
// Usage: npm run replay -- path/to/log.txt   (or pipe the log in on stdin)
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { runnerImport } from 'vite';

const file = process.argv[2];
const text = readFileSync(file ?? 0, 'utf8');
let build = 'dev';
try {
  build = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
} catch {
  // Not in a git checkout; the build check just warns.
}
const { module } = await runnerImport('/src/sim/replayCli.ts');
console.log(module.main(text, build));
