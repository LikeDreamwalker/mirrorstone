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
    try {
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
        return { error: `Search failed with status ${res.status}` };
      }
      const data = await res.json();
      return {
        results:
          (data.web?.results as BraveWebResult[] | undefined)
            ?.slice(0, 3)
            .map((r: BraveWebResult) => ({
              title: r.title,
              url: r.url,
              snippet: r.description,
            })) ?? [],
      };
    } catch (e) {
      return { error: "Search failed due to a network or server error." };
    }
  },
});

export const tools = {
  // displaySubsteps: substepsTool,
  onlineSearch: braveSearchTool,
};
