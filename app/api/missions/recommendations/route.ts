import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { listUserMemberships } from "@/lib/data/chains";
import { sql } from "@/lib/db/client";

export const dynamic = 'force-dynamic';

const schema = z.object({
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  lat: z.coerce.number().optional(),
  lon: z.coerce.number().optional(),
  radiusKm: z.coerce.number().default(50),
  limit: z.coerce.number().min(1).max(50).default(10),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const params = schema.parse(
      Object.fromEntries(new URL(request.url).searchParams.entries())
    );

    const memberships = await listUserMemberships(user.id);
    const chainIds = memberships.map((m) => m.chain_id);

    if (chainIds.length === 0) {
      return NextResponse.json({ missions: [] });
    }

    const whereClauses = [
      sql`ms.chain_id IN (${sql.join(chainIds.map(id => sql`${id}`), sql`, `)})`,
      sql`ms.state IN ('LOBBY', 'CAPTURE', 'FUSING', 'RECAP')`,
    ];

    // Location-based filtering
    // If city is provided, filter missions that have entries in that city
    // OR missions that are scheduled for that city (we'd need a city field on missions for this)
    if (params.city) {
      // Filter missions that have at least one entry in the specified city
      whereClauses.push(sql`EXISTS (
        SELECT 1 FROM entries e 
        WHERE e.mission_id = ms.id 
        AND LOWER(e.gps_city) = LOWER(${params.city})
      )`);
    }
    
    // Note: state and country filtering would require adding those columns to entries table
    // For now, we filter by city only

    // Radius-based filtering (if lat/lon provided)
    // This filters missions that have entries within the radius
    if (params.lat !== undefined && params.lon !== undefined) {
      const latDelta = params.radiusKm / 111;
      const lonDelta = params.radiusKm / (111 * Math.cos(params.lat * Math.PI / 180));
      
      whereClauses.push(sql`EXISTS (
        SELECT 1 FROM entries e 
        WHERE e.mission_id = ms.id 
        AND e.gps_lat IS NOT NULL 
        AND e.gps_lon IS NOT NULL
        AND e.gps_lat BETWEEN ${params.lat - latDelta} AND ${params.lat + latDelta}
        AND e.gps_lon BETWEEN ${params.lon - lonDelta} AND ${params.lon + lonDelta}
      )`);
    }

    const where = sql.join(whereClauses, sql` AND `);

    // Build the SELECT query - conditionally include distance calculation
    const hasLocation = params.lat !== undefined && params.lon !== undefined;

    // Build query with conditional distance calculation
    let missions;
    if (hasLocation) {
      missions = await sql<{
        id: string;
        prompt: string;
        chain_name: string;
        state: string;
        starts_at: string;
        ends_at: string | null;
        submissions_received: number;
        submissions_required: number;
        city: string | null;
        lat: number | null;
        lon: number | null;
        distance_km: number | null;
      }>`
        SELECT
          ms.id,
          ms.prompt,
          c.name AS chain_name,
          ms.state,
          ms.starts_at,
          ms.ends_at,
          ms.submissions_received,
          ms.submissions_required,
          (SELECT e.gps_city FROM entries e WHERE e.mission_id = ms.id AND e.gps_city IS NOT NULL LIMIT 1) AS city,
          (SELECT AVG(e.gps_lat) FROM entries e WHERE e.mission_id = ms.id AND e.gps_lat IS NOT NULL) AS lat,
          (SELECT AVG(e.gps_lon) FROM entries e WHERE e.mission_id = ms.id AND e.gps_lon IS NOT NULL) AS lon,
          (SELECT SQRT(
            POWER(69.1 * (AVG(e.gps_lat) - ${params.lat!}), 2) +
            POWER(69.1 * (AVG(e.gps_lon) - ${params.lon!}) * COS(AVG(e.gps_lat) / 57.3), 2)
          )
          FROM entries e
          WHERE e.mission_id = ms.id
          AND e.gps_lat IS NOT NULL
          AND e.gps_lon IS NOT NULL) AS distance_km
        FROM missions ms
        JOIN chains c ON c.id = ms.chain_id
        WHERE ${where}
        ORDER BY
          distance_km ASC,
          ms.starts_at DESC
        LIMIT ${params.limit}
      `;
    } else {
      missions = await sql<{
        id: string;
        prompt: string;
        chain_name: string;
        state: string;
        starts_at: string;
        ends_at: string | null;
        submissions_received: number;
        submissions_required: number;
        city: string | null;
        lat: number | null;
        lon: number | null;
        distance_km: number | null;
      }>`
        SELECT
          ms.id,
          ms.prompt,
          c.name AS chain_name,
          ms.state,
          ms.starts_at,
          ms.ends_at,
          ms.submissions_received,
          ms.submissions_required,
          (SELECT e.gps_city FROM entries e WHERE e.mission_id = ms.id AND e.gps_city IS NOT NULL LIMIT 1) AS city,
          (SELECT AVG(e.gps_lat) FROM entries e WHERE e.mission_id = ms.id AND e.gps_lat IS NOT NULL) AS lat,
          (SELECT AVG(e.gps_lon) FROM entries e WHERE e.mission_id = ms.id AND e.gps_lon IS NOT NULL) AS lon,
          NULL AS distance_km
        FROM missions ms
        JOIN chains c ON c.id = ms.chain_id
        WHERE ${where}
        ORDER BY
          ms.starts_at DESC
        LIMIT ${params.limit}
      `;
    }

    return NextResponse.json({ missions: missions.rows });
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
    console.error("Location recommendations failed", error);
    return NextResponse.json(
      { 
        error: "Unable to load recommendations",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

