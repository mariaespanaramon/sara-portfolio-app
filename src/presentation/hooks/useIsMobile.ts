import { useState, useEffect } from 'react';

/** Tailwind's `md` breakpoint, where hover interactions start being available. */
const MOBILE_BREAKPOINT = 768;

/**
 * Tracks whether the viewport is narrower than the `md` breakpoint.
 *
 * Hover has no touch equivalent, so components that reveal something on hover
 * use this to fall back to a state that is visible without a pointer.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}
