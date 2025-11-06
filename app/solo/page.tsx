"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { SoloConfig, SoloLevel, SoloStep } from "@/lib/types";
import { getSoloProgress, completeLevel, saveSoloProgress } from "@/lib/utils";
import { getAudioManager } from "@/lib/audio";
import { SaltLimeSip } from "./components/SaltLimeSip";
import { CaliLightsViz } from "./components/CaliLightsViz";

export default function SoloPage() {
  const searchParams = useSearchParams();
  const configId = searchParams.get("cfg") || "solo.v1";

  const [config, setConfig] = useState<SoloConfig | null>(null);
  const [currentLevel, setCurrentLevel] = useState<SoloLevel | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [showMiniGame, setShowMiniGame] = useState(false);

  // Load config and progress
  useEffect(() => {
    async function loadConfig() {
      try {
        const response = await fetch(`/config/${configId}.json`);
        const data = await response.json();
        setConfig(data);

        // Load user progress
        const progress = getSoloProgress();
        const activeLevel =
          data.levels.find((l: SoloLevel) => l.id === data.active_level) ||
          data.levels[0];

        setCurrentLevel(activeLevel);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to load config:", error);
        setIsLoading(false);
      }
    }

    loadConfig();
  }, [configId]);

  // Auto-advance steps
  useEffect(() => {
    if (!currentLevel || !currentLevel.steps[currentStepIndex]) return;

    const step = currentLevel.steps[currentStepIndex];
    if (step.duration) {
      const timeout = setTimeout(() => {
        handleNext();
      }, step.duration);

      return () => clearTimeout(timeout);
    }
  }, [currentLevel, currentStepIndex]);

  const handleNext = () => {
    if (!currentLevel) return;

    if (currentStepIndex < currentLevel.steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      // Check if there's a mini-game
      if (currentLevel.mini_game && !showMiniGame) {
        setShowMiniGame(true);
      } else {
        // Level complete
        completeLevel(currentLevel.id);
        setIsComplete(true);
      }
    }
  };

  const handleMiniGameComplete = () => {
    if (!currentLevel) return;
    completeLevel(currentLevel.id);
    setIsComplete(true);
  };

  const handleTap = () => {
    handleNext();
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cali-black">
        <div className="animate-shimmer text-cali-magenta text-2xl">
          Loading...
        </div>
      </main>
    );
  }

  if (!config || !currentLevel) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cali-black">
        <div className="text-center">
          <p className="text-white">Something went wrong</p>
        </div>
      </main>
    );
  }

  if (isComplete) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cali-black p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <h2 className="text-3xl font-bold text-cali-magenta text-glow">
            Level Complete
          </h2>
          <p className="text-white text-lg">
            Come back later for the next chapter.
          </p>
        </motion.div>
      </main>
    );
  }

  // Render mini-game if active
  if (showMiniGame && currentLevel.mini_game) {
    switch (currentLevel.mini_game) {
      case "salt-lime-sip":
        return <SaltLimeSip onComplete={handleMiniGameComplete} />;
      case "cali-lights":
        return <CaliLightsViz onComplete={handleMiniGameComplete} />;
      default:
        setShowMiniGame(false);
    }
  }

  const currentStep = currentLevel.steps[currentStepIndex];

  return (
    <main
      className="flex min-h-screen items-center justify-center bg-cali-black p-8"
      onClick={handleTap}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStepIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl"
        >
          <p className="text-white text-2xl md:text-3xl leading-relaxed">
            {currentStep.text}
          </p>
          <div className="mt-8 text-cali-magenta text-sm opacity-50">
            Tap to continue
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Progress indicator */}
      <div className="fixed bottom-8 left-0 right-0 flex justify-center gap-2 px-8">
        {currentLevel.steps.map((_, index) => (
          <div
            key={index}
            className={`h-1 flex-1 max-w-12 rounded-full transition-colors ${
              index <= currentStepIndex ? "bg-cali-magenta" : "bg-gray-700"
            }`}
          />
        ))}
      </div>
    </main>
  );
}
