import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListResourcesRequestSchema, ListPromptsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

// Parse and validate environment variables
const bearerToken = process.env.APEX_API_KEY;
const apiUrl = process.env.APEX_API_URL || "https://api.apexagents.ai";

if (!bearerToken) {
  console.error("Please provide APEX_API_KEY environment variable");
  process.exit(1);
}


// Helper function for making API requests
async function makeApexRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${apiUrl}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${bearerToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed (${response.status}): ${response.statusText}`);
  }

  return response.json();
}

// Helper function for formatting tool responses
function createToolResponse(data: any, isError = false) {
  return {
    content: [
      {
        type: "text" as const,
        text: typeof data === 'string' ? data : JSON.stringify(data, null, 2)
      }
    ],
    isError
  };
}

// Helper function for handling tool errors
function handleToolError(error: unknown) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
  console.error('Tool execution error:', errorMessage);
  return createToolResponse(`Error: ${errorMessage}`, true);
}

// Create MCP server
const server = new McpServer({
  name: "apex-mcp",
  version: "1.0.0"
});

// Add resources capability and handler (currently no resources defined)
server.server.registerCapabilities({
  resources: {
    subscribe: false,
    listChanged: false
  }
});

server.server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: []
  };
});

// Add prompts capability and handler (currently no prompts defined)
server.server.registerCapabilities({
  prompts: {
    listChanged: false
  }
});

server.server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: []
  };
});

// Register the GetTweetTool
const getTweetTool = server.tool(
  "get_tweet",
  "A tool to get a tweet by its id.",
  { id: z.string().describe("Id of the tweet to get.") },
  async ({ id }) => {
    try {
      const data = await makeApexRequest(`/apex/tweet/${id}/details`);
      return createToolResponse(data);
    } catch (error) {
      return handleToolError(error);
    }
  }
);

// Register the GenerateReplyTool
const generateReplyTool = server.tool(
  "generate_reply",
  "Tool that generates a reply to a message.",
  { 
    text: z.string().describe("Text to be replied to."),
    image_urls: z.array(z.string()).optional().describe("Array of image URLs used as context for the reply. If not provided, the reply will be to only text.")
  },
  async ({ text, image_urls }) => {
    try {
      const params = new URLSearchParams();
      params.append('text', text);
      
      if (image_urls && image_urls.length > 0) {
        image_urls.forEach((url: string) => {
          params.append('image_url', url);
        });
      }

      // Note: This endpoint uses GET with query params
      const response = await fetch(`${apiUrl}/apex/reply?${params.toString()}`, {
        method: "GET",
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed (${response.status}): ${response.statusText}`);
      }

      const data = await response.json();
      return createToolResponse(data);
    } catch (error) {
      return handleToolError(error);
    }
  }
);

// Register the GenerateReplyToTweetTool
const generateReplyToTweetTool = server.tool(
  "generate_reply_to_tweet",
  "A tool to generate a reply suggestion to a tweet. Use if you don't have any context to generate a reply yet.",
  { 
    id: z.string().describe("Id of the tweet to generate a reply to")
  },
  async ({ id }) => {
    try {
      const data = await makeApexRequest(`/apex/tweet/${id}/reply`);
      return createToolResponse(data);
    } catch (error) {
      return handleToolError(error);
    }
  }
);

// Register the PostTweetTool
const postTweetTool = server.tool(
  "post_tweet",
  "Tool that posts a tweet.",
  { 
    username: z.string().describe("Username of the user posting the tweet."),
    text: z.string().describe("Text of the tweet to be posted."),
    image_urls: z.array(z.string()).optional().describe("Optional image URLs to include with the tweet.")
  },
  async ({ username, text, image_urls }) => {
    try {
      const data = await makeApexRequest('/apex/tweet', {
        method: 'POST',
        body: JSON.stringify({ 
          username,
          text,
          image_urls
        }),
      });
      return createToolResponse(data);
    } catch (error) {
      return handleToolError(error);
    }
  }
);

// Register the PostReplyToTweetTool
const postReplyToTweetTool = server.tool(
  "post_reply_to_tweet",
  "Tool that posts a reply to a tweet with input text & optional image.",
  { 
    tweet_id: z.string().describe("Id of the tweet to reply to."),
    text: z.string().describe("Text of the reply to be posted.")
  },
  async ({ tweet_id, text }) => {
    try {
      const data = await makeApexRequest(`/apex/tweet/${tweet_id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
      return createToolResponse(data);
    } catch (error) {
      return handleToolError(error);
    }
  }
);

// Register the SearchTweetsTool
const searchTweetsTool = server.tool(
  "search_tweets",
  "A tool to search for tweets by a given query.",
  {
    count: z.number().optional().describe("Number of tweets to return"),
    cursor: z.string().optional().describe("The pagination cursor for next batch of results."),
    endDate: z.string().optional().describe("The date upto which tweets are to be searched."),
    excludeWords: z.array(z.string()).optional().describe("The list of words to exclude from search."),
    fromUsers: z.array(z.string()).optional().describe("The list of usernames whose tweets are to be searched. '@' must be excluded from the username!"),
    hashtags: z.array(z.string()).optional().describe("The list of hashtags to search. '#' must be excluded from the hashtag!"),
    includePhrase: z.string().optional().describe("The exact phrase to search."),
    includeWords: z.array(z.string()).optional().describe("The list of words to search."),
    language: z.string().optional().describe("The language of the tweets to search."),
    list: z.string().optional().describe("The list from which tweets are to be searched."),
    maxId: z.string().optional().describe("The id of the tweet, before which the tweets are to be searched."),
    mentions: z.array(z.string()).optional().describe("The list of username mentioned in the tweets to search. '@' must be excluded from the username!"),
    minLikes: z.number().optional().describe("The minimun number of likes to search by."),
    minReplies: z.number().optional().describe("The minimum number of replies to search by."),
    minRetweets: z.number().optional().describe("The minimum number of retweets to search by."),
    onlyLinks: z.boolean().optional().describe("Whether to search only for tweets with links."),
    onlyOriginal: z.boolean().optional().describe("Whether to search only for original tweets."),
    onlyReplies: z.boolean().optional().describe("Whether to search only for replies."),
    onlyText: z.boolean().optional().describe("Whether to search only for text tweets."),
    optionalWords: z.array(z.string()).optional().describe("The optional words to search."),
    quoted: z.string().optional().describe("The id of the tweet which is quoted in the tweets to search."),
    sinceId: z.string().optional().describe("The id of the tweet, after which the tweets are to be searched."),
    startDate: z.string().optional().describe("The date starting from which tweets are to be searched."),
    top: z.boolean().optional().describe("Whether to fetch top tweets or not."),
    toUsers: z.array(z.string()).optional().describe("The list of username to whom the tweets to be searched, are adressed. '@' must be excluded from the username!")
  },
  async (input) => {
    try {
      const params = new URLSearchParams();

      for (const key in input) {
        if (input[key as keyof typeof input] !== undefined) {
          const value = input[key as keyof typeof input];
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else {
            params.append(key, String(value));
          }
        }
      }

      // Note: Search endpoint uses GET with query params, so we use direct fetch
      const response = await fetch(`${apiUrl}/apex/tweet/search?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${bearerToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Search request failed (${response.status}): ${response.statusText}`);
      }

      const data = await response.json();
      return createToolResponse(data);
    } catch (error) {
      return handleToolError(error);
    }
  }
);

// Validate API connectivity before starting server
async function validateApiConnection() {
  try {
    console.error(`Validating API connection to ${apiUrl}...`);
    // Simple connectivity test - we don't need a valid endpoint, just check if the host is reachable
    const response = await fetch(apiUrl, {
      method: 'HEAD',
      headers: {
        'Authorization': `Bearer ${bearerToken}`
      }
    });
    console.error(`API connectivity check completed (status: ${response.status})`);
  } catch (error) {
    console.error(`Warning: Could not validate API connectivity: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.error('Server will continue but API calls may fail');
  }
}

// Start the server with proper error handling
async function startServer() {
  try {
    console.error('Starting Apex MCP Server...');
    console.error(`Bearer Token: ${bearerToken ? '***' + bearerToken.slice(-4) : 'Not provided'}`);
    console.error(`API URL: ${apiUrl}`);
    
    await validateApiConnection();
    
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Apex MCP Server started successfully');
  } catch (error) {
    console.error('Failed to start server:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

startServer();