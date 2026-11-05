import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Section } from '../../application/domain/Section';
import { useIsMobile } from '../hooks/useIsMobile';
import { ResponsiveImage } from './media/ResponsiveImage';
import { LoopVideo } from './media/LoopVideo';

/** Three columns from `md` up, one below. */
const SECTION_CARD_SIZES = '(min-width: 768px) 33vw, 100vw';

interface SectionCardProps {
  section: Section;
}

/**
 * Home page card for a portfolio section.
 *
 * Shows a still at rest and plays the hover loop while hovered. Unlike
 * the work item cards, the title is visible at all times rather than revealed by
 * an overlay.
 */
export function SectionCard({ section }: SectionCardProps) {
  const [isHovered, setIsHovered] = useState(false);
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
  };

  const handleMouseLeave = () => {
    if (!canPlayOnHover) {
      return;
    }

    setIsHovered(false);
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
      <ResponsiveImage
        image={section.cover}
        sizes={SECTION_CARD_SIZES}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Hover loop layered over the still. It downloads nothing until first hovered. */}
      {section.hover && (
        <LoopVideo
          loop={section.hover}
          isPlaying={isPlaying}
          showPoster={false}
          className={hoverMediaClassName}
        />
      )}

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
