import ansiEscapes from 'ansi-escapes';
import type { CursorState } from './cursor';
import { loadMapState, type MapState } from './state';

function getTerminalSize(): { rows: number; cols: number } {
  return {
    rows: process.stdout.rows || 24,
    cols: process.stdout.columns || 80,
  };
}

function drawGrid(
  state?: MapState,
  cursor?: CursorState,
  username?: string,
): void {
  const mapState = state || loadMapState();
  const { rows, cols } = getTerminalSize();

  process.stdout.write(ansiEscapes.clearScreen);
  process.stdout.write(ansiEscapes.cursorHide);

  // Only draw to second-to-last row, reserving bottom line for diagnostics
  const drawableRows = rows - 1;

  for (let row = 0; row < drawableRows; row++) {
    for (let col = 0; col < cols; col++) {
      const key = `${row},${col}`;
      if (cursor && cursor.row === row && cursor.col === col) {
        process.stdout.write(ansiEscapes.cursorTo(col, row));
        process.stdout.write('┼');
      } else if (mapState.has(key)) {
        process.stdout.write(ansiEscapes.cursorTo(col, row));
        process.stdout.write('█');
      }
    }
  }

  // Write diagnostic info on the bottom line
  process.stdout.write(ansiEscapes.cursorTo(0, rows - 1));
  if (username && cursor) {
    const diagnostics = `User: ${username} | Cursor: (${cursor.row}, ${cursor.col})`;
    process.stdout.write(diagnostics);
  }
}

if (require.main === module) {
  drawGrid();
}

export { drawGrid, getTerminalSize };
