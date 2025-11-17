import { notFound } from "next/navigation";
import { requireCurrentUser } from "@/lib/session";
import { AdminMissionView } from "@/components/admin/AdminMissionView";

export default async function AdminModePage() {
  const user = await requireCurrentUser();
  const allowedEmail = process.env.ADMIN_EMAIL;
  if (!allowedEmail || user.email !== allowedEmail) {
    notFound();
  }

  return (
    <div className="space-y-8 pb-24">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-white/40">
          Admin Mode
        </p>
        <h1 className="text-4xl font-semibold">Mission Lifecycle View</h1>
        <p className="text-white/60">
          Full transparency of all missions, their states, participants, and entries.
        </p>
      </div>
      <AdminMissionView />
    </div>
  );
}

