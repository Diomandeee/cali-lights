import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createUserRecord,
  findUserByEmail,
} from "@/lib/data/users";
import { hashPassword } from "@/lib/auth";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(50).optional(),
  handle: z
    .string()
    .regex(/^[a-z0-9_]+$/i, "Handle must be alphanumeric")
    .min(3)
    .max(24)
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const body = registerSchema.parse(json);

    const existing = await findUserByEmail(body.email);
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(body.password);
    const user = await createUserRecord({
      email: body.email,
      passwordHash,
      name: body.name,
      handle: body.handle,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        handle: user.handle,
        avatarUrl: user.avatar_url,
        role: user.role,
      },
      token: user.api_key,
    });
    response.cookies.set("cali_token", user.api_key ?? "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.flatten() },
        { status: 422 }
      );
    }
    console.error("Register error", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Unable to register", details: process.env.NODE_ENV === "development" ? errorMessage : undefined },
      { status: 500 }
    );
  }
}
