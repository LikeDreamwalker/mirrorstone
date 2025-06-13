export const runtime = "nodejs";

import { streamText, convertToModelMessages, stepCountIs } from "ai";
import { deepseek } from "@ai-sdk/deepseek";
import type { UIMessage } from "ai";
import { tools } from "@/ai/tools";
import { R1_SYSTEM_PROMPT, V3_SYSTEM_PROMPT } from "@/ai/prompts";

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

function toDeepSeekMessages(
  messages: UIMessage[]
): { role: string; content: string }[] {
  return messages.map((msg) => ({
    role: msg.role,
    content:
      msg.parts
        ?.map((p) =>
          (p.type === "text" || p.type === "reasoning") && "text" in p
            ? p.text
            : ""
        )
        .join("") ?? "",
  }));
}

class AI5MultiModelStreamComposer {
  private encoder = new TextEncoder();
  private controller: ReadableStreamDefaultController<Uint8Array> | null = null;

  // Public properties for substeps tracking
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

  // Stream R1's analysis using direct API
  async streamR1Analysis(messages: UIMessage[], apiKey: string) {
    try {
      let r1Messages: UIMessage[];
      if (
        messages.length === 0 ||
        messages[0].role !== "system" ||
        (messages[0].parts?.[0]?.type === "text" &&
          messages[0].parts?.[0]?.text !== R1_SYSTEM_PROMPT)
      ) {
        r1Messages = [
          {
            id: crypto.randomUUID(),
            role: "system",
            parts: [{ type: "text", text: R1_SYSTEM_PROMPT }],
          },
          ...filterReasoningParts(messages),
        ];
      } else {
        r1Messages = filterReasoningParts(messages);
      }

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
            messages: toDeepSeekMessages(r1Messages),
            stream: true,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("R1 Error body:", errorText);
        throw new Error(`DeepSeek R1 API error: ${response.status}`);
      }

      if (!response.body) throw new Error("No response body from DeepSeek R1");

      const reader = response.body.getReader();
      let buffer = "";
      let fullAnalysis = "";
      let fullReasoning = "";
      let r1Raw = "";

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
              r1Raw += content;
              // Only send to client if not inside actions block
              if (
                !/Render the Substeps Card|Answer the question/i.test(content)
              ) {
                this.sendUIMessage({
                  type: "text",
                  text: content,
                });
              }
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
      }

      return { analysis: fullAnalysis, reasoning: fullReasoning, r1Raw };
    } catch (error) {
      this.sendUIMessage({
        type: "error",
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // Update substeps progress when tools complete
  private updateSubstepsProgress(stepResult: any) {
    if (!this.substepsBlockId || !this.substepsData) return;

    console.log("🎯 Step finished:", {
      finishReason: stepResult.finishReason,
      contentLength: stepResult.content?.length || 0,
      contentTypes: stepResult.content?.map((c: any) => c.type) || [],
    });

    // Check if this step contains tool results
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
      // Increment by number of completed tools (each tool execution = 1 step progress)
      const stepIncrement = toolResults.length;
      this.currentStepIndex = Math.min(
        this.currentStepIndex + stepIncrement,
        this.substepsData.steps.length
      );

      console.log(
        `📈 Updating substeps progress: step ${this.currentStepIndex}/${
          this.substepsData.steps.length
        } (+${stepIncrement} from tools: ${toolResults
          .map((tr: any) => tr.toolName)
          .join(", ")})`
      );

      // Send updated substeps block with same ID
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
          ), // 0-indexed
          completedSteps: Array.from(
            { length: this.currentStepIndex },
            (_, i) => i
          ),
        }),
      });
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

  // Stream agent execution using AI SDK 5 with step tracking
  async streamAgentExecutionFromPrompt(promptMessages: UIMessage[]) {
    try {
      const result = streamText({
        model: deepseek("deepseek-chat"),
        messages: convertToModelMessages(promptMessages),
        temperature: 0.7,
        tools,
        stopWhen: stepCountIs(10),
        onStepFinish: (stepResult) => {
          // Update substeps when tools are executed
          this.updateSubstepsProgress(stepResult);
        },
      });

      for await (const part of result.fullStream) {
        // Forward directly
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
  const apiKey = process.env.DEEPSEEK_API_KEY!;
  const composer = new AI5MultiModelStreamComposer();
  const stream = composer.createStream();

  (async () => {
    try {
      // Step 1: Stream R1's analysis
      const { analysis, reasoning, r1Raw } = await composer.streamR1Analysis(
        messages,
        apiKey
      );

      // Step 2: Extract substeps from R1's block output
      const substepsBlockMatch = r1Raw.match(
        /{"id":[^}]*"type":\s*"substeps"[^}]*}/
      );

      if (substepsBlockMatch) {
        try {
          const substepsBlock = JSON.parse(substepsBlockMatch[0]);
          const steps = substepsBlock.steps || [];

          if (steps.length > 0) {
            // Store substeps info for progress tracking
            composer.substepsBlockId = substepsBlock.id;
            composer.substepsData = substepsBlock;
            composer.currentStepIndex = 0;

            console.log("🔍 Found substeps block:", substepsBlock);

            // Update substeps block to "running" status
            composer.sendUIMessage({
              type: "text",
              text: JSON.stringify({
                ...substepsBlock,
                status: "running",
                currentStep: 0,
              }),
            });

            // Create V3 prompt from extracted steps
            const v3UserMessage = steps
              .map((step: string, idx: number) => `${idx + 1}. ${step}`)
              .join("\n");

            const v3Prompt: UIMessage[] = [
              {
                id: crypto.randomUUID(),
                role: "system",
                parts: [{ type: "text", text: V3_SYSTEM_PROMPT }],
              },
              {
                id: crypto.randomUUID(),
                role: "user",
                parts: [{ type: "text", text: v3UserMessage }],
              },
            ];

            // Execute with automatic step tracking via onStepFinish
            await composer.streamAgentExecutionFromPrompt(v3Prompt);
          }
        } catch (e) {
          console.error("Failed to parse substeps block:", e);
        }
      }

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
