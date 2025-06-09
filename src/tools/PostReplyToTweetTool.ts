import { MCPTool } from "mcp-framework";
import { z } from "zod";

interface PostReplyToTweetInput {
  tweet_id: string;
  text: string;
}

class PostReplyToTweetTool extends MCPTool<PostReplyToTweetInput> {
  name = "post_reply_to_tweet";
  description = "Tool that posts a reply to a tweet with input text & optional image.";

  schema = {
    tweet_id: {
      type: z.string(),
      description: "Id of the tweet to reply to.",
    },
    text: {
      type: z.string(),
      description: "Text of the reply to be posted.",
    },
  };

  async execute(input: PostReplyToTweetInput) {

    const response = await this.fetch(`${process.env.APEX_API_URL}/apex/tweet/${input.tweet_id}/reply`, {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${process.env.APEX_BEARER_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: input.text,
      })
    });

    return JSON.stringify(response, null, 2);
  }
}

export default PostReplyToTweetTool;