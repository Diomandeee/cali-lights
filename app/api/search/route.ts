import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db/client";
import { logger } from "@/lib/utils/logger";

const schema = z.object({
  query: z.string().min(1).max(100),
  type: z.enum(["hue", "tags", "all"]).default("all"),
});

/**
 * Enhanced search endpoint with production-grade error handling
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const { searchParams } = new URL(request.url);
    
    const query = schema.parse({
      query: searchParams.get("query"),
      type: searchParams.get("type") || "all",
    });

    const memberships = await sql<{ chain_id: string }>`
      SELECT chain_id FROM memberships WHERE user_id = ${user.id}
    `;
    const chainIds = memberships.rows.map((row) => row.chain_id);

    if (!chainIds.length) {
      return NextResponse.json({ results: [] });
    }

    const results: any[] = [];

    // Search by hue
    if (query.type === "hue" || query.type === "all") {
      const hueMatch = parseInt(query.query);
      if (!isNaN(hueMatch) && hueMatch >= 0 && hueMatch <= 360) {
        const hueResults = await sql`
          SELECT e.*, m.chain_id
          FROM entries e
          JOIN missions m ON m.id = e.mission_id
          WHERE m.chain_id IN (${sql.join(chainIds.map(id => sql`${id}`), sql`, `)})
            AND e.dominant_hue BETWEEN ${hueMatch - 15} AND ${hueMatch + 15}
          LIMIT 20
        `;
        results.push(...hueResults.rows.map((row) => ({ ...row, matchType: "hue" })));
      }
    }

    // Search by tags
    if (query.type === "tags" || query.type === "all") {
      const searchTerm = `%${query.query.toLowerCase()}%`;
      const tagResults = await sql`
        SELECT DISTINCT e.*, m.chain_id
        FROM entries e
        JOIN missions m ON m.id = e.mission_id
        WHERE m.chain_id IN (${sql.join(chainIds.map(id => sql`${id}`), sql`, `)})
          AND (
            EXISTS (
              SELECT 1 FROM jsonb_array_elements_text(e.scene_tags) AS tag
              WHERE tag ILIKE ${searchTerm}
            )
            OR EXISTS (
              SELECT 1 FROM jsonb_array_elements_text(e.object_tags) AS tag
              WHERE tag ILIKE ${searchTerm}
            )
          )
        LIMIT 20
      `;
      results.push(...tagResults.rows.map((row) => ({ ...row, matchType: "tags" })));
    }

    // Deduplicate results
    const uniqueResults = Array.from(
      new Map(results.map((item) => [item.id, item])).values()
    ).slice(0, 20);

    logger.info("Search performed", {
      userId: user.id,
      query: query.query,
      type: query.type,
      resultCount: uniqueResults.length,
    });

    return NextResponse.json({
      results: uniqueResults,
      count: uniqueResults.length,
    });
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
    logger.error("Search failed", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: "Unable to perform search" },
      { status: 500 }
    );
  }
}
