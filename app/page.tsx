"use client";

import { motion } from "framer-motion";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 relative overflow-hidden bg-gradient-to-b from-cali-black via-cali-darkPurple to-cali-black">
      {/* Enhanced ambient glow effects */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-cali-magenta/30 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-cali-purple/30 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-cali-pink/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
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
            animate={{
              textShadow: [
                "0 0 20px rgba(233, 30, 140, 0.5), 0 0 40px rgba(168, 85, 247, 0.3)",
                "0 0 40px rgba(233, 30, 140, 0.8), 0 0 80px rgba(168, 85, 247, 0.5), 0 0 120px rgba(236, 72, 153, 0.3)",
                "0 0 20px rgba(233, 30, 140, 0.5), 0 0 40px rgba(168, 85, 247, 0.3)",
              ],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <span className="bg-gradient-to-r from-cali-magenta via-cali-purple to-cali-pink bg-clip-text text-transparent block">
              Happy Birthday
            </span>
            <motion.span
              className="bg-gradient-to-r from-cali-pink via-cali-magenta to-cali-purple bg-clip-text text-transparent block mt-4"
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              Alize ✨
            </motion.span>
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
          <motion.a
            href="/solo?cfg=solo.v1"
            className="inline-block px-12 py-6 bg-gradient-to-r from-cali-magenta via-cali-purple to-cali-pink text-white text-xl md:text-2xl font-bold rounded-full shadow-2xl"
            whileHover={{
              scale: 1.05,
              boxShadow: "0 0 40px rgba(233, 30, 140, 0.6), 0 0 80px rgba(168, 85, 247, 0.4)"
            }}
            whileTap={{ scale: 0.95 }}
            animate={{
              boxShadow: [
                "0 0 20px rgba(233, 30, 140, 0.3)",
                "0 0 40px rgba(233, 30, 140, 0.5), 0 0 60px rgba(168, 85, 247, 0.3)",
                "0 0 20px rgba(233, 30, 140, 0.3)",
              ],
            }}
            transition={{
              boxShadow: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }}
          >
            Begin Your Journey
          </motion.a>
        </motion.div>

        {/* Decorative sparkles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-4xl"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 2) * 30}%`,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0.5, 1, 0.5],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.5,
                ease: "easeInOut"
              }}
            >
              ✨
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  );
}
