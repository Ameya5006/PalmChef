import React, { useEffect, useRef, useState } from 'react'
import { Hands, type NormalizedLandmark } from '@mediapipe/hands'
import { classifyGesture, type GestureResult, type PalmGesture } from '@/utils/gestures'
interface Props {
  onGesture: (g: PalmGesture) => void
  onGestureFrame?: (g: PalmGesture, confidence: number) => void
  throttleMs?: number
  minConfidence?: number
  className?: string
}

const solutionsPath =
  'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240'

const STABLE_MS = 300
const COOLDOWN_MS = 900
const HISTORY_SIZE = 6

const GestureCanvas: React.FC<Props> = ({
  onGesture,
  onGestureFrame,
  throttleMs = 120,

  minConfidence = 0.5,
  className
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>(
    'idle'
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const lastFrameRef = useRef(0)
  const lastSendRef = useRef(0)
  const stableGestureRef = useRef<PalmGesture>('NONE')
  const stableSinceRef = useRef(0)
  const cooldownUntilRef = useRef(0)
  const processingRef = useRef(false)
  const historyRef = useRef<GestureResult[]>([])
  const onGestureRef = useRef(onGesture)
  const onGestureFrameRef = useRef(onGestureFrame)
  const throttleMsRef = useRef(throttleMs)
  const minConfidenceRef = useRef(minConfidence)

  const rafRef = useRef<number | null>(null)
  const handsRef = useRef<Hands | null>(null)
  useEffect(() => {
    onGestureRef.current = onGesture
  }, [onGesture])

  useEffect(() => {
    onGestureFrameRef.current = onGestureFrame
  }, [onGestureFrame])

  useEffect(() => {
    throttleMsRef.current = throttleMs
  }, [throttleMs])

  useEffect(() => {
    minConfidenceRef.current = minConfidence
  }, [minConfidence])


  useEffect(() => {
    let stream: MediaStream | null = null
    let mounted = true

    const setup = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        console.warn('Webcam not supported')
        setStatus('error')
        setErrorMessage('Webcam not supported in this browser.')
        return
      }


      setStatus('loading')
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 960 },
            height: { ideal: 540 }
          }
        })
      } catch (error) {
        console.error(error)
        setStatus('error')
        setErrorMessage('Camera access denied. Enable it to use gestures.')
        return
      }

      if (!mounted || !videoRef.current) return

      videoRef.current.srcObject = stream
      await videoRef.current.play()
      setStatus('ready')

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
        if (now - lastFrameRef.current < throttleMsRef.current) return
        lastFrameRef.current = now

        const landmarks = results.multiHandLandmarks?.[0] as
          | NormalizedLandmark[]
          | undefined

        if (!landmarks || landmarks.length === 0) {
          historyRef.current = []
          onGestureFrameRef.current?.('NONE', 0)
          stableGestureRef.current = 'NONE'
          stableSinceRef.current = now
          return
        }

        const res = classifyGesture(landmarks)
        historyRef.current = [...historyRef.current.slice(-HISTORY_SIZE + 1), res]
        const counts = historyRef.current.reduce<Record<PalmGesture, number>>(
          (acc, item) => {
            acc[item.gesture] = (acc[item.gesture] ?? 0) + 1
            return acc
          },
          { NEXT: 0, PREV: 0, REPEAT: 0, TIMER: 0, NONE: 0 }
        )
        const nonNoneGestures = (Object.keys(counts) as PalmGesture[]).filter(
          gesture => gesture !== 'NONE' && counts[gesture] > 0
        )
        const bestGesture =
          nonNoneGestures.length === 0
            ? 'NONE'
            : nonNoneGestures.reduce((best, gesture) =>
                counts[gesture] > counts[best] ? gesture : best
              )
        const bestConfidence =
          bestGesture === 'NONE'
            ? 0
            : historyRef.current
                .filter(item => item.gesture === bestGesture)
                .reduce((sum, item) => sum + item.confidence, 0) /
              (counts[bestGesture] || 1)

        onGestureFrameRef.current?.(bestGesture, bestConfidence)

        if (bestGesture === 'NONE') return
        if (counts[bestGesture] < 2) return
        if (bestConfidence < minConfidenceRef.current) return
        if (now < cooldownUntilRef.current) return

        if (bestGesture !== stableGestureRef.current) {
          stableGestureRef.current = bestGesture
          stableSinceRef.current = now
          return
        }

        if (now - stableSinceRef.current >= STABLE_MS) {
          onGestureRef.current(bestGesture)
          cooldownUntilRef.current = now + COOLDOWN_MS
          stableGestureRef.current = 'NONE'
        }
      })

      const tick = async () => {
        if (!mounted || !videoRef.current || !hands) return
        const now = performance.now()
        if (
          processingRef.current ||
          now - lastSendRef.current < throttleMsRef.current
        ) {
          rafRef.current = requestAnimationFrame(tick)
          return
        }
        processingRef.current = true
        lastSendRef.current = now
        try {
          await hands.send({ image: videoRef.current })
        } finally {
          processingRef.current = false
        }
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
  }, [])

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-950/90 shadow-sm dark:border-slate-700 ${className ?? ''}`}
    >
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        muted
        playsInline
      />
      {status !== 'ready' && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70 text-sm text-white">
          {status === 'loading' && 'Starting camera...'}
          {status === 'error' && errorMessage}
          {status === 'idle' && 'Preparing camera...'}
        </div>
      )}
    </div>
  )
}

export default GestureCanvas