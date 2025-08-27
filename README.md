# RSS Place

A terminal-based collaborative pixel art application using Redpanda (Kafka) as the data store.

## Usage

### .env Setup

Requires environment variables for Redpanda connection:
- `REDPANDA_BROKERS`
- `RP_SECURITY_PROTOCOL`
- `REDPANDA_USER`
- `REDPANDA_PASS`

### CLI Usage

```bash
pnpm start --username <your-name>
```

#### CLI Flags
- `--username, -u <name>` - Your username (required)
- `--logfile <path>` - File to write logs to (optional)
- `--reset, -r` - Reset state by reading from topic beginning (optional)

### Keyboard Controls

- `Arrow Keys` - Move cursor around the canvas
- `Enter` - Draw a pixel at cursor position
- `Ctrl+C` - Exit the application
