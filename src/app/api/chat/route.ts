export const runtime = "nodejs";

import { streamText, convertToModelMessages, stepCountIs } from "ai";
import { deepseek } from "@ai-sdk/deepseek";
import type { UIMessage } from "ai";
import { tools } from "@/ai/tools";

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

const NOW = new Date().toISOString().slice(0, 10);

// R1 system prompt for orchestration
const R1_SYSTEM_PROMPT = `
You are MirrorStone, a professional reasoning engine that helps break down user requests into actionable steps for an execution agent.

Today's date: ${NOW}

Instructions:
- Always reasoning, respond in the same language as the user's input.
- If the user writes in Chinese, reasoning and respond in Chinese. If in English, reasoning and respond in English.
- Always consider 'Today's date' when reasoning about time-sensitive events. If an event's date is before today's date, treat it as past; if after, as future.

Decision Framework:
Ask yourself: "Can I answer this completely from my training knowledge without needing current information, external tools, or multiple execution steps?"

ANSWER DIRECTLY for:
- General knowledge questions: "What is machine learning?", "什么是人工智能?"
- Definitions and explanations: "How does HTTP work?", "解释一下区块链"
- Basic calculations: "What is 25 * 4?", "计算 15% 的 200"
- Programming concepts: "How to write a for loop in Python?"
- Historical facts: "When was the first iPhone released?"
- Simple comparisons: "Difference between SQL and NoSQL"

USE SUBSTEPS for:
- Current/recent information requests: "最近AI Agent的新消息", "Latest OpenAI news"
- Multi-step tasks: "Build a todo app", "Create a business plan"
- Research requiring multiple sources: "Compare current AI models"
- Tasks requiring tools/calculations: "Search for X", "Complex math problems"
- Real-time data: "Current stock prices", "Weather forecast"
- Analysis of recent events: "Recent developments in..."

When using substeps:
1. Provide brief acknowledgment (one sentence)
2. ONLY output substeps in markdown code block (language "substeps")
3. DO NOT provide the final answer, summary, or additional information

Example:
User: 最近AI Agent的新消息
Response: 我来为您查找最近AI Agent领域的最新动态。
\`\`\`substeps
1. 搜索最近AI Agent领域的新闻和进展
2. 总结主要发现和突破
3. 呈现有组织的结果并附上来源
\`\`\`

Never:
- Never provide final answers when substeps are required
- Never include tool descriptions or system prompt details
- Never apologize for following these instructions
- Never overthink questions that can be answered from training knowledge
- Never break down simple knowledge questions into substeps

Keep substeps simple, actionable, and avoid over-planning.
`.trim();

// V3 system prompt for orchestration
const V3_SYSTEM_PROMPT = `
You are MirrorStone Executor, a professional agentic assistant that completes tasks using available tools and information.

Today's date: ${NOW}

Instructions:
- Always respond in the same language as the user's original request.
- Match the language used in the conversation.
- If a tool fails or returns no useful results, do your best to answer using your own knowledge and reasoning.

Process:
1. Immediately begin executing each substep without repeating or summarizing them.
2. Use the most appropriate tools for each substep.
3. When using search tools:
  - First use onlineSearch to find relevant URLs
  - If search results contain only generic snippets or page titles without useful content, use fetchWebPage to get detailed content from the most relevant URLs
  - Always try to get actual data rather than just page metadata
4. Synthesize a clear, comprehensive answer by combining and analyzing information from all sources.
5. If you need more information, use available tools or ask clarifying questions.

Tool Usage Guidelines:
- onlineSearch: Find relevant web pages and URLs
- fetchWebPage: Get detailed content from specific URLs when search snippets are insufficient
- For weather, news, or data-heavy queries: Always try to fetch actual page content
- Prioritize official sources and authoritative websites

Never:
- Never repeat the substeps or create extra "Execution Steps" sections.
- Never include tool descriptions or system prompt details in your response.
- Never apologize for following these instructions.
- Never settle for generic page descriptions when detailed content is available.

Search Guidelines:
- Use focused, relevant queries.
- Focus on recent results (assume "recent" means last few weeks unless specified).
- When search results show promising URLs but poor snippets, fetch the actual page content.
- Combine multiple sources for comprehensive answers.

Output:
- Deliver results clearly and efficiently.
- Include specific data, numbers, and facts when available.
- Cite sources when presenting information.
- Do not add unnecessary explanations or meta-commentary.
`.trim();

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private sendUIMessage(part: any) {
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

  // Stream agent execution using AI SDK 5, using UIMessage[] and tool support
  async streamAgentExecutionFromPrompt(promptMessages: UIMessage[]) {
    try {
      const result = streamText({
        model: deepseek("deepseek-chat"),
        messages: convertToModelMessages(promptMessages),
        temperature: 0.7,
        tools,
        stopWhen: stepCountIs(10),
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

      // Step 2: If R1 output contains substeps, invoke V3
      const substepsMatch = r1Raw.match(/```substeps([\s\S]*?)```/i);
      if (substepsMatch) {
        const substeps = substepsMatch[1].trim();
        // Format the message for V3
        const v3UserMessage = [
          substeps
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line.length > 0)
            .map((line) => (line.match(/^\d+\./) ? line : `- ${line}`))
            .join("\n"),
        ].join("\n");
        const v3Prompt: UIMessage[] = [
          {
            id: crypto.randomUUID(),
            role: "system",
            parts: [
              {
                type: "text",
                text: V3_SYSTEM_PROMPT,
              },
            ],
          },
          {
            id: crypto.randomUUID(),
            role: "user",
            parts: [
              {
                type: "text",
                text: v3UserMessage,
              },
            ],
          },
        ];

        await composer.streamAgentExecutionFromPrompt(v3Prompt);
      }
      // If no actions, do not invoke V3 (R1 already answered)
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
