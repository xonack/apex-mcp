[![smithery badge](https://smithery.ai/badge/@xonack/apex-mcp)](https://smithery.ai/server/@xonack/apex-mcp)

# MCP Server for X (Twitter) Management 
### Powered by Apex

Manage your X (Twitter) fully with a single API Key. Built using [Apex](https://apexagents.ai) social media infrastructure.

Supported platforms:
- X

## Functions:
- get tweet
- search tweets (including replies)
- generate reply
- post tweet
- post reply

## Apex Set Up

1. Create an account at [Apex](https://apexagents.ai).
2. Request an [API Key](https://t.me/xonack).

## Quick Start with Smithery (Recommended)

Install with Smithery [here](https://smithery.ai/server/@xonack/apex-mcp).



## Manual Set Up

Clone Repo.

Run commands:

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
      "args":["/absolute/path/to/apex-mcp-stdio/dist/index.js", "<APEX API KEY>", "<APEX URL>"]
    }
  }
}
```

Open [Claude Desktop](https://claude.ai/download) to verify connection.
