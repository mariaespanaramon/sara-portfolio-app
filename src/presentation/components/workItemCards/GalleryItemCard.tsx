import type { WorkItem } from '../../../application/domain/WorkItem';
import type { IWorkItemCard } from './IWorkItemCard';

/**
 * Gallery work item card renderer
 * Displays the first image of the gallery with zoom effect on hover
 */
export class GalleryItemCard implements IWorkItemCard {
  renderMedia(workItem: WorkItem, isHovered: boolean): JSX.Element {
    const firstImage = workItem.galleryImages?.[0];
    
    if (!firstImage) {
      return (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-dark-surface">
          <span className="text-dark-text-secondary">No images available</span>
        </div>
      );
    }

    return (
      <img
        src={firstImage}
        alt={workItem.title}
        className={`absolute inset-0 w-full h-full object-cover transition-transform duration-[3000ms] ease-out ${
          isHovered ? 'scale-110' : 'scale-100'
        }`}
      />
    );
  }

  // No special behavior needed for gallery cards on mouse enter/leave
  // The CSS transition handles the zoom effect
}
