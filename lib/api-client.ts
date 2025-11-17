import { cookies, headers } from "next/headers";

const DEFAULT_BASE =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

export async function apiFetch<T>(
  input: string,
  init: RequestInit = {}
): Promise<T> {
  const token = cookies().get("cali_token")?.value;
  const base =
    input.startsWith("http://") || input.startsWith("https://")
      ? ""
      : DEFAULT_BASE;
  const response = await fetch(`${base}${input}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`API ${response.status}: ${detail}`);
  }
  return response.json();
}
