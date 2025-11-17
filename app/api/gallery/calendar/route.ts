import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { listUserMemberships } from "@/lib/data/chains";
import { sql } from "@/lib/db/client";

const schema = z.object({
  scope: z.enum(["chain", "network", "user"]).default("network"),
  chainId: z.string().uuid().optional(),
  year: z.coerce.number().min(2000).max(2100).default(new Date().getUTCFullYear()),
  month: z.coerce.number().min(1).max(12).default(new Date().getUTCMonth() + 1),
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

    const whereClauses = chainIds.length > 0 
      ? [sql`ms.chain_id IN (${sql.join(chainIds.map(id => sql`${id}`), sql`, `)})`]
      : [sql`false`]; // No chains = no results
    if (params.scope === "chain" && params.chainId) {
      whereClauses.push(sql`ms.chain_id = ${params.chainId}`);
    } else if (params.scope === "user") {
      whereClauses.push(sql`ms.id IN (SELECT mission_id FROM entries WHERE user_id = ${user.id})`);
    }
    whereClauses.push(sql`ms.starts_at >= ${startDate.toISOString()}::timestamptz`);
    whereClauses.push(sql`ms.starts_at < ${endDate.toISOString()}::timestamptz`);

    const where = sql.join(whereClauses, sql` AND `);

    const rows = await sql`
      SELECT
        DATE_TRUNC('day', ms.starts_at)::date AS day,
        COUNT(*) FILTER (WHERE ms.state = 'ARCHIVED')::int AS completed,
        COUNT(*)::int AS total
      FROM missions ms
      WHERE ${where}
      GROUP BY day
      ORDER BY day ASC
    `;

    return NextResponse.json({ days: rows.rows });
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
    return NextResponse.json({ error: "Unable to load calendar" }, { status: 500 });
  }
}
