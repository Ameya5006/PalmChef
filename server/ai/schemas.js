import { z } from 'zod'

export const ingredientSchema = z.object({ name: z.string().trim().min(1).max(80), quantity: z.number().positive().max(10000), unit: z.string().trim().min(1).max(30), note: z.string().max(160).optional() }).strict()
export const recipeSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(500),
  servings: z.number().int().min(1).max(100),
  prepMinutes: z.number().int().min(0).max(1440),
  cookMinutes: z.number().int().min(0).max(1440),
  ingredients: z.array(ingredientSchema).min(1).max(60),
  steps: z.array(z.object({ text: z.string().trim().min(5).max(600), timerSeconds: z.number().int().min(1).max(86400).optional() }).strict()).min(1).max(50)
}).strict()

export const contextSchema = z.object({
  activeRecipe: z.boolean().optional(),
  recipe: z.object({ title: z.string().max(120), servings: z.number().int().min(1).max(100).optional(), ingredients: z.array(ingredientSchema).max(60).optional(), steps: z.array(z.string().max(4000)).max(50) }).strict().refine(value => value.steps.reduce((total, step) => total + step.length, 0) <= 30_000).nullable(),
  stepIndex: z.number().int().min(0).max(9999).nullable(),
  timer: z.object({ remainingSeconds: z.number().int().min(0).max(86400), active: z.boolean(), paused: z.boolean(), label: z.string().max(80) }).strict()
}).strict()

export const turnSchema = z.object({ text: z.string().trim().min(1).max(1000), context: contextSchema }).strict()
export const continueSchema = z.object({ sessionId: z.string().uuid(), results: z.array(z.object({ id: z.string().min(1).max(100), name: z.string().min(1).max(80), result: z.record(z.string(), z.unknown()) }).strict()).min(1).max(4) }).strict()
