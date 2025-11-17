import { notFound } from "next/navigation";
import Link from "next/link";
import { sql } from "@/lib/db/client";
import { requireCurrentUser } from "@/lib/session";
import { AdminPanel } from "@/components/admin/AdminPanel";

export default async function AdminPage() {
  const user = await requireCurrentUser();
  const allowedEmail = process.env.ADMIN_EMAIL;
  if (!allowedEmail || user.email !== allowedEmail) {
    notFound();
  }
  const chains = (
    await sql<{ id: string; name: string }>`
      SELECT c.id, c.name
      FROM chains c
      JOIN memberships m ON m.chain_id = c.id
      WHERE m.user_id = ${user.id} AND m.role = 'admin'
    `
  ).rows;

  const chainIds = chains.map((chain) => chain.id);
  const metrics =
    chainIds.length > 0
      ? (
          await sql<{ total_missions: number; archived: number; avg_duration: number | null }>`
            SELECT
              COUNT(*) AS total_missions,
              COUNT(*) FILTER (WHERE state = 'ARCHIVED') AS archived,
              AVG(EXTRACT(EPOCH FROM (archived_at - starts_at))) AS avg_duration
            FROM missions
            WHERE chain_id IN (${sql.join(chainIds.map(id => sql`${id}`), sql`, `)})
          `
        ).rows[0]
      : { total_missions: 0, archived: 0, avg_duration: null };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-white/40">
          Admin
        </p>
        <h1 className="text-4xl font-semibold">Mission control</h1>
        <p className="text-white/60">
          Launch missions, mint invites, configure schedules.
        </p>
      </div>
      
      {/* Admin Mode Link */}
      <Link
        href="/admin/mode"
        className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 hover:border-blue-500/50 transition text-white font-medium"
      >
        Enter Admin Mode →
      </Link>
      
      <AdminPanel chains={chains} metrics={metrics} />
    </div>
  );
}
