#!/usr/bin/env node
/**
 * Enhanced End-to-End Test Script for Cali Lights
 * 
 * This script tests the complete mission flow:
 * 1. Register/Login user
 * 2. Create or find a chain
 * 3. Start a mission
 * 4. Join the mission
 * 5. Upload and commit entries (3 entries)
 * 6. Generate recap/chapter
 * 7. Verify chapter in gallery
 * 8. Test sharing
 */

import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

// Load environment variables
const envPaths = [
  path.resolve(__dirname, "../.env.local"),
  path.resolve(__dirname, "../.env"),
];

for (const envPath of envPaths) {
  if (existsSync(envPath)) {
    const envFile = readFileSync(envPath, "utf-8");
    envFile.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const match = trimmed.match(/^([^=:#]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
    break;
  }
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const TEST_EMAIL = process.env.TEST_EMAIL || "test@example.com";
const TEST_PASSWORD = process.env.TEST_PASSWORD || "TestPassword123!";

// Test images from Unsplash
const TEST_IMAGES = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800",
  "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800",
];

let authToken: string = "";
let userId: string = "";
let chainId: string = "";
let missionId: string = "";
let chapterId: string = "";

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function apiCall(endpoint: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(url, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    return { status: response.status, data, headers: response.headers };
  } catch (error) {
    return {
      status: 0,
      data: { error: error instanceof Error ? error.message : "Network error" },
    };
  }
}

async function step(name: string, fn: () => Promise<any>) {
  console.log(`\n🔄 ${name}...`);
  try {
    const result = await fn();
    console.log(`✅ ${name} completed`);
    return result;
  } catch (error) {
    console.error(`❌ ${name} failed:`, error);
    throw error;
  }
}

async function main() {
  console.log("🚀 Starting End-to-End Test Suite");
  console.log(`📍 Base URL: ${BASE_URL}\n`);

  try {
    // Step 1: Register/Login
    await step("Register/Login User", async () => {
      // Try to register first
      const registerResult = await apiCall("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
          name: "Test User",
          handle: "testuser",
        }),
      });

      if (registerResult.status === 200 || registerResult.status === 409) {
        // Login
        const loginResult = await apiCall("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
          }),
        });

        if (loginResult.status !== 200) {
          throw new Error(`Login failed: ${JSON.stringify(loginResult.data)}`);
        }

        // Extract token from Set-Cookie header
        const setCookie = loginResult.headers?.get("set-cookie");
        if (setCookie) {
          const match = setCookie.match(/cali_token=([^;]+)/);
          if (match) {
            authToken = match[1];
          }
        }

        userId = loginResult.data.user?.id || "";
        console.log(`   User ID: ${userId}`);
        console.log(`   Token: ${authToken.substring(0, 20)}...`);
      } else {
        throw new Error(`Registration failed: ${JSON.stringify(registerResult.data)}`);
      }
    });

    // Step 2: Get or Create Chain
    await step("Get or Create Chain", async () => {
      // Try to get user's chains
      const chainsResult = await apiCall("/api/network");
      if (chainsResult.status === 200 && chainsResult.data.chains?.length > 0) {
        chainId = chainsResult.data.chains[0].id;
        console.log(`   Using existing chain: ${chainId}`);
      } else {
        // Create new chain
        const createResult = await apiCall("/api/chain/create", {
          method: "POST",
          body: JSON.stringify({
            name: "E2E Test Chain",
            description: "Chain for end-to-end testing",
          }),
        });

        if (createResult.status !== 200) {
          throw new Error(`Chain creation failed: ${JSON.stringify(createResult.data)}`);
        }

        chainId = createResult.data.chain.id;
        console.log(`   Created new chain: ${chainId}`);
      }
    });

    // Step 3: Start Mission
    await step("Start Mission", async () => {
      const startResult = await apiCall("/api/mission/start", {
        method: "POST",
        body: JSON.stringify({
          chainId,
          prompt: "E2E Test: Capture something beautiful",
          windowSeconds: 3600,
        }),
      });

      if (startResult.status !== 200) {
        throw new Error(`Mission start failed: ${JSON.stringify(startResult.data)}`);
      }

      missionId = startResult.data.mission.id;
      console.log(`   Mission ID: ${missionId}`);
      console.log(`   Prompt: ${startResult.data.mission.prompt}`);
    });

    // Step 4: Join Mission
    await step("Join Mission", async () => {
      const joinResult = await apiCall("/api/mission/join", {
        method: "POST",
        body: JSON.stringify({ missionId }),
      });

      if (joinResult.status !== 200) {
        throw new Error(`Mission join failed: ${JSON.stringify(joinResult.data)}`);
      }

      console.log(`   Joined mission successfully`);
    });

    // Step 5: Upload and Commit Entries
    await step("Upload and Commit Entries", async () => {
      for (let i = 0; i < 3; i++) {
        console.log(`   Uploading entry ${i + 1}/3...`);

        // For testing, we'll use direct URLs (in real app, upload to Cloudinary first)
        const commitResult = await apiCall("/api/entry/commit", {
          method: "POST",
          body: JSON.stringify({
            missionId,
            mediaUrl: TEST_IMAGES[i],
            mediaType: "photo",
            gpsCity: "San Francisco",
            altText: `Test entry ${i + 1}`,
          }),
        });

        if (commitResult.status !== 200) {
          throw new Error(
            `Entry commit failed: ${JSON.stringify(commitResult.data)}`
          );
        }

        console.log(`   Entry ${i + 1} committed: ${commitResult.data.entry.id}`);
        console.log(`   Submissions: ${commitResult.data.submissions}/${commitResult.data.mission.submissions_required}`);

        // Wait a bit between entries
        await sleep(1000);
      }
    });

    // Step 6: Wait for metadata extraction (if configured)
    await step("Wait for Metadata Extraction", async () => {
      console.log("   Waiting 5 seconds for metadata extraction...");
      await sleep(5000);
    });

    // Step 7: Generate Recap
    await step("Generate Chapter Recap", async () => {
      const recapResult = await apiCall("/api/mission/recap", {
        method: "POST",
        body: JSON.stringify({ missionId }),
      });

      if (recapResult.status !== 200) {
        throw new Error(`Recap failed: ${JSON.stringify(recapResult.data)}`);
      }

      chapterId = recapResult.data.chapter.id;
      console.log(`   Chapter ID: ${chapterId}`);
      console.log(`   Title: ${recapResult.data.chapter.title}`);
      console.log(`   Using fallback: ${recapResult.data.usingFallback}`);
    });

    // Step 8: Verify Chapter in Gallery
    await step("Verify Chapter in Gallery", async () => {
      const chaptersResult = await apiCall("/api/gallery/chapters?scope=chain&chainId=" + chainId);
      
      if (chaptersResult.status !== 200) {
        throw new Error(`Gallery fetch failed: ${JSON.stringify(chaptersResult.data)}`);
      }

      const found = chaptersResult.data.items?.find((ch: any) => ch.id === chapterId);
      if (!found) {
        throw new Error("Chapter not found in gallery");
      }

      console.log(`   Chapter found in gallery`);
      console.log(`   Total chapters: ${chaptersResult.data.items?.length || 0}`);
    });

    // Step 9: Test Chapter Sharing
    await step("Test Chapter Sharing", async () => {
      const shareResult = await apiCall("/api/chapter/share", {
        method: "POST",
        body: JSON.stringify({
          chapterId,
          on: true,
          expiresInHours: 72,
        }),
      });

      if (shareResult.status !== 200) {
        console.warn(`   Sharing failed (may not be admin): ${JSON.stringify(shareResult.data)}`);
      } else {
        console.log(`   Share URL: ${shareResult.data.url}`);
        console.log(`   Expires: ${shareResult.data.expiresAt}`);
      }
    });

    // Step 10: Verify Health Check
    await step("Verify Health Check", async () => {
      const healthResult = await apiCall("/api/health");
      
      if (healthResult.status !== 200) {
        throw new Error(`Health check failed: ${JSON.stringify(healthResult.data)}`);
      }

      console.log(`   Status: ${healthResult.data.status}`);
      console.log(`   Database: ${healthResult.data.services.database}`);
      console.log(`   Cloudinary: ${healthResult.data.services.cloudinary}`);
      console.log(`   Vision API: ${healthResult.data.services.vision}`);
    });

    console.log("\n✅ All tests passed!");
    console.log("\n📊 Summary:");
    console.log(`   User ID: ${userId}`);
    console.log(`   Chain ID: ${chainId}`);
    console.log(`   Mission ID: ${missionId}`);
    console.log(`   Chapter ID: ${chapterId}`);
    console.log("\n🎉 End-to-end test suite completed successfully!");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Test suite failed!");
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
