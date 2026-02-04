"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HeartParticles } from "./components/HeartParticles";
import { NarrativeSection } from "./components/NarrativeSection";
import { FleetingButton } from "./components/FleetingButton";
import { CelebrationOverlay } from "./components/CelebrationOverlay";
import { CalendarSection } from "./components/CalendarSection";

type Phase = "narrative" | "question" | "celebration" | "notSure";

export default function ValentinePage() {
  const [phase, setPhase] = useState<Phase>("narrative");
  const [showCalendar, setShowCalendar] = useState(false);
  const [key, setKey] = useState(0); // Key to force remount for restart

  const handleNarrativeComplete = useCallback(() => {
    setPhase("question");
  }, []);

  const handleYes = useCallback(async () => {
    setPhase("celebration");

    // Send notification
    try {
      await fetch("/api/valentine/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Failed to send notification:", error);
    }

    // Show calendar after celebration animation
    setTimeout(() => {
      setShowCalendar(true);
    }, 3000);
  }, []);

  const handleNotSure = useCallback(() => {
    setPhase("notSure");
  }, []);

  // Auto-restart from beginning after "not sure" message
  useEffect(() => {
    if (phase === "notSure") {
      const timer = setTimeout(() => {
        setKey((k) => k + 1); // Force remount
        setPhase("narrative");
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  return (
    <main className="min-h-screen bg-cali-black overflow-hidden relative">
      {/* Background particles */}
      <HeartParticles
        count={phase === "celebration" ? 25 : 15}
        intensity={phase === "celebration" ? "high" : "medium"}
      />

      {/* Celebration overlay */}
      <CelebrationOverlay isActive={phase === "celebration"} />

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col">

        {/* Content area */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
          <AnimatePresence mode="wait">
            {/* Narrative Phase */}
            {phase === "narrative" && (
              <motion.div
                key={`narrative-${key}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <NarrativeSection onComplete={handleNarrativeComplete} />
              </motion.div>
            )}

            {/* Question Phase */}
            {phase === "question" && (
              <motion.div
                key="question"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-lg"
              >
                <FleetingButton onYes={handleYes} onNotSure={handleNotSure} />
              </motion.div>
            )}

            {/* Not Sure Phase */}
            {phase === "notSure" && (
              <motion.div
                key="notSure"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                className="text-center max-w-md px-4"
              >
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1 }}
                  className="text-2xl text-white/90 mb-4"
                >
                  All good.
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 1 }}
                  className="text-lg text-gray-400"
                >
                  It was just on my mind.
                </motion.p>
              </motion.div>
            )}

            {/* Celebration Phase */}
            {phase === "celebration" && (
              <motion.div
                key="celebration"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 2 }}
                className="w-full max-w-lg"
              >
                {showCalendar && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    <CalendarSection />

                    {/* Thank you message */}
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="text-center text-rose-300/70 mt-8 text-lg"
                    >
                      Can't wait to celebrate with you
                    </motion.p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1 }}
          className="p-6 text-center"
        >
          <p className="text-rose-400/40 text-xs">
            Made with love for Alizé
          </p>
        </motion.footer>
      </div>
    </main>
  );
}
