"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

// Daily messages - one for each day of the week (0 = Sunday, 6 = Saturday)
const dailyMessages = [
  {
    day: "Sunday",
    title: "Dance Through Your Dreams",
    message: "Today is your day to recharge and dream big. Let your imagination run wild - the best is yet to come.",
    emoji: "🌙",
    gradient: "from-indigo-500 to-purple-500"
  },
  {
    day: "Monday",
    title: "Your Energy Is Infectious",
    message: "The way you bring life to every room, every moment - that's pure magic. Keep spreading that joy.",
    emoji: "⚡",
    gradient: "from-yellow-500 to-pink-500"
  },
  {
    day: "Tuesday",
    title: "You Move Mountains",
    message: "Every challenge is just another dance floor. You've got the moves, the grace, and the strength to conquer anything.",
    emoji: "🏔️",
    gradient: "from-blue-500 to-teal-500"
  },
  {
    day: "Wednesday",
    title: "Halfway to Greatness",
    message: "You're crushing it this week. Every step, every move, every moment - you're exactly where you're meant to be.",
    emoji: "💫",
    gradient: "from-purple-500 to-pink-500"
  },
  {
    day: "Thursday",
    title: "Your Rhythm Can't Be Matched",
    message: "The way you move through life with such confidence and style - nobody does it like you. Keep shining.",
    emoji: "🎵",
    gradient: "from-pink-500 to-rose-500"
  },
  {
    day: "Friday",
    title: "It's Dance Dance Revolution Time!",
    message: "Weekend energy activated! Time to celebrate everything you've accomplished. You've earned every bit of joy coming your way.",
    emoji: "💃",
    gradient: "from-rose-500 to-orange-500"
  },
  {
    day: "Saturday",
    title: "This Is Your Stage",
    message: "Today, the world is your dance floor. Whatever brings you joy, whatever makes you smile - go all in. You deserve it all.",
    emoji: "✨",
    gradient: "from-pink-500 to-purple-500"
  }
];

export default function SofiaPage() {
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
            For Sofia
          </motion.h1>
          <p className="text-gray-400 text-lg mb-2">
            Your daily inspiration 💃
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
              📸 Shared Memories
            </Link>
            <Link
              href="/party"
              className="px-6 py-3 bg-gradient-to-r from-cali-magenta to-cali-purple text-white rounded-full font-semibold transition-all hover:scale-105 shadow-lg"
            >
              🎉 Dance Party
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
