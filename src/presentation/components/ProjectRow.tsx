import { useNavigate } from 'react-router-dom';
import type { WorkItem } from '../../application/domain/WorkItem';
import { toUrlId } from '../../application/domain/urlId';
import { stillOf } from '../../application/domain/Media';
import { ResponsiveImage } from './media/ResponsiveImage';
import { LoopVideo } from './media/LoopVideo';
import { previewLoopOf } from './media/previewLoop';
import { useInView } from '../hooks/useInView';

/** Half the container from `md` up, where media and text sit side by side. */
const ROW_MEDIA_SIZES = '(min-width: 768px) 50vw, 100vw';

interface ProjectRowProps {
  item: WorkItem;
  /** Position in the list. Decides which side the media sits on. */
  index: number;
}

/**
 * One project per row, with the media alternating between the left and right
 * side down the page and its title and description on the opposite side.
 */
export function ProjectRow({ item, index }: ProjectRowProps) {
  const navigate = useNavigate();
  const { ref: mediaRef, isInView } = useInView();
  const { cover } = item;
  const previewLoop = previewLoopOf(cover);
  // Even rows put the media on the left, odd rows on the right.
  const isReversed = index % 2 === 1;

  const goToProject = () => {
    navigate(`/work/${toUrlId(item.title)}`);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      goToProject();
    }
  };

  return (
    <article
      role="link"
      tabIndex={0}
      aria-label={item.title}
      className="group grid md:grid-cols-2 items-center gap-8 lg:gap-16 cursor-pointer"
      onClick={goToProject}
      onKeyDown={handleKeyDown}
    >
      {/* Media. On mobile it always comes first, whatever the row's parity. */}
      <div className={isReversed ? 'md:order-2' : 'md:order-1'}>
        <div ref={mediaRef} className="overflow-hidden bg-site-surface aspect-[4/3]">
          {/*
            Rows never play a video with sound: that happens on the project's own
            page. A loop cover, or a video's short muted preview, plays while the
            row is in view; everything else shows its still.
          */}
          {previewLoop ? (
            <LoopVideo
              loop={previewLoop}
              isPlaying={isInView}
              className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
            />
          ) : (
            <ResponsiveImage
              image={stillOf(cover)}
              sizes={ROW_MEDIA_SIZES}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
            />
          )}
        </div>
      </div>

      {/* Title and description, on the side opposite the media. */}
      <div className={isReversed ? 'md:order-1' : 'md:order-2'}>
        <div className="flex items-center gap-4 text-sm text-site-text-muted font-light tracking-widest uppercase mb-4">
          <span>{item.category}</span>
          <span>&bull;</span>
          <span>{item.year}</span>
        </div>

        <h3 className="font-title font-bold text-3xl lg:text-4xl tracking-tight leading-tight mb-4">
          {item.title}
        </h3>

        <p className="text-lg text-site-text-secondary font-light leading-relaxed whitespace-pre-line">
          {item.description}
        </p>
      </div>
    </article>
  );
}
