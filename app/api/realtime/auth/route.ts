import { NextRequest, NextResponse } from "next/server";
import { generateAblyToken } from "@/lib/realtime";

export async function POST(request: NextRequest) {
  try {
    // Check if Ably is configured
    if (!process.env.ABLY_API_KEY) {
      return NextResponse.json(
        { error: "Realtime not configured" },
        { status: 503 }
      );
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const token = await generateAblyToken(userId);

    return NextResponse.json({ token });
  } catch (error) {
    console.warn("Auth token generation failed, realtime disabled:", error);
    return NextResponse.json(
      { error: "Realtime not available" },
      { status: 503 }
    );
  }
}
