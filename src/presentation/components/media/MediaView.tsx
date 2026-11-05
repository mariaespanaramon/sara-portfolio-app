import type { MediaAsset } from '../../../application/domain/MediaAsset';
import { ResponsiveImage } from './ResponsiveImage';
import { VideoPlayer } from './VideoPlayer';
import { LoopVideo } from './LoopVideo';

interface MediaViewProps {
  asset: MediaAsset;
  sizes: string;
  className?: string;
  alt?: string;
  loading?: 'lazy' | 'eager';
  isPriority?: boolean;
  isActive?: boolean;
}

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
