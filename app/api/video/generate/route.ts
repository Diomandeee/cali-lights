import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getChapterById } from "@/lib/data/chapters";
import { getMembership } from "@/lib/data/chains";
import { getMissionById } from "@/lib/data/missions";
import { createVideoOperation } from "@/lib/data/video";
import { requestVeoGeneration } from "@/lib/services/video";

const schema = z.object({
  chapterId: z.string().uuid().optional(),
  generationType: z.enum(["chapter", "invite", "bridge"]).default("chapter"),
  inputMediaUrls: z.array(z.string().url()).min(1),
  prompt: z.string().min(10),
  aspectRatio: z.enum(["9:16", "16:9", "1:1"]),
  lengthSeconds: z.number().int().min(4).max(20),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = schema.parse(await request.json());

    if (body.generationType === "chapter") {
      if (!body.chapterId) {
        return NextResponse.json(
          { error: "chapterId required for chapter generation" },
          { status: 400 }
        );
      }
      const chapter = await getChapterById(body.chapterId);
      if (!chapter) {
        return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
      }
      const mission = await getMissionById(chapter.mission_id);
      if (!mission) {
        return NextResponse.json(
          { error: "Mission missing for chapter" },
          { status: 404 }
        );
      }
      const membership = await getMembership(user.id, mission.chain_id);
      if (!membership || membership.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const { operationId } = await requestVeoGeneration({
      prompt: body.prompt,
      inputMediaUrls: body.inputMediaUrls,
      aspectRatio: body.aspectRatio,
      lengthSeconds: body.lengthSeconds,
    });

    const record = await createVideoOperation({
      operationId,
      targetType: body.generationType,
      targetId: body.chapterId || user.id,
      prompt: body.prompt,
      inputMediaUrls: body.inputMediaUrls,
      aspectRatio: body.aspectRatio,
      lengthSeconds: body.lengthSeconds,
      model:
        process.env.VEO_MODEL_NAME ?? "publishers/google/models/veo-3.0-generate",
    });

    return NextResponse.json({
      operationId: record.operation_id,
      status: record.status,
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
    console.error("Video generate failed", error);
    return NextResponse.json(
      { error: "Unable to generate video" },
      { status: 500 }
    );
  }
}
