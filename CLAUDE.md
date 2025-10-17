# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential First Step
**ALWAYS run this at the beginning of any new session:**
```bash
npm run extract-api-docs
```
This extracts the latest Apex API documentation to `docs/apex-api-spec.json` for reference during development. The API may change frequently, so fresh documentation is critical for accurate development.

### Build the project
```bash
npm run build
```
Creates a production build in the `dist/` directory with executable permissions and shebang line added.

### Development mode
```bash
# Run with TypeScript transpiler (tsx) for development
npm run dev

# Run in STDIO mode (for MCP testing with Claude Desktop)
npm run dev:stdio
```

### Watch mode
```bash
npm run watch
```
Continuously rebuilds TypeScript files on changes.

### Production
```bash
# Run the built version
npm start

# Run in STDIO mode
npm run start:stdio
```

### MCPB Bundle Creation
```bash
# Build MCPB bundle for Claude Desktop
npm run mcpb:build

# Or pack existing build
npm run mcpb:pack
```
Creates `apex-mcp.mcpb` file for direct installation in Claude Desktop extensions.

## Architecture

This is a Model Context Protocol (MCP) server that integrates with the Apex API to provide Twitter/X functionality. The codebase supports multiple deployment scenarios:

### Entry Points
1. **src/index.ts** - Main entry point that supports both STDIO (for Claude Desktop) and HTTP (for web deployment) transports
2. **src/smithery.ts** - Smithery-compatible export for deployment on the Smithery platform
3. **src/server.ts** - Core MCP server factory that creates the server instance with all tool implementations

### Deployment Options
- **MCPB Bundles**: Create `.mcpb` files for direct Claude Desktop installation
- **Smithery Cloud**: Deploy to Smithery marketplace for cloud-based access
- **Manual Setup**: Direct npm installation and configuration

### Transport Modes
- **STDIO Mode**: Used by Claude Desktop for direct communication (set `MCP_TRANSPORT=stdio`)
- **HTTP Mode**: Used for web deployment, creates an Express server on configured port

### Authentication
All API requests require:
- Bearer token authentication via `APEX_API_KEY` environment variable
- API URL configuration (defaults to `https://api.apexagents.ai`)
- Consumer-Type header set to 'mcp'

### Tool Implementation Pattern
Each tool in `server.ts` follows this pattern:
1. Validates input using Zod schemas
2. Calls `makeApexRequest` helper with appropriate endpoint and parameters
3. Returns formatted response using `createToolResponse`
4. Handles errors with `handleToolError`

## API Documentation Reference

The complete Apex API specification is available at `docs/apex-api-spec.json` after running the extraction tool. This file contains:
- All available endpoints (currently 24)
- Request/response schemas  
- Parameter definitions
- Authentication requirements

**Key endpoints currently implemented in the MCP server:**
- `/apex/tweet/search` - Search tweets with structured parameters
- `/apex/tweet/{id}/details` - Get tweet details
- `/apex/tweet/{id}/reply` - Generate/post replies
- `/apex/tweet` - Post tweets
- `/apex/list/*` - List management operations

**Reference this documentation when:**
- Adding new MCP tools
- Understanding parameter structures
- Implementing new API endpoints
- Debugging API responses

## Tool Synchronization Requirements

**CRITICAL: Before ANY commit, verify tool synchronization across all files:**

### Pre-Commit Validation Checklist

1. **Extract tools from server.ts** (source of truth):
   ```bash
   grep -n "server\.tool(" src/server.ts | grep -o '"[^"]*"' | head -n 1
   ```

2. **Verify manifest.json tools array matches exactly**:
   - All tool names must match server.ts implementations
   - All descriptions should be concise and accurate
   - Count must match: currently 13 tools

3. **Update README.md Functions section**:
   - Group tools logically (Tweet Management, List Management)
   - Include brief description for each tool
   - Must include all 13 tools from server.ts

4. **Files requiring synchronization**:
   - `src/server.ts` - Source of truth (actual implementations)
   - `manifest.json` - MCPB bundle tool definitions (13 tools)
   - `README.md` - User documentation functions list (13 tools)

### Validation Commands

```bash
# Count tools in server.ts
grep -c "server\.tool(" src/server.ts

# Count tools in manifest.json (tools array only)
jq '.tools | length' manifest.json

# Extract tool names from server.ts
grep -A1 "server\.tool(" src/server.ts | grep '"' | cut -d'"' -f2

# Extract tool names from manifest.json
jq -r '.tools[].name' manifest.json
```

**If counts don't match, synchronization is REQUIRED before commit.**

## Important Notes

- **All files must be written in TypeScript (.ts) unless technologically impossible**
- Use `tsx` for running TypeScript files during development
- No linting or testing setup currently exists
- The project uses ES modules (`"type": "module"` in package.json)
- TypeScript compilation targets ES2022 with Node16 module resolution
- The search_tweets tool does NOT have a 'query' parameter - use structured parameters instead (see README.md for examples)