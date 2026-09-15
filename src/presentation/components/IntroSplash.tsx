import { useEffect, useState } from 'react';

// TODO: replace with the final logo gif served from /public
const INTRO_GIF_URL = 'https://media.giphy.com/media/3o6nVbF4uoHsV6Vqne/giphy.gif';

/** How long the logo stays on screen once the gif is ready. */
const HOLD_MS = 2500;
/** Duration of the fade out. Shared with the inline transition below. */
const FADE_MS = 500;
/** Upper bound on waiting for the gif, so a slow CDN cannot stall the splash. */
const MAX_LOAD_WAIT_MS = 3000;

const SESSION_KEY = 'sara-intro-seen';

type Phase = 'visible' | 'fading' | 'done';

/**
 * Decides whether the intro should be skipped entirely.
 * Evaluated once on mount: neither the session flag nor the motion preference
 * can meaningfully change while the splash is on screen.
 */
function shouldSkipIntro(): boolean {
  try {
    if (window.sessionStorage.getItem(SESSION_KEY)) {
      return true;
    }
  } catch {
    // Session storage can throw in private browsing modes. Fall through: the
    // worst case is that the intro plays again on the next page load.
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Full-screen animated logo shown on the first visit of a browser session.
 * Fades out on its own, and can be dismissed early with a click or a key press.
 */
export function IntroSplash() {
  const [skipped] = useState(shouldSkipIntro);
  const [phase, setPhase] = useState<Phase>('visible');
  const [isGifReady, setIsGifReady] = useState(false);

  const isOnScreen = !skipped && phase !== 'done';

  // Flag the session as soon as the intro starts, so reloading mid-animation
  // does not replay it.
  useEffect(() => {
    if (skipped) {
      return;
    }

    try {
      window.sessionStorage.setItem(SESSION_KEY, 'true');
    } catch {
      // Non-fatal, see shouldSkipIntro.
    }
  }, [skipped]);

  // Give up waiting for the gif after MAX_LOAD_WAIT_MS.
  useEffect(() => {
    if (skipped || isGifReady) {
      return undefined;
    }

    const timer = window.setTimeout(() => setIsGifReady(true), MAX_LOAD_WAIT_MS);
    return () => window.clearTimeout(timer);
  }, [skipped, isGifReady]);

  // Hold the logo, then start fading.
  useEffect(() => {
    if (skipped || !isGifReady || phase !== 'visible') {
      return undefined;
    }

    const timer = window.setTimeout(() => setPhase('fading'), HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [skipped, isGifReady, phase]);

  // Unmount once the fade is over.
  useEffect(() => {
    if (phase !== 'fading') {
      return undefined;
    }

    const timer = window.setTimeout(() => setPhase('done'), FADE_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  // Let the visitor skip ahead.
  useEffect(() => {
    if (skipped || phase !== 'visible') {
      return undefined;
    }

    const dismiss = () => setPhase('fading');

    window.addEventListener('keydown', dismiss);
    window.addEventListener('pointerdown', dismiss);

    return () => {
      window.removeEventListener('keydown', dismiss);
      window.removeEventListener('pointerdown', dismiss);
    };
  }, [skipped, phase]);

  // Prevent scrolling behind the overlay.
  useEffect(() => {
    if (!isOnScreen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOnScreen]);

  if (!isOnScreen) {
    return null;
  }

  return (
    <div
      // Decorative: the brand name is already available as text in the header,
      // and this overlay dismisses itself.
      aria-hidden="true"
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-site-bg transition-opacity ease-out ${
        phase === 'fading' ? 'opacity-0' : 'opacity-100'
      }`}
      // Inline so the fade always matches FADE_MS, which also drives the timer.
      style={{ transitionDuration: `${FADE_MS}ms` }}
    >
      <img
        src={INTRO_GIF_URL}
        alt=""
        className="max-h-[70vh] max-w-[70vw] object-contain"
        onLoad={() => setIsGifReady(true)}
        onError={() => setIsGifReady(true)}
      />
    </div>
  );
}
