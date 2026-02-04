import { NextResponse } from "next/server";

export async function POST() {
  // Log the confirmation
  console.log("Valentine confirmation received at:", new Date().toISOString());
  console.log("Alizé said YES!");

  return NextResponse.json({
    success: true,
    message: "Confirmation recorded",
    timestamp: new Date().toISOString(),
  });
}
