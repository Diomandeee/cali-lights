"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import type { PartyConfig, SessionState } from "@/lib/types";
import { useRealtime } from "@/lib/hooks/useRealtime";
import { generateId } from "@/lib/utils";
import Lobby from "./components/Lobby";
import RoundTapBeat from "./components/RoundTapBeat";
import RoundSaltLimeSip from "./components/RoundSaltLimeSip";
import RoundPalettePick from "./components/RoundPalettePick";
import RoundFragments from "./components/RoundFragments";
import Unlock from "./components/Unlock";
import Recap from "./components/Recap";

export default function PartyPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sid") || generateId("session");

  const [config, setConfig] = useState<PartyConfig | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [nickname, setNickname] = useState<string>("");
  const [hasJoined, setHasJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { isConnected, isAvailable, sessionState, roundState, participantCount, publish } =
    useRealtime(sessionId, userId);

  // Load config
  useEffect(() => {
    async function loadConfig() {
      try {
        const response = await fetch("/config/party.v1.json");
        const data = await response.json();
        setConfig(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to load config:", error);
        setIsLoading(false);
      }
    }

    loadConfig();
  }, []);

  // Initialize user ID
  useEffect(() => {
    const storedUserId = localStorage.getItem("cali_lights_user_id");
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      const newUserId = generateId("user");
      localStorage.setItem("cali_lights_user_id", newUserId);
      setUserId(newUserId);
    }
  }, []);

  const handleJoin = async (nickname: string, instagram?: string) => {
    try {
      // Create or join session
      const response = await fetch("/api/session/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          userId,
          nickname,
          instagram,
        }),
      });

      if (!response.ok) throw new Error("Failed to join session");

      setNickname(nickname);
      setHasJoined(true);
    } catch (error) {
      console.error("Join error:", error);
      alert("Failed to join session");
    }
  };

  if (isLoading || !userId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cali-black">
        <div className="animate-shimmer text-cali-magenta text-2xl">
          Loading...
        </div>
      </main>
    );
  }

  if (!config) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cali-black">
        <div className="text-center">
          <p className="text-white">Failed to load party config</p>
        </div>
      </main>
    );
  }

  if (!hasJoined) {
    return <Lobby onJoin={handleJoin} participantCount={participantCount} />;
  }

  // Render based on session state
  const renderContent = () => {
    if (!sessionState || sessionState === "lobby") {
      return (
        <div className="flex min-h-screen items-center justify-center bg-cali-black p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-6"
          >
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-white">
              Welcome, {nickname}!
            </h2>
            <p className="text-cali-magenta text-lg">
              {participantCount} {participantCount === 1 ? "person" : "people"}{" "}
              in the party
            </p>
            <p className="text-gray-400">
              Waiting for the host to start the game...
            </p>
          </motion.div>
        </div>
      );
    }

    if (sessionState === "round" && roundState) {
      const roundConfig = config.rounds[roundState.round_number - 1];

      switch (roundState.round_type) {
        case "tap-beat":
          return (
            <RoundTapBeat
              roundState={roundState}
              config={roundConfig}
              onAction={(data) => publish("player:action", data)}
            />
          );
        case "salt-lime-sip":
          return (
            <RoundSaltLimeSip
              roundState={roundState}
              config={roundConfig}
              onAction={(data) => publish("player:action", data)}
            />
          );
        case "palette-pick":
          return (
            <RoundPalettePick
              roundState={roundState}
              config={roundConfig}
              onAction={(data) => publish("player:action", data)}
            />
          );
        case "memory-fragments":
          return (
            <RoundFragments
              roundState={roundState}
              config={roundConfig}
              onAction={(data) => publish("player:action", data)}
            />
          );
        default:
          return null;
      }
    }

    if (sessionState === "unlock") {
      return <Unlock config={config} />;
    }

    if (sessionState === "recap") {
      return <Recap sessionId={sessionId} />;
    }

    return null;
  };

  return (
    <main className="min-h-screen bg-cali-black">
      {isAvailable && !isConnected && (
        <div className="fixed top-4 right-4 px-4 py-2 bg-red-500 text-white rounded-full text-sm">
          Reconnecting...
        </div>
      )}
      {renderContent()}
    </main>
  );
}
