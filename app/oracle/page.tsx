"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface OracleCard {
  id: string;
  category: string;
  title: string;
  message: string;
  emoji: string;
  color: string;
}

const oracleCards: OracleCard[] = [
  {
    id: "adventure",
    category: "Adventure",
    title: "The Wanderer",
    message: "This year brings unexpected journeys. Say yes to spontaneous plans - the best memories are unplanned.",
    emoji: "🌅",
    color: "from-orange-500 to-pink-500"
  },
  {
    id: "love",
    category: "Love",
    title: "The Heart",
    message: "Deep connections flourish around you. Someone close will surprise you with their thoughtfulness.",
    emoji: "💖",
    color: "from-pink-500 to-rose-500"
  },
  {
    id: "growth",
    category: "Growth",
    title: "The Phoenix",
    message: "You're leveling up! A skill you've been nurturing is about to bloom beautifully.",
    emoji: "🦋",
    color: "from-purple-500 to-blue-500"
  },
  {
    id: "joy",
    category: "Joy",
    title: "The Celebration",
    message: "Laughter is your superpower this year. Your energy brings people together effortlessly.",
    emoji: "✨",
    color: "from-yellow-500 to-orange-500"
  },
  {
    id: "magic",
    category: "Magic",
    title: "The Dreamer",
    message: "Something you've been manifesting is closer than you think. Keep the faith - magic is real.",
    emoji: "🌙",
    color: "from-indigo-500 to-purple-500"
  },
  {
    id: "friendship",
    category: "Friendship",
    title: "The Circle",
    message: "Your tribe is expanding. New faces will feel like old souls - welcome them warmly.",
    emoji: "👯‍♀️",
    color: "from-green-500 to-teal-500"
  },
  {
    id: "creativity",
    category: "Creativity",
    title: "The Artist",
    message: "Your creative vision is powerful. Don't dim your light - the world needs your unique expression.",
    emoji: "🎨",
    color: "from-purple-500 to-pink-500"
  },
  {
    id: "abundance",
    category: "Abundance",
    title: "The Blessing",
    message: "What you give returns tenfold. Generosity opens doors you didn't know existed.",
    emoji: "🌟",
    color: "from-yellow-500 to-green-500"
  }
];

export default function OraclePage() {
  const [selectedCard, setSelectedCard] = useState<OracleCard | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);

  const drawCard = () => {
    if (hasDrawn) return;

    setIsRevealing(true);
    setHasDrawn(true);

    // Random selection after suspenseful delay
    setTimeout(() => {
      const randomCard = oracleCards[Math.floor(Math.random() * oracleCards.length)];
      setSelectedCard(randomCard);
      setIsRevealing(false);
    }, 2000);
  };

  const reset = () => {
    setSelectedCard(null);
    setHasDrawn(false);
    setIsRevealing(false);
  };

  return (
    <div className="min-h-screen bg-cali-black overflow-hidden">
      {/* Cosmic Background */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Floating stars */}
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0.2, 1, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}

        {/* Floating orbs */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={`orb-${i}`}
            animate={{
              x: [0, 100, 0],
              y: [0, -100, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute w-64 h-64 rounded-full blur-3xl opacity-20"
            style={{
              background: i === 0 ? "#E91E8C" : i === 1 ? "#A855F7" : "#EC4899",
              left: `${20 + i * 30}%`,
              top: `${20 + i * 20}%`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="sticky top-0 z-30 bg-cali-black/95 backdrop-blur-lg border-b border-cali-purple/20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link
            href="/"
            className="text-cali-magenta hover:text-cali-purple transition-colors"
          >
            ← Back
          </Link>
          <motion.h1
            animate={{
              textShadow: [
                "0 0 20px #E91E8C",
                "0 0 40px #A855F7",
                "0 0 20px #E91E8C"
              ]
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-2xl font-bold bg-gradient-to-r from-cali-magenta to-cali-purple bg-clip-text text-transparent"
          >
            🔮 Birthday Oracle
          </motion.h1>
          <div className="w-16" />
        </div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {!selectedCard && !isRevealing ? (
            // Initial State - Card Selection
            <motion.div
              key="selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-center"
            >
              <motion.div
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="text-8xl mb-8"
              >
                🔮
              </motion.div>

              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                What does this year hold?
              </h2>
              <p className="text-gray-400 text-lg mb-12 max-w-2xl mx-auto">
                The cosmic energies have aligned for your birthday.
                Draw a card to reveal your mystical message for the year ahead.
              </p>

              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(233, 30, 140, 0.5)" }}
                whileTap={{ scale: 0.95 }}
                onClick={drawCard}
                className="px-12 py-6 bg-gradient-to-r from-cali-magenta to-cali-purple text-white text-xl font-bold rounded-full shadow-2xl relative overflow-hidden group"
              >
                <motion.div
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                />
                <span className="relative">Draw Your Card</span>
              </motion.button>

              {/* Floating preview cards */}
              <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
                {oracleCards.slice(0, 4).map((card, i) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{
                      opacity: 0.3,
                      y: 0,
                      rotate: [0, 5, 0, -5, 0]
                    }}
                    transition={{
                      delay: i * 0.1,
                      rotate: {
                        duration: 3,
                        repeat: Infinity,
                        delay: i * 0.5
                      }
                    }}
                    className="aspect-[2/3] bg-gradient-to-br from-cali-purple/20 to-cali-magenta/20 rounded-lg border border-cali-purple/30 backdrop-blur flex items-center justify-center text-4xl"
                  >
                    {card.emoji}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : isRevealing ? (
            // Revealing State - Suspense
            <motion.div
              key="revealing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-20"
            >
              <motion.div
                animate={{
                  rotate: 360,
                  scale: [1, 1.2, 1]
                }}
                transition={{
                  rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                  scale: { duration: 1, repeat: Infinity }
                }}
                className="text-9xl mb-8"
              >
                🔮
              </motion.div>
              <motion.h2
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-3xl text-cali-magenta font-bold"
              >
                The oracle is speaking...
              </motion.h2>
            </motion.div>
          ) : (
            // Revealed State - Show Card
            <motion.div
              key="revealed"
              initial={{ opacity: 0, scale: 0.8, rotateY: 90 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ type: "spring", stiffness: 100 }}
              className="text-center"
            >
              {/* Large Card Display */}
              <motion.div
                animate={{
                  y: [-10, 10, -10],
                  rotateZ: [-2, 2, -2]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="max-w-md mx-auto mb-8 relative"
              >
                {/* Glow effect */}
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 0.8, 0.5]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={`absolute inset-0 bg-gradient-to-br ${selectedCard?.color} blur-3xl`}
                />

                {/* Card */}
                <div className={`relative aspect-[2/3] bg-gradient-to-br ${selectedCard?.color} rounded-2xl shadow-2xl p-8 flex flex-col items-center justify-center border-4 border-white/20`}>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, rotate: 360 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className="text-8xl mb-6"
                  >
                    {selectedCard?.emoji}
                  </motion.div>
                  <motion.h3
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-3xl font-bold text-white mb-2"
                  >
                    {selectedCard?.title}
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="text-white/80 text-sm uppercase tracking-wider"
                  >
                    {selectedCard?.category}
                  </motion.p>
                </div>
              </motion.div>

              {/* Message */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="max-w-2xl mx-auto mb-8"
              >
                <p className="text-2xl text-white leading-relaxed font-light">
                  "{selectedCard?.message}"
                </p>
              </motion.div>

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="flex gap-4 justify-center flex-wrap"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={reset}
                  className="px-8 py-3 bg-cali-purple/30 hover:bg-cali-purple/50 text-white rounded-full border border-cali-purple transition-colors"
                >
                  Draw Another
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: `My Birthday Oracle: ${selectedCard?.title}`,
                        text: selectedCard?.message,
                      });
                    }
                  }}
                  className="px-8 py-3 bg-gradient-to-r from-cali-magenta to-cali-purple text-white rounded-full font-semibold"
                >
                  Share Your Fortune
                </motion.button>
              </motion.div>

              {/* Sparkles */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(15)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1.5, 0],
                      y: [0, -100]
                    }}
                    transition={{
                      duration: 2,
                      delay: 0.5 + i * 0.1,
                      ease: "easeOut"
                    }}
                    className="absolute text-2xl"
                    style={{
                      left: `${20 + Math.random() * 60}%`,
                      top: "50%"
                    }}
                  >
                    ✨
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
