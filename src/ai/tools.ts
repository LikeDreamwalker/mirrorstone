import { tool as createTool } from "ai";
import { z } from "zod";

// export const substepsTool = createTool({
//   description: "Display substeps for a complex question",
//   parameters: z.object({
//     substeps: z
//       .array(
//         z.object({
//           action: z.string(),
//           params: z.string(),
//         })
//       )
//       .describe("The list of substeps, each with action and params"),
//   }),
//   // This is a dummy execute, you can adapt as needed
//   execute: async function ({ substeps }) {
//     return { substeps };
//   },
// });

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
    console.log("🔍 Brave Search - Starting search for query:", query);
    console.log("🔑 API Key exists:", !!process.env.BRAVE_API_KEY);

    try {
      const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(
        query
      )}`;
      console.log("📡 Request URL:", url);

      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          "X-Subscription-Token": process.env.BRAVE_API_KEY!,
        },
      });

      console.log("📊 Response status:", res.status);
      console.log("📊 Response statusText:", res.statusText);
      console.log(
        "📊 Response headers:",
        Object.fromEntries(res.headers.entries())
      );

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Request failed with status:", res.status);
        console.error("❌ Error response body:", errorText);
        return {
          error: `Search failed with status ${res.status}: ${errorText}`,
        };
      }

      const data = await res.json();
      console.log("✅ Raw API response:", JSON.stringify(data, null, 2));

      const results =
        (data.web?.results as BraveWebResult[] | undefined)
          ?.slice(0, 3)
          .map((r: BraveWebResult) => ({
            title: r.title,
            url: r.url,
            snippet: r.description,
          })) ?? [];

      console.log("🎯 Processed results count:", results.length);
      console.log("🎯 Processed results:", results);

      return { results };
    } catch (e) {
      console.error("💥 Brave Search error:", e);
      console.error("💥 Error details:", {
        name: (e as Error).name,
        message: (e as Error).message,
        stack: (e as Error).stack,
      });
      return { error: "Search failed due to a network or server error." };
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
      console.log("🌐 Web Scraper - Fetching:", url);

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

      // Basic text extraction (you can enhance this with a proper HTML parser)
      let content = html
        .replace(/<script[^>]*>.*?<\/script>/gis, "")
        .replace(/<style[^>]*>.*?<\/style>/gis, "")
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      // Limit content length to avoid overwhelming the model
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
  // displaySubsteps: substepsTool,
  onlineSearch: braveSearchTool,
  webScrapeTool,
};
