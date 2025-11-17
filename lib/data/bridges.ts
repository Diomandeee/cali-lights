import { sql } from "@/lib/db/client";
import { circularMean, hueDistance } from "@cali/lib/color";
import { listEntriesForMission } from "@/lib/data/entries";
import { createConnectionIfNeeded } from "@/lib/data/chains";

export type MissionSignature = {
  missionId: string;
  chainId: string;
  chainName: string;
  tags: string[];
  hue: number | null;
  recapReadyAt: Date | null;
};

export async function buildMissionSignature(
  missionId: string
): Promise<MissionSignature | null> {
  const missionRow = (
    await sql<{
      mission_id: string;
      chain_id: string;
      chain_name: string;
      recap_ready_at: string | null;
    }>`
      SELECT m.id as mission_id, m.chain_id, c.name as chain_name, m.recap_ready_at
      FROM missions m
      JOIN chains c ON c.id = m.chain_id
      WHERE m.id = ${missionId}
      LIMIT 1
    `
  ).rows[0];
  if (!missionRow) return null;

  const entries = await listEntriesForMission(missionId);
  if (!entries.length) {
    return {
      missionId,
      chainId: missionRow.chain_id,
      chainName: missionRow.chain_name,
      tags: [],
      hue: null,
      recapReadyAt: missionRow.recap_ready_at
        ? new Date(missionRow.recap_ready_at)
        : null,
    };
  }

  const hues = entries
    .map((entry) => entry.dominant_hue)
    .filter((value): value is number => typeof value === "number");
  const tags = Array.from(
    new Set(
      entries.flatMap((entry) => [
        ...(entry.scene_tags ?? []),
        ...(entry.object_tags ?? []),
      ])
    )
  );

  return {
    missionId,
    chainId: missionRow.chain_id,
    chainName: missionRow.chain_name,
    tags,
    hue: circularMean(hues),
    recapReadyAt: missionRow.recap_ready_at
      ? new Date(missionRow.recap_ready_at)
      : null,
  };
}

export async function findCandidateMissionIds(
  chainId: string,
  referenceTime: Date | null
): Promise<string[]> {
  if (!referenceTime) return [];
  const windowSeconds = 6 * 3600;
  const result = await sql<{ id: string }>`
    SELECT id
    FROM missions
    WHERE chain_id <> ${chainId}
      AND recap_ready_at IS NOT NULL
      AND ABS(EXTRACT(EPOCH FROM (recap_ready_at - ${referenceTime.toISOString()}::timestamptz))) <= ${windowSeconds}
    ORDER BY recap_ready_at DESC
    LIMIT 12
  `;
  return result.rows.map((row) => row.id);
}

export async function logBridgeEvent(params: {
  missionAId: string;
  missionBId: string;
  chainAId: string;
  chainBId: string;
  sharedTags: string[];
  hueDelta: number | null;
}) {
  // enforce deterministic order
  let {
    missionAId,
    missionBId,
    chainAId,
    chainBId,
    sharedTags,
    hueDelta,
  } = params;
  if (missionAId > missionBId) {
    [missionAId, missionBId] = [missionBId, missionAId];
    [chainAId, chainBId] = [chainBId, chainAId];
  }
  await sql`
    INSERT INTO bridge_events (
      mission_a_id,
      mission_b_id,
      chain_a_id,
      chain_b_id,
      shared_tags,
      hue_delta
    )
    VALUES (
      ${missionAId},
      ${missionBId},
      ${chainAId},
      ${chainBId},
      ${JSON.stringify(sharedTags)}::jsonb,
      ${hueDelta ?? null}
    )
    ON CONFLICT (mission_a_id, mission_b_id) DO NOTHING
  `;
}

export async function getBridgeEventsForChains(chainIds: string[]) {
  if (!chainIds.length) return [];
  
  try {
    // Create fragments for the IN clauses
    const chainIdsFragment = sql.join(chainIds.map(id => sql`${id}`), sql`, `);
    
    const result = await sql<{
      id: string;
      mission_a_id: string;
      mission_b_id: string;
      chain_a_id: string;
      chain_b_id: string;
      shared_tags: string[] | null;
      hue_delta: number | null;
      created_at: string;
      chain_a_name: string;
      chain_b_name: string;
    }>`
      SELECT
        be.*,
        ca.name AS chain_a_name,
        cb.name AS chain_b_name
      FROM bridge_events be
      JOIN chains ca ON ca.id = be.chain_a_id
      JOIN chains cb ON cb.id = be.chain_b_id
      WHERE be.chain_a_id IN (${chainIdsFragment})
         OR be.chain_b_id IN (${chainIdsFragment})
      ORDER BY be.created_at DESC
      LIMIT 20
    `;
    return result.rows;
  } catch (error) {
    // If bridge_events table doesn't exist or query fails, return empty array
    console.error("Failed to fetch bridge events:", error);
    return [];
  }
}

export type BridgeMatch = {
  sourceChainId: string;
  targetChainId: string;
  sourceChainName: string;
  targetChainName: string;
  sharedTags: string[];
  hueDelta: number;
};

export async function evaluateBridgeSimilarity(
  missionId: string
): Promise<BridgeMatch[]> {
  const signature = await buildMissionSignature(missionId);
  if (!signature || !signature.recapReadyAt) return [];

  const candidateIds = await findCandidateMissionIds(
    signature.chainId,
    signature.recapReadyAt
  );

  const matches: BridgeMatch[] = [];
  for (const candidateId of candidateIds) {
    const candidateSig = await buildMissionSignature(candidateId);
    if (!candidateSig) continue;
    const sharedTags = signature.tags.filter((tag) =>
      candidateSig.tags.includes(tag)
    );
    if (!sharedTags.length) continue;
    const hueDelta = hueDistance(signature.hue, candidateSig.hue);
    if (hueDelta === null || hueDelta > 20) continue;

    await createConnectionIfNeeded({
      fromChainId: signature.chainId,
      toChainId: candidateSig.chainId,
      bridgeReason: "bridge-event",
    });

    await logBridgeEvent({
      missionAId: missionId,
      missionBId: candidateId,
      chainAId: signature.chainId,
      chainBId: candidateSig.chainId,
      sharedTags,
      hueDelta,
    });
    matches.push({
      sourceChainId: signature.chainId,
      targetChainId: candidateSig.chainId,
      sourceChainName: signature.chainName,
      targetChainName: candidateSig.chainName,
      sharedTags,
      hueDelta,
    });
  }

  return matches;
}
