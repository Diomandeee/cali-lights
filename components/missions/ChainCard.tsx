"use client";

import Link from "next/link";
import { StartMissionButton } from "./StartMissionButton";

type ChainCardProps = {
  chain: {
    id: string;
    name: string;
    description: string | null;
    palette: any;
    mission_id: string | null;
    mission_prompt: string | null;
    mission_state: string | null;
    mission_submissions_received: number | null;
    mission_submissions_required: number | null;
    chapter_count: number;
  };
};

export function ChainCard({ chain }: ChainCardProps) {
  const palette = Array.isArray(chain.palette) 
    ? chain.palette 
    : typeof chain.palette === 'string' 
      ? JSON.parse(chain.palette) 
      : [];
  const primaryColor = palette[0] || "#666";

  return (
    <Link
      href={`/chain/${chain.id}`}
      className="group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-6 transition-all active:border-white/20 active:bg-white/10 touch-manipulation"
    >
      {/* Color accent */}
      <div
        className="absolute inset-0 opacity-10 transition-opacity group-hover:opacity-20"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}22, ${primaryColor}44)`,
        }}
      />
      
      <div className="relative space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg sm:text-xl font-semibold truncate">{chain.name}</h3>
            {chain.description && (
              <p className="mt-1 text-xs sm:text-sm text-white/60 line-clamp-2">
                {chain.description}
              </p>
            )}
          </div>
          {/* Palette preview */}
          <div className="flex gap-1 flex-shrink-0">
            {palette.slice(0, 3).map((color: string, i: number) => (
              <div
                key={i}
                className="h-3 w-3 sm:h-4 sm:w-4 rounded-full border border-white/20"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Active Mission */}
        {chain.mission_id && (
          <div className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[10px] sm:text-xs uppercase tracking-wider text-white/40">
                Active Mission
              </span>
              <span className={`text-[10px] sm:text-xs font-medium whitespace-nowrap ${
                chain.mission_state === "LOBBY" ? "text-blue-400" :
                chain.mission_state === "CAPTURE" ? "text-yellow-400" :
                chain.mission_state === "FUSING" ? "text-purple-400" :
                chain.mission_state === "RECAP" ? "text-green-400" :
                "text-white/60"
              }`}>
                {chain.mission_state}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium leading-tight">{chain.mission_prompt}</p>
            {chain.mission_submissions_received !== null && (
              <p className="mt-2 text-[10px] sm:text-xs text-white/60">
                {chain.mission_submissions_received}/{chain.mission_submissions_required} submissions
              </p>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] sm:text-xs text-white/50">
            {chain.chapter_count} chapters
          </span>
          {chain.mission_id && chain.mission_state === "LOBBY" && (
            <div onClick={(e) => e.stopPropagation()}>
              <StartMissionButton
                missionId={chain.mission_id}
                chainName={chain.name}
              />
            </div>
          )}
          {chain.mission_id && chain.mission_state !== "LOBBY" && (
            <div onClick={(e) => e.stopPropagation()}>
              <Link
                href={`/mission/${chain.mission_id}`}
                className="inline-block rounded-lg sm:rounded-xl border border-white/20 bg-white/5 px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-medium transition active:bg-white/10 touch-manipulation whitespace-nowrap"
              >
                View →
              </Link>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

