import { NextResponse } from "next/server";

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY;
const VALENTINE_NOTIFY_USER_ID = process.env.VALENTINE_NOTIFY_USER_ID;

export async function POST() {
  // Skip if env vars not configured
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_API_KEY) {
    console.warn("OneSignal env vars missing - skipping notification");
    return NextResponse.json({ success: true, skipped: true });
  }

  try {
    const body: Record<string, unknown> = {
      app_id: ONESIGNAL_APP_ID,
      headings: { en: "She said YES! 💖" },
      contents: { en: "Alizé accepted your Valentine's invitation! Time to celebrate! 🎉" },
    };

    // Target specific user if configured, otherwise send to all
    if (VALENTINE_NOTIFY_USER_ID) {
      body.include_external_user_ids = [VALENTINE_NOTIFY_USER_ID];
    } else {
      body.included_segments = ["Subscribed Users"];
    }

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${ONESIGNAL_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OneSignal error:", error);
      return NextResponse.json({ success: false, error }, { status: 500 });
    }

    const result = await response.json();
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Notification error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send notification" },
      { status: 500 }
    );
  }
}
