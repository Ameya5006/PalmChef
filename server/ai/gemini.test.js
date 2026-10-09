import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ generateContent: vi.fn(), constructor: vi.fn() }))
vi.mock('@google/genai', () => ({ GoogleGenAI: class {
  constructor(options) { mocks.constructor(options); this.models = { generateContent: mocks.generateContent } }
} }))

import { createGemini, GeminiFailure, MODEL, FALLBACK_MODEL } from './gemini.js'
import { toolDeclarations } from './tools.js'

describe('Gemini SDK request construction', () => {
  beforeEach(() => vi.clearAllMocks())
  it('keeps the key server side and sends real function declarations to generateContent', async () => {
    mocks.generateContent.mockResolvedValueOnce({ candidates: [{ content: { role: 'model', parts: [{ text: 'Okay' }] } }] })
    const gemini = createGemini('test-key')
    await gemini.generate([{ role: 'user', parts: [{ text: 'Set a timer' }] }], toolDeclarations)
    expect(mocks.constructor).toHaveBeenCalledWith({ apiKey: 'test-key' })
    const request = mocks.generateContent.mock.calls.at(-1)[0]
    expect(request.model).toBe(MODEL)
    expect(request.config.httpOptions).toEqual({ timeout: 18_000, retryOptions: { attempts: 1 } })
    expect(request.config.tools[0].functionDeclarations).toEqual(toolDeclarations)
    expect(request.contents[0].parts[0].text).toBe('Set a timer')
  })
  it('requests JSON schema output and rejects malformed model data', async () => {
    mocks.generateContent.mockResolvedValue({ text: '{"title":"Invalid"}' })
    await expect(createGemini('test-key').recipe('Make soup', { recipe: null })).rejects.toThrow()
    expect(mocks.generateContent).toHaveBeenCalledTimes(2)
    const request = mocks.generateContent.mock.calls.at(-1)[0]
    expect(request.config.responseMimeType).toBe('application/json')
    expect(request.config.responseSchema.required).toContain('ingredients')
  })

  const validRecipe = { title: 'Vegetable Soup', description: 'A simple warming vegetable soup.', servings: 4, prepMinutes: 10, cookMinutes: 20, ingredients: [{ name: 'Carrot', quantity: 2, unit: 'pieces' }], steps: [{ text: 'Simmer the vegetables until tender.' }] }
  const providerError = status => Object.assign(new Error('private provider payload'), { status })

  it.each([429, 503])('falls back after primary HTTP %i and preserves all tool declarations and continuation contents', async status => {
    const contents = [{ role: 'user', parts: [{ functionResponse: { id: 'timer-1', name: 'start_timer', response: { success: true } } }] }]
    mocks.generateContent.mockRejectedValueOnce(providerError(status)).mockResolvedValueOnce({ text: 'Timer is running.' })
    const logs = []
    const result = await createGemini('test-key', { env: { GEMINI_MODEL: 'gemini-3.5-flash', GEMINI_FALLBACK_MODEL: FALLBACK_MODEL }, log: line => logs.push(JSON.parse(line)) }).generate(contents, toolDeclarations)
    expect(result.text).toBe('Timer is running.')
    expect(mocks.generateContent.mock.calls.map(call => call[0].model)).toEqual([MODEL, FALLBACK_MODEL])
    expect(mocks.generateContent.mock.calls[1][0].contents).toBe(contents)
    expect(mocks.generateContent.mock.calls[1][0].config.tools[0].functionDeclarations).toHaveLength(13)
    expect(logs).toEqual([{ event: 'gemini_request_failure', providerStatus: status, model: MODEL, failureCategory: status === 429 ? 'rate_limited' : 'provider_unavailable', fallbackAttemptCount: 0 }])
    expect(JSON.stringify(logs)).not.toContain('private provider payload')
  })

  it('uses a configured primary and returns successful requests without fallback', async () => {
    mocks.generateContent.mockResolvedValueOnce({ text: 'Ready.' })
    await createGemini('test-key', { env: { GEMINI_MODEL: 'custom-primary', GEMINI_FALLBACK_MODEL: 'custom-fallback' } }).generate([], toolDeclarations)
    expect(mocks.generateContent.mock.calls.map(call => call[0].model)).toEqual(['custom-primary'])
  })

  it('regenerates one malformed recipe and accepts only a fully validated result', async () => {
    mocks.generateContent.mockResolvedValueOnce({ text: '{broken' }).mockResolvedValueOnce({ text: JSON.stringify(validRecipe) })
    const recipe = await createGemini('test-key', { log: () => {} }).recipe('Make soup', { recipe: null })
    expect(recipe).toEqual(validRecipe)
    expect(mocks.generateContent).toHaveBeenCalledTimes(2)
    expect(mocks.generateContent.mock.calls[1][0].contents).toMatch(/previous response did not satisfy/)
  })

  it('falls back for recipe generation after a confirmed 429', async () => {
    mocks.generateContent.mockRejectedValueOnce(providerError(429)).mockResolvedValueOnce({ text: JSON.stringify(validRecipe) })
    const recipe = await createGemini('test-key', { log: () => {} }).recipe('Make soup', { recipe: null })
    expect(recipe).toEqual(validRecipe)
    expect(mocks.generateContent.mock.calls.map(call => call[0].model)).toEqual([MODEL, FALLBACK_MODEL])
    expect(mocks.generateContent.mock.calls[1][0].config.httpOptions.retryOptions.attempts).toBe(1)
  })
  it('uses separate new and modification instructions in structured recipe requests', async () => {
    mocks.generateContent.mockResolvedValue({ text: JSON.stringify(validRecipe) })
    const gemini = createGemini('test-key', { log: () => {} })
    await gemini.recipe('Bhindi masala recipe', { recipe: null }, 'new')
    await gemini.recipe('Change this soup', { recipe: { title: 'Soup' } }, 'modify')
    expect(mocks.generateContent.mock.calls[0][0].contents).toContain('Create a new standalone recipe')
    expect(mocks.generateContent.mock.calls[0][0].contents).not.toContain('Soup')
    expect(mocks.generateContent.mock.calls[1][0].contents).toContain('Modify the provided active recipe')
    expect(mocks.generateContent.mock.calls[1][0].contents).toContain('Soup')
  })

  it('stops after both models fail and never retries non-transient errors', async () => {
    mocks.generateContent.mockRejectedValueOnce(providerError(429)).mockRejectedValueOnce(providerError(503))
    await expect(createGemini('test-key', { log: () => {} }).generate([], toolDeclarations)).rejects.toMatchObject({ category: 'provider_unavailable', status: 503 })
    expect(mocks.generateContent).toHaveBeenCalledTimes(2)
    mocks.generateContent.mockRejectedValueOnce(providerError(400))
    await expect(createGemini('test-key', { log: () => {} }).generate([], toolDeclarations)).rejects.toBeInstanceOf(GeminiFailure)
    expect(mocks.generateContent).toHaveBeenCalledTimes(3)
  })

  it('rejects a malformed recipe after exactly one regeneration', async () => {
    mocks.generateContent.mockResolvedValue({ text: '{"title":"Bad"}' })
    await expect(createGemini('test-key', { log: () => {} }).recipe('Make soup', { recipe: null })).rejects.toMatchObject({ category: 'invalid_recipe' })
    expect(mocks.generateContent).toHaveBeenCalledTimes(2)
  })
})
