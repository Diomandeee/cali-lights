"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CALI_PALETTES } from "@/lib/utils";

interface CaliLightsVizProps {
  imageSrc?: string;
  onComplete: () => void;
  duration?: number; // in seconds
}

export function CaliLightsViz({
  imageSrc = "/media/venue.jpg",
  onComplete,
  duration = 30,
}: CaliLightsVizProps) {
  const [colorIndex, setColorIndex] = useState(0);
  const colors = CALI_PALETTES.mixed.colors;

  useEffect(() => {
    // Cycle through colors
    const colorInterval = setInterval(() => {
      setColorIndex((prev) => (prev + 1) % colors.length);
    }, 2000);

    // Complete after duration
    const completeTimeout = setTimeout(onComplete, duration * 1000);

    return () => {
      clearInterval(colorInterval);
      clearTimeout(completeTimeout);
    };
  }, [colors.length, duration, onComplete]);

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-cali-black overflow-hidden">
      {/* Background color pulse */}
      <motion.div
        className="absolute inset-0"
        animate={{
          backgroundColor: colors[colorIndex],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          backgroundColor: { duration: 2, ease: "easeInOut" },
          opacity: { duration: 2, repeat: Infinity },
        }}
      />

      {/* Venue image with blend mode */}
      {imageSrc && (
        <motion.div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{
            backgroundImage: `url(${imageSrc})`,
            mixBlendMode: "screen",
          }}
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Animated light orbs */}
      <div className="relative z-10 flex items-center justify-center">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-32 h-32 rounded-full blur-3xl"
            style={{
              backgroundColor: colors[(colorIndex + i) % colors.length],
            }}
            animate={{
              x: [
                Math.cos((i * Math.PI) / 2) * 100,
                Math.cos((i * Math.PI) / 2 + Math.PI) * 100,
                Math.cos((i * Math.PI) / 2) * 100,
              ],
              y: [
                Math.sin((i * Math.PI) / 2) * 100,
                Math.sin((i * Math.PI) / 2 + Math.PI) * 100,
                Math.sin((i * Math.PI) / 2) * 100,
              ],
              opacity: [0.4, 0.8, 0.4],
            }}
            transition={{
              duration: 5 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          />
        ))}
      </div>

      {/* Center text */}
      <motion.div
        className="relative z-20 text-center space-y-4 px-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <motion.h2
          className="text-4xl md:text-6xl font-bold text-white text-glow"
          animate={{
            textShadow: [
              `0 0 20px ${colors[colorIndex]}`,
              `0 0 40px ${colors[colorIndex]}`,
              `0 0 20px ${colors[colorIndex]}`,
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Cali Lights
        </motion.h2>
        <p className="text-white text-lg opacity-75">
          Feel the moment again
        </p>
      </motion.div>

      {/* Progress bar */}
      <div className="absolute bottom-8 left-8 right-8">
        <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-cali-gold"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration, ease: "linear" }}
          />
        </div>
      </div>
    </div>
  );
}
