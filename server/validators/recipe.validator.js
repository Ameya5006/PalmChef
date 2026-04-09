import { z } from "zod";

export const StepSchema = z.object({
  text: z.string().min(5),
  seconds: z.number().int().positive().optional()
});

export const StepsSchema = z.array(StepSchema).min(1);