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

- `Arrow Keys` / `hjkl` - Move cursor around the canvas
- `Enter` or `Space` - Draw a pixel at cursor position
- `r/g/b` - Cycle red/green/blue component by +1 (0→1→2...→255→0)
- `R/G/B` - Cycle red/green/blue component by +64 (0→64→128→192→255→63→127...)
- `W` - Set color to white
- `C` - Set color to black
- `w` - Brighten color (increase all RGB values by 1)
- `c` - Darken color (decrease all RGB values by 1)
- `x` - Set color to a random RGB value
- `p` - Eye dropper tool: set current color to the pixel color under cursor 
- `Ctrl+C` - Exit the application

The bottom line shows your username, cursor coordinates, and current color with a color swatch.
