"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Play } from "lucide-react";
import { youTubeEmbedUrl, youTubeThumbnail } from "@/lib/youtube";

/**
 * Shows a thumbnail first and loads the YouTube player only on tap,
 * so a lesson page stays light on slow mobile connections.
 */
export function YouTubePlayer({ videoId, title }: { videoId: string; title: string }) {
  const t = useTranslations("courses");
  const [playing, setPlaying] = useState(false);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-card border border-border bg-black">
      {playing ? (
        <iframe
          src={`${youTubeEmbedUrl(videoId)}&autoplay=1`}
          title={title}
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 size-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={t("playVideo", { title })}
          className="group absolute inset-0 size-full"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={youTubeThumbnail(videoId)}
            alt=""
            loading="lazy"
            className="size-full object-cover opacity-90"
          />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Play className="size-7 translate-x-0.5" aria-hidden fill="currentColor" />
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
