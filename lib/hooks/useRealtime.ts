"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Ably from "ably";
import type { SessionState, RoundState } from "@/lib/types";
import { RealtimeEventType } from "@/lib/realtime";

interface UseRealtimeReturn {
  isConnected: boolean;
  sessionState: SessionState | null;
  roundState: RoundState | null;
  participantCount: number;
  publish: (eventType: string, data: any) => Promise<void>;
}

export function useRealtime(
  sessionId: string,
  userId: string
): UseRealtimeReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [roundState, setRoundState] = useState<RoundState | null>(null);
  const [participantCount, setParticipantCount] = useState(0);

  const ablyRef = useRef<Ably.Realtime | null>(null);
  const channelRef = useRef<Ably.Types.RealtimeChannelCallbacks | null>(null);

  useEffect(() => {
    let mounted = true;

    async function connect() {
      try {
        // Get auth token from server
        const response = await fetch("/api/realtime/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });

        if (!response.ok) throw new Error("Failed to get auth token");

        const { token } = await response.json();

        // Initialize Ably client
        const client = new Ably.Realtime({
          authCallback: (_, callback) => {
            callback(null, token);
          },
          clientId: userId,
        });

        ablyRef.current = client;

        // Subscribe to session channel
        const channel = client.channels.get(`session:${sessionId}`);
        channelRef.current = channel;

        // Subscribe to events
        channel.subscribe((message) => {
          if (!mounted) return;

          switch (message.name) {
            case RealtimeEventType.SESSION_STATE_CHANGE:
              setSessionState(message.data.state);
              break;

            case RealtimeEventType.ROUND_START:
              setRoundState(message.data);
              break;

            case RealtimeEventType.ROUND_END:
              setRoundState(null);
              break;

            case RealtimeEventType.ROUND_SCORE_UPDATE:
              if (roundState) {
                setRoundState({
                  ...roundState,
                  score: message.data.score,
                });
              }
              break;

            case RealtimeEventType.PARTICIPANT_JOIN:
            case RealtimeEventType.PARTICIPANT_LEAVE:
              // Update participant count via presence
              channel.presence.get((err, members) => {
                if (!err && members) {
                  setParticipantCount(members.length);
                }
              });
              break;
          }
        });

        // Enter presence
        await channel.presence.enter();

        // Get initial presence count
        channel.presence.get((err, members) => {
          if (!err && members && mounted) {
            setParticipantCount(members.length);
          }
        });

        // Monitor presence changes
        channel.presence.subscribe((presenceMsg) => {
          if (!mounted) return;
          channel.presence.get((err, members) => {
            if (!err && members) {
              setParticipantCount(members.length);
            }
          });
        });

        client.connection.on("connected", () => {
          if (mounted) setIsConnected(true);
        });

        client.connection.on("disconnected", () => {
          if (mounted) setIsConnected(false);
        });
      } catch (error) {
        console.error("Realtime connection error:", error);
      }
    }

    connect();

    return () => {
      mounted = false;
      if (channelRef.current) {
        channelRef.current.presence.leave();
        channelRef.current.unsubscribe();
      }
      if (ablyRef.current) {
        ablyRef.current.close();
      }
    };
  }, [sessionId, userId]);

  const publish = useCallback(
    async (eventType: string, data: any) => {
      if (channelRef.current) {
        await channelRef.current.publish(eventType, data);
      }
    },
    []
  );

  return {
    isConnected,
    sessionState,
    roundState,
    participantCount,
    publish,
  };
}
