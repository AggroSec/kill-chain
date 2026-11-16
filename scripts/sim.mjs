// Runs the TypeScript simulator in Node using Vite's module runner,
// so no extra dependency (like tsx) is needed. Usage: npm run sim -- --fights 500
import { runnerImport } from 'vite';

const { module } = await runnerImport('/src/sim/cli.ts');
const started = Date.now();
console.log(module.main(process.argv.slice(2)));
console.error(`\n(sim finished in ${((Date.now() - started) / 1000).toFixed(1)}s)`);
