[![smithery badge](https://smithery.ai/badge/@xonack/apex-mcp)](https://smithery.ai/server/@xonack/apex-mcp) 



# MCP Server for X (Twitter) Management 
### Powered by Apex

Manage your X (Twitter) fully with a single API Key. Built using [Apex](https://apexagents.ai) social media infrastructure.

Supported platforms:
- X

## Functions:
### Tweet Management
- get tweet - Get detailed information about a specific tweet
- search tweets - Search tweets with advanced filtering (including replies)
- generate reply - Generate AI-powered reply suggestions for text/images
- post tweet - Post new tweets with optional images
- post reply - Post replies to existing tweets

### List Management
- create list - Create new X/Twitter lists
- get user lists - Retrieve all lists owned by the authenticated user
- get list - Get detailed information about a specific list
- get list members - Get members of a list with pagination support
- add list member - Add users to X/Twitter lists
- update list - Update existing list properties
- delete list - Delete X/Twitter lists

## Example Usage

### Search Tweets
The search tool uses structured parameters (no `query` parameter). Here's an example request:

```json
{
  "count": 20,
  "minLikes": 100,
  "includeWords": [
    "bitcoin",
    "treasury"
  ],
  "startDate": "2025-06-16",
  "onlyOriginal": true
}
```

This searches for original tweets (not retweets) containing "bitcoin" and "treasury" with at least 100 likes since June 16, 2025.

## Apex Set Up

1. Create an account at [Apex](https://apexagents.ai).
2. Request an [API Key](https://t.me/xonack).
3. Review [Apex API Docs](https://api.apexagents.ai)

## Quick Start with Smithery (Recommended)

Install with Smithery [here](https://smithery.ai/server/@xonack/apex-mcp).

## Building MCPB Bundles

Create installable MCPB bundles for Claude Desktop:

### Prerequisites

```bash
# Install MCPB CLI globally
npm install -g @anthropic-ai/mcpb
```

### Build Process

```bash
# Clone and setup
git clone https://github.com/xonack/apex-mcp.git
cd apex-mcp
npm install

# Build the bundle
npm run mcpb:build
```

This creates `apex-mcp.mcpb` file that can be installed directly in Claude Desktop.

### Installation

1. Open Claude Desktop
2. Go to Settings → Extensions
3. Click "Install Extension" 
4. Select the `apex-mcp.mcpb` file
5. Configure your Apex API key and URL

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
      "args":["/absolute/path/to/apex-mcp-stdio/dist/index.js", "<APEX API KEY>", "api.apexagents.ai"]
    }
  }
}
```

Open [Claude Desktop](https://claude.ai/download) to verify connection.
