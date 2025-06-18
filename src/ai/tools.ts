import { tool as createTool } from "ai";
import { z } from "zod";
import { RateLimitTracker } from "../lib/rate-limit-tracker";
import { R1_SYSTEM_PROMPT, EXPERT_V3_PROMPT } from "./prompts";

type BraveWebResult = {
  title: string;
  url: string;
  description: string;
};

// Type for stream-aware tool context
type StreamContext = {
  sendUIMessage: (part: any) => void;
  apiKey: string;
  convertToModelMessages?: (messages: any[]) => any[];
  streamText?: any;
  stepCountIs?: any;
};

export const braveSearchTool = createTool({
  description: "Search the web for up-to-date information using Brave Search.",
  parameters: z.object({
    query: z.string().describe("The search query"),
  }),
  execute: async ({ query }) => {
    try {
      // 🛡️ Check global rate limit BEFORE making request
      if (RateLimitTracker.isRateLimited()) {
        const info = RateLimitTracker.getUsageInfo();
        console.log(
          `⚠️ Rate limit exceeded: ${info.used}/${info.limit} searches used`
        );

        return {
          results: [],
          message: "Search quota exceeded - no results available",
        };
      }

      console.log(`🔍 Brave Search - Query: "${query}"`);
      console.log(
        `📊 Current usage before search: ${
          RateLimitTracker.getUsageInfo().used
        }/1000`
      );

      const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(
        query
      )}`;

      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          "X-Subscription-Token": process.env.BRAVE_API_KEY!,
        },
      });

      RateLimitTracker.updateFromBraveResponse(res);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Brave API failed:", res.status, errorText);

        return {
          results: [],
          message: "Search temporarily unavailable - no results found",
        };
      }

      const data = await res.json();

      const results =
        (data.web?.results as BraveWebResult[] | undefined)
          ?.slice(0, 3)
          .map((r: BraveWebResult) => ({
            title: r.title,
            url: r.url,
            snippet: r.description,
          })) ?? [];

      const currentInfo = RateLimitTracker.getUsageInfo();
      console.log(
        `📊 Post-search usage: ${currentInfo.used}/${currentInfo.limit} (${currentInfo.percentage}%)`
      );

      return { results };
    } catch (e) {
      console.error("💥 Brave Search error:", e);
      return {
        results: [],
        message: "Search failed - no results available",
      };
    }
  },
});

export const webScrapeTool = createTool({
  description: "Fetch and extract content from a web page URL",
  parameters: z.object({
    url: z.string().describe("The URL to scrape"),
    selector: z
      .string()
      .optional()
      .describe("Optional CSS selector to target specific content"),
  }),
  execute: async ({ url, selector }) => {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      });

      if (!response.ok) {
        return { error: `Failed to fetch ${url}: ${response.status}` };
      }

      const html = await response.text();

      let content = html
        .replace(/<script[^>]*>.*?<\/script>/gis, "")
        .replace(/<style[^>]*>.*?<\/style>/gis, "")
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      if (content.length > 3000) {
        content = content.substring(0, 3000) + "...";
      }

      return { content };
    } catch (error) {
      console.error("Web scraper error:", error);
      return { error: "Failed to scrape the webpage" };
    }
  },
});

// Helper: Convert UI messages to DeepSeek format
function toDeepSeekMessages(
  messages: any[]
): { role: string; content: string }[] {
  return messages.map((msg) => ({
    role: msg.role,
    content:
      msg.parts
        ?.map((p: any) =>
          (p.type === "text" || p.type === "reasoning") && "text" in p
            ? p.text
            : ""
        )
        .join("") ?? "",
  }));
}

// Create stream-aware R1 analysis tool
export const createR1AnalysisTool = (streamContext: StreamContext) => {
  return createTool({
    description:
      "Use DeepSeek R1 for complex reasoning and analysis. R1 will stream its thinking process while this tool waits for the complete result.",
    parameters: z.object({
      question: z.string().describe("Question requiring deep R1 analysis"),
      context: z.string().optional().describe("Additional context for R1"),
    }),
    execute: async ({
      question,
      context,
    }): Promise<{
      analysis: string;
      reasoning: string;
      structured_data?: any;
      success: boolean;
    }> => {
      try {
        // Create R1 messages
        const r1Messages = [
          {
            role: "system",
            content: R1_SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: context
              ? `Context: ${context}\n\nQuestion: ${question}`
              : question,
          },
        ];

        // Stream R1 analysis
        const response = await fetch(
          "https://api.deepseek.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${streamContext.apiKey}`,
            },
            body: JSON.stringify({
              model: "deepseek-reasoner",
              messages: r1Messages,
              stream: true,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`R1 API error: ${response.status}`);
        }

        let fullAnalysis = "";
        let fullReasoning = "";
        const reader = response.body!.getReader();
        let buffer = "";

        // Stream R1's response in real-time
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
                // Stream reasoning chunks directly to UI
                streamContext.sendUIMessage({
                  type: "reasoning",
                  text: reasoning,
                });
              }

              if (content) {
                fullAnalysis += content;
                // Stream analysis chunks directly to UI
                streamContext.sendUIMessage({
                  type: "text",
                  text: content,
                });
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }
        }

        // Parse structured data from R1's response
        let structuredData = null;
        try {
          const jsonMatch = fullAnalysis.match(
            /\{[^}]*"type":\s*"substeps"[^}]*\}/
          );
          if (jsonMatch) {
            structuredData = JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          console.log("No structured data found in R1 response");
        }

        // Notify completion
        streamContext.sendUIMessage({
          type: "text",
          text: JSON.stringify({
            id: `r1-complete-${Date.now()}`,
            type: "component",
            status: "finished",
            componentType: "success",
            title: "Analysis Complete",
            content: "R1 has finished its deep analysis. Processing results...",
          }),
        });

        return {
          analysis: fullAnalysis,
          reasoning: fullReasoning,
          structured_data: structuredData,
          success: true,
        };
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);

        streamContext.sendUIMessage({
          type: "text",
          text: JSON.stringify({
            id: `r1-error-${Date.now()}`,
            type: "alert",
            status: "finished",
            variant: "error",
            title: "R1 Analysis Failed",
            content: `Failed to analyze with R1: ${errorMsg}`,
          }),
        });

        return {
          analysis: `R1 analysis failed: ${errorMsg}`,
          reasoning: "",
          success: false,
        };
      }
    },
  });
};

// Create stream-aware Expert V3 tool
export const createExpertV3Tool = (streamContext: StreamContext) => {
  return createTool({
    description:
      "Use Expert V3 for precise execution of technical tasks with high accuracy",
    parameters: z.object({
      task: z.string().describe("Specific task for Expert V3"),
      requirements: z.string().describe("Detailed requirements"),
      use_tools: z
        .boolean()
        .default(true)
        .describe("Whether to use search/web tools"),
    }),
    execute: async ({
      task,
      requirements,
      use_tools,
    }): Promise<{
      result: string;
      success: boolean;
    }> => {
      try {
        streamContext.sendUIMessage({
          type: "text",
          text: JSON.stringify({
            id: `expert-start-${Date.now()}`,
            type: "component",
            status: "finished",
            componentType: "info",
            title: "Expert Execution",
            content: "Engaging Expert V3 for precise implementation...",
          }),
        });

        // Create Expert V3 messages
        const expertMessages = [
          {
            role: "system" as const,
            parts: [{ type: "text" as const, text: EXPERT_V3_PROMPT }],
          },
          {
            role: "user" as const,
            parts: [
              {
                type: "text" as const,
                text: `Task: ${task}\n\nRequirements: ${requirements}`,
              },
            ],
          },
        ];

        // Expert V3 tools
        const expertTools = use_tools
          ? {
              onlineSearch: braveSearchTool,
              fetchWebPage: webScrapeTool,
            }
          : {};

        let responseText = "";

        // Use streamText if available in context
        if (
          streamContext.streamText &&
          streamContext.convertToModelMessages &&
          streamContext.stepCountIs
        ) {
          const result = streamContext.streamText({
            model: { provider: "deepseek", name: "deepseek-chat" }, // Simplified model reference
            messages: streamContext.convertToModelMessages(expertMessages),
            temperature: 0.1,
            tools: expertTools,
            stopWhen: streamContext.stepCountIs(8),
          });

          for await (const part of result.fullStream) {
            if (part.type === "text-delta") {
              responseText += part.textDelta;
            }
            streamContext.sendUIMessage(part);
          }
        } else {
          // Fallback to simple execution
          responseText = `Expert V3 executed: ${task} with requirements: ${requirements}`;

          streamContext.sendUIMessage({
            type: "text",
            text: JSON.stringify({
              id: `expert-work-${Date.now()}`,
              type: "text",
              status: "finished",
              content: responseText,
            }),
          });
        }

        streamContext.sendUIMessage({
          type: "text",
          text: JSON.stringify({
            id: `expert-complete-${Date.now()}`,
            type: "component",
            status: "finished",
            componentType: "success",
            title: "Expert Complete",
            content: "Expert V3 has completed the task.",
          }),
        });

        return {
          result: responseText,
          success: true,
        };
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);

        streamContext.sendUIMessage({
          type: "text",
          text: JSON.stringify({
            id: `expert-error-${Date.now()}`,
            type: "alert",
            status: "finished",
            variant: "error",
            title: "Expert V3 Failed",
            content: `Expert V3 execution failed: ${errorMsg}`,
          }),
        });

        return {
          result: `Expert V3 failed: ${errorMsg}`,
          success: false,
        };
      }
    },
  });
};

// Factory function to create tools with stream context
export const createStreamAwareTools = (streamContext: StreamContext) => ({
  onlineSearch: braveSearchTool,
  fetchWebPage: webScrapeTool,
  r1Analysis: createR1AnalysisTool(streamContext),
  expertV3: createExpertV3Tool(streamContext),
});

// Default tools for backward compatibility
export const tools = {
  onlineSearch: braveSearchTool,
  fetchWebPage: webScrapeTool,
};
