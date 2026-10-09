import { z } from 'zod'

const empty = z.object({}).strict()
const specs = {
  start_timer: { schema: z.object({ duration_seconds: z.number().int().min(1).max(86400), label: z.string().max(80).optional() }).strict(), description: 'Start a new browser cooking countdown for the specified number of seconds. Replaces the current timer.', properties: { duration_seconds: { type: 'integer', description: 'Timer length in seconds, from 1 to 86400' }, label: { type: 'string', description: 'Optional short timer label' } }, required: ['duration_seconds'] },
  stop_timer: { schema: empty, description: 'Stop or cancel the current running or paused cooking timer and clear its remaining time. Use for stop, cancel or turn off; do not use pause_timer.' },
  pause_timer: { schema: empty, description: 'Temporarily pause a running cooking timer while keeping its remaining time for resume_timer.' },
  resume_timer: { schema: empty, description: 'Continue a paused cooking timer from its saved remaining time.' },
  get_current_recipe: { schema: empty, description: 'Get the active recipe.' },
  get_current_step: { schema: empty, description: 'Get the active instruction and step number.' },
  next_step: { schema: empty, description: 'Advance one instruction using the existing cooking navigation.' },
  previous_step: { schema: empty, description: 'Go back one cooking instruction.' },
  repeat_instruction: { schema: empty, description: 'Speak the current instruction aloud in the browser.' },
  get_ingredients: { schema: empty, description: 'Get ingredients and quantities in the active recipe.' },
  scale_recipe: { schema: z.object({ servings: z.number().int().min(1).max(100) }).strict(), description: 'Prepare a scaled recipe preview; user must confirm before saving.', properties: { servings: { type: 'integer' } }, required: ['servings'] },
  substitute_ingredient: { schema: z.object({ ingredient: z.string().trim().min(1).max(80), constraint: z.string().max(160).optional() }).strict(), description: 'Get the ingredient and recipe context for a substitution suggestion. Do not modify the recipe.', properties: { ingredient: { type: 'string' }, constraint: { type: 'string' } }, required: ['ingredient'] },
  generate_recipe: { schema: z.object({ request: z.string().trim().min(3).max(500) }).strict(), description: 'Generate a structured new or modified recipe for user confirmation.', properties: { request: { type: 'string' } }, required: ['request'] }
}

export const toolDeclarations = Object.entries(specs).map(([name, spec]) => ({ name, description: spec.description, parameters: { type: 'object', properties: spec.properties ?? {}, required: spec.required ?? [] } }))

export function validateToolCall(name, args) {
  if (!Object.hasOwn(specs, name)) return { ok: false, error: 'Unsupported tool' }
  const parsed = specs[name].schema.safeParse(args ?? {})
  return parsed.success ? { ok: true, args: parsed.data } : { ok: false, error: 'Invalid tool arguments' }
}
