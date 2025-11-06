"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AddMemoryPage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [location, setLocation] = useState<{
    name: string;
    latitude: number | null;
    longitude: number | null;
  }>({
    name: "",
    latitude: null,
    longitude: null,
  });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    tags: "",
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
  });

  // Auto-capture location on mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          // Reverse geocode to get location name
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
            );
            const data = await response.json();

            const locationName = data.address?.city ||
                                 data.address?.town ||
                                 data.address?.village ||
                                 data.display_name?.split(',')[0] ||
                                 "Unknown Location";

            setLocation({
              name: locationName,
              latitude,
              longitude,
            });
          } catch (error) {
            console.error("Geocoding error:", error);
            setLocation({
              name: "Location captured",
              latitude,
              longitude,
            });
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
        }
      );
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert("Please select a photo");
      return;
    }

    setIsUploading(true);

    try {
      // Upload to Cloudinary
      const uploadFormData = new FormData();
      uploadFormData.append("file", selectedFile);

      const metadata = {
        title: formData.title,
        date: formData.date,
        time: formData.time,
        location: location.name,
        latitude: location.latitude?.toString(),
        longitude: location.longitude?.toString(),
      };
      uploadFormData.append("metadata", JSON.stringify(metadata));

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Upload failed");
      }

      const { url } = await uploadResponse.json();

      // Parse tags
      const tagArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag);

      // Create timestamp from date and time
      const dateTime = new Date(`${formData.date}T${formData.time}`);
      const timestamp = dateTime.getTime();

      const newMemory = {
        id: Date.now(),
        title: formData.title,
        date: formData.date,
        timestamp,
        description: formData.description,
        photos: [url],
        tags: tagArray,
        location: location.name,
        latitude: location.latitude,
        longitude: location.longitude,
      };

      // In production, this would POST to an API to update memories.json
      // For now, show instructions
      console.log("New memory to add:", newMemory);

      alert(
        `Photo Uploaded Successfully! ✨\n\n` +
        `Cloudinary URL: ${url}\n\n` +
        `To save permanently:\n` +
        `1. Open public/config/memories.json\n` +
        `2. Add this to the "memories" array:\n\n` +
        `${JSON.stringify(newMemory, null, 2)}\n\n` +
        `Or refresh the page to see it temporarily!`
      );

      router.push("/memories");
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload photo. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cali-black">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-cali-black/95 backdrop-blur-lg border-b border-cali-purple/20">
        <div className="max-w-2xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link
            href="/memories"
            className="text-cali-magenta hover:text-cali-purple transition-colors"
          >
            ← Cancel
          </Link>

          <h1 className="text-xl font-bold text-white">
            New Memory
          </h1>

          <button
            onClick={handleSubmit}
            disabled={isUploading || !selectedFile}
            className="text-cali-magenta hover:text-cali-purple font-semibold disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isUploading ? "Uploading..." : "Done"}
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 pb-20">
        {/* Photo Upload */}
        <div className="mb-6">
          <label
            htmlFor="photo-upload"
            className="block w-full aspect-square bg-cali-purple/10 rounded-lg border-2 border-dashed border-cali-purple/30 cursor-pointer overflow-hidden hover:border-cali-magenta/50 transition-colors"
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <p className="text-lg">Tap to add photo</p>
              </div>
            )}
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        </div>

        {/* Auto-captured metadata */}
        <div className="mb-6 p-4 bg-cali-purple/10 rounded-lg border border-cali-purple/20">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <span>✨</span> Auto-Captured
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Date & Time:</span>
              <span className="text-white font-mono">
                {new Date(`${formData.date}T${formData.time}`).toLocaleString()}
              </span>
            </div>
            {location.name && (
              <div className="flex justify-between items-start">
                <span className="text-gray-400">Location:</span>
                <span className="text-white text-right max-w-[200px]">
                  📍 {location.name}
                </span>
              </div>
            )}
            {location.latitude && location.longitude && (
              <div className="flex justify-between">
                <span className="text-gray-400">Coordinates:</span>
                <span className="text-gray-500 font-mono text-xs">
                  {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Add a title..."
              className="w-full px-0 py-3 bg-transparent border-0 border-b border-gray-700 text-white text-lg placeholder-gray-600 focus:outline-none focus:border-cali-magenta transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add a description..."
              rows={3}
              className="w-full px-0 py-3 bg-transparent border-0 border-b border-gray-700 text-white placeholder-gray-600 focus:outline-none focus:border-cali-magenta transition-colors resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="Add tags (comma separated)..."
              className="w-full px-0 py-3 bg-transparent border-0 border-b border-gray-700 text-white placeholder-gray-600 focus:outline-none focus:border-cali-magenta transition-colors"
            />
          </div>

          {/* Manual Date/Time Override */}
          <details className="mt-6">
            <summary className="text-sm text-gray-400 cursor-pointer hover:text-cali-magenta transition-colors">
              Edit Date & Time
            </summary>
            <div className="mt-4 space-y-3">
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 bg-cali-purple/10 border border-cali-purple/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cali-magenta"
              />
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-4 py-2 bg-cali-purple/10 border border-cali-purple/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cali-magenta"
              />
            </div>
          </details>

          {/* Manual Location Override */}
          <details>
            <summary className="text-sm text-gray-400 cursor-pointer hover:text-cali-magenta transition-colors">
              Edit Location
            </summary>
            <div className="mt-4">
              <input
                type="text"
                value={location.name}
                onChange={(e) => setLocation({ ...location, name: e.target.value })}
                placeholder="Location name..."
                className="w-full px-4 py-2 bg-cali-purple/10 border border-cali-purple/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cali-magenta placeholder-gray-600"
              />
            </div>
          </details>
        </form>
      </div>
    </div>
  );
}
