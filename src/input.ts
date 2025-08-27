import { stdin } from 'node:process';
import ansiEscapes from 'ansi-escapes';
import { type CursorState, moveCursor } from './cursor';

export function setupKeyboardInput(
  cursor: CursorState,
  terminalSize: { rows: number; cols: number },
  onCursorMove: () => void,
  onDrawPixel: (row: number, col: number) => void,
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
    } else if (key === '\r') {
      onDrawPixel(cursor.row, cursor.col);
    }
  });
}

export function cleanupKeyboardInput(): void {
  process.stdout.write(ansiEscapes.cursorShow);
  stdin.setRawMode(false);
  stdin.pause();
}
