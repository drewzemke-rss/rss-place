import type { CursorState } from './cursor';

export interface ViewportState {
  offsetRow: number;
  offsetCol: number;
}

// bound the canvas to 320x240 pixels
// why? because that was the resolution of the N64 console, no other reason
export const CANVAS_MAX_ROW = 239;
export const CANVAS_MAX_COL = 319;
export const VIEWPORT_MARGIN = 10;

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
