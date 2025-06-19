import { tool as createTool } from "ai";
import { z } from "zod";
import { RateLimitTracker } from "../lib/rate-limit-tracker";
import { HELPER_R1_PROMPT, HELPER_V3_PROMPT } from "./prompts";

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

// Updated R1 Analysis Tool (Level 2 Expert)
export const createHelperR1Tool = (streamContext: StreamContext) => {
  return createTool({
    description:
      "Engage R1 Level 2 Expert for complex reasoning, system design, architecture decisions, and advanced problem-solving. Use for multi-step analysis requiring deep thinking.",
    parameters: z.object({
      problem: z
        .string()
        .describe("Complex problem requiring deep R1 analysis"),
      context: z.string().optional().describe("Additional context for R1"),
      focus_areas: z
        .array(z.string())
        .optional()
        .describe("Specific areas to focus analysis on"),
    }),
    execute: async ({
      problem,
      context,
      focus_areas,
    }): Promise<{
      analysis: string;
      reasoning: string;
      structured_data?: any;
      success: boolean;
    }> => {
      try {
        // Create R1 messages with enhanced context
        const taskDescription = [
          `Complex Problem: ${problem}`,
          context ? `Context: ${context}` : "",
          focus_areas?.length ? `Focus Areas: ${focus_areas.join(", ")}` : "",
          "",
          "Please provide systematic analysis with clear reasoning chains and strategic recommendations.",
        ]
          .filter(Boolean)
          .join("\n");

        const r1Messages = [
          {
            role: "system",
            content: HELPER_R1_PROMPT,
          },
          {
            role: "user",
            content: taskDescription,
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
                streamContext.sendUIMessage({
                  type: "reasoning",
                  text: reasoning,
                });
              }

              if (content) {
                fullAnalysis += content;
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

        return {
          analysis: fullAnalysis,
          reasoning: fullReasoning,
          structured_data: structuredData,
          success: true,
        };
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);

        return {
          analysis: `R1 analysis failed: ${errorMsg}`,
          reasoning: "",
          success: false,
        };
      }
    },
  });
};

// Updated Expert V3 Tool (Level 1 Expert)
export const createHelperV3Tool = (streamContext: StreamContext) => {
  return createTool({
    description:
      "Engage Expert V3 Level 1 for precise execution, direct answers, and technical implementations requiring high accuracy.",
    parameters: z.object({
      task: z.string().describe("Specific task requiring precision"),
      requirements: z
        .string()
        .describe("Detailed requirements and constraints"),
      output_format: z
        .enum([
          "code",
          "specification",
          "documentation",
          "analysis",
          "implementation",
        ])
        .optional()
        .describe("Expected output format"),
      use_tools: z
        .boolean()
        .default(false)
        .describe("Whether to use search/web tools"),
    }),
    execute: async ({
      task,
      requirements,
      output_format,
      use_tools,
    }): Promise<{
      result: string;
      success: boolean;
    }> => {
      try {
        // Create Expert V3 messages with enhanced task specification
        const taskDescription = [
          `Task: ${task}`,
          `Requirements: ${requirements}`,
          output_format ? `Expected Output: ${output_format}` : "",
          "",
          "Please provide precise, accurate implementation with production-ready quality.",
        ]
          .filter(Boolean)
          .join("\n");

        const expertMessages = [
          {
            role: "system" as const,
            parts: [{ type: "text" as const, text: HELPER_V3_PROMPT }],
          },
          {
            role: "user" as const,
            parts: [
              {
                type: "text" as const,
                text: taskDescription,
              },
            ],
          },
        ];

        // Expert V3 tools (only if requested)
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
            model: { provider: "deepseek", name: "deepseek-chat" },
            messages: streamContext.convertToModelMessages(expertMessages),
            temperature: 0.1, // Maximum precision
            tools: expertTools,
            stopWhen: streamContext.stepCountIs(8),
          });

          for await (const part of result.fullStream) {
            if (part.type === "text-delta") {
              responseText += part.textDelta;
            }
            streamContext.sendUIMessage(part);
          }
        }

        return {
          result: responseText,
          success: true,
        };
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);

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
  helperR1: createHelperR1Tool(streamContext),
  helperV3: createHelperV3Tool(streamContext),
});
