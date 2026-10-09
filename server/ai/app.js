import express from 'express'
import cors from 'cors'
import crypto from 'node:crypto'
import { turnSchema, continueSchema, contextSchema } from './schemas.js'
import { toolDeclarations, validateToolCall } from './tools.js'
import { createGemini } from './gemini.js'
import { aiAllowedOrigin } from './config.js'

const MAX_ROUNDS = 3
const SESSION_TTL = 5 * 60_000
const REQUEST_TIMEOUT = 20_000
const timeout = async (promise) => {
  let timer
  try { return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('AI request timed out')), REQUEST_TIMEOUT) })]) }
  finally { clearTimeout(timer) }
}

export function createAiApp({ gemini = null, allowedOrigin = aiAllowedOrigin() } = {}) {
  // Also validate explicitly supplied origins; '*' must never enable production CORS.
  aiAllowedOrigin({ AI_ALLOWED_ORIGIN: allowedOrigin, NODE_ENV: 'production' })
  const app = express()
  const sessions = new Map()
  const rate = new Map()
  app.disable('x-powered-by')
  app.use((req, res, next) => {
    const origin = req.get('origin')
    if (origin && origin !== allowedOrigin) return res.status(403).json({ error: 'Origin not allowed' })
    next()
  })
  app.use(cors({ origin: allowedOrigin }))
  app.get('/healthz', (req, res) => res.json({ status: 'ok' }))
  // The validated maximum recipe context can exceed 32 KB, especially with
  // full instructions and ingredient notes. Keep an explicit body ceiling.
  app.use(express.json({ limit: '256kb' }))
  app.use((req, res, next) => {
    const now = Date.now()
    for (const [address, value] of rate) if (now - value.since > 120_000) rate.delete(address)
    const key = req.ip
    const entry = rate.get(key) ?? { count: 0, since: now }
    if (now - entry.since > 60_000) { entry.count = 0; entry.since = now }
    entry.count++
    rate.set(key, entry)
    if (entry.count > 20) return res.status(429).json({ error: 'Too many AI requests. Try again shortly.' })
    next()
  })

  function getGemini() { return gemini ?? createGemini() }
  function prune() {
    for (const [id, session] of sessions) if (session.expires < Date.now()) sessions.delete(id)
  }
  async function advance(session) {
    const response = await timeout(getGemini().generate(session.contents, toolDeclarations))
    const content = response.candidates?.[0]?.content
    if (!content?.parts?.length) {
      sessions.delete(session.id)
      return { message: 'The assistant returned no usable response. Please try again.' }
    }
    const calls = content.parts.filter(part => part.functionCall).map((part, index) => ({ id: part.functionCall.id || `${session.id}-${session.round}-${index}`, name: part.functionCall.name, args: part.functionCall.args ?? {} }))
    if (calls.length === 0) {
      sessions.delete(session.id)
      return { message: (response.text || content.parts.map(part => part.text ?? '').join('')).slice(0, 3000) || 'No response was returned.' }
    }
    if (session.round >= MAX_ROUNDS || calls.length > 4 || new Set(calls.map(call => call.id)).size !== calls.length || calls.some(call => typeof call.id !== 'string' || call.id.length > 100)) {
      sessions.delete(session.id)
      return { message: 'The assistant returned an invalid or excessive action batch. Please make another request.' }
    }
    const validated = calls.map(call => ({ ...call, validation: validateToolCall(call.name, call.args) }))
    session.contents.push(content)
    session.pending = validated.map(({ id, name }) => ({ id, name }))
    session.round++
    session.expires = Date.now() + SESSION_TTL
    return { sessionId: session.id, calls: validated.map(({ id, name, validation }) => ({ id, name, args: validation.ok ? validation.args : {}, error: validation.ok ? undefined : validation.error })) }
  }

  app.post('/api/ai/turn', async (req, res) => {
    const parsed = turnSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid request or cooking context.' })
    prune()
    if (sessions.size >= 100) return res.status(503).json({ error: 'Assistant is busy. Please retry.' })
    try {
      const session = { id: crypto.randomUUID(), round: 0, expires: Date.now() + SESSION_TTL, pending: [], contents: [{ role: 'user', parts: [{ text: `User request: ${parsed.data.text}\nCurrent cooking context: ${JSON.stringify(parsed.data.context)}` }] }] }
      sessions.set(session.id, session)
      res.json(await advance(session))
    } catch (error) {
      for (const [id, session] of sessions) if (!session.pending.length) sessions.delete(id)
      res.status(error.message === 'GEMINI_API_KEY is not configured' ? 503 : 502).json({ error: error.message === 'GEMINI_API_KEY is not configured' ? 'AI is not configured on the server.' : 'AI is unavailable. Your cooking controls still work.' })
    }
  })

  app.post('/api/ai/continue', async (req, res) => {
    const parsed = continueSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid tool results.' })
    prune()
    const session = sessions.get(parsed.data.sessionId)
    if (!session || !session.pending.length) return res.status(409).json({ error: 'This AI action has expired or was already completed.' })
    if (session.pending.length !== parsed.data.results.length || session.pending.some((call, index) => call.id !== parsed.data.results[index].id || call.name !== parsed.data.results[index].name)) return res.status(400).json({ error: 'Tool results do not match the pending actions.' })
    session.pending = []
    session.contents.push({ role: 'user', parts: parsed.data.results.map(({ id, name, result }) => ({ functionResponse: { id, name, response: result } })) })
    try { res.json(await advance(session)) }
    catch { sessions.delete(session.id); res.status(502).json({ error: 'AI could not finish the response. Actions already shown in the app remain in effect.' }) }
  })

  app.post('/api/ai/recipe', async (req, res) => {
    const input = req.body
    if (typeof input?.request !== 'string' || input.request.length < 3 || input.request.length > 500 || !contextSchema.safeParse(input.context).success) return res.status(400).json({ error: 'Invalid recipe request.' })
    try { res.json({ recipe: await timeout(getGemini().recipe(input.request, input.context)) }) }
    catch { res.status(502).json({ error: 'Could not generate a valid recipe. Please retry.' }) }
  })

  app.use((error, req, res, next) => {
    if (error.type === 'entity.too.large') return res.status(413).json({ error: 'AI request is too large. Shorten the recipe or request and try again.' })
    if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON request.' })
    res.status(500).json({ error: 'AI service error. Please try again.' })
  })

  return app
}
