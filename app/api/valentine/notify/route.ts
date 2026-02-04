import { NextResponse } from "next/server";

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY;
const VALENTINE_NOTIFY_USER_ID = process.env.VALENTINE_NOTIFY_USER_ID;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const NOTIFY_EMAIL = "diommoney@aol.com";

async function sendEmailNotification() {
  if (!RESEND_API_KEY) {
    console.warn("Resend API key missing - skipping email notification");
    return null;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Cali Lights <notifications@resend.dev>",
        to: NOTIFY_EMAIL,
        subject: "She said YES!",
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #BE123C; margin-bottom: 16px;">She said YES!</h1>
            <p style="color: #374151; font-size: 18px; line-height: 1.6;">
              Alizé accepted your Valentine's invitation.
            </p>
            <p style="color: #6B7280; font-size: 16px; margin-top: 24px;">
              Valentine's Dinner at Oceana<br/>
              Friday, February 14, 2025<br/>
              7:45 PM
            </p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Resend error:", error);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Email error:", error);
    return null;
  }
}

async function sendPushNotification() {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_API_KEY) {
    console.warn("OneSignal env vars missing - skipping push notification");
    return null;
  }

  try {
    const body: Record<string, unknown> = {
      app_id: ONESIGNAL_APP_ID,
      headings: { en: "She said YES!" },
      contents: { en: "Alizé accepted your Valentine's invitation!" },
    };

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
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Push notification error:", error);
    return null;
  }
}

export async function POST() {
  try {
    // Send both email and push notification
    const [emailResult, pushResult] = await Promise.all([
      sendEmailNotification(),
      sendPushNotification(),
    ]);

    return NextResponse.json({
      success: true,
      email: emailResult ? "sent" : "skipped",
      push: pushResult ? "sent" : "skipped",
    });
  } catch (error) {
    console.error("Notification error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send notifications" },
      { status: 500 }
    );
  }
}
