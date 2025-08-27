import ansiEscapes from "ansi-escapes";
import { loadMapState } from "./state";

function getTerminalSize(): { rows: number; cols: number } {
	return {
		rows: process.stdout.rows || 24,
		cols: process.stdout.columns || 80,
	};
}

function drawGrid(): void {
	const state = loadMapState();
	const { rows, cols } = getTerminalSize();

	process.stdout.write(ansiEscapes.clearScreen);

	for (let row = 0; row < rows; row++) {
		for (let col = 0; col < cols; col++) {
			const key = `${row},${col}`;
			if (state.has(key)) {
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

export { drawGrid };