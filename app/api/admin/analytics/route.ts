import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db/client";
import { getMembership, listUserMemberships } from "@/lib/data/chains";
import { logger } from "@/lib/utils/logger";

const querySchema = z.object({
  chainId: z.string().uuid().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const query = querySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams.entries())
    );

    const memberships = await listUserMemberships(user.id);
    const adminChains = memberships
      .filter((membership) => membership.role === "admin")
      .map((membership) => membership.chain_id);

    if (!adminChains.length) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    let chainsFilter = adminChains;

    if (query.chainId) {
      const membership = await getMembership(user.id, query.chainId);
      if (!membership || membership.role !== "admin") {
        return NextResponse.json(
          { error: "Forbidden" },
          { status: 403 }
        );
      }
      chainsFilter = [query.chainId];
    }

    const missionStats = chainsFilter.length > 0 ? (
      await sql<{
        total: number;
        completed: number;
        avg_duration: number | null;
      }>`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE state = 'ARCHIVED')::int AS completed,
          AVG(EXTRACT(EPOCH FROM (COALESCE(archived_at, NOW()) - starts_at))) AS avg_duration
        FROM missions
        WHERE chain_id IN (${sql.join(chainsFilter.map(id => sql`${id}`), sql`, `)})
      `
    ).rows[0] : { total: 0, completed: 0, avg_duration: null };

    const operations = chainsFilter.length > 0 ? (
      await sql<{
        total_cost: string | null;
        failed: number;
        succeeded: number;
        pending: number;
      }>`
        SELECT
          COALESCE(SUM(cost_usd), 0) AS total_cost,
          COUNT(*) FILTER (WHERE status = 'FAILED')::int AS failed,
          COUNT(*) FILTER (WHERE status = 'SUCCEEDED')::int AS succeeded,
          COUNT(*) FILTER (WHERE status = 'PENDING')::int AS pending
        FROM video_operations
        WHERE target_id IN (
          SELECT id FROM chapters WHERE mission_id IN (
            SELECT id FROM missions WHERE chain_id IN (${sql.join(chainsFilter.map(id => sql`${id}`), sql`, `)})
          )
        )
      `
    ).rows[0] : { total_cost: "0", failed: 0, succeeded: 0, pending: 0 };

    const paletteRows = chainsFilter.length > 0 ? await sql<{
      color: string;
      count: number;
    }>`
      SELECT color AS color, COUNT(*)::int AS count
      FROM (
        SELECT jsonb_array_elements_text(final_palette) AS color
        FROM chapters
        WHERE mission_id IN (
          SELECT id FROM missions WHERE chain_id IN (${sql.join(chainsFilter.map(id => sql`${id}`), sql`, `)})
        )
      ) palette
      WHERE color IS NOT NULL
      GROUP BY color
      ORDER BY count DESC
      LIMIT 12
    ` : { rows: [] };

    const streakRows = chainsFilter.length > 0 ? await sql<{
      day: string;
      completed: number;
    }>`
      SELECT
        DATE_TRUNC('day', archived_at)::date AS day,
        COUNT(*)::int AS completed
      FROM missions
      WHERE chain_id IN (${sql.join(chainsFilter.map(id => sql`${id}`), sql`, `)})
        AND archived_at IS NOT NULL
        AND archived_at >= NOW() - INTERVAL '14 days'
      GROUP BY day
      ORDER BY day ASC
    ` : { rows: [] };

    // Calculate current streak
    const currentStreak = chainsFilter.length > 0 ? await sql<{
      streak: number;
    }>`
      WITH daily_completions AS (
        SELECT DATE_TRUNC('day', archived_at)::date AS day
        FROM missions
        WHERE chain_id IN (${sql.join(chainsFilter.map(id => sql`${id}`), sql`, `)})
          AND archived_at IS NOT NULL
          AND archived_at >= NOW() - INTERVAL '30 days'
        GROUP BY day
        ORDER BY day DESC
      ),
      streak_calc AS (
        SELECT 
          day,
          ROW_NUMBER() OVER (ORDER BY day DESC) - 1 AS gap
        FROM daily_completions
        WHERE day >= CURRENT_DATE - INTERVAL '30 days'
      )
      SELECT COUNT(*)::int AS streak
      FROM streak_calc
      WHERE gap = EXTRACT(DAY FROM (CURRENT_DATE - day))
    ` : { rows: [{ streak: 0 }] };

    return NextResponse.json({
      missions: {
        total: missionStats?.total ?? 0,
        completed: missionStats?.completed ?? 0,
        completionRate:
          missionStats?.total
            ? Math.round(
                ((missionStats.completed ?? 0) / missionStats.total) * 100
              )
            : 0,
        avgMinutes: missionStats?.avg_duration
          ? Math.round((Number(missionStats.avg_duration) / 60) * 10) / 10
          : null,
      },
      videoOperations: {
        totalCost: operations?.total_cost ? Number(operations.total_cost) : 0,
        failed: operations?.failed ?? 0,
        succeeded: operations?.succeeded ?? 0,
        pending: operations?.pending ?? 0,
        successRate: operations?.succeeded && (operations.succeeded + operations.failed) > 0
          ? Math.round((operations.succeeded / (operations.succeeded + operations.failed)) * 100)
          : 0,
      },
      palette: paletteRows.rows,
      streak: streakRows.rows,
      currentStreak: currentStreak.rows[0]?.streak ?? 0,
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("AUTH")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query", details: error.flatten() },
        { status: 422 }
      );
    }
    logger.error("Analytics fetch failed", error);
    return NextResponse.json(
      { error: "Unable to load analytics" },
      { status: 500 }
    );
  }
}
