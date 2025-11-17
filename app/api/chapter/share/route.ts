import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getChapterById, toggleChapterShare } from "@/lib/data/chapters";
import { getMembership } from "@/lib/data/chains";
import { getMissionById } from "@/lib/data/missions";

const schema = z.object({
  chapterId: z.string().uuid(),
  on: z.boolean(),
  expiresInHours: z.number().int().min(1).max(720).default(72),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = schema.parse(await request.json());

    const chapter = await getChapterById(body.chapterId);
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

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
      "http://localhost:3000";
    const slug = randomUUID().replace(/-/g, "");
    const shareUrl = `${baseUrl}/chapter/${chapter.id}?share=${slug}`;
    const expiresAt = new Date(Date.now() + body.expiresInHours * 3600 * 1000);

    const updated = await toggleChapterShare({
      chapterId: chapter.id,
      on: body.on,
      shareUrl: body.on ? shareUrl : null,
      expiresAt: body.on ? expiresAt : null,
    });

    return NextResponse.json({
      chapterId: updated.id,
      shareable: updated.is_shareable,
      url: updated.share_url,
      expiresAt: updated.share_expires_at,
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
    console.error("Chapter share failed", error);
    return NextResponse.json({ error: "Unable to update share state" }, { status: 500 });
  }
}
