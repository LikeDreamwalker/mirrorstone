import { streamText, convertToModelMessages, stepCountIs } from "ai";
import { deepseek } from "@ai-sdk/deepseek";
import type { UIMessage } from "ai";
import { createStreamAwareTools } from "@/ai/tools";
import { V3_DISPATCHER_PROMPT } from "@/ai/prompts";

// Helper: Remove reasoning parts from assistant messages
function filterReasoningParts(messages: UIMessage[]): UIMessage[] {
  return messages.map((msg) => {
    if (msg.role === "assistant") {
      return {
        ...msg,
        parts: msg.parts.filter((p) => p.type !== "reasoning"),
      };
    }
    return msg;
  });
}

class MultiAgentStreamComposer {
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

  public sendUIMessage(part: any) {
    if (!this.controller) return;
    this.controller.enqueue(
      this.encoder.encode(`data: ${JSON.stringify(part)}\n\n`)
    );
  }

  // Create stream context for tools
  private getStreamContext() {
    return {
      sendUIMessage: this.sendUIMessage.bind(this),
      apiKey: process.env.DEEPSEEK_API_KEY!,
      convertToModelMessages,
      streamText,
      stepCountIs,
    };
  }

  // Main V3 Dispatcher with stream-aware tools
  async runV3Dispatcher(messages: UIMessage[]) {
    try {
      // Create stream-aware tools
      const streamAwareTools = createStreamAwareTools(this.getStreamContext());

      // Prepare V3 dispatcher messages
      const dispatcherMessages = [
        {
          role: "system" as const,
          parts: [{ type: "text" as const, text: V3_DISPATCHER_PROMPT }],
        },
        ...filterReasoningParts(messages),
      ];

      const result = streamText({
        model: deepseek("deepseek-chat"),
        messages: convertToModelMessages(dispatcherMessages),
        temperature: 0.9, // Conversational dispatcher
        tools: streamAwareTools,
        stopWhen: stepCountIs(15),
      });

      for await (const part of result.fullStream) {
        this.sendUIMessage(part);
      }
    } catch (error) {
      this.sendUIMessage({
        type: "error",
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  close() {
    if (this.controller) {
      this.controller.close();
    }
  }

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

  const composer = new MultiAgentStreamComposer();
  const stream = composer.createStream();
  (async () => {
    try {
      await composer.runV3Dispatcher(messages);
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
