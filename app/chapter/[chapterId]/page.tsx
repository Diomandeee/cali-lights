import { notFound } from "next/navigation";
import { sql } from "@/lib/db/client";
import { getChapterById } from "@/lib/data/chapters";
import { getMissionById } from "@/lib/data/missions";
import { PaletteChip } from "@cali/ui/PaletteChip";
import { logger } from "@/lib/utils/logger";

type PublicChapterPageProps = {
  params: { chapterId: string };
  searchParams: { share?: string };
};

export default async function PublicChapterPage({
  params,
  searchParams,
}: PublicChapterPageProps) {
  try {
    const chapter = await getChapterById(params.chapterId);
    
    if (!chapter) {
      logger.warn("Chapter not found", { chapterId: params.chapterId });
      notFound();
    }

    // Check if chapter is shareable and share URL is valid
    if (!chapter.is_shareable || !chapter.share_url) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-semibold text-white">Chapter Not Available</h1>
            <p className="text-white/60">
              This chapter is not publicly shared or the share link has expired.
            </p>
          </div>
        </div>
      );
    }

    // Check expiration
    if (chapter.share_expires_at && new Date(chapter.share_expires_at) < new Date()) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-semibold text-white">Link Expired</h1>
            <p className="text-white/60">
              This share link has expired.
            </p>
          </div>
        </div>
      );
    }

    // Verify share token if provided
    if (searchParams.share) {
      const shareToken = chapter.share_url.split("share=")[1];
      if (shareToken !== searchParams.share) {
        return (
          <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="text-center space-y-4">
              <h1 className="text-2xl font-semibold text-white">Invalid Share Link</h1>
              <p className="text-white/60">
                This share link is not valid.
              </p>
            </div>
          </div>
        );
      }
    }

    const mission = await getMissionById(chapter.mission_id);
    const chainName = mission
      ? (
          await sql<{ name: string }>`
            SELECT name FROM chains WHERE id = ${mission.chain_id} LIMIT 1
          `
        ).rows[0]?.name
      : null;

    const palette = Array.isArray(chapter.final_palette)
      ? chapter.final_palette
      : typeof chapter.final_palette === "string"
      ? JSON.parse(chapter.final_palette)
      : [];

    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-[#050113] to-black text-white">
        <main className="mx-auto max-w-4xl px-4 py-12 space-y-8">
          {/* Header */}
          <div className="space-y-3 text-center">
            {chainName && (
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                {chainName}
              </p>
            )}
            {chapter.title && (
              <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
                {chapter.title}
              </h1>
            )}
          </div>

          {/* Media */}
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-2xl">
            {chapter.video_url ? (
              <video
                src={chapter.video_url}
                className="w-full"
                controls
                playsInline
                muted
                autoPlay
                loop
                onError={(e) => {
                  logger.error("Video playback failed", new Error("Video playback error"), {
                    chapterId: chapter.id,
                    videoUrl: chapter.video_url,
                  });
                }}
              />
            ) : chapter.collage_url ? (
              <img
                src={chapter.collage_url}
                alt={chapter.title || "Chapter collage"}
                className="w-full object-cover"
                loading="lazy"
                onError={(e) => {
                  logger.error("Image load failed", new Error("Image load error"), {
                    chapterId: chapter.id,
                    collageUrl: chapter.collage_url,
                  });
                }}
              />
            ) : (
              <div className="aspect-video flex items-center justify-center border border-dashed border-white/20">
                <p className="text-white/60">Media not available</p>
              </div>
            )}
          </div>

          {/* Poem */}
          {chapter.poem && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8 text-center">
              <p className="text-xl sm:text-2xl leading-relaxed text-white/90 italic">
                {chapter.poem}
              </p>
            </div>
          )}

          {/* Palette */}
          {palette.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.3em] text-white/40 text-center">
                Palette
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {palette.map((hex: string) => (
                  <PaletteChip key={hex} hex={hex} />
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-xs text-white/40 pt-8">
            <p>Shared from Cali Lights</p>
          </div>
        </main>
      </div>
    );
  } catch (error) {
    logger.error("Public chapter page error", error, {
      chapterId: params.chapterId,
    });
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold text-white">Error Loading Chapter</h1>
          <p className="text-white/60">
            We encountered an error loading this chapter. Please try again later.
          </p>
        </div>
      </div>
    );
  }
}
