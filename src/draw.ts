import { Kafka } from "kafkajs";
import "dotenv/config";
import { PlaceMessage } from "./schema";

const TOPIC = "drew-place";

const kafka = new Kafka({
	clientId: "rss-place-producer",
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

const producer = kafka.producer();

async function drawPixel(user: string, row: number, col: number): Promise<void> {
	try {
		await producer.connect();
		console.log("Connected to Redpanda");

		const message: PlaceMessage = {
			user,
			color: { r: 255, g: 255, b: 255 },
			loc: { row, col }
		};

		await producer.send({
			topic: TOPIC,
			messages: [
				{
					value: JSON.stringify(message)
				}
			]
		});

		console.log(`Drew white pixel at (${row}, ${col}) for user: ${user}`);
		
		await producer.disconnect();
	} catch (error) {
		console.error("Error drawing pixel:", error);
		process.exit(1);
	}
}

const args = process.argv.slice(2);
if (args.length !== 3) {
	console.error("Usage: pnpm draw <username> <row> <col>");
	process.exit(1);
}

const [user, rowStr, colStr] = args;
const row = parseInt(rowStr, 10);
const col = parseInt(colStr, 10);

if (isNaN(row) || isNaN(col)) {
	console.error("Row and column must be valid numbers");
	process.exit(1);
}

drawPixel(user, row, col);