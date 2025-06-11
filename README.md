# apex-mcp-stdio

A Model Context Protocol (MCP) server to interface with the [Apex](https://apexagents.ai) social media infrastructure.

Supported platforms:
- X

## Functions:
- get tweet
- search tweets (including replies)
- generate reply
- post tweet
- post reply

## Set Up

1. Create an account at [Apex](https://apexagents.ai).
2. Request an [API Key](https://t.me/xonack).

## Quick Start

Create `.env` file:
```.env
APEX_BEARER_TOKEN=<Your-Apex-Token>
APEX_API_URL=<Apex-API-Url>
```

```bash
# Install dependencies
npm install

# Build the project
npm run build

```

## Using with Claude Desktop

### Local Development

Add this configuration to your Claude Desktop config file:

**MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "apex-mcp-server": {
      "command": "node",
      "args":["/absolute/path/to/apex-mcp-stdio/dist/index.js"]
    }
  }
}
```
