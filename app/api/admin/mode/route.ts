import { NextRequest, NextResponse } from "next/server";
import { setTokenMode, getTokenMode } from "@/lib/kv";
import { createSession } from "@/lib/db";
import { generateId } from "@/lib/utils";
import type { Mode } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "token is required" }, { status: 400 });
    }

    const modeData = await getTokenMode(token);

    if (!modeData) {
      // Default to solo mode
      await setTokenMode(token, "solo", "solo.v1");
      return NextResponse.json({ mode: "solo", configId: "solo.v1" });
    }

    return NextResponse.json(modeData);
  } catch (error) {
    console.error("Mode fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch mode" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token, mode } = await request.json();

    if (!token || !mode) {
      return NextResponse.json(
        { error: "token and mode are required" },
        { status: 400 }
      );
    }

    if (mode !== "solo" && mode !== "party") {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }

    let configId: string;
    let sessionId: string | undefined;

    if (mode === "solo") {
      configId = "solo.v1";
    } else {
      configId = "party.v1";
      // Create a new party session
      sessionId = generateId("session");
      await createSession("party");
    }

    await setTokenMode(token, mode as Mode, configId);

    return NextResponse.json({
      success: true,
      mode,
      configId,
      sessionId,
    });
  } catch (error) {
    console.error("Mode toggle error:", error);
    return NextResponse.json(
      { error: "Failed to toggle mode" },
      { status: 500 }
    );
  }
}
