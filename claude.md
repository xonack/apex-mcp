# Desktop Extensions (DXT) and Model Context Protocol (MCP) Development Guide

## Model Context Protocol (MCP)
MCP is an open protocol that standardizes how applications provide context to Large Language Models (LLMs). Think of it as "a USB-C port for AI applications" - providing a universal, plug-and-play approach to connect AI models to different data sources and tools.

### MCP Features
- Direct connection to remote MCP servers via Messages API
- File system read/write capabilities
- Consistent interface for context provision across applications
- Support for tools, resources, and prompts

## Desktop Extensions (DXT)
Desktop Extensions simplify the installation and use of MCP servers by creating a standardized packaging format. They enable one-click installation of local MCP servers with bundled dependencies and configuration.

### DXT Structure
A .dxt file is a ZIP archive containing:
- `manifest.json` (required) - Defines server configuration and user settings
- Server implementation files
- Dependencies
- Optional icon and assets

### Supported Server Types
1. **Node.js** - Include entire `node_modules/` directory
2. **Python** - Bundle packages in `server/lib/` or use virtual environment
3. **Binary** - Prefer static linking, include shared libraries if needed

### Development Workflow
1. Initialize manifest: `npx @anthropic-ai/dxt init`
2. Configure user settings in manifest.json
3. Implement MCP server with required protocol handlers
4. Package extension: `npx @anthropic-ai/dxt pack`
5. Test locally before submission

### Key Implementation Details for MCP Servers
- Must handle `resources/list` and `prompts/list` requests (even if returning empty arrays)
- Register appropriate capabilities before handling requests
- Use proper error handling and logging
- Support stdio transport for communication

## Resources
- DXT Documentation: https://www.anthropic.com/engineering/desktop-extensions
- DXT Repository: https://github.com/anthropics/dxt
- MCP Documentation: https://docs.anthropic.com/en/docs/mcp
- MCP Protocol Spec: https://modelcontextprotocol.io