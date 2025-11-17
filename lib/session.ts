import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  findUserByApiKey,
  UserRecord,
  updateUserApiKey,
} from "@/lib/data/users";

const TOKEN_COOKIE = "cali_token";

export async function getSessionToken(): Promise<string | null> {
  const token = cookies().get(TOKEN_COOKIE)?.value;
  return token ?? null;
}

export async function getCurrentUser(): Promise<UserRecord | null> {
  const token = await getSessionToken();
  if (!token) return null;
  const user = await findUserByApiKey(token);
  return user;
}

export async function requireCurrentUser(): Promise<UserRecord> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function refreshSessionToken(userId: string) {
  const refreshed = await updateUserApiKey(userId);
  cookies().set(TOKEN_COOKIE, refreshed.api_key ?? "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return refreshed;
}
