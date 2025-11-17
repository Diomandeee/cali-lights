import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";
import { randomUUID } from "node:crypto";

// Load environment variables FIRST before any other imports
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
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
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

// Sample data for missions
const sampleMissions = [
  {
    prompt: "Golden hour. Capture something warm.",
    entries: [
      {
        user: "mo",
        mediaUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
        palette: ["#FF8C42", "#FFB347", "#FFD700", "#FFA500", "#FF6347"],
        dominantHue: 30,
        sceneTags: ["sunset", "golden hour", "warm light", "sky", "horizon"],
        objectTags: ["sun", "clouds", "landscape"],
        gpsCity: "San Francisco",
        gpsLat: 37.7749,
        gpsLon: -122.4194,
        altText: "Golden hour sunset over San Francisco"
      },
      {
        user: "alize",
        mediaUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800",
        palette: ["#FF6B35", "#F7931E", "#FFD23F", "#FFA07A", "#FF8C69"],
        dominantHue: 25,
        sceneTags: ["sunset", "warm tones", "golden light", "beach", "ocean"],
        objectTags: ["waves", "sand", "sky"],
        gpsCity: "Los Angeles",
        gpsLat: 34.0522,
        gpsLon: -118.2437,
        altText: "Warm golden hour at the beach"
      },
      {
        user: "sofia",
        mediaUrl: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800",
        palette: ["#FFA500", "#FFB84D", "#FFCC80", "#FFD700", "#FFE5B4"],
        dominantHue: 35,
        sceneTags: ["golden hour", "warm light", "city", "urban", "evening"],
        objectTags: ["buildings", "street", "windows"],
        gpsCity: "Oakland",
        gpsLat: 37.8044,
        gpsLon: -122.2711,
        altText: "Golden hour light on city buildings"
      }
    ],
    chapter: {
      title: "Cali at Dusk",
      poem: "Three moments, one light. Golden threads weaving through our day.",
      palette: ["#FF8C42", "#FFB347", "#FFD700", "#FFA500", "#FF6347"],
      collageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200",
      videoUrl: null,
      durationSeconds: 8
    }
  },
  {
    prompt: "Find something blue. The deeper, the better.",
    entries: [
      {
        user: "mo",
        mediaUrl: "https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800",
        palette: ["#1E3A8A", "#3B82F6", "#60A5FA", "#93C5FD", "#DBEAFE"],
        dominantHue: 220,
        sceneTags: ["ocean", "blue", "water", "deep", "vast"],
        objectTags: ["waves", "sea", "horizon"],
        gpsCity: "San Francisco",
        gpsLat: 37.7749,
        gpsLon: -122.4194,
        altText: "Deep blue ocean waves"
      },
      {
        user: "alize",
        mediaUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800",
        palette: ["#1E40AF", "#2563EB", "#3B82F6", "#60A5FA", "#93C5FD"],
        dominantHue: 215,
        sceneTags: ["sky", "blue", "clear", "bright", "day"],
        objectTags: ["clouds", "atmosphere"],
        gpsCity: "Los Angeles",
        gpsLat: 34.0522,
        gpsLon: -118.2437,
        altText: "Clear blue sky"
      },
      {
        user: "sofia",
        mediaUrl: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800",
        palette: ["#0F172A", "#1E293B", "#334155", "#475569", "#64748B"],
        dominantHue: 210,
        sceneTags: ["night", "blue", "dark", "moody", "urban"],
        objectTags: ["city", "lights", "buildings"],
        gpsCity: "Oakland",
        gpsLat: 37.8044,
        gpsLon: -122.2711,
        altText: "Deep blue night cityscape"
      }
    ],
    chapter: {
      title: "Shades of Blue",
      poem: "From ocean depths to midnight sky, blue finds us everywhere.",
      palette: ["#1E3A8A", "#3B82F6", "#60A5FA", "#93C5FD", "#1E40AF"],
      collageUrl: "https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1200",
      videoUrl: null,
      durationSeconds: 8
    }
  },
  {
    prompt: "Capture movement. Something in motion.",
    entries: [
      {
        user: "mo",
        mediaUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800",
        palette: ["#F59E0B", "#EF4444", "#EC4899", "#8B5CF6", "#6366F1"],
        dominantHue: 15,
        sceneTags: ["movement", "motion", "dynamic", "energy", "action"],
        objectTags: ["person", "running", "street"],
        gpsCity: "San Francisco",
        gpsLat: 37.7749,
        gpsLon: -122.4194,
        altText: "Person running through the city",
        motionScore: 0.85
      },
      {
        user: "alize",
        mediaUrl: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800",
        palette: ["#10B981", "#34D399", "#6EE7B7", "#A7F3D0", "#D1FAE5"],
        dominantHue: 150,
        sceneTags: ["nature", "movement", "wind", "flowing", "organic"],
        objectTags: ["leaves", "trees", "branches"],
        gpsCity: "Los Angeles",
        gpsLat: 34.0522,
        gpsLon: -118.2437,
        altText: "Leaves moving in the wind",
        motionScore: 0.65
      },
      {
        user: "sofia",
        mediaUrl: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800",
        palette: ["#F97316", "#FB923C", "#FDBA74", "#FED7AA", "#FFEDD5"],
        dominantHue: 20,
        sceneTags: ["traffic", "movement", "urban", "flow", "city"],
        objectTags: ["cars", "street", "lights"],
        gpsCity: "Oakland",
        gpsLat: 37.8044,
        gpsLon: -122.2711,
        altText: "Traffic flowing through city streets",
        motionScore: 0.75
      }
    ],
    chapter: {
      title: "In Motion",
      poem: "Life flows. We capture its rhythm, one frame at a time.",
      palette: ["#F59E0B", "#EF4444", "#10B981", "#8B5CF6", "#6366F1"],
      collageUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200",
      videoUrl: null,
      durationSeconds: 10
    }
  },
  {
    prompt: "Something green. Nature's color.",
    entries: [
      {
        user: "mo",
        mediaUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800",
        palette: ["#065F46", "#059669", "#10B981", "#34D399", "#6EE7B7"],
        dominantHue: 150,
        sceneTags: ["forest", "green", "nature", "trees", "lush"],
        objectTags: ["leaves", "plants", "foliage"],
        gpsCity: "San Francisco",
        gpsLat: 37.7749,
        gpsLon: -122.4194,
        altText: "Lush green forest"
      },
      {
        user: "alize",
        mediaUrl: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800",
        palette: ["#166534", "#16A34A", "#22C55E", "#4ADE80", "#86EFAC"],
        dominantHue: 140,
        sceneTags: ["park", "green", "grass", "nature", "outdoor"],
        objectTags: ["lawn", "trees", "benches"],
        gpsCity: "Los Angeles",
        gpsLat: 34.0522,
        gpsLon: -118.2437,
        altText: "Green park landscape"
      },
      {
        user: "sofia",
        mediaUrl: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800",
        palette: ["#14532D", "#15803D", "#16A34A", "#22C55E", "#4ADE80"],
        dominantHue: 145,
        sceneTags: ["garden", "green", "plants", "vegetation", "growth"],
        objectTags: ["flowers", "leaves", "stems"],
        gpsCity: "Oakland",
        gpsLat: 37.8044,
        gpsLon: -122.2711,
        altText: "Green garden plants"
      }
    ],
    chapter: {
      title: "Nature's Palette",
      poem: "Green finds us in forests, parks, gardens. Life's constant color.",
      palette: ["#065F46", "#059669", "#10B981", "#34D399", "#6EE7B7"],
      collageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200",
      videoUrl: null,
      durationSeconds: 8
    }
  },
  {
    prompt: "Find the light. Where does it fall?",
    entries: [
      {
        user: "mo",
        mediaUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
        palette: ["#FEF3C7", "#FDE68A", "#FCD34D", "#FBBF24", "#F59E0B"],
        dominantHue: 50,
        sceneTags: ["light", "sunlight", "bright", "illuminated", "warm"],
        objectTags: ["window", "sun", "rays"],
        gpsCity: "San Francisco",
        gpsLat: 37.7749,
        gpsLon: -122.4194,
        altText: "Sunlight streaming through window"
      },
      {
        user: "alize",
        mediaUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800",
        palette: ["#FEF9E7", "#FEF3C7", "#FDE68A", "#FCD34D", "#FBBF24"],
        dominantHue: 55,
        sceneTags: ["light", "golden", "warm", "glowing", "radiant"],
        objectTags: ["lamp", "bulb", "glow"],
        gpsCity: "Los Angeles",
        gpsLat: 34.0522,
        gpsLon: -118.2437,
        altText: "Warm golden light"
      },
      {
        user: "sofia",
        mediaUrl: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800",
        palette: ["#FEF3C7", "#FDE68A", "#FCD34D", "#FBBF24", "#F59E0B"],
        dominantHue: 45,
        sceneTags: ["light", "shadow", "contrast", "dramatic", "striking"],
        objectTags: ["shadows", "patterns", "light"],
        gpsCity: "Oakland",
        gpsLat: 37.8044,
        gpsLon: -122.2711,
        altText: "Light and shadow patterns"
      }
    ],
    chapter: {
      title: "Where Light Falls",
      poem: "Light finds its way. Through windows, lamps, shadows. Always present.",
      palette: ["#FEF3C7", "#FDE68A", "#FCD34D", "#FBBF24", "#F59E0B"],
      collageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200",
      videoUrl: null,
      durationSeconds: 8
    }
  }
];

async function seedDatabase() {
  console.log("🌱 Starting database seed...");

  const postgresUrl = process.env.POSTGRES_URL;
  if (!postgresUrl) {
    throw new Error("POSTGRES_URL environment variable is not set");
  }

  const client = new Client({ connectionString: postgresUrl });
  await client.connect();

  // Get user ID and chain ID
  const userResult = await client.query(
    "SELECT id FROM users WHERE email = $1 LIMIT 1",
    ["mdiomande7907@gmail.com"]
  );
  const userId = userResult.rows[0]?.id;
  if (!userId) {
    throw new Error("User not found. Please make sure you're logged in.");
  }

  const chainResult = await client.query(
    "SELECT id FROM chains WHERE name = $1 LIMIT 1",
    ["Cali Triad"]
  );
  const chainId = chainResult.rows[0]?.id;
  if (!chainId) {
    throw new Error("Chain 'Cali Triad' not found.");
  }

  console.log(`✅ Found user: ${userId}`);
  console.log(`✅ Found chain: ${chainId}`);

  // Use your user ID for all entries (you can create separate users later)
  const userMap: Record<string, string> = {
    mo: userId,
    alize: userId,
    sofia: userId
  };

  // Create missions with entries and chapters
  for (let i = 0; i < sampleMissions.length; i++) {
    const missionData = sampleMissions[i];
    const daysAgo = sampleMissions.length - i - 1;
    const missionDate = new Date();
    missionDate.setDate(missionDate.getDate() - daysAgo);
    missionDate.setHours(10, 0, 0, 0);

    console.log(`\n📸 Mission ${i + 1}: "${missionData.prompt}"`);

    // Create mission
    const missionId = randomUUID();
    const startsAt = missionDate;
    const endsAt = new Date(missionDate.getTime() + 3600 * 1000);

    await client.query(
      `INSERT INTO missions (id, chain_id, prompt, window_seconds, state, submissions_required, submissions_received, created_by, starts_at, ends_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [missionId, chainId, missionData.prompt, 3600, "CAPTURE", 3, 0, userId, startsAt, endsAt]
    );

    // Create entries
    for (const entryData of missionData.entries) {
      const entryUserId = userMap[entryData.user];
      const capturedAt = new Date(missionDate);
      capturedAt.setMinutes(capturedAt.getMinutes() + Math.floor(Math.random() * 30) + 10);
      const entryId = randomUUID();

      await client.query(
        `INSERT INTO entries (id, mission_id, user_id, media_url, media_type, gps_city, gps_lat, gps_lon, captured_at, alt_text, dominant_hue, palette, scene_tags, object_tags, motion_score, metadata_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
         ON CONFLICT (user_id, mission_id) DO UPDATE SET
           media_url = EXCLUDED.media_url,
           updated_at = NOW()`,
        [
          entryId,
          missionId,
          entryUserId,
          entryData.mediaUrl,
          "photo",
          entryData.gpsCity,
          entryData.gpsLat,
          entryData.gpsLon,
          capturedAt,
          entryData.altText,
          entryData.dominantHue,
          JSON.stringify(entryData.palette),
          entryData.sceneTags,
          entryData.objectTags,
          ("motionScore" in entryData ? entryData.motionScore : null) ?? null,
          "complete"
        ]
      );
      console.log(`  ✅ Entry by ${entryData.user}`);
    }

    // Update mission submission count and state
    await client.query(
      `UPDATE missions SET submissions_received = $1, state = $2, locked_at = $3, recap_ready_at = $4 WHERE id = $5`,
      [missionData.entries.length, "RECAP", new Date(missionDate.getTime() + 3600 * 1000), new Date(missionDate.getTime() + 3600 * 1000), missionId]
    );

    // Create chapter
    const chapterId = randomUUID();
    const generatedAt = new Date(missionDate.getTime() + 3600 * 1000);

    await client.query(
      `INSERT INTO chapters (id, mission_id, title, poem, collage_url, video_url, duration_seconds, final_palette, generated_at, is_shareable)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        chapterId,
        missionId,
        missionData.chapter.title,
        missionData.chapter.poem,
        missionData.chapter.collageUrl,
        missionData.chapter.videoUrl || missionData.chapter.collageUrl,
        missionData.chapter.durationSeconds,
        JSON.stringify(missionData.chapter.palette),
        generatedAt,
        false
      ]
    );

    // Archive mission
    await client.query(
      `UPDATE missions SET state = $1, archived_at = $2 WHERE id = $3`,
      ["ARCHIVED", new Date(missionDate.getTime() + 7200 * 1000), missionId]
    );

    console.log(`  ✅ Chapter: "${missionData.chapter.title}"`);
  }

  // Create one active mission (in LOBBY state)
  console.log(`\n🚀 Active Mission: "Morning light. What catches your eye?"`);
  const activeMissionId = randomUUID();
  const activeStartsAt = new Date();
  const activeEndsAt = new Date(activeStartsAt.getTime() + 3600 * 1000);

  await client.query(
    `INSERT INTO missions (id, chain_id, prompt, window_seconds, state, submissions_required, submissions_received, created_by, starts_at, ends_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [activeMissionId, chainId, "Morning light. What catches your eye?", 3600, "LOBBY", 3, 0, userId, activeStartsAt, activeEndsAt]
  );

  // Update chain with active mission
  await client.query(
    `UPDATE chains SET active_mission_id = $1 WHERE id = $2`,
    [activeMissionId, chainId]
  );

  console.log(`  ✅ Active mission created (LOBBY state)`);

  await client.end();

  console.log(`\n✅ Seed complete! Created ${sampleMissions.length} completed missions + 1 active mission`);
  console.log(`\nVisit:`);
  console.log(`  - /gallery - See all chapters and entries`);
  console.log(`  - /chain/${chainId} - See chain dashboard`);
  console.log(`  - /mission/${activeMissionId} - See active mission`);
  console.log(`  - /admin - Admin panel`);
}

seedDatabase().catch(console.error);
