import React from 'react'
import { PalmGesture } from '@/utils/gestures'

interface Props {
  gesture: PalmGesture
  hint?: string
}

const colors: Record<PalmGesture, string> = {
  NEXT: 'bg-emerald-500',
  PREV: 'bg-amber-500',
  REPEAT: 'bg-indigo-500',
  TIMER: 'bg-sky-500',
  NONE: 'bg-slate-500'
}

const labels: Record<PalmGesture, string> = {
  NEXT: 'Next',
  PREV: 'Previous',
  REPEAT: 'Repeat',
  TIMER: 'Start/Pause Timer',
  NONE: 'No Gesture'
}

const GestureHUD: React.FC<Props> = ({ gesture, hint }) => {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
      <div className={`h-3 w-3 rounded-full ${colors[gesture]}`} />
      <div className="text-sm">
        <div className="font-semibold">{labels[gesture]}</div>
        {hint && <div className="text-slate-500">{hint}</div>}
      </div>
    </div>
  )
}

export default GestureHUD
