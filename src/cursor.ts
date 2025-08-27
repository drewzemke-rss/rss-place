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
  switch (direction) {
    case 'up':
      cursor.row = Math.max(0, cursor.row - 1);
      break;
    case 'down':
      cursor.row = Math.min(terminalSize.rows - 1, cursor.row + 1);
      break;
    case 'left':
      cursor.col = Math.max(0, cursor.col - 1);
      break;
    case 'right':
      cursor.col = Math.min(terminalSize.cols - 1, cursor.col + 1);
      break;
  }
}
