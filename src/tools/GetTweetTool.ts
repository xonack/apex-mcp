import { MCPTool, logger } from "mcp-framework";
import { z } from "zod";

interface GetTweetInput {
  id: string;
}

class GetTweetTool extends MCPTool<GetTweetInput> {
  name = "get_tweet";
  description = "A tool to get a tweet by its id.";

  schema = {
    id: {
      type: z.string(),
      description: "Id of the tweet to get.",
    },
  };

  async execute(input: GetTweetInput) {
    
    const url = `${process.env.APEX_API_URL}/apex/tweet/${input.id}/details`;
    
    const response = await this.fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.APEX_BEARER_TOKEN}`
      }
    });

    return JSON.stringify(response, null, 2);
  }
}

export default GetTweetTool;