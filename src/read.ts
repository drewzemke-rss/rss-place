import { Kafka } from "kafkajs";
import "dotenv/config";
import { loadMapState, saveMapState, updateMapState } from "./mapState";
import { PlaceMessageSchema } from "./schema";

const TOPIC = "drew-place";

const kafka = new Kafka({
	clientId: "rss-place-reader",
	brokers: process.env.REDPANDA_BROKERS?.split(",") || ["localhost:9092"],
	ssl: process.env.RP_SECURITY_PROTOCOL === "SASL_SSL",
	sasl:
		process.env.RP_SECURITY_PROTOCOL === "SASL_SSL"
			? {
					mechanism: "scram-sha-512",
					username: process.env.REDPANDA_USER || "",
					password: process.env.REDPANDA_PASS || "",
				}
			: undefined,
	connectionTimeout: 10000,
	requestTimeout: 30000,
});

// Get username from command line arguments
const username = process.argv[2];
if (!username) {
	console.error("Usage: tsx src/read.ts <username>");
	process.exit(1);
}

const groupId = `rss-place-${username}`;
const consumer = kafka.consumer({ groupId });

async function readMessages(): Promise<void> {
	try {
		const mapState = loadMapState();

		await consumer.connect();
		console.log("Connected to Redpanda");
		console.log(`Using consumer group: ${groupId}`);

		await consumer.subscribe({ topic: TOPIC, fromBeginning: true });
		console.log(`Subscribed to topic: ${TOPIC} (new messages only)`);

		let messageCount = 0;
		let lastMessageTime = Date.now();

		await consumer.run({
			eachMessage: async ({ topic, partition, message }) => {
				lastMessageTime = Date.now();

				if (message.value) {
					try {
						const rawMessage = message.value.toString();
						const parsed = JSON.parse(rawMessage);
						const validMessage = PlaceMessageSchema.parse(parsed);

						updateMapState(mapState, validMessage);
						messageCount++;
						console.log(
							`${validMessage.user} set (${validMessage.loc.row}, ${validMessage.loc.col}) to RGB(${validMessage.color.r}, ${validMessage.color.g}, ${validMessage.color.b})`,
						);
					} catch (error) {
						console.log(
							`Skipping invalid message: ${message.value.toString()}`,
						);
					}
				}
			},
		});

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
		console.error("Error reading messages:", error);
		process.exit(1);
	}
}

async function shutdown(): Promise<void> {
	console.log("Shutting down...");
	await consumer.disconnect();
	process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

readMessages();
