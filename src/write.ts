import { Kafka } from 'kafkajs';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import 'dotenv/config';
import type { PlaceMessage } from './schema';

const TOPIC = 'drew-place';

const kafka = new Kafka({
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

const producer = kafka.producer();

async function drawPixel(
  user: string,
  row: number,
  col: number,
): Promise<void> {
  try {
    await producer.connect();
    console.log('Connected to Redpanda');

    const message: PlaceMessage = {
      user,
      color: { r: 255, g: 255, b: 255 },
      loc: { row, col },
    };

    await producer.send({
      topic: TOPIC,
      messages: [
        {
          value: JSON.stringify(message),
        },
      ],
    });

    console.log(`Drew white pixel at (${row}, ${col}) for user: ${user}`);

    await producer.disconnect();
  } catch (error) {
    console.error('Error drawing pixel:', error);
    process.exit(1);
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
