import { describe, expect, it } from 'vitest'
import { resolveAiApiBase } from '@/ai/apiBase'

describe('AI service URL configuration', () => {
  it('uses the deployed HTTPS origin once for every AI path', () => {
    const base = resolveAiApiBase('https://palmchef-ai.onrender.com/', true)
    expect(`${base}/api/ai/turn`).toBe('https://palmchef-ai.onrender.com/api/ai/turn')
    expect(`${base}/api/ai/continue`).toBe('https://palmchef-ai.onrender.com/api/ai/continue')
    expect(`${base}/api/ai/recipe`).toBe('https://palmchef-ai.onrender.com/api/ai/recipe')
  })
  it('keeps the local proxy and rejects paths, HTTP production URLs, and missing production configuration', () => {
    expect(resolveAiApiBase('', false)).toBe('')
    expect(resolveAiApiBase('http://localhost:3001', false)).toBe('http://localhost:3001')
    expect(() => resolveAiApiBase('https://palmchef-ai.onrender.com/api/ai', true)).toThrow(/without \/api\/ai/)
    expect(() => resolveAiApiBase('http://palmchef-ai.onrender.com', true)).toThrow(/HTTPS/)
    expect(() => resolveAiApiBase('', true)).toThrow(/missing/)
  })
})
