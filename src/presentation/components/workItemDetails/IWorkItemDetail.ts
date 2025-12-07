import type { WorkItem } from '../../../application/domain/WorkItem';

/**
 * Interface for work item detail renderers
 * Allows different implementations for different work item types
 */
export interface IWorkItemDetail {
  /**
   * Renders the media section (video, image, etc.) for the work item
   * @param workItem - The work item to render
   * @returns JSX element representing the media
   */
  renderMedia(workItem: WorkItem): JSX.Element;
}
