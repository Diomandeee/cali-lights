import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getNetworkForUser } from "@/lib/data/chains";
import { sql } from "@/lib/db/client";
import { logger } from "@/lib/utils/logger";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const graph = await getNetworkForUser(user.id);

    // Get active missions for chains
    const activeMissions = await sql<{
      id: string;
      chain_id: string;
      prompt: string;
      state: string;
      submissions_received: number;
      submissions_required: number;
    }>`
      SELECT 
        m.id,
        m.chain_id,
        m.prompt,
        m.state,
        m.submissions_received,
        m.submissions_required
      FROM missions m
      JOIN chains c ON c.id = m.chain_id
      JOIN memberships mem ON mem.chain_id = c.id
      WHERE mem.user_id = ${user.id}
        AND m.state IN ('LOBBY', 'CAPTURE', 'FUSING')
      ORDER BY m.starts_at DESC
    `;

    logger.info("Network data fetched", {
      userId: user.id,
      chainsCount: graph.chains.length,
      missionsCount: activeMissions.rows.length,
    });

    return NextResponse.json({
      ...graph,
      missions: activeMissions.rows,
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("AUTH")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    logger.error("Network fetch failed", error);
    return NextResponse.json({ error: "Unable to load network" }, { status: 500 });
  }
}
