import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db/client";
import { logger } from "@/lib/utils/logger";

export async function GET(request: NextRequest) {
  let userId: string | undefined;
  let chainIds: string[] = [];
  
  try {
    const user = await requireUser(request);
    userId = user.id;

    // Get user's chains
    const memberships = await sql<{ chain_id: string }>`
      SELECT chain_id FROM memberships WHERE user_id = ${user.id}
    `;
    chainIds = memberships.rows.map((r) => r.chain_id);

    if (!chainIds.length) {
      return NextResponse.json({
        totalMissions: 0,
        completedMissions: 0,
        activeMissions: 0,
        totalChapters: 0,
        totalEntries: 0,
        streakDays: 0,
        palette: [],
        recentActivity: [],
        chains: [],
      });
    }

    // Mission stats
    const missionStats = await sql<{
      total: number;
      completed: number;
      active: number;
    }>`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE state = 'ARCHIVED')::int AS completed,
        COUNT(*) FILTER (WHERE state IN ('LOBBY', 'CAPTURE', 'FUSING'))::int AS active
      FROM missions
      WHERE chain_id IN (${sql.join(chainIds.map(id => sql`${id}`), sql`, `)})
    `;

    // Chapter count
    const chapterCount = await sql<{ count: number }>`
      SELECT COUNT(*)::int AS count
      FROM chapters
      WHERE mission_id IN (
        SELECT id FROM missions WHERE chain_id IN (${sql.join(chainIds.map(id => sql`${id}`), sql`, `)})
      )
    `;

    // Entry count
    const entryCount = await sql<{ count: number }>`
      SELECT COUNT(*)::int AS count
      FROM entries
      WHERE mission_id IN (
        SELECT id FROM missions WHERE chain_id IN (${sql.join(chainIds.map(id => sql`${id}`), sql`, `)})
      )
    `;

    // Streak calculation
    const streakData = await sql<{
      current: number;
      longest: number;
    }>`
      WITH daily_completions AS (
        SELECT DATE_TRUNC('day', archived_at)::date AS day
        FROM missions
        WHERE chain_id IN (${sql.join(chainIds.map(id => sql`${id}`), sql`, `)})
          AND archived_at IS NOT NULL
        GROUP BY day
        ORDER BY day DESC
      ),
      gaps AS (
        SELECT 
          day,
          LAG(day) OVER (ORDER BY day DESC) - day AS gap
        FROM daily_completions
      ),
      current_streak AS (
        SELECT COUNT(*)::int AS streak
        FROM gaps
        WHERE gap = 1 AND day >= CURRENT_DATE - INTERVAL '30 days'
      ),
      longest_streak AS (
        SELECT MAX(consecutive)::int AS streak
        FROM (
          SELECT 
            day,
            COUNT(*) OVER (PARTITION BY grp) AS consecutive
          FROM (
            SELECT 
              day,
              day - ROW_NUMBER() OVER (ORDER BY day)::int * INTERVAL '1 day' AS grp
            FROM daily_completions
          ) grouped
        ) streaks
      )
      SELECT 
        COALESCE((SELECT streak FROM current_streak), 0) AS current,
        COALESCE((SELECT streak FROM longest_streak), 0) AS longest
    `;

    // Palette distribution
    const paletteData = await sql<{
      color: string;
      count: number;
    }>`
      SELECT color, COUNT(*)::int AS count
      FROM (
        SELECT jsonb_array_elements_text(final_palette) AS color
        FROM chapters
        WHERE mission_id IN (
          SELECT id FROM missions WHERE chain_id IN (${sql.join(chainIds.map(id => sql`${id}`), sql`, `)})
        )
      ) palette
      WHERE color IS NOT NULL
      GROUP BY color
      ORDER BY count DESC
      LIMIT 20
    `;

    // Recent activity
    const activity = await sql<{
      type: string;
      message: string;
      timestamp: string;
      chain_name: string | null;
    }>`
      SELECT 
        'mission' as type,
        'Mission completed: ' || m.prompt as message,
        m.archived_at as timestamp,
        c.name as chain_name
      FROM missions m
      JOIN chains c ON c.id = m.chain_id
      WHERE m.chain_id IN (${sql.join(chainIds.map(id => sql`${id}`), sql`, `)})
        AND m.archived_at IS NOT NULL
      
      UNION ALL
      
      SELECT 
        'chapter' as type,
        'Chapter created: ' || COALESCE(ch.title, 'Untitled') as message,
        ch.generated_at as timestamp,
        c.name as chain_name
      FROM chapters ch
      JOIN missions m ON m.id = ch.mission_id
      JOIN chains c ON c.id = m.chain_id
      WHERE m.chain_id IN (${sql.join(chainIds.map(id => sql`${id}`), sql`, `)})
        AND ch.generated_at IS NOT NULL
      
      ORDER BY timestamp DESC
      LIMIT 10
    `;

    // Chains with stats
    const chainsData = await sql<{
      id: string;
      name: string;
      streak_days: number;
      mission_count: number;
      chapter_count: number;
    }>`
      SELECT 
        c.id,
        c.name,
        COALESCE(c.streak_days, 0)::int AS streak_days,
        COUNT(DISTINCT m.id)::int AS mission_count,
        COUNT(DISTINCT ch.id)::int AS chapter_count
      FROM chains c
      LEFT JOIN missions m ON m.chain_id = c.id
      LEFT JOIN chapters ch ON ch.mission_id = m.id
      WHERE c.id IN (${sql.join(chainIds.map(id => sql`${id}`), sql`, `)})
      GROUP BY c.id, c.name, c.streak_days
      ORDER BY c.name
    `;

    logger.info("Dashboard data fetched", { userId: user.id });

    return NextResponse.json({
      totalMissions: missionStats.rows[0]?.total ?? 0,
      completedMissions: missionStats.rows[0]?.completed ?? 0,
      activeMissions: missionStats.rows[0]?.active ?? 0,
      totalChapters: chapterCount.rows[0]?.count ?? 0,
      totalEntries: entryCount.rows[0]?.count ?? 0,
      streakDays: streakData.rows[0]?.current ?? 0,
      palette: paletteData.rows,
      recentActivity: activity.rows,
      chains: chainsData.rows,
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("AUTH")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    logger.error("Dashboard fetch failed", error instanceof Error ? error : new Error(String(error)), {
      userId: userId,
      chainIdsCount: chainIds.length,
    });
    return NextResponse.json(
      { error: "Unable to load dashboard" },
      { status: 500 }
    );
  }
}

