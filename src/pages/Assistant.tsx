import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import GestureCanvas from '@/components/GestureCanvas'
import GestureHUD from '@/components/GestureHUD'
import TimerDisplay from '@/components/TimerDisplay'
import TTSControls from '@/components/TTSControls'
import Toast from '@/components/Toast'
import { useRecipesStore } from '@/store/recipes'
import { useSessionStore } from '@/store/session'
import { PalmGesture } from '@/utils/gestures'
import { speakText, stopSpeech } from '@/utils/tts'

function extractDurationSeconds(text: string): number | null {
  // Detect durations like "15 minutes", "1 hour", "1h 30m"
  const re = /(?:(\d+)\s*hours?)?\s*(?:(\d+)\s*minutes?|(\d+)\s*mins?)|(\d+)\s*h(?:\s*(\d+)\s*m)?/i
  const match = text.match(re)
  if (!match) return null
  const h1 = parseInt(match[1] || '0', 10) || 0
  const m1 = parseInt(match[2] || match[3] || '0', 10) || 0
  const h2 = parseInt(match[4] || '0', 10) || 0
  const m2 = parseInt(match[5] || '0', 10) || 0
  const hours = h1 || h2
  const mins = m1 || m2
  const total = hours * 3600 + mins * 60
  return total > 0 ? total : null
}

const Assistant: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const recipes = useRecipesStore((s) => s.recipes)
  const recipe = useMemo(() => recipes.find((r) => r.id === id) || null, [recipes, id])
  const { currentStep, setRecipe, nextStep, prevStep, setStep } = useSessionStore()
  const [toast, setToast] = useState<string | null>(null)
  const [timerBase, setTimerBase] = useState(0)
  const [timerToggle, setTimerToggle] = useState(0)
  const [liveGesture, setLiveGesture] = useState<PalmGesture>('NONE')

  useEffect(() => {
    setRecipe(id ?? null)
  }, [id, setRecipe])

  useEffect(() => {
    if (!recipe) return
    const stepText = recipe.steps[currentStep] || ''
    if (stepText) {
      speakText(stepText)
      const duration = extractDurationSeconds(stepText)
      if (duration) {
        setTimerBase(duration)
        setTimerToggle((n) => n + 1) // start
        setToast(`Timer started for ${Math.round(duration / 60)} min`)
      }
    }
    return () => stopSpeech()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, recipe?.id])

  const onGesture = useCallback(
    (g: PalmGesture) => {
      setLiveGesture(g)
      if (!recipe) return
      if (g === 'NEXT') {
        if (currentStep < recipe.steps.length - 1) {
          setStep(currentStep + 1)
          setToast('Next step')
        }
      } else if (g === 'PREV') {
        if (currentStep > 0) {
          setStep(currentStep - 1)
          setToast('Previous step')
        }
      } else if (g === 'REPEAT') {
        speakText(recipe.steps[currentStep] || '')
        setToast('Repeat step')
      } else if (g === 'TIMER') {
        setTimerToggle((n) => n + 1) // toggle start/pause
        setToast('Timer toggled')
      }
    },
    [currentStep, recipe, setStep]
  )

  if (!recipe) {
    return (
      <div className="text-center py-16">
        <p className="mb-4">Recipe not found.</p>
        <Link to="/recipes" className="text-sky-500 hover:underline">
          Back to recipes
        </Link>
      </div>
    )
  }

  const stepText = recipe.steps[currentStep] || ''

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">{recipe.title}</h1>
        <div className="rounded-xl border p-4 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 min-h-[140px]">
          <div className="text-sm text-slate-500 mb-2">Step {currentStep + 1} of {recipe.steps.length}</div>
          <div className="text-lg leading-relaxed">{stepText}</div>
        </div>

        <TTSControls currentText={stepText} />

        <div className="grid sm:grid-cols-2 gap-4">
          <TimerDisplay key={timerBase} initialSeconds={timerBase} externalToggle={timerToggle} />
          <GestureHUD gesture={liveGesture} hint="Use your hand to control the recipe." />
        </div>
      </div>

      <div className="space-y-4">
        <GestureCanvas onGesture={onGesture} />
        <div className="rounded-xl border p-4 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <div className="text-sm font-semibold mb-2">Controls</div>
          <ul className="text-sm list-disc pl-5 space-y-1">
            <li>✋ Open Palm → Next Step</li>
            <li>✊ Fist → Previous Step</li>
            <li>✌️ Victory → Repeat Step</li>
            <li>👍 Thumbs Up → Start/Pause Timer</li>
          </ul>
        </div>
      </div>

      {toast && <Toast message={toast} />}
    </div>
  )
}

export default Assistant
