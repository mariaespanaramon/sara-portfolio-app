import { useState, useEffect } from 'react';
import type { SiteMedia } from '../domain/SiteMedia';
import type { SiteMediaRepository } from '../../infrastructure/ports/repositories';

/**
 * Custom hook for the site's own media: the hero image and the intro animation.
 * `siteMedia` is null while loading; on failure it settles on no media, since
 * the site works without them.
 */
export function useSiteMedia(repository: SiteMediaRepository) {
  const [siteMedia, setSiteMedia] = useState<SiteMedia | null>(null);

  useEffect(() => {
    let isMounted = true;

    repository
      .get()
      .then((media) => {
        if (isMounted) setSiteMedia(media);
      })
      .catch((err) => {
        // Visitors get the page without these; the details are for whoever debugs it.
        console.error(err);
        if (isMounted) setSiteMedia({});
      });

    return () => {
      isMounted = false;
    };
  }, [repository]);

  return { siteMedia, loading: siteMedia === null };
}
