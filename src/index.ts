import { MCPServer } from "mcp-framework";
import dotenv from 'dotenv';

dotenv.config({ path: "/Users/JFH/Desktop/all/apex/apex-mcp-server/.env" });

const server = new MCPServer();

server.start();