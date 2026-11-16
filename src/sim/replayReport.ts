/**
 * Turns a run log into a readable, turn-by-turn account of the run:
 * each node, each turn's hand and enemy intents, every card played and
 * what it changed, and every Loot, Safehouse, Dark Web and Intel choice.
 *
 * The engine has no event log, so this compares the state before and after
 * each action and reports the differences. Used by `npm run replay`.
 */
import { getAlertLevel, getMove, replayRun } from '../engine';
import type { CombatState, RunAction, RunContent, RunLog, RunState } from '../engine';
import { ALERT_LEVEL_NAMES, NODE_NAMES } from '../data/terms';
import { describeIntent } from '../ui/describe';

function cardName(content: RunContent, id: string): string {
  return content.cards[id]?.name ?? id;
}

function enemyName(content: RunContent, combat: CombatState, index: number): string {
  const enemy = combat.enemies[index];
  return enemy === undefined ? `enemy ${index}` : (content.enemies[enemy.defId]?.name ?? enemy.defId);
}

function alertText(alert: number): string {
  return `${alert} (${ALERT_LEVEL_NAMES[getAlertLevel(alert).id]})`;
}

function statusText(statuses: Readonly<Record<string, number>>, content: RunContent): string {
  const parts = Object.entries(statuses).map(([id, stacks]) => `${content.statuses[id]?.name ?? id} ${stacks}`);
  return parts.length === 0 ? '' : ` [${parts.join(', ')}]`;
}

function combatOf(run: RunState): CombatState | null {
  return run.phase.kind === 'combat' ? run.phase.combat : null;
}

/** The start-of-turn snapshot: Operator stats, hand, and each enemy's intent. */
function turnLines(combat: CombatState, content: RunContent): string[] {
  const p = combat.player;
  const lines = [
    `  -- Turn ${combat.turn}: OpSec ${p.opsec}/${p.maxOpsec}, Block ${p.block}, Cycles ${p.cycles}, Alert ${alertText(combat.alert)}${statusText(p.statuses, content)}`,
    `     Hand: ${p.hand.map((c, i) => `[${i}] ${cardName(content, c.defId)}`).join(', ')}`,
  ];
  combat.enemies.forEach((enemy, index) => {
    if (enemy.integrity <= 0) return;
    const def = content.enemies[enemy.defId];
    const intent = def === undefined ? '?' : describeIntent(getMove(def, enemy.intentMoveId).effects, content);
    lines.push(
      `     ${enemyName(content, combat, index)} [${index}]: ${enemy.integrity}/${enemy.maxIntegrity}` +
        `${enemy.block > 0 ? `, Block ${enemy.block}` : ''}${statusText(enemy.statuses, content)} -> ${intent}`,
    );
  });
  return lines;
}

/** What a card play or enemy turn changed: enemy Integrity, OpSec, Block, Alert, Chain. */
function combatDiff(before: CombatState, after: CombatState, content: RunContent): string {
  const parts: string[] = [];
  after.enemies.forEach((enemy, index) => {
    const old = before.enemies[index];
    if (old === undefined) return;
    if (old.integrity !== enemy.integrity) {
      const down = enemy.integrity <= 0 ? ' (down)' : '';
      parts.push(`${enemyName(content, after, index)} ${old.integrity}->${enemy.integrity}${down}`);
    }
    if (old.block !== enemy.block && enemy.integrity > 0) parts.push(`${enemyName(content, after, index)} Block ${old.block}->${enemy.block}`);
  });
  if (before.player.opsec !== after.player.opsec) parts.push(`OpSec ${before.player.opsec}->${after.player.opsec}`);
  if (before.player.block !== after.player.block) parts.push(`Block ${before.player.block}->${after.player.block}`);
  if (before.alert !== after.alert) parts.push(`Alert ${before.alert}->${alertText(after.alert)}`);
  if (before.chain.count !== after.chain.count) parts.push(`Chain ${before.chain.count}->${after.chain.count}`);
  return parts.length === 0 ? 'no visible change' : parts.join(', ');
}

/** Run-level changes: OpSec, Crypto, Arsenal and Tools. */
function runDiff(before: RunState, after: RunState, content: RunContent): string {
  const parts: string[] = [];
  if (before.opsec !== after.opsec) parts.push(`OpSec ${before.opsec}->${after.opsec}`);
  if (before.maxOpsec !== after.maxOpsec) parts.push(`max OpSec ${before.maxOpsec}->${after.maxOpsec}`);
  if (before.crypto !== after.crypto) parts.push(`Crypto ${before.crypto}->${after.crypto}`);
  if (before.heat !== after.heat) parts.push(`Heat ${before.heat}->${after.heat}`);

  // Cards added and removed (counting copies).
  const remaining = [...before.deck];
  const added: string[] = [];
  for (const id of after.deck) {
    const at = remaining.indexOf(id);
    if (at === -1) added.push(id);
    else remaining.splice(at, 1);
  }
  if (added.length > 0) parts.push(`+ ${added.map((id) => cardName(content, id)).join(', ')}`);
  if (remaining.length > 0) parts.push(`- ${remaining.map((id) => cardName(content, id)).join(', ')}`);
  for (const id of after.tools.filter((t) => !before.tools.includes(t))) parts.push(`+ Tool ${content.tools[id]?.name ?? id}`);
  return parts.length === 0 ? 'no change' : parts.join(', ');
}

/** Lines printed when a new phase opens (a fight starts, Loot appears, an Intel event...). */
function phaseOpenLines(run: RunState, content: RunContent): string[] {
  const phase = run.phase;
  switch (phase.kind) {
    case 'combat':
      return turnLines(phase.combat, content);
    case 'loot': {
      const tool = phase.loot.toolId === null ? '' : `, Tool ${content.tools[phase.loot.toolId]?.name ?? phase.loot.toolId}`;
      return [
        `  Loot: +${phase.loot.crypto} Crypto${tool}; offered ${phase.loot.cardChoices.map((id, i) => `[${i}] ${cardName(content, id)}`).join(', ')}`,
      ];
    }
    case 'intel': {
      const event = content.events[phase.eventId];
      if (event === undefined) return [`  Intel: ${phase.eventId}`];
      return [`  Intel: ${event.title}`, ...event.choices.map((c, i) => `     [${i}] ${c.label}`)];
    }
    case 'darkWeb':
      return [
        `  Dark Web cards: ${phase.cards.map((c, i) => `[${i}] ${cardName(content, c.id)} ${c.price}`).join(', ')}`,
        `  Dark Web tools: ${phase.tools.map((t, i) => `[${i}] ${content.tools[t.id]?.name ?? t.id} ${t.price}`).join(', ')}`,
      ];
    case 'safehouse':
      return ['  Safehouse'];
    case 'map':
      return [];
  }
}

function describeStep(before: RunState, after: RunState, action: RunAction, content: RunContent): string[] {
  const lines: string[] = [];
  const beforeCombat = combatOf(before);
  const afterCombat = combatOf(after);

  switch (action.type) {
    case 'CHOOSE_NODE': {
      const node = after.map.nodes[action.nodeId];
      const kind = node === undefined ? '?' : NODE_NAMES[node.kind];
      const what = afterCombat === null ? '' : `: ${afterCombat.enemies.map((_, i) => enemyName(content, afterCombat, i)).join(' + ')}`;
      lines.push('', `== Floor ${node?.floor ?? '?'} ${kind}${what} (OpSec ${after.opsec}/${after.maxOpsec}, Crypto ${after.crypto}) ==`);
      lines.push(...phaseOpenLines(after, content));
      return lines;
    }
    case 'COMBAT': {
      if (beforeCombat === null) return [`  ! combat action outside a fight`];
      // The fight state after this action: either still in combat, or the final state if the run moved on.
      const resultCombat = afterCombat ?? beforeCombat;
      if (action.action.type === 'PLAY_CARD') {
        const card = beforeCombat.player.hand[action.action.handIndex];
        const name = card === undefined ? '?' : cardName(content, card.defId);
        const target = content.cards[card?.defId ?? '']?.effects.some((e) => 'target' in e && e.target === 'allEnemies')
          ? 'all'
          : enemyName(content, beforeCombat, action.action.targetIndex);
        lines.push(`     Play ${name} -> ${target}: ${afterCombat === null ? 'fight over' : combatDiff(beforeCombat, resultCombat, content)}`);
      } else {
        lines.push(`     End turn. Enemy turn: ${afterCombat === null ? 'fight over' : combatDiff(beforeCombat, resultCombat, content)}`);
      }
      if (afterCombat !== null && afterCombat.outcome === 'ongoing' && afterCombat.turn !== beforeCombat.turn) {
        lines.push(...turnLines(afterCombat, content));
      }
      if (afterCombat !== null && afterCombat.outcome !== 'ongoing') {
        lines.push(`  Fight ${afterCombat.outcome} on turn ${afterCombat.turn}.`);
      }
      if (afterCombat === null) {
        lines.push(`  Fight won. ${runDiff(before, after, content)}`);
        lines.push(...phaseOpenLines(after, content));
      }
      return lines;
    }
    default: {
      lines.push(`  ${action.type}: ${runDiff(before, after, content)}`);
      // Some choices open a new phase (an Intel event can start a fight).
      if (after.phase.kind !== before.phase.kind) lines.push(...phaseOpenLines(after, content));
      return lines;
    }
  }
}

export function replayReport(log: RunLog, content: RunContent, currentBuild: string): string {
  const lines: string[] = [`Run log: class ${log.classId}, seed ${log.seed}, build ${log.build}, result "${log.result}"`];
  if (log.build !== currentBuild) {
    lines.push(`WARNING: log is from build ${log.build} but this is ${currentBuild}. Check out that commit if the replay drifts.`);
  }
  if (log.actions === null) {
    lines.push('', 'This run was saved before run logs existed, so only its final state is available.');
    if (log.state !== undefined) lines.push(finalStateLines(log.state, content).join('\n'));
    return lines.join('\n');
  }

  const { start, steps, final } = replayRun(log, content);
  lines.push(`Start: OpSec ${start.opsec}/${start.maxOpsec}, Crypto ${start.crypto}, Arsenal: ${start.deck.map((id) => cardName(content, id)).join(', ')}`);
  for (const step of steps) {
    if (!step.valid) {
      lines.push('', `!! Action ${step.index} was rejected by the engine. The log and this build don't match; replay stopped here.`);
      break;
    }
    lines.push(...describeStep(step.before, step.after, step.action, content));
  }
  lines.push('', ...finalStateLines(final, content));
  return lines.join('\n');
}

function finalStateLines(run: RunState, content: RunContent): string[] {
  const floor = run.currentNodeId === null ? 0 : (run.map.nodes[run.currentNodeId]?.floor ?? 0);
  const lines = [
    `== End: ${run.outcome}, floor ${floor}, OpSec ${run.opsec}/${run.maxOpsec}, Crypto ${run.crypto} ==`,
    `Arsenal (${run.deck.length}): ${run.deck.map((id) => cardName(content, id)).join(', ')}`,
    `Tools: ${run.tools.map((id) => content.tools[id]?.name ?? id).join(', ') || 'none'}`,
  ];
  const combat = combatOf(run);
  if (combat !== null) {
    lines.push(`Last fight: ${combat.outcome} on turn ${combat.turn}`);
    lines.push(...turnLines(combat, content));
  }
  return lines;
}
