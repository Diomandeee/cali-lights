import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getChapterById, updateChapterWithVideo } from "@/lib/data/chapters";
import { getMembership } from "@/lib/data/chains";
import { getMissionById } from "@/lib/data/missions";

const schema = z.object({
  videoUrl: z.string().url(),
  durationSeconds: z.number().int().min(1),
  finalPalette: z.array(z.string()),
  poem: z.string().optional(),
  generatedAt: z.string().datetime().optional(),
  soundtrackUrl: z.string().url().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { chapterId: string } }
) {
  try {
    const user = await requireUser(request);
    const body = schema.parse(await request.json());

    const chapter = await getChapterById(params.chapterId);
    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }
    const mission = await getMissionById(chapter.mission_id);
    if (!mission) {
      return NextResponse.json({ error: "Mission missing" }, { status: 404 });
    }
    const membership = await getMembership(user.id, mission.chain_id);
    if (!membership || membership.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await updateChapterWithVideo({
      chapterId: chapter.id,
      videoUrl: body.videoUrl,
      durationSeconds: body.durationSeconds,
      finalPalette: body.finalPalette,
      poem: body.poem,
      generatedAt: body.generatedAt ? new Date(body.generatedAt) : undefined,
      soundtrackUrl: body.soundtrackUrl,
    });

    return NextResponse.json({ chapter: updated });
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
    console.error("Chapter update failed", error);
    return NextResponse.json({ error: "Unable to update chapter" }, { status: 500 });
  }
}
