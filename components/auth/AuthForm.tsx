"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

type Mode = "login" | "register";

export function AuthForm() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const endpoint =
        mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload: Record<string, string> = {
        email,
        password,
      };
      if (mode === "register") {
        payload.name = name;
        payload.handle = handle;
      }
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const detail = await response.json().catch(() => ({}));
        throw new Error(detail?.error || "Unable to authenticate");
      }
      router.replace("/network");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-3xl border border-white/10 bg-black/40 p-8 shadow-2xl backdrop-blur">
      <div className="flex items-center justify-between">
        <button
          className={`text-lg font-semibold transition ${
            mode === "login" ? "text-white" : "text-white/40"
          }`}
          onClick={() => setMode("login")}
          type="button"
          disabled={loading}
        >
          Login
        </button>
        <button
          className={`text-lg font-semibold transition ${
            mode === "register" ? "text-white" : "text-white/40"
          }`}
          onClick={() => setMode("register")}
          type="button"
          disabled={loading}
        >
          Register
        </button>
      </div>

      <form className="mt-8 space-y-4" onSubmit={onSubmit}>
        <label className="block text-sm text-white/70">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white focus:border-white focus:outline-none"
          />
        </label>

        {mode === "register" && (
          <>
            <label className="block text-sm text-white/70">
              Name
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white focus:border-white focus:outline-none"
              />
            </label>
            <label className="block text-sm text-white/70">
              Handle
              <input
                type="text"
                value={handle}
                onChange={(event) => setHandle(event.target.value)}
                className="mt-1 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white focus:border-white focus:outline-none"
              />
            </label>
          </>
        )}

        <label className="block text-sm text-white/70">
          Password
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white focus:border-white focus:outline-none"
          />
        </label>

        {error && (
          <p className="rounded-2xl bg-red-500/20 px-4 py-2 text-sm text-red-200">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-gradient-to-r from-cali-magenta via-cali-purple to-cali-pink py-3 text-lg font-semibold text-white shadow-lg transition disabled:opacity-50"
        >
          {loading ? "Please wait..." : mode === "login" ? "Login" : "Register"}
        </button>
      </form>
    </div>
  );
}
