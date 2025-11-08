"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

// Daily messages - one for each day of the week (0 = Sunday, 6 = Saturday)
const dailyMessages = [
  {
    day: "Sunday",
    title: "Start Your Week with Magic",
    message: "Today is about rest, reflection, and recharging. You've earned this peace. Let yourself be soft today.",
    emoji: "🌅",
    gradient: "from-orange-400 to-pink-500"
  },
  {
    day: "Monday",
    title: "You're Unstoppable",
    message: "New week, fresh energy. Whatever you're chasing this week, it doesn't stand a chance. You've got this.",
    emoji: "💪",
    gradient: "from-purple-500 to-blue-500"
  },
  {
    day: "Tuesday",
    title: "Your Light Inspires Others",
    message: "You have this way of making everything around you feel more vibrant. Keep shining, the world needs your energy.",
    emoji: "✨",
    gradient: "from-yellow-400 to-orange-500"
  },
  {
    day: "Wednesday",
    title: "You're Right on Time",
    message: "Halfway there. Every step you've taken matters. Even when it feels slow, you're exactly where you need to be.",
    emoji: "🦋",
    gradient: "from-pink-500 to-purple-500"
  },
  {
    day: "Thursday",
    title: "Your Dreams Are Closer",
    message: "Everything you're working toward? It's not just possible - it's happening. Trust the process, trust yourself.",
    emoji: "🌟",
    gradient: "from-blue-500 to-teal-500"
  },
  {
    day: "Friday",
    title: "Celebrate Yourself",
    message: "You made it through another week. That deserves recognition. Be proud of how far you've come.",
    emoji: "🎉",
    gradient: "from-pink-500 to-rose-500"
  },
  {
    day: "Saturday",
    title: "You Deserve Joy",
    message: "Today is yours. Whatever brings you peace, whatever makes you smile - chase that feeling. You've earned it.",
    emoji: "💖",
    gradient: "from-rose-500 to-pink-400"
  }
];

export default function AlizePage() {
  // Get the current day of the week (0 = Sunday, 6 = Saturday)
  const [dayOfWeek, setDayOfWeek] = useState(new Date().getDay());
  const currentMessage = dailyMessages[dayOfWeek];

  // Update day at midnight
  useEffect(() => {
    const checkDay = () => {
      setDayOfWeek(new Date().getDay());
    };

    // Check every minute if the day has changed
    const interval = setInterval(checkDay, 60000);
    return () => clearInterval(interval);
  }, []);

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
          <p className="text-gray-400 text-lg mb-2">
            Your daily reminder ✨
          </p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-cali-purple/80 text-sm font-semibold"
          >
            {currentMessage.day}
          </motion.p>
        </motion.div>

        {/* Dynamic Message Card */}
        <motion.div
          key={dayOfWeek}
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
