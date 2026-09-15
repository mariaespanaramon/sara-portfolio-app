import type { WorkItem } from '../../../application/domain/WorkItem';

/**
 * Interface for work item detail renderers
 * Allows different implementations for different work item types
 */
export interface IWorkItemDetail {
  /**
   * Renders the full-screen media at the top of the project page.
   * The returned element is expected to fill its container.
   * @param workItem - The work item to render
   * @returns JSX element representing the media
   */
  renderHeroMedia(workItem: WorkItem): JSX.Element;

  /**
   * Renders any further media revealed while scrolling past the text. The returned
   * element carries its own sizing, since what fits varies by type.
   * @param workItem - The work item to render
   * @returns JSX element, or null when the hero already shows everything
   */
  renderBodyMedia(workItem: WorkItem): JSX.Element | null;
}
