import { describe, expect, it } from 'vitest'
// @ts-expect-error The independent Node API is JavaScript and has no TypeScript declarations.
import { createAiApp } from '../../server/ai/app.js'
import { cookingContext, executeTool, saveProposal } from '@/ai/tools'
import { useRecipesStore } from '@/store/recipes'
import { useSessionStore } from '@/store/session'
import type { Recipe } from '@/types'

const recipe: Recipe = { id: 'flow-recipe', title: 'Tomato soup', sourceType: 'manual', createdAt: 1, servings: 2, ingredients: [{ name: 'Tomato', quantity: 2, unit: 'pieces' }], steps: [{ id: 'one', text: 'Chop tomatoes.' }, { id: 'two', text: 'Simmer the tomatoes.' }] }
const context = { recipe: { title: recipe.title, servings: 2, ingredients: recipe.ingredients, steps: recipe.steps.map(step => step.text) }, stepIndex: 0, timer: { remainingSeconds: 0, active: false, paused: false, label: '' } }

describe('AI to browser state integration', () => {
  it('sends only compact context for a timer request with a large active recipe', async () => {
    const large: Recipe = { ...recipe, steps: [{ id: 'long', text: 'private-instruction-'.repeat(40) }] }
    useRecipesStore.setState({ recipes: [large] })
    useSessionStore.getState().setRecipe(large.id)
    let turns = 0
    const gemini = { generate: async (contents: any[]) => {
      turns++
      if (turns === 1) {
        expect(JSON.stringify(contents)).not.toContain('private-instruction-')
        expect(contents[0].parts[0].text).toContain('"activeRecipe":true')
        return { candidates: [{ content: { role: 'model', parts: [{ functionCall: { id: 'large-timer', name: 'start_timer', args: { duration_seconds: 60 } } }] } }] }
      }
      expect(JSON.stringify(contents)).not.toContain('private-instruction-')
      expect(contents.at(-1).parts[0].functionResponse.response).toMatchObject({ success: true, remainingSeconds: 60 })
      return { candidates: [{ content: { role: 'model', parts: [{ text: 'Timer started.' }] } }] }
    } }
    const server = createAiApp({ gemini: gemini as any }).listen(0)
    await new Promise<void>(resolve => server.once('listening', resolve))
    const base = `http://127.0.0.1:${(server.address() as { port: number }).port}`
    try {
      const post = async (path: string, body: unknown) => (await fetch(`${base}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })).json()
      const first = await post('/api/ai/turn', { text: 'start a timer for 1 minute', context: cookingContext(true, 'summary') })
      const outcome = await executeTool(first.calls[0])
      const final = await post('/api/ai/continue', { sessionId: first.sessionId, results: [{ id: first.calls[0].id, name: first.calls[0].name, result: outcome.result }] })
      expect(final.message).toBe('Timer started.')
      expect(turns).toBe(2)
      expect(useSessionStore.getState().timerActive).toBe(true)
    } finally { await new Promise<void>(resolve => server.close(() => resolve())) }
  })
  it('executes a model-selected batch and returns actual state results to Gemini', async () => {
    useRecipesStore.setState({ recipes: [recipe] })
    useSessionStore.getState().setRecipe(recipe.id)
    let calls = 0
    const gemini = { generate: async (contents: any[]) => {
      calls++
      if (calls === 1) return { candidates: [{ content: { role: 'model', parts: [
        { functionCall: { id: 'timer-1', name: 'start_timer', args: { duration_seconds: 90 } } },
        { functionCall: { id: 'step-1', name: 'next_step', args: {} } }
      ] } }] }
      expect(contents.at(-1).parts.map((part: any) => part.functionResponse.response.success)).toEqual([true, true])
      return { candidates: [{ content: { role: 'model', parts: [{ text: 'Timer started and moved to step 2.' }] } }] }
    } }
    const server = createAiApp({ gemini: gemini as any }).listen(0)
    await new Promise<void>(resolve => server.once('listening', resolve))
    const base = `http://127.0.0.1:${(server.address() as { port: number }).port}`
    try {
      const post = async (path: string, body: unknown) => (await fetch(`${base}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })).json()
      const first = await post('/api/ai/turn', { text: 'Start a timer and go next', context })
      const results = []
      for (const call of first.calls) {
        const outcome = await executeTool(call)
        results.push({ id: call.id, name: call.name, result: outcome.result })
      }
      const final = await post('/api/ai/continue', { sessionId: first.sessionId, results })
      expect(final.message).toMatch(/step 2/)
      expect(useSessionStore.getState().timerActive).toBe(true)
      expect(useSessionStore.getState().currentStep).toBe(1)
      expect(calls).toBe(2)
    } finally { await new Promise<void>(resolve => server.close(() => resolve())) }
  })

  it('saves an accepted AI recipe into the same store used by cooking navigation', () => {
    useRecipesStore.setState({ recipes: [recipe] })
    const saved = saveProposal({ recipe: { title: 'Bean soup', description: 'A simple bean soup.', servings: 2, prepMinutes: 5, cookMinutes: 15, ingredients: [{ name: 'Beans', quantity: 1, unit: 'cup' }], steps: [{ text: 'Simmer beans until tender.' }, { text: 'Serve the hot soup.' }] } })
    expect(useRecipesStore.getState().recipes).toHaveLength(2)
    useSessionStore.getState().setRecipe(saved.id)
    useSessionStore.getState().nextStep()
    expect(useSessionStore.getState().currentStep).toBe(1)
    expect(useRecipesStore.getState().recipes[0]).toEqual(recipe)
  })
})
