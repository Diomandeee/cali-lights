#!/usr/bin/env tsx
/**
 * Complete Mission Test Script
 *
 * This script demonstrates the full Cali Lights mission experience from start to finish:
 * 1. Creates a test user (admin)
 * 2. Creates a chain with members (mo, alize, sofia)
 * 3. Starts a mission with a creative prompt
 * 4. Has each member submit an entry
 * 5. Automatically locks when all submissions are in
 * 6. Generates the chapter/recap
 * 7. Optionally archives the mission
 *
 * Usage:
 *   npx tsx scripts/test-complete-mission.ts
 *
 * Optional flags:
 *   --skip-archive    Don't archive the mission (leave in RECAP state)
 *   --prompt="..."    Custom mission prompt
 *   --window=3600     Time window in seconds (default: 3600)
 */

import { Client } from "pg";
import { randomUUID } from "crypto";
import { config } from "dotenv";
import path from "path";

// Load environment variables
config({ path: path.resolve(process.cwd(), ".env") });

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const skipArchive = process.argv.includes("--skip-archive");
const customPrompt = process.argv.find(arg => arg.startsWith("--prompt="))?.split("=")[1];
const customWindow = process.argv.find(arg => arg.startsWith("--window="))?.split("=")[1];

// Sample prompts to choose from
const PROMPTS = [
  "Golden hour. Capture something warm and glowing.",
  "Find something blue. The deeper, the better.",
  "Capture movement. Something in motion, alive.",
  "The city at night. Neon, shadows, electricity.",
  "Nature's geometry. Patterns, symmetry, fractals.",
  "Reflections. Find yourself in glass, water, metal.",
  "Something vintage. Nostalgia in the modern world.",
  "The color purple. Royalty, mystery, twilight.",
];

// Test images from Unsplash (high quality, varied subjects)
const TEST_IMAGES = {
  mo: [
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
    "https://images.unsplash.com/photo-1519681393784-d120267933ba",
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b",
  ],
  alize: [
    "https://images.unsplash.com/photo-1501594907352-04cda38ebc29",
    "https://images.unsplash.com/photo-1514897575457-c4db467cf78e",
    "https://images.unsplash.com/photo-1475924156734-496f6cac6ec1",
  ],
  sofia: [
    "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05",
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e",
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e",
  ],
};

interface User {
  id: string;
  email: string;
  displayName: string;
  token?: string;
}

interface Chain {
  id: string;
  name: string;
  token: string;
}

interface Mission {
  id: string;
  prompt: string;
  state: string;
  windowSeconds: number;
  submissionsRequired: number;
  submissionsReceived: number;
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function apiCall(
  endpoint: string,
  options: RequestInit & { token?: string } = {}
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (options.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok && response.status !== 404) {
    const text = await response.text();
    console.error(`❌ API Error (${response.status}):`, text);
  }

  return response;
}

async function setupDatabase(): Promise<User[]> {
  console.log("\n📦 Setting up database...");

  const client = new Client({
    connectionString: process.env.POSTGRES_URL,
  });

  await client.connect();

  // Create test users if they don't exist
  const users: User[] = [
    {
      id: randomUUID(),
      email: "mo@calilights.local",
      displayName: "Mo",
    },
    {
      id: randomUUID(),
      email: "alize@calilights.local",
      displayName: "Alize",
    },
    {
      id: randomUUID(),
      email: "sofia@calilights.local",
      displayName: "Sofia",
    },
  ];

  for (const user of users) {
    await client.query(
      `INSERT INTO users (id, email, display_name, password_hash, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT (email) DO UPDATE SET display_name = EXCLUDED.display_name
       RETURNING id`,
      [
        user.id,
        user.email,
        user.displayName,
        "$2b$10$test.hash.for.local.dev", // Dummy hash
        user.email === "mo@calilights.local" ? "admin" : "member",
      ]
    );
  }

  // Fetch actual user IDs (in case they already existed)
  const userResults = await client.query(
    `SELECT id, email, display_name FROM users WHERE email = ANY($1)`,
    [users.map(u => u.email)]
  );

  const actualUsers: User[] = userResults.rows.map(row => ({
    id: row.id,
    email: row.email,
    displayName: row.display_name,
  }));

  await client.end();

  console.log("✅ Users ready:");
  actualUsers.forEach(u => console.log(`   - ${u.displayName} (${u.email})`));

  return actualUsers;
}

async function loginUser(email: string): Promise<string> {
  const response = await apiCall("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password: "test", // Dummy password for local dev
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to login ${email}`);
  }

  const data = await response.json();
  return data.token;
}

async function createChain(adminToken: string, chainName: string): Promise<Chain> {
  console.log(`\n🔗 Creating chain: "${chainName}"...`);

  const response = await apiCall("/api/chain/create", {
    method: "POST",
    token: adminToken,
    body: JSON.stringify({
      name: chainName,
      description: "Test chain for complete mission flow",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to create chain");
  }

  const chain = await response.json();
  console.log(`✅ Chain created: ${chain.id}`);
  console.log(`   Token: ${chain.token}`);

  return chain;
}

async function startMission(
  adminToken: string,
  chainId: string,
  prompt: string,
  windowSeconds: number
): Promise<Mission> {
  console.log(`\n🚀 Starting mission...`);
  console.log(`   Prompt: "${prompt}"`);
  console.log(`   Window: ${windowSeconds}s (${Math.floor(windowSeconds / 60)} minutes)`);

  const response = await apiCall("/api/mission/start", {
    method: "POST",
    token: adminToken,
    body: JSON.stringify({
      chainId,
      prompt,
      windowSeconds,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to start mission: ${error}`);
  }

  const mission = await response.json();
  console.log(`✅ Mission started: ${mission.id}`);
  console.log(`   State: ${mission.state}`);
  console.log(`   Required submissions: ${mission.submissionsRequired}`);

  return mission;
}

async function submitEntry(
  token: string,
  missionId: string,
  userName: string,
  mediaUrl: string
): Promise<void> {
  console.log(`\n📸 ${userName} submitting entry...`);

  // First join the mission
  const joinResponse = await apiCall("/api/mission/join", {
    method: "POST",
    token,
    body: JSON.stringify({ missionId }),
  });

  if (!joinResponse.ok) {
    throw new Error(`Failed to join mission for ${userName}`);
  }

  // Submit the entry
  const commitResponse = await apiCall("/api/entry/commit", {
    method: "POST",
    token,
    body: JSON.stringify({
      missionId,
      mediaUrl,
      mediaType: "photo",
      capturedAt: new Date().toISOString(),
      altText: `Photo submitted by ${userName}`,
    }),
  });

  if (!commitResponse.ok) {
    const error = await commitResponse.text();
    throw new Error(`Failed to commit entry for ${userName}: ${error}`);
  }

  const entry = await commitResponse.json();
  console.log(`✅ Entry submitted by ${userName}`);
  console.log(`   Entry ID: ${entry.id}`);
  console.log(`   Media: ${mediaUrl}`);
}

async function checkMissionState(token: string, missionId: string): Promise<Mission> {
  const response = await apiCall(`/api/mission/${missionId}`, {
    token,
  });

  if (!response.ok) {
    throw new Error("Failed to get mission state");
  }

  return await response.json();
}

async function generateRecap(token: string, missionId: string): Promise<void> {
  console.log(`\n🎬 Generating recap/chapter...`);

  const response = await apiCall("/api/mission/recap", {
    method: "POST",
    token,
    body: JSON.stringify({ missionId }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to generate recap: ${error}`);
  }

  const chapter = await response.json();
  console.log(`✅ Recap generated!`);
  console.log(`   Chapter ID: ${chapter.id}`);
  console.log(`   Title: ${chapter.title || "Untitled"}`);
  console.log(`   Poem: ${chapter.poem || "No poem"}`);
  if (chapter.videoUrl) {
    console.log(`   Video: ${chapter.videoUrl}`);
  }
  if (chapter.collageUrl) {
    console.log(`   Collage: ${chapter.collageUrl}`);
  }
}

async function archiveMission(token: string, missionId: string): Promise<void> {
  console.log(`\n📦 Archiving mission...`);

  const response = await apiCall("/api/mission/archive", {
    method: "POST",
    token,
    body: JSON.stringify({ missionId }),
  });

  if (!response.ok) {
    throw new Error("Failed to archive mission");
  }

  console.log(`✅ Mission archived`);
}

async function main() {
  console.log("🌟 CALI LIGHTS - COMPLETE MISSION TEST");
  console.log("=====================================\n");

  try {
    // Step 1: Setup database users
    const users = await setupDatabase();
    const [mo, alize, sofia] = users;

    // Step 2: Login users
    console.log("\n🔐 Logging in users...");
    mo.token = await loginUser(mo.email);
    alize.token = await loginUser(alize.email);
    sofia.token = await loginUser(sofia.email);
    console.log("✅ All users logged in");

    // Step 3: Create chain
    const chain = await createChain(mo.token!, "Test Mission Chain");

    // Step 4: Start mission
    const prompt = customPrompt || PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
    const windowSeconds = customWindow ? parseInt(customWindow) : 3600;
    const mission = await startMission(mo.token!, chain.id, prompt, windowSeconds);

    // Step 5: Wait a bit for realtime to settle
    console.log("\n⏱️  Waiting 2 seconds...");
    await sleep(2000);

    // Step 6: Submit entries (one from each user)
    const imageIndex = Math.floor(Math.random() * 3);
    await submitEntry(mo.token!, mission.id, "Mo", TEST_IMAGES.mo[imageIndex]);
    await sleep(1000);

    await submitEntry(alize.token!, mission.id, "Alize", TEST_IMAGES.alize[imageIndex]);
    await sleep(1000);

    await submitEntry(sofia.token!, mission.id, "Sofia", TEST_IMAGES.sofia[imageIndex]);

    // Step 7: Check mission state (should be FUSING or still CAPTURE)
    console.log("\n📊 Checking mission state...");
    await sleep(1000);
    let currentMission = await checkMissionState(mo.token!, mission.id);
    console.log(`   State: ${currentMission.state}`);
    console.log(`   Submissions: ${currentMission.submissionsReceived}/${currentMission.submissionsRequired}`);

    // Step 8: Wait for metadata extraction
    console.log("\n⏱️  Waiting for metadata extraction (5 seconds)...");
    await sleep(5000);

    // Step 9: Generate recap/chapter
    await generateRecap(mo.token!, mission.id);

    // Step 10: Check final state
    console.log("\n📊 Final mission state:");
    currentMission = await checkMissionState(mo.token!, mission.id);
    console.log(`   State: ${currentMission.state}`);

    // Step 11: Archive (optional)
    if (!skipArchive) {
      await archiveMission(mo.token!, mission.id);
      currentMission = await checkMissionState(mo.token!, mission.id);
      console.log(`   Final state: ${currentMission.state}`);
    }

    // Summary
    console.log("\n\n🎉 SUCCESS! Mission complete.");
    console.log("=====================================");
    console.log(`Mission ID: ${mission.id}`);
    console.log(`Chain ID: ${chain.id}`);
    console.log(`Chain Token: ${chain.token}`);
    console.log(`\nView the mission:`);
    console.log(`${BASE_URL}/mission/${mission.id}`);
    console.log(`\nView the chain:`);
    console.log(`${BASE_URL}/chain/${chain.id}`);
    console.log(`\nView in gallery:`);
    console.log(`${BASE_URL}/gallery`);

  } catch (error) {
    console.error("\n❌ ERROR:", error);
    process.exit(1);
  }
}

main();
