import { sql } from "@/lib/db/client";

export type EntryRecord = {
  id: string;
  mission_id: string;
  user_id: string;
  media_url: string;
  media_type: "photo" | "video";
  gps_city: string | null;
  gps_lat: number | null;
  gps_lon: number | null;
  exif_taken_at: string | null;
  captured_at: string | null;
  dominant_hue: number | null;
  palette: any;
  scene_tags: string[] | null;
  object_tags: string[] | null;
  motion_score: number | null;
  alt_text: string | null;
  favorite: boolean;
  metadata_status: string;
  created_at: string;
  updated_at: string;
};

export async function upsertEntry(params: {
  missionId: string;
  userId: string;
  mediaUrl: string;
  mediaType: "photo" | "video";
  gpsCity?: string | null;
  gpsLat?: number | null;
  gpsLon?: number | null;
  capturedAt?: Date | null;
  altText?: string | null;
}): Promise<EntryRecord> {
  const result = await sql<EntryRecord>`
    INSERT INTO entries (mission_id, user_id, media_url, media_type, gps_city, gps_lat, gps_lon, captured_at, alt_text)
    VALUES (
      ${params.missionId},
      ${params.userId},
      ${params.mediaUrl},
      ${params.mediaType},
      ${params.gpsCity || null},
      ${params.gpsLat ?? null},
      ${params.gpsLon ?? null},
      ${params.capturedAt ? params.capturedAt.toISOString() : null}::timestamptz,
      ${params.altText || null}
    )
    ON CONFLICT (user_id, mission_id)
    DO UPDATE SET
      media_url = EXCLUDED.media_url,
      media_type = EXCLUDED.media_type,
      gps_city = EXCLUDED.gps_city,
      gps_lat = EXCLUDED.gps_lat,
      gps_lon = EXCLUDED.gps_lon,
      captured_at = EXCLUDED.captured_at,
      alt_text = EXCLUDED.alt_text,
      updated_at = NOW(),
      metadata_status = 'pending'
    RETURNING *
  `;
  return result.rows[0];
}

export async function updateEntryMetadata(params: {
  entryId: string;
  dominantHue?: number | null;
  palette?: string[];
  sceneTags?: string[];
  objectTags?: string[];
  motionScore?: number | null;
  gpsCity?: string | null;
  gpsLat?: number | null;
  gpsLon?: number | null;
  exifTakenAt?: Date | null;
  altText?: string | null;
}): Promise<EntryRecord> {
  const result = await sql<EntryRecord>`
    UPDATE entries
    SET dominant_hue = ${params.dominantHue ?? null},
        palette = ${params.palette ? JSON.stringify(params.palette) : null}::jsonb,
        scene_tags = ${params.sceneTags ? JSON.stringify(params.sceneTags) : null}::jsonb,
        object_tags = ${params.objectTags ? JSON.stringify(params.objectTags) : null}::jsonb,
        motion_score = ${params.motionScore ?? null},
        gps_city = ${params.gpsCity ?? null},
        gps_lat = ${params.gpsLat ?? null},
        gps_lon = ${params.gpsLon ?? null},
        exif_taken_at = ${params.exifTakenAt ? params.exifTakenAt.toISOString() : null}::timestamptz,
        alt_text = COALESCE(${params.altText ?? null}, alt_text),
        metadata_status = 'complete',
        updated_at = NOW()
    WHERE id = ${params.entryId}
    RETURNING *
  `;
  return result.rows[0];
}

export async function toggleFavoriteEntry(
  entryId: string,
  on: boolean
): Promise<EntryRecord> {
  const result = await sql<EntryRecord>`
    UPDATE entries
    SET favorite = ${on}, updated_at = NOW()
    WHERE id = ${entryId}
    RETURNING *
  `;
  return result.rows[0];
}

export async function listEntriesForMission(
  missionId: string
): Promise<EntryRecord[]> {
  const result = await sql<EntryRecord>`
    SELECT * FROM entries WHERE mission_id = ${missionId}
  `;
  return result.rows;
}

export async function getEntryById(
  entryId: string
): Promise<EntryRecord | null> {
  const result = await sql<EntryRecord>`
    SELECT * FROM entries WHERE id = ${entryId} LIMIT 1
  `;
  return result.rows[0] ?? null;
}

export async function countEntriesForMission(missionId: string): Promise<number> {
  const result = await sql<{ count: string }>`
    SELECT COUNT(*)::int AS count FROM entries WHERE mission_id = ${missionId}
  `;
  return Number(result.rows[0]?.count ?? 0);
}
