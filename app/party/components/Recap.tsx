"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Recap as RecapType } from "@/lib/types";
import { getPalette } from "@/lib/utils";

interface RecapProps {
  sessionId: string;
}

export default function Recap({ sessionId }: RecapProps) {
  const [recap, setRecap] = useState<RecapType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadRecap() {
      try {
        const response = await fetch(`/api/party/recap?sessionId=${sessionId}`);
        const data = await response.json();
        setRecap(data.recap);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to load recap:", error);
        setIsLoading(false);
      }
    }

    loadRecap();
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cali-black">
        <div className="animate-shimmer text-cali-gold text-2xl">
          Generating recap...
        </div>
      </div>
    );
  }

  if (!recap) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cali-black">
        <div className="text-center">
          <p className="text-white">Recap not available</p>
        </div>
      </div>
    );
  }

  const palette = recap.palette ? getPalette(recap.palette as any) : null;
  const minutes = Math.floor(recap.completion_time / 60);
  const seconds = recap.completion_time % 60;

  return (
    <div className="min-h-screen bg-cali-black p-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-4xl mx-auto space-y-12 py-12"
      >
        {/* Header */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-7xl mb-6"
          >
            🌟
          </motion.div>
          <h1 className="text-5xl font-bold text-cali-gold text-glow">
            That Was Magic
          </h1>
          <p className="text-white text-xl">
            Here's what we created together
          </p>
        </div>

        {/* Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-cali-green/20 border-2 border-cali-green rounded-2xl p-8 text-center"
        >
          <p className="text-gray-400 text-sm uppercase tracking-wider mb-2">
            Final Score
          </p>
          <p className="text-6xl font-bold text-cali-gold">
            {recap.final_score}
          </p>
          <p className="text-white text-sm mt-2">
            Completed in {minutes}:{seconds.toString().padStart(2, "0")}
          </p>
        </motion.div>

        {/* Chosen Palette */}
        {palette && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-4"
          >
            <h2 className="text-2xl font-bold text-white">Your Palette</h2>
            <div className="bg-cali-green/20 border-2 border-cali-green rounded-2xl p-6">
              <div
                className="w-full h-32 rounded-xl mb-4"
                style={{ background: palette.gradient }}
              />
              <p className="text-white text-xl font-medium text-center">
                {palette.name}
              </p>
            </div>
          </motion.div>
        )}

        {/* Collective Toast */}
        {recap.toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="space-y-4"
          >
            <h2 className="text-2xl font-bold text-white">Collective Toast</h2>
            <div className="bg-cali-green/20 border-2 border-cali-green rounded-2xl p-8">
              <p className="text-white text-lg leading-relaxed italic">
                "{recap.toast}"
              </p>
            </div>
          </motion.div>
        )}

        {/* Playlist */}
        {recap.playlist_url && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="text-center"
          >
            <a
              href={recap.playlist_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-4 bg-cali-gold text-cali-black font-bold text-lg rounded-full hover:scale-105 transition-transform"
            >
              🎵 Listen to the Playlist
            </a>
          </motion.div>
        )}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="text-center pt-12 border-t border-cali-green/30"
        >
          <p className="text-gray-400 text-sm">
            This memory will live on in Solo Mode
          </p>
          <p className="text-cali-gold text-xs mt-2">
            ✨ Cali Lights · {new Date().toLocaleDateString()}
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
