"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

// Check if it's Alize's birthday (Nov 6-7, 2025)
function isBirthdayTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  const day = now.getDate();

  // November 6-7
  return (month === 10 && (day === 6 || day === 7));
}

// Dynamic messages that rotate
const dynamicMessages = [
  {
    title: "You Light Up Every Room",
    message: "Your energy is magnetic. When you walk in, everything feels brighter, warmer, more alive. Never dim that light.",
    emoji: "✨",
    gradient: "from-yellow-500 to-orange-500"
  },
  {
    title: "Your Smile is Contagious",
    message: "You have this way of making everyone around you feel seen, heard, and valued. That's a rare gift.",
    emoji: "💖",
    gradient: "from-pink-500 to-rose-500"
  },
  {
    title: "You're Stronger Than You Know",
    message: "Every challenge you've faced, you've come out more beautiful, more resilient, more you. Keep going.",
    emoji: "🦋",
    gradient: "from-purple-500 to-blue-500"
  },
  {
    title: "Your Dreams Are Valid",
    message: "Everything you're working toward? It's not just possible - it's inevitable. Trust the journey.",
    emoji: "🌟",
    gradient: "from-blue-500 to-teal-500"
  },
  {
    title: "You're Exactly Where You Need To Be",
    message: "Even when it doesn't feel like it, you're growing, evolving, becoming. Every moment matters.",
    emoji: "🌸",
    gradient: "from-pink-500 to-purple-500"
  },
  {
    title: "The World Needs Your Voice",
    message: "What you have to say, your perspective, your creativity - it matters. Don't hold back.",
    emoji: "🎨",
    gradient: "from-orange-500 to-red-500"
  },
  {
    title: "You're Loved Beyond Measure",
    message: "More than you know, more than words can say. The people in your life are so lucky to have you.",
    emoji: "💝",
    gradient: "from-red-500 to-pink-500"
  },
  {
    title: "Your Vibe is Unmatched",
    message: "There's nobody else like you. Your style, your laugh, your energy - it's all uniquely, perfectly you.",
    emoji: "👑",
    gradient: "from-purple-500 to-indigo-500"
  }
];

export default function AlizePage() {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const isBirthday = isBirthdayTime();

  // Rotate messages every 8 seconds
  useEffect(() => {
    if (!isBirthday) {
      const interval = setInterval(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % dynamicMessages.length);
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [isBirthday]);

  const currentMessage = dynamicMessages[currentMessageIndex];

  if (isBirthday) {
    // Birthday Mode
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 relative overflow-hidden bg-gradient-to-b from-cali-black via-cali-darkPurple to-cali-black">
        {/* Enhanced ambient glow effects - optimized */}
        <div className="fixed inset-0 pointer-events-none">
          <motion.div
            className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-cali-magenta/20 rounded-full blur-2xl"
            style={{ willChange: "transform" }}
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.2, 0.35, 0.2],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cali-purple/20 rounded-full blur-2xl"
            style={{ willChange: "transform" }}
            animate={{
              scale: [1.15, 1, 1.15],
              opacity: [0.2, 0.35, 0.2],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2.5
            }}
          />
        </div>

        <div className="text-center space-y-12 relative z-10 max-w-5xl mx-auto px-4">
          {/* Massive Birthday Message */}
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="space-y-8"
          >
            <motion.h1
              className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black mb-6 relative leading-tight"
              style={{
                willChange: "transform",
                textShadow: "0 0 30px rgba(233, 30, 140, 0.6)"
              }}
            >
              <span className="bg-gradient-to-r from-cali-magenta via-cali-purple to-cali-pink bg-clip-text text-transparent block">
                Happy Birthday
              </span>
              <span className="bg-gradient-to-r from-cali-pink via-cali-magenta to-cali-purple bg-clip-text text-transparent block mt-4">
                Alize ✨
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="text-2xl md:text-4xl font-light text-white/80"
            >
              A living digital memento
            </motion.p>
          </motion.div>

          {/* Begin Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 1 }}
            className="mt-16"
          >
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <motion.a
                href="/solo?cfg=solo.v1"
                className="inline-block px-12 py-6 bg-gradient-to-r from-cali-magenta via-cali-purple to-cali-pink text-white text-xl md:text-2xl font-bold rounded-full shadow-2xl"
                style={{ willChange: "transform" }}
                whileHover={{
                  scale: 1.05,
                }}
                whileTap={{ scale: 0.95 }}
              >
                Begin Your Journey
              </motion.a>

              <motion.a
                href="/memories"
                className="inline-block px-8 py-4 border-2 border-cali-purple text-cali-purple text-lg font-semibold rounded-full hover:bg-cali-purple/10 transition-all"
                style={{ willChange: "transform" }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                📸 View Memories
              </motion.a>
            </div>

            {/* Secret Oracle Link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
              className="mt-8"
            >
              <motion.a
                href="/oracle"
                className="group inline-flex items-center gap-2 text-cali-purple/60 hover:text-cali-magenta transition-colors text-sm"
                style={{ willChange: "transform" }}
                whileHover={{ scale: 1.05 }}
              >
                <motion.span
                  style={{ willChange: "transform" }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  🔮
                </motion.span>
                <span className="group-hover:underline">What does the oracle say?</span>
              </motion.a>
            </motion.div>
          </motion.div>
        </div>
      </main>
    );
  }

  // Post-Birthday Mode - Dynamic Messages Library
  return (
    <main className="min-h-screen bg-cali-black overflow-hidden">
      {/* Floating Background */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0.1, 0.3, 0.1],
              scale: [1, 1.5, 1],
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50]
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: i * 0.1
            }}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: i % 2 === 0 ? '#E91E8C' : '#A855F7'
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12 min-h-screen flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.h1
            className="text-5xl md:text-7xl font-black mb-4"
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
            For Alize
          </motion.h1>
          <p className="text-gray-400 text-lg">
            A living collection of reminders just for you ✨
          </p>
        </motion.div>

        {/* Dynamic Message Card */}
        <motion.div
          key={currentMessageIndex}
          initial={{ opacity: 0, scale: 0.9, rotateY: -20 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: 0.6, type: "spring" }}
          className="flex-1 flex items-center justify-center mb-12"
        >
          <div className="relative max-w-2xl w-full">
            {/* Glow behind card */}
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.4, 0.6, 0.4]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className={`absolute inset-0 bg-gradient-to-br ${currentMessage.gradient} blur-3xl rounded-3xl`}
            />

            {/* Card */}
            <div className={`relative bg-gradient-to-br ${currentMessage.gradient} rounded-3xl p-8 md:p-12 shadow-2xl border-4 border-white/20`}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: [0, 10, 0] }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="text-7xl mb-6 text-center"
              >
                {currentMessage.emoji}
              </motion.div>

              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-3xl md:text-4xl font-bold text-white mb-4 text-center"
              >
                {currentMessage.title}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-xl text-white/90 leading-relaxed text-center"
              >
                {currentMessage.message}
              </motion.p>
            </div>
          </div>
        </motion.div>

        {/* Message Dots */}
        <div className="flex justify-center gap-2 mb-8">
          {dynamicMessages.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentMessageIndex(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentMessageIndex
                  ? "bg-cali-magenta w-8"
                  : "bg-gray-600 hover:bg-gray-500"
              }`}
            />
          ))}
        </div>

        {/* Explore Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center space-y-4"
        >
          <h3 className="text-xl text-gray-400 mb-6">
            Explore More
          </h3>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/memories"
              className="px-6 py-3 bg-cali-purple/30 hover:bg-cali-purple/50 text-white rounded-full border border-cali-purple transition-all hover:scale-105"
            >
              📸 Photo Memories
            </Link>
            <Link
              href="/oracle"
              className="px-6 py-3 bg-cali-magenta/30 hover:bg-cali-magenta/50 text-white rounded-full border border-cali-magenta transition-all hover:scale-105"
            >
              🔮 Birthday Oracle
            </Link>
            <Link
              href="/solo?cfg=solo.v1"
              className="px-6 py-3 bg-gradient-to-r from-cali-magenta to-cali-purple text-white rounded-full font-semibold transition-all hover:scale-105 shadow-lg"
            >
              ✨ Solo Journey
            </Link>
          </div>
        </motion.div>

        {/* Back Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          whileHover={{ opacity: 1 }}
          className="text-center mt-8"
        >
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-cali-magenta transition-colors"
          >
            ← Back to Home
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
