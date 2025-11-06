import { NextRequest, NextResponse } from "next/server";
import {
  createUser,
  createSession,
  getSession,
  addParticipant,
} from "@/lib/db";
import { addPresence } from "@/lib/kv";
import { publishParticipantJoin } from "@/lib/realtime";

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userId, nickname, instagram } = await request.json();

    if (!sessionId || !userId || !nickname) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create or get user
    const user = await createUser(nickname, instagram);

    // Create or get session
    let session = await getSession(sessionId);
    if (!session) {
      session = await createSession("party", user.id);
    }

    // Add participant
    const isHost = session.host_id === user.id;
    await addParticipant(sessionId, user.id, isHost);

    // Add to presence
    await addPresence(sessionId, user.id, nickname);

    // Publish join event
    await publishParticipantJoin(sessionId, user.id, nickname);

    return NextResponse.json({
      success: true,
      session,
      user,
      isHost,
    });
  } catch (error) {
    console.error("Session join error:", error);
    return NextResponse.json(
      { error: "Failed to join session" },
      { status: 500 }
    );
  }
}
