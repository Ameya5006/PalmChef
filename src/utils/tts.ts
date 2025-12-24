import { useSettingsStore } from '@/store/settings'

export function speakText(text: string) {
  if (!('speechSynthesis' in window)) return
  const synth = window.speechSynthesis
  if (synth.speaking) synth.cancel()

  const { voiceRate, voicePitch } = useSettingsStore.getState()
  const utter = new SpeechSynthesisUtterance(text)
  utter.rate = Math.min(Math.max(voiceRate, 0.5), 2)
  utter.pitch = Math.min(Math.max(voicePitch, 0), 2)
  // Prefer a local language-compatible voice if available
  const voices = synth.getVoices?.() || []
  const preferred = voices.find((v) => /en-|hi-|en_IN/i.test(v.lang)) || voices[0]
  if (preferred) utter.voice = preferred
  synth.speak(utter)
}

export function stopSpeech() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}
