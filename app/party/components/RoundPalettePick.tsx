"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { RoundState, PartyRound } from "@/lib/types";
import { triggerHaptic, formatTime, CALI_PALETTES, getPalette } from "@/lib/utils";
import type { PaletteKey } from "@/lib/utils";

interface RoundPalettePickProps {
  roundState: RoundState;
  config: PartyRound;
  onAction: (data: any) => void;
}

export default function RoundPalettePick({
  roundState,
  config,
  onAction,
}: RoundPalettePickProps) {
  const [timeRemaining, setTimeRemaining] = useState(roundState.duration);
  const [selectedPalette, setSelectedPalette] = useState<PaletteKey | null>(
    null
  );
  const [hasVoted, setHasVoted] = useState(false);

  const options = (config as any).options || ["gold", "green", "mixed", "venue"];

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleVote = (paletteKey: PaletteKey) => {
    if (hasVoted) return;

    triggerHaptic("medium");
    setSelectedPalette(paletteKey);
    setHasVoted(true);

    onAction({
      type: "vote",
      palette: paletteKey,
      timestamp: Date.now(),
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-cali-black p-8">
      {/* Header */}
      <div className="absolute top-8 left-0 right-0 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          Pick the Palette
        </h2>
        <p className="text-gray-400 text-sm mb-2">
          Which colors best match the night?
        </p>
        <p className="text-cali-magenta text-lg">{formatTime(timeRemaining)}</p>
      </div>

      {/* Palette options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl w-full mt-24">
        {options.map((key: string) => {
          const paletteKey = key as PaletteKey;
          const palette = getPalette(paletteKey);
          const isSelected = selectedPalette === paletteKey;

          return (
            <motion.button
              key={paletteKey}
              onClick={() => handleVote(paletteKey)}
              disabled={hasVoted}
              className={`relative p-6 rounded-2xl border-2 transition-all ${
                isSelected
                  ? "border-cali-magenta scale-105"
                  : "border-gray-700 hover:border-cali-purple"
              } ${hasVoted && !isSelected ? "opacity-50" : ""}`}
              whileTap={!hasVoted ? { scale: 0.95 } : {}}
              whileHover={!hasVoted ? { scale: 1.02 } : {}}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * options.indexOf(key) }}
            >
              {/* Gradient preview */}
              <div
                className="w-full h-32 rounded-xl mb-4"
                style={{ background: palette.gradient }}
              />

              {/* Color swatches */}
              <div className="flex gap-2 mb-4 justify-center">
                {palette.colors.map((color, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-white/20"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              {/* Name */}
              <p
                className={`text-lg font-bold ${
                  isSelected ? "text-cali-magenta" : "text-white"
                }`}
              >
                {palette.name}
              </p>

              {/* Selected indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-4 right-4 w-8 h-8 bg-cali-magenta rounded-full flex items-center justify-center text-cali-black text-xl"
                >
                  ✓
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Status */}
      {hasVoted && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 text-center"
        >
          <p className="text-green-400 text-lg font-medium">
            ✓ Vote submitted
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Waiting for others to vote...
          </p>
        </motion.div>
      )}
    </div>
  );
}
