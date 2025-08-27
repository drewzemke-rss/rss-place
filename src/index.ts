import { appendFileSync, writeFileSync } from 'node:fs';
import { drawGrid } from './draw';
import { createConsumer } from './read';
import type { PlaceMessage } from './schema';
import type { MapState } from './state';
import { saveMapState } from './state';

const LOG_FILE = 'live-draw.log';

function log(message: string): void {
  const timestamp = new Date().toISOString();
  appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`);
}

function logError(error: string): void {
  log(`ERROR: ${error}`);
}

async function startLiveDrawing(): Promise<void> {
  // Clear log file
  writeFileSync(LOG_FILE, '');
  log('Starting live drawing...');

  const username = process.argv[2] || 'live-viewer';

  try {
    const { consumer, state } = await createConsumer(
      username,
      (message: PlaceMessage, currentState: MapState) => {
        log(
          `${message.user} placed pixel at (${message.loc.row}, ${message.loc.col})`,
        );
        drawGrid(currentState);
      },
      logError,
      log,
    );

    // Initial draw
    drawGrid(state);
    log('Initial state drawn, listening for updates...');

    // Handle shutdown
    const shutdown = async (): Promise<void> => {
      log('Shutting down...');
      try {
        // Save current state before exit
        saveMapState(state);
        log('State saved to file');

        await consumer.disconnect();
        log('Consumer disconnected');
      } catch (error) {
        logError(`Error during shutdown: ${error}`);
      }
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    logError(`Failed to start live drawing: ${error}`);
    process.exit(1);
  }
}

if (require.main === module) {
  startLiveDrawing();
}

export { startLiveDrawing };
