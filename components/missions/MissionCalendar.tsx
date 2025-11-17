"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

type Mission = {
  id: string;
  prompt: string;
  chain_name: string;
  state: string;
  starts_at: string;
  ends_at: string | null;
  submissions_received: number;
  submissions_required: number;
};

type CalendarDay = {
  day: string;
  completed: number;
  total: number;
  starting: number;
  ending: number;
  scheduled: number;
  missions: Mission[];
};

type MissionCalendarProps = {
  days: CalendarDay[];
  year: number;
  month: number;
  onDateClick?: (date: string) => void;
};

export function MissionCalendar({
  days,
  year,
  month,
  onDateClick,
}: MissionCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const startWeekday = firstDay.getUTCDay();
  const totalDays = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const dayMap = new Map(days.map((day) => [day.day, day]));

  const cells = [];
  for (let i = 0; i < startWeekday; i++) {
    cells.push(null);
  }
  for (let day = 1; day <= totalDays; day++) {
    const dateStr = new Date(Date.UTC(year, month - 1, day))
      .toISOString()
      .slice(0, 10);
    cells.push({
      label: day,
      date: dateStr,
      data: dayMap.get(dateStr) ?? {
        completed: 0,
        total: 0,
        starting: 0,
        ending: 0,
        scheduled: 0,
        missions: [],
      },
    });
  }

  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    setExpandedDate(expandedDate === date ? null : date);
    onDateClick?.(date);
  };

  const selectedDay = selectedDate ? dayMap.get(selectedDate) : null;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {new Date(year, month - 1).toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <div className="flex gap-4 text-xs text-white/60">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-500/50" />
              <span>Starting</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500/50" />
              <span>Ending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-purple-500/50" />
              <span>Scheduled</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center text-xs text-white/50">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="py-2 font-medium">
              {d}
            </div>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-2">
          {cells.map((cell, idx) =>
            cell ? (
              <motion.button
                key={idx}
                onClick={() => handleDateClick(cell.date)}
                className={`group relative rounded-xl border px-2 py-3 text-center text-sm transition-all ${
                  selectedDate === cell.date
                    ? "border-white/60 bg-white/20 text-white"
                    : cell.data.total > 0
                    ? "border-white/30 bg-white/10 text-white hover:border-white/50"
                    : "border-white/10 text-white/60 hover:border-white/20"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <p className="font-medium">{cell.label}</p>
                {cell.data.total > 0 && (
                  <div className="mt-1 flex items-center justify-center gap-1">
                    {cell.data.starting > 0 && (
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    )}
                    {cell.data.ending > 0 && (
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    )}
                    {cell.data.scheduled > 0 && (
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                    )}
                    <span className="text-[10px] text-white/70">
                      {cell.data.total}
                    </span>
                  </div>
                )}
              </motion.button>
            ) : (
              <div key={idx} />
            )
          )}
        </div>
      </div>

      {expandedDate && selectedDay && selectedDay.missions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="rounded-3xl border border-white/10 bg-white/5 p-6"
        >
          <h3 className="mb-4 text-lg font-semibold">
            Missions on {new Date(expandedDate).toLocaleDateString()}
          </h3>
          <div className="space-y-3">
            {selectedDay.missions.map((mission) => (
              <Link
                key={mission.id}
                href={`/mission/${mission.id}`}
                className="block rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:border-white/30 hover:bg-white/10"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-white/60">{mission.chain_name}</p>
                    <p className="mt-1 font-medium">{mission.prompt}</p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-white/60">
                      <span>
                        Starts: {new Date(mission.starts_at).toLocaleTimeString()}
                      </span>
                      {mission.ends_at && (
                        <span>
                          Ends: {new Date(mission.ends_at).toLocaleTimeString()}
                        </span>
                      )}
                      <span>
                        {mission.submissions_received}/{mission.submissions_required}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      mission.state === "LOBBY"
                        ? "bg-blue-500/20 text-blue-300"
                        : mission.state === "CAPTURE"
                        ? "bg-yellow-500/20 text-yellow-300"
                        : mission.state === "FUSING"
                        ? "bg-purple-500/20 text-purple-300"
                        : mission.state === "RECAP"
                        ? "bg-green-500/20 text-green-300"
                        : "bg-white/10 text-white/60"
                    }`}
                  >
                    {mission.state}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

