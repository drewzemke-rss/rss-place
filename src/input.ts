import { stdin } from 'node:process';
import { moveCursor, type CursorState } from './cursor';

export function setupKeyboardInput(
  cursor: CursorState,
  terminalSize: { rows: number; cols: number },
  onCursorMove: () => void,
): void {
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding('utf8');

  stdin.on('data', (key: string) => {
    if (key === '\u0003') {
      process.exit();
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
    }
  });
}

export function cleanupKeyboardInput(): void {
  stdin.setRawMode(false);
  stdin.pause();
}