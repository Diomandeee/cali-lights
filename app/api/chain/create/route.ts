import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createChainRecord } from "@/lib/data/chains";

const payloadSchema = z.object({
  name: z.string().min(1),
  description: z.string().max(280).optional(),
  colorTheme: z.record(z.any()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = payloadSchema.parse(await request.json());

    const chain = await createChainRecord({
      name: body.name,
      description: body.description,
      colorTheme: body.colorTheme,
      createdBy: user.id,
    });

    return NextResponse.json({ chain }, { status: 200 });
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
    console.error("Chain create error", error);
    return NextResponse.json(
      { error: "Unable to create chain" },
      { status: 500 }
    );
  }
}
