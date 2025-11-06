import { NextRequest, NextResponse } from "next/server";
import { generateAblyToken } from "@/lib/realtime";

export async function POST(request: NextRequest) {
  try {
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
    console.error("Auth token generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate auth token" },
      { status: 500 }
    );
  }
}
