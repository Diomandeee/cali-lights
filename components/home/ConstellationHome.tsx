"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

type NetworkData = {
  chains: Array<{
    id: string;
    name: string;
    streak_days: number;
    dominant_hue: number | null;
  }>;
  connections: Array<{
    id: string;
    from_chain_id: string;
    to_chain_id: string;
  }>;
  missions?: Array<{
    id: string;
    chain_id: string;
    prompt: string;
    state: string;
    submissions_received: number;
    submissions_required: number;
  }>;
};

type ActiveMission = {
  id: string;
  chain_id: string;
  chain_name: string;
  prompt: string;
  state: string;
  submissions_received: number;
  submissions_required: number;
  ends_at: string | null;
};

type DailyUpdate = {
  type: "mission_start" | "mission_reminder" | "recap_ready" | "bridge_event";
  message: string;
  chain_name?: string;
  mission_id?: string;
  timestamp: string;
};

export function QuickUploadButton({ missionId }: { missionId?: string }) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Get upload signature from server
      const signatureRes = await fetch("/api/cloudinary/signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folder: "cali-lights",
          context: missionId ? { missionId } : undefined,
        }),
      });

      if (!signatureRes.ok) throw new Error("Failed to get signature");
      const signatureData = await signatureRes.json();

      // Upload to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", signatureData.apiKey);
      formData.append("timestamp", signatureData.timestamp);
      formData.append("signature", signatureData.signature);
      formData.append("folder", signatureData.folder);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!uploadRes.ok) throw new Error("Upload failed");
      const { secure_url } = await uploadRes.json();

      // If missionId provided, commit as entry
      if (missionId) {
        const response = await fetch("/api/entry/commit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            missionId,
            mediaUrl: secure_url,
            mediaType: file.type.startsWith("video/") ? "video" : "photo",
          }),
        });

        if (!response.ok) throw new Error("Commit failed");
      }

      router.refresh();
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
      <motion.button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full bg-gradient-to-br from-white/90 to-white/80 shadow-lg backdrop-blur-xl transition-all disabled:opacity-50 touch-manipulation"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Quick upload"
      >
        {isUploading ? (
          <motion.div
            className="h-full w-full flex items-center justify-center"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <div className="h-6 w-6 border-2 border-black/20 border-t-black rounded-full" />
          </motion.div>
        ) : (
          <svg
            className="h-8 w-8 text-black mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        )}
      </motion.button>
    </>
  );
}

export function ConstellationHome({
  networkData,
  activeMissions,
  dailyUpdates,
}: {
  networkData: NetworkData;
  activeMissions: ActiveMission[];
  dailyUpdates: DailyUpdate[];
}) {
  const primaryMission = activeMissions[0];
  const hasUpdates = dailyUpdates.length > 0;

  return (
    <div className="space-y-6 sm:space-y-8 pb-24">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight">
          Your Constellation
        </h1>
        <p className="text-sm sm:text-base text-white/60">
          {activeMissions.length > 0 
            ? `${activeMissions.length} active mission${activeMissions.length > 1 ? 's' : ''}`
            : 'No active missions'
          }
          {hasUpdates && ` • ${dailyUpdates.length} update${dailyUpdates.length > 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Active Missions Overview */}
      {activeMissions.length > 0 && (
        <div className="space-y-4">
          {activeMissions.slice(0, 3).map((mission) => (
            <Link
              key={mission.id}
              href={`/mission/${mission.id}`}
              className="block rounded-2xl border border-white/10 bg-white/5 p-4 transition-all hover:border-white/30 hover:bg-white/10"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs text-white/60">{mission.chain_name}</p>
                  <p className="mt-1 font-medium">{mission.prompt}</p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-white/60">
                    <span>
                      {mission.submissions_received}/{mission.submissions_required}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      mission.state === "LOBBY" ? "bg-blue-500/20 text-blue-300" :
                      mission.state === "CAPTURE" ? "bg-yellow-500/20 text-yellow-300" :
                      mission.state === "FUSING" ? "bg-purple-500/20 text-purple-300" :
                      "bg-white/10 text-white/60"
                    }`}>
                      {mission.state}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/missions"
          className="rounded-xl border border-white/10 bg-white/5 p-4 text-center transition-all hover:border-white/30 hover:bg-white/10"
        >
          <p className="text-sm font-medium">View All Missions</p>
        </Link>
        <Link
          href="/gallery"
          className="rounded-xl border border-white/10 bg-white/5 p-4 text-center transition-all hover:border-white/30 hover:bg-white/10"
        >
          <p className="text-sm font-medium">Browse Gallery</p>
        </Link>
      </div>

      {/* Quick Upload Button */}
      <QuickUploadButton missionId={primaryMission?.id} />
    </div>
  );
}
