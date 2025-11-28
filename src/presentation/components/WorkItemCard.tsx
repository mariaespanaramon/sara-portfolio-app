import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { WorkItem } from '../../application/domain/WorkItem';

/**
 * Work item card component
 * Displays an interactive card with gif on hover
 */
interface WorkItemCardProps {
  item: WorkItem;
}

export function WorkItemCard({ item }: WorkItemCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const gifRef = useRef<HTMLImageElement>(null);
  const navigate = useNavigate();

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (gifRef.current) {
      // Restart the GIF by reloading the src
      const src = gifRef.current.src;
      gifRef.current.src = '';
      gifRef.current.src = src;
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleClick = () => {
    // Navigate to detail page based on title slug
    const slug = item.title.toLowerCase().replace(/\s+/g, '-');
    navigate(`/work/${slug}`);
  };

  return (
    <article
      className="relative aspect-[4/3] overflow-hidden bg-dark-surface cursor-pointer group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {/* Static image (visible when not hovering) */}
      <img
        src={item.imageUrl}
        alt={item.title}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
          isHovered ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {/* GIF (visible on hover) */}
      <img
        ref={gifRef}
        src={item.gifUrl}
        alt={item.title}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Overlay with title and tags (visible on hover) */}
      <div
        className={`absolute inset-0 bg-dark-bg/60 flex flex-col items-center justify-center transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Title in center */}
        <h3 className="font-title text-3xl md:text-4xl lg:text-5xl text-center px-6 mb-auto mt-auto">
          {item.title}
        </h3>

        {/* Tags at bottom */}
        <div className="flex flex-wrap gap-2 justify-center px-6 pb-8">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 text-xs font-light tracking-wide border border-dark-text-muted text-dark-text-secondary"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
