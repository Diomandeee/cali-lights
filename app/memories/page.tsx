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
}

interface MemoriesData {
  memories: Memory[];
  settings: {
    display_mode: string;
    sort_order: string;
    show_dates: boolean;
  };
}

export default function MemoriesPage() {
  const [data, setData] = useState<MemoriesData | null>(null);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadMemories() {
      try {
        const response = await fetch("/config/memories.json");
        const memoriesData = await response.json();

        // Sort by timestamp
        if (memoriesData.settings.sort_order === "chronological") {
          memoriesData.memories.sort((a: Memory, b: Memory) =>
            b.timestamp - a.timestamp
          );
        }

        setData(memoriesData);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to load memories:", error);
        setIsLoading(false);
      }
    }

    loadMemories();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cali-black">
        <div className="animate-shimmer text-cali-magenta text-2xl">
          Loading memories...
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cali-black">
        <div className="text-center">
          <p className="text-white">No memories found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cali-black via-cali-darkPurple to-cali-black p-4 md:p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-12">
        <div className="flex justify-between items-center mb-8">
          <Link
            href="/"
            className="text-cali-magenta hover:text-cali-purple transition-colors"
          >
            ← Back
          </Link>
          <Link
            href="/memories/add"
            className="px-6 py-3 bg-gradient-to-r from-cali-magenta to-cali-purple text-white rounded-full font-semibold hover:scale-105 transition-transform"
          >
            + Add Memory
          </Link>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-black text-center mb-4 bg-gradient-to-r from-cali-magenta via-cali-purple to-cali-pink bg-clip-text text-transparent"
        >
          Our Moments
        </motion.h1>
        <p className="text-center text-gray-400 text-lg">
          {data.memories.length} {data.memories.length === 1 ? 'memory' : 'memories'} captured
        </p>
      </div>

      {/* Timeline */}
      <div className="max-w-4xl mx-auto space-y-12">
        {data.memories.map((memory, index) => (
          <motion.div
            key={memory.id}
            initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative"
          >
            {/* Timeline dot */}
            <div className="absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-cali-magenta rounded-full z-10 shadow-lg shadow-cali-magenta/50" />

            {/* Timeline line */}
            {index < data.memories.length - 1 && (
              <div className="absolute left-1/2 -translate-x-1/2 top-4 w-0.5 h-full bg-gradient-to-b from-cali-magenta/50 to-transparent" />
            )}

            {/* Memory card */}
            <motion.div
              onClick={() => setSelectedMemory(memory)}
              className={`cursor-pointer bg-cali-purple/10 border-2 border-cali-purple/30 rounded-2xl p-6 hover:border-cali-magenta/50 transition-all ${
                index % 2 === 0 ? 'mr-auto md:mr-[52%]' : 'ml-auto md:ml-[52%]'
              } max-w-md`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Date badge */}
              {data.settings.show_dates && (
                <div className="inline-block px-3 py-1 bg-cali-magenta/20 border border-cali-magenta/40 rounded-full text-cali-magenta text-xs font-medium mb-4">
                  {new Date(memory.timestamp).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
              )}

              {/* Photo preview */}
              {memory.photos.length > 0 && (
                <div className="w-full h-48 mb-4 rounded-lg overflow-hidden bg-cali-black/30">
                  <img
                    src={memory.photos[0]}
                    alt={memory.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Title */}
              <h3 className="text-2xl font-bold text-white mb-2">
                {memory.title}
              </h3>

              {/* Description */}
              <p className="text-gray-300 text-sm leading-relaxed mb-3">
                {memory.description}
              </p>

              {/* Location */}
              {memory.location && (
                <div className="flex items-center gap-2 text-cali-purple text-sm">
                  <span>📍</span>
                  <span>{memory.location}</span>
                </div>
              )}

              {/* Tags */}
              {memory.tags && memory.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {memory.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-cali-purple/20 text-cali-purple text-xs rounded"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Empty state */}
      {data.memories.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <p className="text-gray-400 text-xl mb-6">No memories yet</p>
          <Link
            href="/memories/add"
            className="inline-block px-8 py-4 bg-gradient-to-r from-cali-magenta to-cali-purple text-white rounded-full font-semibold hover:scale-105 transition-transform"
          >
            Create Your First Memory
          </Link>
        </motion.div>
      )}

      {/* Modal for expanded view */}
      <AnimatePresence>
        {selectedMemory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedMemory(null)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-cali-darkPurple border-2 border-cali-magenta/50 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setSelectedMemory(null)}
                className="float-right text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>

              <h2 className="text-4xl font-bold text-white mb-4">
                {selectedMemory.title}
              </h2>

              <p className="text-cali-magenta mb-4">
                {new Date(selectedMemory.timestamp).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>

              {selectedMemory.photos.map((photo, i) => (
                <img
                  key={i}
                  src={photo}
                  alt={`${selectedMemory.title} ${i + 1}`}
                  className="w-full rounded-lg mb-4"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ))}

              <p className="text-gray-300 text-lg leading-relaxed mb-4">
                {selectedMemory.description}
              </p>

              {selectedMemory.location && (
                <div className="flex items-center gap-2 text-cali-purple mb-4">
                  <span>📍</span>
                  <span className="text-lg">{selectedMemory.location}</span>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
