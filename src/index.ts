import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { drawGrid } from './draw';
import { createConsumer } from './read';
import type { PlaceMessage } from './schema';
import type { MapState } from './state';
import { saveMapState } from './state';
import { createLogger } from './log';

const argv = yargs(hideBin(process.argv))
  .option('logfile', {
    type: 'string',
    describe: 'File to write logs to. If not provided, logs are not written',
  })
  .option('reset', {
    alias: 'r',
    type: 'boolean',
    describe:
      'Reset the state by reading from the topic from the very beginning',
    default: false,
  })
  .help()
  .parseSync() as { logfile?: string; reset: boolean };

const logger = createLogger({
  logFile: argv.logfile,
  console: false, // Don't log to console since we're doing live drawing
});

async function startLiveDrawing(): Promise<void> {
  // Clear log file if specified
  logger.clearLogFile();
  logger.log('Starting live drawing...');

  const username = process.argv[2] || 'live-viewer';

  try {
    const { consumer, state } = await createConsumer(
      username,
      (message: PlaceMessage, currentState: MapState) => {
        logger.log(
          `${message.user} placed pixel at (${message.loc.row}, ${message.loc.col})`,
        );
        drawGrid(currentState);
      },
      logger.error.bind(logger),
      logger.log.bind(logger),
      argv.reset,
      logger,
    );

    // Initial draw
    drawGrid(state);
    logger.log('Initial state drawn, listening for updates...');

    // Handle shutdown
    const shutdown = async (): Promise<void> => {
      logger.log('Shutting down...');
      try {
        // Save current state before exit
        saveMapState(state, logger);
        logger.log('State saved to file');

        await consumer.disconnect();
        logger.log('Consumer disconnected');
      } catch (error) {
        logger.error(`Error during shutdown: ${error}`);
      }
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    logger.error(`Failed to start live drawing: ${error}`);
    process.exit(1);
  }
}

if (require.main === module) {
  startLiveDrawing();
}

export { startLiveDrawing };
