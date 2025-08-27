import { type Consumer, Kafka, logLevel } from 'kafkajs';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import 'dotenv/config';
import { type PlaceMessage, PlaceMessageSchema } from './schema';
import {
  loadMapState,
  type MapState,
  saveMapState,
  updateMapState,
} from './state';

const TOPIC = 'drew-place';

function createKafkaClient(): Kafka {
  return new Kafka({
    clientId: 'rss-place-reader',
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
    logLevel: logLevel.NOTHING,
  });
}

export async function createConsumer(
  username: string,
  onMessage: (message: PlaceMessage, state: MapState) => void,
  onError: (error: string) => void,
  logger: (message: string) => void = console.log,
): Promise<{ consumer: Consumer; state: MapState }> {
  const kafka = createKafkaClient();
  const groupId = `rss-place-${username}`;
  const consumer = kafka.consumer({ groupId });
  const state = loadMapState();

  await consumer.connect();
  logger('Connected to Redpanda');
  logger(`Using consumer group: ${groupId}`);

  await consumer.subscribe({ topic: TOPIC, fromBeginning: true });
  logger(`Subscribed to topic: ${TOPIC}`);

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (message.value) {
        try {
          const rawMessage = message.value.toString();
          const parsed = JSON.parse(rawMessage);
          const validMessage = PlaceMessageSchema.parse(parsed);

          updateMapState(state, validMessage);
          onMessage(validMessage, state);
        } catch {
          onError(`Invalid message: ${message.value?.toString()}`);
        }
      }
    },
  });

  return { consumer, state };
}

// CLI for testing
if (require.main === module) {
  const argv = yargs(hideBin(process.argv))
    .command('$0 <username>', 'Read messages from the place topic', (yargs) => {
      return yargs.positional('username', {
        describe: 'Username for the consumer group',
        type: 'string',
        demandOption: true,
      });
    })
    .help()
    .parseSync() as unknown as { username: string };

  const username = argv.username;

  let messageCount = 0;
  let lastMessageTime = Date.now();
  let consumer: Consumer;
  let mapState: MapState;

  async function readMessages(): Promise<void> {
    try {
      const result = await createConsumer(
        username,
        (message) => {
          messageCount++;
          lastMessageTime = Date.now();
          console.log(
            `${message.user} set (${message.loc.row}, ${message.loc.col}) to RGB(${message.color.r}, ${message.color.g}, ${message.color.b})`,
          );
        },
        (error) => console.log(`Skipping ${error}`),
      );

      consumer = result.consumer;
      mapState = result.state;

      // Check periodically if we should exit
      const checkInterval = setInterval(() => {
        if (Date.now() - lastMessageTime > 2000) {
          console.log(`\nProcessed ${messageCount} new messages`);
          if (messageCount > 0) {
            saveMapState(mapState);
          }
          clearInterval(checkInterval);
          shutdown();
        }
      }, 1000);
    } catch (error) {
      console.error('Error reading messages:', error);
      process.exit(1);
    }
  }

  async function shutdown(): Promise<void> {
    console.log('Shutting down...');
    if (consumer) {
      await consumer.disconnect();
    }
    process.exit(0);
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  readMessages();
}
