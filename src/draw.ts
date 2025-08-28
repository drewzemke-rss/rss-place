import ansiEscapes from 'ansi-escapes';
import type { CursorState } from './cursor';
import { loadMapState, type MapState } from './state';

function getTerminalSize(): { rows: number; cols: number } {
  return {
    rows: process.stdout.rows || 24,
    cols: process.stdout.columns || 80,
  };
}

const BLACK_PIXEL = { r: 0, g: 0, b: 0 };

function drawGrid(
  state?: MapState,
  cursor?: CursorState,
  username?: string,
): void {
  const mapState = state || loadMapState();
  const { rows, cols } = getTerminalSize();

  process.stdout.write(ansiEscapes.clearScreen);
  process.stdout.write(ansiEscapes.cursorHide);

  // only draw to second-to-last row, reserving bottom line for diagnostics
  const drawableRows = rows - 1;

  for (let row = 0; row < drawableRows; row++) {
    for (let col = 0; col < cols; col++) {
      // each terminal character represents two pixels vertically stacked
      const topCoords = `${row * 2},${col}`;
      const bottomCoords = `${row * 2 + 1},${col}`;

      const topPixel = mapState.get(topCoords);
      const bottomPixel = mapState.get(bottomCoords);

      process.stdout.write(ansiEscapes.cursorTo(col, row));

      // fallback to black if no color data is available
      const { r: tr, g: tg, b: tb } = topPixel?.color ?? BLACK_PIXEL;
      const { r: br, g: bg, b: bb } = bottomPixel?.color ?? BLACK_PIXEL;

      const output = `\u001b[38;2;${tr};${tg};${tb}m\u001b[48;2;${br};${bg};${bb}m▀`;

      process.stdout.write(output);
    }
  }

  // Draw cursor after the main grid
  if (cursor) {
    const terminalRow = Math.floor(cursor.row / 2);
    const terminalCol = cursor.col;
    const isTopHalf = cursor.row % 2 === 0;

    // Get the existing pixels at this terminal position
    const topCoords = `${terminalRow * 2},${terminalCol}`;
    const bottomCoords = `${terminalRow * 2 + 1},${terminalCol}`;
    const topPixel = mapState.get(topCoords);
    const bottomPixel = mapState.get(bottomCoords);

    process.stdout.write(ansiEscapes.cursorTo(terminalCol, terminalRow));

    if (isTopHalf) {
      // white foreground, preserve bottom half as background
      const { r, g, b } = bottomPixel?.color ?? BLACK_PIXEL;
      process.stdout.write(
        `\u001b[38;2;255;255;255m\u001b[48;2;${r};${g};${b}m▀`,
      );
    } else {
      // white background, preserve top half as foreground
      const { r, g, b } = topPixel?.color ?? BLACK_PIXEL;
      process.stdout.write(
        `\u001b[38;2;${r};${g};${b}m\u001b[48;2;255;255;255m▀`,
      );
    }
  }

  // write diagnostic info on the bottom line
  process.stdout.write(ansiEscapes.cursorTo(0, rows - 1));

  // reset colors before diagnostics
  process.stdout.write('\u001b[0m');

  if (username && cursor) {
    const { r, g, b } = cursor.color;
    const colorSwatch = `\u001b[48;2;${r};${g};${b}m  `;
    const diagnostics = `User: ${username} | Cursor: (${cursor.row}, ${cursor.col}) | Color: ${colorSwatch}\u001b[0m (r:${r} ,g:${g}, b:${b})`;
    process.stdout.write(diagnostics);
  }
}

if (require.main === module) {
  drawGrid();
}

export { drawGrid, getTerminalSize };
