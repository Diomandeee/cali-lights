import Link from "next/link";
import { sql } from "@/lib/db/client";
import { requireCurrentUser } from "@/lib/session";
import { ChainCard } from "@/components/missions/ChainCard";

type ChainWithMission = {
  id: string;
  name: string;
  description: string | null;
  palette: any;
  mission_id: string | null;
  mission_prompt: string | null;
  mission_state: string | null;
  mission_submissions_received: number | null;
  mission_submissions_required: number | null;
  chapter_count: number;
};

export default async function MissionsPage() {
  const user = await requireCurrentUser();

  // Get all chains user is a member of, with their active missions
  const chainsResult = await sql<ChainWithMission>`
    SELECT 
      c.id,
      c.name,
      c.description,
      c.palette,
      m.id as mission_id,
      m.prompt as mission_prompt,
      m.state as mission_state,
      m.submissions_received as mission_submissions_received,
      m.submissions_required as mission_submissions_required,
      COUNT(DISTINCT ch.id) as chapter_count
    FROM chains c
    LEFT JOIN memberships mem ON mem.chain_id = c.id
    LEFT JOIN missions m ON m.id = c.active_mission_id
    LEFT JOIN chapters ch ON ch.mission_id IN (
      SELECT id FROM missions WHERE chain_id = c.id
    )
    WHERE mem.user_id = ${user.id}
    GROUP BY c.id, c.name, c.description, c.palette, m.id, m.prompt, m.state, m.submissions_received, m.submissions_required
    ORDER BY c.name
  `;

  const chains = chainsResult.rows;

  // Get all missions across all chains (for browsing)
  const allMissionsResult = await sql<{
    id: string;
    chain_id: string;
    chain_name: string;
    prompt: string;
    state: string;
    submissions_received: number;
    submissions_required: number;
    starts_at: string;
    ends_at: string | null;
    chapter_id: string | null;
    chapter_title: string | null;
  }>`
    SELECT 
      m.id,
      m.chain_id,
      c.name as chain_name,
      m.prompt,
      m.state,
      m.submissions_received,
      m.submissions_required,
      m.starts_at,
      m.ends_at,
      ch.id as chapter_id,
      ch.title as chapter_title
    FROM missions m
    JOIN chains c ON c.id = m.chain_id
    JOIN memberships mem ON mem.chain_id = c.id
    LEFT JOIN chapters ch ON ch.mission_id = m.id
    WHERE mem.user_id = ${user.id}
    ORDER BY m.starts_at DESC
    LIMIT 50
  `;

  const allMissions = allMissionsResult.rows;

  return (
    <div className="space-y-8 sm:space-y-12">
      <div className="space-y-2 sm:space-y-3">
        <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-white/40">
          Missions
        </p>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight">Constellations & Acts</h1>
        <p className="text-sm sm:text-base text-white/60 leading-relaxed">
          Browse your chains and missions. Start new acts or revisit completed chapters.
        </p>
      </div>

      {/* Constellations (Chains) Grid */}
      <section>
        <h2 className="mb-4 sm:mb-6 text-lg sm:text-xl font-semibold">Constellations</h2>
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {chains.map((chain) => (
            <ChainCard key={chain.id} chain={chain} />
          ))}
        </div>
      </section>

      {/* All Missions Timeline */}
      <section>
        <h2 className="mb-4 sm:mb-6 text-lg sm:text-xl font-semibold">All Missions</h2>
        <div className="space-y-3 sm:space-y-4">
          {allMissions.map((mission) => {
            const stateColors: Record<string, string> = {
              LOBBY: "border-blue-500/50 bg-blue-500/10",
              CAPTURE: "border-yellow-500/50 bg-yellow-500/10",
              FUSING: "border-purple-500/50 bg-purple-500/10",
              RECAP: "border-green-500/50 bg-green-500/10",
              ARCHIVED: "border-white/10 bg-white/5",
            };

            return (
              <Link
                key={mission.id}
                href={`/mission/${mission.id}`}
                className="group block rounded-xl sm:rounded-2xl border p-4 sm:p-6 transition-all active:scale-[0.98] touch-manipulation"
                style={{
                  borderColor: stateColors[mission.state]?.split(" ")[0] || "rgba(255,255,255,0.1)",
                  backgroundColor: stateColors[mission.state]?.split(" ")[1] || "rgba(255,255,255,0.05)",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] sm:text-xs font-medium text-white/60 truncate">
                        {mission.chain_name}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] sm:text-xs font-medium whitespace-nowrap ${
                        mission.state === "LOBBY" ? "bg-blue-500/20 text-blue-300" :
                        mission.state === "CAPTURE" ? "bg-yellow-500/20 text-yellow-300" :
                        mission.state === "FUSING" ? "bg-purple-500/20 text-purple-300" :
                        mission.state === "RECAP" ? "bg-green-500/20 text-green-300" :
                        "bg-white/10 text-white/60"
                      }`}>
                        {mission.state}
                      </span>
                    </div>
                    <p className="text-base sm:text-lg font-medium leading-tight">{mission.prompt}</p>
                    {mission.chapter_title && (
                      <p className="text-xs sm:text-sm text-white/60 truncate">
                        Chapter: {mission.chapter_title}
                      </p>
                    )}
                    <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-white/50 flex-wrap">
                      <span>
                        {mission.submissions_received}/{mission.submissions_required} submissions
                      </span>
                      <span>
                        {new Date(mission.starts_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-white/40 group-active:text-white/60 flex-shrink-0 mt-1">
                    →
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

