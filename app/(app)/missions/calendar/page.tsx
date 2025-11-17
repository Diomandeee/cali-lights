import { apiFetch } from "@/lib/api-client";
import { MissionCalendar } from "@/components/missions/MissionCalendar";
import { LocationRecommendations } from "@/components/missions/LocationRecommendations";
import { NYCMapView } from "@/components/missions/NYCMapView";

type CalendarDay = {
  day: string;
  completed: number;
  total: number;
  starting: number;
  ending: number;
  scheduled: number;
  missions: Array<{
    id: string;
    prompt: string;
    chain_name: string;
    state: string;
    starts_at: string;
    ends_at: string | null;
    submissions_received: number;
    submissions_required: number;
  }>;
};

export default async function MissionsCalendarPage() {
  const now = new Date();
  const calendarData = await apiFetch<{ days: CalendarDay[] }>(
    `/api/missions/calendar?year=${now.getUTCFullYear()}&month=${
      now.getUTCMonth() + 1
    }`
  );

  // Fetch NYC missions for the map
  const nycMissions = await apiFetch<{
    missions: Array<{
      id: string;
      prompt: string;
      chain_name: string;
      state: string;
      starts_at: string;
      ends_at: string | null;
      city: string | null;
      lat: number | null;
      lon: number | null;
      submissions_received: number;
      submissions_required: number;
    }>;
  }>("/api/missions/recommendations?city=New York&limit=50");

  return (
    <div className="space-y-12">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.4em] text-white/40">
          Missions
        </p>
        <h1 className="text-5xl font-semibold tracking-tight">Calendar</h1>
        <p className="text-lg text-white/70 leading-relaxed">
          View mission schedules, start times, and end times. Tap a date to see
          missions for that day.
        </p>
      </div>

      <MissionCalendar
        days={calendarData.days}
        year={now.getUTCFullYear()}
        month={now.getUTCMonth() + 1}
      />

      <div className="space-y-6">
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold">New York City Missions</h2>
          <p className="text-white/60">
            Explore missions happening across New York City
          </p>
        </div>

        <NYCMapView
          missions={nycMissions.missions}
          token={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        />

        <LocationRecommendations city="New York" />
      </div>
    </div>
  );
}

