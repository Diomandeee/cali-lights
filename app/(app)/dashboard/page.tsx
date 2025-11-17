import { CreativeDashboard } from "@/components/dashboard/CreativeDashboard";
import { apiFetch } from "@/lib/api-client";
import { requireCurrentUser } from "@/lib/session";

type DashboardData = {
  totalMissions: number;
  completedMissions: number;
  activeMissions: number;
  totalChapters: number;
  totalEntries: number;
  streakDays: number;
  palette: Array<{ color: string; count: number }>;
  recentActivity: Array<{
    type: string;
    message: string;
    timestamp: string;
    chain_name: string | null;
  }>;
  chains: Array<{
    id: string;
    name: string;
    streak_days: number;
    mission_count: number;
    chapter_count: number;
  }>;
};

export default async function DashboardPage() {
  await requireCurrentUser();
  const data = await apiFetch<DashboardData>("/api/dashboard");

  return <CreativeDashboard data={data} />;
}
