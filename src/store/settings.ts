import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Settings } from '@/types'

interface SettingsState extends Settings {
  toggleTheme: () => void
  setVoiceRate: (r: number) => void
  setVoicePitch: (p: number) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      voiceRate: 1,
      voicePitch: 1,
      toggleTheme: () =>
        set({ theme: get().theme === 'light' ? 'dark' : 'light' }),
      setVoiceRate: (r) => set({ voiceRate: r }),
      setVoicePitch: (p) => set({ voicePitch: p })
    }),
    { name: 'palmchef-settings' }
  )
)
