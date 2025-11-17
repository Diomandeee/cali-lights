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

// Constellation definitions - each is a chain with multiple missions
const constellations = [
  {
    name: "Cali Triad",
    description: "Mo, Alize, and Sofia's daily visual diary",
    theme: "golden",
    palette: ["#FF8C42", "#FFB347", "#FFD700", "#FFA500", "#FF6347"],
    missions: [
      {
        prompt: "Golden hour. Capture something warm.",
        daysAgo: 4,
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
        }
      },
      {
        prompt: "Find something blue. The deeper, the better.",
        daysAgo: 3,
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
        }
      },
      {
        prompt: "Capture movement. Something in motion.",
        daysAgo: 2,
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
        }
      }
    ],
    activeMission: {
      prompt: "Morning light. What catches your eye?",
      state: "LOBBY"
    }
  },
  {
    name: "Pacific Dreams",
    description: "Coastal vibes and ocean whispers",
    theme: "oceanic",
    palette: ["#0EA5E9", "#06B6D4", "#22D3EE", "#67E8F9", "#A5F3FC"],
    missions: [
      {
        prompt: "Find the horizon. Where sky meets sea.",
        daysAgo: 5,
        entries: [
          {
            user: "mo",
            mediaUrl: "https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800",
            palette: ["#0EA5E9", "#06B6D4", "#22D3EE", "#67E8F9", "#A5F3FC"],
            dominantHue: 195,
            sceneTags: ["ocean", "horizon", "sky", "vast", "endless"],
            objectTags: ["water", "clouds", "line"],
            gpsCity: "Santa Monica",
            gpsLat: 34.0195,
            gpsLon: -118.4912,
            altText: "Ocean horizon at sunset"
          },
          {
            user: "alize",
            mediaUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800",
            palette: ["#0284C7", "#0EA5E9", "#38BDF8", "#7DD3FC", "#BAE6FD"],
            dominantHue: 200,
            sceneTags: ["beach", "waves", "coast", "peaceful"],
            objectTags: ["sand", "foam", "rocks"],
            gpsCity: "Malibu",
            gpsLat: 34.0259,
            gpsLon: -118.7798,
            altText: "Waves crashing on the shore"
          },
          {
            user: "sofia",
            mediaUrl: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800",
            palette: ["#0369A1", "#0C4A6E", "#075985", "#0E7490", "#155E75"],
            dominantHue: 205,
            sceneTags: ["deep", "water", "mysterious", "blue"],
            objectTags: ["depths", "current", "flow"],
            gpsCity: "Venice",
            gpsLat: 33.9850,
            gpsLon: -118.4695,
            altText: "Deep blue ocean water"
          }
        ],
        chapter: {
          title: "Endless Blue",
          poem: "Horizon calls. We answer with our eyes.",
          palette: ["#0EA5E9", "#06B6D4", "#22D3EE", "#67E8F9", "#A5F3FC"],
          collageUrl: "https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1200",
        }
      },
      {
        prompt: "Something that moves with the tide.",
        daysAgo: 1,
        entries: [
          {
            user: "mo",
            mediaUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800",
            palette: ["#06B6D4", "#22D3EE", "#67E8F9", "#A5F3FC", "#CFFAFE"],
            dominantHue: 190,
            sceneTags: ["tide", "movement", "rhythm", "ocean"],
            objectTags: ["waves", "foam", "sand"],
            gpsCity: "Santa Monica",
            gpsLat: 34.0195,
            gpsLon: -118.4912,
            altText: "Tide moving in and out",
            motionScore: 0.7
          },
          {
            user: "alize",
            mediaUrl: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800",
            palette: ["#0EA5E9", "#38BDF8", "#7DD3FC", "#BAE6FD", "#E0F2FE"],
            dominantHue: 195,
            sceneTags: ["driftwood", "tide", "beach", "natural"],
            objectTags: ["wood", "water", "sand"],
            gpsCity: "Malibu",
            gpsLat: 34.0259,
            gpsLon: -118.7798,
            altText: "Driftwood moved by the tide"
          },
          {
            user: "sofia",
            mediaUrl: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800",
            palette: ["#0284C7", "#0EA5E9", "#22D3EE", "#67E8F9", "#A5F3FC"],
            dominantHue: 200,
            sceneTags: ["seaweed", "tide", "underwater", "flow"],
            objectTags: ["plants", "current", "movement"],
            gpsCity: "Venice",
            gpsLat: 33.9850,
            gpsLon: -118.4695,
            altText: "Seaweed swaying with the tide",
            motionScore: 0.6
          }
        ],
        chapter: {
          title: "Tidal Rhythm",
          poem: "Everything moves with the tide. We are no exception.",
          palette: ["#06B6D4", "#22D3EE", "#67E8F9", "#A5F3FC", "#CFFAFE"],
          collageUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200",
        }
      }
    ],
    activeMission: {
      prompt: "Capture the sound of waves. In an image.",
      state: "LOBBY"
    }
  },
  {
    name: "Urban Shadows",
    description: "City lights and hidden corners",
    theme: "nocturnal",
    palette: ["#1E293B", "#334155", "#475569", "#64748B", "#94A3B8"],
    missions: [
      {
        prompt: "Find light in darkness. Where does it hide?",
        daysAgo: 6,
        entries: [
          {
            user: "mo",
            mediaUrl: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800",
            palette: ["#0F172A", "#1E293B", "#334155", "#475569", "#64748B"],
            dominantHue: 220,
            sceneTags: ["night", "city", "dark", "moody", "urban"],
            objectTags: ["lights", "buildings", "street"],
            gpsCity: "San Francisco",
            gpsLat: 37.7749,
            gpsLon: -122.4194,
            altText: "City lights at night"
          },
          {
            user: "alize",
            mediaUrl: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800",
            palette: ["#1E293B", "#334155", "#475569", "#64748B", "#94A3B8"],
            dominantHue: 215,
            sceneTags: ["alley", "shadow", "mystery", "urban"],
            objectTags: ["walls", "light", "dark"],
            gpsCity: "Los Angeles",
            gpsLat: 34.0522,
            gpsLon: -118.2437,
            altText: "Light and shadow in an alley"
          },
          {
            user: "sofia",
            mediaUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
            palette: ["#334155", "#475569", "#64748B", "#94A3B8", "#CBD5E1"],
            dominantHue: 210,
            sceneTags: ["neon", "sign", "night", "colorful"],
            objectTags: ["lights", "text", "glow"],
            gpsCity: "Oakland",
            gpsLat: 37.8044,
            gpsLon: -122.2711,
            altText: "Neon signs lighting up the night"
          }
        ],
        chapter: {
          title: "Night Lights",
          poem: "Darkness reveals what daylight hides. Light finds its way.",
          palette: ["#1E293B", "#334155", "#475569", "#64748B", "#94A3B8"],
          collageUrl: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1200",
        }
      }
    ],
    activeMission: {
      prompt: "What glows in your city tonight?",
      state: "LOBBY"
    }
  },
  {
    name: "Nature's Palette",
    description: "Green spaces and natural wonders",
    theme: "organic",
    palette: ["#065F46", "#059669", "#10B981", "#34D399", "#6EE7B7"],
    missions: [
      {
        prompt: "Something green. Nature's color.",
        daysAgo: 7,
        entries: [
          {
            user: "mo",
            mediaUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800",
            palette: ["#065F46", "#059669", "#10B981", "#34D399", "#6EE7B7"],
            dominantHue: 150,
            sceneTags: ["forest", "green", "nature", "trees", "lush"],
            objectTags: ["leaves", "plants", "foliage"],
            gpsCity: "Berkeley",
            gpsLat: 37.8715,
            gpsLon: -122.2730,
            altText: "Lush green forest"
          },
          {
            user: "alize",
            mediaUrl: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800",
            palette: ["#166534", "#16A34A", "#22C55E", "#4ADE80", "#86EFAC"],
            dominantHue: 140,
            sceneTags: ["park", "green", "grass", "nature", "outdoor"],
            objectTags: ["lawn", "trees", "benches"],
            gpsCity: "Palo Alto",
            gpsLat: 37.4419,
            gpsLon: -122.1430,
            altText: "Green park landscape"
          },
          {
            user: "sofia",
            mediaUrl: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800",
            palette: ["#14532D", "#15803D", "#16A34A", "#22C55E", "#4ADE80"],
            dominantHue: 145,
            sceneTags: ["garden", "green", "plants", "vegetation", "growth"],
            objectTags: ["flowers", "leaves", "stems"],
            gpsCity: "San Jose",
            gpsLat: 37.3382,
            gpsLon: -121.8863,
            altText: "Green garden plants"
          }
        ],
        chapter: {
          title: "Nature's Palette",
          poem: "Green finds us in forests, parks, gardens. Life's constant color.",
          palette: ["#065F46", "#059669", "#10B981", "#34D399", "#6EE7B7"],
          collageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200",
        }
      },
      {
        prompt: "Find growth. Where is life expanding?",
        daysAgo: 0,
        entries: [],
        chapter: null
      }
    ],
    activeMission: {
      prompt: "Find growth. Where is life expanding?",
      state: "LOBBY"
    }
  },
  {
    name: "Sunset Stories",
    description: "Evening colors and twilight moments",
    theme: "sunset",
    palette: ["#F97316", "#FB923C", "#FDBA74", "#FED7AA", "#FFEDD5"],
    missions: [
      {
        prompt: "Capture the moment when day becomes night.",
        daysAgo: 2,
        entries: [
          {
            user: "mo",
            mediaUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
            palette: ["#F97316", "#FB923C", "#FDBA74", "#FED7AA", "#FFEDD5"],
            dominantHue: 25,
            sceneTags: ["sunset", "twilight", "evening", "warm", "sky"],
            objectTags: ["horizon", "clouds", "colors"],
            gpsCity: "San Francisco",
            gpsLat: 37.7749,
            gpsLon: -122.4194,
            altText: "Sunset over the bay"
          },
          {
            user: "alize",
            mediaUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800",
            palette: ["#EA580C", "#F97316", "#FB923C", "#FDBA74", "#FED7AA"],
            dominantHue: 20,
            sceneTags: ["sunset", "orange", "warm", "beautiful", "sky"],
            objectTags: ["clouds", "light", "atmosphere"],
            gpsCity: "Los Angeles",
            gpsLat: 34.0522,
            gpsLon: -118.2437,
            altText: "Orange sunset sky"
          },
          {
            user: "sofia",
            mediaUrl: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800",
            palette: ["#DC2626", "#EF4444", "#F87171", "#FCA5A5", "#FEE2E2"],
            dominantHue: 0,
            sceneTags: ["sunset", "red", "dramatic", "sky", "evening"],
            objectTags: ["clouds", "horizon", "colors"],
            gpsCity: "Oakland",
            gpsLat: 37.8044,
            gpsLon: -122.2711,
            altText: "Red sunset sky"
          }
        ],
        chapter: {
          title: "Twilight Moments",
          poem: "Day ends. Night begins. We capture the transition.",
          palette: ["#F97316", "#FB923C", "#FDBA74", "#FED7AA", "#FFEDD5"],
          collageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200",
        }
      }
    ],
    activeMission: {
      prompt: "What color is the sky right now?",
      state: "CAPTURE"
    }
  },
  {
    name: "Morning Rituals",
    description: "Dawn light and new beginnings",
    theme: "dawn",
    palette: ["#FBBF24", "#FCD34D", "#FDE047", "#FEF08A", "#FEF9C3"],
    missions: [
      {
        prompt: "First light. What does morning look like?",
        daysAgo: 1,
        entries: [
          {
            user: "mo",
            mediaUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
            palette: ["#FBBF24", "#FCD34D", "#FDE047", "#FEF08A", "#FEF9C3"],
            dominantHue: 50,
            sceneTags: ["dawn", "morning", "light", "fresh", "new"],
            objectTags: ["sky", "sunrise", "horizon"],
            gpsCity: "San Francisco",
            gpsLat: 37.7749,
            gpsLon: -122.4194,
            altText: "Morning sunrise"
          },
          {
            user: "alize",
            mediaUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800",
            palette: ["#F59E0B", "#FBBF24", "#FCD34D", "#FDE047", "#FEF08A"],
            dominantHue: 45,
            sceneTags: ["morning", "golden", "warm", "light", "dawn"],
            objectTags: ["sky", "clouds", "light"],
            gpsCity: "Los Angeles",
            gpsLat: 34.0522,
            gpsLon: -118.2437,
            altText: "Golden morning light"
          },
          {
            user: "sofia",
            mediaUrl: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800",
            palette: ["#D97706", "#F59E0B", "#FBBF24", "#FCD34D", "#FDE047"],
            dominantHue: 40,
            sceneTags: ["sunrise", "morning", "orange", "warm", "new day"],
            objectTags: ["horizon", "sky", "light"],
            gpsCity: "Oakland",
            gpsLat: 37.8044,
            gpsLon: -122.2711,
            altText: "Sunrise over the city"
          }
        ],
        chapter: {
          title: "Dawn's First Light",
          poem: "Morning arrives. We greet it with our cameras.",
          palette: ["#FBBF24", "#FCD34D", "#FDE047", "#FEF08A", "#FEF9C3"],
          collageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200",
        }
      }
    ],
    activeMission: {
      prompt: "Morning light. What catches your eye?",
      state: "LOBBY"
    }
  }
];

async function seedConstellations() {
  console.log("🌌 Starting constellation seed...\n");

  const postgresUrl = process.env.POSTGRES_URL;
  if (!postgresUrl) {
    throw new Error("POSTGRES_URL environment variable is not set");
  }

  const client = new Client({ connectionString: postgresUrl });
  await client.connect();

  // Get your user ID
  const userResult = await client.query(
    "SELECT id FROM users WHERE email = $1 LIMIT 1",
    ["mdiomande7907@gmail.com"]
  );
  const userId = userResult.rows[0]?.id;
  if (!userId) {
    throw new Error("User not found. Please make sure you're logged in.");
  }

  console.log(`✅ Found user: ${userId}\n`);

  // Create or find chains and populate missions
  for (const constellation of constellations) {
    console.log(`📡 Creating constellation: ${constellation.name}`);
    
    // Check if chain exists
    let chainResult = await client.query(
      "SELECT id FROM chains WHERE name = $1 LIMIT 1",
      [constellation.name]
    );
    
    let chainId: string;
    if (chainResult.rows[0]) {
      chainId = chainResult.rows[0].id;
      console.log(`   ⚡ Found existing chain: ${chainId}`);
    } else {
      chainId = randomUUID();
      await client.query(
        `INSERT INTO chains (id, name, description, palette, created_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          chainId,
          constellation.name,
          constellation.description,
          JSON.stringify(constellation.palette),
          userId
        ]
      );
      console.log(`   ✨ Created new chain: ${chainId}`);
    }

    // Ensure user is a member (admin)
    await client.query(
      `INSERT INTO memberships (chain_id, user_id, role)
       VALUES ($1, $2, 'admin')
       ON CONFLICT (chain_id, user_id) DO UPDATE SET role = 'admin'`,
      [chainId, userId]
    );

    // Create completed missions
    for (const missionData of constellation.missions) {
      const missionDate = new Date();
      missionDate.setDate(missionDate.getDate() - missionData.daysAgo);
      missionDate.setHours(10, 0, 0, 0);

      const missionId = randomUUID();
      const startsAt = missionDate;
      const endsAt = new Date(missionDate.getTime() + 3600 * 1000);

      await client.query(
        `INSERT INTO missions (id, chain_id, prompt, window_seconds, state, submissions_required, submissions_received, created_by, starts_at, ends_at, locked_at, recap_ready_at, archived_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT DO NOTHING`,
        [
          missionId,
          chainId,
          missionData.prompt,
          3600,
          "ARCHIVED",
          3,
          missionData.entries.length,
          userId,
          startsAt,
          endsAt,
          new Date(missionDate.getTime() + 3600 * 1000),
          new Date(missionDate.getTime() + 3600 * 1000),
          new Date(missionDate.getTime() + 7200 * 1000)
        ]
      );

      // Create entries
      for (const entryData of missionData.entries) {
        const capturedAt = new Date(missionDate);
        capturedAt.setMinutes(capturedAt.getMinutes() + Math.floor(Math.random() * 30) + 10);
        const entryId = randomUUID();
        
        // Get user ID by email or handle
        let entryUserId = userId; // Default to your user
        if (entryData.user && entryData.user !== "mo") {
          const userLookup = await client.query(
            "SELECT id FROM users WHERE email LIKE $1 OR handle = $2 LIMIT 1",
            [`%${entryData.user}%`, entryData.user]
          );
          entryUserId = userLookup.rows[0]?.id || userId;
        }

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
      }

      // Create chapter if entries exist
      if (missionData.entries.length > 0 && missionData.chapter) {
        const chapterId = randomUUID();
        const generatedAt = new Date(missionDate.getTime() + 3600 * 1000);

        await client.query(
          `INSERT INTO chapters (id, mission_id, title, poem, collage_url, video_url, duration_seconds, final_palette, generated_at, is_shareable)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT DO NOTHING`,
          [
            chapterId,
            missionId,
            missionData.chapter.title,
            missionData.chapter.poem,
            missionData.chapter.collageUrl,
            missionData.chapter.collageUrl, // Use collage as video fallback
            8,
            JSON.stringify(missionData.chapter.palette),
            generatedAt,
            false
          ]
        );
      }
    }

    // Create active mission
    if (constellation.activeMission) {
      const activeMissionId = randomUUID();
      const activeStartsAt = new Date();
      const activeEndsAt = new Date(activeStartsAt.getTime() + 3600 * 1000);

      await client.query(
        `INSERT INTO missions (id, chain_id, prompt, window_seconds, state, submissions_required, submissions_received, created_by, starts_at, ends_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT DO NOTHING`,
        [
          activeMissionId,
          chainId,
          constellation.activeMission.prompt,
          3600,
          constellation.activeMission.state,
          3,
          0,
          userId,
          activeStartsAt,
          activeEndsAt
        ]
      );

      // Set as active mission
      await client.query(
        `UPDATE chains SET active_mission_id = $1 WHERE id = $2`,
        [activeMissionId, chainId]
      );
      
      console.log(`   🚀 Active mission: "${constellation.activeMission.prompt}"`);
    }

    console.log(`   ✅ Created ${constellation.missions.length} missions\n`);
  }

  await client.end();

  console.log("✅ Constellation seed complete!\n");
  console.log("Created constellations:");
  constellations.forEach((c) => {
    console.log(`  - ${c.name}: ${c.missions.length} missions + 1 active`);
  });
  console.log(`\nVisit /missions to browse all missions`);
}

seedConstellations().catch(console.error);

