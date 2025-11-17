import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getMembership } from "@/lib/data/chains";
import { setMissionSchedule } from "@/lib/kv";

const schema = z.object({
  chainId: z.string().uuid(),
  timezone: z.string(),
  windowSeconds: z.number().int().min(900).max(7200),
  promptTemplate: z.string().min(4),
  autoStartAt: z.string().regex(/^\d{2}:\d{2}$/),
  enabled: z.boolean(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = schema.parse(await request.json());

    const membership = await getMembership(user.id, body.chainId);
    if (!membership || membership.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const nextRunAt = new Date();
    const [hours, minutes] = body.autoStartAt.split(":").map(Number);
    nextRunAt.setUTCHours(hours, minutes, 0, 0);
    if (nextRunAt.getTime() < Date.now()) {
      nextRunAt.setUTCDate(nextRunAt.getUTCDate() + 1);
    }

    await setMissionSchedule(body.chainId, {
      ...body,
      nextRunAt: nextRunAt.toISOString(),
      updatedBy: user.id,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ nextRunAt: nextRunAt.toISOString() });
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
    console.error("Schedule save failed", error);
    return NextResponse.json({ error: "Unable to save schedule" }, { status: 500 });
  }
}
