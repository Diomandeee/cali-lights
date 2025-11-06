"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function SofiaPage() {
  return (
    <main className="min-h-screen bg-cali-black overflow-hidden relative">
      {/* Dreamy Background */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Soft glowing orbs */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              x: [0, 100, -50, 0],
              y: [0, -100, 50, 0],
              scale: [1, 1.3, 0.8, 1],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{
              duration: 15 + i * 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute w-96 h-96 rounded-full blur-3xl"
            style={{
              background: i % 3 === 0 ? "#E91E8C" : i % 3 === 1 ? "#A855F7" : "#EC4899",
              left: `${20 + i * 20}%`,
              top: `${10 + i * 15}%`,
            }}
          />
        ))}

        {/* Floating sparkles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={`sparkle-${i}`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              y: [0, -100]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeOut"
            }}
            className="absolute text-2xl"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          >
            ✨
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12 min-h-screen flex flex-col items-center justify-center">
        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-center space-y-8"
        >
          {/* Name */}
          <motion.h1
            className="text-7xl md:text-9xl font-black mb-6"
            animate={{
              backgroundPosition: ["0%", "100%"],
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            style={{
              backgroundImage: "linear-gradient(90deg, #E91E8C, #A855F7, #EC4899, #E91E8C)",
              backgroundSize: "200% 100%",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent"
            }}
          >
            Sofia
          </motion.h1>

          {/* Decorative hearts */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
            transition={{
              scale: { delay: 0.5, type: "spring", stiffness: 200 },
              rotate: { duration: 2, repeat: Infinity }
            }}
            className="text-6xl"
          >
            💖
          </motion.div>

          {/* Message */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="max-w-2xl mx-auto"
          >
            <div className="relative">
              {/* Glow behind text */}
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inset-0 bg-gradient-to-r from-cali-magenta to-cali-purple blur-3xl"
              />

              {/* Text box */}
              <div className="relative bg-gradient-to-br from-cali-magenta/20 to-cali-purple/20 rounded-3xl p-8 md:p-12 border-2 border-cali-purple/30 backdrop-blur-sm">
                <p className="text-2xl md:text-3xl text-white leading-relaxed font-light mb-6">
                  Your strength isn't loud.{" "}
                  <span className="font-bold text-cali-magenta">It doesn't need to be</span>.
                </p>
                <p className="text-xl md:text-2xl text-white/80 leading-relaxed font-light mb-6">
                  You show up. You stay consistent.{" "}
                  <span className="font-bold text-cali-purple">You don't quit</span>.
                </p>
                <p className="text-xl md:text-2xl text-white/80 leading-relaxed font-light">
                  That quiet power? It moves mountains. ⚡
                </p>
              </div>
            </div>
          </motion.div>

          {/* Coming Soon Note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="pt-8"
          >
            <div className="inline-block px-6 py-3 bg-cali-purple/20 border-2 border-cali-purple/50 rounded-full">
              <p className="text-cali-purple font-semibold flex items-center gap-2">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  🎂
                </motion.span>
                Your special celebration is coming soon...
              </p>
            </div>
          </motion.div>

          {/* Explore Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="pt-12"
          >
            <Link
              href="/memories"
              className="inline-block px-8 py-4 bg-gradient-to-r from-cali-magenta to-cali-purple text-white text-lg font-bold rounded-full shadow-xl hover:scale-105 transition-transform"
            >
              View Shared Memories 📸
            </Link>
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          whileHover={{ opacity: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-cali-magenta transition-colors"
          >
            ← Back
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
