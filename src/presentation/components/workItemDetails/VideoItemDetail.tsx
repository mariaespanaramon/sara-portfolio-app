import type { WorkItem } from '../../../application/domain/WorkItem';
import type { IWorkItemDetail } from './IWorkItemDetail';

/**
 * Video work item detail renderer
 * Displays video with controls
 */
export class VideoItemDetail implements IWorkItemDetail {
  renderMedia(workItem: WorkItem): JSX.Element {
    return (
      <video
        src={workItem.videoUrl}
        poster={workItem.imageUrl || undefined}
        controls
        controlsList="nodownload"
        loop
        muted
        playsInline
        className="w-full h-full object-cover"
      />
    );
  }
}
