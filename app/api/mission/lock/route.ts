import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getMissionById, markMissionLocked } from "@/lib/data/missions";
import { getMembership } from "@/lib/data/chains";
import { publishMissionState } from "@/lib/realtime";

const schema = z.object({
  missionId: z.string().uuid(),
  reason: z.enum(["timer", "full", "manual"]).default("timer"),
});

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

    if (!["LOBBY", "CAPTURE"].includes(mission.state)) {
      return NextResponse.json(
        { error: "Mission already locked" },
        { status: 409 }
      );
    }

    const updated = await markMissionLocked(mission.id);
    await publishMissionState(updated.id, updated.state);

    return NextResponse.json({ mission: updated, reason: body.reason });
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
    console.error("Mission lock failed", error);
    return NextResponse.json({ error: "Unable to lock mission" }, { status: 500 });
  }
}
