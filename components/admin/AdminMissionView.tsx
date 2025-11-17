"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

type MissionDetail = {
  id: string;
  chain_id: string;
  chain_name: string;
  prompt: string;
  state: string;
  window_seconds: number;
  submissions_required: number;
  submissions_received: number;
  starts_at: string;
  ends_at: string | null;
  locked_at: string | null;
  recap_ready_at: string | null;
  archived_at: string | null;
  created_by: string | null;
  created_at: string;
  member_count: number;
  entry_count: number;
  chapter_id: string | null;
  chapter_title: string | null;
  members: Array<{
    user_id: string;
    name: string | null;
    email: string;
    role: string;
  }>;
  entries: Array<{
    id: string;
    user_id: string;
    user_name: string | null;
    user_email: string;
    media_url: string;
    media_type: string;
    captured_at: string;
    dominant_hue: number | null;
    metadata_status: string;
  }>;
  lifecycle: {
    lobbyDuration: number | null;
    captureDuration: number | null;
    totalDuration: number | null;
    currentState: string;
    timeInCurrentState: number;
  };
};

export function AdminMissionView() {
  const [missions, setMissions] = useState<MissionDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMission, setExpandedMission] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "archived">("all");

  useEffect(() => {
    async function fetchMissions() {
      try {
        const response = await fetch("/api/admin/missions");
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        setMissions(data.missions || []);
      } catch (error) {
        console.error("Failed to fetch missions:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchMissions();
  }, []);

  const filteredMissions = missions.filter((m) => {
    if (filter === "active") return !["ARCHIVED"].includes(m.state);
    if (filter === "archived") return m.state === "ARCHIVED";
    return true;
  });

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "—";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getStateColor = (state: string) => {
    const colors: Record<string, string> = {
      LOBBY: "bg-blue-500/20 text-blue-300 border-blue-500/50",
      CAPTURE: "bg-yellow-500/20 text-yellow-300 border-yellow-500/50",
      FUSING: "bg-purple-500/20 text-purple-300 border-purple-500/50",
      RECAP: "bg-green-500/20 text-green-300 border-green-500/50",
      ARCHIVED: "bg-white/10 text-white/60 border-white/20",
    };
    return colors[state] || colors.ARCHIVED;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white/60">Loading missions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-2">
        {(["all", "active", "archived"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === f
                ? "bg-white/20 text-white"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Missions List */}
      <div className="space-y-4">
        {filteredMissions.map((mission) => (
          <motion.div
            key={mission.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden"
          >
            {/* Mission Header */}
            <div
              className="p-6 cursor-pointer"
              onClick={() =>
                setExpandedMission(
                  expandedMission === mission.id ? null : mission.id
                )
              }
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs text-white/40">{mission.chain_name}</span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium border ${getStateColor(
                        mission.state
                      )}`}
                    >
                      {mission.state}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{mission.prompt}</h3>
                  <div className="flex items-center gap-4 text-sm text-white/60">
                    <span>
                      {mission.submissions_received}/{mission.submissions_required}{" "}
                      submissions
                    </span>
                    <span>{mission.member_count} members</span>
                    <span>{mission.entry_count} entries</span>
                    {mission.lifecycle.totalDuration && (
                      <span>Total: {formatDuration(mission.lifecycle.totalDuration)}</span>
                    )}
                  </div>
                </div>
                <div className="text-white/40">
                  {expandedMission === mission.id ? "−" : "+"}
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            <AnimatePresence>
              {expandedMission === mission.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-white/10 bg-black/20"
                >
                  <div className="p-6 space-y-6">
                    {/* Lifecycle Timeline */}
                    <div>
                      <h4 className="text-sm font-semibold mb-3 text-white/80">
                        Lifecycle Timeline
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-white/60">Started</span>
                          <span className="text-white">
                            {new Date(mission.starts_at).toLocaleString()}
                          </span>
                        </div>
                        {mission.locked_at && (
                          <div className="flex items-center justify-between">
                            <span className="text-white/60">Locked (FUSING)</span>
                            <span className="text-white">
                              {new Date(mission.locked_at).toLocaleString()}
                            </span>
                            <span className="text-white/40 text-xs">
                              ({formatDuration(mission.lifecycle.lobbyDuration)})
                            </span>
                          </div>
                        )}
                        {mission.recap_ready_at && (
                          <div className="flex items-center justify-between">
                            <span className="text-white/60">Recap Ready</span>
                            <span className="text-white">
                              {new Date(mission.recap_ready_at).toLocaleString()}
                            </span>
                            {mission.lifecycle.captureDuration && (
                              <span className="text-white/40 text-xs">
                                ({formatDuration(mission.lifecycle.captureDuration)})
                              </span>
                            )}
                          </div>
                        )}
                        {mission.archived_at && (
                          <div className="flex items-center justify-between">
                            <span className="text-white/60">Archived</span>
                            <span className="text-white">
                              {new Date(mission.archived_at).toLocaleString()}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t border-white/10">
                          <span className="text-white/60">Time in {mission.state}</span>
                          <span className="text-white">
                            {formatDuration(mission.lifecycle.timeInCurrentState)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Members */}
                    <div>
                      <h4 className="text-sm font-semibold mb-3 text-white/80">
                        Members ({mission.members.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {mission.members.map((member) => (
                          <div
                            key={member.user_id}
                            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm"
                          >
                            <span className="text-white">{member.name || member.email}</span>
                            <span className="text-white/40 ml-2">({member.role})</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Entries */}
                    <div>
                      <h4 className="text-sm font-semibold mb-3 text-white/80">
                        Entries ({mission.entries.length})
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {mission.entries.map((entry) => (
                          <div
                            key={entry.id}
                            className="relative aspect-square rounded-lg overflow-hidden bg-white/5 border border-white/10 group"
                          >
                            <img
                              src={entry.media_url}
                              alt={entry.user_name || entry.user_email}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="absolute bottom-0 left-0 right-0 p-2 text-xs">
                                <div className="text-white font-medium">
                                  {entry.user_name || entry.user_email}
                                </div>
                                <div className="text-white/60">
                                  {new Date(entry.captured_at).toLocaleTimeString()}
                                </div>
                                {entry.dominant_hue !== null && (
                                  <div className="text-white/60">
                                    Hue: {entry.dominant_hue}°
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t border-white/10">
                      <Link
                        href={`/mission/${mission.id}`}
                        className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium transition"
                      >
                        View Mission →
                      </Link>
                      {mission.chapter_id && (
                        <Link
                          href={`/chapter/${mission.chapter_id}`}
                          className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium transition"
                        >
                          View Chapter →
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {filteredMissions.length === 0 && (
        <div className="text-center py-12 text-white/60">
          No missions found
        </div>
      )}
    </div>
  );
}

