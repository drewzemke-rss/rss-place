import ansiEscapes from 'ansi-escapes';
import type { CursorState } from './cursor';
import { loadMapState, type MapState } from './state';

function getTerminalSize(): { rows: number; cols: number } {
  return {
    rows: process.stdout.rows || 24,
    cols: process.stdout.columns || 80,
  };
}

function drawGrid(state?: MapState, cursor?: CursorState): void {
  const mapState = state || loadMapState();
  const { rows, cols } = getTerminalSize();

  process.stdout.write(ansiEscapes.clearScreen);
  process.stdout.write(ansiEscapes.cursorHide);

  for (let row = 0; row < rows; row++) {
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

  process.stdout.write(ansiEscapes.cursorTo(0, rows - 1));
}

if (require.main === module) {
  drawGrid();
}

export { drawGrid, getTerminalSize };
