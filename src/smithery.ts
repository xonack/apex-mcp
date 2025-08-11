import { z } from "zod";
import { createMCPServerInstance } from './server.js';

// Configuration schema for Smithery
export const configSchema = z.object({
  bearerToken: z.string().describe("Enter your Apex Bearer Token"),
  apiUrl: z.string().describe("Enter your Apex API URL.").default("https://api.apexagents.ai")
});

// Smithery-compatible export
export default function ({ config }: { config: z.infer<typeof configSchema> }) {
  const server = createMCPServerInstance(config.bearerToken, config.apiUrl);
  
  // Return the underlying server instance as required by Smithery
  return server.server;
}