import type { WorkItem } from '../../../application/domain/WorkItem';
import type { IWorkItemCard } from './IWorkItemCard';

/**
 * Video work item card renderer
 * Displays video that plays on hover
 */
export class VideoItemCard implements IWorkItemCard {
  renderMedia(
    workItem: WorkItem,
    _isHovered: boolean,
    ref?: React.RefObject<HTMLVideoElement>
  ): JSX.Element {
    return (
      <video
        ref={ref}
        src={workItem.videoUrl}
        className="absolute inset-0 w-full h-full object-cover"
        loop
        muted
        playsInline
        preload="metadata"
      />
    );
  }

  onMouseEnter(_workItem: WorkItem, ref?: React.RefObject<HTMLVideoElement>): void {
    if (ref?.current) {
      ref.current.currentTime = 0;
      ref.current.play();
    }
  }

  onMouseLeave(_workItem: WorkItem, ref?: React.RefObject<HTMLVideoElement>): void {
    if (ref?.current) {
      ref.current.pause();
      ref.current.currentTime = 0;
    }
  }
}
