import type { WorkItem } from '../../../application/domain/WorkItem';
import type { IWorkItemCard } from './IWorkItemCard';

/**
 * Image work item card renderer
 * Displays image with zoom effect on hover
 */
export class ImageItemCard implements IWorkItemCard {
  renderMedia(workItem: WorkItem, isHovered: boolean): JSX.Element {
    return (
      <img
        src={workItem.imageUrl}
        alt={workItem.title}
        className={`absolute inset-0 w-full h-full object-cover transition-transform duration-[3000ms] ease-out ${
          isHovered ? 'scale-110' : 'scale-100'
        }`}
      />
    );
  }

  // No special behavior needed for image cards on mouse enter/leave
  // The CSS transition handles the zoom effect
}
