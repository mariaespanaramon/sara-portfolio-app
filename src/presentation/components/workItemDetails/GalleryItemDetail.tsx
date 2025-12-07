import { useState, useEffect } from 'react';
import type { WorkItem } from '../../../application/domain/WorkItem';
import type { IWorkItemDetail } from './IWorkItemDetail';

/**
 * Gallery work item detail renderer
 * Displays an image carousel with navigation controls and fullscreen support
 */
export class GalleryItemDetail implements IWorkItemDetail {
  renderMedia(workItem: WorkItem): JSX.Element {
    const images = workItem.galleryImages || [];
    
    if (images.length === 0) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-dark-surface">
          <span className="text-dark-text-secondary">No images available</span>
        </div>
      );
    }

    return <ImageCarousel images={images} title={workItem.title} />;
  }
}

/**
 * Image carousel component for gallery display with fullscreen support
 */
function ImageCarousel({ images, title }: { images: string[]; title: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set([0]));

  // Preload adjacent images for faster navigation
  useEffect(() => {
    const imagesToLoad = [
      currentIndex,
      currentIndex === 0 ? images.length - 1 : currentIndex - 1,
      currentIndex === images.length - 1 ? 0 : currentIndex + 1,
    ];

    imagesToLoad.forEach((index) => {
      if (!loadedImages.has(index)) {
        const img = new Image();
        img.src = images[index];
        img.onload = () => {
          setLoadedImages((prev) => new Set(prev).add(index));
        };
      }
    });
  }, [currentIndex, images, loadedImages]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFullscreen) return;
      
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, currentIndex]);

  // Prevent body scroll when fullscreen is active
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <>
      {/* Main Carousel */}
      <div className="relative w-full h-full group">
        {/* Current Image */}
        <img
          src={images[currentIndex]}
          alt={`${title} - Image ${currentIndex + 1}`}
          className="w-full h-full object-cover cursor-zoom-in"
          onClick={toggleFullscreen}
          loading="eager"
        />

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-dark-bg/80 hover:bg-dark-bg/90 text-dark-text-primary transition-all opacity-0 group-hover:opacity-100"
              aria-label="Previous image"
            >
              <span className="text-2xl">‹</span>
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-dark-bg/80 hover:bg-dark-bg/90 text-dark-text-primary transition-all opacity-0 group-hover:opacity-100"
              aria-label="Next image"
            >
              <span className="text-2xl">›</span>
            </button>
          </>
        )}

        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          className="absolute bottom-4 right-4 w-10 h-10 flex items-center justify-center bg-dark-bg/80 hover:bg-dark-bg/90 text-dark-text-primary transition-all opacity-0 group-hover:opacity-100"
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

        {/* Image Counter */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-dark-bg/80 text-dark-text-primary text-sm font-light tracking-wide">
          {currentIndex + 1} / {images.length}
        </div>

        {/* Dot Indicators */}
        {images.length > 1 && images.length <= 10 && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-dark-text-primary w-6'
                    : 'bg-dark-text-secondary hover:bg-dark-text-muted'
                }`}
                aria-label={`Go to image ${index + 1}`}
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

          {/* Fullscreen Image */}
          <img
            src={images[currentIndex]}
            alt={`${title} - Image ${currentIndex + 1}`}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
            loading="eager"
          />

          {/* Navigation Arrows in Fullscreen */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
                className="absolute left-6 top-1/2 -translate-y-1/2 w-14 h-14 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-all"
                aria-label="Previous image"
              >
                <span className="text-3xl">‹</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                className="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-all"
                aria-label="Next image"
              >
                <span className="text-3xl">›</span>
              </button>
            </>
          )}

          {/* Image Counter in Fullscreen */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-white/10 text-white text-base font-light tracking-wide">
            {currentIndex + 1} / {images.length}
          </div>

          {/* Dot Indicators in Fullscreen */}
          {images.length > 1 && images.length <= 10 && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-3">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    goToSlide(index);
                  }}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    index === currentIndex
                      ? 'bg-white w-8'
                      : 'bg-white/50 hover:bg-white/75'
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
