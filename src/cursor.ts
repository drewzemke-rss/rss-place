import type { MapState } from './state';

export interface CursorState {
  row: number;
  col: number;
  color: {
    r: number;
    g: number;
    b: number;
  };
}

export interface ViewportState {
  offsetRow: number;
  offsetCol: number;
}

// bound the canvas to 320x240 pixels
// why? because that was the resolution of the N64 console, no other reason
export const CANVAS_MAX_ROW = 239;
export const CANVAS_MAX_COL = 319;
export const VIEWPORT_MARGIN = 10;

export function createCursorState(): CursorState {
  return { row: 0, col: 0, color: { r: 255, g: 255, b: 255 } };
}

export function createViewportState(): ViewportState {
  return { offsetRow: 0, offsetCol: 0 };
}

export function updateViewport(
  viewport: ViewportState,
  cursor: CursorState,
  terminalSize: { rows: number; cols: number },
): boolean {
  const drawableRows = terminalSize.rows - 1; // Reserve bottom line
  const viewportPixelHeight = drawableRows * 2; // Each terminal row shows 2 pixels
  const viewportPixelWidth = terminalSize.cols;

  let viewportChanged = false;

  // Calculate cursor position relative to current viewport
  const cursorViewportRow = cursor.row - viewport.offsetRow;
  const cursorViewportCol = cursor.col - viewport.offsetCol;

  // Check if cursor is too close to bottom edge
  if (cursorViewportRow >= viewportPixelHeight - VIEWPORT_MARGIN) {
    const newOffsetRow =
      cursor.row - (viewportPixelHeight - VIEWPORT_MARGIN - 1);
    const maxOffsetRow = CANVAS_MAX_ROW - viewportPixelHeight + 1;
    viewport.offsetRow = Math.min(Math.max(0, newOffsetRow), maxOffsetRow);
    viewportChanged = true;
  }

  // Check if cursor is too close to top edge
  if (cursorViewportRow < VIEWPORT_MARGIN && viewport.offsetRow > 0) {
    const newOffsetRow = cursor.row - VIEWPORT_MARGIN;
    viewport.offsetRow = Math.max(0, newOffsetRow);
    viewportChanged = true;
  }

  // Check if cursor is too close to right edge
  if (cursorViewportCol >= viewportPixelWidth - VIEWPORT_MARGIN) {
    const newOffsetCol =
      cursor.col - (viewportPixelWidth - VIEWPORT_MARGIN - 1);
    const maxOffsetCol = CANVAS_MAX_COL - viewportPixelWidth + 1;
    viewport.offsetCol = Math.min(Math.max(0, newOffsetCol), maxOffsetCol);
    viewportChanged = true;
  }

  // Check if cursor is too close to left edge
  if (cursorViewportCol < VIEWPORT_MARGIN && viewport.offsetCol > 0) {
    const newOffsetCol = cursor.col - VIEWPORT_MARGIN;
    viewport.offsetCol = Math.max(0, newOffsetCol);
    viewportChanged = true;
  }

  return viewportChanged;
}

export function moveCursor(
  cursor: CursorState,
  direction: 'up' | 'down' | 'left' | 'right',
): void {
  switch (direction) {
    case 'up':
      cursor.row = Math.max(0, cursor.row - 1);
      break;
    case 'down':
      cursor.row = Math.min(CANVAS_MAX_ROW, cursor.row + 1);
      break;
    case 'left':
      cursor.col = Math.max(0, cursor.col - 1);
      break;
    case 'right':
      cursor.col = Math.min(CANVAS_MAX_COL, cursor.col + 1);
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

export function setColorFromMap(cursor: CursorState, mapState: MapState): void {
  const key = `${cursor.row},${cursor.col}`;
  const pixelData = mapState.get(key);

  if (pixelData) {
    cursor.color = { ...pixelData.color };
  } else {
    // Fallback to black if there's no data
    cursor.color = { r: 0, g: 0, b: 0 };
  }
}

export function brightenColor(cursor: CursorState): void {
  cursor.color.r = Math.min(255, cursor.color.r + 1);
  cursor.color.g = Math.min(255, cursor.color.g + 1);
  cursor.color.b = Math.min(255, cursor.color.b + 1);
}

export function darkenColor(cursor: CursorState): void {
  cursor.color.r = Math.max(0, cursor.color.r - 1);
  cursor.color.g = Math.max(0, cursor.color.g - 1);
  cursor.color.b = Math.max(0, cursor.color.b - 1);
}
