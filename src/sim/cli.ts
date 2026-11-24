/**
 * `npm run sim`: headless balance simulator. Prints a Markdown report.
 *
 * Modes:
 *   (default)       full 3-act runs per class per bot (default 2,000 runs)
 *   --mode fights   single fights: each starter Arsenal vs every encounter
 *
 * Options:
 *   --runs N        runs per class per bot (run mode, default 2000)
 *   --fights N      fights per class x encounter x bot (fight mode, default 300)
 *   --bot NAME      only one bot (random | greedy | chain)
 *   --class ID      only one class (social-engineer | exploit-dev | insider)
 *   --locked        play with a fresh profile's locked cards (default: everything unlocked)
 */
import { emptyProfile, lockedCardIds } from '../engine';
import { CLASS_LIST } from '../data/classes';
import { PROGRESSION } from '../data/progression';
import { CONTENT, starterFight } from '../data/content';
import { ENCOUNTER_LIST } from '../data/encounters';
import { BOTS } from './bots';
import { runFights } from './fightSim';
import { runReport } from './runReport';
import type { FightStats } from './fightSim';

function readFlag(args: readonly string[], name: string): string | undefined {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? undefined : args[index + 1];
}

const pct = (n: number) => `${(n * 100).toFixed(0)}%`;
const num = (n: number) => n.toFixed(1);

export function main(args: readonly string[]): string {
  if (readFlag(args, 'mode') === 'fights') return fightMain(args);
  const runs = Number(readFlag(args, 'runs') ?? 2000);
  if (!Number.isInteger(runs) || runs <= 0) throw new Error('--runs must be a positive integer');
  const botFilter = readFlag(args, 'bot');
  const classFilter = readFlag(args, 'class');
  const classIds = CLASS_LIST.map((c) => c.id).filter((id) => classFilter === undefined || id === classFilter);
  if (classIds.length === 0) throw new Error(`Unknown class "${classFilter ?? ''}"`);
  const { lines, warnings } = runReport(CONTENT, {
    runs,
    ...(botFilter !== undefined ? { botFilter } : {}),
    classIds,
    lockedCardIds: args.includes('--locked') ? lockedCardIds(emptyProfile(), PROGRESSION) : [],
    className: (id) => CLASS_LIST.find((c) => c.id === id)?.name ?? id,
  });
  lines.push('### Warnings', '');
  lines.push(...(warnings.length > 0 ? warnings.map((w) => `- ${w}`) : ['- None']));
  return lines.join('\n');
}

/** Fight mode: every class's starter Arsenal against every encounter. */
function fightMain(args: readonly string[]): string {
  const fights = Number(readFlag(args, 'fights') ?? 300);
  const botFilter = readFlag(args, 'bot');
  const bots = BOTS.filter((bot) => botFilter === undefined || bot.name === botFilter);
  if (!Number.isInteger(fights) || fights <= 0) throw new Error('--fights must be a positive integer');
  if (bots.length === 0) throw new Error(`Unknown bot "${botFilter ?? ''}"`);

  const lines: string[] = [];
  const warnings: string[] = [];
  lines.push(`Fights per cell: ${fights}. Starter Arsenal at full OpSec, Act 1 encounters.`, '');

  for (const bot of bots) {
    lines.push(`### Bot: ${bot.name}`, '');
    lines.push('| Class | Encounter | Tier | Win | Avg turns | Avg OpSec lost | Avg peak Alert | Avg max Chain | Turn caps |');
    lines.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
    for (const cls of CLASS_LIST) {
      for (const encounter of ENCOUNTER_LIST) {
        const stats: FightStats = runFights(starterFight(cls.id, encounter.id), fights, bot, CONTENT);
        lines.push(
          `| ${cls.name} | ${encounter.id} | ${encounter.tier} | ${pct(stats.winRate)} | ${num(stats.avgTurns)} | ` +
            `${num(stats.avgOpsecLost)} | ${num(stats.avgPeakAlert)} | ${num(stats.avgMaxChain)} | ${stats.turnCaps} |`,
        );
        if (stats.turnCaps > 0) warnings.push(`${bot.name}: ${cls.id} vs ${encounter.id} hit the turn cap ${stats.turnCaps}x`);
        if (stats.stuck > 0) warnings.push(`${bot.name}: ${cls.id} vs ${encounter.id} had ${stats.stuck} stuck fights`);
        if (stats.suspectedInfinites > 0) {
          warnings.push(`${bot.name}: ${cls.id} vs ${encounter.id} had ${stats.suspectedInfinites} suspected infinite combos`);
        }
      }
    }
    lines.push('');
  }

  lines.push('### Warnings', '');
  lines.push(...(warnings.length > 0 ? warnings.map((w) => `- ${w}`) : ['- None']));
  return lines.join('\n');
}
