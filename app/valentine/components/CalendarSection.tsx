"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { triggerHaptic } from "@/lib/utils";

// Event details
const EVENT = {
  title: "Valentine's Dinner at Oceana",
  date: "2025-02-14",
  startTime: "19:45",
  endTime: "22:00",
  location: "Oceana, 120 W 49th St, New York, NY 10020",
  description: "Valentine's Day dinner reservation at Oceana.",
};

// Generate ICS file content with reminder
function generateICS(): string {
  const formatDate = (date: string, time: string) => {
    const [year, month, day] = date.split("-");
    const [hours, minutes] = time.split(":");
    return `${year}${month}${day}T${hours}${minutes}00`;
  };

  const start = formatDate(EVENT.date, EVENT.startTime);
  const end = formatDate(EVENT.date, EVENT.endTime);
  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Cali Lights//Valentine//EN
BEGIN:VEVENT
UID:valentine-2025-oceana@cali-lights
DTSTAMP:${now}
DTSTART;TZID=America/New_York:${start}
DTEND;TZID=America/New_York:${end}
SUMMARY:${EVENT.title}
DESCRIPTION:${EVENT.description}
LOCATION:${EVENT.location}
STATUS:CONFIRMED
BEGIN:VALARM
TRIGGER:-PT1H
ACTION:DISPLAY
DESCRIPTION:Reminder: ${EVENT.title} in 1 hour
END:VALARM
BEGIN:VALARM
TRIGGER:-P1D
ACTION:DISPLAY
DESCRIPTION:Reminder: ${EVENT.title} tomorrow
END:VALARM
END:VEVENT
END:VCALENDAR`;
}

export function CalendarSection() {
  const handleDownloadICS = () => {
    triggerHaptic("medium");
    const icsContent = generateICS();
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "valentines-dinner-oceana.ics";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
      className="max-w-md mx-auto mt-8"
    >
      {/* Event Card */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-rose-500/30 shadow-xl">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-white mb-2">Save the Date</h3>
          <div className="text-rose-300/80 space-y-1">
            <p className="text-lg font-semibold">Friday, February 14, 2025</p>
            <p>7:45 PM</p>
          </div>
        </div>

        {/* Restaurant Info with Image */}
        <div className="bg-black/20 rounded-xl overflow-hidden mb-6">
          <div className="relative w-full h-40">
            <Image
              src="/oceana.avif"
              alt="Oceana Restaurant"
              fill
              className="object-cover"
            />
          </div>
          <div className="p-4">
            <h4 className="text-white font-semibold">Oceana</h4>
            <p className="text-gray-400 text-sm">120 W 49th St, New York, NY 10020</p>
          </div>
        </div>

        {/* Calendar Button */}
        <motion.button
          onClick={handleDownloadICS}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3 px-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-rose-500/30 transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/>
          </svg>
          Add to Calendar
        </motion.button>
      </div>
    </motion.div>
  );
}
