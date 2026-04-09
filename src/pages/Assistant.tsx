import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";

import { useRecipesStore } from "@/store/recipes";
import { useSessionStore } from "@/store/session";
import { useSettingsStore } from "@/store/settings";

import type { Ingredient } from "@/types";
import type { PalmGesture } from "@/utils/gestures";
import { buildShoppingList } from "@/utils/ingredients";

import GestureCanvas from "@/components/GestureCanvas";
import GestureHUD from "@/components/GestureHUD";
import TimerDisplay from "@/components/TimerDisplay";
import TTSControls from "@/components/TTSControls";

import {
  isSpeechPaused,
  isSpeechSpeaking,
  pauseSpeech,
  resumeSpeech,
  speakText,
  stopSpeech
} from "@/utils/tts";

type VoiceStatus = "Off" | "Listening" | "Unsupported";

type CommandAction = "next" | "prev" | "repeat" | "pause" | "resume";

const VOICE_DEBOUNCE_MS = 900;
const SAFETY_INTERVAL_MS = 90_000;

const Assistant: React.FC = () => {

  const { id } = useParams<{ id: string }>();

  const {
    currentRecipeId,
    currentStep,
    timerActive,
    nextStep,
    prevStep,
    setRecipe,
    setTimerActive
  } = useSessionStore();

  useEffect(() => {
    if (id) {
      setRecipe(id);
    }
  }, [id, setRecipe]);


  const recipes = useRecipesStore((s) => s.recipes);
  const {
    voiceRate,
    voicePitch,
    kitchenSafetyMode,
    gestureLock,
    voiceCommandsEnabled,
    setKitchenSafetyMode,
    setGestureLock,
    setVoiceCommandsEnabled
  } = useSettingsStore();


  const [hudGesture, setHudGesture] = useState<PalmGesture>("NONE");
  const [hudConfidence, setHudConfidence] = useState(0);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>("Off");
  const [lastVoiceCommand, setLastVoiceCommand] = useState<string>("-");

  const safetyIntervalRef = useRef<number | null>(null);
  const voiceThrottleRef = useRef<number>(0);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const lastGestureRef = useRef<PalmGesture>("NONE");

  const recipe = useMemo(
    () => recipes.find((r) => r.id === currentRecipeId),
    [recipes, currentRecipeId]
  );

  const step = recipe?.steps[currentStep];
  const ingredients = recipe?.ingredients || [];

  const shoppingList = useMemo(() => buildShoppingList(ingredients), [ingredients]);

  useEffect(() => {
    if (!step) return;
    stopSpeech();
    setTimerActive(false);
    speakText(step.text, {
      rate: voiceRate,
      pitch: voicePitch
    });
  }, [step, voiceRate, voicePitch, setTimerActive]);


  useEffect(() => {
    if (!recipe) {
      setCheckedIngredients({});
      return;
    }

    const initialState = (recipe.ingredients || []).reduce<Record<string, boolean>>(
      (acc, ingredient) => {
        acc[ingredient.id] = currentStep >= ingredient.firstUsedStepIndex;
        return acc;
      },
      {}
    );

    setCheckedIngredients(initialState);
  }, [recipe, currentStep]);

  const runCommand = (action: CommandAction) => {
    switch (action) {
      case "next":
        nextStep();
        setLastVoiceCommand("Next");
        break;
      case "prev":
        prevStep();
        setLastVoiceCommand("Previous");
        break;
      case "repeat":
        if (step) {
          stopSpeech();
          speakText(step.text, { rate: voiceRate, pitch: voicePitch });
          setLastVoiceCommand("Repeat");
        }
        break;
      case "pause":
        if (isSpeechSpeaking()) {
          pauseSpeech();
          setLastVoiceCommand("Pause");
        }
        break;
      case "resume":
        if (isSpeechPaused()) {
          resumeSpeech();
          setLastVoiceCommand("Resume");
        }
        break;
    }
  };

  const handleGesture = (gesture: PalmGesture) => {
    if (gesture === lastGestureRef.current) return;
    lastGestureRef.current = gesture;

    if (gestureLock) {
      setTimeout(() => {
        lastGestureRef.current = "NONE";
      }, 700);
      return;
    }

    switch (gesture) {
      case "NEXT":
        runCommand("next");
        break;

      case "PREV":
        runCommand("prev");
        break;

      case "REPEAT":
        runCommand("repeat");
        break;

      case "TIMER":
        if (isSpeechSpeaking() || isSpeechPaused()) {
          if (isSpeechPaused()) {
            runCommand("resume");
          } else {
            runCommand("pause");
          }
        }
        break;
    }

    setTimeout(() => {
      lastGestureRef.current = "NONE";
    }, 700);
  };


  useEffect(() => {
    if (!kitchenSafetyMode) {
      if (safetyIntervalRef.current) {
        window.clearInterval(safetyIntervalRef.current);
        safetyIntervalRef.current = null;
      }
      return;
    }

    safetyIntervalRef.current = window.setInterval(() => {
      if (isSpeechSpeaking() || isSpeechPaused()) return;

      const reminder = timerActive
        ? "Safety check: Keep your station clean and keep an eye on your running timer."
        : "Safety check: Keep knife edges away, handles turned inward, and your station dry.";

      speakText(reminder, { rate: voiceRate, pitch: voicePitch });
    }, SAFETY_INTERVAL_MS);

    return () => {
      if (safetyIntervalRef.current) {
        window.clearInterval(safetyIntervalRef.current);
        safetyIntervalRef.current = null;
      }
    };
  }, [kitchenSafetyMode, timerActive, voiceRate, voicePitch]);

  useEffect(() => {
    const SpeechRecognitionImpl =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!voiceCommandsEnabled) {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      setVoiceStatus("Off");
      return;
    }

    if (!SpeechRecognitionImpl) {
      setVoiceStatus("Unsupported");
      return;
    }

    const recognition = new SpeechRecognitionImpl();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => setVoiceStatus("Listening");
    recognition.onend = () => {
      if (voiceCommandsEnabled) {
        recognition.start();
      }
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[event.results.length - 1]?.[0]?.transcript
        ?.toLowerCase()
        ?.trim();

      if (!transcript) return;

      const now = Date.now();
      if (now - voiceThrottleRef.current < VOICE_DEBOUNCE_MS) return;

      let action: CommandAction | null = null;
      if (/\bnext\b/.test(transcript)) action = "next";
      else if (/\b(previous|back)\b/.test(transcript)) action = "prev";
      else if (/\brepeat\b/.test(transcript)) action = "repeat";
      else if (/\bpause\b/.test(transcript)) action = "pause";
      else if (/\b(resume|continue)\b/.test(transcript)) action = "resume";

      if (!action || gestureLock) return;

      voiceThrottleRef.current = now;
      runCommand(action);
    };

    recognition.start();
    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [voiceCommandsEnabled, gestureLock, step, voiceRate, voicePitch]);

  const toggleIngredient = (ingredient: Ingredient) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [ingredient.id]: !prev[ingredient.id]
    }));
  };

  const handleCopyShoppingList = async () => {
    if (shoppingList.length === 0) return;
    const text = shoppingList.map((item, idx) => `${idx + 1}. ${item}`).join("\n");
    await navigator.clipboard.writeText(text);
  };

  if (!recipe || !step) {
    return (

      <div className="p-6 text-center text-slate-500">No active recipe selected.</div>
    );
  }


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
              <span className="text-xs text-slate-400">
                {gestureLock ? "Locked" : "Active"}
              </span>
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
              Session controls
            </p>

            <div className="mt-3 space-y-2 text-xs">
              <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                <span>Kitchen Safety Mode</span>
                <input
                  type="checkbox"
                  checked={kitchenSafetyMode}
                  onChange={(e) => setKitchenSafetyMode(e.target.checked)}
                />
              </label>
              <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                <span>Gesture Lock</span>
                <input
                  type="checkbox"
                  checked={gestureLock}
                  onChange={(e) => setGestureLock(e.target.checked)}
                />
              </label>
              <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                <span>Voice Commands</span>
                <input
                  type="checkbox"
                  checked={voiceCommandsEnabled}
                  onChange={(e) => setVoiceCommandsEnabled(e.target.checked)}
                />
              </label>
            </div>

            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Voice status: {voiceStatus} · Last command: {lastVoiceCommand}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/85 p-8 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-amber-400/80 via-rose-400/80 to-sky-400/80" />
            <div className="text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Step {currentStep + 1} of {recipe.steps.length}
              </p>
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="mt-5 text-lg font-semibold leading-relaxed text-slate-900 dark:text-white sm:text-xl md:text-2xl"
              >
                {step.text}
              </motion.div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Ingredient checklist
              </h3>
              <span className="text-xs text-slate-500">Auto-check by step</span>
            </div>
            <div className="mt-3 space-y-2">
              {ingredients.length === 0 ? (
                <p className="text-xs text-slate-500">No ingredients extracted yet.</p>
              ) : (
                ingredients.map((ingredient) => {
                  const checked = checkedIngredients[ingredient.id];
                  return (
                    <button
                      key={ingredient.id}
                      type="button"
                      onClick={() => toggleIngredient(ingredient)}
                      className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition ${
                        checked
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200"
                          : "border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      }`}
                    >
                      <span>{ingredient.quantity ? `${ingredient.quantity} ` : ""}{ingredient.unit ? `${ingredient.unit} ` : ""}{ingredient.name}</span>
                      <span>{checked ? "✓" : "○"}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Shopping list
              </h3>
              <button
                onClick={handleCopyShoppingList}
                disabled={shoppingList.length === 0}
                className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300"
              >
                Copy shopping list
              </button>
            </div>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-200">
              {shoppingList.length === 0 ? (
                <li className="list-none pl-0 text-xs text-slate-500">No shopping list items yet.</li>
              ) : (
                shoppingList.map((item, idx) => <li key={`${item}-${idx}`}>{item}</li>)
              )}
            </ul>
          </div>

          {step.timer?.seconds && (
            <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
              <TimerDisplay
                initialSeconds={step.timer.seconds}
                isRunning={timerActive}
                onRunningChange={setTimerActive}
              />
            </div>
          )}

          <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
            <TTSControls currentText={step.text} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Assistant;