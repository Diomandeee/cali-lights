"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

type RecommendedMission = {
  id: string;
  prompt: string;
  chain_name: string;
  state: string;
  starts_at: string;
  ends_at: string | null;
  city: string | null;
  lat: number | null;
  lon: number | null;
  distance_km: number | null;
  submissions_received: number;
  submissions_required: number;
};

type LocationRecommendationsProps = {
  city?: string;
  lat?: number;
  lon?: number;
};

export function LocationRecommendations({
  city,
  lat,
  lon,
}: LocationRecommendationsProps) {
  const [missions, setMissions] = useState<RecommendedMission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecommendations() {
      setLoading(true);
      const params = new URLSearchParams();
      if (city) params.set("city", city);
      if (lat !== undefined) params.set("lat", String(lat));
      if (lon !== undefined) params.set("lon", String(lon));

      try {
        const response = await fetch(`/api/missions/recommendations?${params}`);
        if (response.ok) {
          const data = await response.json();
          setMissions(data.missions || []);
        }
      } catch (error) {
        console.error("Failed to fetch recommendations:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchRecommendations();
  }, [city, lat, lon]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          <p className="text-sm text-white/60">Loading recommendations...</p>
        </div>
      </div>
    );
  }

  if (missions.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
        <p className="text-sm text-white/60">
          No missions found {city ? `in ${city}` : "nearby"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Recommended Missions {city && `in ${city}`}
        </h3>
        {missions.length > 0 && (
          <span className="text-xs text-white/60">
            {missions.length} available
          </span>
        )}
      </div>

      <div className="space-y-3">
        {missions.map((mission) => (
          <motion.div
            key={mission.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:border-white/30 hover:bg-white/10"
          >
            <Link href={`/mission/${mission.id}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs text-white/60">{mission.chain_name}</p>
                  <p className="mt-1 font-medium">{mission.prompt}</p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-white/60">
                    {mission.city && <span>📍 {mission.city}</span>}
                    {mission.distance_km !== null && (
                      <span>
                        {mission.distance_km < 1
                          ? `${Math.round(mission.distance_km * 1000)}m away`
                          : `${mission.distance_km.toFixed(1)}km away`}
                      </span>
                    )}
                    <span>
                      {new Date(mission.starts_at).toLocaleDateString()}
                    </span>
                    <span>
                      {mission.submissions_received}/{mission.submissions_required}
                    </span>
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    mission.state === "LOBBY"
                      ? "bg-blue-500/20 text-blue-300"
                      : mission.state === "CAPTURE"
                      ? "bg-yellow-500/20 text-yellow-300"
                      : mission.state === "FUSING"
                      ? "bg-purple-500/20 text-purple-300"
                      : "bg-white/10 text-white/60"
                  }`}
                >
                  {mission.state}
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

