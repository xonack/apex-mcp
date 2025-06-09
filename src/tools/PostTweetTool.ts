import { MCPTool } from "mcp-framework";
import { z } from "zod";

interface PostTweetInput {
  username: string;
  text: string;
  image_url?: string;
}

class PostTweetTool extends MCPTool<PostTweetInput> {
  name = "post_tweet";
  description = "Tool that posts a tweet.";

  schema = {
    username: {
      type: z.string(),
      description: "Username of the user posting the tweet.",
    },
    text: {
      type: z.string(),
      description: "Text of the tweet to be posted.",
    },
  };

  async execute(input: PostTweetInput) {
    const { text } = input;

    const url = `${process.env.APEX_API_URL}/apex/tweet`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.APEX_BEARER_TOKEN}`,
      },
      body: JSON.stringify({ text }),
    });

    return response.json();
  }
}

export default PostTweetTool;