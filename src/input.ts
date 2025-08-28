import { stdin } from 'node:process';
import ansiEscapes from 'ansi-escapes';
import {
  type CursorState,
  cycleColor,
  moveCursor,
  setColorPreset,
} from './cursor';

export function setupKeyboardInput(
  cursor: CursorState,
  terminalSize: { rows: number; cols: number },
  onCursorMove: () => void,
  onDrawPixel: (row: number, col: number) => void,
  onColorChange?: () => void,
): void {
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding('utf8');

  stdin.on('data', (key: string) => {
    if (key === '\u0003') {
      process.kill(process.pid, 'SIGINT');
      return;
    }

    if (key === '\u001b[A') {
      moveCursor(cursor, 'up', terminalSize);
      onCursorMove();
    } else if (key === '\u001b[B') {
      moveCursor(cursor, 'down', terminalSize);
      onCursorMove();
    } else if (key === '\u001b[C') {
      moveCursor(cursor, 'right', terminalSize);
      onCursorMove();
    } else if (key === '\u001b[D') {
      moveCursor(cursor, 'left', terminalSize);
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
    } else if (key === 'w') {
      setColorPreset(cursor, 'white');
      onColorChange?.();
    } else if (key === 'k') {
      setColorPreset(cursor, 'black');
      onColorChange?.();
    } else if (key === 'x') {
      setColorPreset(cursor, 'random');
      onColorChange?.();
    }
  });
}

export function cleanupKeyboardInput(): void {
  process.stdout.write(ansiEscapes.cursorShow);
  stdin.setRawMode(false);
  stdin.pause();
}
