-- Cali Lights core schema migration (Phase A2)
-- Run via npm run db:migrate (see scripts/init-db.ts hook-up)

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  handle TEXT UNIQUE,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'member',
  notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  password_hash TEXT,
  api_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  color_theme JSONB DEFAULT '{}'::JSONB,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  dominant_hue SMALLINT,
  palette JSONB,
  streak_days INTEGER NOT NULL DEFAULT 0,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chain_id UUID NOT NULL REFERENCES chains(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, chain_id)
);

CREATE TABLE IF NOT EXISTS invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id UUID NOT NULL REFERENCES chains(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  invite_url TEXT NOT NULL,
  qr_svg_url TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_chain_id UUID NOT NULL REFERENCES chains(id) ON DELETE CASCADE,
  to_chain_id UUID NOT NULL REFERENCES chains(id) ON DELETE CASCADE,
  bridge_reason TEXT,
  shared_tags TEXT[] DEFAULT '{}',
  hue_delta SMALLINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (from_chain_id, to_chain_id)
);

CREATE TABLE IF NOT EXISTS missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id UUID NOT NULL REFERENCES chains(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'LOBBY',
  window_seconds INTEGER NOT NULL,
  submissions_required INTEGER NOT NULL DEFAULT 3,
  submissions_received INTEGER NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  locked_at TIMESTAMPTZ,
  recap_ready_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE chains
  ADD COLUMN IF NOT EXISTS active_mission_id UUID REFERENCES missions(id);

CREATE TABLE IF NOT EXISTS entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('photo', 'video')),
  gps_city TEXT,
  gps_lat DOUBLE PRECISION,
  gps_lon DOUBLE PRECISION,
  exif_taken_at TIMESTAMPTZ,
  captured_at TIMESTAMPTZ DEFAULT NOW(),
  dominant_hue SMALLINT,
  palette JSONB,
  scene_tags TEXT[],
  object_tags TEXT[],
  motion_score REAL,
  alt_text TEXT,
  favorite BOOLEAN NOT NULL DEFAULT FALSE,
  metadata_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, mission_id)
);

CREATE TABLE IF NOT EXISTS chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  title TEXT,
  poem TEXT,
  collage_url TEXT,
  video_url TEXT,
  soundtrack_url TEXT,
  duration_seconds SMALLINT,
  final_palette JSONB,
  is_shareable BOOLEAN NOT NULL DEFAULT FALSE,
  share_url TEXT,
  share_expires_at TIMESTAMPTZ,
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS video_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id TEXT NOT NULL UNIQUE,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  prompt TEXT NOT NULL,
  input_media_urls TEXT[] NOT NULL,
  aspect_ratio TEXT NOT NULL,
  length_seconds SMALLINT NOT NULL,
  model TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  cost_usd NUMERIC(10,2),
  watermark TEXT,
  video_url TEXT,
  duration_seconds SMALLINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes for fast querying / filtering
CREATE INDEX IF NOT EXISTS idx_entries_mission_id ON entries (mission_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_entries_user_mission ON entries (user_id, mission_id);
CREATE INDEX IF NOT EXISTS idx_entries_dominant_hue ON entries (dominant_hue);
CREATE INDEX IF NOT EXISTS idx_entries_exif_taken_at ON entries (exif_taken_at);
CREATE INDEX IF NOT EXISTS idx_entries_gps_city ON entries (gps_city);
CREATE INDEX IF NOT EXISTS idx_entries_gps_coords ON entries (gps_lat, gps_lon);

CREATE INDEX IF NOT EXISTS idx_chapters_mission_id ON chapters (mission_id);
CREATE INDEX IF NOT EXISTS idx_missions_chain_id ON missions (chain_id);
CREATE INDEX IF NOT EXISTS idx_invites_token ON invites (token);
CREATE INDEX IF NOT EXISTS idx_connections_pair ON connections (from_chain_id, to_chain_id);
CREATE INDEX IF NOT EXISTS idx_video_operations_target ON video_operations (target_id);

CREATE TABLE IF NOT EXISTS bridge_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_a_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  mission_b_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  chain_a_id UUID NOT NULL REFERENCES chains(id) ON DELETE CASCADE,
  chain_b_id UUID NOT NULL REFERENCES chains(id) ON DELETE CASCADE,
  shared_tags TEXT[],
  hue_delta SMALLINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (mission_a_id, mission_b_id)
);

CREATE INDEX IF NOT EXISTS idx_bridge_events_chains ON bridge_events (chain_a_id, chain_b_id);

COMMIT;
