let utterance: SpeechSynthesisUtterance | null = null;

type SpeakOptions = {
  rate?: number;
  pitch?: number;
};
let currentUtterance: SpeechSynthesisUtterance | null = null;

export function speakText(
  text: string,
  options?: {
    rate?: number;
    pitch?: number;
    voice?: SpeechSynthesisVoice | null;
  }
) {
  if (!("speechSynthesis" in window)) return;

  // Stop anything already speaking
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = options?.rate ?? 1;
  utterance.pitch = options?.pitch ?? 1;

  if (options?.voice) {
    utterance.voice = options.voice;
  }

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeech() {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  currentUtterance = null;
}

export function speak(text: string, options?: SpeakOptions) {
  if (!("speechSynthesis" in window)) {
    console.warn("TTS not supported in this browser");
    return;
  }

  stop();

  utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = options?.rate ?? 1;
  utterance.pitch = options?.pitch ?? 1;

  window.speechSynthesis.speak(utterance);
}

export function stop() {
  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();
  utterance = null;
}
