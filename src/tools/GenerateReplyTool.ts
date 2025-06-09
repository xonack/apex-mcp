import { MCPTool } from "mcp-framework";
import { z } from "zod";

interface GenerateReplyInput {
  text: string;
  image_urls?: string[];
}

class GenerateReplyTool extends MCPTool<GenerateReplyInput> {
  name = "generate_reply";
  description = "Tool that generates a reply to a message.";

  schema = {
    text: {
      type: z.string(),
      description: "Text to be replied to.",
    },
    image_urls: {
      type: z.array(z.string()).optional(),
      description: "Array of image URLs used as context for the reply. If not provided, the reply will be to only text.",
    },
  };

  async execute(input: GenerateReplyInput) {
    const params = new URLSearchParams();
    params.append('text', input.text);
    
    if (input.image_urls && input.image_urls.length > 0) {
      input.image_urls.forEach((url: string) => {
        params.append('image_url', url);
      });
    }

    const response = await this.fetch(`${process.env.APEX_API_URL}/apex/reply?${params.toString()}`, {
      method: "GET",
      headers: {
        'Authorization': `Bearer ${process.env.APEX_BEARER_TOKEN}`,
        'accept': 'application/json'
      }
    });

    return JSON.stringify(response, null, 2);
  }
}

export default GenerateReplyTool;