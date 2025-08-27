export interface CursorState {
  row: number;
  col: number;
}

export function createCursorState(): CursorState {
  return { row: 0, col: 0 };
}

export function moveCursor(
  cursor: CursorState,
  direction: 'up' | 'down' | 'left' | 'right',
  terminalSize: { rows: number; cols: number },
): void {
  // Reserve bottom line for diagnostics - cursor can only move in drawable area
  const maxRow = terminalSize.rows - 2;

  switch (direction) {
    case 'up':
      cursor.row = Math.max(0, cursor.row - 1);
      break;
    case 'down':
      cursor.row = Math.min(maxRow, cursor.row + 1);
      break;
    case 'left':
      cursor.col = Math.max(0, cursor.col - 1);
      break;
    case 'right':
      cursor.col = Math.min(terminalSize.cols - 1, cursor.col + 1);
      break;
  }
}
