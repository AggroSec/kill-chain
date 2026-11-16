/** Props every run phase screen gets: the run, content, and two action helpers. */
import type { RunAction, RunContent, RunState } from '../../engine';

export interface PhaseProps {
  run: RunState;
  content: RunContent;
  /** Send an action to the run engine. */
  act: (action: RunAction) => void;
  /** Would this action be accepted right now? (Used to disable buttons.) */
  can: (action: RunAction) => boolean;
}
