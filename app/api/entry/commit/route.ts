import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getMissionById, setSubmissionCount, markMissionLocked, updateMissionState } from "@/lib/data/missions";
import { getMembership } from "@/lib/data/chains";
import {
  countEntriesForMission,
  upsertEntry,
  updateEntryMetadata,
} from "@/lib/data/entries";
import { publishMissionProgress, publishMissionState } from "@/lib/realtime";
import { analyseMediaMetadata } from "@/lib/services/metadata";

const schema = z.object({
  missionId: z.string().uuid(),
  mediaUrl: z.string().url(),
  mediaType: z.enum(["photo", "video"]),
  gpsCity: z.string().optional(),
  gpsLat: z.number().optional(),
  gpsLon: z.number().optional(),
  capturedAt: z.string().datetime().optional(),
  altText: z.string().max(280).optional(),
});

// Background metadata extraction (non-blocking)
async function extractMetadataInBackground(entryId: string, mediaUrl: string, mediaType: "photo" | "video") {
  try {
    // Import here to avoid circular dependencies
    const { getEntryById } = await import("@/lib/data/entries");
    const entry = await getEntryById(entryId);
    if (!entry) {
      console.warn(`Entry ${entryId} not found for metadata extraction`);
      return;
    }

    // Check if Vision API is configured
    if (!process.env.GOOGLE_VISION_API_KEY) {
      console.warn("GOOGLE_VISION_API_KEY not configured, skipping metadata extraction");
      return;
    }

    const metadata = await analyseMediaMetadata({
      entry,
      mediaUrl,
      mediaType,
    });

    await updateEntryMetadata({
      entryId,
      dominantHue: metadata.dominantHue ?? undefined,
      palette: metadata.palette,
      sceneTags: metadata.sceneTags,
      objectTags: metadata.objectTags,
      motionScore: metadata.motionScore ?? undefined,
      altText: metadata.altText ?? undefined,
      gpsLat: metadata.gpsLat ?? undefined,
      gpsLon: metadata.gpsLon ?? undefined,
    });

    console.log(`Metadata extracted for entry ${entryId}`);
  } catch (error) {
    // Don't fail the entry commit if metadata extraction fails
    console.error(`Metadata extraction failed for entry ${entryId}:`, error);
    // Update status to failed but don't throw
    try {
      const { getEntryById, updateEntryMetadata } = await import("@/lib/data/entries");
      const entry = await getEntryById(entryId);
      if (entry) {
        await updateEntryMetadata({
          entryId,
          dominantHue: null,
          palette: [],
          sceneTags: [],
          objectTags: [],
        });
      }
    } catch (updateError) {
      console.error("Failed to update metadata status:", updateError);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = schema.parse(await request.json());

    const mission = await getMissionById(body.missionId);
    if (!mission) {
      return NextResponse.json({ error: "Mission not found" }, { status: 404 });
    }
    if (!["LOBBY", "CAPTURE"].includes(mission.state)) {
      return NextResponse.json(
        { error: "Mission not accepting entries" },
        { status: 409 }
      );
    }

    const membership = await getMembership(user.id, mission.chain_id);
    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const entry = await upsertEntry({
      missionId: mission.id,
      userId: user.id,
      mediaUrl: body.mediaUrl,
      mediaType: body.mediaType,
      gpsCity: body.gpsCity,
      gpsLat: body.gpsLat,
      gpsLon: body.gpsLon,
      capturedAt: body.capturedAt ? new Date(body.capturedAt) : undefined,
      altText: body.altText,
    });

    // Trigger metadata extraction in background (non-blocking)
    extractMetadataInBackground(entry.id, body.mediaUrl, body.mediaType).catch((error) => {
      console.error("Background metadata extraction error:", error);
    });

    const count = await countEntriesForMission(mission.id);
    await setSubmissionCount(mission.id, count);

    // Auto-transition to CAPTURE if in LOBBY
    let updatedMission = mission;
    if (mission.state === "LOBBY") {
      updatedMission = await updateMissionState({
        missionId: mission.id,
        state: "CAPTURE",
        submissionsReceived: count,
      });
      try {
        await publishMissionState(mission.id, "CAPTURE");
      } catch (error) {
        console.warn("Realtime publish failed:", error);
      }
    }

    // Auto-lock if all submissions received
    if (count >= mission.submissions_required && updatedMission.state === "CAPTURE") {
      updatedMission = await markMissionLocked(mission.id);
      try {
        await publishMissionState(mission.id, "FUSING");
      } catch (error) {
        console.warn("Realtime publish failed:", error);
      }
    }

    try {
      await publishMissionProgress({
        missionId: mission.id,
        submissionsReceived: count,
        submissionsRequired: mission.submissions_required,
        entryUserId: user.id,
      });
    } catch (error) {
      console.warn("Realtime progress publish failed:", error);
    }

    return NextResponse.json({ 
      entry, 
      submissions: count,
      mission: updatedMission,
      autoLocked: count >= mission.submissions_required
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.flatten() },
        { status: 422 }
      );
    }
    if (error instanceof Error && error.message.startsWith("AUTH")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Entry commit failed", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { 
        error: "Unable to store entry", 
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined 
      },
      { status: 500 }
    );
  }
}
