import type { NormalizedLandmark } from "@mediapipe/hands";

export type PalmGesture = "NEXT" | "PREV" | "REPEAT" | "TIMER" | "NONE";

export interface GestureResult {
  gesture: PalmGesture;
  confidence: number;
}

/**
 * Gesture meanings:
 * NEXT   → Open Palm
 * PREV   → Fist
 * REPEAT → Victory (✌)
 * TIMER  → Thumbs Up (👍)
 */
export function classifyGesture(
  landmarks: NormalizedLandmark[]
): GestureResult {
  if (!landmarks || landmarks.length < 21) {
    return { gesture: "NONE", confidence: 0 };
  }

  const dist = (a: number, b: number) => {
    const dx = landmarks[a].x - landmarks[b].x;
    const dy = landmarks[a].y - landmarks[b].y;
    const dz = landmarks[a].z - landmarks[b].z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  };

  const fingerCurl = (tip: number, pip: number, mcp: number) => {
    const a = dist(tip, pip);
    const b = dist(pip, mcp);
    return a / (b + 1e-5);
  };

  const thumb = fingerCurl(4, 3, 2);
  const index = fingerCurl(8, 7, 5);
  const middle = fingerCurl(12, 11, 9);
  const ring = fingerCurl(16, 15, 13);
  const pinky = fingerCurl(20, 19, 17);

  const fingerExtended = (tip: number, pip: number, ratio: number, slack = 0.02) =>
    landmarks[tip].y < landmarks[pip].y - slack || ratio > 0.85;
  const extended = {
    thumb: thumb > 0.6,
    index: fingerExtended(8, 6, index),
    middle: fingerExtended(12, 10, middle),
    ring: fingerExtended(16, 14, ring),
    pinky: fingerExtended(20, 18, pinky)
  };
  const countExtended = (value: typeof extended) =>
    Object.values(value).filter(Boolean).length;
  const extendedCount = countExtended(extended);

  // 👍 TIMER
  if (
    extended.thumb &&
    !extended.index &&
    !extended.middle &&
    !extended.ring &&
    !extended.pinky
  ) {
    return { gesture: "TIMER", confidence: 0.9 };
  }

  // ✌ REPEAT
  if (
    !extended.thumb &&
    extended.index &&
    extended.middle &&
    !extended.ring &&
    !extended.pinky
  ) {
    return { gesture: "REPEAT", confidence: 0.9 };
  }

  // ✊ PREV
  if (extendedCount <= 1) {
    return { gesture: "PREV", confidence: 0.85 };
  }

  // ✋ NEXT
  if (extendedCount >= 3) {
    return { gesture: "NEXT", confidence: 0.85 };
  }

  return { gesture: "NONE", confidence: 0.3 };
}
