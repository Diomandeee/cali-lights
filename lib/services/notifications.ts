const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY;

async function postNotification(body: Record<string, unknown>) {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_API_KEY) {
    console.warn("OneSignal env vars missing");
    return;
  }
  await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${ONESIGNAL_API_KEY}`,
    },
    body: JSON.stringify({ app_id: ONESIGNAL_APP_ID, ...body }),
  });
}

export async function notifyMissionStart(params: {
  userIds: string[];
  prompt: string;
}) {
  if (!params.userIds.length) return;
  await postNotification({
    include_external_user_ids: params.userIds,
    headings: { en: "New mission" },
    contents: { en: params.prompt },
  });
}

export async function notifyRecapReady(params: {
  userIds: string[];
  chainName: string;
}) {
  if (!params.userIds.length) return;
  await postNotification({
    include_external_user_ids: params.userIds,
    headings: { en: "Recap is ready" },
    contents: { en: `${params.chainName} just fused a new chapter.` },
  });
}

export async function notifyBridgeEvent(params: {
  userIds: string[];
  sourceChain: string;
  targetChain: string;
  sharedTag?: string;
}) {
  if (!params.userIds.length) return;
  await postNotification({
    include_external_user_ids: params.userIds,
    headings: { en: "Bridge formed" },
    contents: {
      en: `${params.sourceChain} linked with ${params.targetChain}${
        params.sharedTag ? ` over ${params.sharedTag}` : ""
      }.`,
    },
  });
}
