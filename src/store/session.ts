import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SessionState {
  currentRecipeId: string | null
  currentStep: number
  timerActive: boolean
  setRecipe: (id: string | null) => void
  nextStep: () => void
  prevStep: () => void
  setStep: (i: number) => void
  toggleTimer: () => void
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      currentRecipeId: null,
      currentStep: 0,
      timerActive: false,
      setRecipe: (id) =>
        set({ currentRecipeId: id, currentStep: 0, timerActive: false }),
      nextStep: () =>
        set((s) => ({ currentStep: Math.min(s.currentStep + 1, 9999) })),
      prevStep: () =>
        set((s) => ({ currentStep: Math.max(s.currentStep - 1, 0) })),
      setStep: (i) => set({ currentStep: i }),
      toggleTimer: () => set((s) => ({ timerActive: !s.timerActive }))
    }),
    { name: 'palmchef-session' }
  )
)
