// Database initialization script
// Run with: npx tsx scripts/init-db.ts

import { initDB } from "../lib/db";

async function main() {
  console.log("Initializing database tables...");

  try {
    await initDB();
    console.log("✅ Database tables created successfully!");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    process.exit(1);
  }
}

main();
