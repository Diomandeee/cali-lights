"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { PaletteChip } from "@cali/ui/PaletteChip";

type MissionRecapProps = {
  missionId: string;
  chapter: {
    id: string;
    videoUrl: string | null;
    collageUrl: string | null;
    finalPalette: string[];
    poem: string | null;
    isShareable: boolean;
    shareUrl: string | null;
  };
};

export function MissionRecap({ missionId, chapter }: MissionRecapProps) {
  const [shareState, setShareState] = useState({
    shareable: chapter.isShareable,
    url: chapter.shareUrl,
    status: "",
  });

  const toggleShare = async () => {
    try {
      const response = await fetch("/api/chapter/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapterId: chapter.id,
          on: !shareState.shareable,
        }),
      });
      if (!response.ok) throw new Error("Share toggle failed");
      const data = await response.json();
      setShareState({
        shareable: data.shareable,
        url: data.url,
        status: data.shareable ? "Share link created" : "Share disabled",
      });
    } catch (error) {
      setShareState((prev) => ({
        ...prev,
        status: (error as Error).message,
      }));
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-gradient-to-br from-black/80 via-white/5 to-black/80 p-4 sm:p-6 md:p-8">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-teal-500/10" />
      
      <div className="relative z-10 space-y-6 sm:space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] sm:tracking-[0.4em] text-white/50">
            Recap
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold">Chapter ready</h2>
          <p className="text-xs sm:text-sm text-white/60">
            Your visual story is complete. Save, share, or start a new mission.
          </p>
        </motion.div>

        {/* Media display */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="overflow-hidden rounded-xl sm:rounded-2xl border border-white/10 bg-black/40 shadow-2xl"
        >
          {chapter.videoUrl ? (
            <video
              src={chapter.videoUrl}
              className="w-full"
              controls
              playsInline
              muted
              autoPlay
              loop
            />
          ) : chapter.collageUrl ? (
            <img
              src={chapter.collageUrl}
              alt="Chapter collage"
              className="w-full object-cover"
            />
          ) : (
            <div className="rounded-xl sm:rounded-2xl border border-dashed border-white/20 p-8 sm:p-12 text-center text-white/60">
              <div className="text-3xl sm:text-4xl mb-2">⏳</div>
              <p className="text-xs sm:text-sm">Waiting for video render…</p>
            </div>
          )}
        </motion.div>

        {/* Poem */}
        {chapter.poem && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6 text-center"
          >
            <p className="text-base sm:text-lg md:text-xl leading-relaxed text-white/90 italic">
              {chapter.poem}
            </p>
          </motion.div>
        )}

        {/* Palette */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-2 sm:space-y-3"
        >
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white/40">
            Palette
          </p>
          <div className="flex flex-wrap gap-2">
            {chapter.finalPalette.map((hex, index) => (
              <motion.div
                key={hex}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.05 }}
              >
                <PaletteChip hex={hex} />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col gap-3"
        >
          <button
            type="button"
            onClick={toggleShare}
            className="rounded-xl sm:rounded-2xl border border-white/20 bg-white/10 px-4 py-3 sm:px-6 text-xs sm:text-sm font-medium text-white transition-all active:border-white/40 active:bg-white/20 touch-manipulation min-h-[48px]"
          >
            {shareState.shareable ? "🔗 Share link active" : "✨ Create share link"}
          </button>
          {shareState.url && (
            <div className="rounded-lg sm:rounded-xl border border-white/10 bg-white/5 p-3 sm:p-4">
              <p className="mb-2 text-[10px] sm:text-xs text-white/50">Share URL:</p>
              <p className="break-all text-[10px] sm:text-xs font-mono text-white/80">
                {shareState.url}
              </p>
            </div>
          )}
          {shareState.status && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[10px] sm:text-xs text-green-400"
            >
              {shareState.status}
            </motion.p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
