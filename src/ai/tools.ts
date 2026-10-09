import { z } from 'zod'
import { useRecipesStore } from '@/store/recipes'
import { useSessionStore } from '@/store/session'
import { useSettingsStore } from '@/store/settings'
import { speakText, stopSpeech } from '@/utils/tts'
import type { Recipe } from '@/types'

const ingredientSchema = z.object({ name: z.string().trim().min(1).max(80), quantity: z.number().positive().max(10000), unit: z.string().trim().min(1).max(30), note: z.string().max(160).optional() }).strict()
export const generatedRecipeSchema = z.object({ title: z.string().trim().min(3).max(120), description: z.string().trim().min(10).max(500), servings: z.number().int().min(1).max(100), prepMinutes: z.number().int().min(0).max(1440), cookMinutes: z.number().int().min(0).max(1440), ingredients: z.array(ingredientSchema).min(1).max(60), steps: z.array(z.object({ text: z.string().trim().min(5).max(600), timerSeconds: z.number().int().min(1).max(86400).optional() }).strict()).min(1).max(50) }).strict()
export type GeneratedRecipe = z.infer<typeof generatedRecipeSchema>
export type Proposal = { recipe: GeneratedRecipe; warning?: string }
export type ToolCall = { id: string; name: string; args: unknown; error?: string }
export type ToolOutcome = { result: Record<string, unknown>; status: string; proposal?: Proposal }

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} sec`
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  return remainder ? `${minutes} min ${remainder} sec` : `${minutes} min`
}

// Keep these limits aligned with server/ai/schemas.js. Reject an oversized or
// malformed imported recipe instead of dropping ingredients or instructions.
const contextSchema = z.object({
  activeRecipe: z.boolean(),
  recipe: z.object({
    title: z.string().max(120),
    servings: z.number().int().min(1).max(100).optional(),
    ingredients: z.array(ingredientSchema).max(60).optional(),
    steps: z.array(z.string().max(600)).max(50).optional()
  }).strict().nullable(),
  stepIndex: z.number().int().min(0).max(49).nullable(),
  timer: z.object({ remainingSeconds: z.number().int().min(0).max(86400), active: z.boolean(), paused: z.boolean(), label: z.string().max(80) }).strict()
}).strict()

export function activeRecipe(): Recipe | undefined {
  const id = useSessionStore.getState().currentRecipeId
  return useRecipesStore.getState().recipes.find(recipe => recipe.id === id)
}

export function cookingContext(includeRecipe = true, detail: 'full' | 'ingredients' | 'summary' = 'full') {
  useSessionStore.getState().tickTimer()
  const state = useSessionStore.getState()
  const recipe = includeRecipe ? activeRecipe() : undefined
  const remainingSeconds = state.timerActive && state.timerEndsAt ? Math.max(0, Math.ceil((state.timerEndsAt - Date.now()) / 1000)) : state.timerRemaining || 0
  const context = {
    activeRecipe: Boolean(recipe),
    recipe: recipe && detail !== 'summary' ? { title: recipe.title, servings: recipe.servings, ingredients: recipe.ingredients, ...(detail === 'full' ? { steps: recipe.steps.map(step => step.text) } : {}) } : null,
    stepIndex: recipe?.steps.length ? Math.min(state.currentStep, recipe.steps.length - 1) : null,
    timer: { remainingSeconds, active: state.timerActive, paused: state.timerPaused, label: state.timerLabel || '' }
  }
  if (!contextSchema.safeParse(context).success) throw new Error('This recipe exceeds the AI context limits. Use a shorter recipe or shorten its ingredients and instructions before asking the assistant.')
  return context
}

const argsSchema: Record<string, z.ZodTypeAny> = {
  start_timer: z.object({ duration_seconds: z.number().int().min(1).max(86400), label: z.string().max(80).optional() }).strict(),
  stop_timer: z.object({}).strict(), pause_timer: z.object({}).strict(), resume_timer: z.object({}).strict(), get_current_recipe: z.object({}).strict(), get_current_step: z.object({}).strict(), next_step: z.object({}).strict(), previous_step: z.object({}).strict(), repeat_instruction: z.object({}).strict(), get_ingredients: z.object({}).strict(),
  scale_recipe: z.object({ servings: z.number().int().min(1).max(100) }).strict(),
  substitute_ingredient: z.object({ ingredient: z.string().min(1).max(80), constraint: z.string().max(160).optional() }).strict(),
  generate_recipe: z.object({ request: z.string().min(3).max(500) }).strict()
}

export async function executeTool(call: ToolCall, apiBase = '', inCookingSession = true): Promise<ToolOutcome> {
  if (call.error) return { result: { success: false, error: call.error }, status: call.error }
  const schema = argsSchema[call.name]
  if (!schema) return { result: { success: false, error: 'Unsupported tool' }, status: 'Unsupported action' }
  const parsed = schema.safeParse(call.args)
  if (!parsed.success) return { result: { success: false, error: 'Invalid tool arguments' }, status: 'Invalid action' }
  const args = parsed.data as Record<string, any>
  useSessionStore.getState().tickTimer()
  const state = useSessionStore.getState()
  const recipe = inCookingSession ? activeRecipe() : undefined
  const fail = (error: string): ToolOutcome => ({ result: { success: false, error }, status: error })
  switch (call.name) {
    case 'start_timer': {
      if (!recipe) return fail('Open a recipe to use a cooking timer')
      state.startTimer(args.duration_seconds, args.label)
      return { result: { success: true, remainingSeconds: args.duration_seconds }, status: `Timer started · ${formatDuration(args.duration_seconds)}` }
    }
    case 'stop_timer': {
      if (!recipe) return fail('Open a recipe to use a cooking timer')
      if ((!state.timerActive && !state.timerPaused) || state.timerRemaining <= 0) return fail('No timer to stop')
      state.stopTimer()
      return { result: { success: true, remainingSeconds: 0 }, status: 'Timer stopped' }
    }
    case 'pause_timer': {
      if (!recipe) return fail('Open a recipe to use a cooking timer')
      if (!state.timerActive || cookingContext(inCookingSession, 'summary').timer.remainingSeconds <= 0) return fail('No running timer')
      state.pauseTimer()
      return { result: { success: true, remainingSeconds: useSessionStore.getState().timerRemaining }, status: 'Timer paused' }
    }
    case 'resume_timer': {
      if (!recipe) return fail('Open a recipe to use a cooking timer')
      if (!state.timerPaused || state.timerRemaining <= 0) return fail('No paused timer')
      state.resumeTimer()
      return { result: { success: true }, status: 'Timer resumed' }
    }
    case 'get_current_recipe':
      if (!recipe) return fail('No active recipe')
      try { return { result: { success: true, recipe: cookingContext(inCookingSession, 'full').recipe }, status: 'Recipe retrieved' } }
      catch { return fail('This recipe exceeds the AI context limits. Shorten its ingredients or instructions to use full-recipe questions.') }
    case 'get_current_step':
      if (!recipe?.steps[state.currentStep]) return fail('No active step')
      if (!z.string().max(600).safeParse(recipe.steps[state.currentStep].text).success) return fail('This instruction exceeds the AI context limits. Shorten it before asking about this step.')
      return { result: { success: true, stepNumber: state.currentStep + 1, instruction: recipe.steps[state.currentStep].text }, status: `Viewing step ${state.currentStep + 1}` }
    case 'next_step':
      if (!recipe) return fail('No active recipe')
      if (state.currentStep >= recipe.steps.length - 1) return fail('Already at the last step')
      state.nextStep()
      return { result: { success: true, stepNumber: useSessionStore.getState().currentStep + 1 }, status: `Moved to step ${useSessionStore.getState().currentStep + 1}` }
    case 'previous_step':
      if (!recipe) return fail('No active recipe')
      if (state.currentStep <= 0) return fail('Already at the first step')
      state.prevStep()
      return { result: { success: true, stepNumber: useSessionStore.getState().currentStep + 1 }, status: `Moved to step ${useSessionStore.getState().currentStep + 1}` }
    case 'repeat_instruction': {
      const step = recipe?.steps[state.currentStep]
      if (!step) return fail('No active instruction')
      if (!('speechSynthesis' in window)) return fail('Speech playback is unavailable')
      stopSpeech()
      const settings = useSettingsStore.getState()
      speakText(step.text, { rate: settings.voiceRate, pitch: settings.voicePitch })
      return { result: { success: true, instruction: step.text }, status: 'Instruction spoken' }
    }
    case 'get_ingredients':
      if (!recipe?.ingredients?.length) return fail('This recipe has no structured ingredients')
      try { return { result: { success: true, ingredients: cookingContext(inCookingSession, 'ingredients').recipe?.ingredients, servings: recipe.servings }, status: 'Ingredients retrieved' } }
      catch { return fail('This ingredient list exceeds the AI context limits. Shorten it before asking about ingredients.') }
    case 'scale_recipe': {
      if (!recipe?.ingredients?.length || !recipe.servings) return fail('This recipe has no scalable ingredient list')
      const factor = args.servings / recipe.servings
      const preview: GeneratedRecipe = { title: `${recipe.title} (${args.servings} servings)`, description: recipe.description || 'Adjusted serving preview; check ingredient amounts and cooking times.', servings: args.servings, prepMinutes: recipe.prepMinutes || 0, cookMinutes: recipe.cookMinutes || 0, ingredients: recipe.ingredients.map(item => ({ ...item, quantity: Number((item.quantity * factor).toPrecision(4)) })), steps: recipe.steps.map(step => ({ text: step.text, timerSeconds: step.timer?.seconds })) }
      if (!generatedRecipeSchema.safeParse(preview).success) return fail('This recipe cannot be scaled automatically')
      const warning = 'Review spices, leavening, pan size, temperature and cooking times; these may not scale linearly.'
      return { result: { success: true, previewReady: true, warning, saved: false }, status: 'Scaled recipe ready for review', proposal: { recipe: preview, warning } }
    }
    case 'substitute_ingredient':
      if (!recipe) return fail('No active recipe')
      try { return { result: { success: true, ingredient: args.ingredient, constraint: args.constraint, recipe: cookingContext(inCookingSession, 'ingredients').recipe, instruction: 'Suggest a context-aware replacement with quantities and caveats. Do not claim the recipe was changed.' }, status: 'Substitution context prepared' } }
      catch { return fail('This ingredient list exceeds the AI context limits. Shorten it before asking for substitutions.') }
    case 'generate_recipe': {
      let context
      try { context = cookingContext(inCookingSession, 'full') }
      catch { return fail('This recipe exceeds the AI context limits. Shorten its ingredients or instructions before generating a modified recipe.') }
      const response = await fetch(`${apiBase}/api/ai/recipe`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ request: args.request, context }), signal: AbortSignal.timeout(65000), cache: 'no-store' })
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        const safeErrors = ['AI returned an invalid recipe twice. Please retry or simplify the request.', 'Recipe AI is busy. Please retry shortly.', 'Recipe AI is unavailable. Please retry shortly.']
        return fail(safeErrors.includes(body?.error) ? body.error : 'Recipe generation failed')
      }
      const body = await response.json()
      const validated = generatedRecipeSchema.safeParse(body.recipe)
      if (!validated.success) return fail('Generated recipe was invalid')
      return { result: { success: true, previewReady: true, saved: false }, status: 'Recipe ready for review', proposal: { recipe: validated.data } }
    }
    default: return fail('Unsupported tool')
  }
}

export function saveProposal(proposal: Proposal): Recipe {
  const data = generatedRecipeSchema.parse(proposal.recipe)
  const recipe: Recipe = { id: crypto.randomUUID(), sourceType: 'manual', createdAt: Date.now(), title: data.title, description: data.description, servings: data.servings, prepMinutes: data.prepMinutes, cookMinutes: data.cookMinutes, ingredients: data.ingredients, steps: data.steps.map(step => ({ id: crypto.randomUUID(), text: step.text, timer: step.timerSeconds ? { seconds: step.timerSeconds } : undefined })) }
  useRecipesStore.getState().addRecipe(recipe)
  return recipe
}
