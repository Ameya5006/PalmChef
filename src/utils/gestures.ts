import type { NormalizedLandmark } from '@mediapipe/hands'

export type PalmGesture = 'NEXT' | 'PREV' | 'REPEAT' | 'TIMER' | 'NONE'

export interface GestureResult {
  gesture: PalmGesture
  confidence: number
  stableFor: number // ms
  landmarks: NormalizedLandmark[]
}

/**
 * Heuristic gesture classifier:
 * - NEXT (✋ Open Palm): fingers extended, average curl low, palm area wide
 * - PREV (✊ Fist): fingers curled, area compact
 * - REPEAT (✌️ Victory): index+middle extended, others curled
 * - TIMER (👍 Thumbs Up): thumb extended away from palm, other fingers curled
 */
export function classifyGesture(landmarks: NormalizedLandmark[]): GestureResult {
  if (!landmarks || landmarks.length < 21)
    return { gesture: 'NONE', confidence: 0, stableFor: 0, landmarks }

  // Utility distances
  const dist = (a: number, b: number) => {
    const dx = landmarks[a].x - landmarks[b].x
    const dy = landmarks[a].y - landmarks[b].y
    const dz = landmarks[a].z - landmarks[b].z
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }

  // For finger curl: tip to pip vs pip to mcp
  const fingerCurl = (tip: number, pip: number, mcp: number) => {
    const a = dist(tip, pip)
    const b = dist(pip, mcp)
    return a / (b + 1e-5) // lower => curled, higher => extended
  }

  const curlThumb = fingerCurl(4, 3, 2)
  const curlIndex = fingerCurl(8, 7, 5)
  const curlMiddle = fingerCurl(12, 11, 9)
  const curlRing = fingerCurl(16, 15, 13)
  const curlPinky = fingerCurl(20, 19, 17)

  const extended = [
    curlThumb > 0.7,
    curlIndex > 0.9,
    curlMiddle > 0.9,
    curlRing > 0.9,
    curlPinky > 0.9
  ]

  const extendedCount = extended.filter(Boolean).length

  // Thumb direction (x separation from palm center vs other fingers)
  const palmCenter = landmarks[0]
  const thumbTip = landmarks[4]
  const indexMCP = landmarks[5]
  const thumbAway = Math.abs(thumbTip.x - palmCenter.x) > Math.abs(indexMCP.x - palmCenter.x) * 0.6

  // Determine gesture
  let gesture: PalmGesture = 'NONE'
  let confidence = 0.5

  // TIMER (👍): thumb extended, others mostly curled
  if (extended[0] && !extended[1] && !extended[2] && !extended[3] && !extended[4] && thumbAway) {
    gesture = 'TIMER'
    confidence = 0.9
  }
  // REPEAT (✌️): index + middle extended, others curled
  else if (!extended[0] && extended[1] && extended[2] && !extended[3] && !extended[4]) {
    gesture = 'REPEAT'
    confidence = 0.9
  }
  // PREV (✊): few/no fingers extended
  else if (extendedCount <= 1 && curlIndex < 0.7 && curlMiddle < 0.7) {
    gesture = 'PREV'
    confidence = 0.85
  }
  // NEXT (✋): most fingers extended
  else if (extendedCount >= 4) {
    gesture = 'NEXT'
    confidence = 0.85
  } else {
    gesture = 'NONE'
    confidence = 0.3
  }

  return { gesture, confidence, stableFor: 0, landmarks }
}

export type GestureName = "PALM" | "FIST" | "VICTORY" | "THUMBS_UP" | "NONE";

export function createGestureGate(stableMs = 450, cooldownMs = 900) {
  let lastGesture: GestureName = "NONE";
  let stableSince = 0;
  let cooldownUntil = 0;

  return function gate(now: number, g: GestureName): GestureName | null {
    if (now < cooldownUntil) return null;

    if (g !== lastGesture) {
      lastGesture = g;
      stableSince = now;
      return null;
    }

    if (g !== "NONE" && now - stableSince >= stableMs) {
      cooldownUntil = now + cooldownMs;
      return g;
    }

    return null;
  };
}
