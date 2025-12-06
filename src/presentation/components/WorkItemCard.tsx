import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { WorkItem } from '../../application/domain/WorkItem';

/**
 * Work item card component
 * Displays an interactive card with looping video on hover
 */
interface WorkItemCardProps {
  item: WorkItem;
}

export function WorkItemCard({ item }: WorkItemCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
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
      {/* Video element - browser generates thumbnail from first frame */}
      <video
        ref={videoRef}
        src={item.videoUrl}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-100'
        }`}
        loop
        muted
        playsInline
        preload="metadata"
      />

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
