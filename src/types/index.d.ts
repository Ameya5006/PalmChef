export interface Recipe {
  id: string
  title: string
  steps: string[]
  duration?: number
}

export interface Settings {
  theme: 'light' | 'dark'
  voiceRate: number
  voicePitch: number
}
