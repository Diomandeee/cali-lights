"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { OrbitNodeCard } from "@cali/ui/OrbitNodeCard";

type ChainNode = {
  id: string;
  name: string;
  dominant_hue: number | null;
  streak_days: number;
  active_mission_id?: string | null;
};

type MissionNode = {
  id: string;
  chain_id: string;
  prompt: string;
  state: string;
  submissions_received: number;
  submissions_required: number;
};

type Connection = {
  id: string;
  from_chain_id: string;
  to_chain_id: string;
};

type OrbitMapProps = {
  chains: ChainNode[];
  connections: Connection[];
  missions?: MissionNode[];
};

export function OrbitMap({ chains, connections, missions = [] }: OrbitMapProps) {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [selectedChain, setSelectedChain] = useState<string | null>(null);
  const [hoveredChain, setHoveredChain] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Only show active missions (not archived)
  const activeMissions = useMemo(() => {
    return missions.filter(m => 
      m.state === "LOBBY" || m.state === "CAPTURE" || m.state === "FUSING" || m.state === "RECAP"
    );
  }, [missions]);

  const placements = useMemo(() => {
    const radius = isMobile ? 120 : 180;
    const centerRadius = isMobile ? 60 : 100;
    
    // Place chains in a circle, with better spacing
    return chains.map((chain, index) => {
      const angle = (index / Math.max(1, chains.length)) * Math.PI * 2 - Math.PI / 2;
      return {
        chain,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        angle,
      };
    });
  }, [chains, isMobile]);

  const coords = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    placements.forEach(({ chain, x, y }) => {
      map.set(chain.id, { x, y });
    });
    return map;
  }, [placements]);

  const handleChainClick = (chainId: string) => {
    router.push(`/chain/${chainId}`);
  };

  // Group missions by chain
  const missionsByChain = useMemo(() => {
    const map = new Map<string, MissionNode[]>();
    activeMissions.forEach(mission => {
      const existing = map.get(mission.chain_id) || [];
      map.set(mission.chain_id, [...existing, mission]);
    });
    return map;
  }, [activeMissions]);

  return (
    <div className="relative w-full">
      <div 
        className="relative h-[500px] sm:h-[600px] md:h-[700px] w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-gradient-to-br from-black via-[#0a0a1a] to-black"
      >
        {/* Subtle Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5" />
        
        {/* Minimal Grid Pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-10">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* SVG Container for connections */}
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox={isMobile ? "-200 -200 400 400" : "-250 -250 500 500"}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Connection Lines - Only show on hover */}
          {connections.map((connection) => {
            const from = coords.get(connection.from_chain_id);
            const to = coords.get(connection.to_chain_id);
            if (!from || !to) return null;

            const isVisible = hoveredChain === connection.from_chain_id || 
                            hoveredChain === connection.to_chain_id ||
                            selectedChain === connection.from_chain_id ||
                            selectedChain === connection.to_chain_id;

            return (
              <motion.line
                key={`${connection.from_chain_id}-${connection.to_chain_id}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="url(#connectionGradient)"
                strokeWidth="1.5"
                strokeDasharray="3 3"
                initial={{ opacity: 0 }}
                animate={{ opacity: isVisible ? 0.4 : 0 }}
                transition={{ duration: 0.3 }}
              />
            );
          })}
        </svg>

        {/* Chain Nodes */}
        {placements.map(({ chain, x, y }, index) => {
          const chainMissions = missionsByChain.get(chain.id) || [];
          const activeMissionCount = chainMissions.length;
          const hasActiveMissions = activeMissionCount > 0;
          
          return (
            <motion.div
              key={chain.id}
              className="absolute cursor-pointer group"
              style={{
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                translateX: "-50%",
                translateY: "-50%",
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: selectedChain === chain.id ? 1.1 : 1, 
                opacity: 1,
              }}
              transition={{ 
                type: "spring",
                stiffness: 200,
                damping: 15,
                delay: index * 0.08
              }}
              onClick={() => handleChainClick(chain.id)}
              onMouseEnter={() => setHoveredChain(chain.id)}
              onMouseLeave={() => setHoveredChain(null)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <OrbitNodeCard
                name={chain.name}
                hue={chain.dominant_hue ?? 200}
                streak={chain.streak_days}
                active={selectedChain === chain.id}
                onClick={() => handleChainClick(chain.id)}
              />
              
              {/* Active Mission Badge - Clean and minimal */}
              {hasActiveMissions && (
                <motion.div
                  className="absolute -top-1 -right-1 h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-[10px] sm:text-xs font-bold text-white shadow-lg border-2 border-black/20"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.08, type: "spring" }}
                >
                  {activeMissionCount}
                </motion.div>
              )}
            </motion.div>
          );
        })}

        {/* Center Info - Show selected chain info */}
        {selectedChain && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-xl bg-black/80 backdrop-blur-xl border border-white/10 text-center"
          >
            <p className="text-xs text-white/60 mb-1">Click to view chain</p>
            <p className="text-sm font-medium text-white">Tap anywhere to close</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
