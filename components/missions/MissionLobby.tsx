"use client";

import { motion } from "framer-motion";
import { MissionPresence } from "@/lib/hooks/useMissionRealtime";

type MissionLobbyProps = {
  prompt: string;
  presence: MissionPresence[];
  countdownLabel?: string;
  realtimeAvailable: boolean;
};

export function MissionLobby({
  prompt,
  presence,
  countdownLabel,
  realtimeAvailable,
}: MissionLobbyProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-gradient-to-br from-black/80 via-white/5 to-black/80 p-4 sm:p-6 md:p-8">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10" />
      
      <div className="relative z-10 space-y-4 sm:space-y-6">
        <div className="space-y-2 sm:space-y-3">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[10px] sm:text-xs uppercase tracking-[0.3em] sm:tracking-[0.4em] text-white/50"
          >
            Lobby
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight tracking-tight"
          >
            {prompt}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xs sm:text-sm text-white/60"
          >
            Waiting for the trio to gather. {realtimeAvailable ? "✨ Live presence active" : "Realtime unavailable"}
          </motion.p>
        </div>

        {countdownLabel && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-2 sm:px-4 touch-manipulation"
          >
            <div className="h-2 w-2 animate-pulse rounded-full bg-blue-400" />
            <p className="text-xs sm:text-sm font-mono font-medium text-white">
              Starts {countdownLabel}
            </p>
          </motion.div>
        )}

        <div className="space-y-3 sm:space-y-4">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white/40">
            Presence ({presence.length})
          </p>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {presence.map((person, index) => (
              <motion.div
                key={person.userId}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="group flex items-center gap-2 sm:gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-2 sm:px-4 sm:py-2.5 backdrop-blur-sm transition-all active:border-white/20 active:bg-white/10 touch-manipulation"
              >
                <div className="relative flex-shrink-0">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-blue-400/30 to-purple-400/30" />
                  {realtimeAvailable && (
                    <div className="absolute bottom-0 right-0 h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full border-2 border-black bg-green-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium truncate">
                    {person.name ?? person.userId.slice(0, 8)}
                  </p>
                  <p className="text-[10px] sm:text-xs text-white/50">
                    {person.entrySubmitted ? "✓ Ready" : "Waiting"}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Empty state for no presence */}
        {presence.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl border border-dashed border-white/20 p-8 text-center"
          >
            <p className="text-sm text-white/50">
              Be the first to join this mission
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
