import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userId, nickname, instagram } = await request.json();

    if (!sessionId || !userId || !nickname) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Simplified mock response for development
    // In production, this would connect to database
    const mockUser = {
      id: userId,
      nickname,
      instagram,
      created_at: new Date(),
    };

    const mockSession = {
      id: sessionId,
      mode: "party" as const,
      state: "lobby" as const,
      host_id: userId,
      score: 0,
      created_at: new Date(),
    };

    return NextResponse.json({
      success: true,
      session: mockSession,
      user: mockUser,
      isHost: true,
    });
  } catch (error) {
    console.error("Session join error:", error);
    return NextResponse.json(
      { error: "Failed to join session" },
      { status: 500 }
    );
  }
}
