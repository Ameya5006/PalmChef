import { describe, expect, it, vi } from 'vitest'
vi.mock('pdfjs-dist', () => ({ GlobalWorkerOptions: {} }))
import { classifyGesture } from '@/utils/gestures'
import { parseDurationToSeconds, splitIntoSteps } from '@/utils/pdfParser'
import { useSessionStore } from '@/store/session'
import { useRecipesStore } from '@/store/recipes'

describe('existing cooking regression checks', () => {
  it('keeps the gesture classifier safe for missing camera landmarks', () => {
    expect(classifyGesture([])).toEqual({ gesture: 'NONE', confidence: 0 })
  })
  it('splits extracted PDF text and detects a cooking duration', () => {
    expect(splitIntoSteps('Chop the vegetables.\n\nHeat the pan.\n\nSimmer for 15 minutes.')).toEqual(['Chop the vegetables.', 'Heat the pan.', 'Simmer for 15 minutes.'])
    expect(parseDurationToSeconds('Simmer for 1 hour 15 minutes')).toBe(4500)
  })
  it('shows that page-level PDF splitting can produce oversized imported steps without dropping text', () => {
    const page = 'Cook carefully. '.repeat(260)
    const steps = splitIntoSteps(`${page}\n\n${page}\n\n${page}`)
    expect(steps).toHaveLength(3)
    expect(steps[0].length).toBeGreaterThan(4000)
    expect(steps.join('')).toContain(page.trim())
  })
  it('persists local recipe and session updates through existing Zustand stores', () => {
    const recipe = { id: 'regression', title: 'Soup', sourceType: 'manual' as const, createdAt: 1, steps: [{ id: 'step', text: 'Heat soup.' }] }
    useRecipesStore.setState({ recipes: [] })
    useRecipesStore.getState().addRecipe(recipe)
    useSessionStore.getState().setRecipe(recipe.id)
    expect(JSON.parse(localStorage.getItem('palmchef-recipes') || '{}').state.recipes[0].id).toBe(recipe.id)
    expect(JSON.parse(localStorage.getItem('palmchef-session') || '{}').state.currentRecipeId).toBe(recipe.id)
  })
})
