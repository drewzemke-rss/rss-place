import { Kafka, type Producer } from 'kafkajs';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import 'dotenv/config';
import { defaultLogger, type Logger } from './log';
import type { PlaceMessage } from './schema';

const TOPIC = 'drew-place';

function createKafkaClient(): Kafka {
  return new Kafka({
    clientId: 'rss-place-producer',
    brokers: process.env.REDPANDA_BROKERS?.split(',') || ['localhost:9092'],
    ssl: process.env.RP_SECURITY_PROTOCOL === 'SASL_SSL',
    sasl:
      process.env.RP_SECURITY_PROTOCOL === 'SASL_SSL'
        ? {
            mechanism: 'scram-sha-512',
            username: process.env.REDPANDA_USER || '',
            password: process.env.REDPANDA_PASS || '',
          }
        : undefined,
    connectionTimeout: 10000,
    requestTimeout: 30000,
  });
}

export class PixelWriter {
  private producer: Producer;
  private isConnected = false;
  private logger: Logger;

  constructor(logger: Logger = defaultLogger) {
    const kafka = createKafkaClient();
    this.producer = kafka.producer();
    this.logger = logger;
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.producer.connect();
      this.isConnected = true;
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.producer.disconnect();
      this.isConnected = false;
    }
  }

  async drawPixel(
    user: string,
    row: number,
    col: number,
    color: { r: number; g: number; b: number } = { r: 255, g: 255, b: 255 },
  ): Promise<void> {
    try {
      await this.connect();

      const message: PlaceMessage = {
        user,
        color,
        loc: { row, col },
      };

      await this.producer.send({
        topic: TOPIC,
        messages: [{ value: JSON.stringify(message) }],
      });

      this.logger.log(
        `Drew pixel at (${row}, ${col}) with color RGB(${color.r}, ${color.g}, ${color.b}) for user: ${user}`,
      );
    } catch (error) {
      this.logger.error(`Error drawing pixel: ${error}`);
      throw error;
    }
  }
}

// CLI for testing
if (require.main === module) {
  async function drawPixel(
    user: string,
    row: number,
    col: number,
  ): Promise<void> {
    const writer = new PixelWriter();
    try {
      await writer.drawPixel(user, row, col);
    } finally {
      await writer.disconnect();
    }
  }

  const argv = yargs(hideBin(process.argv))
    .command(
      '$0 <username> <row> <col>',
      'Draw a white pixel at the specified location',
      (yargs) => {
        return yargs
          .positional('username', {
            describe: 'Username to use for the pixel',
            type: 'string',
            demandOption: true,
          })
          .positional('row', {
            describe: 'Row coordinate for the pixel',
            type: 'number',
            demandOption: true,
          })
          .positional('col', {
            describe: 'Column coordinate for the pixel',
            type: 'number',
            demandOption: true,
          });
      },
    )
    .help()
    .parseSync() as unknown as { username: string; row: number; col: number };

  drawPixel(argv.username, argv.row, argv.col);
}
