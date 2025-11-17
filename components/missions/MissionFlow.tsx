"use client";

import { useMemo } from "react";
import { MissionLobby } from "@/components/missions/MissionLobby";
import { MissionCapture } from "@/components/missions/MissionCapture";
import { MissionFusing } from "@/components/missions/MissionFusing";
import { MissionRecap } from "@/components/missions/MissionRecap";
import { useMissionRealtime, MissionPresence } from "@/lib/hooks/useMissionRealtime";

type MissionFlowProps = {
  mission: {
    id: string;
    prompt: string;
    state: string;
    submissions_required: number;
    submissions_received: number;
    window_seconds: number;
    starts_at: string;
    ends_at: string | null;
  };
  chainName: string;
  chapter: {
    id: string;
    video_url: string | null;
    collage_url: string | null;
    final_palette: string[] | null;
    poem: string | null;
    is_shareable: boolean;
    share_url: string | null;
  } | null;
  members: Array<{
    userId: string;
    name: string | null;
    avatarUrl: string | null;
    entrySubmitted: boolean;
  }>;
  currentUser: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
};

export function MissionFlow({
  mission,
  chainName,
  chapter,
  members,
  currentUser,
}: MissionFlowProps) {
  const realtime = useMissionRealtime({
    missionId: mission.id,
    userId: currentUser.id,
    userName: currentUser.name,
    userAvatarUrl: currentUser.avatarUrl,
    initialState: mission.state,
    initialPresence: members,
    initialSubmissions: {
      received: mission.submissions_received,
      required: mission.submissions_required,
    },
  });

  const countdownLabel = useMemo(() => {
    if (!mission.ends_at) return null;
    const end = new Date(mission.ends_at).getTime();
    const diff = end - Date.now();
    if (diff <= 0) return "soon";
    const minutes = Math.ceil(diff / 60000);
    return `in ~${minutes}m`;
  }, [mission.ends_at]);

  const currentChapter =
    realtime.chapterReady && chapter
      ? chapter
      : chapter;

  if (realtime.state === "LOBBY") {
    return (
      <MissionLobby
        prompt={mission.prompt}
        presence={realtime.presence}
        countdownLabel={countdownLabel ?? undefined}
        realtimeAvailable={realtime.realtimeAvailable}
      />
    );
  }

  if (realtime.state === "CAPTURE") {
    return (
      <MissionCapture
        missionId={mission.id}
        prompt={mission.prompt}
        submissions={realtime.submissions}
        presence={realtime.presence}
      />
    );
  }

  if (realtime.state === "FUSING") {
    return <MissionFusing />;
  }

  if (realtime.state === "RECAP" && currentChapter) {
    return (
      <MissionRecap
        missionId={mission.id}
        chapter={{
          id: currentChapter.id,
          videoUrl: currentChapter.video_url,
          collageUrl: currentChapter.collage_url,
          finalPalette: currentChapter.final_palette ?? [],
          poem: currentChapter.poem,
          isShareable: currentChapter.is_shareable,
          shareUrl: currentChapter.share_url,
        }}
      />
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <p className="text-sm text-white/60">Mission state: {realtime.state}</p>
    </div>
  );
}
