import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getMembership, listConnectedChainIds } from "@/lib/data/chains";
import { createMission } from "@/lib/data/missions";

const schema = z.object({
  originChainId: z.string().uuid(),
  prompt: z.string().min(4),
  windowSeconds: z.number().int().min(300).max(7200).default(3600),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = schema.parse(await request.json());

    const originMembership = await getMembership(user.id, body.originChainId);
    if (!originMembership || originMembership.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const connectedIds = await listConnectedChainIds(body.originChainId);
    const created: string[] = [];

    for (const chainId of connectedIds) {
      const mission = await createMission({
        chainId,
        prompt: body.prompt,
        windowSeconds: body.windowSeconds,
        createdBy: user.id,
      });
      created.push(mission.id);
    }

    return NextResponse.json({
      chainsUpdated: created.length,
      missionIds: created,
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
    console.error("Mission propagate failed", error);
    return NextResponse.json({ error: "Unable to propagate mission" }, { status: 500 });
  }
}
