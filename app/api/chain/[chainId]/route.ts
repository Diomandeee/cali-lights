import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db/client";
import { getMembership } from "@/lib/data/chains";

const paramsSchema = z.object({
  chainId: z.string().uuid(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { chainId: string } }
) {
  try {
    const user = await requireUser(request);
    const { chainId } = paramsSchema.parse(params);

    const membership = await getMembership(user.id, chainId);
    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const chainResult = await sql`
      SELECT *
      FROM chains
      WHERE id = ${chainId}
      LIMIT 1
    `;
    const chain = chainResult.rows[0];
    if (!chain) {
      return NextResponse.json({ error: "Chain not found" }, { status: 404 });
    }

    const members = await sql`
      SELECT u.id, u.name, u.avatar_url, m.role, m.joined_at
      FROM memberships m
      JOIN users u ON u.id = m.user_id
      WHERE m.chain_id = ${chainId}
      ORDER BY m.joined_at ASC
    `;

    const missionResult = chain.active_mission_id
      ? await sql`
          SELECT * FROM missions WHERE id = ${chain.active_mission_id} LIMIT 1
        `
      : await sql`
          SELECT *
          FROM missions
          WHERE chain_id = ${chainId}
          ORDER BY created_at DESC
          LIMIT 1
        `;
    const mission = missionResult.rows[0] ?? null;
    const entries =
      mission &&
      (
        await sql`
          SELECT e.*, u.name
          FROM entries e
          JOIN users u ON u.id = e.user_id
          WHERE e.mission_id = ${mission.id}
          ORDER BY e.created_at ASC
        `
      ).rows;

    const chapter =
      mission &&
      (
        await sql`
          SELECT *
          FROM chapters
          WHERE mission_id = ${mission.id}
          LIMIT 1
        `
      ).rows[0];

    return NextResponse.json({
      chain,
      members: members.rows,
      mission,
      entries: entries ?? [],
      chapter: chapter ?? null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid chain id" }, { status: 422 });
    }
    if (error instanceof Error && error.message.startsWith("AUTH")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Chain detail failed", error);
    return NextResponse.json({ error: "Unable to load chain" }, { status: 500 });
  }
}
