import ansiEscapes from 'ansi-escapes';
import type { CursorState } from './cursor';
import type { Color, MapState } from './state';

// Buffer types for double buffering
export type TerminalCell = {
  foreground: Color;
  background: Color;
};

export type TerminalBuffer = TerminalCell[][];

export type BufferDifference = {
  row: number;
  col: number;
  cell: TerminalCell;
};

const WHITE: Color = { r: 255, g: 255, b: 255 };
const BLACK: Color = { r: 0, g: 0, b: 0 };

// Buffer management functions
export function createTerminalBuffer(
  rows: number,
  cols: number,
): TerminalBuffer {
  const buffer: TerminalBuffer = [];
  for (let row = 0; row < rows; row++) {
    buffer[row] = [];
    for (let col = 0; col < cols; col++) {
      buffer[row][col] = {
        foreground: BLACK,
        background: BLACK,
      };
    }
  }
  return buffer;
}

export function copyBuffer(source: TerminalBuffer): TerminalBuffer {
  return source.map((row) =>
    row.map((cell) => ({
      foreground: { ...cell.foreground },
      background: { ...cell.background },
    })),
  );
}

function colorsEqual(a: Color, b: Color): boolean {
  return a.r === b.r && a.g === b.g && a.b === b.b;
}

function cellsEqual(a: TerminalCell, b: TerminalCell): boolean {
  return (
    colorsEqual(a.foreground, b.foreground) &&
    colorsEqual(a.background, b.background)
  );
}

export function buildBufferFromMapState(
  mapState: MapState,
  cursor: CursorState | undefined,
  terminalSize: { rows: number; cols: number },
  viewport?: { offsetRow: number; offsetCol: number },
): TerminalBuffer {
  const buffer = createTerminalBuffer(terminalSize.rows - 1, terminalSize.cols); // -1 for diagnostic line
  const viewportOffset = viewport || { offsetRow: 0, offsetCol: 0 };

  // Fill buffer with pixel data
  for (let terminalRow = 0; terminalRow < buffer.length; terminalRow++) {
    for (
      let terminalCol = 0;
      terminalCol < buffer[terminalRow].length;
      terminalCol++
    ) {
      // Each terminal character represents two pixels vertically stacked
      // Apply viewport offset to get canvas coordinates
      const canvasTopRow = terminalRow * 2 + viewportOffset.offsetRow;
      const canvasBottomRow = terminalRow * 2 + 1 + viewportOffset.offsetRow;
      const canvasCol = terminalCol + viewportOffset.offsetCol;

      const topCoords = `${canvasTopRow},${canvasCol}`;
      const bottomCoords = `${canvasBottomRow},${canvasCol}`;

      const topPixel = mapState.get(topCoords);
      const bottomPixel = mapState.get(bottomCoords);

      const topColor = topPixel?.color ?? BLACK;
      const bottomColor = bottomPixel?.color ?? BLACK;

      buffer[terminalRow][terminalCol] = {
        foreground: topColor,
        background: bottomColor,
      };
    }
  }

  // Overlay cursor if present
  if (cursor) {
    // Convert cursor canvas coordinates to viewport-relative coordinates
    const viewportCursorRow = cursor.row - viewportOffset.offsetRow;
    const viewportCursorCol = cursor.col - viewportOffset.offsetCol;

    const terminalRow = Math.floor(viewportCursorRow / 2);
    const terminalCol = viewportCursorCol;
    const isTopHalf = viewportCursorRow % 2 === 0;

    // Make sure cursor is within buffer bounds
    if (
      terminalRow >= 0 &&
      terminalRow < buffer.length &&
      terminalCol >= 0 &&
      terminalCol < buffer[terminalRow].length
    ) {
      const currentCell = buffer[terminalRow][terminalCol];

      if (isTopHalf) {
        // White foreground (cursor), preserve background
        buffer[terminalRow][terminalCol] = {
          foreground: WHITE,
          background: currentCell.background,
        };
      } else {
        // White background (cursor), preserve foreground
        buffer[terminalRow][terminalCol] = {
          foreground: currentCell.foreground,
          background: WHITE,
        };
      }
    }
  }

  return buffer;
}

export function findBufferDifferences(
  current: TerminalBuffer,
  previous: TerminalBuffer,
): BufferDifference[] {
  const differences: BufferDifference[] = [];

  const rows = Math.min(current.length, previous.length);
  for (let row = 0; row < rows; row++) {
    const cols = Math.min(current[row].length, previous[row].length);
    for (let col = 0; col < cols; col++) {
      if (!cellsEqual(current[row][col], previous[row][col])) {
        differences.push({
          row,
          col,
          cell: current[row][col],
        });
      }
    }
  }

  return differences;
}

function buildColoredHalfBlock(
  foregroundColor: Color,
  backgroundColor: Color,
): string {
  return `\u001b[38;2;${foregroundColor.r};${foregroundColor.g};${foregroundColor.b}m\u001b[48;2;${backgroundColor.r};${backgroundColor.g};${backgroundColor.b}m▀`;
}

export function renderBufferDifferences(differences: BufferDifference[]): void {
  for (const diff of differences) {
    process.stdout.write(ansiEscapes.cursorTo(diff.col, diff.row));
    process.stdout.write(
      buildColoredHalfBlock(diff.cell.foreground, diff.cell.background),
    );
  }
}

export function renderBuffer(buffer: TerminalBuffer): void {
  for (let row = 0; row < buffer.length; row++) {
    for (let col = 0; col < buffer[row].length; col++) {
      process.stdout.write(ansiEscapes.cursorTo(col, row));
      const cell = buffer[row][col];
      process.stdout.write(
        buildColoredHalfBlock(cell.foreground, cell.background),
      );
    }
  }
}
