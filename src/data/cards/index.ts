/** Every card in the game. Adding a card = adding an entry to one of these lists. */
import type { CardDef } from '../../engine';
import { EXPLOIT_DEV_CARDS } from './exploitDev';
import { EXPLOIT_DEV_RARE_CARDS } from './exploitDevRare';
import { INSIDER_CARDS } from './insider';
import { SOCIAL_ENGINEER_CARDS } from './socialEngineer';
import { SOCIAL_ENGINEER_RARE_CARDS } from './socialEngineerRare';
import { UNLOCKABLE_CARDS } from './unlockable';

export const CARD_LIST: readonly CardDef[] = [
  ...SOCIAL_ENGINEER_CARDS,
  ...SOCIAL_ENGINEER_RARE_CARDS,
  ...EXPLOIT_DEV_CARDS,
  ...EXPLOIT_DEV_RARE_CARDS,
  ...INSIDER_CARDS,
  ...UNLOCKABLE_CARDS,
];
