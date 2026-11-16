/**
 * `npm run replay -- <file>`: replays a run log pasted from the game
 * (Menu -> Run Logs) and prints what happened, turn by turn.
 * The file can contain extra text around the log, like a whole GitHub issue body.
 */
import { parseRunLog } from '../engine';
import { CONTENT } from '../data/content';
import { replayReport } from './replayReport';

export function main(logText: string, currentBuild: string): string {
  return replayReport(parseRunLog(logText), CONTENT, currentBuild);
}
