import React, { useEffect, useRef, useState } from 'react'
import { Hands, type NormalizedLandmark } from '@mediapipe/hands'
import { classifyGesture, type PalmGesture } from '@/utils/gestures'

interface Props {
  onGesture: (g: PalmGesture) => void
  onGestureFrame?: (g: PalmGesture, confidence: number) => void
  throttleMs?: number
  minConfidence?: number
}


const solutionsPath = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240'

const GestureCanvas: React.FC<Props> = ({
  onGesture,
  onGestureFrame,
  throttleMs = 120,
  minConfidence = 0.8
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const lastTimeRef = useRef(0)
  const [stableGesture, setStableGesture] = useState<PalmGesture>('NONE')
  const stableSinceRef = useRef<number>(0)
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
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      if (!mounted) return
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

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
        if (now - lastTimeRef.current < throttleMs) return
        lastTimeRef.current = now

        const landmarks = (results.multiHandLandmarks?.[0] || []) as NormalizedLandmark[]
        if (!landmarks.length) {
          setStableGesture('NONE')
          stableSinceRef.current = now
          return
        }

        const res = classifyGesture(landmarks)
        onGestureFrame?.(res.gesture, res.confidence)

        

        if (res.confidence >= minConfidence) {
          if (stableGesture !== res.gesture) {
            setStableGesture(res.gesture)
            stableSinceRef.current = now
          } else {
            const stableFor = now - stableSinceRef.current
            if (stableFor > 250) {
              onGesture(res.gesture)
            }
          }
        }
      })


      // Frame loop
      const tick = async () => {
        if (!mounted) return
        if (videoRef.current && hands) {
          await hands.send({ image: videoRef.current })
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
  }, [onGesture, minConfidence, throttleMs, stableGesture])

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
