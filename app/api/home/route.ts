import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getNetworkForUser } from "@/lib/data/chains";
import { sql } from "@/lib/db/client";
import { logger } from "@/lib/utils/logger";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Try to get user from Authorization header (for apiFetch) or from cookies (for direct requests)
    let user;
    try {
      user = await requireUser(request);
    } catch (authError) {
      // If Authorization header fails, try getting user from session cookie
      const { getCurrentUser } = await import("@/lib/session");
      const sessionUser = await getCurrentUser();
      if (!sessionUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      user = sessionUser;
    }

    // Get network data
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

    // Get daily updates (missions started today, recaps ready, bridge events)
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

    logger.info("Home data fetched", {
      userId: user.id,
      chainsCount: networkData.chains.length,
      activeMissionsCount: activeMissions.rows.length,
      updatesCount: dailyUpdates.length,
    });

    return NextResponse.json({
      chains: networkData.chains,
      connections: networkData.connections,
      bridgeEvents: networkData.bridgeEvents,
      activeMissions: activeMissions.rows,
      dailyUpdates,
      missions: activeMissions.rows.map(m => ({
        id: m.id,
        chain_id: m.chain_id,
        prompt: m.prompt,
        state: m.state,
        submissions_received: m.submissions_received,
        submissions_required: m.submissions_required,
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("AUTH")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    logger.error("Failed to fetch home data", error);
    return NextResponse.json(
      { 
        error: "Unable to fetch home data",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

