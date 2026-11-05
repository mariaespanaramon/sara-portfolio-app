import { useState } from 'react';
import type { ImageAsset } from '../../../application/domain/Media';
import { sourceSetsOf } from './imageSources';

interface ResponsiveImageProps {
  image: ImageAsset;
  /**
   * How wide the image renders, as a `sizes` attribute. The browser uses it to
   * pick the smallest rendition that stays sharp, so it should be as accurate as
   * the layout allows.
   */
  sizes: string;
  alt?: string;
  className?: string;
  /** Lazy unless the image is visible on first paint. */
  loading?: 'lazy' | 'eager';
  onClick?: (event: React.MouseEvent<HTMLImageElement>) => void;
}

/**
 * Renders an image in the most efficient format the browser supports, at the
 * smallest width that fills its slot.
 *
 * The intrinsic size is set upfront so the layout does not shift once it loads,
 * and the blurred placeholder fills the box until then.
 */
export function ResponsiveImage({
  image,
  sizes,
  alt,
  className,
  loading = 'lazy',
  onClick,
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
        decoding="async"
        className={className}
        onClick={onClick}
        onLoad={() => setIsLoaded(true)}
        style={
          image.placeholder && !isLoaded
            ? { backgroundImage: `url(${image.placeholder})`, backgroundSize: 'cover' }
            : undefined
        }
      />
    </picture>
  );
}
