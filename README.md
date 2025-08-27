# RSS Place

A Reddit r/place-style collaborative pixel art application using Redpanda (Kafka) as the data store.

## Overview

This app allows users to place colored pixels on a shared grid, similar to Reddit's r/place. All pixel placements are stored as messages in a Redpanda topic, creating a persistent, event-sourced system where the current state can be reconstructed from the message history.

## Architecture

- **Message Format**: Each pixel placement follows the schema:
  ```json
  {
    "user": "string",
    "color": { "r": 0-255, "g": 0-255, "b": 0-255 },
    "loc": { "row": "u32", "col": "u32" }
  }
  ```

- **Data Storage**: 
  - Messages are stored in Redpanda topic `drew-place`
  - Current grid state is maintained in `state.json` for fast access
  - State maps coordinates `"row,col"` to `{user, color}` objects

- **Message Processing**:
  - Uses fixed consumer group `rss-place-state-manager` for incremental processing
  - Only reads new messages after initial state build
  - Later messages override earlier ones for the same coordinates

## Current Implementation

### Scripts

- `pnpm draw <username> <row> <col>` - Places a white pixel at the specified coordinates
- `pnpm read` - Reads new messages from the topic and updates the local state

### Files

- `src/schema.ts` - Zod schema for message validation
- `src/draw.ts` - Script for writing pixel messages to the topic
- `src/read.ts` - Script for reading messages and maintaining state
- `src/mapState.ts` - State management utilities
- `state.json` - Persistent grid state storage

### Features Implemented

✅ Message writing to Redpanda topic  
✅ Message reading with Zod validation  
✅ Persistent state management  
✅ Incremental message processing  
✅ Coordinate-based pixel overwriting  
✅ Error handling for invalid messages  

## Next Steps

The general plan is to build this into a full r/place experience:

1. **Terminal Rendering** - Display the current grid state in the terminal with colors
2. **Interactive Interface** - Allow users to select coordinates and colors interactively
3. **Real-time Updates** - Stream live updates as other users place pixels
4. **Web Interface** (future) - Build a web UI for better user experience
5. **Color Palette** - Expand beyond white pixels to full color support
6. **Grid Constraints** - Add configurable grid size limits
7. **Rate Limiting** - Prevent spam by limiting user placement frequency

## Usage

```bash
# Place a pixel
pnpm draw alice 10 15

# Update local state with new messages
pnpm read

# Check current state
cat state.json
```

## Environment

Requires environment variables for Redpanda connection:
- `REDPANDA_BROKERS` - Comma-separated broker list
- `RP_SECURITY_PROTOCOL` - Security protocol (SASL_SSL or plain)
- `REDPANDA_USER` - Username for SASL authentication
- `REDPANDA_PASS` - Password for SASL authentication
