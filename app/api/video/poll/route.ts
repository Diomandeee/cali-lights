import { NextRequest, NextResponse } from "next/server";
import { getVideoOperationById, listPendingVideoOperations, updateVideoOperationStatus } from "@/lib/data/video";
import { getVeoOperationStatus } from "@/lib/services/video";
import { getChapterById, updateChapterWithVideo } from "@/lib/data/chapters";
import { markMissionRecapReady, getMissionById } from "@/lib/data/missions";
import { listChainMembers } from "@/lib/data/chains";
import { notifyRecapReady } from "@/lib/services/notifications";
import { publishMissionChapterReady, publishMissionState } from "@/lib/realtime";
import { handleBridgeEvaluation } from "@/lib/services/bridge";
import { sql } from "@/lib/db/client";

/**
 * Polls video operation status and updates chapters automatically
 * This endpoint can be called periodically or via cron job
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    // Require authentication (either bearer token or cron secret)
    if (!authHeader && !cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    if (cronSecret) {
      const providedSecret = request.headers.get("x-cron-secret");
      if (providedSecret !== cronSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Get all pending video operations
    const pendingOps = await listPendingVideoOperations();
    
    if (pendingOps.length === 0) {
      return NextResponse.json({ 
        message: "No pending operations",
        checked: 0,
        updated: 0 
      });
    }

    let updated = 0;
    let failed = 0;

    // Check each pending operation
    for (const op of pendingOps) {
      try {
        const status = await getVeoOperationStatus(op.operation_id);

        if (status.done && status.response?.output) {
          // Video is ready
          const videoUri = status.response.output[0]?.mediaUri;
          const duration = status.response.output[0]?.durationSeconds ?? null;
          const watermark = status.response.output[0]?.watermark ?? null;

          await updateVideoOperationStatus({
            operationId: op.operation_id,
            status: "SUCCEEDED",
            videoUrl: videoUri,
            durationSeconds: duration,
            watermark,
          });

          if (op.target_type === "chapter" && videoUri) {
            const chapter = await getChapterById(op.target_id);
            if (chapter) {
              const palette =
                (chapter.final_palette as string[]) ??
                op.input_media_urls.map((url) => `url:${url}`);
              
              await updateChapterWithVideo({
                chapterId: op.target_id,
                videoUrl: videoUri,
                durationSeconds: duration ?? 8,
                finalPalette: palette,
              });

              const missionRecord = await markMissionRecapReady(chapter.mission_id);
              
              // Publish updates (gracefully handle failures)
              try {
                await publishMissionState(missionRecord.id, missionRecord.state);
                await publishMissionChapterReady(chapter.mission_id, chapter.id);
              } catch (error) {
                console.warn("Realtime publish failed:", error);
              }

              // Notify users
              try {
                const members = await listChainMembers(missionRecord.chain_id);
                const chainRow = await sql`
                  SELECT name FROM chains WHERE id = ${missionRecord.chain_id} LIMIT 1
                `;
                await notifyRecapReady({
                  userIds: members.map((m) => m.user_id),
                  chainName: chainRow.rows[0]?.name ?? "Cali Lights",
                });
              } catch (error) {
                console.warn("Notification failed:", error);
              }

              // Evaluate bridge connections
              try {
                await handleBridgeEvaluation(chapter.mission_id);
              } catch (error) {
                console.warn("Bridge evaluation failed:", error);
              }
            }
          }

          updated++;
        } else if (status.done && status.error) {
          // Video generation failed
          await updateVideoOperationStatus({
            operationId: op.operation_id,
            status: "FAILED",
          });
          failed++;
        }
        // If not done, continue polling next time
      } catch (error) {
        console.error(`Failed to check operation ${op.operation_id}:`, error);
        // Don't fail the entire batch, continue with next operation
      }
    }

    return NextResponse.json({
      message: "Polling complete",
      checked: pendingOps.length,
      updated,
      failed,
    });
  } catch (error) {
    console.error("Video polling failed", error);
    return NextResponse.json(
      { error: "Unable to poll video status" },
      { status: 500 }
    );
  }
}

