import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { listUserMemberships } from "@/lib/data/chains";
import { sql } from "@/lib/db/client";

export const dynamic = 'force-dynamic';

const schema = z.object({
  scope: z.enum(["chain", "network", "user"]).default("network"),
  chainId: z.string().uuid().optional(),
  year: z.coerce.number().min(2000).max(2100).default(new Date().getUTCFullYear()),
  month: z.coerce.number().min(1).max(12).default(new Date().getUTCMonth() + 1),
  includeScheduled: z.coerce.boolean().default(true),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const params = schema.parse(
      Object.fromEntries(new URL(request.url).searchParams.entries())
    );

    const memberships = await listUserMemberships(user.id);
    const chainIds = memberships.map((m) => m.chain_id);

    if (params.scope === "chain" && params.chainId) {
      if (!chainIds.includes(params.chainId)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const startDate = new Date(Date.UTC(params.year, params.month - 1, 1));
    const endDate = new Date(Date.UTC(params.year, params.month, 1));

    // Handle empty chainIds case
    if (chainIds.length === 0) {
      return NextResponse.json({ days: [] });
    }

    const whereClauses = [
      sql`ms.chain_id IN (${sql.join(chainIds.map(id => sql`${id}`), sql`, `)})`,
    ];
    
    if (params.scope === "chain" && params.chainId) {
      whereClauses.push(sql`ms.chain_id = ${params.chainId}`);
    } else if (params.scope === "user") {
      whereClauses.push(sql`ms.id IN (SELECT mission_id FROM entries WHERE user_id = ${user.id})`);
    }
    
    whereClauses.push(sql`ms.starts_at >= CAST(${startDate.toISOString()} AS timestamptz)`);
    whereClauses.push(sql`ms.starts_at < CAST(${endDate.toISOString()} AS timestamptz)`);

    const where = sql.join(whereClauses, sql` AND `);

    // Get missions with detailed timing information
    const missions = await sql<{
      id: string;
      day: string | Date;
      starts_at: string;
      ends_at: string | null;
      locked_at: string | null;
      recap_ready_at: string | null;
      archived_at: string | null;
      state: string;
      prompt: string;
      chain_name: string;
      submissions_received: number;
      submissions_required: number;
    }>`
      SELECT
        ms.id,
        DATE_TRUNC('day', ms.starts_at)::date AS day,
        ms.starts_at,
        ms.ends_at,
        ms.locked_at,
        ms.recap_ready_at,
        ms.archived_at,
        ms.state,
        ms.prompt,
        c.name AS chain_name,
        ms.submissions_received,
        ms.submissions_required
      FROM missions ms
      JOIN chains c ON c.id = ms.chain_id
      WHERE ${where}
      ORDER BY ms.starts_at ASC
    `;

    // Group by day and calculate stats
    const dayMap = new Map<string, {
      completed: number;
      total: number;
      starting: number;
      ending: number;
      scheduled: number;
      missions: Array<{
        id: string;
        prompt: string;
        chain_name: string;
        state: string;
        starts_at: string;
        ends_at: string | null;
        submissions_received: number;
        submissions_required: number;
      }>;
    }>();

    missions.rows.forEach((mission) => {
      // Ensure day is in YYYY-MM-DD format
      const day = typeof mission.day === 'string' 
        ? mission.day.slice(0, 10) 
        : new Date(mission.day).toISOString().slice(0, 10);
      
      if (!dayMap.has(day)) {
        dayMap.set(day, {
          completed: 0,
          total: 0,
          starting: 0,
          ending: 0,
          scheduled: 0,
          missions: [],
        });
      }

      const dayData = dayMap.get(day)!;
      dayData.total++;
      
      if (mission.state === "ARCHIVED") {
        dayData.completed++;
      }
      
      // Check if mission starts on this day
      const startDate = new Date(mission.starts_at);
      const startDay = startDate.toISOString().slice(0, 10);
      if (startDay === day) {
        dayData.starting++;
      }
      
      // Check if mission ends on this day
      if (mission.ends_at) {
        const endDate = new Date(mission.ends_at);
        const endDay = endDate.toISOString().slice(0, 10);
        if (endDay === day) {
          dayData.ending++;
        }
      }

      dayData.missions.push({
        id: mission.id,
        prompt: mission.prompt,
        chain_name: mission.chain_name,
        state: mission.state,
        starts_at: mission.starts_at,
        ends_at: mission.ends_at,
        submissions_received: mission.submissions_received,
        submissions_required: mission.submissions_required,
      });
    });

    const days = Array.from(dayMap.entries()).map(([day, data]) => ({
      day,
      ...data,
    }));

    return NextResponse.json({ days });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query", details: error.flatten() },
        { status: 422 }
      );
    }
    if (error instanceof Error && error.message.startsWith("AUTH")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Calendar data failed", error);
    return NextResponse.json(
      { 
        error: "Unable to load calendar",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

