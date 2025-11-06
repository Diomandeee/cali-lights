import { sql } from "@vercel/postgres";
import type {
  User,
  Session,
  Participant,
  Round,
  Action,
  Recap,
  Mode,
  SessionState,
  RoundType,
} from "./types";

// Database initialization
export async function initDB() {
  // Users table
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      nickname TEXT NOT NULL,
      instagram TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Sessions table
  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      mode TEXT NOT NULL,
      state TEXT NOT NULL,
      current_round INTEGER,
      host_id TEXT REFERENCES users(id),
      score INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      ended_at TIMESTAMP
    )
  `;

  // Participants table
  await sql`
    CREATE TABLE IF NOT EXISTS participants (
      id TEXT PRIMARY KEY,
      session_id TEXT REFERENCES sessions(id),
      user_id TEXT REFERENCES users(id),
      joined_at TIMESTAMP DEFAULT NOW(),
      is_host BOOLEAN DEFAULT FALSE
    )
  `;

  // Rounds table
  await sql`
    CREATE TABLE IF NOT EXISTS rounds (
      id TEXT PRIMARY KEY,
      session_id TEXT REFERENCES sessions(id),
      round_number INTEGER NOT NULL,
      round_type TEXT NOT NULL,
      duration INTEGER NOT NULL,
      threshold REAL,
      started_at TIMESTAMP DEFAULT NOW(),
      ended_at TIMESTAMP,
      score INTEGER
    )
  `;

  // Actions table
  await sql`
    CREATE TABLE IF NOT EXISTS actions (
      id TEXT PRIMARY KEY,
      round_id TEXT REFERENCES rounds(id),
      user_id TEXT REFERENCES users(id),
      action_type TEXT NOT NULL,
      data JSONB,
      timestamp TIMESTAMP DEFAULT NOW()
    )
  `;

  // Recaps table
  await sql`
    CREATE TABLE IF NOT EXISTS recaps (
      id TEXT PRIMARY KEY,
      session_id TEXT REFERENCES sessions(id),
      palette TEXT,
      toast TEXT,
      playlist_url TEXT,
      final_score INTEGER NOT NULL,
      completion_time INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
}

// User operations
export async function createUser(
  nickname: string,
  instagram?: string
): Promise<User> {
  const id = crypto.randomUUID();
  const result = await sql`
    INSERT INTO users (id, nickname, instagram)
    VALUES (${id}, ${nickname}, ${instagram})
    RETURNING *
  `;
  return result.rows[0] as User;
}

export async function getUser(id: string): Promise<User | null> {
  const result = await sql`
    SELECT * FROM users WHERE id = ${id}
  `;
  return result.rows[0] as User | null;
}

// Session operations
export async function createSession(
  mode: Mode,
  host_id?: string
): Promise<Session> {
  const id = crypto.randomUUID();
  const result = await sql`
    INSERT INTO sessions (id, mode, state, host_id)
    VALUES (${id}, ${mode}, 'lobby', ${host_id})
    RETURNING *
  `;
  return result.rows[0] as Session;
}

export async function getSession(id: string): Promise<Session | null> {
  const result = await sql`
    SELECT * FROM sessions WHERE id = ${id}
  `;
  return result.rows[0] as Session | null;
}

export async function updateSessionState(
  id: string,
  state: SessionState,
  currentRound?: number
): Promise<Session> {
  const result = await sql`
    UPDATE sessions
    SET state = ${state}, current_round = ${currentRound || null}
    WHERE id = ${id}
    RETURNING *
  `;
  return result.rows[0] as Session;
}

export async function updateSessionScore(
  id: string,
  score: number
): Promise<Session> {
  const result = await sql`
    UPDATE sessions
    SET score = ${score}
    WHERE id = ${id}
    RETURNING *
  `;
  return result.rows[0] as Session;
}

export async function endSession(id: string): Promise<Session> {
  const result = await sql`
    UPDATE sessions
    SET state = 'ended', ended_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return result.rows[0] as Session;
}

// Participant operations
export async function addParticipant(
  sessionId: string,
  userId: string,
  isHost: boolean = false
): Promise<Participant> {
  const id = crypto.randomUUID();
  const result = await sql`
    INSERT INTO participants (id, session_id, user_id, is_host)
    VALUES (${id}, ${sessionId}, ${userId}, ${isHost})
    RETURNING *
  `;
  return result.rows[0] as Participant;
}

export async function getSessionParticipants(
  sessionId: string
): Promise<Array<Participant & User>> {
  const result = await sql`
    SELECT p.*, u.nickname, u.instagram
    FROM participants p
    JOIN users u ON p.user_id = u.id
    WHERE p.session_id = ${sessionId}
    ORDER BY p.joined_at
  `;
  return result.rows as Array<Participant & User>;
}

// Round operations
export async function createRound(
  sessionId: string,
  roundNumber: number,
  roundType: RoundType,
  duration: number,
  threshold?: number
): Promise<Round> {
  const id = crypto.randomUUID();
  const result = await sql`
    INSERT INTO rounds (id, session_id, round_number, round_type, duration, threshold)
    VALUES (${id}, ${sessionId}, ${roundNumber}, ${roundType}, ${duration}, ${threshold || null})
    RETURNING *
  `;
  return result.rows[0] as Round;
}

export async function endRound(id: string, score: number): Promise<Round> {
  const result = await sql`
    UPDATE rounds
    SET ended_at = NOW(), score = ${score}
    WHERE id = ${id}
    RETURNING *
  `;
  return result.rows[0] as Round;
}

export async function getSessionRounds(sessionId: string): Promise<Round[]> {
  const result = await sql`
    SELECT * FROM rounds
    WHERE session_id = ${sessionId}
    ORDER BY round_number
  `;
  return result.rows as Round[];
}

// Action operations
export async function logAction(
  roundId: string,
  userId: string,
  actionType: string,
  data: any
): Promise<Action> {
  const id = crypto.randomUUID();
  const result = await sql`
    INSERT INTO actions (id, round_id, user_id, action_type, data)
    VALUES (${id}, ${roundId}, ${userId}, ${actionType}, ${JSON.stringify(data)})
    RETURNING *
  `;
  return result.rows[0] as Action;
}

export async function getRoundActions(roundId: string): Promise<Action[]> {
  const result = await sql`
    SELECT * FROM actions
    WHERE round_id = ${roundId}
    ORDER BY timestamp
  `;
  return result.rows as Action[];
}

// Recap operations
export async function createRecap(
  sessionId: string,
  palette: string,
  toast: string,
  playlistUrl: string,
  finalScore: number,
  completionTime: number
): Promise<Recap> {
  const id = crypto.randomUUID();
  const result = await sql`
    INSERT INTO recaps (id, session_id, palette, toast, playlist_url, final_score, completion_time)
    VALUES (${id}, ${sessionId}, ${palette}, ${toast}, ${playlistUrl}, ${finalScore}, ${completionTime})
    RETURNING *
  `;
  return result.rows[0] as Recap;
}

export async function getSessionRecap(sessionId: string): Promise<Recap | null> {
  const result = await sql`
    SELECT * FROM recaps WHERE session_id = ${sessionId}
  `;
  return result.rows[0] as Recap | null;
}
