#!/usr/bin/env node
/**
 * Production Environment Validation Script
 * 
 * Validates that all required environment variables are set correctly
 * Run this before deploying to production
 */

import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const envPaths = [
  path.resolve(__dirname, "../.env.local"),
  path.resolve(__dirname, "../.env"),
];

// Load environment variables
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

interface EnvCheck {
  key: string;
  required: boolean;
  description: string;
  validate?: (value: string) => boolean | string;
}

const checks: EnvCheck[] = [
  {
    key: "POSTGRES_URL",
    required: true,
    description: "PostgreSQL connection string",
    validate: (value) => {
      if (!value.startsWith("postgresql://") && !value.startsWith("postgres://")) {
        return "Must start with postgresql:// or postgres://";
      }
      if (value.includes("your_") || value.includes("placeholder")) {
        return "Contains placeholder text";
      }
      return true;
    },
  },
  {
    key: "ADMIN_EMAIL",
    required: true,
    description: "Admin user email",
    validate: (value) => {
      if (!value.includes("@")) {
        return "Must be a valid email address";
      }
      return true;
    },
  },
  {
    key: "CLOUDINARY_CLOUD_NAME",
    required: true,
    description: "Cloudinary cloud name",
  },
  {
    key: "CLOUDINARY_API_KEY",
    required: true,
    description: "Cloudinary API key",
  },
  {
    key: "CLOUDINARY_API_SECRET",
    required: true,
    description: "Cloudinary API secret",
  },
  {
    key: "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
    required: true,
    description: "Public Cloudinary cloud name",
  },
  {
    key: "GOOGLE_VISION_API_KEY",
    required: true,
    description: "Google Vision API key",
  },
  {
    key: "GOOGLE_CLOUD_PROJECT",
    required: false,
    description: "Google Cloud project ID (for Veo)",
  },
  {
    key: "GOOGLE_APPLICATION_CREDENTIALS_JSON",
    required: false,
    description: "Base64-encoded service account JSON (for Veo)",
  },
  {
    key: "ABLY_API_KEY",
    required: false,
    description: "Ably API key (for realtime)",
  },
  {
    key: "ONESIGNAL_APP_ID",
    required: false,
    description: "OneSignal app ID (for notifications)",
  },
  {
    key: "ONESIGNAL_API_KEY",
    required: false,
    description: "OneSignal API key",
  },
  {
    key: "NEXT_PUBLIC_MAPBOX_TOKEN",
    required: false,
    description: "Mapbox token (for map view)",
  },
  {
    key: "NEXT_PUBLIC_APP_URL",
    required: true,
    description: "Public app URL",
    validate: (value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return "Must be a valid URL";
      }
    },
  },
  {
    key: "CRON_SECRET",
    required: false,
    description: "Secret for cron job authentication",
  },
];

function main() {
  console.log("🔍 Validating production environment...\n");

  let hasErrors = false;
  let hasWarnings = false;

  for (const check of checks) {
    const value = process.env[check.key];
    const isSet = !!value;

    if (!isSet) {
      if (check.required) {
        console.error(`❌ ${check.key} - REQUIRED but not set`);
        console.error(`   ${check.description}\n`);
        hasErrors = true;
      } else {
        console.warn(`⚠️  ${check.key} - Optional, not set`);
        console.warn(`   ${check.description}\n`);
        hasWarnings = true;
      }
      continue;
    }

    if (check.validate) {
      const validation = check.validate(value);
      if (validation !== true) {
        console.error(`❌ ${check.key} - Invalid value`);
        console.error(`   ${check.description}`);
        console.error(`   Error: ${validation}\n`);
        hasErrors = true;
        continue;
      }
    }

    // Mask sensitive values
    const displayValue =
      check.key.includes("SECRET") ||
      check.key.includes("KEY") ||
      check.key.includes("PASSWORD") ||
      check.key.includes("CREDENTIALS")
        ? `${value.substring(0, 8)}...`
        : value;

    console.log(`✅ ${check.key} - ${displayValue}`);
  }

  console.log("\n" + "=".repeat(50));

  if (hasErrors) {
    console.error("\n❌ Validation failed! Please fix the errors above.");
    process.exit(1);
  }

  if (hasWarnings) {
    console.warn("\n⚠️  Validation passed with warnings.");
    console.warn("   Some optional services are not configured.");
    console.warn("   The app will work but some features may be disabled.\n");
  } else {
    console.log("\n✅ All checks passed! Ready for production.\n");
  }

  // Additional checks
  console.log("📋 Additional checks:");
  
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv !== "production") {
    console.warn(`⚠️  NODE_ENV is set to "${nodeEnv}", should be "production"`);
  } else {
    console.log("✅ NODE_ENV is set to production");
  }

  const postgresUrl = process.env.POSTGRES_URL || "";
  if (postgresUrl.includes("pooler") || postgresUrl.includes("pooled")) {
    console.log("✅ Using pooled PostgreSQL connection");
  } else {
    console.warn("⚠️  Using direct PostgreSQL connection (may need pooling for production)");
  }
}

main();

