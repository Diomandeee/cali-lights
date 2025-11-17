import { circularMean, hueBucket } from "./color";

type MetadataSummary = {
  sceneTags: string[];
  objectTags: string[];
  hues: number[];
};

export function buildChapterPrompt(summary: MetadataSummary): string {
  const hueMean = circularMean(summary.hues) ?? 180;
  const paletteWord = hueBucket(hueMean);
  const tags = [...summary.sceneTags, ...summary.objectTags]
    .filter(Boolean)
    .slice(0, 6)
    .join(", ");
  return `A ${paletteWord} dreamscape of ${tags}. Cinematic Veo chapter, soft film grain, handheld glow.`;
}
