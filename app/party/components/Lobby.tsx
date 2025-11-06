"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface LobbyProps {
  onJoin: (nickname: string, instagram?: string) => void;
  participantCount: number;
}

export default function Lobby({ onJoin, participantCount }: LobbyProps) {
  const [nickname, setNickname] = useState("");
  const [instagram, setInstagram] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    setIsSubmitting(true);
    await onJoin(nickname.trim(), instagram.trim() || undefined);
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-cali-black p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        {/* Header */}
        <div className="text-center space-y-4">
          <motion.h1
            className="text-5xl font-bold text-cali-gold text-glow"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            Cali Lights
          </motion.h1>
          <p className="text-white text-xl">Join the party</p>
          {participantCount > 0 && (
            <p className="text-cali-gold text-sm">
              {participantCount} {participantCount === 1 ? "person" : "people"}{" "}
              already here
            </p>
          )}
        </div>

        {/* Join form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="nickname"
              className="block text-white text-sm font-medium mb-2"
            >
              Your Name
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 bg-cali-green/20 border border-cali-green text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cali-gold placeholder-gray-500"
              maxLength={20}
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label
              htmlFor="instagram"
              className="block text-white text-sm font-medium mb-2"
            >
              Instagram (optional)
            </label>
            <input
              id="instagram"
              type="text"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="@username"
              className="w-full px-4 py-3 bg-cali-green/20 border border-cali-green text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cali-gold placeholder-gray-500"
              maxLength={30}
              disabled={isSubmitting}
            />
          </div>

          <motion.button
            type="submit"
            disabled={!nickname.trim() || isSubmitting}
            className="w-full py-4 bg-cali-gold text-cali-black font-bold text-lg rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.02 }}
          >
            {isSubmitting ? "Joining..." : "Join Party"}
          </motion.button>
        </form>

        <p className="text-center text-gray-500 text-sm">
          Scan the QR code with your phone to join
        </p>
      </motion.div>
    </div>
  );
}
