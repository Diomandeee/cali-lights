import { NextRequest, NextResponse } from "next/server";
import { updateSessionState } from "@/lib/db";
import { setActiveRound } from "@/lib/kv";
import { publishRoundStart } from "@/lib/realtime";
import type { RoundType, PartyConfig } from "@/lib/types";
import { readFileSync } from "fs";
import { join } from "path";

// Load party config from public directory
function getPartyConfig(): PartyConfig {
  const configPath = join(process.cwd(), "public", "config", "party.v1.json");
  const configData = readFileSync(configPath, "utf-8");
  return JSON.parse(configData);
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, roundNumber } = await request.json();

    if (!sessionId || !roundNumber) {
      return NextResponse.json(
        { error: "sessionId and roundNumber are required" },
        { status: 400 }
      );
    }

    const partyConfig = getPartyConfig();

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
