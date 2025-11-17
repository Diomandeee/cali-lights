"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type StartMissionButtonProps = {
  missionId: string;
  chainName: string;
  className?: string;
};

export function StartMissionButton({ missionId, chainName, className }: StartMissionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleStart() {
    setIsLoading(true);
    try {
      // Navigate to mission page - it will auto-join
      router.push(`/mission/${missionId}`);
    } catch (error) {
      console.error("Failed to start mission:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      onClick={handleStart}
      disabled={isLoading}
      className={`rounded-xl sm:rounded-2xl bg-gradient-to-r from-white/90 to-white/80 px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-black transition-all active:from-white active:to-white disabled:opacity-50 touch-manipulation min-h-[44px] whitespace-nowrap ${className}`}
    >
      {isLoading ? "Starting..." : "Start Mission →"}
    </button>
  );
}

