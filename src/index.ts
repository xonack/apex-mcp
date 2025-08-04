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
async function makeApexRequest(
  endpoint: string, 
  options: RequestInit & { queryParams?: URLSearchParams | Record<string, any> } = {}
) {
  // Handle query parameters if provided
  let url = `${apiUrl}${endpoint}`;
  if (options.queryParams) {
    const params = options.queryParams instanceof URLSearchParams 
      ? options.queryParams 
      : new URLSearchParams(options.queryParams);
    url += `?${params.toString()}`;
  }
  
  // Build headers - only add Content-Type for requests with body
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${bearerToken}`,
    'Consumer-Type': 'mcp',
  };
  
  // Only add Content-Type for requests with body
  if (options.body && options.method?.toUpperCase() !== 'GET') {
    headers['Content-Type'] = 'application/json';
  }
  
  // Merge with any provided headers
  if (options.headers) {
    Object.assign(headers, options.headers);
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
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

      const data = await makeApexRequest('/apex/reply', {
        method: 'GET',
        queryParams: params,
        headers: {
          'accept': 'application/json'
        }
      });
      
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
  `Advanced Twitter/X search tool for finding tweets with powerful filtering capabilities.
  
  Returns tweets matching your criteria, sorted by relevance or time. Expect 2-5 second response times.
  Note: API may return duplicate entries - this is normal behavior.
  
  Common patterns:
  • High-quality content: Set minLikes to 100+ and use includeWords for topics
  • Viral analysis: Use minRetweets 50+ with hashtags and top=true
  • User analysis: Combine fromUsers with date ranges and engagement filters
  • Content exclusion: Use excludeWords to filter out unwanted topics`,
  {
    count: z.number().optional().describe("Number of tweets to return. Recommended: 50 for comprehensive results, 20 for quick scans. Max practical limit ~50."),
    cursor: z.string().optional().describe("Pagination cursor for next batch of results. Use the cursor from previous response to get more results."),
    endDate: z.string().optional().describe("End date for search range. Format: YYYY-MM-DD (e.g., '2025-07-30')"),
    excludeWords: z.array(z.string()).optional().describe("Words to exclude from results. Format: ['word1', 'word2']. Useful for filtering out unwanted topics like ['crypto', 'spam']"),
    fromUsers: z.array(z.string()).optional().describe("Search tweets FROM these users. Format: ['username'] WITHOUT @ symbol. Example: ['elonmusk', 'OpenAI'] NOT ['@elonmusk', '@OpenAI']"),
    hashtags: z.array(z.string()).optional().describe("Hashtags to search for. Format: ['tag1', 'tag2'] WITHOUT # symbol. Example: ['AI', 'web3'] NOT ['#AI', '#web3']"),
    includePhrase: z.string().optional().describe("Exact phrase to search for. Will match this exact sequence of words in tweets."),
    includeWords: z.array(z.string()).optional().describe("Words that must appear in results. Format: ['word1', 'word2']. Example: ['AI', 'machine learning'] to find tweets about AI/ML"),
    language: z.string().optional().describe("Language filter using ISO codes. Examples: 'en' (English), 'es' (Spanish), 'fr' (French), 'de' (German), 'ja' (Japanese)"),
    list: z.string().optional().describe("Twitter/X list ID to search within. Limits results to tweets from members of this list."),
    maxId: z.string().optional().describe("Tweet ID upper bound - only return tweets with IDs less than this. Useful for pagination backwards in time."),
    mentions: z.array(z.string()).optional().describe("Find tweets mentioning these users. Format: ['username'] WITHOUT @ symbol. Example: ['JensHonack'] NOT ['@JensHonack']"),
    minLikes: z.number().optional().describe("Minimum likes threshold. Use 50+ for social proof, 100+ for popular content, 1000+ for viral tweets"),
    minReplies: z.number().optional().describe("Minimum replies threshold. Useful for finding tweets that sparked discussion. Try 10+ for engaged conversations"),
    minRetweets: z.number().optional().describe("Minimum retweets threshold. Use 10+ for shared content, 50+ for viral reach, 100+ for highly viral"),
    onlyLinks: z.boolean().optional().describe("Set to true to find only tweets containing URLs. Useful for finding shared articles, resources, or media"),
    onlyOriginal: z.boolean().optional().describe("Set to true to exclude retweets and quote tweets. Gets only original content from users"),
    onlyReplies: z.boolean().optional().describe("Set to true to find only reply tweets. Useful for analyzing conversations and discussions"),
    onlyText: z.boolean().optional().describe("Set to true to exclude tweets with media (photos/videos). Gets text-only content"),
    optionalWords: z.array(z.string()).optional().describe("Optional words that may appear. Format: ['word1', 'word2']. Tweets may contain any of these words"),
    quoted: z.string().optional().describe("Tweet ID to find quote tweets of. Returns all tweets that quote this specific tweet"),
    sinceId: z.string().optional().describe("Tweet ID lower bound - only return tweets with IDs greater than this. Useful for getting new tweets since last search"),
    startDate: z.string().optional().describe("Start date for search range. Format: YYYY-MM-DD (e.g., '2025-07-25'). Can search historical tweets from months/years back"),
    top: z.boolean().optional().describe("Set to true for trending/popular tweets instead of recent. Returns high-engagement content sorted by relevance"),
    toUsers: z.array(z.string()).optional().describe("Find tweets TO/replying to these users. Format: ['username'] WITHOUT @ symbol. Example: ['elonmusk'] NOT ['@elonmusk']")
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

      const data = await makeApexRequest('/apex/tweet/search', {
        method: 'GET',
        queryParams: params
      });
      
      return createToolResponse(data);
    } catch (error) {
      return handleToolError(error);
    }
  }
);

/* 
SEARCH TOOL USAGE EXAMPLES AND RESPONSE STRUCTURE:

Example Patterns:
1. High-Quality Content Discovery:
   { count: 20, includeWords: ["AI", "machine learning"], minLikes: 100, onlyOriginal: true, language: "en" }

2. Viral Content Analysis:
   { count: 15, hashtags: ["crypto", "web3"], minRetweets: 50, top: true }

3. User-Specific Analysis:
   { count: 10, fromUsers: ["elonmusk"], startDate: "2025-07-25", minLikes: 500 }

4. Content Exclusion:
   { count: 30, includeWords: ["machine learning"], excludeWords: ["crypto", "bitcoin"], minLikes: 50 }

Response Structure:
- Returns array of tweet objects
- May contain duplicates (normal API behavior)
- Each tweet includes:
  * id: Tweet ID string
  * fullText: Complete tweet content
  * createdAt: ISO timestamp
  * likeCount, retweetCount, replyCount, viewCount: Engagement metrics
  * conversationId: Groups related tweets
  * replyTo: Parent tweet ID if reply
  * tweetBy: User object with userName, fullName, followersCount, isVerified, etc.
  * entities: Contains hashtags[], mentionedUsers[], urls[]
  * media: Array of {type: "PHOTO"|"VIDEO", url, thumbnailUrl}
*/

// Register the AddListMemberTool
const addListMemberTool = server.tool(
  "add_list_member",
  "Add a member to an X/Twitter list.",
  {
    listId: z.string().describe("ID of the list"),
    userId: z.string().describe("ID of the user to add to the list")
  },
  async ({ listId, userId }) => {
    try {
      const data = await makeApexRequest(`/apex/list/${listId}/member`, {
        method: 'POST',
        body: JSON.stringify({ userId })
      });
      return createToolResponse(data);
    } catch (error) {
      return handleToolError(error);
    }
  }
);

/* 
GET LIST MEMBERS RESPONSE STRUCTURE:
Returns paginated list of user objects who are members of the specified list.

Example Response:
{
  "cursor": "eyJza2lwIjoxMDB9",  // Use this cursor for next page
  "items": [
    {
      "id": "1234567890",
      "username": "johndoe",
      "name": "John Doe", 
      "image": "https://pbs.twimg.com/profile_images/...",
      "active": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2025-07-28T15:45:00.000Z"
      // Additional fields may include user settings and configuration
    }
  ]
}
*/
const getListMembersTool = server.tool(
  "get_list_members",
  "Get members of a list with pagination support. Returns user objects for each member.",
  {
    listId: z.string().describe("ID of the list"),
    cursor: z.string().optional().describe("Pagination cursor from previous response"),
    maxResults: z.number().min(1).max(200).optional()
      .describe("Maximum results per page (1-200, default: 100)")
  },
  async ({ listId, cursor, maxResults }) => {
    try {
      const params = new URLSearchParams();
      if (cursor) params.append('cursor', cursor);
      if (maxResults) params.append('maxResults', String(maxResults));
      
      const queryString = params.toString();
      const url = `/apex/list/${listId}/member${queryString ? `?${queryString}` : ''}`;
      
      const data = await makeApexRequest(url);
      return createToolResponse(data);
    } catch (error) {
      return handleToolError(error);
    }
  }
);

// Register the CreateListTool
const createListTool = server.tool(
  "create_list",
  "Create a new X/Twitter list. Returns the created list object with assigned ID.",
  {
    name: z.string().min(1).max(25).describe("Name of the list (1-25 characters)"),
    description: z.string().max(100).optional()
      .describe("Description of the list (max 100 characters)"),
    private: z.boolean().optional().describe("Whether the list is private (default: false)")
  },
  async ({ name, description, private: isPrivate }) => {
    try {
      const body: any = { name };
      if (description !== undefined) body.description = description;
      if (isPrivate !== undefined) body.private = isPrivate;
      
      const data = await makeApexRequest('/apex/list', {
        method: 'POST',
        body: JSON.stringify(body)
      });
      return createToolResponse(data);
    } catch (error) {
      return handleToolError(error);
    }
  }
);

/* 
GET USER LISTS RESPONSE STRUCTURE:
Returns paginated array of list objects owned by the authenticated user.

Example Response:
{
  "cursor": "eyJza2lwIjo1MH0=",
  "items": [
    {
      "id": "1557055489589886976",
      "name": "Tech Leaders",
      "description": "Top voices in technology",
      "private": false,
      "createdAt": "2024-08-09T14:30:00.000Z",
      "memberCount": 150,
      "followerCount": 2500,
      "owner": {
        "id": "1234567890",
        "username": "myusername",
        "name": "My Display Name",
        // Full user object of list owner
      }
    }
  ]
}
*/
const getUserListsTool = server.tool(
  "get_user_lists",
  "Get all lists owned by the authenticated user. Returns list objects with metadata.",
  {
    cursor: z.string().optional().describe("Pagination cursor from previous response"),
    maxResults: z.number().min(1).max(200).optional()
      .describe("Maximum results per page (1-200, default: 100)")
  },
  async ({ cursor, maxResults }) => {
    try {
      const params = new URLSearchParams();
      if (cursor) params.append('cursor', cursor);
      if (maxResults) params.append('maxResults', String(maxResults));
      
      const queryString = params.toString();
      const url = `/apex/list${queryString ? `?${queryString}` : ''}`;
      
      const data = await makeApexRequest(url);
      return createToolResponse(data);
    } catch (error) {
      return handleToolError(error);
    }
  }
);

// Register the DeleteListTool
const deleteListTool = server.tool(
  "delete_list",
  "Delete an X/Twitter list. This action cannot be undone.",
  {
    listId: z.string().describe("ID of the list to delete")
  },
  async ({ listId }) => {
    try {
      const data = await makeApexRequest(`/apex/list/${listId}`, {
        method: 'DELETE'
      });
      return createToolResponse(data);
    } catch (error) {
      return handleToolError(error);
    }
  }
);

/* 
GET LIST RESPONSE STRUCTURE:
Returns detailed information about a specific list.

Example Response:
{
  "id": "1557055489589886976",
  "name": "Tech Leaders",
  "description": "Top voices in technology and innovation",
  "private": false,
  "createdAt": "2024-08-09T14:30:00.000Z",
  "memberCount": 150,
  "followerCount": 2500,
  "owner": {
    "id": "1234567890",
    "username": "techguru",
    "name": "Tech Guru",
    "image": "https://pbs.twimg.com/profile_images/...",
    // Additional owner details
  }
}
*/
const getListTool = server.tool(
  "get_list",
  "Get detailed information about a specific list including member/follower counts.",
  {
    listId: z.string().describe("ID of the list to retrieve")
  },
  async ({ listId }) => {
    try {
      const data = await makeApexRequest(`/apex/list/${listId}`);
      return createToolResponse(data);
    } catch (error) {
      return handleToolError(error);
    }
  }
);

// Register the UpdateListTool
const updateListTool = server.tool(
  "update_list",
  "Update an existing list's properties. Only provided fields will be updated.",
  {
    listId: z.string().describe("ID of the list to update"),
    name: z.string().min(1).max(25).optional()
      .describe("New name for the list (1-25 characters)"),
    description: z.string().max(100).optional()
      .describe("New description (max 100 characters)"),
    private: z.boolean().optional().describe("Update privacy setting")
  },
  async ({ listId, name, description, private: isPrivate }) => {
    try {
      const body: any = {};
      if (name !== undefined) body.name = name;
      if (description !== undefined) body.description = description;
      if (isPrivate !== undefined) body.private = isPrivate;
      
      if (Object.keys(body).length === 0) {
        return createToolResponse({ message: "No fields to update" });
      }
      
      const data = await makeApexRequest(`/apex/list/${listId}`, {
        method: 'PUT',
        body: JSON.stringify(body)
      });
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
