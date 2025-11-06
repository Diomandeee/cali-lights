"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { triggerHaptic } from "@/lib/utils";

type Stage = "salt" | "lime" | "sip" | "complete";

interface SaltLimeSipProps {
  onComplete: () => void;
}

export function SaltLimeSip({ onComplete }: SaltLimeSipProps) {
  const [stage, setStage] = useState<Stage>("salt");
  const [instruction, setInstruction] = useState("Lick the salt");

  useEffect(() => {
    const instructions = {
      salt: "Lick the salt",
      lime: "Bite the lime",
      sip: "Take the sip",
      complete: "¡Salud!",
    };
    setInstruction(instructions[stage]);
  }, [stage]);

  const handleAction = () => {
    triggerHaptic("medium");

    switch (stage) {
      case "salt":
        setStage("lime");
        break;
      case "lime":
        setStage("sip");
        break;
      case "sip":
        setStage("complete");
        setTimeout(onComplete, 2000);
        break;
    }
  };

  const getEmoji = () => {
    switch (stage) {
      case "salt":
        return "🧂";
      case "lime":
        return "🍋";
      case "sip":
        return "🥃";
      case "complete":
        return "✨";
    }
  };

  const getColor = () => {
    switch (stage) {
      case "salt":
        return "text-gray-300";
      case "lime":
        return "text-green-400";
      case "sip":
        return "text-cali-magenta";
      case "complete":
        return "text-cali-magenta";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-cali-black p-8">
      <AnimatePresence mode="wait">
        <motion.div
          key={stage}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.2 }}
          transition={{ duration: 0.3 }}
          className="text-center space-y-8"
        >
          <motion.div
            className={`text-9xl ${getColor()}`}
            animate={stage === "complete" ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.5, repeat: stage === "complete" ? 3 : 0 }}
          >
            {getEmoji()}
          </motion.div>

          <motion.p
            className="text-white text-3xl font-medium"
            animate={stage !== "complete" ? { opacity: [0.5, 1, 0.5] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {instruction}
          </motion.p>

          {stage !== "complete" && (
            <motion.button
              onClick={handleAction}
              className="px-8 py-4 bg-cali-magenta text-cali-black rounded-full text-xl font-bold"
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
            >
              Done
            </motion.button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
