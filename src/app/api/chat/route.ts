export const runtime = "edge";

import {
  streamText,
  generateText,
  convertToModelMessages,
  smoothStream,
} from "ai";
import { deepseek } from "@ai-sdk/deepseek";
import type { UIMessage } from "ai";

export async function POST(req: Request) {
  try {
    if (!process.env.DEEPSEEK_API_KEY) {
      return new Response("DeepSeek API key not configured", { status: 500 });
    }

    const { messages }: { messages: UIMessage[] } = await req.json();

    // Step 1: Run deepseek-reasoner to analyze/decompose
    const reasonerResult = await generateText({
      model: deepseek("deepseek-reasoner"),
      messages: convertToModelMessages(messages),
      temperature: 0.7,
    });

    // Step 2: Use the output of step 1 as input for deepseek-chat
    const chatPrompt = reasonerResult.text;

    const result = streamText({
      model: deepseek("deepseek-chat"),
      messages: [
        {
          role: "system",
          content: "Solve the following tasks as thoroughly as possible.",
        },
        { role: "user", content: chatPrompt },
      ],
      temperature: 0.7,
      experimental_transform: smoothStream(),
    });

    return result.toUIMessageStreamResponse({});
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Failed to process chat request", { status: 500 });
  }
}
