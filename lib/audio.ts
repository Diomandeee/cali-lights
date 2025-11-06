// Audio management for Cali Lights
// Handles ambient tracks, SFX, and beat-synced playback

export class AudioManager {
  private context: AudioContext | null = null;
  private tracks: Map<string, HTMLAudioElement> = new Map();
  private currentTrack: HTMLAudioElement | null = null;
  private startTime: number = 0;
  private bpm: number = 120;

  constructor() {
    if (typeof window !== "undefined") {
      this.context = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }
  }

  // Load audio file
  async load(id: string, url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(url);
      audio.preload = "auto";

      audio.addEventListener("canplaythrough", () => {
        this.tracks.set(id, audio);
        resolve();
      });

      audio.addEventListener("error", reject);
    });
  }

  // Play a track
  play(id: string, loop: boolean = false): void {
    const track = this.tracks.get(id);
    if (!track) {
      console.warn(`Track ${id} not loaded`);
      return;
    }

    this.stop();
    track.loop = loop;
    track.currentTime = 0;

    // Resume audio context if suspended (required for autoplay policies)
    if (this.context?.state === "suspended") {
      this.context.resume();
    }

    track.play().catch((err) => {
      console.warn("Audio play failed:", err);
    });

    this.currentTrack = track;
    this.startTime = Date.now();
  }

  // Stop current track
  stop(): void {
    if (this.currentTrack) {
      this.currentTrack.pause();
      this.currentTrack.currentTime = 0;
      this.currentTrack = null;
    }
  }

  // Pause current track
  pause(): void {
    if (this.currentTrack) {
      this.currentTrack.pause();
    }
  }

  // Resume current track
  resume(): void {
    if (this.currentTrack) {
      this.currentTrack.play().catch((err) => {
        console.warn("Audio resume failed:", err);
      });
    }
  }

  // Set volume (0-1)
  setVolume(volume: number): void {
    if (this.currentTrack) {
      this.currentTrack.volume = Math.max(0, Math.min(1, volume));
    }
  }

  // Fade in
  fadeIn(duration: number = 1000): void {
    if (!this.currentTrack) return;

    const steps = 20;
    const stepDuration = duration / steps;
    const volumeStep = 1 / steps;
    let currentStep = 0;

    this.currentTrack.volume = 0;

    const interval = setInterval(() => {
      if (!this.currentTrack || currentStep >= steps) {
        clearInterval(interval);
        return;
      }

      currentStep++;
      this.currentTrack.volume = Math.min(1, currentStep * volumeStep);
    }, stepDuration);
  }

  // Fade out
  fadeOut(duration: number = 1000): Promise<void> {
    return new Promise((resolve) => {
      if (!this.currentTrack) {
        resolve();
        return;
      }

      const steps = 20;
      const stepDuration = duration / steps;
      const initialVolume = this.currentTrack.volume;
      const volumeStep = initialVolume / steps;
      let currentStep = 0;

      const interval = setInterval(() => {
        if (!this.currentTrack || currentStep >= steps) {
          clearInterval(interval);
          this.stop();
          resolve();
          return;
        }

        currentStep++;
        this.currentTrack.volume = Math.max(
          0,
          initialVolume - currentStep * volumeStep
        );
      }, stepDuration);
    });
  }

  // Get current beat number (for tap-to-beat game)
  getCurrentBeat(): number {
    if (!this.currentTrack) return 0;
    const elapsed = Date.now() - this.startTime;
    const beatDuration = 60000 / this.bpm; // ms per beat
    return Math.floor(elapsed / beatDuration);
  }

  // Get time until next beat (for visual metronome)
  getTimeToNextBeat(): number {
    if (!this.currentTrack) return 0;
    const elapsed = Date.now() - this.startTime;
    const beatDuration = 60000 / this.bpm;
    const timeSinceLastBeat = elapsed % beatDuration;
    return beatDuration - timeSinceLastBeat;
  }

  // Set BPM for rhythm tracking
  setBPM(bpm: number): void {
    this.bpm = bpm;
  }

  // Play SFX
  playSFX(id: string): void {
    const sfx = this.tracks.get(id);
    if (sfx) {
      const clone = sfx.cloneNode() as HTMLAudioElement;
      clone.play().catch((err) => {
        console.warn("SFX play failed:", err);
      });
    }
  }

  // Cleanup
  cleanup(): void {
    this.stop();
    this.tracks.forEach((track) => {
      track.pause();
      track.src = "";
    });
    this.tracks.clear();
    if (this.context) {
      this.context.close();
    }
  }
}

// Singleton instance
let audioManager: AudioManager | null = null;

export function getAudioManager(): AudioManager {
  if (!audioManager && typeof window !== "undefined") {
    audioManager = new AudioManager();
  }
  return audioManager!;
}

// Preload common sounds
export async function preloadAudio(): Promise<void> {
  const manager = getAudioManager();

  // Add your audio files here
  const sounds = [
    // { id: "ambient", url: "/media/ambient.mp3" },
    // { id: "tap", url: "/media/sfx/tap.mp3" },
    // { id: "success", url: "/media/sfx/success.mp3" },
    // { id: "unlock", url: "/media/sfx/unlock.mp3" },
  ];

  await Promise.all(sounds.map((sound) => manager.load(sound.id, sound.url)));
}

// Beat metronome for visual feedback
export interface BeatCallback {
  (beatNumber: number): void;
}

export class BeatMetronome {
  private bpm: number;
  private callback: BeatCallback;
  private intervalId: NodeJS.Timeout | null = null;
  private beatCount: number = 0;

  constructor(bpm: number, callback: BeatCallback) {
    this.bpm = bpm;
    this.callback = callback;
  }

  start(): void {
    if (this.intervalId) return;

    const interval = 60000 / this.bpm;
    this.beatCount = 0;

    this.intervalId = setInterval(() => {
      this.beatCount++;
      this.callback(this.beatCount);
    }, interval);

    // Immediate first beat
    this.callback(0);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  reset(): void {
    this.stop();
    this.beatCount = 0;
  }
}
