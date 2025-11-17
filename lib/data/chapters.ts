import { sql } from "@/lib/db/client";

export type ChapterRecord = {
  id: string;
  mission_id: string;
  title: string | null;
  poem: string | null;
  collage_url: string | null;
  video_url: string | null;
  soundtrack_url: string | null;
  duration_seconds: number | null;
  final_palette: any;
  is_shareable: boolean;
  share_url: string | null;
  share_expires_at: string | null;
  generated_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function createChapterRecord(params: {
  missionId: string;
  title?: string | null;
  poem?: string | null;
  collageUrl?: string | null;
  finalPalette?: string[];
}): Promise<ChapterRecord> {
  // Check if chapter already exists
  const existing = await getChapterByMission(params.missionId);
  if (existing) {
    // Update existing chapter
    const result = await sql<ChapterRecord>`
      UPDATE chapters
      SET title = COALESCE(${params.title ?? null}, title),
          poem = COALESCE(${params.poem ?? null}, poem),
          collage_url = COALESCE(${params.collageUrl ?? null}, collage_url),
          final_palette = COALESCE(${params.finalPalette ? JSON.stringify(params.finalPalette) : null}::jsonb, final_palette),
          updated_at = NOW()
      WHERE mission_id = ${params.missionId}
      RETURNING *
    `;
    return result.rows[0];
  }
  
  // Create new chapter
  const result = await sql<ChapterRecord>`
    INSERT INTO chapters (mission_id, title, poem, collage_url, final_palette)
    VALUES (${params.missionId}, ${params.title || null}, ${
      params.poem || null
    }, ${params.collageUrl || null}, ${
      params.finalPalette ? JSON.stringify(params.finalPalette) : null
    }::jsonb)
    RETURNING *
  `;
  return result.rows[0];
}

export async function updateChapterWithVideo(params: {
  chapterId: string;
  videoUrl: string;
  durationSeconds: number;
  finalPalette: string[];
  generatedAt?: Date;
  poem?: string | null;
  soundtrackUrl?: string | null;
}): Promise<ChapterRecord> {
  const result = await sql<ChapterRecord>`
    UPDATE chapters
    SET video_url = ${params.videoUrl},
        duration_seconds = ${params.durationSeconds},
        final_palette = ${JSON.stringify(params.finalPalette)}::jsonb,
        generated_at = ${params.generatedAt ? params.generatedAt.toISOString() : new Date().toISOString()}::timestamptz,
        poem = COALESCE(${params.poem ?? null}, poem),
        soundtrack_url = COALESCE(${params.soundtrackUrl ?? null}, soundtrack_url),
        updated_at = NOW()
    WHERE id = ${params.chapterId}
    RETURNING *
  `;
  return result.rows[0];
}

export async function toggleChapterShare(params: {
  chapterId: string;
  on: boolean;
  shareUrl?: string | null;
  expiresAt?: Date | null;
}): Promise<ChapterRecord> {
  const result = await sql<ChapterRecord>`
    UPDATE chapters
    SET is_shareable = ${params.on},
        share_url = ${params.on ? params.shareUrl ?? null : null},
        share_expires_at = ${params.on && params.expiresAt ? params.expiresAt.toISOString() : null}::timestamptz,
        updated_at = NOW()
    WHERE id = ${params.chapterId}
    RETURNING *
  `;
  return result.rows[0];
}

export async function getChapterByMission(
  missionId: string
): Promise<ChapterRecord | null> {
  const result = await sql<ChapterRecord>`
    SELECT * FROM chapters WHERE mission_id = ${missionId} LIMIT 1
  `;
  return result.rows[0] ?? null;
}

export async function getChapterById(
  chapterId: string
): Promise<ChapterRecord | null> {
  const result = await sql<ChapterRecord>`
    SELECT * FROM chapters WHERE id = ${chapterId} LIMIT 1
  `;
  return result.rows[0] ?? null;
}
