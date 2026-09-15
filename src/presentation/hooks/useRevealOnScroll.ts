import { useEffect, useRef, useState } from 'react';

/** Share of the element that must be in view before it reveals. */
const REVEAL_THRESHOLD = 0.15;
/** Holds the reveal back until the element is a little inside the viewport. */
const REVEAL_ROOT_MARGIN = '0px 0px -10% 0px';

/**
 * Reveals an element the first time it scrolls into view.
 *
 * One-way on purpose: content does not hide again on the way back up, which would
 * be distracting when re-reading a page.
 */
export function useRevealOnScroll<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  // Visitors who asked for less motion start with everything already revealed.
  const [isVisible, setIsVisible] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    if (isVisible) {
      return undefined;
    }

    const element = ref.current;
    if (!element) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: REVEAL_THRESHOLD, rootMargin: REVEAL_ROOT_MARGIN }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [isVisible]);

  return { ref, isVisible };
}
