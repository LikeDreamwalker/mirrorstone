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

  // Substeps tracking
  public substepsBlockId: string | null = null;
  public substepsData: any = null;
  public currentStepIndex = 0;

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

  // Extract and setup substeps from R1 result
  private setupSubstepsFromR1Result(r1Result: any) {
    if (
      r1Result.structured_data &&
      r1Result.structured_data.type === "substeps"
    ) {
      this.substepsBlockId = r1Result.structured_data.id;
      this.substepsData = r1Result.structured_data;
      this.currentStepIndex = 0;

      console.log("🔍 Setting up substeps from R1:", this.substepsData);

      // Update substeps to running status
      this.sendUIMessage({
        type: "text",
        text: JSON.stringify({
          ...r1Result.structured_data,
          status: "running",
          currentStep: 0,
          completedSteps: [],
        }),
      });
    }
  }

  // Update substeps progress
  private updateSubstepsProgress(stepResult: any) {
    if (!this.substepsBlockId || !this.substepsData) return;

    console.log("🎯 Step finished:", {
      finishReason: stepResult.finishReason,
      contentLength: stepResult.content?.length || 0,
      contentTypes: stepResult.content?.map((c: any) => c.type) || [],
    });

    const toolResults =
      stepResult.content?.filter((item: any) => item.type === "tool-result") ||
      [];
    const toolCalls =
      stepResult.content?.filter((item: any) => item.type === "tool-call") ||
      [];

    console.log("📊 Tools in this step:", {
      toolCalls: toolCalls.length,
      toolResults: toolResults.length,
      toolNames: toolResults.map((tr: any) => tr.toolName),
    });

    // Increment step when tools complete successfully
    if (stepResult.finishReason === "tool-calls" && toolResults.length > 0) {
      // Don't increment for agent tools (r1Analysis, expertV3) as they handle their own progress
      const nonAgentTools = toolResults.filter(
        (tr: any) => !["r1Analysis", "expertV3"].includes(tr.toolName)
      );

      if (nonAgentTools.length > 0) {
        this.currentStepIndex = Math.min(
          this.currentStepIndex + nonAgentTools.length,
          this.substepsData.steps.length
        );

        console.log(
          `📈 Updating substeps progress: step ${this.currentStepIndex}/${
            this.substepsData.steps.length
          } (+${nonAgentTools.length} from tools: ${nonAgentTools
            .map((tr: any) => tr.toolName)
            .join(", ")})`
        );

        this.sendUIMessage({
          type: "text",
          text: JSON.stringify({
            id: this.substepsBlockId,
            type: "substeps",
            status:
              this.currentStepIndex >= this.substepsData.steps.length
                ? "finished"
                : "running",
            steps: this.substepsData.steps,
            currentStep: Math.min(
              this.currentStepIndex - 1,
              this.substepsData.steps.length - 1
            ),
            completedSteps: Array.from(
              { length: this.currentStepIndex },
              (_, i) => i
            ),
          }),
        });
      }
    }

    // Handle final completion
    if (
      stepResult.finishReason === "stop" &&
      this.currentStepIndex < this.substepsData.steps.length
    ) {
      console.log("✅ Final completion - marking all steps as done");

      this.sendUIMessage({
        type: "text",
        text: JSON.stringify({
          id: this.substepsBlockId,
          type: "substeps",
          status: "finished",
          steps: this.substepsData.steps,
          completedSteps: this.substepsData.steps.map(
            (_: any, idx: number) => idx
          ),
        }),
      });
    }
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
        onStepFinish: (stepResult) => {
          // Check if R1 tool was called and set up substeps
          const toolCalls = stepResult.toolCalls || [];
          const r1ToolCall = toolCalls.find(
            (tc) => tc.toolName === "r1Analysis"
          );

          if (r1ToolCall && stepResult.toolResults) {
            const r1Result = stepResult.toolResults.find(
              (tr) => tr.toolCallId === r1ToolCall.toolCallId
            );
            if (r1Result && r1Result.result) {
              this.setupSubstepsFromR1Result(r1Result.result);
            }
          }

          // Update substeps progress for other tools
          this.updateSubstepsProgress(stepResult);
        },
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
