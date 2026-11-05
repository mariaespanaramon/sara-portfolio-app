import type { VideoAsset } from '../../../application/domain/Media';
import { pickSource } from './imageSources';

/** Players usually fill most of the screen, so the poster is taken large. */
const POSTER_MIN_WIDTH = 1600;

interface VideoPlayerProps {
  video: VideoAsset;
  className?: string;
}

/**
 * A video with native controls. Only the poster loads until the visitor presses
 * play.
 */
export function VideoPlayer({ video, className }: VideoPlayerProps) {
  return (
    <video
      src={video.url}
      poster={pickSource(video.poster, POSTER_MIN_WIDTH)?.url}
      width={video.width}
      height={video.height}
      className={className}
      controls
      controlsList="nodownload"
      playsInline
      preload="none"
    />
  );
}
