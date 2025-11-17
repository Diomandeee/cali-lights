import { randomUUID } from "node:crypto";
import QRCode from "qrcode";
import { sql } from "@/lib/db/client";
import { getBridgeEventsForChains } from "@/lib/data/bridges";

export type ChainRecord = {
  id: string;
  name: string;
  description: string | null;
  color_theme: any;
  created_by: string | null;
  dominant_hue: number | null;
  palette: any;
  streak_days: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

export type MembershipRecord = {
  id: string;
  user_id: string;
  chain_id: string;
  role: string;
  joined_at: string;
};

export type InviteRecord = {
  id: string;
  chain_id: string;
  token: string;
  invite_url: string;
  qr_svg_url: string | null;
  expires_at: string;
  accepted_at: string | null;
  created_by: string | null;
  status: string;
  created_at: string;
};

export type ConnectionRecord = {
  id: string;
  from_chain_id: string;
  to_chain_id: string;
  bridge_reason: string | null;
  shared_tags: string[] | null;
  hue_delta: number | null;
  created_at: string;
};

export async function createChainRecord(params: {
  name: string;
  description?: string;
  colorTheme?: Record<string, unknown>;
  createdBy: string;
}): Promise<ChainRecord> {
  const result = await sql<ChainRecord>`
    INSERT INTO chains (name, description, color_theme, created_by)
    VALUES (${params.name}, ${params.description || null}, ${
      params.colorTheme ? JSON.stringify(params.colorTheme) : "{}"
    }::jsonb, ${params.createdBy})
    RETURNING *
  `;
  await sql`
    INSERT INTO memberships (user_id, chain_id, role)
    VALUES (${params.createdBy}, ${result.rows[0].id}, 'admin')
    ON CONFLICT (user_id, chain_id) DO NOTHING
  `;
  return result.rows[0];
}

export async function createInviteRecord(params: {
  chainId: string;
  createdBy: string;
  expiresAt: Date;
}): Promise<InviteRecord> {
  const token = randomUUID().replace(/-/g, "");
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  const inviteUrl = `${baseUrl}/invite/${token}`;
  const qrSvgUrl = await QRCode.toDataURL(inviteUrl);

  const result = await sql<InviteRecord>`
    INSERT INTO invites (chain_id, token, invite_url, qr_svg_url, expires_at, created_by)
    VALUES (${params.chainId}, ${token}, ${inviteUrl}, ${qrSvgUrl}, ${
      params.expiresAt.toISOString()
    }, ${params.createdBy})
    RETURNING *
  `;
  return result.rows[0];
}

export async function getInviteByToken(token: string): Promise<InviteRecord | null> {
  const result = await sql<InviteRecord>`
    SELECT * FROM invites WHERE token = ${token} LIMIT 1
  `;
  return result.rows[0] ?? null;
}

export async function markInviteAccepted(inviteId: string): Promise<void> {
  await sql`
    UPDATE invites
    SET status = 'redeemed', accepted_at = NOW()
    WHERE id = ${inviteId}
  `;
}

export async function addMembership(params: {
  userId: string;
  chainId: string;
  role?: string;
}): Promise<MembershipRecord> {
  const result = await sql<MembershipRecord>`
    INSERT INTO memberships (user_id, chain_id, role)
    VALUES (${params.userId}, ${params.chainId}, ${params.role || "member"})
    ON CONFLICT (user_id, chain_id)
    DO UPDATE SET role = EXCLUDED.role
    RETURNING *
  `;
  return result.rows[0];
}

export async function listUserMemberships(userId: string) {
  const result = await sql<MembershipRecord>`
    SELECT * FROM memberships WHERE user_id = ${userId}
  `;
  return result.rows;
}

export async function listChainMembers(chainId: string) {
  const result = await sql<MembershipRecord & { email: string; name: string | null }>`
    SELECT m.*, u.email, u.name
    FROM memberships m
    JOIN users u ON u.id = m.user_id
    WHERE m.chain_id = ${chainId}
  `;
  return result.rows;
}

export async function getMembership(
  userId: string,
  chainId: string
): Promise<MembershipRecord | null> {
  const result = await sql<MembershipRecord>`
    SELECT * FROM memberships
    WHERE user_id = ${userId} AND chain_id = ${chainId}
    LIMIT 1
  `;
  return result.rows[0] ?? null;
}

export async function createConnectionIfNeeded(params: {
  fromChainId: string;
  toChainId: string;
  bridgeReason?: string;
}): Promise<void> {
  if (params.fromChainId === params.toChainId) return;
  await sql`
    INSERT INTO connections (from_chain_id, to_chain_id, bridge_reason)
    VALUES (${params.fromChainId}, ${params.toChainId}, ${
      params.bridgeReason || "invite"
    })
    ON CONFLICT (from_chain_id, to_chain_id) DO NOTHING
  `;
  await sql`
    INSERT INTO connections (from_chain_id, to_chain_id, bridge_reason)
    VALUES (${params.toChainId}, ${params.fromChainId}, ${
      params.bridgeReason || "invite"
    })
    ON CONFLICT (from_chain_id, to_chain_id) DO NOTHING
  `;
}

export async function getNetworkForUser(userId: string) {
  const chains = await sql<ChainRecord>`
    SELECT c.*
    FROM chains c
    JOIN memberships m ON m.chain_id = c.id
    WHERE m.user_id = ${userId}
  `;
  const chainIds = chains.rows.map((row) => row.id);
  const connections = await sql<ConnectionRecord>`
    SELECT * FROM connections
    WHERE from_chain_id IN (
      SELECT chain_id FROM memberships WHERE user_id = ${userId}
    )
  `;
  const bridgeEvents = chainIds.length
    ? await getBridgeEventsForChains(chainIds)
    : [];
  return {
    chains: chains.rows,
    connections: connections.rows,
    bridgeEvents,
  };
}

export async function getChainById(chainId: string): Promise<ChainRecord | null> {
  const result = await sql<ChainRecord>`
    SELECT * FROM chains WHERE id = ${chainId} LIMIT 1
  `;
  return result.rows[0] ?? null;
}

export async function setActiveMission(chainId: string, missionId: string | null) {
  await sql`
    UPDATE chains
    SET active_mission_id = ${missionId}, updated_at = NOW()
    WHERE id = ${chainId}
  `;
}

export async function listConnectedChainIds(chainId: string) {
  const result = await sql<{ to_chain_id: string }>`
    SELECT to_chain_id FROM connections WHERE from_chain_id = ${chainId}
  `;
  return result.rows.map((row) => row.to_chain_id);
}
