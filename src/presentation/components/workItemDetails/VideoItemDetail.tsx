import type { WorkItem } from '../../../application/domain/WorkItem';
import type { IWorkItemDetail } from './IWorkItemDetail';

/**
 * Video work item detail renderer
 * Displays video with controls
 */
export class VideoItemDetail implements IWorkItemDetail {
  renderHeroMedia(workItem: WorkItem): JSX.Element {
    return (
      <video
        src={workItem.videoUrl}
        poster={workItem.imageUrl || undefined}
        controls
        controlsList="nodownload"
        playsInline
        preload="metadata"
        className="w-full h-full object-cover"
      />
    );
  }

  renderBodyMedia(workItem: WorkItem): JSX.Element | null {
    // No still here: the poster already stands in for the video until it plays.
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
