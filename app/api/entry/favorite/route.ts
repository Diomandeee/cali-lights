import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getEntryById, toggleFavoriteEntry } from "@/lib/data/entries";

const schema = z.object({
  entryId: z.string().uuid(),
  on: z.boolean(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = schema.parse(await request.json());

    const entry = await getEntryById(body.entryId);
    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }
    if (entry.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await toggleFavoriteEntry(entry.id, body.on);
    return NextResponse.json({
      entryId: updated.id,
      favorite: updated.favorite,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.flatten() },
        { status: 422 }
      );
    }
    if (error instanceof Error && error.message.startsWith("AUTH")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Favorite toggle failed", error);
    return NextResponse.json({ error: "Unable to update favorite" }, { status: 500 });
  }
}
