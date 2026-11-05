import { useEffect, useRef } from 'react';
import type { LoopAsset } from '../../../application/domain/MediaAsset';
import { pickSource } from './imageSources';

const POSTER_MIN_WIDTH = 1024;

interface LoopVideoProps {
  loop: LoopAsset;
  isPlaying: boolean;
  className?: string;
  /** Off where a still is already painted underneath, to avoid downloading it twice. */
  showPoster?: boolean;
}

/** Downloads nothing until first played; keeps the poster under reduced motion. */
export function LoopVideo({ loop, isPlaying, className, showPoster = true }: LoopVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isPlaying && !prefersReducedMotion) {
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
