/**
 * Image lookups for cards. Real art is optional: drop a file into
 * src/assets/cards/ and set the card's `art` field to its file name. Any card
 * without art (or whose image fails to load) gets the generated placeholder,
 * which uses the tactic icons in src/assets/icons/tactics/.
 */
import type { Tactic } from '../engine';

/** Every image in src/assets/cards/, keyed by file name (e.g. "phishing.webp"). */
const CARD_ART = byFileName(
  import.meta.glob<string>('../assets/cards/*.{png,jpg,jpeg,webp,svg}', { eager: true, query: '?url', import: 'default' }),
);

/** Tactic icons, keyed by tactic id (e.g. "reconnaissance"). */
const TACTIC_ICONS = byFileName(
  import.meta.glob<string>('../assets/icons/tactics/*.svg', { eager: true, query: '?url', import: 'default' }),
  true,
);

function byFileName(modules: Record<string, string>, stripExtension = false): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [path, url] of Object.entries(modules)) {
    let name = path.slice(path.lastIndexOf('/') + 1);
    if (stripExtension) name = name.replace(/\.[^.]+$/, '');
    result[name] = url;
  }
  return result;
}

/** URL of a card's art file, or undefined if it has none or the file is missing. */
export function cardArtUrl(art: string | undefined): string | undefined {
  return art === undefined ? undefined : CARD_ART[art];
}

export function tacticIconUrl(tactic: Tactic): string | undefined {
  return TACTIC_ICONS[tactic];
}
