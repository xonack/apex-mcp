import { MCPTool } from "mcp-framework";
import { z } from "zod";

interface GenerateReplyToTweetInput {
  id: string;
}

class GenerateReplyToTweetTool extends MCPTool<GenerateReplyToTweetInput> {
  name = "generate_reply_to_tweet";
  description = "A tool to generate a reply suggestion to a tweet";

  schema = {
    id: {
      type: z.string(),
      description: "Id of the tweet to generate a reply to",
    },
  };

  async execute(input: GenerateReplyToTweetInput) {

    const response = await this.fetch(`${process.env.APEX_API_URL}/apex/tweet/${input.id}/reply`, {
      headers: {
        'Authorization': `Bearer ${process.env.APEX_BEARER_TOKEN}`,
      }
    });

    return JSON.stringify(response, null, 2);
  }
}

export default GenerateReplyToTweetTool;