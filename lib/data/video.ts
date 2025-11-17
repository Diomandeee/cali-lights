import { sql } from "@/lib/db/client";

export type VideoOperationRecord = {
  id: string;
  operation_id: string;
  target_type: string;
  target_id: string;
  prompt: string;
  input_media_urls: string[];
  aspect_ratio: string;
  length_seconds: number;
  model: string;
  status: string;
  cost_usd: string | null;
  watermark: string | null;
  video_url: string | null;
  duration_seconds: number | null;
  created_at: string;
  completed_at: string | null;
};

export async function createVideoOperation(params: {
  operationId: string;
  targetType: string;
  targetId: string;
  prompt: string;
  inputMediaUrls: string[];
  aspectRatio: string;
  lengthSeconds: number;
  model: string;
}): Promise<VideoOperationRecord> {
  const result = await sql<VideoOperationRecord>`
    INSERT INTO video_operations (
      operation_id,
      target_type,
      target_id,
      prompt,
      input_media_urls,
      aspect_ratio,
      length_seconds,
      model
    )
    VALUES (
      ${params.operationId},
      ${params.targetType},
      ${params.targetId},
      ${params.prompt},
      ${JSON.stringify(params.inputMediaUrls)}::jsonb,
      ${params.aspectRatio},
      ${params.lengthSeconds},
      ${params.model}
    )
    RETURNING *
  `;
  return result.rows[0];
}

export async function updateVideoOperationStatus(params: {
  operationId: string;
  status: string;
  videoUrl?: string | null;
  durationSeconds?: number | null;
  costUsd?: number | null;
  watermark?: string | null;
}): Promise<VideoOperationRecord> {
  const result = await sql<VideoOperationRecord>`
    UPDATE video_operations
    SET status = ${params.status},
        video_url = ${params.videoUrl ?? null},
        duration_seconds = ${params.durationSeconds ?? null},
        cost_usd = ${params.costUsd ?? null},
        watermark = ${params.watermark ?? null},
        completed_at = CASE WHEN ${params.status} IN ('SUCCEEDED','FAILED')
          THEN NOW() ELSE completed_at END
    WHERE operation_id = ${params.operationId}
    RETURNING *
  `;
  return result.rows[0];
}

export async function listPendingVideoOperations(): Promise<VideoOperationRecord[]> {
  const result = await sql<VideoOperationRecord>`
    SELECT * FROM video_operations
    WHERE status = 'PENDING'
      AND created_at > NOW() - INTERVAL '1 hour'
    ORDER BY created_at ASC
    LIMIT 50
  `;
  return result.rows;
}

export async function getVideoOperationById(
  operationId: string
): Promise<VideoOperationRecord | null> {
  const result = await sql<VideoOperationRecord>`
    SELECT * FROM video_operations WHERE operation_id = ${operationId} LIMIT 1
  `;
  return result.rows[0] ?? null;
}
