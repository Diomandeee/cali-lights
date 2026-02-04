"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CelebrationOverlayProps {
  isActive: boolean;
}

export function CelebrationOverlay({ isActive }: CelebrationOverlayProps) {
  const [showMessage, setShowMessage] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (isActive) {
      const showTimer = setTimeout(() => setShowMessage(true), 500);
      // Fade out the message after 2.5 seconds so calendar is visible
      const fadeTimer = setTimeout(() => setFadeOut(true), 2500);
      return () => {
        clearTimeout(showTimer);
        clearTimeout(fadeTimer);
      };
    }
  }, [isActive]);

  // Generate confetti particles
  const particles = useMemo(() => {
    if (typeof window === "undefined") return [];

    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      color: ["#BE123C", "#FB7185", "#FDA4AF", "#FFD700", "#FF6B9D", "#E91E8C"][i % 6],
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 3 + Math.random() * 2,
      size: 8 + Math.random() * 8,
    }));
  }, []);

  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 pointer-events-none overflow-hidden"
    >
      {/* Background overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: fadeOut ? 0 : 0.3 }}
        transition={{ duration: 0.5 }}
        className="absolute inset-0 bg-gradient-to-b from-rose-900/50 to-pink-900/50"
      />

      {/* Falling confetti */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{
            opacity: 0,
            y: -50,
            x: 0,
            rotate: 0
          }}
          animate={{
            opacity: [0, 1, 1, 0],
            y: "100vh",
            x: (Math.random() - 0.5) * 100,
            rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            ease: "linear",
          }}
          className="absolute rounded-sm"
          style={{
            left: `${particle.left}%`,
            top: "-20px",
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
          }}
        />
      ))}

      {/* Central celebration message */}
      <AnimatePresence>
        {showMessage && !fadeOut && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <motion.h2
              className="text-4xl md:text-5xl font-bold text-white"
              style={{
                textShadow: "0 0 60px rgba(190, 18, 60, 0.8)",
              }}
            >
              It's a date!
            </motion.h2>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
