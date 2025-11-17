import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db/client";
import { logger } from "@/lib/utils/logger";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const allowedEmail = process.env.ADMIN_EMAIL;
    if (!allowedEmail || user.email !== allowedEmail) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all missions with full details
    const missions = await sql<{
      id: string;
      chain_id: string;
      chain_name: string;
      prompt: string;
      state: string;
      window_seconds: number;
      submissions_required: number;
      submissions_received: number;
      starts_at: string;
      ends_at: string | null;
      locked_at: string | null;
      recap_ready_at: string | null;
      archived_at: string | null;
      created_by: string | null;
      created_at: string;
      member_count: number;
      entry_count: number;
      chapter_id: string | null;
      chapter_title: string | null;
    }>`
      SELECT 
        m.id,
        m.chain_id,
        c.name as chain_name,
        m.prompt,
        m.state,
        m.window_seconds,
        m.submissions_required,
        m.submissions_received,
        m.starts_at,
        m.ends_at,
        m.locked_at,
        m.recap_ready_at,
        m.archived_at,
        m.created_by,
        m.created_at,
        COUNT(DISTINCT mem.user_id)::int as member_count,
        COUNT(DISTINCT e.id)::int as entry_count,
        ch.id as chapter_id,
        ch.title as chapter_title
      FROM missions m
      JOIN chains c ON c.id = m.chain_id
      LEFT JOIN memberships mem ON mem.chain_id = m.chain_id
      LEFT JOIN entries e ON e.mission_id = m.id
      LEFT JOIN chapters ch ON ch.mission_id = m.id
      GROUP BY m.id, c.name, m.prompt, m.state, m.window_seconds, 
               m.submissions_required, m.submissions_received, m.starts_at, 
               m.ends_at, m.locked_at, m.recap_ready_at, m.archived_at, 
               m.created_by, m.created_at, ch.id, ch.title
      ORDER BY m.created_at DESC
    `;

    // Get detailed info for each mission
    const missionsWithDetails = await Promise.all(
      missions.rows.map(async (mission) => {
        // Get all members for this chain
        const members = await sql<{
          user_id: string;
          name: string | null;
          email: string;
          role: string;
        }>`
          SELECT u.id as user_id, u.name, u.email, m.role
          FROM memberships m
          JOIN users u ON u.id = m.user_id
          WHERE m.chain_id = ${mission.chain_id}
        `;

        // Get all entries with user info
        const entries = await sql<{
          id: string;
          user_id: string;
          user_name: string | null;
          user_email: string;
          media_url: string;
          media_type: string;
          captured_at: string;
          dominant_hue: number | null;
          metadata_status: string;
        }>`
          SELECT 
            e.id,
            e.user_id,
            u.name as user_name,
            u.email as user_email,
            e.media_url,
            e.media_type,
            e.captured_at,
            e.dominant_hue,
            e.metadata_status
          FROM entries e
          JOIN users u ON u.id = e.user_id
          WHERE e.mission_id = ${mission.id}
          ORDER BY e.captured_at ASC
        `;

        // Calculate lifecycle timings
        const startsAt = new Date(mission.starts_at);
        const endsAt = mission.ends_at ? new Date(mission.ends_at) : null;
        const lockedAt = mission.locked_at ? new Date(mission.locked_at) : null;
        const recapReadyAt = mission.recap_ready_at ? new Date(mission.recap_ready_at) : null;
        const archivedAt = mission.archived_at ? new Date(mission.archived_at) : null;

        const now = new Date();
        const lobbyDuration = lockedAt ? lockedAt.getTime() - startsAt.getTime() : null;
        const captureDuration = recapReadyAt && lockedAt ? recapReadyAt.getTime() - lockedAt.getTime() : null;
        const totalDuration = archivedAt ? archivedAt.getTime() - startsAt.getTime() : null;

        return {
          ...mission,
          members: members.rows,
          entries: entries.rows,
          lifecycle: {
            lobbyDuration: lobbyDuration ? Math.round(lobbyDuration / 1000) : null, // seconds
            captureDuration: captureDuration ? Math.round(captureDuration / 1000) : null,
            totalDuration: totalDuration ? Math.round(totalDuration / 1000) : null,
            currentState: mission.state,
            timeInCurrentState: (() => {
              const stateStart = lockedAt && mission.state === 'FUSING' ? lockedAt :
                                recapReadyAt && mission.state === 'RECAP' ? recapReadyAt :
                                archivedAt && mission.state === 'ARCHIVED' ? archivedAt :
                                startsAt;
              return Math.round((now.getTime() - stateStart.getTime()) / 1000);
            })(),
          },
        };
      })
    );

    logger.info("Admin missions view fetched", { count: missionsWithDetails.length });

    return NextResponse.json({ missions: missionsWithDetails });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("AUTH")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    logger.error("Admin missions fetch failed", error);
    return NextResponse.json(
      { error: "Unable to load missions" },
      { status: 500 }
    );
  }
}

