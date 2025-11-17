import { notFound } from "next/navigation";
import { sql } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/session";
import { AcceptInviteButton } from "@/components/invite/AcceptInviteButton";

export default async function InvitePage({
  params,
}: {
  params: { token: string };
}) {
  const inviteResult = await sql`
    SELECT i.*, c.name AS chain_name
    FROM invites i
    JOIN chains c ON c.id = i.chain_id
    WHERE token = ${params.token}
    LIMIT 1
  `;
  const invite = inviteResult.rows[0];
  if (!invite) {
    notFound();
  }
  if (invite.status === "redeemed") {
    notFound();
  }
  const user = await getCurrentUser();

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-black via-[#050113] to-black p-6 text-white">
      <div className="w-full max-w-lg space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-white/40">
          You are invited
        </p>
        <h1 className="text-3xl font-semibold">{invite.chain_name}</h1>
        <p className="text-white/70">
          Step into the orbit. Capture daily light with the trio.
        </p>
        {user ? (
          <AcceptInviteButton token={params.token} />
        ) : (
          <p className="text-sm text-white/60">
            Login first, then refresh this page to accept.
          </p>
        )}
      </div>
    </main>
  );
}
