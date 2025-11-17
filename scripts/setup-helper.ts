#!/usr/bin/env node
/**
 * Setup Helper Script
 * 
 * Interactive script to help configure environment variables
 * and verify service connections
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createInterface } from "readline";
import path from "node:path";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function checkService(name: string, checkFn: () => Promise<boolean>) {
  process.stdout.write(`Checking ${name}... `);
  try {
    const result = await checkFn();
    if (result) {
      console.log("✅");
      return true;
    } else {
      console.log("❌");
      return false;
    }
  } catch (error) {
    console.log("❌");
    return false;
  }
}

async function testCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return false;
  
  try {
    const response = await fetch(`https://${cloudName}.cloudinary.com`);
    return response.status < 500;
  } catch {
    return false;
  }
}

async function testVisionAPI() {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) return false;
  
  // Just check if key is set (actual test would require an image)
  return apiKey.length > 20;
}

async function testDatabase() {
  try {
    const { sql } = await import("@/lib/db/client");
    await sql`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log("🔧 Cali Lights Setup Helper\n");

  const envPath = path.resolve(process.cwd(), ".env.local");
  const envExists = existsSync(envPath);

  if (!envExists) {
    console.log("📝 Creating .env.local file...\n");
    writeFileSync(envPath, "");
  }

  console.log("This script will help you configure environment variables.\n");
  console.log("Press Enter to skip any variable you don't want to set now.\n");

  const config: Record<string, string> = {};

  // Required variables
  console.log("=== REQUIRED VARIABLES ===\n");

  const postgresUrl = await question("POSTGRES_URL: ");
  if (postgresUrl) config.POSTGRES_URL = postgresUrl;

  const adminEmail = await question("ADMIN_EMAIL: ");
  if (adminEmail) config.ADMIN_EMAIL = adminEmail;

  const cloudinaryCloudName = await question("CLOUDINARY_CLOUD_NAME: ");
  if (cloudinaryCloudName) {
    config.CLOUDINARY_CLOUD_NAME = cloudinaryCloudName;
    config.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = cloudinaryCloudName;
  }

  const cloudinaryApiKey = await question("CLOUDINARY_API_KEY: ");
  if (cloudinaryApiKey) config.CLOUDINARY_API_KEY = cloudinaryApiKey;

  const cloudinaryApiSecret = await question("CLOUDINARY_API_SECRET: ");
  if (cloudinaryApiSecret) config.CLOUDINARY_API_SECRET = cloudinaryApiSecret;

  const visionApiKey = await question("GOOGLE_VISION_API_KEY: ");
  if (visionApiKey) config.GOOGLE_VISION_API_KEY = visionApiKey;

  const appUrl = await question("NEXT_PUBLIC_APP_URL (default: http://localhost:3000): ");
  config.NEXT_PUBLIC_APP_URL = appUrl || "http://localhost:3000";

  // Optional variables
  console.log("\n=== OPTIONAL VARIABLES ===\n");
  console.log("(Press Enter to skip)\n");

  const veoProject = await question("GOOGLE_CLOUD_PROJECT (for Veo): ");
  if (veoProject) config.GOOGLE_CLOUD_PROJECT = veoProject;

  const veoLocation = await question("GOOGLE_CLOUD_LOCATION (default: us-central1): ");
  if (veoLocation) config.GOOGLE_CLOUD_LOCATION = veoLocation;

  const ablyKey = await question("ABLY_API_KEY (for realtime): ");
  if (ablyKey) config.ABLY_API_KEY = ablyKey;

  const onesignalAppId = await question("ONESIGNAL_APP_ID (for notifications): ");
  if (onesignalAppId) config.ONESIGNAL_APP_ID = onesignalAppId;

  const onesignalApiKey = await question("ONESIGNAL_API_KEY: ");
  if (onesignalApiKey) config.ONESIGNAL_API_KEY = onesignalApiKey;

  const mapboxToken = await question("NEXT_PUBLIC_MAPBOX_TOKEN (for map view): ");
  if (mapboxToken) config.NEXT_PUBLIC_MAPBOX_TOKEN = mapboxToken;

  const cronSecret = await question("CRON_SECRET (for cron authentication): ");
  if (cronSecret) config.CRON_SECRET = cronSecret;

  // Write to .env.local
  const existingEnv = envExists ? readFileSync(envPath, "utf-8") : "";
  const newEnv = Object.entries(config)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  writeFileSync(envPath, existingEnv + (existingEnv ? "\n" : "") + newEnv + "\n");

  console.log("\n✅ Configuration saved to .env.local\n");

  // Test connections
  console.log("🔍 Testing connections...\n");

  // Load new env vars
  Object.entries(config).forEach(([key, value]) => {
    process.env[key] = value;
  });

  await checkService("Database", testDatabase);
  await checkService("Cloudinary", testCloudinary);
  await checkService("Vision API", testVisionAPI);

  console.log("\n✅ Setup complete!");
  console.log("\nNext steps:");
  console.log("1. Run: npm run db:migrate");
  console.log("2. Run: npm run dev");
  console.log("3. Visit: http://localhost:3000");

  rl.close();
}

main().catch((error) => {
  console.error("Setup failed:", error);
  rl.close();
  process.exit(1);
});

