import React, { useEffect, useRef, useState } from 'react'

interface Props {
  initialSeconds?: number
  isRunning?: boolean
  onRunningChange?: (running: boolean) => void
}

const TimerDisplay: React.FC<Props> = ({
  initialSeconds = 0,
  isRunning,
  onRunningChange
}) => {
  const [seconds, setSeconds] = useState(initialSeconds)
  const [localRunning, setLocalRunning] = useState(false)
  const intervalRef = useRef<number | null>(null)
  const running = isRunning ?? localRunning

  useEffect(() => {
    setSeconds(initialSeconds)
    setLocalRunning(false)
    onRunningChange?.(false)
  }, [initialSeconds, onRunningChange])

  useEffect(() => {
    if (isRunning !== undefined) {
      setLocalRunning(isRunning)
    }
  }, [isRunning])

  useEffect(() => {
    if (running) {
      intervalRef.current = window.setInterval(() => {
        setSeconds((s) => Math.max(0, s - 1))
      }, 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running])

  const reset = () => setSeconds(initialSeconds)
  const start = () => {
    if (isRunning === undefined) setLocalRunning(true)
    onRunningChange?.(true)
  }
  const pause = () => {
    if (isRunning === undefined) setLocalRunning(false)
    onRunningChange?.(false)
  }

  const m = Math.floor(seconds / 60)
  const s = seconds % 60

  return (
    <div className="rounded-xl border p-4 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
      <div className="text-3xl font-mono text-center">
        {m.toString().padStart(2, '0')}:{s.toString().padStart(2, '0')}
      </div>
      <div className="mt-3 flex gap-2 justify-center">
        <button onClick={start} className="px-3 py-1 rounded-md bg-emerald-500 text-white">
          Start
        </button>
        <button onClick={pause} className="px-3 py-1 rounded-md bg-amber-500 text-white">
          Pause
        </button>
        <button onClick={reset} className="px-3 py-1 rounded-md bg-slate-500 text-white">
          Reset
        </button>
      </div>
    </div>
  )
}

export default TimerDisplay