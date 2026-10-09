import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ generateContent: vi.fn(), constructor: vi.fn() }))
vi.mock('@google/genai', () => ({ GoogleGenAI: class {
  constructor(options) { mocks.constructor(options); this.models = { generateContent: mocks.generateContent } }
} }))

import { createGemini, MODEL } from './gemini.js'
import { toolDeclarations } from './tools.js'

describe('Gemini SDK request construction', () => {
  it('keeps the key server side and sends real function declarations to generateContent', async () => {
    mocks.generateContent.mockResolvedValueOnce({ candidates: [{ content: { role: 'model', parts: [{ text: 'Okay' }] } }] })
    const gemini = createGemini('test-key')
    await gemini.generate([{ role: 'user', parts: [{ text: 'Set a timer' }] }], toolDeclarations)
    expect(mocks.constructor).toHaveBeenCalledWith({ apiKey: 'test-key' })
    const request = mocks.generateContent.mock.calls.at(-1)[0]
    expect(request.model).toBe(MODEL)
    expect(request.config.tools[0].functionDeclarations).toEqual(toolDeclarations)
    expect(request.contents[0].parts[0].text).toBe('Set a timer')
  })
  it('requests JSON schema output and rejects malformed model data', async () => {
    mocks.generateContent.mockResolvedValueOnce({ text: '{"title":"Invalid"}' })
    await expect(createGemini('test-key').recipe('Make soup', { recipe: null })).rejects.toThrow()
    const request = mocks.generateContent.mock.calls.at(-1)[0]
    expect(request.config.responseMimeType).toBe('application/json')
    expect(request.config.responseSchema.required).toContain('ingredients')
  })
})
