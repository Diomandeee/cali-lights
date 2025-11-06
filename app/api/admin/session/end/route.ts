import { NextRequest, NextResponse } from "next/server";
import { endSession } from "@/lib/db";
import { cleanupSession } from "@/lib/kv";
import { publishSessionStateChange } from "@/lib/realtime";

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    // End session in database
    await endSession(sessionId);

    // Publish state change
    await publishSessionStateChange(sessionId, "ended");

    // Cleanup KV data
    await cleanupSession(sessionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Session end error:", error);
    return NextResponse.json(
      { error: "Failed to end session" },
      { status: 500 }
    );
  }
}
