import { tool as createTool } from "ai";
import { z } from "zod";
import { RateLimitTracker } from "../lib/rate-limit-tracker";

type BraveWebResult = {
  title: string;
  url: string;
  description: string;
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

        // Return empty results to model (as requested - just tell model we found nothing)
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

      // 🌊 Update global state with EVERY response (success or failure)
      RateLimitTracker.updateFromBraveResponse(res);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Brave API failed:", res.status, errorText);

        // Return empty results instead of error to avoid breaking the model
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

      // Log current state after successful search
      const currentInfo = RateLimitTracker.getUsageInfo();
      console.log(
        `📊 Post-search usage: ${currentInfo.used}/${currentInfo.limit} (${currentInfo.percentage}%)`
      );

      return { results };
    } catch (e) {
      console.error("💥 Brave Search error:", e);

      // Return empty results instead of error
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

      // Basic text extraction
      let content = html
        .replace(/<script[^>]*>.*?<\/script>/gis, "")
        .replace(/<style[^>]*>.*?<\/style>/gis, "")
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      // Limit content length
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

export const tools = {
  onlineSearch: braveSearchTool,
  fetchWebPage: webScrapeTool,
};
