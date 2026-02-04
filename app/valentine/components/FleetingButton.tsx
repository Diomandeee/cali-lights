"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { triggerHaptic } from "@/lib/utils";

interface FleetingButtonProps {
  onYes: () => void;
  onNotSure?: () => void;
}

const noTexts = ["No", "Nope!", "Try again!", "Can't catch me!", "Too slow!", "Nice try!", "Not a chance!"];

export function FleetingButton({ onYes, onNotSure }: FleetingButtonProps) {
  const [noTextIndex, setNoTextIndex] = useState(0);
  const [noPosition, setNoPosition] = useState({ x: 0, y: 0 }); // Start at natural position
  const [hasFled, setHasFled] = useState(false); // Track if button has started fleeing
  const [fleeCount, setFleeCount] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [showNotSure, setShowNotSure] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastFleeTime = useRef(0);
  const lastYesTapTime = useRef(0);

  // Detect mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile("ontouchstart" in window || navigator.maxTouchPoints > 0);
    };
    checkMobile();
  }, []);

  // Show "not sure" option after 7 flee attempts
  useEffect(() => {
    if (fleeCount >= 7 && !showNotSure) {
      setShowNotSure(true);
    }
  }, [fleeCount, showNotSure]);

  // Get random position - avoid the center where Yes button is
  const getRandomPosition = useCallback(() => {
    // Use smaller ranges for mobile to keep button on screen
    const isMobileDevice = typeof window !== "undefined" && window.innerWidth < 768;

    if (isMobileDevice) {
      // Mobile: constrained positions that stay on screen
      const positions = [
        { x: -120, y: -180 },  // top left
        { x: 120, y: -180 },   // top right
        { x: -140, y: -80 },   // mid left
        { x: 140, y: -80 },    // mid right
        { x: -100, y: 100 },   // bottom left
        { x: 100, y: 100 },    // bottom right
        { x: 0, y: -200 },     // top center
        { x: 0, y: 120 },      // bottom center
      ];
      const base = positions[Math.floor(Math.random() * positions.length)];
      const x = base.x + (Math.random() - 0.5) * 40;
      const y = base.y + (Math.random() - 0.5) * 30;
      return { x, y };
    }

    // Desktop: larger movement range
    const positions = [
      { x: -300, y: -150 },  // top left
      { x: 300, y: -150 },   // top right
      { x: -350, y: 0 },     // far left
      { x: 350, y: 0 },      // far right
      { x: -300, y: 150 },   // bottom left
      { x: 300, y: 150 },    // bottom right
      { x: 0, y: -200 },     // top center
      { x: 0, y: 200 },      // bottom center
    ];

    // Add some randomness to the position
    const base = positions[Math.floor(Math.random() * positions.length)];
    const x = base.x + (Math.random() - 0.5) * 80;
    const y = base.y + (Math.random() - 0.5) * 60;

    return { x, y };
  }, []);

  // Flee behavior with throttle (50ms minimum between flees)
  const handleFlee = useCallback(() => {
    const now = Date.now();
    if (now - lastFleeTime.current < 50) return; // Throttle
    lastFleeTime.current = now;

    triggerHaptic("light");
    setHasFled(true);
    setNoPosition(getRandomPosition());
    setNoTextIndex((prev) => (prev + 1) % noTexts.length);
    setFleeCount((prev) => prev + 1);
  }, [getRandomPosition]);

  const handleYesClick = () => {
    // On mobile, require double-tap
    if (isMobile) {
      const now = Date.now();
      if (now - lastYesTapTime.current < 400) {
        // Double tap detected
        triggerHaptic("heavy");
        onYes();
      } else {
        // First tap - give feedback
        triggerHaptic("light");
      }
      lastYesTapTime.current = now;
    } else {
      // Desktop: single click works
      triggerHaptic("heavy");
      onYes();
    }
  };

  const handleNotSure = () => {
    triggerHaptic("medium");
    if (onNotSure) {
      onNotSure();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-8">
      {/* Question */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
        className="text-lg text-gray-400 mb-2"
      >
        I wanted to give this a shot...
      </motion.p>
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        className="text-4xl md:text-5xl font-bold text-white text-center"
        style={{
          textShadow: "0 0 60px rgba(190, 18, 60, 0.5)",
        }}
      >
        Will you be my Valentine?
      </motion.h2>

      {/* Mobile hint */}
      {isMobile && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          className="text-rose-300/70 text-sm"
        >
          double tap your answer
        </motion.p>
      )}

      {/* Not sure option - appears after many attempts, positioned at top */}
      <AnimatePresence>
        {showNotSure && (
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            onClick={handleNotSure}
            className="px-5 py-2.5 bg-gray-700/80 text-gray-200 text-sm rounded-full hover:bg-gray-600/80 transition-all"
          >
            if you're not sure yet
          </motion.button>
        )}
      </AnimatePresence>

      {/* Buttons container */}
      <div
        ref={containerRef}
        className="relative w-full max-w-md h-48 flex items-center justify-center overflow-visible"
      >
        {/* Buttons row - side by side initially */}
        <div className="flex items-center gap-6">
          {/* Yes Button */}
          <motion.button
            onClick={handleYesClick}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="px-10 py-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-xl rounded-full shadow-2xl hover:shadow-rose-500/50 transition-shadow"
            style={{
              boxShadow: "0 0 30px rgba(244, 63, 94, 0.4)",
            }}
          >
            Yes!
          </motion.button>

          {/* No Button - starts inline, becomes absolute when fleeing */}
          {!hasFled && (
            <motion.button
              initial={{ opacity: 1 }}
              onMouseEnter={handleFlee}
              onMouseMove={handleFlee}
              onTouchStart={(e) => {
                e.preventDefault();
                handleFlee();
              }}
              onTouchMove={(e) => {
                e.preventDefault();
                handleFlee();
              }}
              className="px-6 py-3 bg-gray-600/50 text-gray-300 font-medium rounded-full border border-gray-500/50 transition-colors cursor-pointer select-none"
            >
              {noTexts[noTextIndex]}
            </motion.button>
          )}
        </div>

        {/* No Button - absolute positioned after fleeing */}
        {hasFled && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              x: noPosition.x,
              y: noPosition.y
            }}
            transition={{
              type: "spring",
              stiffness: 800,
              damping: 20
            }}
            onMouseEnter={handleFlee}
            onMouseMove={handleFlee}
            onTouchStart={(e) => {
              e.preventDefault();
              handleFlee();
            }}
            onTouchMove={(e) => {
              e.preventDefault();
              handleFlee();
            }}
            className="absolute px-6 py-3 bg-gray-600/50 text-gray-300 font-medium rounded-full border border-gray-500/50 transition-colors cursor-pointer select-none"
          >
            {noTexts[noTextIndex]}
          </motion.button>
        )}
      </div>
    </div>
  );
}
