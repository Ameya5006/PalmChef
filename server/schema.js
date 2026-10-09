import { z } from "zod";

export const RecipeSchema = z.object({
  title: z.string().min(1),
  steps: z.array(
    z.object({
      text: z.string().min(5),
      seconds: z.number().int().positive().optional(),
      label: z.string().optional()
    })
  ).min(1)
});
