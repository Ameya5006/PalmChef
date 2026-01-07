export type TimerMeta = {
  seconds: number
  label?: string
}

export type RecipeStep = {
  id: string
  text: string
  timer?: TimerMeta
}

export type Recipe = {
  id: string
  title: string
  sourceType: "pdf" | "url" | "manual"
  sourceRef?: string
  createdAt: number
  steps: RecipeStep[]
}

export interface Settings {
  theme: "light" | "dark"
  voiceRate: number
  voicePitch: number
}


export interface UserProfile {
  id: string
  name: string
  email?: string
  avatarUrl?: string
  isAuthenticated: boolean
}
