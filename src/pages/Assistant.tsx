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
    timerActive,
    nextStep,
    prevStep,
    toggleTimer,
    setRecipe,
    setTimerActive
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
    setTimerActive(false);
    speakText(step.text, {
      rate: voiceRate,
      pitch: voicePitch
    });
  }, [step, voiceRate, voicePitch, setTimerActive]);

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
    <div className="relative flex flex-col gap-6 p-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px),1fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Live camera
            </h2>
            <span className="text-xs text-slate-400">Best in good lighting</span>
          </div>
          <div className="relative">
            <GestureCanvas
              onGesture={handleGesture}
              onGestureFrame={(g, c) => {
                setHudGesture(g);
                setHudConfidence(c);
              }}
              className="aspect-video max-h-[280px] sm:max-h-[320px]"
            />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Gesture status
              </p>
              <span className="text-xs text-slate-400">Live feedback</span>
            </div>
            <div className="mt-3">
              <GestureHUD
                gesture={hudGesture}
                confidence={hudConfidence}
                placement="inline"
                className="max-w-full"
              />
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300">
            <p className="font-semibold text-slate-700 dark:text-slate-200">
              Gesture shortcuts
            </p>
            <div className="mt-3 grid gap-3 text-xs text-slate-600 dark:text-slate-300 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                ✋ Next step
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                ✊ Previous step
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                ✌️ Repeat narration
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                👍 Start/Pause timer
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            Keep your palm centered and about 2 feet from the camera for
            reliable detection.
          </div>
        </div>

        <div className="flex flex-col items-center justify-center text-center">
          <p className="text-sm text-slate-500 mb-2">
            Step {currentStep + 1} of {recipe.steps.length}
          </p>

          <div className="text-2xl md:text-3xl font-medium max-w-3xl">
            {step.text}
          </div>

          {step.timer?.seconds && (
            <div className="mt-6 w-full max-w-md">
              <TimerDisplay initialSeconds={step.timer.seconds} />
            </div>
          )}

          <div className="mt-6 w-full max-w-md">
            <TTSControls currentText={step.text} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Assistant;