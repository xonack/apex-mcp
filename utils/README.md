# Utilities

This directory contains utility scripts for the Apex MCP project.

## extract-api-docs.ts

Extracts the API specification from the Apex API documentation page using Puppeteer.

### Usage

```bash
# Install dependencies first (includes Puppeteer)
npm install

# Run the extraction script
npm run extract-api-docs
```

### What it does

1. Opens the Apex API documentation page at https://api.apexagents.ai/api#/
2. Waits for the Swagger UI to load completely
3. Attempts to extract the API specification using multiple methods:
   - Network request interception (catches JSON responses)
   - JavaScript evaluation (checks common global variables)
   - Script tag parsing (searches for embedded JSON)
4. Saves the extracted specification to `docs/apex-api-spec.json`
5. Provides console output with extraction progress and API details

### Output

- **Success**: Creates `docs/apex-api-spec.json` with the complete API specification
- **Failure**: Creates `docs/debug-page.html` with the rendered page for debugging

### Requirements

- Node.js 18+
- Puppeteer (automatically installed with `npm install`)
- Internet connection to access the API documentation

### Troubleshooting

If extraction fails:
1. Check the console output for specific error messages
2. Verify the API documentation URL is accessible
3. Check if `docs/debug-page.html` was created for manual inspection
4. The API documentation might require authentication or have changed structure