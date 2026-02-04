"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface NarrativeSectionProps {
  onComplete: () => void;
}

const narrativeLines = [
  { text: "Remember when I said we should go out for dinner?", delay: 0 },
  { text: "And then I never followed up...", delay: 3500 },
  { text: "Sometimes the best moments are the ones we're intentional about.", delay: 7000 },
  { text: "So I have a question...", delay: 11500 },
];

export function NarrativeSection({ onComplete }: NarrativeSectionProps) {
  const [visibleLines, setVisibleLines] = useState<number[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    narrativeLines.forEach((line, index) => {
      const timer = setTimeout(() => {
        setVisibleLines((prev) => [...prev, index]);
      }, line.delay);
      timers.push(timer);
    });

    // Complete after all lines shown + reading time
    const completeTimer = setTimeout(() => {
      setIsComplete(true);
      setTimeout(onComplete, 800);
    }, 15000);
    timers.push(completeTimer);

    return () => timers.forEach((t) => clearTimeout(t));
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4">
      <div className="space-y-6 text-center max-w-xl">
        <AnimatePresence>
          {narrativeLines.map((line, index) => (
            visibleLines.includes(index) && (
              <motion.p
                key={index}
                initial={{ opacity: 0, y: 15 }}
                animate={{
                  opacity: isComplete ? 0.3 : 1,
                  y: 0,
                  scale: isComplete ? 0.95 : 1
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 1.2,
                  ease: [0.25, 0.1, 0.25, 1]
                }}
                className="text-2xl md:text-3xl text-white/90 font-light leading-relaxed"
                style={{
                  textShadow: "0 0 40px rgba(251, 113, 133, 0.3)",
                }}
              >
                {line.text}
              </motion.p>
            )
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
