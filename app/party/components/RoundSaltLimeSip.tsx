"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { RoundState, PartyRound } from "@/lib/types";
import { triggerHaptic, formatTime } from "@/lib/utils";

type Stage = "waiting" | "salt" | "lime" | "sip" | "complete";

interface RoundSaltLimeSipProps {
  roundState: RoundState;
  config: PartyRound;
  onAction: (data: any) => void;
}

export default function RoundSaltLimeSip({
  roundState,
  config,
  onAction,
}: RoundSaltLimeSipProps) {
  const [stage, setStage] = useState<Stage>("waiting");
  const [timeRemaining, setTimeRemaining] = useState(roundState.duration);
  const [hasCompleted, setHasCompleted] = useState(false);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Auto-start after 3 seconds
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (stage === "waiting") {
        setStage("salt");
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, [stage]);

  const handleAction = () => {
    triggerHaptic("medium");

    switch (stage) {
      case "salt":
        setStage("lime");
        onAction({ type: "salt_done", timestamp: Date.now() });
        break;
      case "lime":
        setStage("sip");
        onAction({ type: "lime_done", timestamp: Date.now() });
        break;
      case "sip":
        setStage("complete");
        setHasCompleted(true);
        onAction({ type: "sip_done", timestamp: Date.now(), completed: true });
        break;
    }
  };

  const getContent = () => {
    switch (stage) {
      case "waiting":
        return {
          emoji: "⏳",
          text: "Get ready...",
          color: "text-gray-400",
          showButton: false,
        };
      case "salt":
        return {
          emoji: "🧂",
          text: "Lick the salt",
          color: "text-gray-300",
          showButton: true,
        };
      case "lime":
        return {
          emoji: "🍋",
          text: "Bite the lime",
          color: "text-green-400",
          showButton: true,
        };
      case "sip":
        return {
          emoji: "🥃",
          text: "Take the sip",
          color: "text-cali-magenta",
          showButton: true,
        };
      case "complete":
        return {
          emoji: "✨",
          text: "¡Salud!",
          color: "text-cali-magenta",
          showButton: false,
        };
    }
  };

  const content = getContent();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-cali-black p-8">
      {/* Header */}
      <div className="absolute top-8 left-0 right-0 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          The Ritual
        </h2>
        <p className="text-cali-magenta text-lg">{formatTime(timeRemaining)}</p>
      </div>

      {/* Main content */}
      <motion.div
        key={stage}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center space-y-8"
      >
        <motion.div
          className={`text-9xl ${content.color}`}
          animate={stage === "complete" ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.5, repeat: stage === "complete" ? 3 : 0 }}
        >
          {content.emoji}
        </motion.div>

        <motion.p
          className={`text-white text-3xl font-medium ${content.color}`}
          animate={
            !content.showButton && stage !== "complete"
              ? { opacity: [0.5, 1, 0.5] }
              : {}
          }
          transition={{ duration: 2, repeat: Infinity }}
        >
          {content.text}
        </motion.p>

        {content.showButton && (
          <motion.button
            onClick={handleAction}
            className="px-8 py-4 bg-cali-magenta text-cali-black rounded-full text-xl font-bold"
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Done
          </motion.button>
        )}

        {hasCompleted && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-green-400 text-lg"
          >
            Waiting for others...
          </motion.p>
        )}
      </motion.div>

      {/* Progress dots */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-3">
        {["salt", "lime", "sip"].map((s, i) => {
          const stageIndex = ["salt", "lime", "sip", "complete"].indexOf(stage);
          const isActive = i <= stageIndex - 1 || stage === "complete";
          return (
            <div
              key={s}
              className={`w-3 h-3 rounded-full transition-colors ${
                isActive ? "bg-cali-magenta" : "bg-gray-700"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
