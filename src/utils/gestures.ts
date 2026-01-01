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

  const extended = {
    thumb: thumb > 0.7,
    index: index > 0.9,
    middle: middle > 0.9,
    ring: ring > 0.9,
    pinky: pinky > 0.9
  };


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
   if (
    !extended.thumb &&
    !extended.index &&
    !extended.middle &&
    !extended.ring &&
    !extended.pinky
  ) {
    return { gesture: "PREV", confidence: 0.85 };
  }

  // ✋ NEXT
  if (extended.index && extended.middle && extended.ring && extended.pinky) {
        return { gesture: "NEXT", confidence: 0.85 };
  }

  return { gesture: "NONE", confidence: 0.3 };
}
