 "use client";

import { motion } from "framer-motion";
import { cn } from "./cn";

type OrbitNodeCardProps = {
  name: string;
  hue: number;
  streak: number;
  active?: boolean;
  onClick?: () => void;
};

export function OrbitNodeCard({
  name,
  hue,
  streak,
  active,
  onClick,
}: OrbitNodeCardProps) {
  const size = Math.min(120, 80 + streak * 4);
  
  return (
    <motion.button
      type="button"
      onClick={onClick}
      style={{
        width: size,
        height: size,
        borderColor: `hsl(${hue} 70% 60%)`,
      }}
      className={cn(
        "group relative flex flex-col items-center justify-center rounded-full border-2 bg-gradient-to-br from-black/80 via-black/60 to-black/80 text-white transition-all duration-300",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
        active ? "ring-4 ring-white/60 shadow-[0_0_20px_rgba(255,255,255,0.3)]" : "ring-0"
      )}
      whileHover={{ 
        scale: 1.1,
        transition: { type: "spring", stiffness: 300, damping: 20 }
      }}
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        type: "spring", 
        stiffness: 200, 
        damping: 15,
        delay: 0.1
      }}
      aria-pressed={active}
    >
      {/* Hover gradient overlay */}
      <div
        className="absolute inset-0 rounded-full bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `linear-gradient(135deg, hsl(${hue} 70% 50% / 0.3), hsl(${hue} 70% 40% / 0.2), hsl(${hue} 70% 50% / 0.3))`,
        }}
      />
      
      {/* Glowing border */}
      <div
        className="absolute inset-0 rounded-full opacity-60 blur-sm transition-opacity group-hover:opacity-100"
        style={{
          border: `2px solid hsl(${hue} 70% 60%)`,
          boxShadow: `0 0 20px hsl(${hue} 70% 50% / 0.5), inset 0 0 20px hsl(${hue} 70% 50% / 0.2)`,
        }}
      />
      
      {/* Inner border */}
      <div
        className="absolute inset-[2px] rounded-full"
        style={{
          border: `1px solid hsl(${hue} 70% 60% / 0.6)`,
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-1 px-3">
        <span className="block text-center text-sm font-semibold leading-tight tracking-wide">
          {name}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium text-white/80">
            {streak}
          </span>
          <span className="text-[9px] text-white/50">
            {streak === 1 ? "day" : "days"}
          </span>
        </div>
        <span className="text-[9px] uppercase tracking-wider text-white/40">
          streak
        </span>
      </div>
      
      {/* Pulse effect for active */}
      {active && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            border: `2px solid hsl(${hue} 70% 60%)`,
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.6, 0, 0.6],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
    </motion.button>
  );
}
