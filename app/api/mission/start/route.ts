import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import {
  getMembership,
  listChainMembers,
  setActiveMission,
  addMembership,
} from "@/lib/data/chains";
import { createMission } from "@/lib/data/missions";
import { notifyMissionStart } from "@/lib/services/notifications";
import { publishMissionState } from "@/lib/realtime";
import { findUserByEmail } from "@/lib/data/users";
import { sql } from "@/lib/db/client";

const schema = z.object({
  chainId: z.string().uuid(),
  prompt: z.string().min(4),
  windowSeconds: z.number().int().min(300).max(7200),
  startsAt: z.string().datetime().optional(),
});

// Auto-add Alize and Sofia to mission lobbies
async function ensureTriadMembers(chainId: string) {
  const triadEmails = ["alize@calilights.local", "sofia@calilights.local"];
  const triadNames = ["Alize", "Sofia"];
  
  for (let i = 0; i < triadEmails.length; i++) {
    const email = triadEmails[i];
    const name = triadNames[i];
    
    // Check if user exists, create if not
    let user = await findUserByEmail(email);
    if (!user) {
      // Create user with a placeholder password hash
      // They'll need to reset password via normal flow if needed
      const { hashPassword } = await import("@/lib/auth");
      const placeholderHash = await hashPassword("placeholder");
      
      const { createUserRecord } = await import("@/lib/data/users");
      user = await createUserRecord({
        email,
        name,
        handle: name.toLowerCase(),
        passwordHash: placeholderHash,
      });
    }
    
    // Check if membership exists, add if not
    const existingMembership = await sql<{ id: string }>`
      SELECT id FROM memberships 
      WHERE chain_id = ${chainId} AND user_id = ${user.id}
      LIMIT 1
    `;
    
    if (!existingMembership.rows[0]) {
      await addMembership({
        chainId,
        userId: user.id,
        role: "member",
      });
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = schema.parse(await request.json());

    const membership = await getMembership(user.id, body.chainId);
    if (!membership || membership.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Ensure Alize and Sofia are members of this chain
    await ensureTriadMembers(body.chainId);

    const mission = await createMission({
      chainId: body.chainId,
      prompt: body.prompt,
      windowSeconds: body.windowSeconds,
      createdBy: user.id,
      startsAt: body.startsAt ? new Date(body.startsAt) : undefined,
    });

    await setActiveMission(body.chainId, mission.id);
    const members = await listChainMembers(body.chainId);
    
    // Publish state (gracefully handle if Ably not configured)
    try {
      await publishMissionState(mission.id, mission.state);
    } catch (error) {
      console.warn("Realtime publish failed (Ably not configured):", error);
    }
    
    // Send notifications (gracefully handle if OneSignal not configured)
    try {
      await notifyMissionStart({
        userIds: members.map((m) => m.user_id),
        prompt: mission.prompt,
      });
    } catch (error) {
      console.warn("Notification failed (OneSignal not configured):", error);
    }

    return NextResponse.json({ mission });
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
    console.error("Mission start failed", error);
    return NextResponse.json({ error: "Unable to start mission" }, { status: 500 });
  }
}
