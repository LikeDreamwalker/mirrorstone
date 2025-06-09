export const runtime = "edge";

import { streamText, convertToModelMessages } from "ai";
import { deepseek } from "@ai-sdk/deepseek";
import type { UIMessage } from "ai";

class AI5MultiModelStreamComposer {
  private encoder = new TextEncoder();
  private controller: ReadableStreamDefaultController<Uint8Array> | null = null;

  createStream() {
    return new ReadableStream<Uint8Array>({
      start: (controller) => {
        this.controller = controller;
      },
      cancel: () => {
        this.controller = null;
      },
    });
  }

  // Only send standard UIMessage parts
  private sendUIMessage(part: any) {
    if (!this.controller) return;
    this.controller.enqueue(
      this.encoder.encode(`data: ${JSON.stringify(part)}\n\n`)
    );
  }

  // Stream R1's analysis using direct API
  async streamR1Analysis(messages: UIMessage[], apiKey: string) {
    try {
      const response = await fetch(
        "https://api.deepseek.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "deepseek-reasoner",
            messages: convertToModelMessages(messages),
            stream: true,
          }),
        }
      );

      if (!response.body) throw new Error("No response body from DeepSeek R1");

      const reader = response.body.getReader();
      let buffer = "";
      let fullAnalysis = "";
      let fullReasoning = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += new TextDecoder().decode(value);

        const lines = buffer.split("\n");
        buffer = lines.pop()!;

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            const reasoning = parsed.choices?.[0]?.delta?.reasoning_content;

            if (reasoning) {
              fullReasoning += reasoning;
              this.sendUIMessage({
                type: "reasoning",
                text: reasoning,
              });
            }

            if (content) {
              fullAnalysis += content;
              this.sendUIMessage({
                type: "text",
                text: content,
              });
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
      }
      console.log(fullAnalysis, fullReasoning, "R1 Analysis and Reasoning");

      return { analysis: fullAnalysis, reasoning: fullReasoning };
    } catch (error) {
      this.sendUIMessage({
        type: "error",
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // Stream agent execution using AI SDK 5
  async streamAgentExecution(
    analysis: string,
    reasoning: string | null,
    originalMessage: string
  ) {
    try {
      const systemPrompt = `You are an intelligent agent executing based on DeepSeek R1's analysis.

R1's Analysis:
${analysis}

${
  reasoning
    ? `R1's Reasoning Process:
${reasoning}`
    : ""
}

Based on R1's analysis and reasoning, provide a comprehensive response to the user's request. Reference R1's insights and execute the recommended actions.`;

      const result = streamText({
        model: deepseek("deepseek-chat"),
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: originalMessage },
        ],
        temperature: 0.7,
      });

      for await (const part of result.fullStream) {
        // Only emit standard UIMessage parts
        if (
          part.type === "text" ||
          part.type === "reasoning" ||
          part.type === "tool-call"
        ) {
          this.sendUIMessage(part);
        }
        // Optionally, handle errors
        else if (part.type === "error") {
          this.sendUIMessage({
            type: "error",
            error: part.error,
          });
        }
      }

      // Optionally, you can await result.text or result.totalUsage if needed
    } catch (error) {
      this.sendUIMessage({
        type: "error",
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // Close the stream
  close() {
    if (this.controller) {
      this.controller.close();
    }
  }

  // Handle errors
  error(error: Error) {
    if (this.controller) {
      this.sendUIMessage({
        type: "error",
        error: error.message,
      });
      this.controller.error(error);
    }
  }
}

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const apiKey = process.env.DEEPSEEK_API_KEY!;
  const lastMessage = messages[messages.length - 1];
  const userMessage =
    lastMessage.parts?.map((p: any) => p.text).join("\n") ?? "";

  const composer = new AI5MultiModelStreamComposer();
  const stream = composer.createStream();

  // Process in background
  (async () => {
    try {
      // Step 1: Stream R1's analysis
      const { analysis, reasoning } = await composer.streamR1Analysis(
        messages,
        apiKey
      );

      // Step 2: Stream agent execution with R1's analysis using AI SDK 5
      await composer.streamAgentExecution(analysis, reasoning, userMessage);

      // Complete the stream
      composer.close();
    } catch (error) {
      composer.error(error as Error);
    }
  })();

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
