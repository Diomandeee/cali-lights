import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { findUserByApiKey, UserRecord } from "@/lib/data/users";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string | null) {
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}

export async function requireUser(request: NextRequest): Promise<UserRecord> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("AUTH_MISSING");
  }
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) {
    throw new Error("AUTH_INVALID");
  }
  const user = await findUserByApiKey(token);
  if (!user) {
    throw new Error("AUTH_INVALID");
  }
  return user;
}
