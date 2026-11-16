/**
 * Intel events: a short scene with 2-3 choices, usually trade-offs.
 * Labels spell out the exact effect, since the UI shows them as-is.
 * Adding an event = adding an entry here.
 *
 * Content safety: flavor only. No real commands, tools or techniques.
 */
import type { EventDef } from '../engine';

export const EVENT_LIST: readonly EventDef[] = [
  {
    id: 'leaked-credential-dump',
    title: 'Leaked Credential Dump',
    text: 'A fresh dump of company logins is making the rounds. Using it is tempting, but the blue team will be watching for exactly that.',
    choices: [
      { label: 'Use it: gain a random Private card. Heat 5 (your next fight starts Noisy).', effects: [{ kind: 'gainRandomCard', rarity: 'private' }, { kind: 'heat', amount: 5 }] },
      { label: 'Sell it: +40 Crypto.', effects: [{ kind: 'gainCrypto', amount: 40 }] },
      { label: 'Walk away.', effects: [] },
    ],
  },
  {
    id: 'sketchy-forum-post',
    title: 'Sketchy Forum Post',
    text: 'Someone on a forum claims they can "tune up" your toolkit. They want payment up front.',
    choices: [
      { label: 'Pay 30 Crypto: upgrade a random card to v2.', cryptoCost: 30, effects: [{ kind: 'upgradeRandomCard' }] },
      { label: 'Walk away.', effects: [] },
    ],
  },
  {
    id: 'insider-tip',
    title: 'Insider Tip',
    text: 'A disgruntled employee wants to meet in person. They have something useful, but meetings are risky.',
    choices: [
      { label: 'Meet them: lose 8 OpSec, gain a random Tool.', effects: [{ kind: 'loseOpsec', amount: 8 }, { kind: 'gainRandomTool' }] },
      { label: 'Walk away.', effects: [] },
    ],
  },
  {
    id: 'unattended-laptop',
    title: 'Unattended Laptop',
    text: 'A laptop sits unlocked in an empty meeting room. You have a minute, tops.',
    choices: [
      { label: 'Clean up your tracks: Wipe 1 card.', effects: [{ kind: 'wipeChosenCard' }] },
      { label: 'Grab the hardware: +25 Crypto.', effects: [{ kind: 'gainCrypto', amount: 25 }] },
    ],
  },
  {
    id: 'bug-bounty-program',
    title: 'Bug Bounty Program',
    text: 'The target runs a bug bounty. You could file a real report and get paid, but it puts their team on high alert.',
    choices: [
      { label: 'File a report: +60 Crypto. Heat 10 (your next fight starts Detected).', effects: [{ kind: 'gainCrypto', amount: 60 }, { kind: 'heat', amount: 10 }] },
      { label: 'Walk away.', effects: [] },
    ],
  },
  {
    id: 'security-conference',
    title: 'Security Conference',
    text: 'A security conference is in town. Good cover, good coffee, and lots of people talking shop.',
    choices: [
      { label: 'Lay low in the crowd: recover 15 OpSec.', effects: [{ kind: 'healOpsec', amount: 15 }] },
      { label: 'Network: pick 1 of 3 class cards.', effects: [{ kind: 'cardChoice', count: 3 }] },
    ],
  },
  {
    id: 'phishing-simulation',
    title: 'Phishing Simulation',
    text: "The blue team is running an internal phishing test, and you're caught in the middle of it.",
    choices: [
      { label: 'Play along: fight an easy encounter for normal Loot.', effects: [{ kind: 'fight', tier: 'easy' }] },
      { label: 'Slip away: lose 6 OpSec.', effects: [{ kind: 'loseOpsec', amount: 6 }] },
    ],
  },
  {
    id: 'dark-web-mirror',
    title: 'Dark Web Mirror',
    text: 'A mirror of a Dark Web market offers straight trades, no Crypto needed.',
    choices: [
      { label: 'Trade: swap a card you choose for a random class card one rarity higher.', effects: [{ kind: 'tradeUpChosenCard' }] },
      { label: 'Walk away.', effects: [] },
    ],
  },
];
