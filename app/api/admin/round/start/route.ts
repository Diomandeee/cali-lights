import { NextRequest, NextResponse } from "next/server";
import { updateSessionState } from "@/lib/db";
import { setActiveRound } from "@/lib/kv";
import { publishRoundStart } from "@/lib/realtime";
import type { RoundType } from "@/lib/types";

// Load party config
import partyConfig from "@/config/party.v1.json";

export async function POST(request: NextRequest) {
  try {
    const { sessionId, roundNumber } = await request.json();

    if (!sessionId || !roundNumber) {
      return NextResponse.json(
        { error: "sessionId and roundNumber are required" },
        { status: 400 }
      );
    }

    if (roundNumber < 1 || roundNumber > partyConfig.rounds.length) {
      return NextResponse.json(
        { error: "Invalid round number" },
        { status: 400 }
      );
    }

    const roundConfig = partyConfig.rounds[roundNumber - 1];

    // Update session state
    await updateSessionState(sessionId, "round", roundNumber);

    // Set active round in KV
    await setActiveRound(sessionId, roundNumber, {
      round_type: roundConfig.type,
      duration: roundConfig.duration,
      threshold: roundConfig.threshold,
    });

    // Publish round start event
    await publishRoundStart(sessionId, {
      round_number: roundNumber,
      round_type: roundConfig.type as RoundType,
      duration: roundConfig.duration,
      time_remaining: roundConfig.duration,
      score: 0,
      threshold: roundConfig.threshold,
    });

    return NextResponse.json({
      success: true,
      state: "round",
      roundNumber,
      roundType: roundConfig.type,
    });
  } catch (error) {
    console.error("Round start error:", error);
    return NextResponse.json(
      { error: "Failed to start round" },
      { status: 500 }
    );
  }
}
