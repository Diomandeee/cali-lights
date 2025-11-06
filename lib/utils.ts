import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Tailwind class merger
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Generate random ID
export function generateId(prefix: string = ""): string {
  const random = Math.random().toString(36).substring(2, 15);
  const timestamp = Date.now().toString(36);
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
}

// Format time (seconds to MM:SS)
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

// Haptic feedback
export function triggerHaptic(type: "light" | "medium" | "heavy" = "medium") {
  if (typeof window === "undefined") return;

  // Vibration API
  if ("vibrate" in navigator) {
    const duration = type === "light" ? 10 : type === "medium" ? 20 : 50;
    navigator.vibrate(duration);
  }

  // Haptic Feedback API (iOS Safari)
  if ("ontouchstart" in window) {
    try {
      const impact = type === "light" ? 0 : type === "medium" ? 1 : 2;
      (window as any).webkit?.messageHandlers?.haptic?.postMessage(impact);
    } catch (e) {
      // Silently fail if not supported
    }
  }
}

// Calculate accuracy for rhythm games
export interface TapData {
  timestamp: number;
  expectedBeat: number;
}

export function calculateTapAccuracy(
  taps: TapData[],
  bpm: number
): { accuracy: number; onBeatCount: number; totalTaps: number } {
  if (taps.length === 0) {
    return { accuracy: 0, onBeatCount: 0, totalTaps: 0 };
  }

  const beatInterval = 60000 / bpm; // ms per beat
  const tolerance = beatInterval * 0.15; // 15% tolerance window

  let onBeatCount = 0;

  for (const tap of taps) {
    const expectedTime = tap.expectedBeat * beatInterval;
    const diff = Math.abs(tap.timestamp - expectedTime);

    if (diff <= tolerance) {
      onBeatCount++;
    }
  }

  const accuracy = (onBeatCount / taps.length) * 100;
  return { accuracy, onBeatCount, totalTaps: taps.length };
}

// Score calculation
export function calculateRoundScore(
  accuracy: number,
  threshold: number = 70
): number {
  if (accuracy >= threshold) {
    return Math.round((accuracy / 100) * 100);
  }
  return Math.round((accuracy / threshold) * 50);
}

// Local storage helpers (for solo mode)
export const storage = {
  get: (key: string): any => {
    if (typeof window === "undefined") return null;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },

  set: (key: string, value: any): void => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error("Storage error:", e);
    }
  },

  remove: (key: string): void => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error("Storage error:", e);
    }
  },

  clear: (): void => {
    if (typeof window === "undefined") return;
    try {
      localStorage.clear();
    } catch (e) {
      console.error("Storage error:", e);
    }
  },
};

// Progress tracking for solo mode
export interface SoloProgress {
  currentLevel: number;
  levelsCompleted: number[];
  unlocked: boolean;
  lastVisit: number;
}

export function getSoloProgress(): SoloProgress {
  return (
    storage.get("cali_lights_progress") || {
      currentLevel: 1,
      levelsCompleted: [],
      unlocked: false,
      lastVisit: Date.now(),
    }
  );
}

export function saveSoloProgress(progress: SoloProgress): void {
  storage.set("cali_lights_progress", {
    ...progress,
    lastVisit: Date.now(),
  });
}

export function completeLevel(levelId: number): void {
  const progress = getSoloProgress();
  if (!progress.levelsCompleted.includes(levelId)) {
    progress.levelsCompleted.push(levelId);
    progress.currentLevel = levelId + 1;
    saveSoloProgress(progress);
  }
}

// Color palette utilities
export const CALI_PALETTES = {
  magenta: {
    name: "Magenta Dreams",
    colors: ["#E91E8C", "#F72585", "#FF006E", "#FF4D94"],
    gradient: "linear-gradient(135deg, #E91E8C 0%, #FF006E 100%)",
  },
  purple: {
    name: "Purple Haze",
    colors: ["#A855F7", "#9333EA", "#7E22CE", "#6B21A8"],
    gradient: "linear-gradient(135deg, #A855F7 0%, #6B21A8 100%)",
  },
  mixed: {
    name: "Cali Lights",
    colors: ["#E91E8C", "#A855F7", "#EC4899", "#C026D3"],
    gradient: "linear-gradient(135deg, #E91E8C 0%, #A855F7 50%, #EC4899 100%)",
  },
  venue: {
    name: "That Night",
    colors: ["#E91E8C", "#A855F7", "#1E0B2E", "#EC4899"],
    gradient: "linear-gradient(135deg, #E91E8C 0%, #A855F7 50%, #EC4899 100%)",
  },
};

export type PaletteKey = keyof typeof CALI_PALETTES;

export function getPalette(key: PaletteKey) {
  return CALI_PALETTES[key];
}
