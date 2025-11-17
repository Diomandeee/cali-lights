"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

type MissionJoinButtonProps = {
  missionId: string;
};

export function MissionJoinButton({ missionId }: MissionJoinButtonProps) {
  const router = useRouter();

  return (
    <motion.button
      onClick={() => router.push(`/mission/${missionId}`)}
      className="w-full rounded-2xl bg-gradient-to-r from-white/90 to-white/80 py-4 text-base font-semibold text-black transition-all hover:from-white hover:to-white"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      Join Mission →
    </motion.button>
  );
}
