import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import {
  createInviteRecord,
  getMembership,
} from "@/lib/data/chains";

const schema = z.object({
  chainId: z.string().uuid(),
  expiresInHours: z.number().int().min(1).max(168).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = schema.parse(await request.json());

    const membership = await getMembership(user.id, body.chainId);
    if (!membership || membership.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const invite = await createInviteRecord({
      chainId: body.chainId,
      createdBy: user.id,
      expiresAt: new Date(Date.now() + (body.expiresInHours ?? 72) * 3600 * 1000),
    });

    return NextResponse.json({ invite });
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
    console.error("Invite create failed", error);
    return NextResponse.json(
      { error: "Unable to create invite" },
      { status: 500 }
    );
  }
}
