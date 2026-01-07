import React from "react"
import type { PalmGesture } from "@/utils/gestures"

interface Props {
  gesture: PalmGesture
  confidence: number
  className?: string
  placement?: 'overlay' | 'inline'
}

const labels: Record<PalmGesture, string> = {
  NEXT: "Next Step",
  PREV: "Previous Step",
  REPEAT: "Repeat Step",
  TIMER: "Pause/Resume",
  NONE: "No Hand"
}

const GestureHUD: React.FC<Props> = ({ gesture, confidence , className ,  placement = 'overlay'}) => {
  const pct = Math.round(confidence * 100)
  const locked = confidence >= 0.88 && gesture !== "NONE"
  const positionClass =
    placement === 'inline' ? 'relative w-full' : 'absolute z-50'
  return (
    <div className="absolute top-4 right-4 z-50">
      <div
        className={`${positionClass} ${placement === 'overlay' ? className ?? 'top-4 right-4' : className ?? ''} rounded-xl px-4 py-3 text-sm shadow-lg backdrop-blur
          ${locked ? "bg-green-500/90 text-white" : "bg-slate-800/80 text-white"}
        `}
      >
        <div className="font-medium">{labels[gesture]}</div>

        <div className="mt-2 flex items-center gap-2">
          <div className="h-1.5 w-24 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs">{pct}%</span>
        </div>

        <div className="mt-1 text-xs opacity-80">
          {locked ? "Locked" : "Stabilizing"}
        </div>
      </div>
    </div>
  )
}

export default GestureHUD
