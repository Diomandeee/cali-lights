import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { listUserMemberships } from "@/lib/data/chains";
import { sql } from "@/lib/db/client";

const schema = z.object({
  scope: z.enum(["chain", "network", "user"]).default("network"),
  chainId: z.string().uuid().optional(),
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

    const whereClauses = [];
    
    if (chainIds.length > 0) {
      whereClauses.push(sql`ms.chain_id IN (${sql.join(chainIds.map(id => sql`${id}`), sql`, `)})`);
      whereClauses.push(sql`e.gps_lat IS NOT NULL`);
      whereClauses.push(sql`e.gps_lon IS NOT NULL`);
    } else {
      whereClauses.push(sql`false`); // No chains = no results
    }
    
    if (params.scope === "chain" && params.chainId) {
      whereClauses.push(sql`ms.chain_id = ${params.chainId}`);
    } else if (params.scope === "user") {
      whereClauses.push(sql`e.user_id = ${user.id}`);
    }

    const where = whereClauses.length > 0
      ? sql.join(whereClauses, sql` AND `)
      : sql.raw("false");

    const points = await sql`
      SELECT
        COALESCE(e.gps_city, 'Unknown') as label,
        AVG(e.gps_lat) AS lat,
        AVG(e.gps_lon) AS lon,
        COUNT(*)::int AS count
      FROM entries e
      JOIN missions ms ON ms.id = e.mission_id
      WHERE ${where}
      GROUP BY label
      ORDER BY count DESC
      LIMIT 64
    `;

    return NextResponse.json({ points: points.rows });
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
    console.error("Map data failed", error);
    return NextResponse.json({ error: "Unable to load map data" }, { status: 500 });
  }
}
