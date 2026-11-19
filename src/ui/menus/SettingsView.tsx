/** Settings: color theme for now. Changes apply immediately. */
import { THEME_NAMES, TERMS } from '../../data/terms';
import { THEMES } from '../settings';
import type { ThemeId } from '../settings';

interface SettingsViewProps {
  theme: ThemeId;
  onThemeChange: (theme: ThemeId) => void;
}

export function SettingsView({ theme, onThemeChange }: SettingsViewProps) {
  return (
    <fieldset className="class-pick">
      <legend>{TERMS.theme}</legend>
      {THEMES.map((id) => (
        <label key={id} className={id === theme ? 'option selected' : 'option'}>
          <input type="radio" name="theme" value={id} checked={id === theme} onChange={() => onThemeChange(id)} />
          <span className="theme-row">
            {/* Each swatch shows that theme's own colors, whatever theme is active. */}
            <span className="theme-swatch" data-theme={id} aria-hidden="true">
              <span />
              <span />
            </span>
            <strong>{THEME_NAMES[id]}</strong>
          </span>
        </label>
      ))}
    </fieldset>
  );
}
