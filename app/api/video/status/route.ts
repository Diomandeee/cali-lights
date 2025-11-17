import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db/client";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import {
  getVideoOperationById,
  updateVideoOperationStatus,
} from "@/lib/data/video";
import { getVeoOperationStatus } from "@/lib/services/video";
import { getChapterById, updateChapterWithVideo } from "@/lib/data/chapters";
import { markMissionRecapReady, getMissionById } from "@/lib/data/missions";
import { getMembership, listChainMembers } from "@/lib/data/chains";
import { notifyRecapReady } from "@/lib/services/notifications";
import {
  publishMissionChapterReady,
  publishMissionState,
} from "@/lib/realtime";
import { handleBridgeEvaluation } from "@/lib/services/bridge";

const schema = z.object({
  operationId: z.string().min(3),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const { searchParams } = new URL(request.url);
    const operationId = schema.parse({
      operationId: searchParams.get("operationId"),
    }).operationId;

    const record = await getVideoOperationById(operationId);
    if (!record) {
      return NextResponse.json({ error: "Operation not found" }, { status: 404 });
    }

    if (record.target_type === "chapter") {
      const chapter = await getChapterById(record.target_id);
      if (!chapter) {
        return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
      }
      const mission = await getMissionById(chapter.mission_id);
      if (!mission) {
        return NextResponse.json({ error: "Mission missing" }, { status: 404 });
      }
      const membership = await getMembership(user.id, mission.chain_id);
      if (!membership || membership.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const status = await getVeoOperationStatus(operationId);

    if (status.done && status.response?.output) {
      const videoUri = status.response.output[0]?.mediaUri;
      const duration = status.response.output[0]?.durationSeconds ?? null;
      const watermark = status.response.output[0]?.watermark ?? null;

      await updateVideoOperationStatus({
        operationId,
        status: "SUCCEEDED",
        videoUrl: videoUri,
        durationSeconds: duration,
        watermark,
      });

      if (record.target_type === "chapter" && videoUri) {
        const chapter = await getChapterById(record.target_id);
        const palette =
          (chapter?.final_palette as string[]) ??
          record.input_media_urls.map((url) => `url:${url}`);
        await updateChapterWithVideo({
          chapterId: record.target_id,
          videoUrl: videoUri,
          durationSeconds: duration ?? 8,
          finalPalette: palette,
        });
        if (chapter) {
          const missionRecord = await markMissionRecapReady(chapter.mission_id);
          await publishMissionState(missionRecord.id, missionRecord.state);
          await publishMissionChapterReady(chapter.mission_id, chapter.id);
          const members = await listChainMembers(missionRecord.chain_id);
          const chainRow = await sql`
            SELECT name FROM chains WHERE id = ${missionRecord.chain_id} LIMIT 1
          `;
          await notifyRecapReady({
            userIds: members.map((m) => m.user_id),
            chainName: chainRow.rows[0]?.name ?? "Cali Lights",
          });
          await handleBridgeEvaluation(chapter.mission_id);
        }
      }
    } else if (status.done && status.error) {
      await updateVideoOperationStatus({
        operationId,
        status: "FAILED",
      });
    }

    return NextResponse.json({
      operationId,
      status: status.done
        ? status.error
          ? "FAILED"
          : "SUCCEEDED"
        : "RUNNING",
      videoUrl: status.response?.output?.[0]?.mediaUri ?? null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid operationId" }, { status: 422 });
    }
    if (error instanceof Error && error.message.startsWith("AUTH")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Video status failed", error);
    return NextResponse.json({ error: "Unable to fetch status" }, { status: 500 });
  }
}
