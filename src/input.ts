import { stdin } from 'node:process';
import ansiEscapes from 'ansi-escapes';
import {
  brightenColor,
  type CursorState,
  cycleColor,
  darkenColor,
  moveCursor,
  setColorFromMap,
  setColorPreset,
} from './cursor';
import type { MapState } from './state';

export function setupKeyboardInput(
  cursor: CursorState,
  onCursorMove: () => void,
  onDrawPixel: (row: number, col: number) => void,
  onColorChange?: () => void,
  getMapState?: () => MapState,
): void {
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding('utf8');
  process.stdout.write(ansiEscapes.cursorHide);

  stdin.on('data', (key: string) => {
    if (key === '\u0003') {
      process.kill(process.pid, 'SIGINT');
      return;
    }

    if (key === '\u001b[A' || key === 'k') {
      moveCursor(cursor, 'up');
      onCursorMove();
    } else if (key === '\u001b[B' || key === 'j') {
      moveCursor(cursor, 'down');
      onCursorMove();
    } else if (key === '\u001b[C' || key === 'l') {
      moveCursor(cursor, 'right');
      onCursorMove();
    } else if (key === '\u001b[D' || key === 'h') {
      moveCursor(cursor, 'left');
      onCursorMove();
    } else if (key === '\r' || key === ' ') {
      onDrawPixel(cursor.row, cursor.col);
    } else if (key === 'r') {
      cycleColor(cursor, 'r', 1);
      onColorChange?.();
    } else if (key === 'R') {
      cycleColor(cursor, 'r', 64);
      onColorChange?.();
    } else if (key === 'g') {
      cycleColor(cursor, 'g', 1);
      onColorChange?.();
    } else if (key === 'G') {
      cycleColor(cursor, 'g', 64);
      onColorChange?.();
    } else if (key === 'b') {
      cycleColor(cursor, 'b', 1);
      onColorChange?.();
    } else if (key === 'B') {
      cycleColor(cursor, 'b', 64);
      onColorChange?.();
    } else if (key === 'W') {
      setColorPreset(cursor, 'white');
      onColorChange?.();
    } else if (key === 'C') {
      setColorPreset(cursor, 'black');
      onColorChange?.();
    } else if (key === 'w') {
      brightenColor(cursor);
      onColorChange?.();
    } else if (key === 'c') {
      darkenColor(cursor);
      onColorChange?.();
    } else if (key === 'x') {
      setColorPreset(cursor, 'random');
      onColorChange?.();
    } else if (key === 'p') {
      if (getMapState) {
        setColorFromMap(cursor, getMapState());
        onColorChange?.();
      }
    }
  });
}

export function cleanupKeyboardInput(): void {
  process.stdout.write(ansiEscapes.cursorShow);
  stdin.setRawMode(false);
  stdin.pause();
}
