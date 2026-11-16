/**
 * `npm run sim`: plays every class's starter Arsenal against every encounter
 * with every bot and prints a Markdown report.
 *
 * Options:
 *   --fights N    fights per class x encounter x bot (default 300)
 *   --bot NAME    only run one bot (random | greedy | chain)
 *
 * Milestone 3 extends this to full runs (map, Loot, pick-to-win rates).
 */
import { CLASS_LIST } from '../data/classes';
import { CONTENT, starterFight } from '../data/content';
import { ENCOUNTER_LIST } from '../data/encounters';
import { BOTS } from './bots';
import { runFights } from './fightSim';
import type { FightStats } from './fightSim';

function readFlag(args: readonly string[], name: string): string | undefined {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? undefined : args[index + 1];
}

const pct = (n: number) => `${(n * 100).toFixed(0)}%`;
const num = (n: number) => n.toFixed(1);

export function main(args: readonly string[]): string {
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
