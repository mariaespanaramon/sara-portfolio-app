import { useEffect, useState } from 'react';
import { stillOf, type MediaAsset } from '../../application/domain/MediaAsset';
import { MediaView } from './media/MediaView';
import { ResponsiveImage } from './media/ResponsiveImage';
import { useScrollLock } from '../hooks/useScrollLock';

const GALLERY_SIZES = '(min-width: 896px) 896px, 100vw';
const FULLSCREEN_SIZES = '90vw';

interface MediaGalleryProps {
  media: MediaAsset[];
  title: string;
}

/** Neighbouring slides are mounted hidden, as stills, so the next slide is instant and nothing plays out of sight. */
export function MediaGallery({ media, title }: MediaGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useScrollLock(isFullscreen);

  const count = media.length;
  const previousIndex = (currentIndex - 1 + count) % count;
  const nextIndex = (currentIndex + 1) % count;
  const mountedIndexes = new Set([previousIndex, currentIndex, nextIndex]);
  const current = media[currentIndex];

  const goToPrevious = () => setCurrentIndex(previousIndex);
  const goToNext = () => setCurrentIndex(nextIndex);
  const toggleFullscreen = () => setIsFullscreen((open) => !open);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFullscreen) return;

      if (e.key === 'ArrowLeft') {
        setCurrentIndex((index) => (index - 1 + count) % count);
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex((index) => (index + 1) % count);
      } else if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, count]);

  const pieceLabel = (index: number) => `${title} - ${index + 1} of ${count}`;

  return (
    <>
      {/* Main Carousel */}
      <div className="relative w-full h-full group">
        {media.map((piece, index) => {
          if (!mountedIndexes.has(index)) {
            return null;
          }

          const isCurrent = index === currentIndex;
          const zoomsOnClick = piece.kind !== 'video';

          return (
            <div
              key={index}
              className={`absolute inset-0 ${isCurrent ? '' : 'invisible'} ${
                zoomsOnClick ? 'cursor-zoom-in' : ''
              }`}
              aria-hidden={!isCurrent}
              onClick={zoomsOnClick ? toggleFullscreen : undefined}
            >
              {isCurrent ? (
                <MediaView
                  asset={piece}
                  sizes={GALLERY_SIZES}
                  alt={pieceLabel(index)}
                  loading="eager"
                  className="w-full h-full object-cover"
                />
              ) : (
                <ResponsiveImage
                  image={stillOf(piece)}
                  sizes={GALLERY_SIZES}
                  loading="eager"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          );
        })}

        {/* Navigation Arrows */}
        {count > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-site-bg/80 hover:bg-site-bg/90 text-site-text-primary transition-all opacity-0 group-hover:opacity-100"
              aria-label="Previous"
            >
              <span className="text-2xl">‹</span>
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-site-bg/80 hover:bg-site-bg/90 text-site-text-primary transition-all opacity-0 group-hover:opacity-100"
              aria-label="Next"
            >
              <span className="text-2xl">›</span>
            </button>
          </>
        )}

        {/* Along the top edge, clear of a video's own controls. */}

        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-site-bg/80 hover:bg-site-bg/90 text-site-text-primary transition-all opacity-0 group-hover:opacity-100"
          aria-label="View fullscreen"
          title="View fullscreen"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
            />
          </svg>
        </button>

        {/* Counter */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-site-bg/80 text-site-text-primary text-sm font-light tracking-wide">
          {currentIndex + 1} / {count}
        </div>

        {/* Dot Indicators */}
        {count > 1 && count <= 10 && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 flex gap-2">
            {media.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-site-text-primary w-6'
                    : 'bg-site-text-secondary hover:bg-site-text-muted'
                }`}
                aria-label={`Go to ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          onClick={toggleFullscreen}
        >
          {/* Close Button */}
          <button
            onClick={toggleFullscreen}
            className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-all z-10"
            aria-label="Close fullscreen"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Fullscreen Media */}
          <div onClick={(e) => e.stopPropagation()} className="flex items-center justify-center">
            <MediaView
              key={currentIndex}
              asset={current}
              sizes={FULLSCREEN_SIZES}
              alt={pieceLabel(currentIndex)}
              loading="eager"
              className="max-w-[90vw] max-h-[90vh] w-auto h-auto object-contain"
            />
          </div>

          {/* Navigation Arrows in Fullscreen */}
          {count > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
                className="absolute left-6 top-1/2 -translate-y-1/2 w-14 h-14 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-all"
                aria-label="Previous"
              >
                <span className="text-3xl">‹</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                className="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-all"
                aria-label="Next"
              >
                <span className="text-3xl">›</span>
              </button>
            </>
          )}

          {/* Counter in Fullscreen */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-white/10 text-white text-base font-light tracking-wide">
            {currentIndex + 1} / {count}
          </div>

          {/* Dot Indicators in Fullscreen */}
          {count > 1 && count <= 10 && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-3">
              {media.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(index);
                  }}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    index === currentIndex ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/75'
                  }`}
                  aria-label={`Go to ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
