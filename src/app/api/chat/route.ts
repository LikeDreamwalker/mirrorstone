export const runtime = "edge";

import { streamText, convertToModelMessages } from "ai";
import { deepseek } from "@ai-sdk/deepseek";
import type { UIMessage } from "ai";

export async function POST(req: Request) {
  try {
    if (!process.env.DEEPSEEK_API_KEY) {
      return new Response("DeepSeek API key not configured", { status: 500 });
    }

    const { messages }: { messages: UIMessage[] } = await req.json();

    const result = streamText({
      model: deepseek("deepseek-chat"),
      messages: convertToModelMessages(messages),
      temperature: 0.7,
    });

    // This is the recommended way for AI SDK 5 Alpha chat streaming
    return result.toUIMessageStreamResponse({});
    // Or, if you want reasoning tokens and your SDK supports it:
    // return result.toDataStreamResponse({ sendReasoning: true });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Failed to process chat request", { status: 500 });
  }
}
