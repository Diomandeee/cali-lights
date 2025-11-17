import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";

// Load environment variables from .env.local or .env if they exist
const envPaths = [
  path.resolve(__dirname, "../.env.local"),
  path.resolve(__dirname, "../.env"),
];

for (const envPath of envPaths) {
  if (existsSync(envPath)) {
    const envFile = readFileSync(envPath, "utf-8");
    envFile.split("\n").forEach((line) => {
      const trimmed = line.trim();
      // Skip comments and empty lines
      if (!trimmed || trimmed.startsWith("#")) return;
      const match = trimmed.match(/^([^=:#]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        // Remove surrounding quotes
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
    break; // Use first found file
  }
}

async function main() {
  const migrationPath = path.resolve(
    __dirname,
    "../apps/web/prisma/migrations/001_init.sql"
  );

  const statements = readFileSync(migrationPath, "utf-8");

  console.log("Running migration:", migrationPath);
  
  const postgresUrl = process.env.POSTGRES_URL;
  if (!postgresUrl) {
    console.error("❌ POSTGRES_URL environment variable is not set");
    process.exit(1);
  }
  
  // Validate connection string format (without exposing the full string)
  if (!postgresUrl.startsWith("postgresql://") && !postgresUrl.startsWith("postgres://")) {
    console.error("❌ POSTGRES_URL must start with 'postgresql://' or 'postgres://'");
    console.error("   Current value starts with:", postgresUrl.substring(0, 20) + "...");
    process.exit(1);
  }
  
  if (postgresUrl.includes("your_postgres") || postgresUrl.includes("placeholder")) {
    console.error("❌ POSTGRES_URL appears to be a placeholder. Please set a real connection string.");
    process.exit(1);
  }

  try {
    // Use standard pg client for direct connections
    const client = new Client({ connectionString: postgresUrl });
    await client.connect();
    await client.query(statements);
    await client.end();
    console.log("✅ Migration executed successfully");
  } catch (error) {
    console.error("❌ Migration failed", error);
    process.exit(1);
  }
}

main();
