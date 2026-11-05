import { useEffect, useRef, useState } from 'react';

/** Unlike useRevealOnScroll, goes both ways, so clips stop when out of sight. */
export function useInView<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return undefined;
    }

    const observer = new IntersectionObserver((entries) => {
      setIsInView(entries.some((entry) => entry.isIntersecting));
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return { ref, isInView };
}
