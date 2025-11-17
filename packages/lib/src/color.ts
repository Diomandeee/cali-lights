/**
 * Returns the circular mean of hue values (0-359).
 */
export function circularMean(hues: number[]): number | null {
  if (!hues.length) return null;
  const radians = hues.map((h) => (h * Math.PI) / 180);
  const x = radians.reduce((sum, angle) => sum + Math.cos(angle), 0);
  const y = radians.reduce((sum, angle) => sum + Math.sin(angle), 0);
  const mean = Math.atan2(y, x);
  const deg = (mean * 180) / Math.PI;
  return (deg + 360) % 360;
}

export function hueBucket(hue: number): string {
  const normalized = ((hue % 360) + 360) % 360;
  const index = Math.floor(normalized / 30);
  const labels = [
    "ember",
    "tangerine",
    "gold",
    "citrine",
    "flora",
    "sage",
    "tidal",
    "cobalt",
    "nocturne",
    "violet",
    "fuchsia",
    "rose",
  ];
  return labels[index] ?? "unknown";
}

export function hueDistance(a: number | null | undefined, b: number | null | undefined) {
  if (typeof a !== "number" || typeof b !== "number") return null;
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}
