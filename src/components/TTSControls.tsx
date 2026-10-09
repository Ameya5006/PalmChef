import React, { useState } from 'react'
import { speakText, stopSpeech } from '@/utils/tts'
import { useSettingsStore } from '@/store/settings'

interface Props {
  currentText?: string
}

const TTSControls: React.FC<Props> = ({ currentText }) => {
  const { voiceRate, voicePitch, setVoicePitch, setVoiceRate } = useSettingsStore()
  const [speaking, setSpeaking] = useState(false)

  const handleSpeak = () => {
    if (currentText) {
      speakText(currentText)
      setSpeaking(true)
    }
  }
  const handleStop = () => {
    stopSpeech()
    setSpeaking(false)
  }

  return (
    <div className="rounded-xl border p-4 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between gap-4">
        <div className="font-semibold">Voice</div>
        <div className="flex gap-2">
          {!speaking ? (
            <button onClick={handleSpeak} className="px-3 py-1 rounded-md bg-sky-500 text-white">
              Speak
            </button>
          ) : (
            <button onClick={handleStop} className="px-3 py-1 rounded-md bg-red-500 text-white">
              Stop
            </button>
          )}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="text-sm">
          Rate: {voiceRate.toFixed(2)}
          <input
            type="range"
            min={0.5}
            max={2}
            step={0.05}
            value={voiceRate}
            onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
            className="w-full"
          />
        </label>
        <label className="text-sm">
          Pitch: {voicePitch.toFixed(2)}
          <input
            type="range"
            min={0}
            max={2}
            step={0.05}
            value={voicePitch}
            onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
            className="w-full"
          />
        </label>
      </div>
    </div>
  )
}

export default TTSControls
