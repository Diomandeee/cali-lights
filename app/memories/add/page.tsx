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
  const [captureMode, setCaptureMode] = useState<"upload" | "camera">("upload");
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
    console.log("File selected:", file);
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.onerror = () => {
        alert('Failed to read file');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!selectedFile) {
      alert("Please select a photo");
      return;
    }

    if (!formData.title.trim()) {
      alert("Please add a title for your memory");
      return;
    }

    setIsUploading(true);

    try {
      // Import cloudinary utilities
      const { uploadToCloudinary, saveMemoryToLocalStorage } = await import("@/lib/cloudinary");

      // Upload directly to Cloudinary (no server-side auth required)
      const uploadResult = await uploadToCloudinary(selectedFile, {
        folder: "cali-lights",
        context: {
          title: formData.title,
          date: formData.date,
          time: formData.time,
          location: location.name,
          latitude: location.latitude?.toString() || "",
          longitude: location.longitude?.toString() || "",
        },
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      });

      const url = uploadResult.secure_url;

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

      // Save to localStorage for immediate viewing
      saveMemoryToLocalStorage(newMemory);
      console.log("New memory saved to localStorage:", newMemory);

      alert(
        `Photo Uploaded Successfully! ✨\n\n` +
        `Cloudinary URL: ${url}\n\n` +
        `Memory saved locally. To save permanently:\n` +
        `1. Open public/config/memories.json\n` +
        `2. Add this to the "memories" array:\n\n` +
        `${JSON.stringify(newMemory, null, 2)}`
      );

      router.push("/memories");
    } catch (error: any) {
      console.error("Upload error:", error);

      let errorMessage = "Failed to upload photo. Please try again.";

      if (error.message?.includes("signature")) {
        errorMessage =
          "⚠️ Cloudinary not configured!\n\n" +
          "Make sure these are in your .env file:\n\n" +
          "CLOUDINARY_CLOUD_NAME\n" +
          "CLOUDINARY_API_KEY\n" +
          "CLOUDINARY_API_SECRET\n\n" +
          "Then restart your dev server.";
      } else if (error.message) {
        errorMessage = `Upload failed: ${error.message}`;
      }

      alert(errorMessage);
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
            type="button"
            onClick={(e) => {
              console.log("Done button clicked");
              handleSubmit(e);
            }}
            disabled={isUploading || !selectedFile}
            className="text-cali-magenta hover:text-cali-purple font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {isUploading ? "Uploading..." : "Done"}
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 pb-20">
        {/* Capture Mode Selector */}
        <div className="mb-4 flex gap-2 p-1 bg-cali-purple/10 rounded-lg">
          <button
            type="button"
            onClick={() => {
              console.log("Switching to upload mode");
              setCaptureMode("upload");
            }}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
              captureMode === "upload"
                ? "bg-cali-magenta text-white shadow-lg"
                : "text-gray-400 hover:text-white"
            }`}
          >
            📂 Choose Photo
          </button>
          <button
            type="button"
            onClick={() => {
              console.log("Switching to camera mode");
              setCaptureMode("camera");
            }}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
              captureMode === "camera"
                ? "bg-cali-magenta text-white shadow-lg"
                : "text-gray-400 hover:text-white"
            }`}
          >
            📷 Take Photo
          </button>
        </div>

        {/* Photo Capture/Upload */}
        <div className="mb-6">
          <label
            htmlFor="photo-input"
            className="block w-full aspect-square bg-cali-purple/10 rounded-lg border-2 border-dashed border-cali-purple/30 cursor-pointer overflow-hidden hover:border-cali-magenta/50 transition-colors active:scale-[0.98]"
            onClick={(e) => {
              console.log("Label clicked, mode:", captureMode);
            }}
          >
            {previewUrl ? (
              <div className="relative w-full h-full">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("Removing preview");
                    setSelectedFile(null);
                    setPreviewUrl("");
                  }}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/70 rounded-full flex items-center justify-center text-white hover:bg-black transition-colors z-10"
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 pointer-events-none">
                {captureMode === "camera" ? (
                  <>
                    <svg className="w-20 h-20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-lg font-medium">Tap to take photo</p>
                    <p className="text-sm mt-2">Use your camera</p>
                  </>
                ) : (
                  <>
                    <svg className="w-20 h-20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-lg font-medium">Tap to choose photo</p>
                    <p className="text-sm mt-2">From your gallery</p>
                  </>
                )}
              </div>
            )}
          </label>
          <input
            id="photo-input"
            type="file"
            accept="image/*"
            capture={captureMode === "camera" ? "environment" : undefined}
            onChange={handleFileSelect}
            className="hidden"
            onClick={(e) => {
              console.log("File input clicked");
            }}
          />
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
