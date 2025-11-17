"use client";

import { useState, useEffect, FormEvent } from "react";
import { AnalyticsBoard } from "@/components/admin/AnalyticsBoard";

type ChainOption = {
  id: string;
  name: string;
};

type AdminPanelProps = {
  chains: ChainOption[];
  metrics: {
    total_missions: number;
    archived: number;
    avg_duration: number | null;
  };
};

export function AdminPanel({ chains, metrics }: AdminPanelProps) {
  const [missionPrompt, setMissionPrompt] = useState("");
  const [missionWindow, setMissionWindow] = useState(3600);
  const [selectedChain, setSelectedChain] = useState(chains[0]?.id ?? "");
  const [status, setStatus] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<{
    missions: { total: number; completed: number; completionRate: number; avgMinutes: number | null };
    videoOperations: { totalCost: number; failed: number; succeeded: number; pending: number; successRate: number };
    palette: Array<{ color: string; count: number }>;
    streak: Array<{ day: string; completed: number }>;
    currentStreak: number;
  } | null>(null);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setAnalyticsError(null);
        const params = selectedChain ? `?chainId=${selectedChain}` : "";
        const response = await fetch(`/api/admin/analytics${params}`);
        if (!response.ok) {
          throw new Error("Failed to load analytics");
        }
        setAnalytics(await response.json());
      } catch (error) {
        setAnalyticsError((error as Error).message);
      }
    }
    loadAnalytics();
  }, [selectedChain]);

  const handleMission = async (event: FormEvent) => {
    event.preventDefault();
    setStatus("Starting mission…");
    const response = await fetch("/api/mission/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chainId: selectedChain,
        prompt: missionPrompt,
        windowSeconds: missionWindow,
      }),
    });
    if (!response.ok) {
      setStatus("Mission launch failed");
      return;
    }
    setStatus("Mission started");
  };

  const handleInvite = async () => {
    setStatus("Minting invite…");
    const response = await fetch("/api/invite/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chainId: selectedChain }),
    });
    if (!response.ok) {
      setStatus("Invite creation failed");
      return;
    }
    const json = await response.json();
    setStatus(`Invite ready: ${json.invite.invite_url}`);
  };

  const handleSchedule = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload = {
      chainId: selectedChain,
      timezone: data.get("timezone"),
      windowSeconds: Number(data.get("windowSeconds")),
      promptTemplate: data.get("promptTemplate"),
      autoStartAt: data.get("autoStartAt"),
      enabled: data.get("enabled") === "on",
    };
    setStatus("Saving schedule…");
    const response = await fetch("/api/admin/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      setStatus("Schedule save failed");
      return;
    }
    setStatus("Schedule updated");
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Missions total" value={metrics.total_missions} />
        <MetricCard
          label="Completion rate"
          value={
            metrics.total_missions
              ? Math.round((metrics.archived / metrics.total_missions) * 100) + "%"
              : "—"
          }
        />
        <MetricCard
          label="Avg completion (min)"
          value={
            metrics.avg_duration
              ? Math.round((Number(metrics.avg_duration) / 60) * 10) / 10
              : "—"
          }
        />
      </div>
      {analyticsError && (
        <p className="text-sm text-red-300">{analyticsError}</p>
      )}
      {analytics && <AnalyticsBoard analytics={analytics} />}
      <div className="space-y-4 rounded-3xl border border-white/10 p-6">
        <h2 className="text-lg font-semibold">Start mission</h2>
        <form className="space-y-4" onSubmit={handleMission}>
          <select
            value={selectedChain}
            onChange={(event) => setSelectedChain(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-transparent px-3 py-2 text-sm text-white/80"
          >
            {chains.map((chain) => (
              <option key={chain.id} value={chain.id} className="bg-black">
                {chain.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Golden hour. Capture warmth."
            value={missionPrompt}
            onChange={(event) => setMissionPrompt(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-transparent px-3 py-2"
          />
          <label className="flex items-center justify-between text-sm text-white/70">
            Window (seconds)
            <input
              type="number"
              value={missionWindow}
              onChange={(event) => setMissionWindow(Number(event.target.value))}
              className="w-32 rounded-2xl border border-white/10 bg-transparent px-3 py-2 text-right"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-2xl bg-white/90 py-3 text-black transition hover:bg-white"
          >
            Start mission
          </button>
        </form>
      </div>

      <div className="rounded-3xl border border-white/10 p-6">
        <h2 className="text-lg font-semibold">Invite</h2>
        <p className="text-sm text-white/60">
          Generate a per-chain invite link with QR.
        </p>
        <button
          type="button"
          onClick={handleInvite}
          className="mt-4 rounded-2xl border border-white/20 px-4 py-2 text-sm"
        >
          Mint invite
        </button>
      </div>

      <div className="rounded-3xl border border-white/10 p-6" id="schedule">
        <h2 className="text-lg font-semibold">Schedule</h2>
        <form className="mt-4 grid gap-4" onSubmit={handleSchedule}>
          <label className="text-sm text-white/70">
            Timezone
            <input
              name="timezone"
              defaultValue="America/Los_Angeles"
              className="mt-1 w-full rounded-2xl border border-white/10 bg-transparent px-3 py-2"
            />
          </label>
          <label className="text-sm text-white/70">
            Prompt template
            <input
              name="promptTemplate"
              defaultValue="Golden hour. Capture {light}."
              className="mt-1 w-full rounded-2xl border border-white/10 bg-transparent px-3 py-2"
            />
          </label>
          <label className="text-sm text-white/70">
            Auto start time (HH:MM)
            <input
              name="autoStartAt"
              defaultValue="18:00"
              className="mt-1 w-full rounded-2xl border border-white/10 bg-transparent px-3 py-2"
            />
          </label>
          <label className="text-sm text-white/70">
            Window seconds
            <input
              name="windowSeconds"
              type="number"
              defaultValue={3600}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-transparent px-3 py-2"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-white/70">
            <input name="enabled" type="checkbox" defaultChecked className="rounded" />
            Enabled
          </label>
          <button
            type="submit"
            className="rounded-2xl border border-white/20 px-4 py-2 text-sm"
          >
            Save schedule
          </button>
        </form>
      </div>

      {status && (
        <p className="text-sm text-white/60" aria-live="polite">
          {status}
        </p>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-3xl border border-white/10 p-4">
      <p className="text-xs uppercase tracking-[0.3em] text-white/40">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}
