"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AcceptInviteButton({ token }: { token: string }) {
  const [status, setStatus] = useState<string | null>(null);
  const router = useRouter();

  const handleAccept = async () => {
    setStatus("Joining…");
    const response = await fetch("/api/invite/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (!response.ok) {
      const detail = await response.json().catch(() => ({}));
      setStatus(detail.error || "Unable to join");
      return;
    }
    setStatus("Joined! Redirecting…");
    router.replace("/network");
    router.refresh();
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleAccept}
        className="w-full rounded-full bg-white/90 py-3 text-black transition hover:bg-white"
      >
        Accept invite
      </button>
      {status && <p className="text-center text-sm text-white/60">{status}</p>}
    </div>
  );
}
