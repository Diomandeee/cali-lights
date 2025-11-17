"use client";

import { useEffect, useRef } from "react";
import type mapboxgl from "mapbox-gl";

type MapPoint = {
  label: string;
  lat: number;
  lon: number;
  count: number;
};

type GalleryMapViewProps = {
  points: MapPoint[];
  token?: string;
};

export function GalleryMapView({ points, token }: GalleryMapViewProps) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

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
        center: [-118.2437, 34.0522],
        zoom: 2.4,
      });
      mapRef.current = map;

      points.forEach((point) => {
        const el = document.createElement("div");
        el.className =
          "rounded-full border border-white/60 bg-white/20 px-2 py-1 text-[10px] text-white";
        el.innerText = `${point.count}`;
        new mapboxInstance.Marker(el)
          .setLngLat([point.lon, point.lat])
          .setPopup(
            new mapboxInstance.Popup({
              closeButton: false,
            }).setText(`${point.label} · ${point.count}`)
          )
          .addTo(map!);
      });
    })();
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
      if (map) {
        map.remove();
      }
    };
  }, [points, token]);

  if (!token) {
    return (
      <div className="rounded-3xl border border-white/10 p-6 text-sm text-white/60">
        Mapbox token missing. Set `NEXT_PUBLIC_MAPBOX_TOKEN`.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-[420px] w-full overflow-hidden rounded-3xl border border-white/10"
    />
  );
}
