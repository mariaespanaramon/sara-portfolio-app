import { useEffect, useRef, useState } from 'react';
import type { VideoAsset } from '../../../application/domain/Media';
import { pickSource } from './imageSources';

/** Players usually fill most of the screen, so the poster is taken large. */
const POSTER_MIN_WIDTH = 1600;

const HLS_MIME_TYPE = 'application/vnd.apple.mpegurl';

interface VideoPlayerProps {
  video: VideoAsset;
  className?: string;
}

type Teardown = () => void;

/**
 * Connects the element to the video's stream and starts playback.
 *
 * Safari plays HLS natively. Other browsers get hls.js, imported only now: it is
 * a sizeable library, and most visits never press play. Progressive files such
 * as the mocks' MP4s are set directly.
 */
async function startPlayback(element: HTMLVideoElement, url: string): Promise<Teardown> {
  const isStream = url.endsWith('.m3u8');

  if (!isStream || element.canPlayType(HLS_MIME_TYPE)) {
    element.src = url;
    await element.play().catch(() => {});
    return () => {};
  }

  const { default: Hls } = await import('hls.js/light');

  if (!Hls.isSupported()) {
    element.src = url;
    await element.play().catch(() => {});
    return () => {};
  }

  // Never fetch a rendition larger than the player shows.
  const hls = new Hls({ capLevelToPlayerSize: true });
  hls.on(Hls.Events.MANIFEST_PARSED, () => {
    element.play().catch(() => {});
  });
  hls.loadSource(url);
  hls.attachMedia(element);

  return () => hls.destroy();
}

/**
 * A video with native controls.
 *
 * Until the visitor presses play, only the poster loads: there is no source on
 * the element at all, which also keeps every browser from preloading. A play
 * button of its own stands in for the native one meanwhile, since browsers
 * disagree on how controls behave on an element without a source.
 */
export function VideoPlayer({ video, className }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const teardownRef = useRef<Teardown>();
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    return () => teardownRef.current?.();
  }, []);

  const handlePlay = async () => {
    const element = videoRef.current;
    if (!element || hasStarted) {
      return;
    }

    setHasStarted(true);
    teardownRef.current = await startPlayback(element, video.url);
  };

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        poster={pickSource(video.poster, POSTER_MIN_WIDTH)?.url}
        width={video.width}
        height={video.height}
        className={className}
        controls={hasStarted}
        controlsList="nodownload"
        playsInline
        preload="none"
      />

      {!hasStarted && (
        <button
          type="button"
          onClick={handlePlay}
          className="absolute inset-0 flex items-center justify-center group/play"
          aria-label="Play video"
        >
          <span className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-site-bg/85 flex items-center justify-center transition-transform group-hover/play:scale-110">
            <svg viewBox="0 0 24 24" className="w-7 h-7 md:w-8 md:h-8 ml-1 fill-site-text-primary" aria-hidden="true">
              <path d="M8 5.5v13l11-6.5z" />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
}
