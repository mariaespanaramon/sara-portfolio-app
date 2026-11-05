import type { MediaAsset } from '../../../application/domain/Media';
import { ResponsiveImage } from './ResponsiveImage';
import { VideoPlayer } from './VideoPlayer';
import { LoopVideo } from './LoopVideo';

interface MediaViewProps {
  asset: MediaAsset;
  /** See ResponsiveImage. Applies to images; clips pick their poster themselves. */
  sizes: string;
  className?: string;
  alt?: string;
  loading?: 'lazy' | 'eager';
  /** See ResponsiveImage. Applies to images only. */
  isPriority?: boolean;
  /** Loops play while true. Images and videos ignore it. */
  isActive?: boolean;
}

/**
 * Renders any media piece, choosing the component by its kind.
 *
 * This is the single place that maps kinds to components: supporting a new kind
 * means adding it to MediaAsset and a case here.
 */
export function MediaView({
  asset,
  sizes,
  className,
  alt,
  loading,
  isPriority,
  isActive = true,
}: MediaViewProps) {
  switch (asset.kind) {
    case 'image':
      return (
        <ResponsiveImage
          image={asset}
          sizes={sizes}
          alt={alt}
          className={className}
          loading={loading}
          isPriority={isPriority}
        />
      );
    case 'video':
      return <VideoPlayer video={asset} className={className} />;
    case 'loop':
      return <LoopVideo loop={asset} isPlaying={isActive} className={className} />;
  }
}
