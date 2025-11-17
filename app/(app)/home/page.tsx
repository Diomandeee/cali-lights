import { ConstellationHome } from "@/components/home/ConstellationHome";
import { requireCurrentUser } from "@/lib/session";
import { getNetworkForUser } from "@/lib/data/chains";
import { sql } from "@/lib/db/client";

export default async function HomePage() {
  const user = await requireCurrentUser();

  // Get network data directly (same as /api/home)
  const networkData = await getNetworkForUser(user.id);

  // Get active missions for user's chains
  const activeMissions = await sql<{
    id: string;
    chain_id: string;
    chain_name: string;
    prompt: string;
    state: string;
    submissions_received: number;
    submissions_required: number;
    ends_at: string | null;
  }>`
    SELECT 
      m.id,
      m.chain_id,
      c.name as chain_name,
      m.prompt,
      m.state,
      m.submissions_received,
      m.submissions_required,
      m.ends_at
    FROM missions m
    JOIN chains c ON c.id = m.chain_id
    JOIN memberships mem ON mem.chain_id = c.id
    WHERE mem.user_id = ${user.id}
      AND m.state IN ('LOBBY', 'CAPTURE', 'FUSING')
    ORDER BY m.starts_at DESC
    LIMIT 10
  `;

  // Get daily updates (missions started today, recaps ready)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const updates = await sql<{
    type: string;
    message: string;
    chain_name: string | null;
    mission_id: string | null;
    created_at: string;
  }>`
    SELECT 
      'mission_start' as type,
      'New mission started: ' || m.prompt as message,
      c.name as chain_name,
      m.id as mission_id,
      m.created_at
    FROM missions m
    JOIN chains c ON c.id = m.chain_id
    JOIN memberships mem ON mem.chain_id = c.id
    WHERE mem.user_id = ${user.id}
      AND m.created_at >= ${today.toISOString()}
    
    UNION ALL
    
    SELECT 
      'recap_ready' as type,
      'Chapter ready: ' || COALESCE(ch.title, 'Untitled') as message,
      c.name as chain_name,
      ch.mission_id,
      ch.generated_at as created_at
    FROM chapters ch
    JOIN missions m ON m.id = ch.mission_id
    JOIN chains c ON c.id = m.chain_id
    JOIN memberships mem ON mem.chain_id = c.id
    WHERE mem.user_id = ${user.id}
      AND ch.generated_at >= ${today.toISOString()}
    
    ORDER BY created_at DESC
    LIMIT 5
  `;

  const dailyUpdates = updates.rows.map((row) => ({
    type: row.type as "mission_start" | "recap_ready",
    message: row.message,
    chain_name: row.chain_name ?? undefined,
    mission_id: row.mission_id ?? undefined,
    timestamp: row.created_at,
  }));

  return (
    <ConstellationHome
      networkData={{
        chains: networkData.chains,
        connections: networkData.connections,
        missions: activeMissions.rows.map(m => ({
          id: m.id,
          chain_id: m.chain_id,
          prompt: m.prompt,
          state: m.state,
          submissions_received: m.submissions_received,
          submissions_required: m.submissions_required,
        })),
      }}
      activeMissions={activeMissions.rows}
      dailyUpdates={dailyUpdates}
    />
  );
}

