"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { GalleryCalendar } from "./GalleryCalendar";
import { GalleryMapView } from "./GalleryMapView";

type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

type CalendarDay = {
  day: string;
  completed: number;
  total: number;
};

type GalleryShellProps = {
  initialMedia: Paginated<any>;
  initialChapters: Paginated<any>;
  initialMap: { points: any };
  initialCalendar: { days: CalendarDay[] };
  mapToken?: string;
  calendarMonth: number;
  calendarYear: number;
};

export function GalleryShell({
  initialMedia,
  initialChapters,
  initialMap,
  initialCalendar,
  mapToken,
  calendarMonth,
  calendarYear,
}: GalleryShellProps): JSX.Element {
  const [tab, setTab] = useState<"media" | "chapters">("media");
  const [view, setView] = useState<"grid" | "map" | "calendar">("grid");
  const [scope, setScope] = useState<"network" | "chain" | "user">("network");
  const [hue, setHue] = useState<number | null>(null);
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [media, setMedia] = useState(initialMedia);
  const [chapters, setChapters] = useState(initialChapters);
  const [mapData, setMapData] = useState(initialMap);
  const [calendarData, setCalendarData] = useState(initialCalendar);
  const [loading, setLoading] = useState(false);

  // New filter states
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          scope,
          page: "1",
          pageSize: "24",
        });

        if (hue !== null) params.set("hue", String(hue));
        if (favoriteOnly) params.set("favoriteOnly", "true");
        if (selectedDate) params.set("date", selectedDate);
        if (selectedTime) params.set("time", selectedTime);
        if (selectedMonth) params.set("month", String(selectedMonth));
        if (selectedLocation) params.set("location", selectedLocation);

        const endpoint =
          tab === "media"
            ? `/api/gallery/media?${params.toString()}`
            : `/api/gallery/chapters?${params.toString()}`;

        const response = await fetch(endpoint, { signal: controller.signal });
        if (!response.ok) return;
        const json = await response.json();

        if (tab === "media") setMedia(json);
        else setChapters(json);
      } catch (err: any) {
        // Ignore abort errors; surface others to console
        if (err?.name !== "AbortError") {
          console.error("Failed to load gallery data:", err);
        }
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [
    scope,
    hue,
    favoriteOnly,
    tab,
    selectedDate,
    selectedTime,
    selectedMonth,
    selectedLocation,
  ]);

  useEffect(() => {
    const controller = new AbortController();

    async function refreshAux() {
      try {
        if (view === "map") {
          const response = await fetch(`/api/gallery/map?scope=${scope}`, {
            signal: controller.signal,
          });
          if (response.ok) setMapData(await response.json());
        } else if (view === "calendar") {
          const response = await fetch(
            `/api/gallery/calendar?scope=${scope}&year=${calendarYear}&month=${calendarMonth}`,
            { signal: controller.signal }
          );
          if (response.ok) setCalendarData(await response.json());
        }
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.error("Failed to refresh map/calendar:", err);
        }
      }
    }

    refreshAux();
    return () => controller.abort();
  }, [view, scope, calendarMonth, calendarYear]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Get upload signature
      const signatureRes = await fetch("/api/cloudinary/signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "cali-lights" }),
      });

      if (!signatureRes.ok) throw new Error("Failed to get signature");
      const signatureData = await signatureRes.json();

      // Upload to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", signatureData.apiKey);
      formData.append("timestamp", signatureData.timestamp);
      formData.append("signature", signatureData.signature);
      formData.append("folder", signatureData.folder);

      // NOTE: for videos you may want /video/upload
      const kind =
        file.type.startsWith("video/") ? "video" : "image";

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/${kind}/upload`,
        { method: "POST", body: formData }
      );

      if (!uploadRes.ok) throw new Error("Upload failed");
      // const { secure_url } = await uploadRes.json();

      // Refresh the gallery (simple approach)
      window.location.reload();
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs and View Toggle */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-2 rounded-xl border border-white/10 bg-white/5 p-1">
          <button
            onClick={() => setTab("media")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              tab === "media"
                ? "bg-white/20 text-white"
                : "text-white/60 hover:text-white"
            }`}
          >
            Media
          </button>
          <button
            onClick={() => setTab("chapters")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              tab === "chapters"
                ? "bg-white/20 text-white"
                : "text-white/60 hover:text-white"
            }`}
          >
            Chapters
          </button>
        </div>

        <div className="flex gap-2 rounded-xl border border-white/10 bg-white/5 p-1">
          <button
            onClick={() => setView("grid")}
            className={`rounded-lg px-3 py-2 text-sm transition-all ${
              view === "grid" ? "bg-white/20 text-white" : "text-white/60"
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setView("map")}
            className={`rounded-lg px-3 py-2 text-sm transition-all ${
              view === "map" ? "bg-white/20 text-white" : "text-white/60"
            }`}
          >
            Map
          </button>
          <button
            onClick={() => setView("calendar")}
            className={`rounded-lg px-3 py-2 text-sm transition-all ${
              view === "calendar" ? "bg-white/20 text-white" : "text-white/60"
            }`}
          >
            Calendar
          </button>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="ml-auto rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition-all hover:border-white/40 hover:bg-white/20"
        >
          + Add Photo
        </button>
      </div>

      {/* Enhanced Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
        <select
          value={scope}
          onChange={(e) => setScope(e.target.value as any)}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
        >
          <option value="network">Network</option>
          <option value="chain">Chain</option>
          <option value="user">User</option>
        </select>

        <input
          type="date"
          value={selectedDate ?? ""}
          onChange={(e) => setSelectedDate(e.target.value || null)}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          placeholder="Date"
        />

        <input
          type="time"
          value={selectedTime ?? ""}
          onChange={(e) => setSelectedTime(e.target.value || null)}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          placeholder="Time"
        />

        <select
          value={selectedMonth ?? ""}
          onChange={(e) =>
            setSelectedMonth(e.target.value ? parseInt(e.target.value) : null)
          }
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
        >
          <option value="">All Months</option>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(2024, i).toLocaleString("default", { month: "long" })}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={selectedLocation ?? ""}
          onChange={(e) => setSelectedLocation(e.target.value || null)}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40"
          placeholder="Location (city)"
        />

        {hue !== null && (
          <button
            onClick={() => setHue(null)}
            className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white"
          >
            Clear Hue
          </button>
        )}

        {(selectedDate || selectedTime || selectedMonth || selectedLocation) && (
          <button
            onClick={() => {
              setSelectedDate(null);
              setSelectedTime(null);
              setSelectedMonth(null);
              setSelectedLocation(null);
            }}
            className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Content */}
      {view === "grid" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {loading ? (
            <div className="col-span-full text-center py-12 text-white/60">
              Loading...
            </div>
          ) : tab === "media" ? (
            media.items.length > 0 ? (
              media.items.map((item: any) => (
                <Link
                  key={item.id}
                  href={`/entry/${item.id}`}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-white/5 transition-all hover:border-white/30"
                >
                  <img
                    src={item.media_url}
                    alt={item.alt_text || "Entry"}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-2 left-2 right-2 text-xs text-white">
                      {item.gps_city && <p>📍 {item.gps_city}</p>}
                      {item.captured_at && (
                        <p>{new Date(item.captured_at).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-white/60">
                No media found
              </div>
            )
          ) : chapters.items.length > 0 ? (
            chapters.items.map((chapter: any) => (
              <Link
                key={chapter.id}
                href={`/chapter/${chapter.id}`}
                className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-white/5 transition-all hover:border-white/30"
              >
                {chapter.video_url ? (
                  <video
                    src={chapter.video_url}
                    className="h-full w-full object-cover"
                    muted
                    loop
                    playsInline
                    autoPlay
                  />
                ) : chapter.collage_url ? (
                  <img
                    src={chapter.collage_url}
                    alt={chapter.title || "Chapter"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-white/40">
                    No preview
                  </div>
                )}
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-white/60">
              No chapters found
            </div>
          )}
        </div>
      )}

      {view === "map" && (
        <GalleryMapView points={mapData.points} token={mapToken} />
      )}

      {view === "calendar" && (
        <GalleryCalendar
          days={calendarData.days}
          year={calendarYear}
          month={calendarMonth}
        />
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setShowUploadModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="rounded-2xl border border-white/10 bg-black/90 p-6 max-w-md w-full mx-4"
            >
              <h2 className="text-xl font-semibold mb-4">Upload Photo</h2>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                capture="environment"
                onChange={(e) => {
                  handleUpload(e);
                  setShowUploadModal(false);
                }}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-medium text-white transition-all hover:border-white/40 hover:bg-white/20"
              >
                Choose File
              </button>
              <button
                onClick={() => setShowUploadModal(false)}
                className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white/60 transition-all hover:text-white"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
