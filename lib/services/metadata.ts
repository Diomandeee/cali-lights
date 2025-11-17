import { EntryRecord } from "@/lib/data/entries";
import { geocodeCity } from "@/lib/services/place";
import { retryWithBackoff, logger } from "@/lib/utils/logger";

type MetadataResult = {
  dominantHue: number | null;
  palette: string[];
  sceneTags: string[];
  objectTags: string[];
  motionScore: number | null;
  altText: string | null;
  gpsLat: number | null;
  gpsLon: number | null;
};

function hexFromRgb(r: number, g: number, b: number) {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const clamped = Math.max(0, Math.min(255, Math.round(x)));
        const hex = clamped.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  ).toUpperCase();
}

function hueFromRgb(r: number, g: number, b: number) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  if (delta === 0) return 0;
  let hue = 0;
  if (max === rn) {
    hue = ((gn - bn) / delta) % 6;
  } else if (max === gn) {
    hue = (bn - rn) / delta + 2;
  } else {
    hue = (rn - gn) / delta + 4;
  }
  hue *= 60;
  if (hue < 0) hue += 360;
  return hue;
}

export async function analyseMediaMetadata(params: {
  entry: EntryRecord;
  mediaUrl: string;
  mediaType: "photo" | "video";
}): Promise<MetadataResult> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GOOGLE_VISION_API_KEY");
  }

  const request = {
    requests: [
      {
        image: {
          source: { imageUri: params.mediaUrl },
        },
        features: [
          { type: "IMAGE_PROPERTIES", maxResults: 1 },
          { type: "LABEL_DETECTION", maxResults: 10 },
          { type: "WEB_DETECTION", maxResults: 5 },
        ],
      },
    ],
  };

  const response = await retryWithBackoff(
    async () => {
      return await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        }
      );
    },
    {
      maxRetries: 3,
      initialDelay: 1000,
      onRetry: (error, attempt) => {
        logger.warn(`Vision API retry attempt ${attempt}`, { error: error.message });
      },
    }
  );

  if (!response.ok) {
    const detail = await response.text();
    logger.error("Vision API request failed", new Error(detail), {
      status: response.status,
      mediaUrl: params.mediaUrl,
    });
    throw new Error(`Vision API failed: ${detail}`);
  }

  const json = (await response.json()) as any;
  const annotation = json.responses?.[0] ?? {};
  const palettes =
    annotation.imagePropertiesAnnotation?.dominantColors?.colors ?? [];
  const paletteHex = palettes
    .slice(0, 5)
    .map((color: any) => {
      const rgb = color.color || {};
      return hexFromRgb(rgb.red ?? 0, rgb.green ?? 0, rgb.blue ?? 0);
    })
    .filter(Boolean);

  const dominantColor = palettes[0]?.color ?? null;
  const dominantHue = dominantColor
    ? hueFromRgb(
        dominantColor.red ?? 0,
        dominantColor.green ?? 0,
        dominantColor.blue ?? 0
      )
    : null;

  const labels: string[] =
    annotation.labelAnnotations?.map((ann: any) => ann.description) ?? [];
  const webEntities: string[] =
    annotation.webDetection?.webEntities?.map((entity: any) => entity.description) ??
    [];

  const tags = Array.from(new Set([...labels, ...webEntities])).filter(Boolean);

  let coords = {
    gpsLat: params.entry.gps_lat ?? null,
    gpsLon: params.entry.gps_lon ?? null,
  };
  if (!coords.gpsLat && params.entry.gps_city) {
    try {
      const geo = await geocodeCity(params.entry.gps_city);
      if (geo) {
        coords = { gpsLat: geo.lat, gpsLon: geo.lon };
      }
    } catch (error) {
      logger.warn("Geocode failed", { error: error instanceof Error ? error.message : String(error), city: params.entry.gps_city });
    }
  }

  return {
    dominantHue,
    palette: paletteHex,
    sceneTags: tags.slice(0, 6),
    objectTags: labels.slice(0, 6),
    motionScore: params.mediaType === "video" ? 0.75 : null,
    altText: annotation.webDetection?.bestGuessLabels?.[0]?.label ?? null,
    gpsLat: coords.gpsLat,
    gpsLon: coords.gpsLon,
  };
}
