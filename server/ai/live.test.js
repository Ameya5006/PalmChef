import { describe, expect, it } from 'vitest'
import { createGemini } from './gemini.js'

describe('optional live Gemini smoke test', () => {
  it.skipIf(process.env.PALMCHEF_RUN_LIVE_GEMINI !== '1')('returns a real recipe when explicitly enabled', async () => {
    if (!process.env.GEMINI_API_KEY) throw new Error('Set GEMINI_API_KEY before enabling the live smoke test')
    const recipe = await createGemini().recipe('Give me a simple two-serving tomato pasta recipe.', { recipe: null })
    expect(recipe.title.length).toBeGreaterThan(2)
    expect(recipe.ingredients.length).toBeGreaterThan(0)
    expect(recipe.steps.length).toBeGreaterThan(0)
  }, 30_000)
})
