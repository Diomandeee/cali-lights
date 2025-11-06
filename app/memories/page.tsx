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

export default function MemoriesPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [groupedByLocation, setGroupedByLocation] = useState<LocationGroup[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; memory: Memory } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadMemories() {
      try {
        const response = await fetch("/config/memories.json");
        const data = await response.json();

        // Sort by timestamp (newest first)
        const sorted = data.memories.sort((a: Memory, b: Memory) => b.timestamp - a.timestamp);
        setMemories(sorted);

        // Group by location
        const groups = groupByLocation(sorted);
        setGroupedByLocation(groups);

        setIsLoading(false);
      } catch (error) {
        console.error("Failed to load memories:", error);
        setIsLoading(false);
      }
    }

    loadMemories();
  }, []);

  function groupByLocation(memories: Memory[]): LocationGroup[] {
    const groups: { [key: string]: Memory[] } = {};

    memories.forEach((memory) => {
      const key = memory.location || "Unknown Location";
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
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
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

            {/* Photo Grid */}
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1">
              {group.memories.flatMap((memory) =>
                memory.photos.map((photo, photoIndex) => (
                  <motion.div
                    key={`${memory.id}-${photoIndex}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: photoIndex * 0.05 }}
                    onClick={() => setSelectedPhoto({ url: photo, memory })}
                    className="aspect-square bg-cali-purple/10 rounded-sm overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={photo}
                      alt={memory.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23333' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' font-size='14' fill='%23666' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  </motion.div>
                ))
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
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-800">
              <div>
                <h3 className="text-white font-semibold">{selectedPhoto.memory.title}</h3>
                <p className="text-gray-400 text-sm">
                  {new Date(selectedPhoto.memory.timestamp).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="text-gray-400 hover:text-white text-3xl font-light"
              >
                ×
              </button>
            </div>

            {/* Photo */}
            <div
              className="flex-1 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.img
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                src={selectedPhoto.url}
                alt={selectedPhoto.memory.title}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>

            {/* Info Footer */}
            <div className="p-4 border-t border-gray-800 bg-cali-black/50 backdrop-blur">
              <p className="text-gray-300 text-sm leading-relaxed mb-2">
                {selectedPhoto.memory.description}
              </p>
              {selectedPhoto.memory.location && (
                <div className="flex items-center gap-2 text-cali-magenta text-sm">
                  <span>📍</span>
                  <span>{selectedPhoto.memory.location}</span>
                </div>
              )}
              {selectedPhoto.memory.tags && selectedPhoto.memory.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedPhoto.memory.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-cali-purple/30 text-cali-purple text-xs rounded"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
