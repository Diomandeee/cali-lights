import { randomUUID } from "node:crypto";
import { sql } from "@/lib/db/client";

export type UserRecord = {
  id: string;
  email: string;
  name: string | null;
  handle: string | null;
  avatar_url: string | null;
  role: string;
  api_key: string | null;
  password_hash: string | null;
  notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export async function createUserRecord(params: {
  email: string;
  passwordHash: string;
  name?: string;
  handle?: string;
}): Promise<UserRecord> {
  const apiKey = randomUUID();
  const result = await sql<UserRecord>`
    INSERT INTO users (email, password_hash, name, handle, api_key)
    VALUES (${params.email}, ${params.passwordHash}, ${params.name || null}, ${
      params.handle || null
    }, ${apiKey})
    RETURNING *
  `;
  return result.rows[0];
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const result = await sql<UserRecord>`
    SELECT * FROM users WHERE email = ${email} LIMIT 1
  `;
  return result.rows[0] ?? null;
}

export async function findUserByApiKey(apiKey: string): Promise<UserRecord | null> {
  const result = await sql<UserRecord>`
    SELECT * FROM users WHERE api_key = ${apiKey} LIMIT 1
  `;
  return result.rows[0] ?? null;
}

export async function updateUserApiKey(userId: string): Promise<UserRecord> {
  const newKey = randomUUID();
  const result = await sql<UserRecord>`
    UPDATE users
    SET api_key = ${newKey}, updated_at = NOW()
    WHERE id = ${userId}
    RETURNING *
  `;
  return result.rows[0];
}
