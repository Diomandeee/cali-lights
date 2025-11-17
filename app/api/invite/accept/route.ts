import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import {
  addMembership,
  createConnectionIfNeeded,
  getChainById,
  getInviteByToken,
  listUserMemberships,
  markInviteAccepted,
} from "@/lib/data/chains";

const schema = z.object({
  token: z.string().min(8),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = schema.parse(await request.json());

    const invite = await getInviteByToken(body.token);
    if (!invite) {
      return NextResponse.json({ error: "Invalid token" }, { status: 404 });
    }
    if (invite.status === "redeemed") {
      return NextResponse.json({ error: "Invite already used" }, { status: 409 });
    }
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: "Invite expired" }, { status: 410 });
    }

    const membership = await addMembership({
      userId: user.id,
      chainId: invite.chain_id,
    });
    await markInviteAccepted(invite.id);

    const previousMemberships = await listUserMemberships(user.id);
    for (const m of previousMemberships) {
      if (m.chain_id !== invite.chain_id) {
        await createConnectionIfNeeded({
          fromChainId: m.chain_id,
          toChainId: invite.chain_id,
          bridgeReason: "invite-accept",
        });
      }
    }

    const chain = await getChainById(invite.chain_id);

    return NextResponse.json({
      membership,
      chain,
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
    console.error("Invite accept failed", error);
    return NextResponse.json(
      { error: "Unable to accept invite" },
      { status: 500 }
    );
  }
}
