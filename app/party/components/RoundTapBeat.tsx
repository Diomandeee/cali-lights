"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { RoundState, PartyRound } from "@/lib/types";
import { triggerHaptic, formatTime } from "@/lib/utils";

interface RoundTapBeatProps {
  roundState: RoundState;
  config: PartyRound;
  onAction: (data: any) => void;
}

export default function RoundTapBeat({
  roundState,
  config,
  onAction,
}: RoundTapBeatProps) {
  const [timeRemaining, setTimeRemaining] = useState(roundState.duration);
  const [tapCount, setTapCount] = useState(0);
  const [showBeatPulse, setShowBeatPulse] = useState(false);
  const [accuracy, setAccuracy] = useState(0);

  const bpm = (config as any).bpm || 120;
  const beatInterval = 60000 / bpm;

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Beat metronome visual
  useEffect(() => {
    const interval = setInterval(() => {
      setShowBeatPulse(true);
      setTimeout(() => setShowBeatPulse(false), 100);
    }, beatInterval);

    return () => clearInterval(interval);
  }, [beatInterval]);

  const handleTap = useCallback(() => {
    triggerHaptic("light");
    setTapCount((prev) => prev + 1);

    // Send tap event
    onAction({
      type: "tap",
      timestamp: Date.now(),
      tapCount: tapCount + 1,
    });
  }, [tapCount, onAction]);

  // Update accuracy from round state
  useEffect(() => {
    if (roundState.score !== undefined) {
      setAccuracy(roundState.score);
    }
  }, [roundState.score]);

  const progress = (accuracy / 100) * 100;
  const threshold = ((config.threshold || 0.7) * 100);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-cali-black p-8">
      {/* Header */}
      <div className="absolute top-8 left-0 right-0 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          Tap to the Beat
        </h2>
        <p className="text-cali-magenta text-lg">{formatTime(timeRemaining)}</p>
      </div>

      {/* Beat indicator */}
      <div className="relative mb-16">
        <AnimatePresence>
          {showBeatPulse && (
            <motion.div
              initial={{ scale: 1, opacity: 1 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 rounded-full border-4 border-cali-magenta"
            />
          )}
        </AnimatePresence>
        <div className="w-4 h-4 bg-cali-magenta rounded-full" />
      </div>

      {/* Tap button */}
      <motion.button
        onClick={handleTap}
        className="w-64 h-64 rounded-full bg-gradient-magenta border-4 border-cali-magenta shadow-2xl flex items-center justify-center"
        whileTap={{ scale: 0.9 }}
        animate={showBeatPulse ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 0.1 }}
      >
        <div className="text-center">
          <div className="text-6xl mb-2">👋</div>
          <p className="text-cali-black text-xl font-bold">TAP</p>
        </div>
      </motion.button>

      {/* Progress ring */}
      <div className="mt-16 relative">
        <svg width="200" height="200" className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r="90"
            stroke="#333"
            strokeWidth="8"
            fill="none"
          />
          {/* Progress circle */}
          <motion.circle
            cx="100"
            cy="100"
            r="90"
            stroke="url(#gradient)"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: progress / 100 }}
            transition={{ duration: 0.5 }}
            style={{
              pathLength: progress / 100,
              strokeDasharray: "565.48",
              strokeDashoffset: 565.48 * (1 - progress / 100),
            }}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#DB962C" />
              <stop offset="100%" stopColor="#F5C042" />
            </linearGradient>
          </defs>
        </svg>

        {/* Score display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-4xl font-bold text-white">{Math.round(accuracy)}%</p>
          <p className="text-sm text-gray-400">accuracy</p>
        </div>
      </div>

      {/* Threshold indicator */}
      <div className="mt-8 text-center">
        <p className="text-white text-sm">
          Target: {threshold}% accuracy
        </p>
        {accuracy >= threshold && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-cali-magenta text-lg font-bold mt-2"
          >
            ✨ Target reached!
          </motion.p>
        )}
      </div>

      {/* Stats */}
      <div className="absolute bottom-8 left-8 right-8 flex justify-between text-gray-400 text-sm">
        <span>Taps: {tapCount}</span>
        <span>BPM: {bpm}</span>
      </div>
    </div>
  );
}
