import { tool as createTool } from "ai";
import { z } from "zod";
import { RateLimitTracker } from "../lib/rate-limit-tracker";
import { HELPER_R1_PROMPT } from "./prompts";

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

// Optimized R1 Tool - Focused on performance
export const createHelperR1Tool = (streamContext: StreamContext) => {
  return createTool({
    description:
      "Engage R1 for complex reasoning, system design, architecture decisions, and advanced problem-solving. Use for multi-step analysis requiring deep thinking.",
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
      success: boolean;
    }> => {
      try {
        // Simplified task description for better performance
        const taskDescription = [
          `Complex Problem: ${problem}`,
          context ? `Context: ${context}` : "",
          focus_areas?.length ? `Focus Areas: ${focus_areas.join(", ")}` : "",
          "",
          "Provide systematic analysis with clear reasoning and strategic recommendations.",
          "Use JSON blocks efficiently - focus on content quality over complex formatting.",
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

        return {
          analysis: fullAnalysis,
          reasoning: fullReasoning,
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

// Factory function to create tools with stream context
export const createStreamAwareTools = (streamContext: StreamContext) => ({
  onlineSearch: braveSearchTool,
  fetchWebPage: webScrapeTool,
  helperR1: createHelperR1Tool(streamContext),
});
