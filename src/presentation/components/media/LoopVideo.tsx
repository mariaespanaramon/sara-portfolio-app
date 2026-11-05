import { useEffect, useRef } from 'react';
import type { LoopAsset } from '../../../application/domain/Media';
import { pickSource } from './imageSources';

/** Posters stand in for the clip at its rendered size; this keeps them sharp on cards. */
const POSTER_MIN_WIDTH = 1024;

interface LoopVideoProps {
  loop: LoopAsset;
  /** Plays while true, pauses and rewinds when false. */
  isPlaying: boolean;
  className?: string;
  /**
   * Off where a still is already painted underneath, such as a section cover:
   * the poster would then be a second download of the same picture.
   */
  showPoster?: boolean;
}

/**
 * A short muted clip on a loop, the replacement for GIFs.
 *
 * Nothing is downloaded until it is first asked to play. Visitors who asked for
 * less motion keep the poster.
 */
export function LoopVideo({ loop, isPlaying, className, showPoster = true }: LoopVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isPlaying && !prefersReducedMotion) {
      // Rejects when the browser refuses playback; the poster stays, which is fine.
      video.play().catch(() => {});
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [isPlaying]);

  return (
    <video
      ref={videoRef}
      src={loop.url}
      poster={showPoster ? pickSource(loop.poster, POSTER_MIN_WIDTH)?.url : undefined}
      width={loop.width}
      height={loop.height}
      className={className}
      loop
      muted
      playsInline
      preload="none"
      aria-hidden="true"
    />
  );
}
