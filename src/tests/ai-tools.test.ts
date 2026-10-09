import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cookingContext, executeTool, generatedRecipeSchema, saveProposal } from '@/ai/tools'
import { useRecipesStore } from '@/store/recipes'
import { useSessionStore } from '@/store/session'
import type { Recipe } from '@/types'

const recipe: Recipe = { id: 'one', title: 'Soup', sourceType: 'manual', createdAt: 1, servings: 4, description: 'A warm vegetable soup.', prepMinutes: 10, cookMinutes: 20, ingredients: [{ name: 'Carrot', quantity: 4, unit: 'pieces' }], steps: [{ id: 'a', text: 'Chop the carrots.' }, { id: 'b', text: 'Simmer for 20 minutes.', timer: { seconds: 1200 } }] }
const call = (name: string, args: unknown = {}) => ({ id: name, name, args })

beforeEach(() => {
  useRecipesStore.setState({ recipes: [recipe] })
  useSessionStore.getState().setRecipe('one')
  useSessionStore.getState().setStepTimer(1200)
})

describe('browser tool execution', () => {
  it('starts, pauses and resumes the real timer state', async () => {
    expect((await executeTool(call('start_timer', { duration_seconds: 60, label: 'Rice' }))).result.success).toBe(true)
    expect(useSessionStore.getState().timerActive).toBe(true)
    expect((await executeTool(call('pause_timer'))).result.success).toBe(true)
    expect(useSessionStore.getState().timerActive).toBe(false)
    expect((await executeTool(call('resume_timer'))).result.success).toBe(true)
  })
  it('stops running and paused timers and clears the shared countdown', async () => {
    await executeTool(call('start_timer', { duration_seconds: 90 }))
    expect((await executeTool(call('stop_timer'))).result).toEqual({ success: true, remainingSeconds: 0 })
    expect(useSessionStore.getState()).toMatchObject({ timerActive: false, timerRemaining: 0, timerSeconds: 0, timerEndsAt: null, timerLabel: '' })
    expect((await executeTool(call('resume_timer'))).result.success).toBe(false)
    await executeTool(call('start_timer', { duration_seconds: 10 }))
    await executeTool(call('pause_timer'))
    expect((await executeTool(call('stop_timer'))).result.success).toBe(true)
    expect((await executeTool(call('stop_timer'))).result.success).toBe(false)
  })
  it('distinguishes a prepared step duration from a paused timer', async () => {
    expect(cookingContext().timer.paused).toBe(false)
    expect((await executeTool(call('resume_timer'))).result.success).toBe(false)
    expect((await executeTool(call('stop_timer'))).result.success).toBe(false)
    await executeTool(call('start_timer', { duration_seconds: 30 }))
    await executeTool(call('pause_timer'))
    expect(cookingContext().timer).toMatchObject({ active: false, paused: true, remainingSeconds: 30 })
    await executeTool(call('resume_timer'))
    expect(cookingContext().timer).toMatchObject({ active: true, paused: false })
  })
  it('runs a five-second timer for five seconds and reports seconds accurately', async () => {
    vi.useFakeTimers()
    try {
      vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
      const started = await executeTool(call('start_timer', { duration_seconds: 5 }))
      expect(started.status).toBe('Timer started · 5 sec')
      expect(useSessionStore.getState().timerEndsAt).toBe(Date.now() + 5000)
      vi.advanceTimersByTime(4900)
      useSessionStore.getState().tickTimer()
      expect(useSessionStore.getState()).toMatchObject({ timerActive: true, timerRemaining: 1 })
      vi.advanceTimersByTime(100)
      useSessionStore.getState().tickTimer()
      expect(useSessionStore.getState()).toMatchObject({ timerActive: false, timerRemaining: 0, timerEndsAt: null })
      expect((await executeTool(call('stop_timer'))).result.success).toBe(false)
    } finally { vi.useRealTimers() }
  })
  it('formats partial minutes without rounding up', async () => {
    expect((await executeTool(call('start_timer', { duration_seconds: 65 }))).status).toBe('Timer started · 1 min 5 sec')
    expect((await executeTool(call('start_timer', { duration_seconds: 120 }))).status).toBe('Timer started · 2 min')
  })
  it('does not extend an already running timer when resume is requested', async () => {
    await executeTool(call('start_timer', { duration_seconds: 5 }))
    const endsAt = useSessionStore.getState().timerEndsAt
    expect((await executeTool(call('resume_timer'))).result.success).toBe(false)
    useSessionStore.getState().resumeTimer()
    expect(useSessionStore.getState().timerEndsAt).toBe(endsAt)
  })
  it('rejects malformed timer durations and invalid state', async () => {
    expect((await executeTool(call('start_timer', { duration_seconds: -1 }))).result.success).toBe(false)
    expect((await executeTool(call('previous_step'))).result.success).toBe(false)
  })
  it('requires an active recipe before starting a cooking timer', async () => {
    useSessionStore.getState().setRecipe('missing')
    expect((await executeTool(call('start_timer', { duration_seconds: 60 }))).result.success).toBe(false)
  })
  it('rejects oversized recipe context instead of silently dropping instructions', () => {
    useRecipesStore.setState({ recipes: [{ ...recipe, steps: [{ id: 'long', text: 'x'.repeat(601) }] }] })
    expect(() => cookingContext()).toThrow(/context limits/)
  })
  it('moves through the same session store as gestures', async () => {
    await executeTool(call('next_step'))
    expect(useSessionStore.getState().currentStep).toBe(1)
    expect((await executeTool(call('next_step'))).result.success).toBe(false)
    await executeTool(call('previous_step'))
    expect(useSessionStore.getState().currentStep).toBe(0)
  })
  it('returns real recipe and ingredient context', async () => {
    expect((await executeTool(call('get_current_recipe'))).result.success).toBe(true)
    expect((await executeTool(call('get_current_step'))).result.stepNumber).toBe(1)
    expect((await executeTool(call('get_ingredients'))).result.ingredients).toEqual(recipe.ingredients)
  })
  it('scales a preview without mutating the original', async () => {
    const outcome = await executeTool(call('scale_recipe', { servings: 2 }))
    expect(outcome.proposal?.recipe.ingredients[0].quantity).toBe(2)
    expect(useRecipesStore.getState().recipes).toHaveLength(1)
    expect(outcome.proposal?.warning).toMatch(/may not scale/)
  })
  it('retains small positive quantities when scaling', async () => {
    useRecipesStore.setState({ recipes: [{ ...recipe, ingredients: [{ name: 'Saffron', quantity: 0.01, unit: 'g' }] }] })
    const outcome = await executeTool(call('scale_recipe', { servings: 1 }))
    expect(outcome.proposal?.recipe.ingredients[0].quantity).toBe(0.0025)
  })
  it('does not report an expired timer as successfully paused', async () => {
    useSessionStore.getState().startTimer(1)
    useSessionStore.setState({ timerEndsAt: Date.now() - 1000 })
    expect((await executeTool(call('pause_timer'))).result.success).toBe(false)
  })
  it('validates a generated recipe before previewing it', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ recipe: { title: 'Bad' } }) } as Response)
    const outcome = await executeTool(call('generate_recipe', { request: 'Make soup' }))
    expect(outcome.result.success).toBe(false)
    expect(useRecipesStore.getState().recipes).toHaveLength(1)
    fetchMock.mockRestore()
  })
  it('saves generated recipes only after explicit acceptance', () => {
    const generated = { title: 'Bean stew', description: 'A filling bean stew.', servings: 2, prepMinutes: 5, cookMinutes: 20, ingredients: [{ name: 'Beans', quantity: 1, unit: 'cup' }], steps: [{ text: 'Simmer beans for twenty minutes.', timerSeconds: 1200 }] }
    expect(generatedRecipeSchema.safeParse(generated).success).toBe(true)
    expect(useRecipesStore.getState().recipes).toHaveLength(1)
    const saved = saveProposal({ recipe: generated })
    expect(saved.steps[0].timer?.seconds).toBe(1200)
    expect(useRecipesStore.getState().recipes).toHaveLength(2)
  })
  it('rejects unsupported tools without executing anything', async () => {
    expect((await executeTool(call('run_shell'))).result.success).toBe(false)
    expect(useRecipesStore.getState().recipes).toHaveLength(1)
  })
})
