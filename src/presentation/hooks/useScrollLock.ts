import { useEffect } from 'react';

/**
 * Stops the page behind a full-screen overlay from scrolling while locked.
 *
 * Restores whatever value was there before rather than clearing the property, so
 * two overlays closing in either order cannot leave the page unscrollable.
 */
export function useScrollLock(isLocked: boolean): void {
  useEffect(() => {
    if (!isLocked) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isLocked]);
}
