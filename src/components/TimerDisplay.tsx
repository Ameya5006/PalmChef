import React, { useEffect } from 'react'
import { useSessionStore } from '@/store/session'

interface Props { initialSeconds?: number }

const TimerDisplay: React.FC<Props> = ({ initialSeconds = 0 }) => {
  const timer = useSessionStore()
  useEffect(() => {
    const interval = window.setInterval(() => timer.tickTimer(), 500)
    timer.tickTimer()
    return () => clearInterval(interval)
  }, [timer.tickTimer])
  const seconds = timer.timerRemaining ?? initialSeconds
  const reset = () => timer.setStepTimer(timer.timerSeconds || initialSeconds)
  return <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800" aria-label="Cooking timer">
    {timer.timerLabel && <p className="text-center text-sm font-medium">{timer.timerLabel}</p>}
    <div className="text-center font-mono text-3xl" role="timer">{Math.floor(seconds / 60).toString().padStart(2, '0')}:{(seconds % 60).toString().padStart(2, '0')}</div>
    <div className="mt-3 flex justify-center gap-2">
      <button type="button" onClick={() => {
        if (timer.timerPaused) timer.resumeTimer()
        else if (!timer.timerActive && (timer.timerSeconds || initialSeconds) > 0) timer.startTimer(timer.timerSeconds || initialSeconds, timer.timerLabel)
      }} className="min-h-10 rounded-md bg-emerald-600 px-4 text-white">Start</button>
      <button type="button" onClick={timer.pauseTimer} className="min-h-10 rounded-md bg-amber-500 px-4 text-white">Pause</button>
      <button type="button" onClick={timer.stopTimer} className="min-h-10 rounded-md bg-rose-600 px-4 text-white">Stop</button>
      <button type="button" onClick={reset} className="min-h-10 rounded-md bg-slate-600 px-4 text-white">Reset</button>
    </div>
  </div>
}

export default TimerDisplay
