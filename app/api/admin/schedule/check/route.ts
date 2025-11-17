import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db/client";
import { createMission } from "@/lib/data/missions";
import { setActiveMission } from "@/lib/data/chains";
import { listChainMembers } from "@/lib/data/chains";
import { notifyMissionStart } from "@/lib/services/notifications";
import { publishMissionState } from "@/lib/realtime";
import { getMissionSchedule } from "@/lib/kv";
import { logger } from "@/lib/utils/logger";

/**
 * Cron job endpoint to check scheduled missions and start them
 * Called hourly by Vercel Cron
 */
export async function GET(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const providedSecret = request.headers.get("x-cron-secret");
      if (providedSecret !== cronSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const now = new Date();
    const currentHour = now.getUTCHours();
    
    // Get all chains
    const allChains = await sql<{ id: string }>`
      SELECT id FROM chains WHERE active_mission_id IS NULL
    `;

    let checked = 0;
    let started = 0;

    for (const chain of allChains.rows) {
      try {
        checked++;
        
        // Get schedule from KV
        const schedule = await getMissionSchedule(chain.id) as {
          enabled?: boolean;
          autoStartAt?: string;
          promptTemplate?: string;
          windowSeconds?: number;
          updatedBy?: string;
        } | null;
        if (!schedule || !schedule.enabled) {
          continue;
        }

        // Check if it's time to start
        if (!schedule.autoStartAt || !schedule.promptTemplate || !schedule.windowSeconds) {
          continue;
        }
        const [hours, minutes] = schedule.autoStartAt.split(":").map(Number);
        const scheduledTime = new Date();
        scheduledTime.setUTCHours(hours, minutes, 0, 0);
        
        // Check if current hour matches and we're within 5 minutes of scheduled time
        const timeDiff = Math.abs(now.getTime() - scheduledTime.getTime());
        if (timeDiff > 5 * 60 * 1000) {
          continue;
        }

        // Create mission
        const mission = await createMission({
          chainId: chain.id,
          prompt: schedule.promptTemplate,
          windowSeconds: schedule.windowSeconds,
          createdBy: schedule.updatedBy || "system",
          startsAt: now,
        });

        await setActiveMission(chain.id, mission.id);
        
        logger.info("Scheduled mission started", {
          chainId: chain.id,
          missionId: mission.id,
          prompt: mission.prompt,
        });
        
        // Notify members
        try {
          const members = await listChainMembers(chain.id);
          await notifyMissionStart({
            userIds: members.map((m) => m.user_id),
            prompt: mission.prompt,
          });
        } catch (error) {
          logger.warn("Notification failed", { chainId: chain.id, error: error instanceof Error ? error.message : String(error) });
        }

        // Publish state
        try {
          await publishMissionState(mission.id, mission.state);
        } catch (error) {
          logger.warn("Realtime publish failed", { missionId: mission.id, error: error instanceof Error ? error.message : String(error) });
        }

        started++;
      } catch (error) {
        logger.error(`Failed to check schedule for chain ${chain.id}`, error instanceof Error ? error : new Error(String(error)));
      }
    }

    return NextResponse.json({
      message: "Schedule check complete",
      checked,
      started,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    logger.error("Schedule check failed", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: "Unable to check schedule" },
      { status: 500 }
    );
  }
}
