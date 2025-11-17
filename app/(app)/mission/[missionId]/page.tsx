import { notFound } from "next/navigation";
import { sql } from "@/lib/db/client";
import { requireCurrentUser } from "@/lib/session";
import { getMembership } from "@/lib/data/chains";
import { MissionFlow } from "@/components/missions/MissionFlow";

type MissionRecord = {
  id: string;
  chain_id: string;
  prompt: string;
  state: string;
  submissions_required: number;
  submissions_received: number;
  window_seconds: number;
  starts_at: string;
  ends_at: string | null;
};

export default async function MissionPage({
  params,
}: {
  params: { missionId: string };
}) {
  const user = await requireCurrentUser();
  const missionResult = await sql<MissionRecord>`
    SELECT * FROM missions WHERE id = ${params.missionId} LIMIT 1
  `;
  const mission = missionResult.rows[0];
  if (!mission) {
    notFound();
  }

  const membership = await getMembership(user.id, mission.chain_id);
  if (!membership) {
    notFound();
  }

  const chain = (
    await sql`
      SELECT name FROM chains WHERE id = ${mission.chain_id} LIMIT 1
    `
  ).rows[0];

  const entryRows = (
    await sql`
      SELECT e.id, e.user_id
      FROM entries e
      WHERE mission_id = ${mission.id}
    `
  ).rows;

  const chapterResult = await sql<{
    id: string;
    video_url: string | null;
    collage_url: string | null;
    final_palette: string[] | null;
    poem: string | null;
    is_shareable: boolean;
    share_url: string | null;
  }>`
    SELECT id, video_url, collage_url, final_palette, poem, is_shareable, share_url
    FROM chapters
    WHERE mission_id = ${mission.id}
    LIMIT 1
  `;
  const chapter = chapterResult.rows[0] ?? null;

  const memberRows = (
    await sql`
      SELECT m.user_id, u.name, u.avatar_url
      FROM memberships m
      JOIN users u ON u.id = m.user_id
      WHERE m.chain_id = ${mission.chain_id}
    `
  ).rows;

  const members = memberRows.map((row) => ({
    userId: row.user_id,
    name: row.name,
    avatarUrl: row.avatar_url,
    entrySubmitted: entryRows.some((entry) => entry.user_id === row.user_id),
  }));

  return (
    <div className="space-y-8">
      {/* Breadcrumb navigation */}
      <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-white/50 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        <a href="/missions" className="hover:text-white transition touch-manipulation whitespace-nowrap">
          Missions
        </a>
        <span>/</span>
        <a href={`/chain/${mission.chain_id}`} className="hover:text-white transition touch-manipulation truncate">
          {chain?.name}
        </a>
        <span>/</span>
        <span className="text-white/70 whitespace-nowrap">Mission</span>
      </div>

      {/* Header */}
      <div className="space-y-2 sm:space-y-3">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <span className={`rounded-full px-2.5 py-1 sm:px-3 text-[10px] sm:text-xs font-medium whitespace-nowrap ${
            mission.state === "LOBBY" ? "bg-blue-500/20 text-blue-300" :
            mission.state === "CAPTURE" ? "bg-yellow-500/20 text-yellow-300" :
            mission.state === "FUSING" ? "bg-purple-500/20 text-purple-300" :
            mission.state === "RECAP" ? "bg-green-500/20 text-green-300" :
            "bg-white/10 text-white/60"
          }`}>
            {mission.state}
          </span>
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white/40 truncate">
            {chain?.name}
          </p>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight leading-tight">{mission.prompt}</h1>
        <p className="text-sm sm:text-base md:text-lg text-white/70">
          {mission.submissions_received}/{mission.submissions_required} submissions
        </p>
      </div>

      {/* Mission Flow */}
      <MissionFlow
        mission={mission}
        chainName={chain?.name ?? ""}
        chapter={chapter}
        members={members}
        currentUser={{
          id: user.id,
          name: user.name ?? user.email,
          avatarUrl: user.avatar_url,
        }}
      />
    </div>
  );
}
