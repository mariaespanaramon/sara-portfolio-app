import type { WorkItem } from '../../../application/domain/WorkItem';
import type { IWorkItemDetail } from './IWorkItemDetail';

/**
 * Image work item detail renderer
 * Displays static image
 */
export class ImageItemDetail implements IWorkItemDetail {
  renderMedia(workItem: WorkItem): JSX.Element {
    return (
      <img
        src={workItem.imageUrl}
        alt={workItem.title}
        className="w-full h-full object-cover"
      />
    );
  }
}
