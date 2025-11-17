import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { PaletteChip } from "@cali/ui/PaletteChip";
import { MissionJoinButton } from "@/components/missions/MissionJoinButton";
import { motion } from "framer-motion";

type ChainDetailResponse = {
  chain: {
    id: string;
    name: string;
    description: string | null;
    dominant_hue: number | null;
    palette: any;
  };
  members: Array<{
    id: string;
    name: string | null;
    avatar_url: string | null;
    role: string;
  }>;
  mission: {
    id: string;
    prompt: string;
    state: string;
    submissions_required: number;
    submissions_received: number;
    window_seconds: number;
    starts_at: string;
    ends_at: string | null;
  } | null;
  entries: Array<{
    id: string;
    media_url: string;
    user_id: string;
    name: string | null;
  }>;
  chapter: {
    id: string;
    video_url: string | null;
    final_palette: string[] | null;
    poem: string | null;
    title: string | null;
  } | null;
};

export default async function ChainPage({
  params,
}: {
  params: { chainId: string };
}) {
  const data = await apiFetch<ChainDetailResponse>(`/api/chain/${params.chainId}`);
  const { chain, members, mission, entries, chapter } = data;
  
  const palette = Array.isArray(chain.palette) 
    ? chain.palette 
    : typeof chain.palette === 'string' 
      ? JSON.parse(chain.palette) 
      : [];
  const primaryColor = palette[0] || "#666";

  return (
    <div className="space-y-8 sm:space-y-12">
      {/* Header */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-white/50">
          <Link href="/missions" className="hover:text-white transition touch-manipulation">
            Missions
          </Link>
          <span>/</span>
          <span className="text-white/70 truncate">{chain.name}</span>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight">{chain.name}</h1>
          {chain.description && (
            <p className="text-base sm:text-lg text-white/70 leading-relaxed">{chain.description}</p>
          )}
        </div>
        {palette.length > 0 && (
          <div className="flex items-center gap-2">
            {palette.slice(0, 5).map((color: string, i: number) => (
              <div
                key={i}
                className="h-6 w-6 rounded-full border border-white/20"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Current Mission Card */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-gradient-to-br from-black/80 via-white/5 to-black/80 p-4 sm:p-6 md:p-8">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}22, ${primaryColor}44)`,
          }}
        />
        <div className="relative z-10">
          <div className="mb-4 sm:mb-6 flex items-center justify-between gap-3">
            <h2 className="text-xl sm:text-2xl font-semibold">Current Mission</h2>
            {mission && (
              <Link
                className="text-xs sm:text-sm text-white/70 underline active:text-white transition touch-manipulation whitespace-nowrap"
                href={`/mission/${mission.id}`}
              >
                Open flow →
              </Link>
            )}
          </div>
          {mission ? (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <p className="mb-2 text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white/40">
                  Prompt
                </p>
                <p className="text-xl sm:text-2xl font-medium leading-tight">{mission.prompt}</p>
              </div>
              
              <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60">State</span>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                      mission.state === "LOBBY" ? "bg-blue-500/20 text-blue-300" :
                      mission.state === "CAPTURE" ? "bg-yellow-500/20 text-yellow-300" :
                      mission.state === "FUSING" ? "bg-purple-500/20 text-purple-300" :
                      mission.state === "RECAP" ? "bg-green-500/20 text-green-300" :
                      "bg-white/10 text-white/60"
                    }`}>
                      {mission.state}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">Progress</span>
                      <span className="font-medium text-white">
                        {mission.submissions_received}/{mission.submissions_required}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 transition-all"
                        style={{
                          width: `${(mission.submissions_received / mission.submissions_required) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-white/60">
                  <p>Window: {Math.round(mission.window_seconds / 60)} minutes</p>
                  {mission.ends_at && (
                    <p>
                      Ends: {new Date(mission.ends_at).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>
              
              <MissionJoinButton missionId={mission.id} />
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/20 p-8 text-center">
              <p className="text-white/60">No active mission.</p>
              <Link
                href="/admin"
                className="mt-4 inline-block text-sm text-white/70 underline hover:text-white"
              >
                Start one from Admin →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Members */}
      <section className="rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-6 md:p-8">
        <div className="mb-4 sm:mb-6 flex items-center justify-between gap-3">
          <h2 className="text-xl sm:text-2xl font-semibold">Members</h2>
          <Link
            className="text-xs sm:text-sm text-white/70 underline active:text-white transition touch-manipulation whitespace-nowrap"
            href={`/admin?chain=${chain.id}#invites`}
          >
            Invite →
          </Link>
        </div>
        <div className="flex flex-wrap gap-3 sm:gap-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-2 sm:gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-2 sm:px-4 sm:py-3 transition-all active:border-white/20 active:bg-white/10 touch-manipulation"
            >
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-blue-400/30 to-purple-400/30 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium truncate">
                  {member.name ?? member.id.slice(0, 8)}
                </p>
                <p className="text-[10px] sm:text-xs uppercase tracking-wide text-white/40">
                  {member.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Latest Chapter */}
      {chapter && (
        <section className="rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-6 md:p-8">
          <div className="mb-4 sm:mb-6 flex items-center justify-between gap-3">
            <h2 className="text-xl sm:text-2xl font-semibold">Latest Chapter</h2>
            <Link
              className="text-xs sm:text-sm text-white/70 underline active:text-white transition touch-manipulation whitespace-nowrap"
              href="/gallery"
            >
              View gallery →
            </Link>
          </div>
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
              {chapter.video_url ? (
                <video
                  src={chapter.video_url}
                  className="w-full"
                  muted
                  playsInline
                  controls
                />
              ) : (
                <div className="aspect-video flex items-center justify-center border border-dashed border-white/20">
                  <p className="text-white/60">Video rendering...</p>
                </div>
              )}
            </div>
            <div className="space-y-4 sm:space-y-6">
              {chapter.title && (
                <div>
                  <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white/40 mb-2">
                    Title
                  </p>
                  <p className="text-xl sm:text-2xl font-semibold">{chapter.title}</p>
                </div>
              )}
              {chapter.poem && (
                <div>
                  <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white/40 mb-2">
                    Poem
                  </p>
                  <p className="text-base sm:text-lg leading-relaxed text-white/80 italic">
                    {chapter.poem}
                  </p>
                </div>
              )}
              {(chapter.final_palette ?? []).length > 0 && (
                <div>
                  <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white/40 mb-3">
                    Palette
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(chapter.final_palette ?? []).map((hex) => (
                      <PaletteChip key={hex} hex={hex} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Recent Entries */}
      {entries.length > 0 && (
        <section className="rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-6 md:p-8">
          <h2 className="mb-4 sm:mb-6 text-xl sm:text-2xl font-semibold">Recent Entries</h2>
          <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3">
            {entries.slice(0, 6).map((entry) => (
              <div
                key={entry.id}
                className="group overflow-hidden rounded-xl sm:rounded-2xl border border-white/10 bg-black/40 transition-all active:border-white/20 active:scale-95 touch-manipulation"
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={entry.media_url}
                    alt="Mission entry"
                    className="h-full w-full object-cover transition-transform group-active:scale-110"
                  />
                </div>
                <div className="p-2 sm:p-3">
                  <p className="text-[10px] sm:text-xs text-white/60 truncate">
                    {entry.name ?? "An orbit"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
