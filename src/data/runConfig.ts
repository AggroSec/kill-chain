/**
 * The numbers that shape a run: map odds, Loot, Dark Web prices and the
 * Safehouse. Approved by AggroSec in #6 (with the review changes applied).
 * Tune here; the engine reads these through RunContent.config.
 */
import type { RunConfig } from '../engine';

export const RUN_CONFIG: RunConfig = {
  floors: 12,
  lanes: 4,
  // Enough walks to give real route choices without filling every lane.
  paths: 6,
  // Percent odds on floors 1-11 (they add up to 100).
  nodeWeights: { fight: 50, intel: 20, safehouse: 10, elite: 10, darkWeb: 10 },
  // The floor before the boss is all Safehouses.
  fixedFloors: [{ floor: 12, kind: 'safehouse' }],
  // Floor 12 is already a Safehouse row, so floor 11 never rolls one.
  bannedKinds: [{ floor: 11, kinds: ['safehouse'] }],
  noBackToBack: ['safehouse', 'darkWeb'],
  easyFightCount: 3,
  minArsenalSize: 5,
  startingCrypto: 99,
  loot: {
    fight: { rarityWeights: { public: 60, private: 35, 'zero-day': 5 }, crypto: [12, 18], cardChoices: 3, tool: false },
    elite: { rarityWeights: { public: 30, private: 55, 'zero-day': 15 }, crypto: [25, 35], cardChoices: 3, tool: true },
    // Bosses offer 2 cards, both 0-day.
    boss: { rarityWeights: { public: 0, private: 0, 'zero-day': 100 }, crypto: [70, 80], cardChoices: 2, tool: true },
  },
  darkWeb: {
    cardCount: 5,
    toolCount: 2,
    cardPrice: { public: [45, 55], private: [70, 85], 'zero-day': [140, 160] },
    toolPrice: [120, 180],
    saleMultiplier: 0.5,
    wipeBasePrice: 75,
    wipePriceStep: 25,
  },
  safehouse: { layLowPercent: 35 },
};
