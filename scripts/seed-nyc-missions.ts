import { Client } from "pg";
import { randomUUID } from "crypto";
import { config } from "dotenv";
import path from "path";

// Load environment variables
config({ path: path.resolve(__dirname, "../.env.local") });
config({ path: path.resolve(__dirname, "../.env") });

const postgresUrl = process.env.POSTGRES_URL;
if (!postgresUrl) {
  console.error("POSTGRES_URL not found in environment");
  process.exit(1);
}

// New York City locations with coordinates
const nycLocations = [
  { name: "Central Park", lat: 40.785091, lon: -73.968285, city: "New York", state: "NY", country: "USA" },
  { name: "Brooklyn Bridge", lat: 40.706086, lon: -73.996864, city: "New York", state: "NY", country: "USA" },
  { name: "Times Square", lat: 40.758896, lon: -73.985130, city: "New York", state: "NY", country: "USA" },
  { name: "High Line", lat: 40.748000, lon: -74.004800, city: "New York", state: "NY", country: "USA" },
  { name: "DUMBO", lat: 40.703309, lon: -73.988145, city: "Brooklyn", state: "NY", country: "USA" },
  { name: "Williamsburg", lat: 40.708115, lon: -73.957069, city: "Brooklyn", state: "NY", country: "USA" },
  { name: "SoHo", lat: 40.723077, lon: -74.002640, city: "New York", state: "NY", country: "USA" },
  { name: "East Village", lat: 40.726478, lon: -73.981534, city: "New York", state: "NY", country: "USA" },
  { name: "Greenwich Village", lat: 40.733572, lon: -74.002742, city: "New York", state: "NY", country: "USA" },
  { name: "Chelsea", lat: 40.746500, lon: -74.001374, city: "New York", state: "NY", country: "USA" },
];

const nycMissionPrompts = [
  "Golden hour reflections on the Hudson",
  "Neon signs after dark",
  "Street art and murals",
  "Skyline silhouettes at sunset",
  "Hidden courtyards and gardens",
  "Morning light through bridges",
  "Urban textures and patterns",
  "Rooftop views",
  "Subway station moments",
  "Parks in the city",
  "Architectural details",
  "Food truck scenes",
  "Night markets",
  "Waterfront sunrises",
  "Graffiti and street culture",
];

async function seedNYCMissions() {
  const client = new Client({ connectionString: postgresUrl });
  
  try {
    await client.connect();
    console.log("✅ Connected to database\n");

    // Find or create NYC chain
    let nycChainResult = await client.query(
      `SELECT id FROM chains WHERE name = 'NYC Lights' LIMIT 1`
    );

    let nycChainId: string;
    if (nycChainResult.rows.length > 0) {
      nycChainId = nycChainResult.rows[0].id;
      console.log(`📍 Found existing NYC chain: ${nycChainId}`);
    } else {
      nycChainId = randomUUID();
      await client.query(
        `INSERT INTO chains (id, name, theme_palette, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())`,
        [
          nycChainId,
          "NYC Lights",
          JSON.stringify(["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8"]),
        ]
      );
      console.log(`✨ Created NYC chain: ${nycChainId}`);
    }

    // Get admin user (or create one)
    let adminResult = await client.query(
      `SELECT id FROM users WHERE email = $1 LIMIT 1`,
      [process.env.ADMIN_EMAIL || "mdiomande7907@gmail.com"]
    );

    let adminUserId: string;
    if (adminResult.rows.length > 0) {
      adminUserId = adminResult.rows[0].id;
    } else {
      adminUserId = randomUUID();
      const bcrypt = await import("bcryptjs");
      const hash = await bcrypt.hash("placeholder", 12);
      await client.query(
        `INSERT INTO users (id, email, name, handle, password_hash, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [adminUserId, process.env.ADMIN_EMAIL || "mdiomande7907@gmail.com", "Admin", "admin", hash]
      );
    }

    // Ensure admin is member of NYC chain
    await client.query(
      `INSERT INTO memberships (id, chain_id, user_id, role, created_at)
       VALUES ($1, $2, $3, 'admin', NOW())
       ON CONFLICT (chain_id, user_id) DO NOTHING`,
      [randomUUID(), nycChainId, adminUserId]
    );

    console.log(`\n🗽 Creating NYC missions...\n`);

    // Create missions for each location
    const missions = [];
    const now = new Date();
    
    for (let i = 0; i < nycLocations.length; i++) {
      const location = nycLocations[i];
      const prompt = nycMissionPrompts[i % nycMissionPrompts.length];
      
      // Schedule missions over the next 30 days
      const daysOffset = Math.floor(i / 2); // Spread missions over days
      const missionDate = new Date(now);
      missionDate.setDate(missionDate.getDate() + daysOffset);
      missionDate.setHours(9 + (i % 12), 0, 0, 0); // Different times throughout the day
      
      const missionId = randomUUID();
      const startsAt = missionDate;
      const endsAt = new Date(startsAt.getTime() + 3600 * 1000); // 1 hour window
      
      // Determine state based on time
      let state = "LOBBY";
      if (startsAt < now) {
        if (endsAt < now) {
          state = "ARCHIVED";
        } else {
          state = "CAPTURE";
        }
      }

      await client.query(
        `INSERT INTO missions (
          id, chain_id, prompt, window_seconds, state,
          submissions_required, submissions_received,
          created_by, starts_at, ends_at, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        ON CONFLICT DO NOTHING`,
        [
          missionId,
          nycChainId,
          `${prompt} - ${location.name}`,
          3600, // 1 hour window
          state,
          3,
          0,
          adminUserId,
          startsAt.toISOString(),
          endsAt.toISOString(),
        ]
      );

      missions.push({
        id: missionId,
        location,
        prompt: `${prompt} - ${location.name}`,
        startsAt,
        endsAt,
        state,
      });

      console.log(`   📍 ${location.name}: "${prompt}" (${state})`);
    }

    // Create some sample entries for completed missions
    console.log(`\n📸 Creating sample entries...\n`);
    
    for (const mission of missions.filter(m => m.state === "ARCHIVED")) {
      // Create 2-3 entries per mission
      const entryCount = 2 + Math.floor(Math.random() * 2);
      
      for (let i = 0; i < entryCount; i++) {
        const entryId = randomUUID();
        const capturedAt = new Date(mission.startsAt.getTime() + (i * 15 * 60 * 1000)); // 15 min apart
        
        await client.query(
          `INSERT INTO entries (
            id, mission_id, user_id, media_url, media_type,
            gps_city, gps_lat, gps_lon,
            captured_at, created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
          [
            entryId,
            mission.id,
            adminUserId,
            `https://images.unsplash.com/photo-${Math.random().toString(36).substring(7)}?w=800`,
            "photo",
            mission.location.city,
            mission.location.lat + (Math.random() - 0.5) * 0.01, // Slight variation
            mission.location.lon + (Math.random() - 0.5) * 0.01,
            capturedAt.toISOString(),
          ]
        );
      }
      
      console.log(`   ✅ ${mission.location.name}: ${entryCount} entries`);
    }

    console.log(`\n🎉 NYC missions seeded successfully!`);
    console.log(`   Chain: NYC Lights (${nycChainId})`);
    console.log(`   Missions: ${missions.length}`);
    console.log(`   Locations: ${nycLocations.length}\n`);

  } catch (error) {
    console.error("❌ Error seeding NYC missions:", error);
    throw error;
  } finally {
    await client.end();
  }
}

seedNYCMissions()
  .then(() => {
    console.log("✅ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed:", error);
    process.exit(1);
  });

