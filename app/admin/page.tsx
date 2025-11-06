"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { Mode, SessionState } from "@/lib/types";

export default function AdminPage() {
  const [currentMode, setCurrentMode] = useState<Mode>("solo");
  const [sessionId, setSessionId] = useState<string>("");
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [participantCount, setParticipantCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const token = process.env.NEXT_PUBLIC_DEFAULT_TOKEN || "cali";

  // Load current mode
  useEffect(() => {
    async function loadMode() {
      try {
        const response = await fetch(`/api/admin/mode?token=${token}`);
        const data = await response.json();
        if (data.mode) {
          setCurrentMode(data.mode);
          if (data.sessionId) {
            setSessionId(data.sessionId);
          }
        }
      } catch (error) {
        console.error("Failed to load mode:", error);
      }
    }

    loadMode();
  }, [token]);

  const handleToggleMode = async (mode: Mode) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, mode }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentMode(mode);
        if (data.sessionId) {
          setSessionId(data.sessionId);
        }
      } else {
        alert("Failed to toggle mode");
      }
    } catch (error) {
      console.error("Mode toggle error:", error);
      alert("Failed to toggle mode");
    }
    setIsLoading(false);
  };

  const handleStartRound = async (roundNumber: number) => {
    if (!sessionId) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/round/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, roundNumber }),
      });

      if (response.ok) {
        const data = await response.json();
        setSessionState(data.state);
      } else {
        alert("Failed to start round");
      }
    } catch (error) {
      console.error("Round start error:", error);
      alert("Failed to start round");
    }
    setIsLoading(false);
  };

  const handleEndSession = async () => {
    if (!sessionId) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/session/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      if (response.ok) {
        alert("Session ended successfully");
        setSessionState(null);
      } else {
        alert("Failed to end session");
      }
    } catch (error) {
      console.error("Session end error:", error);
      alert("Failed to end session");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-cali-black p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-cali-gold text-glow">
            Cali Lights Admin
          </h1>
          <p className="text-gray-400">Control panel for QR mode and sessions</p>
        </div>

        {/* Mode Toggle */}
        <div className="bg-cali-green/20 border-2 border-cali-green rounded-2xl p-6 space-y-4">
          <h2 className="text-2xl font-bold text-white mb-4">Current Mode</h2>

          <div className="grid grid-cols-2 gap-4">
            <motion.button
              onClick={() => handleToggleMode("solo")}
              disabled={isLoading || currentMode === "solo"}
              className={`p-6 rounded-xl border-2 transition-all ${
                currentMode === "solo"
                  ? "border-cali-gold bg-cali-gold/20"
                  : "border-gray-700 hover:border-cali-green"
              }`}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-4xl mb-2">🌙</div>
              <p className="text-white font-bold text-lg">Solo Mode</p>
              <p className="text-gray-400 text-sm mt-2">
                Memory levels experience
              </p>
            </motion.button>

            <motion.button
              onClick={() => handleToggleMode("party")}
              disabled={isLoading || currentMode === "party"}
              className={`p-6 rounded-xl border-2 transition-all ${
                currentMode === "party"
                  ? "border-cali-gold bg-cali-gold/20"
                  : "border-gray-700 hover:border-cali-green"
              }`}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-4xl mb-2">🎉</div>
              <p className="text-white font-bold text-lg">Party Mode</p>
              <p className="text-gray-400 text-sm mt-2">
                Multiplayer game session
              </p>
            </motion.button>
          </div>
        </div>

        {/* Party Controls */}
        {currentMode === "party" && sessionId && (
          <div className="bg-cali-green/20 border-2 border-cali-green rounded-2xl p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Party Controls</h2>
              <div className="text-cali-gold text-sm">
                Session: {sessionId.slice(0, 8)}...
              </div>
            </div>

            {/* Session stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-cali-black/50 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Participants</p>
                <p className="text-white text-2xl font-bold">
                  {participantCount}
                </p>
              </div>
              <div className="bg-cali-black/50 rounded-lg p-4">
                <p className="text-gray-400 text-sm">State</p>
                <p className="text-white text-2xl font-bold capitalize">
                  {sessionState || "lobby"}
                </p>
              </div>
            </div>

            {/* Round controls */}
            <div className="space-y-3">
              <p className="text-white font-medium">Start Round</p>
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((roundNum) => (
                  <button
                    key={roundNum}
                    onClick={() => handleStartRound(roundNum)}
                    disabled={isLoading}
                    className="px-4 py-3 bg-cali-gold text-cali-black font-bold rounded-lg hover:bg-cali-gold/80 disabled:opacity-50"
                  >
                    Round {roundNum}
                  </button>
                ))}
              </div>
            </div>

            {/* End session */}
            <button
              onClick={handleEndSession}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              End Session
            </button>
          </div>
        )}

        {/* QR Code Display */}
        <div className="bg-cali-green/20 border-2 border-cali-green rounded-2xl p-6 space-y-4">
          <h2 className="text-2xl font-bold text-white">QR Code</h2>
          <div className="bg-white p-8 rounded-xl flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">📱</div>
              <p className="text-gray-600 text-sm">
                /r/{token}
              </p>
            </div>
          </div>
          <p className="text-gray-400 text-sm text-center">
            Scan to access current mode
          </p>
        </div>
      </div>
    </div>
  );
}
