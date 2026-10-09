import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SessionState {
  currentRecipeId: string | null
  currentStep: number
  timerActive: boolean
  timerPaused: boolean
  timerSeconds: number
  timerRemaining: number
  timerEndsAt: number | null
  timerLabel: string
  timerStepKey: string | null
  setRecipe: (id: string | null) => void
  nextStep: () => void
  prevStep: () => void
  setStep: (i: number) => void
  setTimerActive: (active: boolean) => void
  toggleTimer: () => void
  setStepTimer: (seconds: number, key?: string) => void
  startTimer: (seconds: number, label?: string) => void
  pauseTimer: () => void
  resumeTimer: () => void
  stopTimer: () => void
  tickTimer: () => void
}

const remainingNow = (state: SessionState) => state.timerEndsAt
  ? Math.max(0, Math.ceil((state.timerEndsAt - Date.now()) / 1000))
  : state.timerRemaining

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      currentRecipeId: null,
      currentStep: 0,
      timerActive: false,
      timerPaused: false,
      timerSeconds: 0,
      timerRemaining: 0,
      timerEndsAt: null,
      timerLabel: '',
      timerStepKey: null,
      setRecipe: (id) =>
        set((s) => s.currentRecipeId === id ? {} : { currentRecipeId: id, currentStep: 0, timerActive: false, timerPaused: false, timerSeconds: 0, timerEndsAt: null, timerRemaining: 0, timerLabel: '', timerStepKey: null }),
      nextStep: () =>
        set((s) => ({ currentStep: Math.min(s.currentStep + 1, 9999) })),
      prevStep: () =>
        set((s) => ({ currentStep: Math.max(s.currentStep - 1, 0) })),
      setStep: (i) => set({ currentStep: i }),
      setTimerActive: (active) => set((s) => {
        const remaining = remainingNow(s)
        return active
          ? !s.timerActive && remaining > 0 ? { timerActive: true, timerPaused: false, timerEndsAt: Date.now() + remaining * 1000 } : {}
          : { timerActive: false, timerPaused: s.timerActive && remaining > 0, timerEndsAt: null, timerRemaining: remaining }
      }),
      toggleTimer: () => set((s) => {
        const remaining = remainingNow(s)
        return s.timerActive
          ? { timerActive: false, timerPaused: remaining > 0, timerEndsAt: null, timerRemaining: remaining }
          : remaining > 0 ? { timerActive: true, timerPaused: false, timerEndsAt: Date.now() + remaining * 1000 } : {}
      }),
      setStepTimer: (seconds, key) => set((s) => key && s.timerStepKey === key ? {} : { timerSeconds: seconds, timerRemaining: seconds, timerEndsAt: null, timerActive: false, timerPaused: false, timerLabel: '', timerStepKey: key ?? null }),
      startTimer: (seconds, label = '') => set({ timerSeconds: seconds, timerRemaining: seconds, timerEndsAt: Date.now() + seconds * 1000, timerActive: true, timerPaused: false, timerLabel: label }),
      pauseTimer: () => set((s) => {
        if (!s.timerActive) return {}
        const remaining = remainingNow(s)
        return { timerActive: false, timerPaused: remaining > 0, timerRemaining: remaining, timerEndsAt: null }
      }),
      resumeTimer: () => set((s) => s.timerPaused && s.timerRemaining > 0 ? { timerActive: true, timerPaused: false, timerEndsAt: Date.now() + s.timerRemaining * 1000 } : {}),
      stopTimer: () => set({ timerActive: false, timerPaused: false, timerSeconds: 0, timerRemaining: 0, timerEndsAt: null, timerLabel: '' }),
      tickTimer: () => set((s) => {
        if (!s.timerActive || !s.timerEndsAt) return {}
        const remaining = Math.max(0, Math.ceil((s.timerEndsAt - Date.now()) / 1000))
        return { timerRemaining: remaining, timerActive: remaining > 0, timerPaused: false, timerEndsAt: remaining > 0 ? s.timerEndsAt : null }
      })
    }),
    { name: 'palmchef-session' }
  )
)
