import { kv } from "@vercel/kv";
import type { Mode, SessionState } from "./types";

// Key patterns
const TOKEN_KEY = (token: string) => `token:${token}`;
const SESSION_STATE_KEY = (sessionId: string) => `session:${sessionId}:state`;
const SESSION_PRESENCE_KEY = (sessionId: string) =>
  `session:${sessionId}:presence`;
const ACTIVE_ROUND_KEY = (sessionId: string) => `session:${sessionId}:round`;

// Token & Mode Management
export async function setTokenMode(
  token: string,
  mode: Mode,
  configId: string
): Promise<void> {
  await kv.set(TOKEN_KEY(token), { mode, configId });
}

export async function getTokenMode(
  token: string
): Promise<{ mode: Mode; configId: string } | null> {
  return await kv.get(TOKEN_KEY(token));
}

// Session State Management
export async function setSessionState(
  sessionId: string,
  state: SessionState,
  data?: any
): Promise<void> {
  await kv.set(SESSION_STATE_KEY(sessionId), { state, data, updatedAt: Date.now() });
}

export async function getSessionState(
  sessionId: string
): Promise<{ state: SessionState; data?: any; updatedAt: number } | null> {
  return await kv.get(SESSION_STATE_KEY(sessionId));
}

// Active Round Management
export async function setActiveRound(
  sessionId: string,
  roundNumber: number,
  roundData: any
): Promise<void> {
  await kv.set(ACTIVE_ROUND_KEY(sessionId), {
    roundNumber,
    ...roundData,
    startedAt: Date.now(),
  });
}

export async function getActiveRound(sessionId: string): Promise<any | null> {
  return await kv.get(ACTIVE_ROUND_KEY(sessionId));
}

export async function clearActiveRound(sessionId: string): Promise<void> {
  await kv.del(ACTIVE_ROUND_KEY(sessionId));
}

// Presence Management (for real-time participant count)
export async function addPresence(
  sessionId: string,
  userId: string,
  nickname: string
): Promise<void> {
  const key = SESSION_PRESENCE_KEY(sessionId);
  await kv.hset(key, { [userId]: { nickname, lastSeen: Date.now() } });
  await kv.expire(key, 3600); // 1 hour TTL
}

export async function removePresence(
  sessionId: string,
  userId: string
): Promise<void> {
  await kv.hdel(SESSION_PRESENCE_KEY(sessionId), userId);
}

export async function getPresence(
  sessionId: string
): Promise<Record<string, any>> {
  const presence = await kv.hgetall(SESSION_PRESENCE_KEY(sessionId));
  return presence || {};
}

export async function getPresenceCount(sessionId: string): Promise<number> {
  const presence = await getPresence(sessionId);
  return Object.keys(presence).length;
}

// Session Cleanup
export async function cleanupSession(sessionId: string): Promise<void> {
  await Promise.all([
    kv.del(SESSION_STATE_KEY(sessionId)),
    kv.del(SESSION_PRESENCE_KEY(sessionId)),
    kv.del(ACTIVE_ROUND_KEY(sessionId)),
  ]);
}

// Config Caching
const CONFIG_KEY = (configId: string) => `config:${configId}`;

export async function cacheConfig(
  configId: string,
  config: any
): Promise<void> {
  await kv.set(CONFIG_KEY(configId), config, { ex: 3600 }); // 1 hour cache
}

export async function getCachedConfig(configId: string): Promise<any | null> {
  return await kv.get(CONFIG_KEY(configId));
}

// Leaderboard/Scoring (optional)
const SCORE_KEY = (sessionId: string) => `session:${sessionId}:scores`;

export async function updateUserScore(
  sessionId: string,
  userId: string,
  score: number
): Promise<void> {
  await kv.zadd(SCORE_KEY(sessionId), { score, member: userId });
}

export async function getTopScores(
  sessionId: string,
  limit: number = 10
): Promise<Array<{ userId: string; score: number }>> {
  const scores = await kv.zrange(SCORE_KEY(sessionId), 0, limit - 1, {
    rev: true,
    withScores: true,
  });

  // Format the results
  const result: Array<{ userId: string; score: number }> = [];
  for (let i = 0; i < scores.length; i += 2) {
    result.push({
      userId: scores[i] as string,
      score: scores[i + 1] as number,
    });
  }
  return result;
}

// Mission scheduling
const MISSION_SCHEDULE_KEY = (chainId: string) => `mission:schedule:${chainId}`;

export async function setMissionSchedule(chainId: string, config: any) {
  await kv.set(MISSION_SCHEDULE_KEY(chainId), config);
}

export async function getMissionSchedule(chainId: string) {
  return kv.get(MISSION_SCHEDULE_KEY(chainId));
}
