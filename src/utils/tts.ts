let currentUtterance: SpeechSynthesisUtterance | null = null

export type SpeakOptions = {
  rate?: number
  pitch?: number
  voice?: SpeechSynthesisVoice | null
}

export function speakText(text: string, options?: SpeakOptions) {
  if (!('speechSynthesis' in window)) {
    console.warn('TTS not supported in this browser')
    return
  }

  stopSpeech()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = options?.rate ?? 1
  utterance.pitch = options?.pitch ?? 1

  if (options?.voice) {
    utterance.voice = options.voice
  }

  currentUtterance = utterance
  window.speechSynthesis.speak(utterance)
}

export function stopSpeech() {
  if (!('speechSynthesis' in window)) return

  window.speechSynthesis.cancel()
  currentUtterance = null
}
