"use client";

import { motion } from "framer-motion";

type Analytics = {
  missions: {
    total: number;
    completed: number;
    completionRate: number;
    avgMinutes: number | null;
  };
  videoOperations: {
    totalCost: number;
    failed: number;
    succeeded: number;
    pending: number;
    successRate: number;
  };
  palette: Array<{ color: string; count: number }>;
  streak: Array<{ day: string; completed: number }>;
  currentStreak: number;
};

export function AnalyticsBoard({ analytics }: { analytics: Analytics }) {
  return (
    <div className="space-y-6 rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-semibold">Analytics</h2>
      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
        <StatCard label="Completion rate" value={`${analytics.missions.completionRate}%`} />
        <StatCard
          label="Avg completion"
          value={
            analytics.missions.avgMinutes
              ? `${analytics.missions.avgMinutes} min`
              : "—"
          }
        />
        <StatCard
          label="Veo spend"
          value={`$${(analytics.videoOperations.totalCost ?? 0).toFixed(2)}`}
        />
        <StatCard
          label="Current streak"
          value={`${analytics.currentStreak} days`}
        />
      </div>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        <div>
          <p className="text-xs sm:text-sm uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white/40 mb-3">
            Palette frequency
          </p>
          <div className="flex flex-wrap gap-2">
            {analytics.palette.map((item) => (
              <motion.div
                key={item.color}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-2 py-1 sm:px-3 text-[10px] sm:text-xs text-white"
                style={{ backgroundColor: `${item.color}40` }}
              >
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-medium">{item.count}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs sm:text-sm uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white/40 mb-3">
            14-day streak
          </p>
          <div className="h-24 sm:h-32 rounded-xl sm:rounded-2xl border border-white/10 p-2 sm:p-3 bg-black/20">
            <div className="flex h-full items-end gap-1">
              {analytics.streak.map((day, index) => (
                <motion.div
                  key={day.day}
                  initial={{ height: 0 }}
                  animate={{ height: "100%" }}
                  transition={{ delay: index * 0.05 }}
                  className="flex-1 flex flex-col items-center justify-end"
                >
                  <div
                    className="w-full rounded-t-sm bg-gradient-to-t from-white/80 to-white/40 transition-all hover:from-white hover:to-white/80"
                    style={{
                      height: `${Math.min((day.completed / Math.max(...analytics.streak.map(d => d.completed), 1)) * 100, 100)}%`,
                      minHeight: day.completed > 0 ? "4px" : "0",
                    }}
                  />
                  <p className="mt-1 text-[9px] sm:text-[10px] text-white/60">
                    {new Date(day.day).getUTCDate()}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Video Operations Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-3">
        <StatCard
          label="Video success"
          value={`${analytics.videoOperations.successRate}%`}
        />
        <StatCard
          label="Succeeded"
          value={`${analytics.videoOperations.succeeded}`}
        />
        <StatCard
          label="Pending"
          value={`${analytics.videoOperations.pending}`}
        />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4"
    >
      <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white/40">{label}</p>
      <p className="mt-2 text-xl sm:text-2xl font-semibold">{value}</p>
    </motion.div>
  );
}
