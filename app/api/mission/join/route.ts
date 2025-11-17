import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getMembership, listChainMembers } from "@/lib/data/chains";
import { getMissionWithChain } from "@/lib/data/missions";
import { listEntriesForMission } from "@/lib/data/entries";

const schema = z.object({
  missionId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = schema.parse(await request.json());

    const mission = await getMissionWithChain(body.missionId);
    if (!mission) {
      return NextResponse.json({ error: "Mission not found" }, { status: 404 });
    }
    const membership = await getMembership(user.id, mission.chain_id);
    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const members = await listChainMembers(mission.chain_id);
    const entries = await listEntriesForMission(mission.id);

    const presence = members.map((m) => ({
      userId: m.user_id,
      name: m.name,
      role: m.role,
      entrySubmitted: entries.some((e) => e.user_id === m.user_id),
    }));

    const uploadUrl =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
      "http://localhost:3000";

    return NextResponse.json({
      mission,
      upload: {
        url: `${uploadUrl}/api/upload`,
        fields: {
          missionId: mission.id,
          userId: user.id,
        },
        expiresAt: new Date(
          new Date(mission.ends_at || mission.starts_at).getTime()
        ).toISOString(),
      },
      presence,
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
    console.error("Mission join failed", error);
    return NextResponse.json({ error: "Unable to join mission" }, { status: 500 });
  }
}
