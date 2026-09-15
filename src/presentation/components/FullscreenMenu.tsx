import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useScrollLock } from '../hooks/useScrollLock';
import { useIsMobile } from '../hooks/useIsMobile';

/** Same targets as the inline header links, which desktop keeps using. */
const MENU_LINKS = [
  { href: '#work', label: 'work' },
  { href: '#about', label: 'about' },
  { href: '#contact', label: 'contact' },
];

export const FULLSCREEN_MENU_ID = 'fullscreen-menu';

interface FullscreenMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Full-screen navigation for narrow viewports, where the inline header links do
 * not fit.
 *
 * Rendered as a sibling of the header rather than inside it: the header is a
 * stacking context and carries a blend mode, so an overlay nested in it would be
 * painted over its own logo and inverted along with it.
 *
 * Sits at z-40, below the header's z-50, which is what keeps the logo and the
 * close control visible on top of it.
 */
export function FullscreenMenu({ isOpen, onClose }: FullscreenMenuProps) {
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const location = useLocation();
  const isMobile = useIsMobile();

  useScrollLock(isOpen);

  // The overlay is hidden from `md` up, so a viewport growing past that point
  // would otherwise leave it invisibly open with the page still locked.
  useEffect(() => {
    if (!isMobile && isOpen) {
      onClose();
    }
  }, [isMobile, isOpen, onClose]);

  // Close when the route changes underneath it. Relies on onClose being stable,
  // which is why App memoises it.
  useEffect(() => {
    onClose();
  }, [location.pathname, onClose]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Move focus into the menu so keyboard navigation continues inside it.
  useEffect(() => {
    if (isOpen) {
      firstLinkRef.current?.focus();
    }
  }, [isOpen]);

  return (
    <div
      id={FULLSCREEN_MENU_ID}
      aria-hidden={!isOpen}
      className={`md:hidden fixed inset-0 z-40 flex items-center justify-center bg-site-bg transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <nav className="flex flex-col items-center gap-6">
        {MENU_LINKS.map((link, index) => (
          <a
            key={link.href}
            ref={index === 0 ? firstLinkRef : undefined}
            href={link.href}
            onClick={onClose}
            // Unreachable by tab while closed, since the overlay stays mounted.
            tabIndex={isOpen ? 0 : -1}
            className="font-title font-bold text-[10vw] leading-none hover:opacity-60 transition-opacity"
          >
            {link.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
