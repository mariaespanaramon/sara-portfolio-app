import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { WorkItem } from '../../application/domain/WorkItem';
import { WorkItemCardFactory } from './workItemCards/WorkItemCardFactory';

/**
 * Work item card component
 * Displays an interactive card with type-specific rendering behavior
 * On mobile: videos autoplay and overlay is always visible
 * On desktop: hover interactions trigger video playback and overlay
 */
interface WorkItemCardProps {
  item: WorkItem;
}

export function WorkItemCard({ item }: WorkItemCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const mediaRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();
  const renderer = WorkItemCardFactory.getRenderer(item.type);

  // Detect mobile devices
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-play video on mobile
  useEffect(() => {
    if (isMobile && item.type === 'video' && mediaRef.current) {
      mediaRef.current.play();
    }
  }, [isMobile, item.type]);

  const handleMouseEnter = () => {
    if (!isMobile) {
      setIsHovered(true);
      renderer.onMouseEnter?.(item, mediaRef);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setIsHovered(false);
      renderer.onMouseLeave?.(item, mediaRef);
    }
  };

  const handleClick = () => {
    // Navigate to detail page based on title slug
    const slug = item.title.toLowerCase().replace(/\s+/g, '-');
    navigate(`/work/${slug}`);
  };

  return (
    <article
      className="relative aspect-[16/9] overflow-hidden bg-dark-surface cursor-pointer group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {/* Media element - rendered by type-specific implementation */}
      {renderer.renderMedia(item, isHovered, mediaRef)}

      {/* Overlay with title and tags */}
      {/* Mobile: always visible | Desktop: visible on hover */}
      <div
        className={`absolute inset-0 bg-dark-bg/60 flex flex-col items-center justify-between py-8 transition-opacity duration-300 ${
          isMobile ? 'opacity-100' : isHovered ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Title in center */}
        <div className="flex-1 flex items-center justify-center">
          <h3 className="font-title text-3xl md:text-4xl lg:text-5xl text-center px-6">
            {item.title}
          </h3>
        </div>

        {/* Tags at bottom */}
        <div className="flex flex-wrap gap-2 justify-center px-6">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-2 text-sm font-bold tracking-wide text-dark-text-primary uppercase"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
