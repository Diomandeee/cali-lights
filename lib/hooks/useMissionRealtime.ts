"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Ably from "ably";
import { MissionRealtimeEvent } from "@/lib/realtime";

export type MissionPresence = {
  userId: string;
  name?: string | null;
  avatarUrl?: string | null;
  entrySubmitted?: boolean;
};

type MissionRealtimeOptions = {
  missionId: string;
  userId: string;
  userName?: string | null;
  userAvatarUrl?: string | null;
  initialState: string;
  initialPresence: MissionPresence[];
  initialSubmissions: {
    received: number;
    required: number;
  };
};

type MissionRealtimeState = {
  state: string;
  submissions: {
    received: number;
    required: number;
  };
  presence: MissionPresence[];
  chapterReady: string | null;
  realtimeAvailable: boolean;
};

export function useMissionRealtime({
  missionId,
  userId,
  userName,
  userAvatarUrl,
  initialState,
  initialPresence,
  initialSubmissions,
}: MissionRealtimeOptions): MissionRealtimeState {
  const [state, setState] = useState(initialState);
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [presence, setPresence] = useState<MissionPresence[]>(initialPresence);
  const [chapterReady, setChapterReady] = useState<string | null>(null);
  const [realtimeAvailable, setRealtimeAvailable] = useState(true);

  const ablyRef = useRef<Ably.Realtime | null>(null);
  const channelRef = useRef<ReturnType<Ably.Realtime["channels"]["get"]> | null>(
    null
  );

  const presenceMap = useMemo(() => {
    const map = new Map<string, MissionPresence>();
    for (const person of presence) {
      map.set(person.userId, person);
    }
    return map;
  }, [presence]);

  useEffect(() => {
    let mounted = true;

    async function connect() {
      try {
        if (!process.env.NEXT_PUBLIC_ABLY_CLIENT_ID) {
          setRealtimeAvailable(false);
          return;
        }

        const response = await fetch("/api/realtime/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
        if (!response.ok) {
          setRealtimeAvailable(false);
          return;
        }
        const { token } = await response.json();

        const client = new Ably.Realtime({
          authCallback: (_, callback) => {
            callback(null, token);
          },
          clientId: userId,
        });
        ablyRef.current = client;

        const channel = client.channels.get(`mission:${missionId}`);
        channelRef.current = channel;

        channel.subscribe((message) => {
          if (!mounted) return;
          switch (message.name) {
            case MissionRealtimeEvent.STATE:
              setState(message.data.state);
              break;
            case MissionRealtimeEvent.PROGRESS:
              setSubmissions({
                received: message.data.submissionsReceived,
                required: message.data.submissionsRequired,
              });
              if (message.data.entryUserId) {
                setPresence((prev) =>
                  prev.map((p) =>
                    p.userId === message.data.entryUserId
                      ? { ...p, entrySubmitted: true }
                      : p
                  )
                );
              }
              break;
            case MissionRealtimeEvent.CHAPTER_READY:
              setChapterReady(message.data.chapterId);
              break;
          }
        });

        await channel.presence.enter({
          userId,
          name: userName,
          avatarUrl: userAvatarUrl,
        });

        const syncPresence = async () => {
          try {
            const members = await channel.presence.get();
            if (!mounted || !members) return;
            setPresence((prev) => {
              const map = new Map(
                prev.map((p) => [p.userId, { ...p } as MissionPresence])
              );
              for (const member of members) {
                const person = map.get(member.clientId) ?? { userId: member.clientId };
                map.set(member.clientId, {
                  ...person,
                  name: member.data?.name ?? person.name,
                  avatarUrl: member.data?.avatarUrl ?? person.avatarUrl,
                });
              }
              return Array.from(map.values());
            });
          } catch (err) {
            console.warn("Presence sync failed", err);
          }
        };

        await syncPresence();
        channel.presence.subscribe(() => syncPresence());
      } catch (error) {
        console.warn("Mission realtime disabled:", error);
        if (mounted) {
          setRealtimeAvailable(false);
        }
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
  }, [missionId, userId, userName, userAvatarUrl]);

  return {
    state,
    submissions,
    presence,
    chapterReady,
    realtimeAvailable,
  };
}
