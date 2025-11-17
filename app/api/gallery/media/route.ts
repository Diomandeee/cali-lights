import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db/client";
import { listUserMemberships } from "@/lib/data/chains";

const schema = z.object({
  scope: z.enum(["chain", "network", "user"]).default("chain"),
  chainId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  hue: z.coerce.number().min(0).max(359).optional(),
  tags: z.string().optional(),
  favoriteOnly: z.coerce.boolean().optional(),
  date: z.string().optional(), // YYYY-MM-DD format
  time: z.string().optional(), // HH:MM format
  month: z.coerce.number().min(1).max(12).optional(),
  location: z.string().optional(), // City name
  sort: z.enum(["newest", "oldest", "warm_to_cool", "cool_to_warm", "sync"]).default(
    "newest"
  ),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(24),
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

    if (query.scope === "user") {
      filters.push(sql`e.user_id = ${user.id}`);
    } else if (query.scope === "chain" && query.chainId) {
      filters.push(sql`ms.chain_id = ${query.chainId}`);
    }

    if (query.hue !== undefined) {
      // Enhanced hue filtering with 30-degree buckets
      const bucketSize = 30;
      const bucket = Math.floor(query.hue / bucketSize);
      const lower = bucket * bucketSize;
      const upper = lower + bucketSize;
      filters.push(sql`e.dominant_hue BETWEEN ${lower} AND ${upper}`);
    }

    if (query.tags) {
      const tags = query.tags.split(",").map((tag) => tag.trim());
      // Use jsonb overlap operator for array matching
      filters.push(sql`(e.scene_tags && ${JSON.stringify(tags)}::jsonb OR e.object_tags && ${JSON.stringify(tags)}::jsonb)`);
    }

    if (query.favoriteOnly) {
      filters.push(sql`e.favorite = true`);
    }

    // Date filter (YYYY-MM-DD)
    if (query.date) {
      const dateStart = new Date(query.date);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(query.date);
      dateEnd.setHours(23, 59, 59, 999);
      filters.push(sql`e.captured_at >= ${dateStart.toISOString()} AND e.captured_at <= ${dateEnd.toISOString()}`);
    }

    // Time filter (HH:MM) - filters by hour
    if (query.time) {
      const [hours, minutes] = query.time.split(":").map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        // Filter entries within the same hour
        filters.push(sql`EXTRACT(HOUR FROM e.captured_at) = ${hours}`);
      }
    }

    // Month filter
    if (query.month) {
      filters.push(sql`EXTRACT(MONTH FROM e.captured_at) = ${query.month}`);
    }

    // Location filter (city)
    if (query.location) {
      filters.push(sql`LOWER(e.gps_city) = LOWER(${query.location})`);
    }

    const offset = (query.page - 1) * query.pageSize;

    // Build ORDER BY clause as string for manual sorting
    let orderBy = "newest";
    if (query.sort === "oldest") {
      orderBy = "oldest";
    } else if (query.sort === "warm_to_cool") {
      orderBy = "warm_to_cool";
    } else if (query.sort === "cool_to_warm") {
      orderBy = "cool_to_warm";
    }

    // Build WHERE fragment
    const whereFragment = filters.length > 0
      ? sql.join(filters, sql` AND `)
      : sql.raw("1=0");

    // Fetch all matching entries, then sort and paginate in JavaScript
    const entriesResult = await sql`
      SELECT e.*, ms.chain_id
      FROM entries e
      JOIN missions ms ON ms.id = e.mission_id
      WHERE ${whereFragment}
    `;

    // Sort in JavaScript
    const sortedRows = entriesResult.rows.sort((a, b) => {
      if (orderBy === "oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (orderBy === "warm_to_cool") {
        return (a.dominant_hue ?? 0) - (b.dominant_hue ?? 0);
      } else if (orderBy === "cool_to_warm") {
        return (b.dominant_hue ?? 0) - (a.dominant_hue ?? 0);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const paginatedRows = sortedRows.slice(offset, offset + query.pageSize);

    const totalResult = filters.length > 0
      ? await sql`
          SELECT COUNT(*)::int AS count
          FROM entries e
          JOIN missions ms ON ms.id = e.mission_id
          WHERE ${sql.join(filters, sql` AND `)}
        `
      : await sql`
          SELECT COUNT(*)::int AS count
          FROM entries e
          JOIN missions ms ON ms.id = e.mission_id
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
    console.error("Gallery media failed", error);
    return NextResponse.json({ error: "Unable to load gallery" }, { status: 500 });
  }
}
