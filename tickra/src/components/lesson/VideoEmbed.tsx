'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';

type Props = {
  provider: 'youtube' | 'vimeo' | 'mp4';
  src: string;
  poster?: string;
  title: string;
  caption?: string;
};

/**
 * Lazy-loaded responsive video. Renders a poster + play button first; on click
 * swaps in the actual iframe/video element. Saves bandwidth + LCP on lesson
 * pages with multiple videos.
 */
export function VideoEmbed({ provider, src, poster, title, caption }: Props) {
  const [active, setActive] = useState(false);

  const inner = !active ? (
    <button
      type="button"
      onClick={() => setActive(true)}
      aria-label={`Play ${title}`}
      className="group relative block h-full w-full"
    >
      {poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poster} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <div className="h-full w-full bg-elevated" />
      )}
      <span
        aria-hidden
        className="absolute inset-0 flex items-center justify-center bg-ink/30 transition-colors group-hover:bg-ink/40"
      >
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-canvas text-ink shadow-[0_1px_0_0_rgba(10,10,12,0.6)] transition-transform group-hover:scale-105 md:h-20 md:w-20">
          <Play className="ml-1 h-7 w-7" strokeWidth={1.5} fill="currentColor" />
        </span>
      </span>
    </button>
  ) : provider === 'youtube' ? (
    <iframe
      src={`https://www.youtube-nocookie.com/embed/${src}?autoplay=1&rel=0&modestbranding=1`}
      title={title}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
      className="h-full w-full"
    />
  ) : provider === 'vimeo' ? (
    <iframe
      src={`https://player.vimeo.com/video/${src}?autoplay=1&title=0&byline=0&portrait=0`}
      title={title}
      allow="autoplay; fullscreen; picture-in-picture"
      allowFullScreen
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
      className="h-full w-full"
    />
  ) : (
    <video controls autoPlay playsInline poster={poster} className="h-full w-full bg-ink object-contain">
      <source src={src} />
      Your browser does not support video.
    </video>
  );

  return (
    <figure className="overflow-hidden rounded-sm border border-line bg-surface">
      <div className="relative aspect-video w-full bg-ink">{inner}</div>
      {caption ? (
        <figcaption className="border-t border-line px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
