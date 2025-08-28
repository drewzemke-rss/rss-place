import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import type { TerminalBuffer } from './buffer';
import { createCursorState } from './cursor';
import { drawGridBuffered, getTerminalSize } from './draw';
import { cleanupKeyboardInput, setupKeyboardInput } from './input';
import { createLogger } from './log';
import { createConsumer } from './read';
import type { PlaceMessage } from './schema';
import type { MapState } from './state';
import { saveMapState } from './state';
import { PixelWriter } from './write';

// stfu kafka
process.env.KAFKAJS_NO_PARTITIONER_WARNING = '1';

const argv = yargs(hideBin(process.argv))
  .option('username', {
    alias: 'u',
    type: 'string',
    describe: 'Your username for the place canvas',
    demandOption: true,
  })
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
  .parseSync() as { username: string; logfile?: string; reset: boolean };

const logger = createLogger({
  logFile: argv.logfile,
  console: false, // Don't log to console since we're doing live drawing
});

async function startLiveDrawing(): Promise<void> {
  logger.clearLogFile();
  logger.log('Starting live drawing...');

  const username = argv.username;
  const cursor = createCursorState();
  const terminalSize = getTerminalSize();
  const pixelWriter = new PixelWriter(logger);

  // Buffer state for double buffering
  let currentBuffer: TerminalBuffer | undefined;

  try {
    console.log('Connecting to Kafka...');
    const { consumer, state } = await createConsumer(
      username,
      (message: PlaceMessage, currentState: MapState) => {
        logger.log(
          `${message.user} placed pixel at (${message.loc.row}, ${message.loc.col})`,
        );
        currentBuffer = drawGridBuffered(
          currentState,
          cursor,
          username,
          currentBuffer,
        );
      },
      logger.error.bind(logger),
      logger.log.bind(logger),
      argv.reset,
      logger,
    );

    setupKeyboardInput(
      cursor,
      terminalSize,
      () => {
        currentBuffer = drawGridBuffered(
          state,
          cursor,
          username,
          currentBuffer,
        );
      },
      async (row: number, col: number) => {
        try {
          await pixelWriter.drawPixel(username, row, col, cursor.color);
        } catch (error) {
          logger.error(`Failed to draw pixel: ${error}`);
        }
      },
      () => {
        currentBuffer = drawGridBuffered(
          state,
          cursor,
          username,
          currentBuffer,
        );
      },
      () => state,
    );

    // Initial draw
    currentBuffer = drawGridBuffered(state, cursor, username, currentBuffer);
    logger.log('Initial state drawn, listening for updates...');

    // Handle shutdown
    const shutdown = async (): Promise<void> => {
      process.stdout.write('\nExiting, just a moment...\n');
      logger.log('Shutting down...');
      try {
        cleanupKeyboardInput();

        await pixelWriter.disconnect();

        saveMapState(state, logger);

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
