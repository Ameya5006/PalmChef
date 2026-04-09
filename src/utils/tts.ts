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

export function pauseSpeech() {
  if (!('speechSynthesis' in window)) return
  if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
    window.speechSynthesis.pause()
  }
}

export function resumeSpeech() {
  if (!('speechSynthesis' in window)) return
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume()
  }
}

export function isSpeechPaused() {
  return 'speechSynthesis' in window ? window.speechSynthesis.paused : false
}

export function isSpeechSpeaking() {
  return 'speechSynthesis' in window ? window.speechSynthesis.speaking : false
}