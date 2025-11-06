import { NextRequest, NextResponse } from "next/server";
import { getSessionRecap } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    const recap = await getSessionRecap(sessionId);

    if (!recap) {
      return NextResponse.json({ error: "Recap not found" }, { status: 404 });
    }

    return NextResponse.json({ recap });
  } catch (error) {
    console.error("Recap fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch recap" },
      { status: 500 }
    );
  }
}
