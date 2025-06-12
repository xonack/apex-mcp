import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error("Please provide Apex API Key & Apex API URL");
  process.exit(1);
}
const apiKey = args[0];
const apiUrl = args[1];

// Set environment variables from command line args
process.env.APEX_BEARER_TOKEN = apiKey;
process.env.APEX_API_URL = apiUrl;

const server = new McpServer({
  name: "apex-mcp",
  version: "1.0.0"
});

// Register the GetTweetTool
const getTweetTool = server.tool(
  "get_tweet",
  "A tool to get a tweet by its id.",
  { id: z.string().describe("Id of the tweet to get.") },
  async ({ id }) => {
    const url = `${process.env.APEX_API_URL}/apex/tweet/${id}/details`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.APEX_BEARER_TOKEN}`
      }
    });

    const data = await response.json();
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2)
        }
      ]
    };
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
    const params = new URLSearchParams();
    params.append('text', text);
    
    if (image_urls && image_urls.length > 0) {
      image_urls.forEach((url: string) => {
        params.append('image_url', url);
      });
    }

    const response = await fetch(`${process.env.APEX_API_URL}/apex/reply?${params.toString()}`, {
      method: "GET",
      headers: {
        'Authorization': `Bearer ${process.env.APEX_BEARER_TOKEN}`,
        'accept': 'application/json'
      }
    });

    const data = await response.json();
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2)
        }
      ]
    };
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
    const response = await fetch(`${process.env.APEX_API_URL}/apex/tweet/${id}/reply`, {
      headers: {
        'Authorization': `Bearer ${process.env.APEX_BEARER_TOKEN}`,
      }
    });

    const data = await response.json();
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2)
        }
      ]
    };
  }
);

// Register the PostTweetTool
const postTweetTool = server.tool(
  "post_tweet",
  "Tool that posts a tweet.",
  { 
    username: z.string().describe("Username of the user posting the tweet."),
    text: z.string().describe("Text of the tweet to be posted."),
    image_urls: z.array(z.string()).optional().describe("Optional image URL to include with the tweet.")
  },
  async ({ username, text, image_urls }) => {
    const url = `${process.env.APEX_API_URL}/apex/tweet`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.APEX_BEARER_TOKEN}`,
      },
      body: JSON.stringify({ 
        username,
        text,
        image_urls
      }),
    });

    const data = await response.json();
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2)
        }
      ]
    };
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
    const response = await fetch(`${process.env.APEX_API_URL}/apex/tweet/${tweet_id}/reply`, {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${process.env.APEX_BEARER_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: text,
      })
    });

    const data = await response.json();
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2)
        }
      ]
    };
  }
);

// Register the SearchTweetsTool
const searchTweetsTool = server.tool(
  "search_tweets",
  "A tool to search for tweets by a given query.",
  {
    count: z.number().optional().describe("Number of tweets to return"),
    endDate: z.date().optional().describe("The date upto which tweets are to be searched."),
    excludeWords: z.array(z.string()).optional().describe("The list of words to exclude from search."),
    fromUsers: z.array(z.string()).optional().describe("The list of usernames whose tweets are to be searched. '@' must be excluded from the username!"),
    hashtags: z.array(z.string()).optional().describe("The list of hashtags to search. '#' must be excluded from the hashtag!"),
    includePhrase: z.string().optional().describe("The exact phrase to search."),
    includeWords: z.array(z.string()).optional().describe("The list of words to search."),
    language: z.string().optional().describe("The language of the tweets to search."),
    links: z.boolean().optional().describe("Whether to fetch tweets that are links or not."),
    list: z.string().optional().describe("The list from which tweets are to be searched."),
    maxId: z.string().optional().describe("The id of the tweet, before which the tweets are to be searched."),
    mentions: z.array(z.string()).optional().describe("The list of username mentioned in the tweets to search. '@' must be excluded from the username!"),
    minLikes: z.number().optional().describe("The minimun number of likes to search by."),
    minReplies: z.number().optional().describe("The minimum number of replies to search by."),
    minRetweets: z.number().optional().describe("The minimum number of retweets to search by."),
    optionalWords: z.array(z.string()).optional().describe("The optional words to search."),
    quoted: z.string().optional().describe("The id of the tweet which is quoted in the tweets to search."),
    replies: z.boolean().optional().describe("Whether to fetch tweets that are replies or not."),
    sinceId: z.string().optional().describe("The id of the tweet, after which the tweets are to be searched."),
    startDate: z.date().optional().describe("The date starting from which tweets are to be searched."),
    top: z.boolean().optional().describe("Whether to fetch top tweets or not."),
    toUsers: z.array(z.string()).optional().describe("The list of username to whom the tweets to be searched, are adressed. '@' must be excluded from the username!")
  },
  async (input) => {
    const params = new URLSearchParams();

    for (const key in input) {
      if (input[key as keyof typeof input] !== undefined) {
        const value = input[key as keyof typeof input];
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else if (value instanceof Date) {
          params.append(key, value.toISOString());
        } else {
          params.append(key, String(value));
        }
      }
    }

    const url = `${process.env.APEX_API_URL}/apex/tweet/search?${params.toString()}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.APEX_BEARER_TOKEN}`
      }
    });

    if (!response.ok) {
      const errorText = `Failed to fetch tweets: ${response.statusText}`;
      return {
        content: [
          {
            type: "text",
            text: errorText
          }
        ],
        isError: true
      };
    }

    const data = await response.json();

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2)
        }
      ]
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);