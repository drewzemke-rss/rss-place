export interface CursorState {
  row: number;
  col: number;
  color: {
    r: number;
    g: number;
    b: number;
  };
}

export function createCursorState(): CursorState {
  return { row: 0, col: 0, color: { r: 255, g: 255, b: 255 } };
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

export function cycleColor(
  cursor: CursorState,
  component: 'r' | 'g' | 'b',
  increment: number,
): void {
  const currentValue = cursor.color[component];
  const newValue = (currentValue + increment) % 256;
  cursor.color[component] = newValue < 0 ? newValue + 256 : newValue;
}

export function setColorPreset(
  cursor: CursorState,
  preset: 'white' | 'black' | 'random',
): void {
  switch (preset) {
    case 'white':
      cursor.color = { r: 255, g: 255, b: 255 };
      break;
    case 'black':
      cursor.color = { r: 0, g: 0, b: 0 };
      break;
    case 'random':
      cursor.color = {
        r: Math.floor(Math.random() * 256),
        g: Math.floor(Math.random() * 256),
        b: Math.floor(Math.random() * 256),
      };
      break;
  }
}
