import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db/client";
import { listUserMemberships } from "@/lib/data/chains";

const schema = z.object({
  scope: z.enum(["chain", "network"]).default("chain"),
  chainId: z.string().uuid().optional(),
  shareable: z.coerce.boolean().optional(),
  fromDate: z.string().date().optional(),
  toDate: z.string().date().optional(),
  sort: z.enum(["newest", "oldest", "streak", "warm_to_cool"]).default("newest"),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(50).default(20),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const params = Object.fromEntries(new URL(request.url).searchParams.entries());
    const query = schema.parse(params);

    const memberships = await listUserMemberships(user.id);
    const chainIds = memberships.map((m) => m.chain_id);

    if (query.scope === "chain" && query.chainId) {
      if (!chainIds.includes(query.chainId)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const filters = [];

    if (chainIds.length > 0) {
      filters.push(sql`ms.chain_id IN (${sql.join(chainIds.map(id => sql`${id}`), sql`, `)})`);
    } else {
      filters.push(sql`false`); // No chains = no results
    }

    if (query.scope === "chain" && query.chainId) {
      filters.push(sql`ms.chain_id = ${query.chainId}`);
    }

    if (query.shareable !== undefined) {
      filters.push(sql`c.is_shareable = ${query.shareable}`);
    }

    if (query.fromDate) {
      filters.push(sql`c.created_at >= ${query.fromDate}`);
    }
    if (query.toDate) {
      filters.push(sql`c.created_at <= ${query.toDate}`);
    }

    const offset = (query.page - 1) * query.pageSize;

    // Build ORDER BY clause
    let orderBy = "ORDER BY c.created_at DESC";
    if (query.sort === "oldest") {
      orderBy = "ORDER BY c.created_at ASC";
    } else if (query.sort === "warm_to_cool") {
      orderBy = "ORDER BY (c.final_palette->>0) ASC NULLS LAST";
    }

    // Build WHERE fragment
    const whereFragment = filters.length > 0
      ? sql.join(filters, sql` AND `)
      : sql.raw("1=0");

    // Use a single query with ORDER BY as raw SQL string concatenation
    const chaptersResult = await sql`
      SELECT c.*, ms.chain_id
      FROM chapters c
      JOIN missions ms ON ms.id = c.mission_id
      WHERE ${whereFragment}
    `;

    // Manually sort and paginate in JavaScript (simpler than SQL type issues)
    const sortedRows = chaptersResult.rows.sort((a, b) => {
      if (query.sort === "oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (query.sort === "warm_to_cool") {
        const aPalette = Array.isArray(a.final_palette) ? a.final_palette[0] : null;
        const bPalette = Array.isArray(b.final_palette) ? b.final_palette[0] : null;
        return (aPalette || "").localeCompare(bPalette || "");
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const paginatedRows = sortedRows.slice(offset, offset + query.pageSize);

    const totalResult = filters.length > 0
      ? await sql`
          SELECT COUNT(*)::int AS count
          FROM chapters c
          JOIN missions ms ON ms.id = c.mission_id
          WHERE ${sql.join(filters, sql` AND `)}
        `
      : await sql`
          SELECT COUNT(*)::int AS count
          FROM chapters c
          JOIN missions ms ON ms.id = c.mission_id
          WHERE 1=0
        `;

    return NextResponse.json({
      items: paginatedRows,
      page: query.page,
      pageSize: query.pageSize,
      total: Number(totalResult.rows[0]?.count ?? 0),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid query", details: error.flatten() }, { status: 422 });
    }
    if (error instanceof Error && error.message.startsWith("AUTH")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Gallery chapters failed", error);
    return NextResponse.json({ error: "Unable to load chapters" }, { status: 500 });
  }
}
