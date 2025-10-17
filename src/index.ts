import 'dotenv/config';
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from 'express';
import { createMCPServerInstance } from './server.js';

// Parse and validate environment variables
const bearerToken = process.env.APEX_API_KEY;
const apiUrl = process.env.APEX_API_URL || "https://api.apexagents.ai";

if (!bearerToken) {
  console.error("Please provide APEX_API_KEY environment variable");
  process.exit(1);
}

// Type assertion after validation
const validatedBearerToken: string = bearerToken;


// STDIO mode setup
async function setupSTDIOMode() {
  console.error('🔧 Using STDIO transport for local development');
  const server = createMCPServerInstance(validatedBearerToken, apiUrl);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🚀 Apex MCP Server started with STDIO transport');
}

// HTTP mode setup
async function setupHTTPMode() {
  const port = parseInt(process.env.PORT || '3000');
  const host = process.env.HOST || '0.0.0.0';
  
  console.error(`🌐 Starting Express server on ${host}:${port}`);
  
  const app = express();
  app.use(express.json());
  
  app.post('/mcp', async (req, res) => {
    try {
      const server = createMCPServerInstance(validatedBearerToken, apiUrl);
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error('MCP request error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  app.listen(port, host, () => {
    console.error(`📡 MCP Server listening on http://${host}:${port}/mcp`);
    console.error(`🚀 Apex MCP Server started with HTTP transport`);
  });
}


// Main execution
async function main() {
  if (process.env.MCP_TRANSPORT === 'stdio') {
    await setupSTDIOMode();
  } else {
    await setupHTTPMode();
  }
}

main().catch(console.error);
