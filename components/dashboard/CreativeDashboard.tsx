"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type DashboardData = {
  totalMissions: number;
  completedMissions: number;
  activeMissions: number;
  totalChapters: number;
  totalEntries: number;
  streakDays: number;
  palette: Array<{ color: string; count: number }>;
  recentActivity: Array<{
    type: string;
    message: string;
    timestamp: string;
    chain_name: string | null;
  }>;
  chains: Array<{
    id: string;
    name: string;
    streak_days: number;
    mission_count: number;
    chapter_count: number;
  }>;
};

export function CreativeDashboard({ data }: { data: DashboardData }) {
  const router = useRouter();
  const [timeOfDay, setTimeOfDay] = useState<"morning" | "day" | "evening" | "night">("day");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setTimeOfDay("morning");
    else if (hour >= 12 && hour < 17) setTimeOfDay("day");
    else if (hour >= 17 && hour < 21) setTimeOfDay("evening");
    else setTimeOfDay("night");
  }, []);

  const completionRate = data.totalMissions > 0 
    ? (data.completedMissions / data.totalMissions) * 100 
    : 0;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <motion.div
        className="fixed inset-0 -z-10"
        animate={{
          background: timeOfDay === "morning" 
            ? "radial-gradient(circle at 30% 20%, rgba(255,200,100,0.15) 0%, rgba(0,0,0,1) 70%)"
            : timeOfDay === "day"
            ? "radial-gradient(circle at 50% 50%, rgba(100,150,255,0.1) 0%, rgba(0,0,0,1) 70%)"
            : timeOfDay === "evening"
            ? "radial-gradient(circle at 70% 30%, rgba(255,100,150,0.15) 0%, rgba(0,0,0,1) 70%)"
            : "radial-gradient(circle at 50% 50%, rgba(100,50,200,0.1) 0%, rgba(0,0,0,1) 80%)",
        }}
        transition={{ duration: 2 }}
      />

      {/* Floating Orbs */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-3xl opacity-20"
          style={{
            width: `${100 + Math.random() * 200}px`,
            height: `${100 + Math.random() * 200}px`,
            background: `hsl(${200 + i * 45} 70% 50%)`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            x: [0, 50, -50, 0],
            y: [0, -50, 50, 0],
            scale: [1, 1.2, 0.8, 1],
          }}
          transition={{
            duration: 10 + Math.random() * 10,
            repeat: Infinity,
            delay: i * 0.5,
          }}
        />
      ))}

      <div className="relative z-10 space-y-8 sm:space-y-12 pb-24">
        {/* Hero Section */}
        <motion.div
          className="space-y-6 pt-8 sm:pt-12"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-xs uppercase tracking-[0.4em] text-white/40 mb-4">
              {timeOfDay === "morning" && "Good Morning"}
              {timeOfDay === "day" && "Good Day"}
              {timeOfDay === "evening" && "Good Evening"}
              {timeOfDay === "night" && "Good Night"}
            </p>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-4 bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent">
              Your Light Journey
            </h1>
            <p className="text-xl sm:text-2xl text-white/60 max-w-2xl">
              {data.totalChapters} chapters captured · {data.streakDays} day streak
            </p>
          </motion.div>

          {/* Main Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            <StatCard
              label="Missions"
              value={data.totalMissions}
              subvalue={`${data.activeMissions} active`}
              color="blue"
              delay={0.3}
            />
            <StatCard
              label="Completed"
              value={data.completedMissions}
              subvalue={`${Math.round(completionRate)}%`}
              color="purple"
              delay={0.4}
            />
            <StatCard
              label="Chapters"
              value={data.totalChapters}
              subvalue={`${data.totalEntries} entries`}
              color="pink"
              delay={0.5}
            />
            <StatCard
              label="Streak"
              value={data.streakDays}
              subvalue="days"
              color="magenta"
              delay={0.6}
            />
          </div>
        </motion.div>

        {/* Completion Visualization */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
          className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 p-6 sm:p-8 backdrop-blur-xl"
        >
          <h2 className="text-2xl sm:text-3xl font-semibold mb-6">Mission Completion</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-white/60">
              <span>Progress</span>
              <span>{Math.round(completionRate)}%</span>
            </div>
            <div className="relative h-6 sm:h-8 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-500/60 via-purple-500/60 to-pink-500/60"
                initial={{ width: 0 }}
                animate={{ width: `${completionRate}%` }}
                transition={{ duration: 1.5, delay: 0.8 }}
              />
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{
                  x: ["-100%", "100%"],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
              />
            </div>
          </div>
        </motion.div>

        {/* Palette Visualization */}
        {data.palette.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur-xl"
          >
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6">Your Palette</h2>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {data.palette.slice(0, 12).map((item, idx) => (
                <motion.div
                  key={item.color}
                  className="group relative"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 1 + idx * 0.05, type: "spring" }}
                  whileHover={{ scale: 1.2, zIndex: 10 }}
                >
                  <div
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl shadow-lg cursor-pointer"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      {item.count}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Chains Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="space-y-4"
        >
          <h2 className="text-2xl sm:text-3xl font-semibold">Your Chains</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {data.chains.map((chain, idx) => (
              <motion.div
                key={chain.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2 + idx * 0.1 }}
                onClick={() => router.push(`/chain/${chain.id}`)}
                className="rounded-2xl sm:rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6 cursor-pointer hover:border-white/20 transition-all backdrop-blur-xl group"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl sm:text-2xl font-semibold group-hover:text-white/90 transition">
                    {chain.name}
                  </h3>
                  <div className="px-3 py-1 rounded-full bg-white/10 text-xs font-medium">
                    {chain.streak_days} days
                  </div>
                </div>
                <div className="space-y-2 text-sm text-white/60">
                  <div className="flex justify-between">
                    <span>Missions</span>
                    <span className="text-white/80">{chain.mission_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Chapters</span>
                    <span className="text-white/80">{chain.chapter_count}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity Timeline */}
        {data.recentActivity.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 }}
            className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur-xl"
          >
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6">Recent Activity</h2>
            <div className="space-y-4">
              {data.recentActivity.map((activity, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.4 + idx * 0.1 }}
                  className="flex items-start gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition"
                >
                  <div className="h-2 w-2 rounded-full bg-white/60 mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base text-white/90">{activity.message}</p>
                    <p className="text-xs text-white/40 mt-1">
                      {activity.chain_name && `${activity.chain_name} · `}
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  subvalue,
  color,
  delay,
}: {
  label: string;
  value: number;
  subvalue: string;
  color: "blue" | "purple" | "pink" | "magenta";
  delay: number;
}) {
  const colorClasses = {
    blue: "from-blue-500/20 to-blue-500/5 border-blue-500/20",
    purple: "from-purple-500/20 to-purple-500/5 border-purple-500/20",
    pink: "from-pink-500/20 to-pink-500/5 border-pink-500/20",
    magenta: "from-magenta-500/20 to-magenta-500/5 border-magenta-500/20",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: "spring" }}
      className={`rounded-2xl sm:rounded-3xl border bg-gradient-to-br ${colorClasses[color]} p-4 sm:p-6 backdrop-blur-xl`}
    >
      <p className="text-xs sm:text-sm text-white/60 mb-2">{label}</p>
      <p className="text-3xl sm:text-4xl font-bold text-white mb-1">{value}</p>
      <p className="text-xs sm:text-sm text-white/40">{subvalue}</p>
    </motion.div>
  );
}
