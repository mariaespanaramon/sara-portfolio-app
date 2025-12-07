import type { WorkItem } from '../../../application/domain/WorkItem';

/**
 * Interface for work item card renderers
 * Allows different implementations for different work item types
 */
export interface IWorkItemCard {
  /**
   * Renders the media element for the card (video, image, etc.)
   * @param workItem - The work item to render
   * @param isHovered - Whether the card is currently hovered
   * @param ref - Optional ref for interactive elements (e.g., video controls)
   * @returns JSX element representing the media
   */
  renderMedia(workItem: WorkItem, isHovered: boolean, ref?: React.RefObject<any>): JSX.Element;

  /**
   * Handles mouse enter event for the card
   * @param workItem - The work item
   * @param ref - Optional ref for interactive elements
   */
  onMouseEnter?(workItem: WorkItem, ref?: React.RefObject<any>): void;

  /**
   * Handles mouse leave event for the card
   * @param workItem - The work item
   * @param ref - Optional ref for interactive elements
   */
  onMouseLeave?(workItem: WorkItem, ref?: React.RefObject<any>): void;
}
