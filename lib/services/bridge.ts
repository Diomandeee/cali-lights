import { evaluateBridgeSimilarity } from "@/lib/data/bridges";
import { listChainMembers } from "@/lib/data/chains";
import { notifyBridgeEvent } from "@/lib/services/notifications";

export async function handleBridgeEvaluation(missionId: string) {
  const matches = await evaluateBridgeSimilarity(missionId);
  for (const match of matches) {
    const sourceMembers = await listChainMembers(match.sourceChainId);
    const targetMembers = await listChainMembers(match.targetChainId);
    const userIds = Array.from(
      new Set([
        ...sourceMembers.map((m) => m.user_id),
        ...targetMembers.map((m) => m.user_id),
      ])
    );
    if (userIds.length) {
      await notifyBridgeEvent({
        userIds,
        sourceChain: match.sourceChainName,
        targetChain: match.targetChainName,
        sharedTag: match.sharedTags[0],
      });
    }
  }
  return matches.length;
}
