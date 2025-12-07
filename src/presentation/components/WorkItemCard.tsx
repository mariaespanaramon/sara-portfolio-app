import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { WorkItem } from '../../application/domain/WorkItem';
import { WorkItemCardFactory } from './workItemCards/WorkItemCardFactory';

/**
 * Work item card component
 * Displays an interactive card with type-specific rendering behavior
 */
interface WorkItemCardProps {
  item: WorkItem;
}

export function WorkItemCard({ item }: WorkItemCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const mediaRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();
  const renderer = WorkItemCardFactory.getRenderer(item.type);

  const handleMouseEnter = () => {
    setIsHovered(true);
    renderer.onMouseEnter?.(item, mediaRef);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    renderer.onMouseLeave?.(item, mediaRef);
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

      {/* Overlay with title and tags (visible on hover) */}
      <div
        className={`absolute inset-0 bg-dark-bg/60 flex flex-col items-center justify-between py-8 transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
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
