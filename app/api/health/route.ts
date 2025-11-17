import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";

/**
 * Health check endpoint for monitoring and load balancers
 */
export async function GET(request: NextRequest) {
  try {
    const checks = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      services: {
        database: "unknown",
        cloudinary: "unknown",
        vision: "unknown",
        veo: "unknown",
      },
    };

    // Check database
    try {
      const { sql } = await import("@/lib/db/client");
      await sql`SELECT 1`;
      checks.services.database = "connected";
    } catch (error) {
      checks.services.database = "disconnected";
      logger.warn("Database health check failed", error instanceof Error ? error : new Error(String(error)));
    }

    // Check Cloudinary
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      checks.services.cloudinary = "configured";
    } else {
      checks.services.cloudinary = "not_configured";
    }

    // Check Vision API
    if (process.env.GOOGLE_VISION_API_KEY) {
      checks.services.vision = "configured";
    } else {
      checks.services.vision = "not_configured";
    }

    // Check Veo
    if (
      process.env.GOOGLE_CLOUD_PROJECT &&
      process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
    ) {
      checks.services.veo = "configured";
    } else {
      checks.services.veo = "not_configured";
    }

    // Determine overall health
    const criticalServices = [
      checks.services.database,
    ];
    const hasCriticalFailures = criticalServices.some(
      (status) => status === "disconnected"
    );

    if (hasCriticalFailures) {
      checks.status = "unhealthy";
      return NextResponse.json(checks, { status: 503 });
    }

    return NextResponse.json(checks);
  } catch (error) {
    logger.error("Health check failed", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Health check failed",
      },
      { status: 503 }
    );
  }
}

