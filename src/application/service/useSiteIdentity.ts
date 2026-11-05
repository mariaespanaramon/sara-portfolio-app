import { useState, useEffect } from 'react';
import type { SiteIdentity } from '../domain/SiteIdentity';
import type { SiteIdentityRepository } from '../../infrastructure/ports/repositories';

/** On failure it settles on no media: the site works without them. */
export function useSiteIdentity(repository: SiteIdentityRepository) {
  const [siteIdentity, setSiteIdentity] = useState<SiteIdentity | null>(null);

  useEffect(() => {
    let isMounted = true;

    repository
      .get()
      .then((media) => {
        if (isMounted) setSiteIdentity(media);
      })
      .catch((err) => {
        console.error(err);
        if (isMounted) setSiteIdentity({});
      });

    return () => {
      isMounted = false;
    };
  }, [repository]);

  return { siteIdentity, loading: siteIdentity === null };
}
