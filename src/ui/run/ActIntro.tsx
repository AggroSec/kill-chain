/**
 * A pop-up at the start of each act, over the map: the act's name, the
 * drawn Final Target (so the Arsenal can be planned around it), and the
 * OpSec recovered between acts. Tap the button to see the map.
 */
import type { RunContent, RunState } from "../../engine";
import { ACT_NAMES, TERMS } from "../../data/terms";

interface ActIntroProps {
  run: RunState;
  content: RunContent;
  onClose: () => void;
}

export function ActIntro({ run, content, onClose }: ActIntroProps) {
  const target = content.targets[run.finalTargetId];
  const finalAct = run.act >= content.config.acts;
  const actName =
    finalAct && target !== undefined
      ? `${ACT_NAMES[run.act] ?? ""}: ${target.name}`
      : (ACT_NAMES[run.act] ?? "");

  return (
    <div
      className="act-intro-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`${TERMS.act} ${run.act}`}
    >
      <section className="panel act-intro">
        <h2>
          {TERMS.act} {run.act}: {actName}
        </h2>
        {run.actStart !== null && run.actStart.healed > 0 && (
          <p className="recovered">
            {TERMS.recovered} {run.actStart.healed} {TERMS.opsec}.
          </p>
        )}
        {run.act > 1 && <p className="muted">{TERMS.actStartHint}</p>}
        {target !== undefined && (run.act === 1 || finalAct) && (
          <div className="final-target">
            {run.act === 1 && (
              <h3>
                {TERMS.finalTargetDrawn}: {target.name}
              </h3>
            )}
            <p>{target.description}</p>
            <p className="muted">
              {TERMS.boss}: {target.bossName}
            </p>
          </div>
        )}
        <button type="button" className="primary" onClick={onClose}>
          {TERMS.chooseNext}
        </button>
      </section>
    </div>
  );
}
