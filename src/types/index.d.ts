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
  ingredients?: Ingredient[]
}

export type Ingredient = {
  id: string
  name: string
  quantity?: string
  unit?: string
  firstUsedStepIndex: number
}

export interface Settings {
  theme: "light" | "dark"
  voiceRate: number
  voicePitch: number
  kitchenSafetyMode: boolean
  gestureLock: boolean
  voiceCommandsEnabled: boolean
}


export interface UserProfile {
  id: string
  name: string
  email?: string
  avatarUrl?: string
  isAuthenticated: boolean
}
declare global {
  interface Window {
    SpeechRecognition?: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition?: {
      new (): SpeechRecognition;
    };
  }

  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onstart: (() => void) | null;
    onend: (() => void) | null;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    start: () => void;
    stop: () => void;
  }

  interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
  }
}

export {};