"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { RoundState, PartyRound } from "@/lib/types";
import { triggerHaptic, formatTime } from "@/lib/utils";

interface RoundFragmentsProps {
  roundState: RoundState;
  config: PartyRound;
  onAction: (data: any) => void;
}

export default function RoundFragments({
  roundState,
  config,
  onAction,
}: RoundFragmentsProps) {
  const [timeRemaining, setTimeRemaining] = useState(roundState.duration);
  const [memory, setMemory] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const prompt = (config as any).prompt || "What made tonight special?";
  const maxLength = 120;

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = () => {
    if (!memory.trim() || hasSubmitted) return;

    triggerHaptic("medium");
    setHasSubmitted(true);

    onAction({
      type: "memory",
      text: memory.trim(),
      timestamp: Date.now(),
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-cali-black p-8">
      {/* Header */}
      <div className="absolute top-8 left-0 right-0 text-center px-8">
        <h2 className="text-2xl font-bold text-white mb-2">
          Memory Fragments
        </h2>
        <p className="text-gray-400 text-sm mb-2">{prompt}</p>
        <p className="text-cali-gold text-lg">{formatTime(timeRemaining)}</p>
      </div>

      {/* Input area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl mt-24"
      >
        <div className="relative">
          <textarea
            value={memory}
            onChange={(e) => setMemory(e.target.value.slice(0, maxLength))}
            disabled={hasSubmitted}
            placeholder="Share your favorite moment..."
            className="w-full h-48 px-6 py-4 bg-cali-green/20 border-2 border-cali-green text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-cali-gold placeholder-gray-500 resize-none text-lg disabled:opacity-50"
            maxLength={maxLength}
          />

          {/* Character count */}
          <div className="absolute bottom-4 right-4 text-sm text-gray-400">
            {memory.length}/{maxLength}
          </div>
        </div>

        {/* Submit button */}
        <motion.button
          onClick={handleSubmit}
          disabled={!memory.trim() || hasSubmitted}
          className="w-full mt-6 py-4 bg-cali-gold text-cali-black font-bold text-lg rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          whileTap={!hasSubmitted ? { scale: 0.98 } : {}}
          whileHover={!hasSubmitted ? { scale: 1.02 } : {}}
        >
          {hasSubmitted ? "Submitted ✓" : "Share Memory"}
        </motion.button>
      </motion.div>

      {/* Status */}
      {hasSubmitted && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 text-center"
        >
          <div className="text-6xl mb-4">✨</div>
          <p className="text-green-400 text-lg font-medium">
            Thank you for sharing
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Your memory will be woven into the collective toast
          </p>
        </motion.div>
      )}

      {/* Decorative elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-cali-gold rounded-full opacity-20"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 2) * 40}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              delay: i * 0.5,
            }}
          />
        ))}
      </div>
    </div>
  );
}
