import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getEntryById, updateEntryMetadata } from "@/lib/data/entries";
import { analyseMediaMetadata } from "@/lib/services/metadata";

const schema = z.object({
  entryId: z.string().uuid(),
  mediaUrl: z.string().url(),
  mediaType: z.enum(["photo", "video"]),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = schema.parse(await request.json());

    const entry = await getEntryById(body.entryId);
    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }
    if (entry.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const metadata = await analyseMediaMetadata({
      entry,
      mediaUrl: body.mediaUrl,
      mediaType: body.mediaType,
    });

    const updated = await updateEntryMetadata({
      entryId: body.entryId,
      dominantHue: metadata.dominantHue ?? undefined,
      palette: metadata.palette,
      sceneTags: metadata.sceneTags,
      objectTags: metadata.objectTags,
      motionScore: metadata.motionScore ?? undefined,
      altText: metadata.altText ?? undefined,
      gpsLat: metadata.gpsLat ?? undefined,
      gpsLon: metadata.gpsLon ?? undefined,
    });

    return NextResponse.json({
      metadata: {
        dominantHue: updated.dominant_hue,
        palette: updated.palette,
        sceneTags: updated.scene_tags,
        objectTags: updated.object_tags,
        motionScore: updated.motion_score,
        altText: updated.alt_text,
      },
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
    console.error("Metadata analysis failed", error);
    return NextResponse.json(
      { error: "Unable to analyse metadata" },
      { status: 500 }
    );
  }
}
