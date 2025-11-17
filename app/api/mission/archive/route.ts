import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import {
  archiveMissionRecord,
  getMissionById,
} from "@/lib/data/missions";
import { getMembership, setActiveMission } from "@/lib/data/chains";
import { publishMissionState } from "@/lib/realtime";

const schema = z.object({
  missionId: z.string().uuid(),
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

    const archived = await archiveMissionRecord(mission.id);
    await setActiveMission(mission.chain_id, null);
    await publishMissionState(archived.id, archived.state);

    return NextResponse.json({ mission: archived });
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
    console.error("Mission archive failed", error);
    return NextResponse.json({ error: "Unable to archive mission" }, { status: 500 });
  }
}
