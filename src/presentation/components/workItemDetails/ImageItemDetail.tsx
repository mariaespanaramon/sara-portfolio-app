import type { WorkItem } from '../../../application/domain/WorkItem';
import type { IWorkItemDetail } from './IWorkItemDetail';

/**
 * Image work item detail renderer
 * Displays static image
 */
export class ImageItemDetail implements IWorkItemDetail {
  renderHeroMedia(workItem: WorkItem): JSX.Element {
    return (
      <img
        src={workItem.imageUrl}
        alt={workItem.title}
        className="w-full h-full object-cover"
      />
    );
  }

  renderBodyMedia(workItem: WorkItem): JSX.Element | null {
    // 3D work carries an animated version of the still shown in the hero.
    if (!workItem.gifUrl) {
      return null;
    }

    return (
      <img
        src={workItem.gifUrl}
        alt={workItem.title}
        className="w-full border border-site-border"
      />
    );
  }
}
