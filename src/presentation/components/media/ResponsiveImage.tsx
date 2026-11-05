import { useState } from 'react';
import type { ImageAsset } from '../../../application/domain/MediaAsset';
import { sourceSetsOf } from './imageSources';

interface ResponsiveImageProps {
  image: ImageAsset;
  /** As accurate as the layout allows: the browser picks the rendition from it. */
  sizes: string;
  alt?: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  isPriority?: boolean;
  onClick?: (event: React.MouseEvent<HTMLImageElement>) => void;
  /** Called once loaded or failed. */
  onSettled?: () => void;
}

export function ResponsiveImage({
  image,
  sizes,
  alt,
  className,
  loading = 'lazy',
  isPriority = false,
  onClick,
  onSettled,
}: ResponsiveImageProps) {
  // Dropped once loaded, so it cannot show through images with transparency.
  const [isLoaded, setIsLoaded] = useState(false);
  const sourceSets = sourceSetsOf(image);
  const fallback = sourceSets[sourceSets.length - 1];

  if (!fallback) {
    return null;
  }

  return (
    <picture className="contents">
      {sourceSets.slice(0, -1).map((sourceSet) => (
        <source key={sourceSet.format} type={sourceSet.type} srcSet={sourceSet.srcSet} sizes={sizes} />
      ))}
      <img
        srcSet={fallback.srcSet}
        sizes={sizes}
        width={image.width}
        height={image.height}
        alt={alt ?? image.alt ?? ''}
        loading={loading}
        // React 18 drops the camelCase prop but passes lower case attributes through.
        {...(isPriority ? { fetchpriority: 'high' } : {})}
        decoding="async"
        className={className}
        onClick={onClick}
        onLoad={() => {
          setIsLoaded(true);
          onSettled?.();
        }}
        onError={onSettled}
        style={
          image.placeholder && !isLoaded
            ? { backgroundImage: `url(${image.placeholder})`, backgroundSize: 'cover' }
            : undefined
        }
      />
    </picture>
  );
}
