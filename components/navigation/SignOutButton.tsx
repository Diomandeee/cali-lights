"use client";

import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.replace("/login");
        router.refresh();
      }}
      className="rounded-full border border-white/20 px-4 py-1 text-sm text-white/70 transition hover:border-white hover:text-white"
    >
      Sign out
    </button>
  );
}
