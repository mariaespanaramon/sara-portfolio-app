import type { ReactNode } from 'react';
import { useRevealOnScroll } from '../hooks/useRevealOnScroll';

interface RevealOnScrollProps {
  children: ReactNode;
  className?: string;
}

/**
 * Fades and lifts its children into place the first time they scroll into view.
 */
export function RevealOnScroll({ children, className = '' }: RevealOnScrollProps) {
  const { ref, isVisible } = useRevealOnScroll<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } ${className}`}
    >
      {children}
    </div>
  );
}
