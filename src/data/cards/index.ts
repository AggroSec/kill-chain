/** Every card in the game. Adding a card = adding an entry to one of these lists. */
import type { CardDef } from '../../engine';
import { EXPLOIT_DEV_CARDS } from './exploitDev';
import { SOCIAL_ENGINEER_CARDS } from './socialEngineer';

export const CARD_LIST: readonly CardDef[] = [...SOCIAL_ENGINEER_CARDS, ...EXPLOIT_DEV_CARDS];
