import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Settings } from '@/types'

interface SettingsState extends Settings {
  toggleTheme: () => void
  setVoiceRate: (r: number) => void
  setVoicePitch: (p: number) => void
  setKitchenSafetyMode: (enabled: boolean) => void
  setGestureLock: (enabled: boolean) => void
  setVoiceCommandsEnabled: (enabled: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      voiceRate: 1,
      voicePitch: 1,
      kitchenSafetyMode: false,
      gestureLock: false,
      voiceCommandsEnabled: false,
      toggleTheme: () =>
        set({ theme: get().theme === 'light' ? 'dark' : 'light' }),
      setVoiceRate: (r) => set({ voiceRate: r }),
      setVoicePitch: (p) => set({ voicePitch: p }),
      setKitchenSafetyMode: (enabled) => set({ kitchenSafetyMode: enabled }),
      setGestureLock: (enabled) => set({ gestureLock: enabled }),
      setVoiceCommandsEnabled: (enabled) => set({ voiceCommandsEnabled: enabled })
    }),
    { name: 'palmchef-settings' }
  )
)
