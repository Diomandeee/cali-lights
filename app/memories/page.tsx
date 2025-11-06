"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface Memory {
  id: number;
  title: string;
  date: string;
  timestamp: number;
  description: string;
  photos: string[];
  tags?: string[];
  location?: string;
  latitude?: number;
  longitude?: number;
}

interface LocationGroup {
  location: string;
  date: string;
  memories: Memory[];
}

type GroupBy = "location" | "day" | "month" | "year";
type SortBy = "newest" | "oldest";

export default function MemoriesPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [groupedByLocation, setGroupedByLocation] = useState<LocationGroup[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; memory: Memory } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [groupBy, setGroupBy] = useState<GroupBy>("location");
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    async function loadMemories() {
      try {
        const response = await fetch("/config/memories.json");
        const data = await response.json();

        // Load memories from localStorage
        const { getLocalMemories } = await import("@/lib/cloudinary");
        const localMemories = getLocalMemories();

        // Combine config memories with local memories
        const allMemories = [...data.memories, ...localMemories];

        // Sort by timestamp (newest first)
        const sorted = allMemories.sort((a: Memory, b: Memory) => b.timestamp - a.timestamp);
        setMemories(sorted);

        setIsLoading(false);
      } catch (error) {
        console.error("Failed to load memories:", error);
        setIsLoading(false);
      }
    }

    loadMemories();
  }, []);

  function groupMemories(memories: Memory[], groupBy: GroupBy): LocationGroup[] {
    const groups: { [key: string]: Memory[] } = {};

    memories.forEach((memory) => {
      let key: string;
      const date = new Date(memory.timestamp);

      switch (groupBy) {
        case "day":
          key = date.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric"
          });
          break;
        case "month":
          key = date.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric"
          });
          break;
        case "year":
          key = date.getFullYear().toString();
          break;
        case "location":
        default:
          key = memory.location || "Unknown Location";
          break;
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(memory);
    });

    return Object.entries(groups).map(([location, mems]) => ({
      location,
      date: new Date(mems[0].timestamp).toLocaleDateString(),
      memories: mems,
    }));
  }

  // Get all unique tags from memories
  const allTags = Array.from(
    new Set(
      memories.flatMap((m) => m.tags || [])
    )
  ).sort();

  // Filter memories
  const filteredMemories = memories.filter((memory) => {
    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        memory.title.toLowerCase().includes(query) ||
        memory.description?.toLowerCase().includes(query) ||
        memory.location?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Tag filter
    if (selectedTags.length > 0) {
      const hasTag = selectedTags.some((tag) =>
        memory.tags?.includes(tag)
      );
      if (!hasTag) return false;
    }

    return true;
  });

  // Sort memories
  const sortedMemories = [...filteredMemories].sort((a, b) =>
    sortBy === "newest"
      ? b.timestamp - a.timestamp
      : a.timestamp - b.timestamp
  );

  // Update grouped memories when filters change
  useEffect(() => {
    const groups = groupMemories(sortedMemories, groupBy);
    setGroupedByLocation(groups);
  }, [sortedMemories, groupBy]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cali-black">
        <div className="animate-shimmer text-cali-magenta text-2xl">
          Loading memories...
        </div>
      </div>
    );
  }

  // Flatten all photos for grid view
  const allPhotos = memories.flatMap((memory) =>
    memory.photos.map((photo) => ({ url: photo, memory }))
  );

  return (
    <div className="min-h-screen bg-cali-black">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-cali-black/95 backdrop-blur-lg border-b border-cali-purple/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Top Row */}
          <div className="flex justify-between items-center mb-4">
            <Link
              href="/"
              className="text-cali-magenta hover:text-cali-purple transition-colors"
            >
              ← Back
            </Link>

            <h1 className="text-2xl font-bold bg-gradient-to-r from-cali-magenta to-cali-purple bg-clip-text text-transparent">
              Library
            </h1>

            <Link
              href="/memories/add"
              className="px-4 py-2 bg-cali-magenta text-white rounded-full text-sm font-semibold hover:scale-105 transition-transform"
            >
              + Add
            </Link>
          </div>

          {/* Search Bar */}
          <div className="mb-3">
            <input
              type="text"
              placeholder="Search memories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 bg-cali-purple/10 border border-cali-purple/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cali-magenta"
            />
          </div>

          {/* Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-between px-4 py-2 bg-cali-purple/10 border border-cali-purple/30 rounded-lg text-white hover:bg-cali-purple/20 transition-colors"
          >
            <span className="flex items-center gap-2">
              🎛️ Filters & Grouping
              {(selectedTags.length > 0 || groupBy !== "location") && (
                <span className="px-2 py-0.5 bg-cali-magenta rounded-full text-xs">
                  {selectedTags.length > 0 ? selectedTags.length : "•"}
                </span>
              )}
            </span>
            <span className="text-gray-400">{showFilters ? "▲" : "▼"}</span>
          </button>

          {/* Filters Panel */}
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 p-4 bg-cali-purple/5 border border-cali-purple/20 rounded-lg space-y-4"
            >
              {/* Group By */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Group By</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["location", "day", "month", "year"] as GroupBy[]).map((option) => (
                    <button
                      key={option}
                      onClick={() => setGroupBy(option)}
                      className={`py-2 px-4 rounded-lg font-medium capitalize transition-all ${
                        groupBy === option
                          ? "bg-cali-magenta text-white"
                          : "bg-cali-purple/20 text-gray-400 hover:text-white"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Sort By</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["newest", "oldest"] as SortBy[]).map((option) => (
                    <button
                      key={option}
                      onClick={() => setSortBy(option)}
                      className={`py-2 px-4 rounded-lg font-medium capitalize transition-all ${
                        sortBy === option
                          ? "bg-cali-magenta text-white"
                          : "bg-cali-purple/20 text-gray-400 hover:text-white"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags Filter */}
              {allTags.length > 0 && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Filter by Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          setSelectedTags((prev) =>
                            prev.includes(tag)
                              ? prev.filter((t) => t !== tag)
                              : [...prev, tag]
                          );
                        }}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                          selectedTags.includes(tag)
                            ? "bg-cali-magenta text-white"
                            : "bg-cali-purple/20 text-gray-400 hover:text-white"
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                  {selectedTags.length > 0 && (
                    <button
                      onClick={() => setSelectedTags([])}
                      className="mt-2 text-xs text-cali-magenta hover:underline"
                    >
                      Clear all tags
                    </button>
                  )}
                </div>
              )}

              {/* Results Count */}
              <div className="text-sm text-gray-400 pt-2 border-t border-cali-purple/20">
                Showing {filteredMemories.length} of {memories.length} memories
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Grid View - Apple Photos Style */}
      <div className="max-w-7xl mx-auto px-2 py-6">
        {groupedByLocation.map((group, groupIndex) => (
          <div key={groupIndex} className="mb-12">
            {/* Location Header */}
            <div className="px-2 mb-4">
              <h2 className="text-xl font-bold text-white mb-1">{group.location}</h2>
              <p className="text-sm text-gray-400">{group.date}</p>
            </div>

            {/* Photo Grid - Dynamic Floating Layout */}
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {group.memories.flatMap((memory, memIndex) =>
                memory.photos.map((photo, photoIndex) => {
                  const globalIndex = memIndex + photoIndex;
                  const randomRotate = (globalIndex % 7) - 3; // -3 to 3 degrees
                  const floatDelay = globalIndex * 0.3;
                  const floatDuration = 3 + (globalIndex % 3);

                  return (
                    <motion.div
                      key={`${memory.id}-${photoIndex}`}
                      initial={{ opacity: 0, scale: 0.5, rotate: randomRotate * 3, y: 50 }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        rotate: randomRotate,
                        y: 0
                      }}
                      transition={{
                        delay: photoIndex * 0.08,
                        type: "spring",
                        stiffness: 100,
                        damping: 15
                      }}
                      whileHover={{
                        scale: 1.08,
                        rotate: 0,
                        zIndex: 10,
                        transition: { duration: 0.3 }
                      }}
                      onClick={() => setSelectedPhoto({ url: photo, memory })}
                      className="relative aspect-square cursor-pointer group"
                    >
                      {/* Floating animation */}
                      <motion.div
                        animate={{
                          y: [0, -12, 0],
                          rotate: [randomRotate, randomRotate + 2, randomRotate]
                        }}
                        transition={{
                          duration: floatDuration,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: floatDelay
                        }}
                        className="w-full h-full relative"
                      >
                        {/* Glow effect on hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-cali-magenta/30 to-cali-purple/30 rounded-lg opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />

                        {/* Photo container */}
                        <div className="relative w-full h-full bg-cali-purple/10 rounded-lg overflow-hidden shadow-lg group-hover:shadow-cali-magenta/50 transition-shadow duration-300">
                          <img
                            src={photo}
                            alt={memory.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23333' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' font-size='14' fill='%23666' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
                            }}
                          />

                          {/* Shimmer effect overlay */}
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        ))}

        {/* Empty State */}
        {memories.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4">📸</div>
            <p className="text-gray-400 text-xl mb-6">No photos yet</p>
            <Link
              href="/memories/add"
              className="inline-block px-8 py-4 bg-gradient-to-r from-cali-magenta to-cali-purple text-white rounded-full font-semibold hover:scale-105 transition-transform"
            >
              Add Your First Photo
            </Link>
          </motion.div>
        )}
      </div>

      {/* Photo Detail Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPhoto(null)}
            className="fixed inset-0 bg-black/95 z-50 flex flex-col"
          >
            {/* Animated background particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0.1, 0.3, 0.1],
                    scale: [1, 1.5, 1],
                    x: [0, Math.random() * 100 - 50],
                    y: [0, Math.random() * 100 - 50]
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    delay: i * 0.1
                  }}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    background: i % 2 === 0 ? '#E91E8C' : '#A855F7'
                  }}
                />
              ))}
            </div>

            {/* Header */}
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring" }}
              className="flex justify-between items-center p-4 border-b border-gray-800 relative z-10"
            >
              <div>
                <h3 className="text-white font-semibold text-lg">{selectedPhoto.memory.title}</h3>
                <p className="text-gray-400 text-sm">
                  {new Date(selectedPhoto.memory.timestamp).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.2, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedPhoto(null)}
                className="text-gray-400 hover:text-cali-magenta text-3xl font-light transition-colors"
              >
                ×
              </motion.button>
            </motion.div>

            {/* Photo */}
            <div
              className="flex-1 flex items-center justify-center p-4 relative z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                initial={{ scale: 0.5, rotate: -10, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 100,
                  damping: 20
                }}
                className="relative"
              >
                {/* Glow effect behind photo */}
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.3, 0.5, 0.3]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute inset-0 bg-gradient-to-br from-cali-magenta to-cali-purple blur-3xl -z-10"
                />

                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.memory.title}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                />
              </motion.div>
            </div>

            {/* Info Footer */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="p-4 border-t border-gray-800 bg-cali-black/50 backdrop-blur relative z-10"
            >
              <p className="text-gray-300 text-sm leading-relaxed mb-2">
                {selectedPhoto.memory.description}
              </p>
              {selectedPhoto.memory.location && (
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-2 text-cali-magenta text-sm mb-2"
                >
                  <motion.span
                    animate={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    📍
                  </motion.span>
                  <span>{selectedPhoto.memory.location}</span>
                </motion.div>
              )}
              {selectedPhoto.memory.tags && selectedPhoto.memory.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedPhoto.memory.tags.map((tag, i) => (
                    <motion.span
                      key={tag}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        delay: 0.4 + i * 0.05,
                        type: "spring",
                        stiffness: 200
                      }}
                      whileHover={{ scale: 1.1, y: -2 }}
                      className="px-3 py-1 bg-gradient-to-r from-cali-magenta/30 to-cali-purple/30 text-cali-magenta text-xs rounded-full border border-cali-purple/50"
                    >
                      #{tag}
                    </motion.span>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
