/**
 * Markdown report for full runs: win rates, floors, causes of death,
 * card pick-to-win rates, Tool win rates and Safehouse choices.
 */
import type { RunContent } from '../engine';
import { RUN_BOTS, runRuns } from './runSim';
import type { RunBot, RunStats, WinCount } from './runSim';

const pct = (n: number) => `${(n * 100).toFixed(0)}%`;

/** Cards gained in fewer runs than this are left out of the outlier list (too noisy). */
const MIN_SAMPLE = 50;
/** CLAUDE.md's outlier thresholds for card pick-to-win. */
const HIGH_PICK_TO_WIN = 0.65;
const LOW_PICK_TO_WIN = 0.35;

function winRate(count: WinCount): number {
  return count.runs === 0 ? 0 : count.wins / count.runs;
}

function nameOf(content: RunContent, kind: 'cards' | 'tools' | 'encounters', id: string): string {
  if (kind === 'cards') return content.cards[id]?.name ?? id;
  if (kind === 'tools') return content.tools[id]?.name ?? id;
  return (content.encounters[id]?.enemies ?? [id]).map((e) => content.enemies[e]?.name ?? e).join(' + ');
}

function sortedByRuns(map: ReadonlyMap<string, WinCount>): [string, WinCount][] {
  return [...map].sort((a, b) => b[1].runs - a[1].runs);
}

export interface RunReportOptions {
  runs: number;
  botFilter?: string;
  classIds: readonly string[];
  className: (id: string) => string;
}

export function runReport(content: RunContent, options: RunReportOptions): { lines: string[]; warnings: string[] } {
  const bots: readonly RunBot[] = RUN_BOTS.filter((b) => options.botFilter === undefined || b.name === options.botFilter);
  if (bots.length === 0) throw new Error(`Unknown bot "${options.botFilter ?? ''}"`);
  const lines: string[] = [];
  const warnings: string[] = [];
  const results: { bot: RunBot; classId: string; stats: RunStats }[] = [];

  for (const bot of bots) {
    for (const classId of options.classIds) results.push({ bot, classId, stats: runRuns(classId, options.runs, bot, content) });
  }

  lines.push(`Runs per class per bot: ${options.runs}. Act 1 only; beating the boss wins the run.`, '');
  lines.push('### Win rate', '');
  lines.push('| Bot | Class | Win | Avg floor reached | Turn caps | Stuck | Suspected infinites |');
  lines.push('| --- | --- | --- | --- | --- | --- | --- |');
  for (const { bot, classId, stats } of results) {
    lines.push(
      `| ${bot.name} | ${options.className(classId)} | ${pct(stats.winRate)} | ${stats.avgFloor.toFixed(1)} | ` +
        `${stats.turnCaps} | ${stats.stuck} | ${stats.suspectedInfinites} |`,
    );
    if (stats.stuck > 0) warnings.push(`${bot.name}/${classId}: ${stats.stuck} stuck runs`);
    if (stats.suspectedInfinites > 0) warnings.push(`${bot.name}/${classId}: ${stats.suspectedInfinites} suspected infinite combos`);
  }
  lines.push('');

  // Detail sections use the first sensible bot (greedy), where choices mean something.
  const detailBot = bots.find((b) => b.policy === 'sensible');
  for (const { bot, classId, stats } of results.filter((r) => r.bot === detailBot)) {
    const title = `${options.className(classId)}, ${bot.name} bot`;
    lines.push(`### ${title}: what ends runs`, '');
    const deaths = [...stats.killedBy].sort((a, b) => b[1] - a[1]);
    for (const [id, count] of deaths) lines.push(`- ${nameOf(content, 'encounters', id)}: ${count} (${pct(count / stats.runs)})`);
    if (deaths.length === 0) lines.push('- No fight losses.');
    lines.push('');

    lines.push(`### ${title}: card pick-to-win`, '');
    lines.push('| Card | Runs with it | Win rate |', '| --- | --- | --- |');
    for (const [id, count] of sortedByRuns(stats.cards)) {
      lines.push(`| ${nameOf(content, 'cards', id)} | ${count.runs} | ${pct(winRate(count))} |`);
      if (count.runs >= MIN_SAMPLE && winRate(count) > HIGH_PICK_TO_WIN) {
        warnings.push(`${bot.name}/${classId}: ${id} pick-to-win ${pct(winRate(count))} (above 65%)`);
      }
      if (count.runs >= MIN_SAMPLE && winRate(count) < LOW_PICK_TO_WIN) {
        warnings.push(`${bot.name}/${classId}: ${id} pick-to-win ${pct(winRate(count))} (below 35%)`);
      }
    }
    lines.push('');

    lines.push(`### ${title}: Tools and Safehouse`, '');
    lines.push('| Tool / choice | Runs | Win rate |', '| --- | --- | --- |');
    for (const [id, count] of sortedByRuns(stats.tools)) lines.push(`| ${nameOf(content, 'tools', id)} | ${count.runs} | ${pct(winRate(count))} |`);
    for (const [choice, count] of [...stats.safehouse]) lines.push(`| Safehouse: ${choice} | ${count.runs} | ${pct(winRate(count))} |`);
    lines.push('');
  }

  return { lines, warnings };
}
