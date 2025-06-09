import { MCPTool, logger } from "mcp-framework";
import { z } from "zod";


interface SearchTweetsInput {
  count?: number;
  endDate?: Date;
  excludeWords?: string[];
  fromUsers?: string[];
  hashtags?: string[];
  includePhrase?: string;
  includeWords?: string[];
  language?: string;
  links?: boolean;
  list?: string;
  maxId?: string;
  mentions?: string[];
  minLikes?: number;
  minReplies?: number;
  minRetweets?: number;
  optionalWords?: string[];
  quoted?: string;
  replies?: boolean;
  sinceId?: string;
  startDate?: Date;
  top?: boolean;
  toUsers?: string[];
}

class SearchTweetsTool extends MCPTool<SearchTweetsInput> {
  name = "search_tweets";
  description = "A tool to search for tweets by a given query.";

  schema = {
    count: {
      type: z.number().optional(),
      description: "Number of tweets to return",
    },
    endDate: {
      type: z.date().optional(),
      description: "The date upto which tweets are to be searched.",
    },
    excludeWords: {
      type: z.array(z.string()).optional(),
      description: "The list of words to exclude from search.",
    },
    fromUsers: {
      type: z.array(z.string()).optional(),
      description: "The list of usernames whose tweets are to be searched. '@' must be excluded from the username!",
    },
    hashtags: {
      type: z.array(z.string()).optional(),
      description: "The list of hashtags to search. '#' must be excluded from the hashtag!",
    },
    includePhrase: {
      type: z.string().optional(),
      description: "The exact phrase to search.",
    },
    includeWords: {
      type: z.array(z.string()).optional(),
      description: "The list of words to search.",
    },
    language: {
      type: z.string().optional(),
      description: "The language of the tweets to search.",
    },
    links: {
      type: z.boolean().optional(),
      description: "Whether to fetch tweets that are links or not.",
    },
    list: {
      type: z.string().optional(),
      description: "The list from which tweets are to be searched.",
    },
    maxId: {
      type: z.string().optional(),
      description: "The id of the tweet, before which the tweets are to be searched.",
    },
    mentions: {
      type: z.array(z.string()).optional(),
      description: "The list of username mentioned in the tweets to search. '@' must be excluded from the username!",
    },
    minLikes: {
      type: z.number().optional(),
      description: "The minimun number of likes to search by.",
    },
    minReplies: {
      type: z.number().optional(),
      description: "The minimum number of replies to search by.",
    },
    minRetweets: {
      type: z.number().optional(),
      description: "The minimum number of retweets to search by.",
    },
    optionalWords: {
      type: z.array(z.string()).optional(),
      description: "The optional words to search.",
    },
    quoted: {
      type: z.string().optional(),
      description: "The id of the tweet which is quoted in the tweets to search.",
    },
    replies: {
      type: z.boolean().optional(),
      description: "Whether to fetch tweets that are replies or not.",
    },
    sinceId: {
      type: z.string().optional(),
      description: "The id of the tweet, after which the tweets are to be searched.",
    },
    startDate: {
      type: z.date().optional(),
      description: "The date starting from which tweets are to be searched.",
    },
    top: {
      type: z.boolean().optional(),
      description: "Whether to fetch top tweets or not.",
    },
    toUsers: {
      type: z.array(z.string()).optional(),
      description: "The list of username to whom the tweets to be searched, are adressed. '@' must be excluded from the username!",
    },
  };

  async execute(input: SearchTweetsInput) {
    const params = new URLSearchParams();

    for (const key in input) {
      if (input[key as keyof SearchTweetsInput] !== undefined) {
        const value = input[key as keyof SearchTweetsInput];
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else if (value instanceof Date) {
          params.append(key, value.toISOString());
        }
        else {
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
      throw new Error(`Failed to fetch tweets: ${response.statusText}`);
    }

    const data = await response.json();

    return JSON.stringify(data, null, 2);
  }
}

export default SearchTweetsTool;