// Realtime utilities for multiplayer synchronization
// This uses Ably for WebSocket connections
import Ably from "ably";
import type { RealtimeEvent, SessionState, RoundState } from "./types";

// Initialize Ably client (server-side)
export function getAblyServerClient() {
  if (!process.env.ABLY_API_KEY) {
    // Return a mock client that does nothing
    return {
      channels: {
        get: () => ({
          publish: async () => {},
        }),
      },
      auth: {
        createTokenRequest: async () => ({}),
      },
    } as any;
  }
  return new Ably.Rest({ key: process.env.ABLY_API_KEY });
}

// Generate auth token for client (server-side)
export async function generateAblyToken(
  clientId: string
): Promise<any> {
  const client = getAblyServerClient();
  const tokenRequest = await client.auth.createTokenRequest({
    clientId,
    capability: {
      "*": ["subscribe", "publish", "presence"],
    },
  });
  return tokenRequest;
}

// Channel naming
export const getSessionChannel = (sessionId: string) => `session:${sessionId}`;
export const getRoundChannel = (sessionId: string, roundId: string) =>
  `session:${sessionId}:round:${roundId}`;
export const getMissionChannel = (missionId: string) => `mission:${missionId}`;

// Event types
export enum RealtimeEventType {
  // Session events
  SESSION_STATE_CHANGE = "session:state:change",
  PARTICIPANT_JOIN = "participant:join",
  PARTICIPANT_LEAVE = "participant:leave",

  // Round events
  ROUND_START = "round:start",
  ROUND_END = "round:end",
  ROUND_SCORE_UPDATE = "round:score:update",

  // Player actions
  PLAYER_ACTION = "player:action",
  PLAYER_TAP = "player:tap",
  PLAYER_VOTE = "player:vote",
  PLAYER_INPUT = "player:input",

  // Unlock events
  UNLOCK_TRIGGERED = "unlock:triggered",
  RECAP_READY = "recap:ready",
}

export enum MissionRealtimeEvent {
  STATE = "mission:state",
  PROGRESS = "mission:progress",
  CHAPTER_READY = "mission:chapter",
}

// Publish helpers (server-side)
export async function publishSessionEvent(
  sessionId: string,
  event: RealtimeEvent
): Promise<void> {
  const client = getAblyServerClient();
  const channel = client.channels.get(getSessionChannel(sessionId));
  await channel.publish(event.type, event.data);
}

export async function publishSessionStateChange(
  sessionId: string,
  state: SessionState,
  data?: any
): Promise<void> {
  await publishSessionEvent(sessionId, {
    type: RealtimeEventType.SESSION_STATE_CHANGE,
    data: { state, ...data },
    timestamp: Date.now(),
  });
}

export async function publishRoundStart(
  sessionId: string,
  roundState: RoundState
): Promise<void> {
  await publishSessionEvent(sessionId, {
    type: RealtimeEventType.ROUND_START,
    data: roundState,
    timestamp: Date.now(),
  });
}

export async function publishRoundEnd(
  sessionId: string,
  roundNumber: number,
  score: number
): Promise<void> {
  await publishSessionEvent(sessionId, {
    type: RealtimeEventType.ROUND_END,
    data: { roundNumber, score },
    timestamp: Date.now(),
  });
}

export async function publishScoreUpdate(
  sessionId: string,
  score: number,
  progress?: number
): Promise<void> {
  await publishSessionEvent(sessionId, {
    type: RealtimeEventType.ROUND_SCORE_UPDATE,
    data: { score, progress },
    timestamp: Date.now(),
  });
}

export async function publishParticipantJoin(
  sessionId: string,
  userId: string,
  nickname: string
): Promise<void> {
  await publishSessionEvent(sessionId, {
    type: RealtimeEventType.PARTICIPANT_JOIN,
    data: { userId, nickname },
    timestamp: Date.now(),
  });
}

export async function publishUnlockTriggered(
  sessionId: string,
  unlockData: any
): Promise<void> {
  await publishSessionEvent(sessionId, {
    type: RealtimeEventType.UNLOCK_TRIGGERED,
    data: unlockData,
    timestamp: Date.now(),
  });
}

export async function publishRecapReady(
  sessionId: string,
  recapId: string
): Promise<void> {
  await publishSessionEvent(sessionId, {
    type: RealtimeEventType.RECAP_READY,
    data: { recapId },
    timestamp: Date.now(),
  });
}

// Mission channels
async function publishMissionEvent(
  missionId: string,
  name: MissionRealtimeEvent,
  data: any
) {
  try {
    const client = getAblyServerClient();
    const channel = client.channels.get(getMissionChannel(missionId));
    await channel.publish(name, data);
  } catch (error) {
    console.warn("Failed to publish mission event (Ably may not be configured):", error);
  }
}

export async function publishMissionState(
  missionId: string,
  state: string
) {
  await publishMissionEvent(missionId, MissionRealtimeEvent.STATE, {
    state,
    timestamp: Date.now(),
  });
}

export async function publishMissionProgress(params: {
  missionId: string;
  submissionsReceived: number;
  submissionsRequired: number;
  entryUserId?: string;
}) {
  await publishMissionEvent(
    params.missionId,
    MissionRealtimeEvent.PROGRESS,
    {
      submissionsReceived: params.submissionsReceived,
      submissionsRequired: params.submissionsRequired,
      entryUserId: params.entryUserId,
      timestamp: Date.now(),
    }
  );
}

export async function publishMissionChapterReady(
  missionId: string,
  chapterId: string
) {
  await publishMissionEvent(
    missionId,
    MissionRealtimeEvent.CHAPTER_READY,
    {
      chapterId,
      timestamp: Date.now(),
    }
  );
}

// Client-side hook helper types (to be used in React components)
export interface UseRealtimeOptions {
  sessionId: string;
  userId?: string;
  onStateChange?: (state: SessionState, data?: any) => void;
  onRoundStart?: (roundState: RoundState) => void;
  onRoundEnd?: (roundNumber: number, score: number) => void;
  onScoreUpdate?: (score: number, progress?: number) => void;
  onParticipantJoin?: (userId: string, nickname: string) => void;
  onParticipantLeave?: (userId: string) => void;
  onUnlockTriggered?: (data: any) => void;
  onRecapReady?: (recapId: string) => void;
}
