"use client";

import { useEffect, useRef, useState } from "react";
import type mapboxgl from "mapbox-gl";
import { motion } from "framer-motion";
import Link from "next/link";

type NYCMission = {
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
};

type NYCMapViewProps = {
  missions: NYCMission[];
  token?: string;
};

export function NYCMapView({ missions, token }: NYCMapViewProps) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [selectedMission, setSelectedMission] = useState<NYCMission | null>(null);

  // NYC center coordinates
  const nycCenter: [number, number] = [-73.9712, 40.7831];

  useEffect(() => {
    if (!token) return;
    if (typeof window === "undefined") return;
    
    let mapboxInstance: typeof mapboxgl;
    let map: mapboxgl.Map | null = null;

    (async () => {
      const module = await import("mapbox-gl");
      mapboxInstance = module.default;
      mapboxInstance.accessToken = token;
      
      if (!containerRef.current) return;
      
      map = new mapboxInstance.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: nycCenter,
        zoom: 12,
      });

      mapRef.current = map;

      // Add markers for each mission
      missions.forEach((mission) => {
        if (!mission.lat || !mission.lon) return;

        const el = document.createElement("div");
        el.className = "mission-marker";
        el.innerHTML = `
          <div class="relative">
            <div class="h-4 w-4 rounded-full border-2 border-white bg-blue-500 shadow-lg"></div>
            <div class="absolute -top-1 -right-1 h-2 w-2 animate-pulse rounded-full bg-yellow-400"></div>
          </div>
        `;
        el.style.cursor = "pointer";

        const marker = new mapboxInstance.Marker(el)
          .setLngLat([mission.lon, mission.lat])
          .setPopup(
            new mapboxInstance.Popup({ offset: 25, closeButton: false })
              .setHTML(`
                <div class="text-sm text-black">
                  <p class="font-semibold">${mission.prompt}</p>
                  <p class="text-xs text-gray-600 mt-1">${mission.chain_name}</p>
                  <p class="text-xs text-gray-500 mt-1">${mission.submissions_received}/${mission.submissions_required} submissions</p>
                </div>
              `)
          )
          .addTo(map!);

        el.addEventListener("click", () => {
          setSelectedMission(mission);
        });

        markersRef.current.push(marker);
      });
    })();

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      if (mapRef.current) {
        mapRef.current.remove();
      }
      if (map) {
        map.remove();
      }
    };
  }, [missions, token]);

  if (!token) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
        Mapbox token missing. Set `NEXT_PUBLIC_MAPBOX_TOKEN` to view the map.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        ref={containerRef}
        className="h-[500px] w-full overflow-hidden rounded-3xl border border-white/10"
      />
      
      {selectedMission && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-4"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs text-white/60">{selectedMission.chain_name}</p>
              <p className="mt-1 font-semibold">{selectedMission.prompt}</p>
              <div className="mt-2 flex items-center gap-4 text-xs text-white/60">
                <span>
                  {new Date(selectedMission.starts_at).toLocaleString()}
                </span>
                <span>
                  {selectedMission.submissions_received}/{selectedMission.submissions_required}
                </span>
              </div>
            </div>
            <Link
              href={`/mission/${selectedMission.id}`}
              className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/20"
            >
              View →
            </Link>
          </div>
        </motion.div>
      )}

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm font-medium text-white">
          {missions.length} mission{missions.length !== 1 ? "s" : ""} in New York
        </p>
        <p className="mt-1 text-xs text-white/60">
          Click markers to see mission details
        </p>
      </div>
    </div>
  );
}

