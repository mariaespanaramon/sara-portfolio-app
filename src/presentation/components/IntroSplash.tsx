import { useEffect, useState } from 'react';
import type { SiteMediaRepository } from '../../infrastructure/ports/repositories';
import { useSiteMedia } from '../../application/service/useSiteMedia';
import { useScrollLock } from '../hooks/useScrollLock';
import { ResponsiveImage } from './media/ResponsiveImage';

/** The animation is centred and capped at 70% of the viewport either way. */
const INTRO_SIZES = '70vw';

/** How long the logo stays on screen once the animation is ready. */
const HOLD_MS = 2500;
/** Duration of the fade out. Shared with the inline transition below. */
const FADE_MS = 500;
/** Upper bound on waiting for the animation, so a slow network cannot stall the splash. */
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
interface IntroSplashProps {
  repository: SiteMediaRepository;
}

export function IntroSplash({ repository }: IntroSplashProps) {
  const [skipped] = useState(shouldSkipIntro);
  const [phase, setPhase] = useState<Phase>('visible');
  const [isIntroReady, setIsIntroReady] = useState(false);
  const { siteMedia, loading } = useSiteMedia(repository);
  const intro = siteMedia?.intro;

  // A site without an intro animation simply has no splash.
  const hasNoIntro = !loading && !intro;
  const isOnScreen = !skipped && !hasNoIntro && phase !== 'done';

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

  // Give up waiting for the animation after MAX_LOAD_WAIT_MS.
  useEffect(() => {
    if (skipped || isIntroReady) {
      return undefined;
    }

    const timer = window.setTimeout(() => setIsIntroReady(true), MAX_LOAD_WAIT_MS);
    return () => window.clearTimeout(timer);
  }, [skipped, isIntroReady]);

  // Hold the logo, then start fading.
  useEffect(() => {
    if (skipped || !isIntroReady || phase !== 'visible') {
      return undefined;
    }

    const timer = window.setTimeout(() => setPhase('fading'), HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [skipped, isIntroReady, phase]);

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

  useScrollLock(isOnScreen);

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
      {intro?.kind === 'loop' && (
        <video
          src={intro.url}
          width={intro.width}
          height={intro.height}
          className="max-h-[70vh] max-w-[70vw] w-auto h-auto object-contain"
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={() => setIsIntroReady(true)}
          onError={() => setIsIntroReady(true)}
        />
      )}
      {intro?.kind === 'image' && (
        <ResponsiveImage
          image={intro}
          sizes={INTRO_SIZES}
          loading="eager"
          isPriority
          className="max-h-[70vh] max-w-[70vw] w-auto h-auto object-contain"
          onSettled={() => setIsIntroReady(true)}
        />
      )}
    </div>
  );
}
