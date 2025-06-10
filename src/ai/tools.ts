import { tool as createTool } from "ai";
import { z } from "zod";

export const substepsTool = createTool({
  description: "Display substeps for a complex question",
  parameters: z.object({
    substeps: z
      .array(
        z.object({
          action: z.string(),
          params: z.string(),
        })
      )
      .describe("The list of substeps, each with action and params"),
  }),
  // This is a dummy execute, you can adapt as needed
  execute: async function ({ substeps }) {
    return { substeps };
  },
});

export const braveSearchTool = createTool({
  description: "Search the web for up-to-date information using Brave Search.",
  parameters: z.object({
    query: z.string().describe("The search query"),
  }),
  execute: async ({ query }) => {
    const res = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(
        query
      )}`,
      {
        headers: {
          Accept: "application/json",
          "X-Subscription-Token": process.env.BRAVE_API_KEY!,
        },
      }
    );
    if (!res.ok) {
      throw new Error("Brave Search API error: " + res.status);
    }
    const data = await res.json();

    return {
      results:
        data.web?.results?.slice(0, 3).map((r: any) => ({
          title: r.title,
          url: r.url,
          snippet: r.description,
        })) ?? [],
    };
  },
});

export const tools = {
  displaySubsteps: substepsTool,
  onlineSearch: braveSearchTool,
};
