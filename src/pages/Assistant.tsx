import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import { useRecipesStore } from "@/store/recipes";
import { useSessionStore } from "@/store/session";
import { useSettingsStore } from "@/store/settings";

import type { PalmGesture } from "@/utils/gestures";

import GestureCanvas from "@/components/GestureCanvas";
import GestureHUD from "@/components/GestureHUD";
import TimerDisplay from "@/components/TimerDisplay";
import TTSControls from "@/components/TTSControls";

import { speakText, stopSpeech } from "@/utils/tts";

const Assistant: React.FC = () => {
  // -----------------------------
  // URL → session sync
  // -----------------------------
  const { id } = useParams<{ id: string }>();

  const {
    currentRecipeId,
    currentStep,
    nextStep,
    prevStep,
    toggleTimer,
    setRecipe
  } = useSessionStore();

  useEffect(() => {
    if (id) {
      setRecipe(id);
    }
  }, [id, setRecipe]);

  // -----------------------------
  // Stores
  // -----------------------------
  const recipes = useRecipesStore((s) => s.recipes);
  const { voiceRate, voicePitch } = useSettingsStore();

  // -----------------------------
  // HUD state
  // -----------------------------
  const [hudGesture, setHudGesture] = useState<PalmGesture>("NONE");
  const [hudConfidence, setHudConfidence] = useState(0);

  // Prevent rapid re-trigger
  const lastGestureRef = useRef<PalmGesture>("NONE");

  // -----------------------------
  // Derived recipe + step
  // -----------------------------
  const recipe = useMemo(
    () => recipes.find((r) => r.id === currentRecipeId),
    [recipes, currentRecipeId]
  );

  const step = recipe?.steps[currentStep];

  // -----------------------------
  // Auto-speak on step change
  // -----------------------------
  useEffect(() => {
    if (!step) return;
    stopSpeech();
    speakText(step.text, {
      rate: voiceRate,
      pitch: voicePitch
    });
  }, [step, voiceRate, voicePitch]);

  // -----------------------------
  // Gesture → action mapping
  // -----------------------------
  const handleGesture = (gesture: PalmGesture) => {
    if (gesture === lastGestureRef.current) return;
    lastGestureRef.current = gesture;

    switch (gesture) {
      case "NEXT":
        nextStep();
        break;

      case "PREV":
        prevStep();
        break;

      case "REPEAT":
        if (step) {
          stopSpeech();
          speakText(step.text, {
            rate: voiceRate,
            pitch: voicePitch
          });
        }
        break;

      case "TIMER":
        toggleTimer();
        break;
    }

    // cooldown
    setTimeout(() => {
      lastGestureRef.current = "NONE";
    }, 700);
  };

  // -----------------------------
  // Empty state
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
        onGestureFrame={(g, c) => {
          setHudGesture(g);
          setHudConfidence(c);
        }}
      />

      <GestureHUD gesture={hudGesture} confidence={hudConfidence} />

      <div className="flex-1 flex flex-col justify-center items-center text-center">
        <p className="text-sm text-slate-500 mb-2">
          Step {currentStep + 1} of {recipe.steps.length}
        </p>

        <div className="text-2xl md:text-3xl font-medium max-w-3xl">
          {step.text}
        </div>
      </div>

      {step.timer?.seconds && (
        <TimerDisplay initialSeconds={step.timer.seconds} />
      )}

      <TTSControls currentText={step.text} />
    </div>
  );
};

export default Assistant;
