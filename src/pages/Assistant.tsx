import React, { useEffect, useMemo, useState } from "react";
import { useRecipesStore } from "@/store/recipes";
import { useSessionStore } from "@/store/session";
import { useSettingsStore } from "@/store/settings";
import type { PalmGesture } from "@/utils/gestures";

import GestureCanvas from "@/components/GestureCanvas";
import GestureHUD from "@/components/GestureHUD";
import TimerDisplay from "@/components/TimerDisplay";
import TTSControls from "@/components/TTSControls";

import { speak, stop } from "@/utils/tts";

const Assistant: React.FC = () => {
  // -----------------------------
  // Gesture HUD state
  // -----------------------------
  const [hudGesture, setHudGesture] = useState<PalmGesture>("NONE");
  const [hudConfidence, setHudConfidence] = useState(0);

  const handleGestureFrame = (gesture: PalmGesture, confidence: number) => {
    setHudGesture(gesture);
    setHudConfidence(confidence);
  };

  // -----------------------------
  // Stores
  // -----------------------------
  const recipes = useRecipesStore((s) => s.recipes);

  const { activeRecipeId, stepIndex, setStepIndex } = useSessionStore();

  const { ttsEnabled, speechRate, speechPitch } = useSettingsStore();

  // -----------------------------
  // Derived recipe + step
  // -----------------------------
  const recipe = useMemo(
    () => recipes.find((r) => r.id === activeRecipeId),
    [recipes, activeRecipeId]
  );

  const step = recipe?.steps[stepIndex];

  // -----------------------------
  // Timer state
  // -----------------------------
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    setTimerRunning(false);
  }, [stepIndex]);

  // -----------------------------
  // Auto-speak on step change
  // -----------------------------
  useEffect(() => {
    if (!step || !ttsEnabled) return;
    stop();
    speak(step.text, { rate: speechRate, pitch: speechPitch });
  }, [step, ttsEnabled, speechRate, speechPitch]);

  // -----------------------------
  // Navigation actions
  // -----------------------------
  const goNext = () => {
    if (recipe && stepIndex < recipe.steps.length - 1) {
      setStepIndex(stepIndex + 1);
    }
  };

  const goPrev = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    }
  };

  const repeatStep = () => {
    if (!step) return;
    stop();
    speak(step.text, { rate: speechRate, pitch: speechPitch });
  };

  const toggleTimer = () => {
    if (!step?.seconds) return;
    setTimerRunning((v) => !v);
  };

  // -----------------------------
  // Empty states
  // -----------------------------
  if (!recipe || !step) {
    return (
      <div className="p-6 text-center text-slate-500">
        No active recipe selected.
      </div>
    );
  }

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="relative flex flex-col h-full p-6 gap-6">
      <GestureCanvas
        onGesture={handleGesture}
        onGestureFrame={handleGestureFrame}
      />

      <GestureHUD gesture={hudGesture} confidence={hudConfidence} />

      <div className="flex-1 flex flex-col justify-center items-center text-center">
        <p className="text-sm text-slate-500 mb-2">
          Step {stepIndex + 1} of {recipe.steps.length}
        </p>
        <div className="text-2xl md:text-3xl font-medium max-w-3xl">
          {step.text}
        </div>
      </div>

      {step.seconds && (
        <TimerDisplay
          seconds={step.seconds}
          running={timerRunning}
          onToggle={toggleTimer}
        />
      )}

      <div className="flex items-center justify-between gap-4">
        <button
          onClick={goPrev}
          disabled={stepIndex === 0}
          className="px-4 py-2 rounded-md border disabled:opacity-40"
        >
          Previous
        </button>

        <TTSControls onRepeat={repeatStep} />

        <button
          onClick={goNext}
          disabled={stepIndex === recipe.steps.length - 1}
          className="px-4 py-2 rounded-md border disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Assistant;
