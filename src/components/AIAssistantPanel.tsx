import React, { useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChefHat, Mic, Send, Sparkles, X } from 'lucide-react'
import { cookingContext, executeTool, saveProposal, type Proposal } from '@/ai/tools'
import { readAiResponse, type AiResponse } from '@/ai/http'
import { resolveAiApiBase } from '@/ai/apiBase'
import { stopSpeech } from '@/utils/tts'

type Entry = { role: 'user' | 'assistant' | 'status' | 'failure'; text: string }
const configuredApiBase = String(import.meta.env.VITE_AI_API_BASE || '')
const prompts = ['What can I cook?', 'Help with this step', 'Set a timer for 10 minutes', 'Suggest an ingredient substitute']

const AIAssistantPanel: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [entries, setEntries] = useState<Entry[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [listening, setListening] = useState(false)
  const [error, setError] = useState('')
  const [retryText, setRetryText] = useState('')
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const recognitionRef = useRef<any>(null)
  const executionIds = useRef(new Set<string>())
  const busyRef = useRef(false)
  const navigate = useNavigate()
  const location = useLocation()
  const online = typeof navigator === 'undefined' ? true : navigator.onLine

  async function post(path: string, body: unknown, apiBase: string): Promise<AiResponse> {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 65000)
    try {
      const response = await fetch(`${apiBase}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: controller.signal, cache: 'no-store' })
      return await readAiResponse(response)
    } finally { clearTimeout(timeout) }
  }

  async function send(text: string) {
    if (!text.trim() || busyRef.current) return
    if (!navigator.onLine) { setError('AI assistance requires an internet connection. Your cooking controls still work.'); return }
    busyRef.current = true
    setBusy(true)
    setError('')
    setRetryText(text)
    setInput('')
    setEntries(old => [...old, { role: 'user', text }])
    try {
      const apiBase = resolveAiApiBase(configuredApiBase, import.meta.env.PROD)
      let response = await post('/api/ai/turn', { text, context: cookingContext(location.pathname.startsWith('/assistant/'), 'summary') }, apiBase)
      for (let round = 0; round < 3 && response.calls?.length; round++) {
        const results = []
        for (const call of response.calls) {
          let outcome
          if (executionIds.current.has(call.id)) outcome = { result: { success: false, error: 'Duplicate action blocked' }, status: 'Duplicate action blocked' }
          else {
            executionIds.current.add(call.id)
            try { outcome = await executeTool(call, apiBase, location.pathname.startsWith('/assistant/')) }
            catch { outcome = { result: { success: false, error: 'Action failed' }, status: 'Action failed' } }
          }
          setEntries(old => [...old, { role: outcome.result.success === true ? 'status' : 'failure', text: outcome.status }])
          if (outcome.result.success === true && !call.name.startsWith('get_') && call.name !== 'substitute_ingredient') setRetryText('')
          if (outcome.proposal) setProposal(outcome.proposal)
          results.push({ id: call.id, name: call.name, result: outcome.result })
        }
        response = await post('/api/ai/continue', { sessionId: response.sessionId, results }, apiBase)
      }
      setEntries(old => [...old, { role: 'assistant', text: response.message || 'The assistant could not finish. Please try again.' }])
    } catch (err) {
      setError(err instanceof Error && err.name === 'AbortError' ? 'AI request timed out. Your cooking controls still work.' : err instanceof Error ? err.message : 'AI is unavailable.')
    } finally { busyRef.current = false; setBusy(false) }
  }

  function startMicrophone() {
    if (listening) { recognitionRef.current?.stop(); return }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) { setError('Speech recognition is unavailable in this browser. Type your request instead.'); return }
    stopSpeech()
    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition
    recognition.lang = navigator.language || 'en-US'
    recognition.interimResults = false
    recognition.continuous = false
    recognition.onresult = (event: any) => { setInput(event.results[0][0].transcript); setError('') }
    recognition.onerror = (event: any) => setError(event.error === 'not-allowed' ? 'Microphone permission was denied.' : 'Could not hear the request. Please try typing it.')
    recognition.onend = () => setListening(false)
    try { recognition.start(); setListening(true); setError('') }
    catch { setError('Microphone could not start. Please type your request.') }
  }

  function accept() {
    if (!proposal) return
    try {
      const saved = saveProposal(proposal)
      setProposal(null)
      setEntries(old => [...old, { role: 'status', text: `Saved ${saved.title} to your recipes` }])
      setOpen(false)
      navigate(`/assistant/${saved.id}`)
    } catch { setError('Could not save this recipe. Please retry.') }
  }

  return <>
    <button type="button" onClick={() => setOpen(true)} aria-label="Open AI cooking assistant" className="fixed bottom-5 right-5 z-40 flex min-h-12 items-center gap-2 rounded-full bg-sky-700 px-5 text-sm font-semibold text-white shadow-lg transition hover:bg-sky-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:bg-sky-600"><Sparkles size={18} /> Ask PalmChef</button>
    {open && <div className="fixed inset-0 z-50 flex items-end justify-end bg-slate-950/40 sm:items-stretch" onMouseDown={event => { if (event.target === event.currentTarget) setOpen(false) }}>
      <section role="dialog" aria-modal="true" aria-label="AI cooking assistant" className="flex h-[92dvh] w-full flex-col rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900 sm:h-full sm:max-w-md sm:rounded-none">
        <header className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-700"><div className="flex items-center gap-2"><ChefHat className="text-sky-700" size={22} /><div><h2 className="font-semibold">Ask PalmChef</h2><p className="text-xs text-slate-500">Cooking help and real app actions</p></div></div><button type="button" onClick={() => setOpen(false)} aria-label="Close assistant" className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={20} /></button></header>
        <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
          {entries.length === 0 && <div><p className="mb-3 text-sm text-slate-600 dark:text-slate-300">Ask about a recipe or control your cooking session.</p><div className="flex flex-wrap gap-2">{prompts.map(prompt => <button type="button" key={prompt} onClick={() => void send(prompt)} className="rounded-full border border-sky-200 px-3 py-2 text-left text-sm text-sky-800 hover:bg-sky-50 dark:text-sky-300">{prompt}</button>)}</div></div>}
          {entries.map((entry, index) => <div key={index} className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${entry.role === 'user' ? 'ml-auto bg-sky-700 text-white' : entry.role === 'status' ? 'border border-emerald-200 bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200' : entry.role === 'failure' ? 'border border-rose-200 bg-rose-50 text-rose-900 dark:bg-rose-950 dark:text-rose-200' : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'}`}>{entry.text}</div>)}
          {busy && <p className="text-sm text-slate-500">PalmChef is thinking…</p>}
          {proposal && <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm dark:border-sky-800 dark:bg-slate-800"><h3 className="font-semibold">{proposal.recipe.title}</h3><p className="mt-1">{proposal.recipe.description}</p><p className="mt-2">{proposal.recipe.servings} servings · {proposal.recipe.prepMinutes + proposal.recipe.cookMinutes} min · {proposal.recipe.ingredients.length} ingredients · {proposal.recipe.steps.length} steps</p><ul className="mt-2 list-disc pl-5">{proposal.recipe.ingredients.map((item, index) => <li key={index}>{item.quantity} {item.unit} {item.name}</li>)}</ul><p className="mt-2 text-slate-600 dark:text-slate-300">{proposal.warning || 'Review ingredients and steps before cooking.'}</p><div className="mt-3 flex gap-2"><button type="button" onClick={accept} className="rounded-lg bg-sky-700 px-4 py-2 text-white">Save and cook</button><button type="button" onClick={() => setProposal(null)} className="rounded-lg border px-4 py-2">Reject</button></div></div>}
          {error && <div role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-950 dark:text-rose-200">{error}{retryText && <button type="button" onClick={() => void send(retryText)} className="ml-2 font-semibold underline">Retry</button>}</div>}
        </div>
        <form onSubmit={event => { event.preventDefault(); void send(input) }} className="border-t border-slate-200 p-4 dark:border-slate-700"><div className="flex items-center gap-2"><button type="button" onClick={startMicrophone} aria-label={listening ? 'Stop microphone' : 'Start microphone'} aria-pressed={listening} className={`min-h-11 min-w-11 rounded-xl ${listening ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-white'}`}><Mic size={20} className="mx-auto" /></button><input value={input} onChange={event => setInput(event.target.value)} maxLength={1000} placeholder={listening ? 'Listening…' : 'Ask or give a cooking command'} aria-label="Message to PalmChef" className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /><button type="submit" disabled={busy || !input.trim() || !online} aria-label="Send message" className="min-h-11 min-w-11 rounded-xl bg-sky-700 text-white disabled:opacity-50"><Send size={18} className="mx-auto" /></button></div><p className="mt-2 text-xs text-slate-500">{listening ? 'Microphone on · tap again to stop. Review the text before sending.' : !online ? 'AI needs internet; cooking controls still work.' : 'Voice requests are transcribed for review before sending.'}</p></form>
      </section>
    </div>}
  </>
}

export default AIAssistantPanel
