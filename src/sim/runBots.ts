/**
 * Run-level bot choices: route, Loot, Safehouse, Dark Web and Intel.
 * Fights are played by the fight bots in bots.ts.
 *
 * Two policies:
 * - random: picks any legal option. Gives the cleanest card pick-to-win signal,
 *   because its picks aren't biased by a heuristic.
 * - sensible: simple rules a reasonable player might follow (heal when low,
 *   avoid Hardened Targets when hurt, prefer rarer cards, trim starter cards).
 *
 * Bots only send actions through runReducer. An action that returns the same
 * state was invalid, which bots use to test what's allowed.
 */
import { canUpgrade, reachableNodeIds, runEffectsNeedDeckIndex, runReducer, wipePrice } from '../engine';
import type { NodeKind, Rarity, Rng, RunAction, RunContent, RunState } from '../engine';

export type RunPolicy = 'random' | 'sensible';

const RARITY_RANK: Readonly<Record<Rarity, number>> = { starter: 0, public: 1, private: 2, 'zero-day': 3 };

function pick<T>(items: readonly T[], rng: Rng): T | undefined {
  return items.length === 0 ? undefined : items[rng.nextInt(items.length)];
}

function isValid(run: RunState, action: RunAction, content: RunContent): boolean {
  return runReducer(run, action, content) !== run;
}

function rarityOf(cardId: string, content: RunContent): number {
  const rarity = content.cards[cardId]?.rarity;
  return rarity === undefined ? 0 : RARITY_RANK[rarity];
}

/** Index of the card the bot would most like to remove: a copy of its most common starter card. */
export function worstCardIndex(run: RunState, content: RunContent): number {
  const counts = new Map<string, number>();
  for (const id of run.deck) {
    if (content.cards[id]?.rarity === 'starter') counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  let worst: string | undefined;
  for (const [id, count] of counts) {
    if (worst === undefined || count > (counts.get(worst) ?? 0)) worst = id;
  }
  return worst === undefined ? 0 : run.deck.indexOf(worst);
}

/** Index of the rarest card that can be upgraded, or -1. */
function bestUpgradeIndex(run: RunState, content: RunContent): number {
  let best = -1;
  run.deck.forEach((id, index) => {
    if (!canUpgrade(content.cards, id)) return;
    if (best === -1 || rarityOf(id, content) > rarityOf(run.deck[best] ?? '', content)) best = index;
  });
  return best;
}

// ---------------------------------------------------------------------------
// Per-phase choices
// ---------------------------------------------------------------------------

function chooseNode(run: RunState, policy: RunPolicy, rng: Rng): RunAction {
  const options = reachableNodeIds(run.map, run.currentNodeId);
  if (policy === 'random') return { type: 'CHOOSE_NODE', nodeId: pick(options, rng) ?? '' };

  const health = run.opsec / run.maxOpsec;
  const score = (kind: NodeKind): number => {
    switch (kind) {
      case 'safehouse':
        return health < 0.5 ? 10 : 2;
      case 'elite':
        return health > 0.7 ? 6 : -5;
      case 'darkWeb':
        return run.crypto >= 120 ? 7 : 0;
      case 'fight':
        return 4;
      case 'intel':
        return 3;
      case 'boss':
        return 0;
    }
  };
  // Random tie-break so equal routes aren't always the leftmost.
  const scored = options.map((id) => ({ id, value: score(run.map.nodes[id]?.kind ?? 'fight') + rng.next() }));
  scored.sort((a, b) => b.value - a.value);
  return { type: 'CHOOSE_NODE', nodeId: scored[0]?.id ?? '' };
}

function chooseLoot(run: RunState, content: RunContent, policy: RunPolicy, rng: Rng): RunAction {
  if (run.phase.kind !== 'loot') return { type: 'SKIP_LOOT' };
  const choices = run.phase.loot.cardChoices;
  if (choices.length === 0) return { type: 'SKIP_LOOT' };
  if (policy === 'random') {
    const index = rng.nextInt(choices.length + 1); // one extra slot = skip
    return index === choices.length ? { type: 'SKIP_LOOT' } : { type: 'PICK_LOOT_CARD', index };
  }
  let best = 0;
  choices.forEach((id, index) => {
    if (rarityOf(id, content) > rarityOf(choices[best] ?? '', content)) best = index;
  });
  return { type: 'PICK_LOOT_CARD', index: best };
}

function chooseSafehouse(run: RunState, content: RunContent, policy: RunPolicy, rng: Rng): RunAction {
  const upgradeIndex = bestUpgradeIndex(run, content);
  const options: RunAction[] = [{ type: 'LAY_LOW' }, { type: 'GO_DARK', deckIndex: worstCardIndex(run, content) }];
  if (upgradeIndex !== -1) options.push({ type: 'WEAPONIZE', deckIndex: upgradeIndex });
  if (policy === 'random') return pick(options, rng) ?? { type: 'LAY_LOW' };

  if (run.opsec / run.maxOpsec < 0.5) return { type: 'LAY_LOW' };
  if (upgradeIndex !== -1) return { type: 'WEAPONIZE', deckIndex: upgradeIndex };
  return { type: 'GO_DARK', deckIndex: worstCardIndex(run, content) };
}

/** One Dark Web purchase, or LEAVE when the bot is done shopping. */
function chooseDarkWeb(run: RunState, content: RunContent, policy: RunPolicy, rng: Rng): RunAction {
  if (run.phase.kind !== 'darkWeb') return { type: 'LEAVE' };
  const { cards, tools, wipeUsed } = run.phase;
  const affordable = (price: number) => price <= run.crypto;

  const buys: RunAction[] = [];
  cards.forEach((item, index) => {
    if (!item.sold && affordable(item.price)) buys.push({ type: 'BUY_CARD', index });
  });
  tools.forEach((item, index) => {
    if (!item.sold && affordable(item.price)) buys.push({ type: 'BUY_TOOL', index });
  });
  const wipe: RunAction = { type: 'BUY_WIPE', deckIndex: worstCardIndex(run, content) };
  if (!wipeUsed && affordable(wipePrice(run, content))) buys.push(wipe);

  if (policy === 'random') {
    return rng.next() < 0.5 ? (pick(buys, rng) ?? { type: 'LEAVE' }) : { type: 'LEAVE' };
  }
  // Sensible: Tools first, then trim a starter card, then the rarest affordable card.
  const tool = buys.find((a) => a.type === 'BUY_TOOL');
  if (tool !== undefined) return tool;
  if (buys.includes(wipe)) return wipe;
  const cardBuys = buys.filter((a): a is Extract<RunAction, { type: 'BUY_CARD' }> => a.type === 'BUY_CARD');
  cardBuys.sort((a, b) => rarityOf(cards[b.index]?.id ?? '', content) - rarityOf(cards[a.index]?.id ?? '', content));
  return cardBuys[0] ?? { type: 'LEAVE' };
}

function chooseEvent(run: RunState, content: RunContent, policy: RunPolicy, rng: Rng): RunAction {
  if (run.phase.kind !== 'intel') return { type: 'LEAVE' };
  const event = content.events[run.phase.eventId];
  const deckIndex = worstCardIndex(run, content);

  const valid: RunAction[] = [];
  event?.choices.forEach((choice, index) => {
    const action: RunAction = runEffectsNeedDeckIndex(choice.effects)
      ? { type: 'EVENT_CHOICE', index, deckIndex }
      : { type: 'EVENT_CHOICE', index };
    if (!isValid(run, action, content)) return;
    // Sensible: never take an OpSec hit that would leave you under half.
    const opsecCost = choice.effects.reduce((sum, e) => (e.kind === 'loseOpsec' ? sum + e.amount : sum), 0);
    if (policy === 'sensible' && run.opsec - opsecCost < run.maxOpsec / 2) return;
    valid.push(action);
  });
  // Every event should have a free "walk away" choice; fall back to the first one just in case.
  return pick(valid, rng) ?? { type: 'EVENT_CHOICE', index: 0 };
}

/** The bot's next action for any non-combat phase. */
export function chooseRunAction(run: RunState, content: RunContent, policy: RunPolicy, rng: Rng): RunAction {
  switch (run.phase.kind) {
    case 'map':
      return chooseNode(run, policy, rng);
    case 'loot':
      return chooseLoot(run, content, policy, rng);
    case 'safehouse':
      return chooseSafehouse(run, content, policy, rng);
    case 'darkWeb':
      return chooseDarkWeb(run, content, policy, rng);
    case 'intel':
      return chooseEvent(run, content, policy, rng);
    case 'combat':
      throw new Error('Combat actions come from the fight bot');
  }
}
