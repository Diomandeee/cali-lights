import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { folder, context, tags } = body;

    // Create upload parameters
    const timestamp = Math.round(new Date().getTime() / 1000);
    const params: any = {
      timestamp,
      folder: folder || "cali-lights",
    };

    // Add optional parameters
    if (context) {
      params.context = Object.entries(context)
        .map(([key, value]) => `${key}=${value}`)
        .join("|");
    }

    if (tags && tags.length > 0) {
      params.tags = tags.join(",");
    }

    // Generate signature using your API secret
    const signature = cloudinary.utils.api_sign_request(
      params,
      process.env.CLOUDINARY_API_SECRET!
    );

    // Return signature and params for client-side upload
    return NextResponse.json({
      signature,
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder: params.folder,
      context: params.context,
      tags: params.tags,
    });
  } catch (error) {
    console.error("Signature generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate upload signature" },
      { status: 500 }
    );
  }
}
