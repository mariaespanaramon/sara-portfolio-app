import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Section } from '../../application/domain/Section';
import { useIsMobile } from '../hooks/useIsMobile';

interface SectionCardProps {
  section: Section;
}

/**
 * Home page card for a portfolio section.
 *
 * Shows a still at rest and plays the cover video (or gif) while hovered. Unlike
 * the work item cards, the title is visible at all times rather than revealed by
 * an overlay.
 */
export function SectionCard({ section }: SectionCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  // The cover gif is only mounted after the first hover: gifs cannot be told to
  // preload lazily, and mounting it upfront would download the whole file on
  // every home page visit. Once mounted it stays, so later hovers are instant.
  const [hasHovered, setHasHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Touch devices never hover, so they keep the still image.
  const canPlayOnHover = !isMobile;
  const isPlaying = canPlayOnHover && isHovered;

  const handleMouseEnter = () => {
    if (!canPlayOnHover) {
      return;
    }

    setIsHovered(true);
    setHasHovered(true);

    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      // Rejects when the browser refuses playback; there is nothing to recover.
      video.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    if (!canPlayOnHover) {
      return;
    }

    setIsHovered(false);

    const video = videoRef.current;
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
  };

  const goToSection = () => {
    navigate(`/section/${section.id}`);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      goToSection();
    }
  };

  const hoverMediaClassName = `absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
    isPlaying ? 'opacity-100' : 'opacity-0'
  }`;

  return (
    <article
      role="link"
      tabIndex={0}
      aria-label={section.title}
      className="relative aspect-[8/9] overflow-hidden bg-site-surface cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={goToSection}
      onKeyDown={handleKeyDown}
    >
      <img
        src={section.coverImageUrl}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Hover media layered over the still. A video takes precedence over a gif. */}
      {section.coverVideoUrl ? (
        <video
          ref={videoRef}
          src={section.coverVideoUrl}
          className={hoverMediaClassName}
          loop
          muted
          playsInline
          preload="metadata"
        />
      ) : section.coverGifUrl && hasHovered ? (
        <img src={section.coverGifUrl} alt="" className={hoverMediaClassName} />
      ) : null}

      {/* Title, always visible and centred both ways. A flat scrim replaces the
          former bottom gradient: a gradient only helps text anchored to an edge,
          and this keeps white legible over covers with bright areas. */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/25 px-6">
        <h3 className="font-title font-bold text-2xl md:text-3xl text-center text-white">
          {section.title}
        </h3>
      </div>
    </article>
  );
}
