import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { findUserByEmail, updateUserApiKey } from "@/lib/data/users";
import { verifyPassword } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const body = loginSchema.parse(json);

    const user = await findUserByEmail(body.email);
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isValid = await verifyPassword(body.password, user.password_hash as any);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const refreshed = await updateUserApiKey(user.id);

    const response = NextResponse.json({
      user: {
        id: refreshed.id,
        email: refreshed.email,
        name: refreshed.name,
        handle: refreshed.handle,
        avatarUrl: refreshed.avatar_url,
        role: refreshed.role,
      },
      token: refreshed.api_key,
    });
    response.cookies.set("cali_token", refreshed.api_key ?? "", {
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
    console.error("Login error", error);
    return NextResponse.json(
      { error: "Unable to login" },
      { status: 500 }
    );
  }
}
