#!/usr/bin/env node
/**
 * Quick Setup Script for Cloudinary & Google Vision API
 * 
 * This script helps you configure the two critical services
 * and validates they're working correctly.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createInterface } from "readline";
import path from "node:path";
import { config } from "dotenv";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function testCloudinaryConnection() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return { success: false, error: "Missing Cloudinary credentials" };
  }

  try {
    // Test by generating a signature
    const crypto = await import("crypto");
    const timestamp = Math.round(new Date().getTime() / 1000);
    const params = `folder=cali-lights&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash("sha1").update(params).digest("hex");

    // Test API endpoint
    const testUrl = `https://api.cloudinary.com/v1_1/${cloudName}/resources/image/upload?max_results=1`;
    const response = await fetch(testUrl, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`,
      },
    });

    if (response.ok || response.status === 401) {
      // 401 is OK - means credentials work but might not have resources yet
      return { success: true, message: "Cloudinary credentials are valid" };
    }

    return { success: false, error: `API returned status ${response.status}` };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function testVisionAPI() {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;

  if (!apiKey) {
    return { success: false, error: "Missing Vision API key" };
  }

  try {
    // Test with a simple public image
    const testUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
    const response = await fetch(testUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: {
              source: {
                imageUri:
                  "https://storage.googleapis.com/gcp-public-data-aiplatform/example-images/vision/landmark.jpg",
              },
            },
            features: [{ type: "LABEL_DETECTION", maxResults: 1 }],
          },
        ],
      }),
    });

    const data = await response.json();

    if (response.ok && data.responses && data.responses[0]) {
      return {
        success: true,
        message: "Vision API is working correctly",
        labels: data.responses[0].labelAnnotations?.map((l: any) => l.description) || [],
      };
    }

    if (data.error) {
      return {
        success: false,
        error: data.error.message || "Vision API error",
      };
    }

    return { success: false, error: `Unexpected response: ${response.status}` };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  console.log("\n🔧 Cali Lights - Cloudinary & Vision API Setup\n");
  console.log("This script will help you configure:");
  console.log("  1. Cloudinary (for image/video uploads)");
  console.log("  2. Google Vision API (for metadata extraction)\n");

  const envPath = path.resolve(process.cwd(), ".env.local");
  const envExists = existsSync(envPath);

  // Load existing env vars
  if (envExists) {
    config({ path: envPath });
    console.log("✅ Found existing .env.local file\n");
  } else {
    console.log("📝 Creating new .env.local file\n");
    writeFileSync(envPath, "");
  }

  const configUpdates: Record<string, string> = {};
  let hasChanges = false;

  // Cloudinary Setup
  console.log("=== CLOUDINARY SETUP ===\n");
  console.log("If you haven't signed up yet:");
  console.log("  1. Go to https://cloudinary.com/users/register/free");
  console.log("  2. Create a free account");
  console.log("  3. Get your credentials from the Dashboard\n");

  const currentCloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const cloudName = await question(
    `Cloudinary Cloud Name${currentCloudName ? ` [${currentCloudName}]` : ""}: `
  );
  if (cloudName) {
    configUpdates.CLOUDINARY_CLOUD_NAME = cloudName;
    configUpdates.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = cloudName;
    hasChanges = true;
  } else if (currentCloudName) {
    configUpdates.CLOUDINARY_CLOUD_NAME = currentCloudName;
    configUpdates.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = currentCloudName;
  }

  const currentApiKey = process.env.CLOUDINARY_API_KEY;
  const apiKey = await question(
    `Cloudinary API Key${currentApiKey ? ` [${currentApiKey.substring(0, 8)}...]` : ""}: `
  );
  if (apiKey) {
    configUpdates.CLOUDINARY_API_KEY = apiKey;
    hasChanges = true;
  } else if (currentApiKey) {
    configUpdates.CLOUDINARY_API_KEY = currentApiKey;
  }

  const currentApiSecret = process.env.CLOUDINARY_API_SECRET;
  const apiSecret = await question(
    `Cloudinary API Secret${currentApiSecret ? ` [${currentApiSecret.substring(0, 8)}...]` : ""}: `
  );
  if (apiSecret) {
    configUpdates.CLOUDINARY_API_SECRET = apiSecret;
    hasChanges = true;
  } else if (currentApiSecret) {
    configUpdates.CLOUDINARY_API_SECRET = currentApiSecret;
  }

  // Vision API Setup
  console.log("\n=== GOOGLE VISION API SETUP ===\n");
  console.log("If you haven't set it up yet:");
  console.log("  1. Go to https://console.cloud.google.com");
  console.log("  2. Create a project (or select existing)");
  console.log("  3. Enable 'Cloud Vision API'");
  console.log("  4. Create an API key\n");

  const currentVisionKey = process.env.GOOGLE_VISION_API_KEY;
  const visionKey = await question(
    `Google Vision API Key${currentVisionKey ? ` [${currentVisionKey.substring(0, 8)}...]` : ""}: `
  );
  if (visionKey) {
    configUpdates.GOOGLE_VISION_API_KEY = visionKey;
    hasChanges = true;
  } else if (currentVisionKey) {
    configUpdates.GOOGLE_VISION_API_KEY = currentVisionKey;
  }

  // Write updates
  if (hasChanges) {
    const existingEnv = envExists ? readFileSync(envPath, "utf-8") : "";
    const lines = existingEnv.split("\n").filter((line) => {
      const key = line.split("=")[0].trim();
      return !configUpdates.hasOwnProperty(key);
    });

    const newLines = Object.entries(configUpdates)
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");

    writeFileSync(envPath, [...lines, newLines].filter(Boolean).join("\n") + "\n");
    console.log("\n✅ Configuration saved to .env.local\n");
  } else {
    console.log("\n✅ Using existing configuration\n");
  }

  // Load updated env vars
  Object.entries(configUpdates).forEach(([key, value]) => {
    process.env[key] = value;
  });
  config({ path: envPath, override: true });

  // Test connections
  console.log("🔍 Testing connections...\n");

  console.log("Testing Cloudinary...");
  const cloudinaryTest = await testCloudinaryConnection();
  if (cloudinaryTest.success) {
    console.log(`✅ ${cloudinaryTest.message}\n`);
  } else {
    console.log(`❌ ${cloudinaryTest.error}\n`);
    console.log("   Please check your Cloudinary credentials.\n");
  }

  console.log("Testing Google Vision API...");
  const visionTest = await testVisionAPI();
  if (visionTest.success) {
    console.log(`✅ ${visionTest.message}`);
    if (visionTest.labels && visionTest.labels.length > 0) {
      console.log(`   Detected labels: ${visionTest.labels.join(", ")}\n`);
    }
  } else {
    console.log(`❌ ${visionTest.error}\n`);
    console.log("   Please check your Vision API key and ensure the API is enabled.\n");
  }

  // Summary
  console.log("=== SETUP SUMMARY ===\n");
  const allConfigured =
    cloudinaryTest.success && visionTest.success;

  if (allConfigured) {
    console.log("🎉 All services are configured and working!\n");
    console.log("Next steps:");
    console.log("  1. Run: npm run dev");
    console.log("  2. Start a mission and test image upload");
    console.log("  3. Verify metadata extraction works\n");
  } else {
    console.log("⚠️  Some services need attention:\n");
    if (!cloudinaryTest.success) {
      console.log("   - Cloudinary: Not configured or invalid credentials");
    }
    if (!visionTest.success) {
      console.log("   - Vision API: Not configured or invalid key");
    }
    console.log("\nSee docs/SETUP_CLOUDINARY_VISION.md for detailed setup instructions.\n");
  }

  rl.close();
}

main().catch((error) => {
  console.error("\n❌ Setup failed:", error);
  rl.close();
  process.exit(1);
});

