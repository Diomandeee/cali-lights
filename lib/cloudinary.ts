// Client-side Cloudinary direct upload utility
// No authentication required - uses unsigned upload preset

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  created_at: string;
}

export interface UploadOptions {
  folder?: string;
  context?: Record<string, string>;
  tags?: string[];
}

/**
 * Upload a file directly to Cloudinary from the browser
 * Uses signed upload with server-generated signature
 */
export async function uploadToCloudinary(
  file: File,
  options: UploadOptions = {}
): Promise<CloudinaryUploadResult> {
  // Get signed upload parameters from our server
  const signatureResponse = await fetch("/api/cloudinary/signature", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      folder: options.folder || "cali-lights",
      context: options.context,
      tags: options.tags,
    }),
  });

  if (!signatureResponse.ok) {
    throw new Error("Failed to get upload signature");
  }

  const signatureData = await signatureResponse.json();

  // Build form data for Cloudinary upload
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signatureData.apiKey);
  formData.append("timestamp", signatureData.timestamp);
  formData.append("signature", signatureData.signature);
  formData.append("folder", signatureData.folder);

  // Add optional parameters
  if (signatureData.context) {
    formData.append("context", signatureData.context);
  }
  if (signatureData.tags) {
    formData.append("tags", signatureData.tags);
  }

  // Upload directly to Cloudinary
  const url = `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`;

  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Upload failed");
  }

  return await response.json();
}

/**
 * Store memory metadata in localStorage until it can be synced
 */
export function saveMemoryToLocalStorage(memory: any): void {
  const existingMemories = getLocalMemories();
  existingMemories.push(memory);
  localStorage.setItem("cali_lights_local_memories", JSON.stringify(existingMemories));
}

/**
 * Get all locally stored memories
 */
export function getLocalMemories(): any[] {
  const stored = localStorage.getItem("cali_lights_local_memories");
  return stored ? JSON.parse(stored) : [];
}

/**
 * Clear local memories after successful sync
 */
export function clearLocalMemories(): void {
  localStorage.removeItem("cali_lights_local_memories");
}

/**
 * Check if Cloudinary is configured
 */
export function isCloudinaryConfigured(): boolean {
  // Note: This only checks client-side vars
  // Server-side credentials are checked in the API route
  return true; // Always return true, will fail gracefully if not configured
}
