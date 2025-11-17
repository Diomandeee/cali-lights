import { sql } from "@/lib/db/client";

export type MissionRecord = {
  id: string;
  chain_id: string;
  prompt: string;
  state: string;
  window_seconds: number;
  submissions_required: number;
  submissions_received: number;
  starts_at: string;
  ends_at: string | null;
  locked_at: string | null;
  recap_ready_at: string | null;
  archived_at: string | null;
  created_by: string | null;
  created_at: string;
};

export type MissionWithChain = MissionRecord & {
  chain_name: string;
  chain_palette: any;
};

export async function createMission(params: {
  chainId: string;
  prompt: string;
  windowSeconds: number;
  createdBy: string;
  startsAt?: Date;
}): Promise<MissionRecord> {
  const result = await sql<MissionRecord>`
    INSERT INTO missions (chain_id, prompt, window_seconds, created_by, starts_at, ends_at)
    VALUES (${params.chainId}, ${params.prompt}, ${params.windowSeconds}, ${
      params.createdBy
    }, ${params.startsAt ? params.startsAt.toISOString() : new Date().toISOString()}::timestamptz, ${
      params.startsAt
        ? new Date(params.startsAt.getTime() + params.windowSeconds * 1000).toISOString()
        : new Date(Date.now() + params.windowSeconds * 1000).toISOString()
    }::timestamptz)
    RETURNING *
  `;
  return result.rows[0];
}

export async function getMissionById(
  missionId: string
): Promise<MissionRecord | null> {
  const result = await sql<MissionRecord>`
    SELECT * FROM missions WHERE id = ${missionId} LIMIT 1
  `;
  return result.rows[0] ?? null;
}

export async function getMissionWithChain(
  missionId: string
): Promise<MissionWithChain | null> {
  const result = await sql<MissionWithChain>`
    SELECT m.*, c.name as chain_name, c.palette as chain_palette
    FROM missions m
    JOIN chains c ON c.id = m.chain_id
    WHERE m.id = ${missionId}
    LIMIT 1
  `;
  return result.rows[0] ?? null;
}

export async function updateMissionState(params: {
  missionId: string;
  state: MissionRecord["state"];
  submissionsReceived?: number;
}): Promise<MissionRecord> {
  if (typeof params.submissionsReceived === "number") {
    const result = await sql<MissionRecord>`
      UPDATE missions
      SET state = ${params.state},
          submissions_received = ${params.submissionsReceived}
      WHERE id = ${params.missionId}
      RETURNING *
    `;
    return result.rows[0];
  } else {
    const result = await sql<MissionRecord>`
      UPDATE missions
      SET state = ${params.state}
      WHERE id = ${params.missionId}
      RETURNING *
    `;
    return result.rows[0];
  }
}

export async function incrementSubmissionCount(
  missionId: string
): Promise<MissionRecord> {
  const result = await sql<MissionRecord>`
    UPDATE missions
    SET submissions_received = submissions_received + 1
    WHERE id = ${missionId}
    RETURNING *
  `;
  return result.rows[0];
}

export async function setSubmissionCount(
  missionId: string,
  count: number
): Promise<MissionRecord> {
  const result = await sql<MissionRecord>`
    UPDATE missions
    SET submissions_received = ${count}
    WHERE id = ${missionId}
    RETURNING *
  `;
  return result.rows[0];
}

export async function markMissionLocked(missionId: string): Promise<MissionRecord> {
  const result = await sql<MissionRecord>`
    UPDATE missions
    SET state = 'FUSING', locked_at = NOW()
    WHERE id = ${missionId}
    RETURNING *
  `;
  return result.rows[0];
}

export async function markMissionRecapReady(
  missionId: string
): Promise<MissionRecord> {
  const result = await sql<MissionRecord>`
    UPDATE missions
    SET state = 'RECAP', recap_ready_at = NOW()
    WHERE id = ${missionId}
    RETURNING *
  `;
  return result.rows[0];
}

export async function archiveMissionRecord(
  missionId: string
): Promise<MissionRecord> {
  const result = await sql<MissionRecord>`
    UPDATE missions
    SET state = 'ARCHIVED', archived_at = NOW()
    WHERE id = ${missionId}
    RETURNING *
  `;
  return result.rows[0];
}
