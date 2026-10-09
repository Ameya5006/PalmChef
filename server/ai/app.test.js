// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { createAiApp } from './app.js'
import { recipeSchema } from './schemas.js'
import { GeminiFailure } from './gemini.js'
import { toolDeclarations, validateToolCall } from './tools.js'

async function withServer(gemini, fn) {
  const server = createAiApp({ gemini }).listen(0)
  await new Promise(resolve => server.once('listening', resolve))
  const base = `http://127.0.0.1:${server.address().port}`
  const post = async (path, body) => {
    const response = await fetch(`${base}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    return { status: response.status, body: await response.json() }
  }
  try { await fn(post) } finally { await new Promise(resolve => server.close(resolve)) }
}

const context = { recipe: null, stepIndex: null, timer: { remainingSeconds: 0, active: false, paused: false, label: '' } }
const modelCall = (name, args, id) => ({ candidates: [{ content: { role: 'model', parts: [{ functionCall: { name, args, id } }] } }] })

describe('Gemini request and tool protocol', () => {
  it('declares all required tools with argument schemas', () => {
    expect(toolDeclarations).toHaveLength(13)
    expect(toolDeclarations.find(tool => tool.name === 'start_timer').parameters.required).toContain('duration_seconds')
    expect(toolDeclarations.find(tool => tool.name === 'stop_timer').description).toMatch(/cancel/)
    expect(toolDeclarations.find(tool => tool.name === 'generate_recipe').parameters.required).toContain('mode')
    expect(validateToolCall('generate_recipe', { request: 'Bhindi masala recipe', mode: 'new' }).ok).toBe(true)
    expect(validateToolCall('generate_recipe', { request: 'Change this recipe', mode: 'modify' }).ok).toBe(true)
    expect(validateToolCall('generate_recipe', { request: 'Change this recipe' }).ok).toBe(false)
    expect(validateToolCall('start_timer', { duration_seconds: 0 }).ok).toBe(false)
    expect(validateToolCall('stop_timer', {}).ok).toBe(true)
    expect(validateToolCall('stop_timer', { duration_seconds: 5 }).ok).toBe(false)
    expect(validateToolCall('run_shell', {}).ok).toBe(false)
  })
  it('validates structured recipes', () => {
    expect(recipeSchema.safeParse({ title: 'Bad' }).success).toBe(false)
  })
  it('passes a real tool result back to the model before the final answer', async () => {
    const seen = []
    const gemini = { generate: async (contents, declarations) => {
      seen.push({ contents: structuredClone(contents), declarations })
      return seen.length === 1 ? modelCall('start_timer', { duration_seconds: 60 }, 'call-1') : { candidates: [{ content: { role: 'model', parts: [{ text: 'The timer is running.' }] } }], text: 'The timer is running.' }
    } }
    await withServer(gemini, async post => {
      const first = await post('/api/ai/turn', { text: 'Start a timer', context })
      expect(first.body.calls[0].name).toBe('start_timer')
      const final = await post('/api/ai/continue', { sessionId: first.body.sessionId, results: [{ id: 'call-1', name: 'start_timer', result: { success: true } }] })
      expect(final.body.message).toBe('The timer is running.')
      expect(seen[1].contents.at(-1).parts[0].functionResponse.response.success).toBe(true)
      expect(seen[0].declarations).toHaveLength(13)
      expect((await post('/api/ai/continue', { sessionId: first.body.sessionId, results: [{ id: 'call-1', name: 'start_timer', result: { success: true } }] })).status).toBe(409)
    })
  })
  it('routes a stop command through the validated function response cycle', async () => {
    const seen = []
    const gemini = { generate: async (contents) => {
      seen.push(structuredClone(contents))
      return seen.length === 1 ? modelCall('stop_timer', {}, 'stop-1') : { candidates: [{ content: { role: 'model', parts: [{ text: 'Timer stopped.' }] } }] }
    } }
    await withServer(gemini, async post => {
      const first = await post('/api/ai/turn', { text: 'Stop the timer', context })
      expect(first.body.calls).toEqual([{ id: 'stop-1', name: 'stop_timer', args: {} }])
      const final = await post('/api/ai/continue', { sessionId: first.body.sessionId, results: [{ id: 'stop-1', name: 'stop_timer', result: { success: true, remainingSeconds: 0 } }] })
      expect(final.body.message).toBe('Timer stopped.')
      expect(seen[1].at(-1).parts[0].functionResponse.response.remainingSeconds).toBe(0)
    })
  })
  it('supports multiple calls and rejects mismatched results', async () => {
    const gemini = { generate: async () => ({ candidates: [{ content: { role: 'model', parts: [{ functionCall: { name: 'get_current_step', args: {}, id: 'a' } }, { functionCall: { name: 'get_ingredients', args: {}, id: 'b' } }] } }] }) }
    await withServer(gemini, async post => {
      const first = await post('/api/ai/turn', { text: 'Help', context })
      expect(first.body.calls).toHaveLength(2)
      expect((await post('/api/ai/continue', { sessionId: first.body.sessionId, results: [{ id: 'b', name: 'get_ingredients', result: {} }, { id: 'a', name: 'get_current_step', result: {} }] })).status).toBe(400)
    })
  })
  it('handles malformed requests and unavailable Gemini', async () => {
    await withServer({ generate: async () => { throw Error('offline') } }, async post => {
      expect((await post('/api/ai/turn', { text: '', context })).status).toBe(400)
      const failed = await post('/api/ai/turn', { text: 'Help', context })
      expect(failed.status).toBe(502)
      expect(failed.body.error).not.toContain('offline')
    })
  })
  it('accepts repeated valid recipe contexts larger than the old 32 KB limit', async () => {
    const largeContext = { ...context, recipe: {
      title: 'Large recipe', servings: 4,
      ingredients: Array.from({ length: 60 }, (_, index) => ({ name: `Ingredient ${index}`, quantity: 1, unit: 'cup', note: 'a'.repeat(100) })),
      steps: Array.from({ length: 50 }, () => 'Cook carefully. '.repeat(35))
    }, stepIndex: 49 }
    expect(Buffer.byteLength(JSON.stringify({ text: 'Help', context: largeContext }))).toBeGreaterThan(32 * 1024)
    let calls = 0
    await withServer({ generate: async () => { calls++; return { candidates: [{ content: { role: 'model', parts: [{ text: 'Ready.' }] } }] } } }, async post => {
      for (let index = 0; index < 2; index++) {
        const response = await post('/api/ai/turn', { text: 'Help', context: largeContext })
        expect(response.status).toBe(200)
        expect(response.body.message).toBe('Ready.')
      }
    })
    expect(calls).toBe(2)
  })
  it('returns safe JSON for oversized bodies and malformed JSON', async () => {
    const server = createAiApp({ gemini: { generate: async () => { throw Error('should not run') } } }).listen(0)
    await new Promise(resolve => server.once('listening', resolve))
    const url = `http://127.0.0.1:${server.address().port}/api/ai/turn`
    try {
      const oversized = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: 'x'.repeat(270_000) }) })
      expect(oversized.status).toBe(413)
      expect(oversized.headers.get('content-type')).toContain('application/json')
      expect((await oversized.json()).error).toMatch(/too large/i)
      const malformed = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' })
      expect(malformed.status).toBe(400)
      expect((await malformed.json()).error).toBe('Invalid JSON request.')
    } finally { await new Promise(resolve => server.close(resolve)) }
  })
  it('rejects duplicate model call IDs before the browser can execute them', async () => {
    const gemini = { generate: async () => ({ candidates: [{ content: { role: 'model', parts: [
      { functionCall: { name: 'next_step', args: {}, id: 'same' } },
      { functionCall: { name: 'next_step', args: {}, id: 'same' } }
    ] } }] }) }
    await withServer(gemini, async post => {
      const response = await post('/api/ai/turn', { text: 'Next', context })
      expect(response.body.calls).toBeUndefined()
      expect(response.body.message).toMatch(/invalid or excessive/)
    })
  })
  it('rejects invalid generated recipes from the Gemini adapter', async () => {
    const gemini = { recipe: async () => recipeSchema.parse({ title: 'bad' }) }
    await withServer(gemini, async post => {
      const response = await post('/api/ai/recipe', { request: 'Make soup', mode: 'new', context })
      expect(response.status).toBe(502)
      expect(response.body.error).not.toContain('Zod')
    })
  })
  it('requires complete active-recipe context for recipe modification', async () => {
    await withServer({ recipe: async () => { throw Error('must not generate') } }, async post => {
      const response = await post('/api/ai/recipe', { request: 'Modify this soup', mode: 'modify', context: { ...context, activeRecipe: true, recipe: null } })
      expect(response.status).toBe(400)
      expect(response.body.error).toMatch(/Complete recipe context/)
    })
  })
  it('keeps new recipe requests independent of active recipe data', async () => {
    const generated = { title: 'Bhindi Masala', description: 'A spiced okra dish for dinner.', servings: 2, prepMinutes: 10, cookMinutes: 20, ingredients: [{ name: 'Okra', quantity: 250, unit: 'g' }], steps: [{ text: 'Cook the okra with spices until tender.' }] }
    const seen = []
    await withServer({ recipe: async (...args) => { seen.push(args); return generated } }, async post => {
      const standalone = await post('/api/ai/recipe', { request: 'Bhindi masala recipe', mode: 'new', context: { ...context, activeRecipe: false } })
      expect(standalone.status).toBe(200)
      expect(standalone.body.recipe).toEqual(generated)
      const leaked = await post('/api/ai/recipe', { request: 'Bhindi masala recipe', mode: 'new', context: { ...context, activeRecipe: true } })
      expect(leaked.status).toBe(400)
    })
    expect(seen).toHaveLength(1)
    expect(seen[0][2]).toBe('new')
    expect(seen[0][1].recipe).toBeNull()
  })
  it('returns a sanitized busy error when primary and fallback are rate limited', async () => {
    await withServer({ recipe: async () => { throw new GeminiFailure('rate_limited', 429) } }, async post => {
      const response = await post('/api/ai/recipe', { request: 'Make soup', mode: 'new', context })
      expect(response.status).toBe(503)
      expect(response.body.error).toMatch(/busy/i)
      expect(JSON.stringify(response.body)).not.toMatch(/Gemini|429|model/i)
    })
  })
})
