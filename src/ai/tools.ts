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

export const tools = {
  displaySubsteps: substepsTool,
};
