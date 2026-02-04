"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

interface HeartParticlesProps {
  count?: number;
  intensity?: "low" | "medium" | "high";
}

export function HeartParticles({ count = 12, intensity = "medium" }: HeartParticlesProps) {
  const particles = useMemo(() => {
    const colors = ["#BE123C", "#FB7185", "#FDA4AF", "#E91E8C"];
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      color: colors[i % colors.length],
      left: Math.random() * 100,
      delay: Math.random() * 10,
      duration: 18 + Math.random() * 12,
      size: 4 + Math.random() * 6,
    }));
  }, [count]);

  const opacityMap = {
    low: 0.2,
    medium: 0.35,
    high: 0.5,
  };

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Soft glowing orbs - rose themed */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={`orb-${i}`}
          animate={{
            x: [0, 60, -30, 0],
            y: [0, -60, 30, 0],
            scale: [1, 1.15, 0.95, 1],
            opacity: [0.12, 0.25, 0.12],
          }}
          transition={{
            duration: 20 + i * 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute w-80 h-80 rounded-full blur-3xl"
          style={{
            background: i % 2 === 0 ? "#BE123C" : "#FB7185",
            left: `${15 + i * 25}%`,
            top: `${5 + i * 20}%`,
          }}
        />
      ))}

      {/* Floating soft particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{
            opacity: 0,
            y: "100vh",
          }}
          animate={{
            opacity: [0, opacityMap[intensity], opacityMap[intensity], 0],
            y: ["100vh", "-10vh"],
            x: [0, Math.sin(particle.id) * 20, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "linear",
          }}
          className="absolute rounded-full blur-sm"
          style={{
            left: `${particle.left}%`,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
          }}
        />
      ))}
    </div>
  );
}
