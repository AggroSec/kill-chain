/**
 * Player settings in localStorage (theme, whether the guided first fight
 * has been offered). Every read and write is wrapped in try/catch, so
 * private browsing just means settings don't stick.
 */

export const THEMES = ['green', 'amber', 'soft'] as const;
export type ThemeId = (typeof THEMES)[number];

export interface Settings {
  theme: ThemeId;
  /** True once the guided first fight has been offered (played or skipped). */
  tutorialOffered: boolean;
}

const SETTINGS_KEY = 'kill-chain.settings.v1';
const DEFAULTS: Settings = { theme: 'green', tutorialOffered: false };

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw === null) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      theme: THEMES.includes(parsed.theme as ThemeId) ? (parsed.theme as ThemeId) : DEFAULTS.theme,
      tutorialOffered: parsed.tutorialOffered === true,
    };
  } catch {
    return DEFAULTS;
  }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Storage unavailable: settings last until the page closes.
  }
}

/** Sets <html data-theme> (all colors are CSS variables keyed on it) and the browser bar color. */
export function applyTheme(theme: ThemeId): void {
  document.documentElement.dataset.theme = theme;
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg);
}
