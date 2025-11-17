import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getMissionById, markMissionLocked } from "@/lib/data/missions";
import { getMembership } from "@/lib/data/chains";
import {
  listEntriesForMission,
  EntryRecord,
} from "@/lib/data/entries";
import { createChapterRecord, updateChapterWithVideo } from "@/lib/data/chapters";
import { createVideoOperation } from "@/lib/data/video";
import { requestVeoGeneration } from "@/lib/services/video";
import { buildChapterPrompt } from "@cali/lib/prompt";
import { publishMissionState, publishMissionChapterReady } from "@/lib/realtime";
import { markMissionRecapReady } from "@/lib/data/missions";
import { circularMean } from "@cali/lib/color";

const schema = z.object({
  missionId: z.string().uuid(),
});

function summarizeMetadata(entries: EntryRecord[]) {
  const hues = entries
    .map((entry) => entry.dominant_hue)
    .filter((hue): hue is number => typeof hue === "number");
  const sceneTags = entries.flatMap((entry) => entry.scene_tags ?? []);
  const objectTags = entries.flatMap((entry) => entry.object_tags ?? []);
  const palette = entries.flatMap((entry) => entry.palette ?? []).slice(0, 5);
  return { hues, sceneTags, objectTags, palette };
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = schema.parse(await request.json());

    const mission = await getMissionById(body.missionId);
    if (!mission) {
      return NextResponse.json({ error: "Mission not found" }, { status: 404 });
    }
    const membership = await getMembership(user.id, mission.chain_id);
    if (!membership || membership.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!["FUSING", "CAPTURE", "RECAP"].includes(mission.state)) {
      return NextResponse.json(
        { error: "Mission not ready for recap" },
        { status: 409 }
      );
    }

    const entries = await listEntriesForMission(mission.id);
    if (!entries.length) {
      return NextResponse.json(
        { error: "Cannot recap without entries" },
        { status: 422 }
      );
    }

    if (mission.state === "CAPTURE") {
      await markMissionLocked(mission.id);
    }

    const meta = summarizeMetadata(entries);
    
    // Generate simple title and poem from metadata
    const hueMean = meta.hues.length > 0 ? circularMean(meta.hues) : null;
    const allTags = [...meta.sceneTags, ...meta.objectTags].filter(Boolean);
    const title = allTags.length > 0 
      ? `${allTags[0].charAt(0).toUpperCase() + allTags[0].slice(1)} ${allTags[1] || "Moment"}`
      : "Our Chapter";
    
    const poem = allTags.length >= 3
      ? `Three moments, one vision. ${allTags.slice(0, 3).join(", ")}.`
      : "Three moments captured. One story told.";

    // Use first entry's image as collage fallback
    const collageUrl = entries[0]?.media_url || null;

    // Create chapter with basic info
    const chapter = await createChapterRecord({
      missionId: mission.id,
      title,
      poem,
      collageUrl,
      finalPalette: meta.palette.length ? meta.palette : undefined,
    });

    // Try to generate video if Veo is configured, otherwise use collage
    let videoOperation = null;
    const veoConfigured = process.env.GOOGLE_CLOUD_PROJECT && process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    
    if (veoConfigured) {
      try {
        const prompt = buildChapterPrompt({
          sceneTags: meta.sceneTags,
          objectTags: meta.objectTags,
          hues: meta.hues,
        });

        const { operationId } = await requestVeoGeneration({
          prompt,
          inputMediaUrls: entries.map((entry) => entry.media_url),
          aspectRatio: "9:16",
          lengthSeconds: 8,
        });

        videoOperation = await createVideoOperation({
          operationId,
          targetType: "chapter",
          targetId: chapter.id,
          prompt,
          inputMediaUrls: entries.map((entry) => entry.media_url),
          aspectRatio: "9:16",
          lengthSeconds: 8,
          model:
            process.env.VEO_MODEL_NAME ?? "publishers/google/models/veo-3.0-generate",
        });
      } catch (veoError) {
        console.warn("Veo generation failed, using collage fallback:", veoError);
        // Fallback: update chapter with collage as video URL
        await updateChapterWithVideo({
          chapterId: chapter.id,
          videoUrl: collageUrl || "",
          durationSeconds: 8,
          finalPalette: meta.palette.length ? meta.palette : [],
          generatedAt: new Date(),
          poem,
        });
      }
    } else {
      // No Veo configured - use collage as video URL
      await updateChapterWithVideo({
        chapterId: chapter.id,
        videoUrl: collageUrl || "",
        durationSeconds: 8,
        finalPalette: meta.palette.length ? meta.palette : [],
        generatedAt: new Date(),
        poem,
      });
    }

    // Update mission state to RECAP
    const updatedMission = await markMissionRecapReady(mission.id);
    
    // Publish state (gracefully handle if Ably not configured)
    try {
      await publishMissionState(updatedMission.id, updatedMission.state);
      await publishMissionChapterReady(updatedMission.id, chapter.id);
    } catch (error) {
      console.warn("Realtime publish failed (Ably not configured):", error);
    }

    // If video operation was created, trigger initial poll check
    if (videoOperation) {
      // Trigger polling in background (non-blocking)
      const pollUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/video/poll`;
      fetch(pollUrl, {
        method: "GET",
        headers: {
          "x-cron-secret": process.env.CRON_SECRET || "",
        },
      }).catch((error) => {
        console.warn("Background video poll trigger failed:", error);
      });
    }

    return NextResponse.json({ 
      chapter: {
        ...chapter,
        title,
        poem,
        collage_url: collageUrl,
      },
      videoOperation,
      usingFallback: !veoConfigured || !videoOperation
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
    console.error("Mission recap failed", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { 
        error: "Unable to recap mission",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
