export const runtime = "edge";

import { generateText, convertToModelMessages } from "ai";
import { deepseek } from "@ai-sdk/deepseek";
import type { UIMessage } from "ai";

// Action system definition
interface ActionDefinition {
  id: string;
  name: string;
  description: string;
  syntax: string;
  example: string;
  canRunInParallel: boolean; // New property to determine if action can run in parallel
  handler: (
    params: string,
    controller: ReadableStreamDefaultController,
    encoder: TextEncoder
  ) => Promise<void>;
}

// Define available actions
const AVAILABLE_ACTIONS: ActionDefinition[] = [
  {
    id: "ANSWER",
    name: "Answer Question",
    description: "Get a detailed answer to a specific question",
    syntax: "ANSWER: [question]",
    example: "ANSWER: What is machine learning?",
    canRunInParallel: true, // Independent questions can run in parallel
    handler: async (
      question: string,
      controller: ReadableStreamDefaultController,
      encoder: TextEncoder
    ) => {
      console.log("Executing ANSWER action for:", question);

      // Notify user
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            type: "text",
            role: "assistant",
            text: `\n\n**🔍 Researching: ${question}**\n`,
            step: "notify",
          })}\n\n`
        )
      );

      // Generate detailed answer
      const chatResult = await generateText({
        model: deepseek("deepseek-chat"),
        messages: [
          {
            role: "system",
            content:
              "You are an expert assistant. Provide comprehensive, well-structured answers with examples when relevant.",
          },
          { role: "user", content: question },
        ],
        temperature: 0.7,
      });

      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            type: "text",
            role: "assistant",
            text: chatResult.text + "\n",
            step: "answer",
          })}\n\n`
        )
      );
    },
  },
  {
    id: "SEARCH",
    name: "Search Information",
    description: "Search for specific information or facts",
    syntax: "SEARCH: [search query]",
    example: "SEARCH: latest developments in AI 2024",
    canRunInParallel: true, // Independent searches can run in parallel
    handler: async (
      query: string,
      controller: ReadableStreamDefaultController,
      encoder: TextEncoder
    ) => {
      console.log("Executing SEARCH action for:", query);

      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            type: "text",
            role: "assistant",
            text: `\n\n**🔎 Searching: ${query}**\n`,
            step: "notify",
          })}\n\n`
        )
      );

      const searchResult = await generateText({
        model: deepseek("deepseek-chat"),
        messages: [
          {
            role: "system",
            content:
              "You are a research assistant. Provide factual, up-to-date information about the search query. Focus on key facts and recent developments.",
          },
          {
            role: "user",
            content: `Search and provide information about: ${query}`,
          },
        ],
        temperature: 0.3,
      });

      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            type: "text",
            role: "assistant",
            text: searchResult.text + "\n",
            step: "search",
          })}\n\n`
        )
      );
    },
  },
  {
    id: "ANALYZE",
    name: "Deep Analysis",
    description: "Perform detailed analysis of a topic or concept",
    syntax: "ANALYZE: [topic to analyze]",
    example: "ANALYZE: pros and cons of remote work",
    canRunInParallel: true, // Independent analyses can run in parallel
    handler: async (
      topic: string,
      controller: ReadableStreamDefaultController,
      encoder: TextEncoder
    ) => {
      console.log("Executing ANALYZE action for:", topic);

      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            type: "text",
            role: "assistant",
            text: `\n\n**📊 Analyzing: ${topic}**\n`,
            step: "notify",
          })}\n\n`
        )
      );

      const analysisResult = await generateText({
        model: deepseek("deepseek-chat"),
        messages: [
          {
            role: "system",
            content:
              "You are an analytical expert. Provide structured analysis with multiple perspectives, pros/cons, implications, and conclusions.",
          },
          {
            role: "user",
            content: `Provide a comprehensive analysis of: ${topic}`,
          },
        ],
        temperature: 0.6,
      });

      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            type: "text",
            role: "assistant",
            text: analysisResult.text + "\n",
            step: "analysis",
          })}\n\n`
        )
      );
    },
  },
  {
    id: "SUMMARIZE",
    name: "Summarize Content",
    description: "Create a concise summary of given content",
    syntax: "SUMMARIZE: [content to summarize]",
    example: "SUMMARIZE: the main points of quantum computing",
    canRunInParallel: false, // Might depend on previous results, so run sequentially
    handler: async (
      content: string,
      controller: ReadableStreamDefaultController,
      encoder: TextEncoder
    ) => {
      console.log("Executing SUMMARIZE action for:", content);

      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            type: "text",
            role: "assistant",
            text: `\n\n**📝 Summarizing: ${content}**\n`,
            step: "notify",
          })}\n\n`
        )
      );

      const summaryResult = await generateText({
        model: deepseek("deepseek-chat"),
        messages: [
          {
            role: "system",
            content:
              "You are an expert at creating concise, informative summaries that capture key points and insights.",
          },
          { role: "user", content: `Summarize the following: ${content}` },
        ],
        temperature: 0.4,
      });

      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            type: "text",
            role: "assistant",
            text: summaryResult.text + "\n",
            step: "summary",
          })}\n\n`
        )
      );
    },
  },
];

// Helper functions
function buildAgentPrompt(): string {
  const actionsList = AVAILABLE_ACTIONS.map(
    (action) => `- ${action.syntax} - ${action.description}`
  ).join("\n");
  const examples = AVAILABLE_ACTIONS.map((action) => action.example).join("\n");

  return `You are an expert AI agent. For every user question:

- Always provide your best direct answer and reasoning first, even if the question is complex.
- If you think further steps or sub-questions are needed, output them after your answer, inside <substeps>...</substeps> tags, one per line.
- Each substep must use one of the available actions listed below:

Available Actions:
${actionsList}

Examples:
<substeps>
${examples}
</substeps>

- The <substeps> section should always come after your direct answer.
- Only use the exact action syntax provided above.
- Each action should be on its own line within the <substeps> tags.`;
}

function findActionHandler(
  actionLine: string
): { action: ActionDefinition; params: string } | null {
  for (const action of AVAILABLE_ACTIONS) {
    const regex = new RegExp(`^${action.id}\\s*:\\s*(.+)$`, "i");
    const match = actionLine.match(regex);
    if (match) {
      return { action, params: match[1].trim() };
    }
  }
  return null;
}

// Group actions for parallel/sequential execution
function groupActionsByExecution(
  actionMatches: Array<{ action: ActionDefinition; params: string }>
) {
  const parallelActions: Array<{ action: ActionDefinition; params: string }> =
    [];
  const sequentialActions: Array<{ action: ActionDefinition; params: string }> =
    [];

  for (const match of actionMatches) {
    if (match.action.canRunInParallel) {
      parallelActions.push(match);
    } else {
      sequentialActions.push(match);
    }
  }

  return { parallelActions, sequentialActions };
}

// Execute actions in parallel
async function executeActionsInParallel(
  actions: Array<{ action: ActionDefinition; params: string }>,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
) {
  if (actions.length === 0) return;

  console.log(
    `Executing ${actions.length} actions in parallel:`,
    actions.map((a) => `${a.action.id}: ${a.params}`)
  );

  // Notify user about parallel execution
  controller.enqueue(
    encoder.encode(
      `data: ${JSON.stringify({
        type: "text",
        role: "assistant",
        text: `\n\n**⚡ Running ${actions.length} tasks in parallel...**\n`,
        step: "parallel-start",
      })}\n\n`
    )
  );

  // Execute all actions concurrently
  const promises = actions.map(async ({ action, params }) => {
    try {
      await action.handler(params, controller, encoder);
      return { success: true, action: action.id, params };
    } catch (error) {
      console.error(`Error executing ${action.id}:`, error);
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            type: "error",
            role: "system",
            text: `Error executing ${action.name}: ${error}`,
            step: "error",
          })}\n\n`
        )
      );
      return { success: false, action: action.id, params, error };
    }
  });

  const results = await Promise.all(promises);

  // Notify completion
  const successCount = results.filter((r) => r.success).length;
  controller.enqueue(
    encoder.encode(
      `data: ${JSON.stringify({
        type: "text",
        role: "assistant",
        text: `\n**✅ Completed ${successCount}/${actions.length} parallel tasks**\n`,
        step: "parallel-complete",
      })}\n\n`
    )
  );

  return results;
}

// Execute actions sequentially
async function executeActionsSequentially(
  actions: Array<{ action: ActionDefinition; params: string }>,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
) {
  if (actions.length === 0) return;

  console.log(
    `Executing ${actions.length} actions sequentially:`,
    actions.map((a) => `${a.action.id}: ${a.params}`)
  );

  for (const { action, params } of actions) {
    try {
      await action.handler(params, controller, encoder);
    } catch (error) {
      console.error(`Error executing ${action.id}:`, error);
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            type: "error",
            role: "system",
            text: `Error executing ${action.name}: ${error}`,
            step: "error",
          })}\n\n`
        )
      );
    }
  }
}

// Helper: Stream DeepSeek R1 API (official, not AI SDK)
async function* streamDeepseekR1(messages: UIMessage[], apiKey: string) {
  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
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
  });

  if (!response.body) throw new Error("No response body from DeepSeek R1");

  const reader = response.body.getReader();
  let buffer = "";
  let reasonerText = "";
  let reasoningText = "";

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
          reasoningText += reasoning;
          yield {
            type: "reasoning",
            role: "assistant",
            text: reasoning,
            step: "reasoner",
          };
        }
        if (content) {
          reasonerText += content;
          yield {
            type: "text",
            role: "assistant",
            text: content,
            step: "reasoner",
          };
        }
      } catch {}
    }
  }
  return { reasonerText, reasoningText };
}

export async function POST(req: Request) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const { messages }: { messages: UIMessage[] } = await req.json();
        const apiKey = process.env.DEEPSEEK_API_KEY!;

        // Build dynamic agent prompt
        const agentPrompt: UIMessage = {
          id: "system-1",
          role: "system",
          parts: [
            {
              type: "text",
              text: buildAgentPrompt(),
            },
          ],
        };
        const agentMessages = [agentPrompt, ...messages];

        // Step 1: Stream DeepSeek R1 (reasoning and text parts)
        let r1Text = "";
        for await (const part of streamDeepseekR1(agentMessages, apiKey)) {
          if (part.type === "text") {
            r1Text += part.text;
          }
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(part)}\n\n`)
          );
        }

        console.log("=== DeepSeek R1 FULL OUTPUT ===");
        console.log(r1Text);

        // Step 2: Parse for <substeps>...</substeps>
        const substepsMatch = r1Text.match(/<substeps>([\s\S]*?)<\/substeps>/i);
        if (substepsMatch) {
          console.log("=== <substeps> FOUND ===");
          const substepsRaw = substepsMatch[1]
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean);

          // Parse all actions first
          const actionMatches: Array<{
            action: ActionDefinition;
            params: string;
          }> = [];
          const unknownActions: string[] = [];

          for (const stepLine of substepsRaw) {
            console.log("Processing substep:", stepLine);
            const actionMatch = findActionHandler(stepLine);
            if (actionMatch) {
              actionMatches.push(actionMatch);
            } else {
              unknownActions.push(stepLine);
            }
          }

          // Report unknown actions
          for (const unknownAction of unknownActions) {
            console.log("Unknown action format:", unknownAction);
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "text",
                  role: "assistant",
                  text: `\n⚠️ Unknown action: ${unknownAction}\n`,
                  step: "warning",
                })}\n\n`
              )
            );
          }

          // Group actions by execution type
          const { parallelActions, sequentialActions } =
            groupActionsByExecution(actionMatches);

          // Execute parallel actions first (they're independent)
          if (parallelActions.length > 0) {
            await executeActionsInParallel(
              parallelActions,
              controller,
              encoder
            );
          }

          // Execute sequential actions (they might depend on previous results)
          if (sequentialActions.length > 0) {
            await executeActionsSequentially(
              sequentialActions,
              controller,
              encoder
            );
          }

          // Summary of execution
          if (actionMatches.length > 0) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "text",
                  role: "assistant",
                  text: `\n**🎯 Completed all ${actionMatches.length} tasks** (${parallelActions.length} parallel, ${sequentialActions.length} sequential)\n`,
                  step: "completion-summary",
                })}\n\n`
              )
            );
          }
        } else {
          console.log("=== NO <substeps> FOUND ===");
        }

        controller.close();
      } catch (error) {
        console.error("=== ERROR ===", error);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "error",
              role: "system",
              errorText: String(error),
            })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
