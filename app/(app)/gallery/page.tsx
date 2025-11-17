import { apiFetch } from "@/lib/api-client";
import { GalleryShell } from "@/components/gallery/GalleryShell";

type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

export default async function GalleryPage() {
  const initialMedia = await apiFetch<Paginated<any>>(
    "/api/gallery/media?scope=network&page=1&pageSize=12"
  );
  const initialChapters = await apiFetch<Paginated<any>>(
    "/api/gallery/chapters?scope=network&page=1&pageSize=6"
  );
  const mapData = await apiFetch<{ points: any }>(
    "/api/gallery/map?scope=network"
  );
  const now = new Date();
  const calendarData = await apiFetch<{ days: any }>(
    `/api/gallery/calendar?scope=network&year=${now.getUTCFullYear()}&month=${
      now.getUTCMonth() + 1
    }`
  );

  return (
    <div className="space-y-12">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.4em] text-white/40">
          Gallery
        </p>
        <h1 className="text-5xl font-semibold tracking-tight">Archive</h1>
        <p className="text-lg text-white/70 leading-relaxed">
          Filter by hue, scope, favorites. Tap a tile to see the chapter behind it.
        </p>
      </div>
      <GalleryShell
        initialMedia={initialMedia}
        initialChapters={initialChapters}
        initialMap={mapData}
        initialCalendar={calendarData}
        mapToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        calendarMonth={now.getUTCMonth() + 1}
        calendarYear={now.getUTCFullYear()}
      />
    </div>
  );
}
