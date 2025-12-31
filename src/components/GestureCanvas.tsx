import React, { useEffect, useRef, useState } from 'react'
import { Hands, type NormalizedLandmark } from '@mediapipe/hands'
import { classifyGesture, type PalmGesture } from '@/utils/gestures'

interface Props {
  onGesture: (g: PalmGesture) => void
  onGestureFrame?: (g: PalmGesture, confidence: number) => void
  throttleMs?: number
  minConfidence?: number
}

const solutionsPath =
  'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240'

const STABLE_MS = 300
const COOLDOWN_MS = 900

const GestureCanvas: React.FC<Props> = ({
  onGesture,
  onGestureFrame,
  throttleMs = 120,
  minConfidence = 0.8
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)

  const lastFrameRef = useRef(0)
  const stableGestureRef = useRef<PalmGesture>('NONE')
  const stableSinceRef = useRef(0)
  const cooldownUntilRef = useRef(0)

  const rafRef = useRef<number | null>(null)
  const handsRef = useRef<Hands | null>(null)

  useEffect(() => {
    let stream: MediaStream | null = null
    let mounted = true

    const setup = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        console.warn('Webcam not supported')
        return
      }

      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      })

      if (!mounted || !videoRef.current) return

      videoRef.current.srcObject = stream
      await videoRef.current.play()

      const hands = new Hands({
        locateFile: (file) => `${solutionsPath}/${file}`
      })

      hands.setOptions({
        maxNumHands: 1,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6,
        modelComplexity: 1
      })

      hands.onResults((results) => {
        const now = performance.now()
        if (now - lastFrameRef.current < throttleMs) return
        lastFrameRef.current = now

        const landmarks = results.multiHandLandmarks?.[0] as
          | NormalizedLandmark[]
          | undefined

        if (!landmarks || landmarks.length === 0) {
          stableGestureRef.current = 'NONE'
          stableSinceRef.current = now
          return
        }

        const res = classifyGesture(landmarks)
        onGestureFrame?.(res.gesture, res.confidence)

        if (res.confidence < minConfidence) return
        if (now < cooldownUntilRef.current) return

        if (res.gesture !== stableGestureRef.current) {
          stableGestureRef.current = res.gesture
          stableSinceRef.current = now
          return
        }

        if (now - stableSinceRef.current >= STABLE_MS) {
          onGesture(res.gesture)
          cooldownUntilRef.current = now + COOLDOWN_MS
          stableGestureRef.current = 'NONE'
        }
      })

      const tick = async () => {
        if (!mounted || !videoRef.current || !hands) return
        await hands.send({ image: videoRef.current })
        rafRef.current = requestAnimationFrame(tick)
      }

      tick()
      handsRef.current = hands
    }

    setup().catch(console.error)

    return () => {
      mounted = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      handsRef.current?.close()
      if (stream) stream.getTracks().forEach((t) => t.stop())
    }
  }, [onGesture, onGestureFrame, throttleMs, minConfidence])

  return (
    <div className="w-full">
      <video
        ref={videoRef}
        className="w-full rounded-xl border border-slate-200 dark:border-slate-700"
        muted
        playsInline
      />
    </div>
  )
}

export default GestureCanvas
