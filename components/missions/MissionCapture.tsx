"use client";

import { FormEvent, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MissionPresence } from "@/lib/hooks/useMissionRealtime";

type MissionCaptureProps = {
  missionId: string;
  prompt: string;
  submissions: {
    received: number;
    required: number;
  };
  presence: MissionPresence[];
};

export function MissionCapture({
  missionId,
  prompt,
  submissions,
  presence,
}: MissionCaptureProps) {
  const [uploadTarget, setUploadTarget] = useState<{
    url: string;
    expiresAt: string;
  } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [altText, setAltText] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const join = async () => {
      try {
        const response = await fetch("/api/mission/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ missionId }),
        });
        if (!response.ok) return;
        const json = await response.json();
        setUploadTarget(json.upload);
      } catch (error) {
        console.warn("Join mission failed", error);
      }
    };
    join();
  }, [missionId]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!file) {
      setStatus("Select a file first.");
      return;
    }
    try {
      setIsSubmitting(true);
      setStatus("Uploading…");
      const metadata = JSON.stringify({ missionId, note: altText });
      const formData = new FormData();
      formData.append("file", file);
      formData.append("metadata", metadata);
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!uploadResponse.ok) {
        throw new Error("Upload failed");
      }
      const uploadJson = await uploadResponse.json();
      setStatus("Committing entry…");
      const commitResponse = await fetch("/api/entry/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          missionId,
          mediaUrl: uploadJson.url,
          mediaType: file.type.startsWith("video") ? "video" : "photo",
          altText,
        }),
      });
      if (!commitResponse.ok) {
        const detail = await commitResponse.json().catch(() => ({}));
        throw new Error(detail.error || "Entry commit failed");
      }
      setStatus("✅ Entry submitted successfully!");
      setFile(null);
      setAltText("");
      // Clear status after 3 seconds
      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      setStatus((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const progressPercent = (submissions.received / submissions.required) * 100;

  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-gradient-to-br from-black/80 via-white/5 to-black/80 p-4 sm:p-6 md:p-8">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-red-500/10" />
      
      <div className="relative z-10 space-y-6 sm:space-y-8">
        <div className="space-y-2 sm:space-y-3">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[10px] sm:text-xs uppercase tracking-[0.3em] sm:tracking-[0.4em] text-white/50"
          >
            Capture
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight"
          >
            {prompt}
          </motion.h2>
          
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Progress</span>
              <span className="font-medium text-white">
                {submissions.received}/{submissions.required}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-400"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>

        <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
          {/* File upload area */}
          <motion.label
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="group relative block cursor-pointer overflow-hidden rounded-xl sm:rounded-2xl border-2 border-dashed border-white/20 bg-white/5 p-6 sm:p-8 text-center transition-all active:border-white/40 active:bg-white/10 touch-manipulation min-h-[140px] sm:min-h-[180px] flex items-center justify-center"
          >
            <input
              type="file"
              accept="image/*,video/*"
              capture="environment"
              className="hidden"
              onChange={(event) => {
                const selected = event.target.files?.[0] ?? null;
                setFile(selected);
              }}
            />
            {file ? (
              <div className="space-y-2">
                <div className="text-3xl sm:text-4xl">📸</div>
                <p className="text-xs sm:text-sm font-medium text-white break-all px-2">
                  {file.name}
                </p>
                <p className="text-[10px] sm:text-xs text-white/50">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                <div className="text-4xl sm:text-5xl">📷</div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-white">
                    Tap to upload photo or video
                  </p>
                  <p className="mt-1 text-[10px] sm:text-xs text-white/50">
                    Supports JPG, PNG, MP4
                  </p>
                </div>
              </div>
            )}
          </motion.label>

          {/* Caption */}
          <motion.label
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="block space-y-2"
          >
            <span className="text-xs sm:text-sm font-medium text-white/70">Caption / note</span>
            <textarea
              value={altText}
              onChange={(event) => setAltText(event.target.value)}
              placeholder="Add a note about this moment..."
              className="w-full rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 backdrop-blur-sm transition-all focus:border-white/30 focus:bg-white/10 focus:outline-none resize-none touch-manipulation"
              rows={3}
            />
          </motion.label>

          {/* Submit button */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            type="submit"
            disabled={!file || isSubmitting}
            className="group relative w-full overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-r from-white/90 to-white/80 py-4 text-sm sm:text-base font-semibold text-black transition-all active:from-white active:to-white disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[48px]"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <motion.div
                  className="h-4 w-4 rounded-full border-2 border-black/20 border-t-black"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                Submitting...
              </span>
            ) : (
              "Commit entry"
            )}
          </motion.button>

          {/* Status messages */}
          {status && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`rounded-xl px-4 py-3 text-sm ${
                status.includes("✅") || status.includes("submitted")
                  ? "bg-green-500/20 text-green-300"
                  : status.includes("Error") || status.includes("failed")
                  ? "bg-red-500/20 text-red-300"
                  : "bg-blue-500/20 text-blue-300"
              }`}
            >
              {status}
            </motion.div>
          )}
        </form>

        {/* Presence */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="space-y-2 sm:space-y-3"
        >
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white/40">
            Presence ({presence.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {presence.map((person, index) => (
              <motion.div
                key={person.userId}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className={`flex items-center gap-1.5 sm:gap-2 rounded-full border px-2.5 py-1.5 sm:px-3 text-[10px] sm:text-xs transition-all touch-manipulation min-h-[32px] ${
                  person.entrySubmitted
                    ? "border-green-400/50 bg-green-400/10 text-green-300"
                    : "border-white/10 bg-white/5 text-white/70"
                }`}
              >
                <div className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full flex-shrink-0 ${
                  person.entrySubmitted ? "bg-green-400" : "bg-white/40"
                }`} />
                <span className="font-medium truncate max-w-[100px] sm:max-w-none">
                  {person.name ?? person.userId.slice(0, 8)}
                </span>
                {person.entrySubmitted && <span className="flex-shrink-0">✓</span>}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
