"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AddMemoryPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    date: new Date().toISOString().split('T')[0],
    description: "",
    location: "",
    tags: "",
    photoUrl: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Parse tags
    const tagArray = formData.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag);

    const newMemory = {
      id: Date.now(),
      title: formData.title,
      date: formData.date,
      timestamp: new Date(formData.date).getTime(),
      description: formData.description,
      photos: formData.photoUrl ? [formData.photoUrl] : [],
      tags: tagArray,
      location: formData.location || undefined,
    };

    // In production, this would POST to an API
    // For now, we'll show instructions to manually add to JSON
    console.log("New memory to add:", newMemory);

    // Show success message
    alert(
      `Memory Created!\n\nTo save this memory permanently:\n\n1. Open public/config/memories.json\n2. Add this object to the "memories" array:\n\n${JSON.stringify(newMemory, null, 2)}\n\nOr use the API endpoint (coming soon)`
    );

    setIsSubmitting(false);
    router.push("/memories");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cali-black via-cali-darkPurple to-cali-black p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/memories"
            className="text-cali-magenta hover:text-cali-purple transition-colors inline-block mb-6"
          >
            ← Back to Memories
          </Link>

          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black mb-4 bg-gradient-to-r from-cali-magenta via-cali-purple to-cali-pink bg-clip-text text-transparent"
          >
            Capture a Moment
          </motion.h1>
          <p className="text-gray-400">
            Add a new memory to your timeline
          </p>
        </div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Title */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="A magical night..."
              className="w-full px-4 py-3 bg-cali-purple/20 border-2 border-cali-purple text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cali-magenta placeholder-gray-500"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Date *
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-4 py-3 bg-cali-purple/20 border-2 border-cali-purple text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cali-magenta"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Description *
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tell the story of this moment..."
              rows={4}
              className="w-full px-4 py-3 bg-cali-purple/20 border-2 border-cali-purple text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cali-magenta placeholder-gray-500 resize-none"
            />
          </div>

          {/* Photo URL */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Photo URL
            </label>
            <input
              type="url"
              value={formData.photoUrl}
              onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
              placeholder="/media/your-photo.jpg or https://..."
              className="w-full px-4 py-3 bg-cali-purple/20 border-2 border-cali-purple text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cali-magenta placeholder-gray-500"
            />
            <p className="text-gray-500 text-xs mt-1">
              Upload photos to public/media/ or use an external URL
            </p>
          </div>

          {/* Location */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Where did this happen?"
              className="w-full px-4 py-3 bg-cali-purple/20 border-2 border-cali-purple text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cali-magenta placeholder-gray-500"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Tags
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="birthday, celebration, friends (comma separated)"
              className="w-full px-4 py-3 bg-cali-purple/20 border-2 border-cali-purple text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cali-magenta placeholder-gray-500"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-4 bg-gradient-to-r from-cali-magenta to-cali-purple text-white font-bold text-lg rounded-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating..." : "Create Memory"}
            </button>

            <Link
              href="/memories"
              className="px-6 py-4 border-2 border-cali-purple text-cali-purple font-bold text-lg rounded-lg hover:bg-cali-purple/10 transition-colors text-center"
            >
              Cancel
            </Link>
          </div>
        </motion.form>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 p-6 bg-cali-purple/10 border-2 border-cali-purple/30 rounded-lg"
        >
          <h3 className="text-white font-bold mb-3">💡 How to Add Photos</h3>
          <ol className="text-gray-300 text-sm space-y-2 list-decimal list-inside">
            <li>Place your photo in <code className="bg-cali-black/50 px-2 py-1 rounded">public/media/</code></li>
            <li>Reference it as <code className="bg-cali-black/50 px-2 py-1 rounded">/media/your-photo.jpg</code></li>
            <li>Or use an external URL like Imgur, Cloudinary, etc.</li>
          </ol>
        </motion.div>
      </div>
    </div>
  );
}
