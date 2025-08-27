import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import type { PlaceMessage } from './schema';
import { defaultLogger, type Logger } from './log';

const STATE_FILE = 'state.json';

export type MapState = Map<
  string,
  { user: string; color: { r: number; g: number; b: number } }
>;

export function coordsToKey(row: number, col: number): string {
  return `${row},${col}`;
}

export function keyToCoords(key: string): { row: number; col: number } {
  const [row, col] = key.split(',').map(Number);
  return { row, col };
}

export function loadMapState(logger: Logger = defaultLogger): MapState {
  if (!existsSync(STATE_FILE)) {
    logger.log('No existing state file found, starting with empty map');
    return new Map();
  }

  try {
    const data = readFileSync(STATE_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    const map = new Map(Object.entries(parsed));
    logger.log(`Loaded ${map.size} pixels from state file`);
    return map as MapState;
  } catch (error) {
    logger.error(`Failed to load state file, starting with empty map: ${error}`);
    return new Map();
  }
}

export function saveMapState(state: MapState, logger: Logger = defaultLogger): void {
  try {
    const obj = Object.fromEntries(state);
    writeFileSync(STATE_FILE, JSON.stringify(obj, null, 2));
  } catch (error) {
    logger.error(`Failed to save state: ${error}`);
  }
}

export function updateMapState(state: MapState, message: PlaceMessage): void {
  const key = coordsToKey(message.loc.row, message.loc.col);
  state.set(key, {
    user: message.user,
    color: message.color,
  });
}
