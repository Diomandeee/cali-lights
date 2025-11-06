"use client";

import { motion } from "framer-motion";
import type { PartyConfig } from "@/lib/types";

interface UnlockProps {
  config: PartyConfig;
}

export default function Unlock({ config }: UnlockProps) {
  const unlock = config.unlock;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-cali-black p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center space-y-8 max-w-2xl"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: 360 }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
          className="text-9xl"
        >
          🎁
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-5xl font-bold text-cali-gold text-glow"
        >
          Unlocked!
        </motion.h1>

        {/* Message */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="text-white text-2xl leading-relaxed"
        >
          {unlock.message}
        </motion.p>

        {/* CTA Button */}
        {unlock.cta && (
          <motion.a
            href={unlock.cta.href}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="inline-block px-8 py-4 bg-cali-gold text-cali-black font-bold text-lg rounded-full"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {unlock.cta.label}
          </motion.a>
        )}

        {/* Decorative stars */}
        <div className="relative mt-12">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-cali-gold text-2xl"
              style={{
                left: `${50 + Math.cos((i * Math.PI) / 4) * 150}px`,
                top: `${Math.sin((i * Math.PI) / 4) * 150}px`,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: 1.5 + i * 0.1,
                duration: 0.5,
              }}
            >
              ✨
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Ambient glow */}
      <motion.div
        className="fixed inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ duration: 2 }}
      >
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(219,150,44,0.5) 0%, rgba(219,150,44,0) 70%)",
          }}
        />
      </motion.div>
    </div>
  );
}
