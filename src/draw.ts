import ansiEscapes from 'ansi-escapes';
import {
  buildBufferFromMapState,
  findBufferDifferences,
  renderBuffer,
  renderBufferDifferences,
  type TerminalBuffer,
} from './buffer';
import type { CursorState } from './cursor';
import {
  type Color,
  loadMapState,
  type MapState,
  type PixelData,
} from './state';

const WHITE: Color = { r: 255, g: 255, b: 255 };
const BLACK: Color = { r: 0, g: 0, b: 0 };

function getTerminalSize(): { rows: number; cols: number } {
  return {
    rows: process.stdout.rows || 24,
    cols: process.stdout.columns || 80,
  };
}

function buildColoredHalfBlock(
  foregroundColor: Color,
  backgroundColor: Color,
): string {
  return `\u001b[38;2;${foregroundColor.r};${foregroundColor.g};${foregroundColor.b}m\u001b[48;2;${backgroundColor.r};${backgroundColor.g};${backgroundColor.b}m▀`;
}

function renderPixelPair(
  topPixel: PixelData | undefined,
  bottomPixel: PixelData | undefined,
): string {
  // fallback to black if no color data is available
  const topColor = topPixel?.color ?? BLACK;
  const bottomColor = bottomPixel?.color ?? BLACK;

  return buildColoredHalfBlock(topColor, bottomColor);
}

function renderCursorPixelPair(
  topPixel: PixelData | undefined,
  bottomPixel: PixelData | undefined,
  isTopHalf: boolean,
): string {
  if (isTopHalf) {
    // white foreground, preserve bottom half as background
    const bottomColor = bottomPixel?.color ?? BLACK;
    return buildColoredHalfBlock(WHITE, bottomColor);
  } else {
    // white background, preserve top half as foreground
    const topColor = topPixel?.color ?? BLACK;
    return buildColoredHalfBlock(topColor, WHITE);
  }
}

// New buffered drawing function
export function drawGridBuffered(
  mapState: MapState,
  cursor: CursorState | undefined,
  username: string | undefined,
  previousBuffer: TerminalBuffer | undefined,
): TerminalBuffer {
  const terminalSize = getTerminalSize();
  const currentBuffer = buildBufferFromMapState(mapState, cursor, terminalSize);

  // If we have a previous buffer, only draw differences
  if (previousBuffer) {
    const differences = findBufferDifferences(currentBuffer, previousBuffer);
    if (differences.length > 0) {
      renderBufferDifferences(differences);
    }
  } else {
    // First draw - render entire buffer
    process.stdout.write(ansiEscapes.clearScreen);
    renderBuffer(currentBuffer);
  }

  // Reset colors
  process.stdout.write('\u001b[0m');

  // Write diagnostic info on the bottom line
  const { rows } = terminalSize;
  process.stdout.write(ansiEscapes.cursorTo(0, rows - 1));
  process.stdout.write(ansiEscapes.eraseEndLine);

  if (username && cursor) {
    const { r, g, b } = cursor.color;
    const colorSwatch = `\u001b[48;2;${r};${g};${b}m  `;
    const diagnostics = `User: ${username} | Cursor: (${cursor.row}, ${cursor.col}) | Color: ${colorSwatch}\u001b[0m (r:${r} ,g:${g}, b:${b})`;
    process.stdout.write(diagnostics);
  }

  return currentBuffer;
}

function drawGrid(
  state?: MapState,
  cursor?: CursorState,
  username?: string,
): void {
  const mapState = state || loadMapState();
  const { rows, cols } = getTerminalSize();

  // process.stdout.write(ansiEscapes.clearScreen);

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
      process.stdout.write(renderPixelPair(topPixel, bottomPixel));
    }
  }

  // draw cursor
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
    process.stdout.write(
      renderCursorPixelPair(topPixel, bottomPixel, isTopHalf),
    );
  }

  // reset colors
  process.stdout.write('\u001b[0m');

  // write diagnostic info on the bottom line
  process.stdout.write(ansiEscapes.cursorTo(0, rows - 1));
  process.stdout.write(ansiEscapes.eraseEndLine);

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
